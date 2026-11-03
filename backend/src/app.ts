import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import express, { type Request, type Response } from 'express'
import { manifestHashes, MODEL_MANIFEST, POLICY_MANIFEST, REVIEW_POLICY_MANIFEST } from '@verimod/protocol/manifests'
import { openDatabase } from './database.js'
import {
  type InferenceAdapter,
  type PolicyEvaluator,
  unavailableInferenceAdapter,
  unavailablePolicyEvaluator,
} from './inference.js'
import { IdempotencyConflictError, IdempotencyInProgressError, IssuanceService } from './issuance.js'
import {
  EmptyEpochError,
  EpochNotFoundError,
  EpochService,
  EpochStateError,
  FreezeIdempotencyConflictError,
} from './epochs.js'
import { acceptSignedTransaction, markBroadcast, nextSigningJob, type AutoAnchorConfig, workerAuthorized } from './autoAnchor.js'

export interface AppOptions {
  database?: DatabaseSync
  inference?: InferenceAdapter
  policy?: PolicyEvaluator
  modelManifest?: unknown
  now?: () => Date
  autoAnchor?: AutoAnchorConfig | null
  confirmationProgress?: (txHash: string) => Promise<number>
}

type DemoRole = 'DEMO_OPERATOR' | 'DEMO_REVIEWER' | 'DEMO_USER'

function sendError(res: Response, status: number, code: string, retryable = false) {
  return res.status(status).json({ ok: false, request_id: res.locals.requestId as string, error: { code, retryable } })
}

function principal(req: Request, res: Response, expectedRole: DemoRole): string | null {
  const value = req.header('x-demo-principal')?.trim()
  if (!value || req.header('x-demo-role') !== expectedRole) {
    sendError(res, 403, 'FORBIDDEN')
    return null
  }
  return value
}

function idempotencyKey(req: Request, res: Response): string | null {
  const value = req.header('Idempotency-Key')?.trim()
  if (!value) {
    sendError(res, 400, 'INVALID_INPUT')
    return null
  }
  return value
}

function decisionInput(value: unknown): { text: string } | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (Object.keys(record).length !== 1 || typeof record.text !== 'string' || record.text.length === 0) return null
  return { text: record.text }
}

export function createApp(options: AppOptions = {}) {
  const database = options.database ?? openDatabase()
  const issuance = new IssuanceService(
    database,
    options.inference ?? unavailableInferenceAdapter,
    options.policy ?? unavailablePolicyEvaluator,
    options.now,
    options.modelManifest,
  )
  const epochs = new EpochService(database, options.now)
  const autoAnchor = options.autoAnchor ?? null
  const app = express()
  app.use((_req, res, next) => {
    res.locals.requestId = randomUUID()
    next()
  })
  app.use(express.json({ limit: '64kb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'verimod-backend' })
  })

  function worker(req: Request, res: Response) {
    if (!workerAuthorized(req.header('authorization')?.replace(/^Bearer /, ''), autoAnchor)) { sendError(res, 403, 'FORBIDDEN'); return false }
    return true
  }
  app.get('/api/auto-anchor/next', (req, res) => {
    if (!worker(req, res)) return
    res.json({ ok: true, request_id: res.locals.requestId as string, data: nextSigningJob(database) })
  })
  app.post('/api/auto-anchor/signed', (req, res) => {
    if (!worker(req, res)) return
    const body = req.body as { epochId?: unknown; rawTransaction?: unknown }
    if (typeof body?.epochId !== 'string' || typeof body.rawTransaction !== 'string') return void sendError(res, 400, 'INVALID_INPUT')
    try { res.json({ ok: true, request_id: res.locals.requestId as string, data: acceptSignedTransaction(database, autoAnchor!, body.epochId, body.rawTransaction) }) }
    catch { sendError(res, 409, 'DURABLE_ACK_REJECTED') }
  })
  app.post('/api/auto-anchor/broadcast', (req, res) => {
    if (!worker(req, res)) return
    const body = req.body as { epochId?: unknown; txHash?: unknown }
    if (typeof body?.epochId !== 'string' || typeof body.txHash !== 'string') return void sendError(res, 400, 'INVALID_INPUT')
    try { const { signed_tx: _secret, ...epoch } = markBroadcast(database, body.epochId, body.txHash); res.json({ ok: true, request_id: res.locals.requestId as string, data: epoch }) }
    catch { sendError(res, 409, 'BROADCAST_REJECTED') }
  })
  app.post('/api/auto-anchor/failed', (req, res) => {
    if (!worker(req, res)) return
    const body = req.body as { epochId?: unknown; reason?: unknown }
    if (typeof body?.epochId !== 'string' || !['ROOT_CONFLICT', 'REVERTED', 'MAX_RETRY', 'INSUFFICIENT_FUNDS'].includes(String(body.reason))) return void sendError(res, 400, 'INVALID_INPUT')
    try {
      const current = epochs.get(body.epochId)
      if (['MAX_RETRY', 'INSUFFICIENT_FUNDS'].includes(String(body.reason)) && current.status !== 'FROZEN') return void sendError(res, 409, 'FAILURE_REJECTED')
      const { signed_tx: _secret, ...epoch } = epochs.markFailed(body.epochId, body.reason as 'ROOT_CONFLICT' | 'REVERTED' | 'MAX_RETRY' | 'INSUFFICIENT_FUNDS')
      res.json({ ok: true, request_id: res.locals.requestId as string, data: epoch })
    } catch { sendError(res, 409, 'FAILURE_REJECTED') }
  })

  app.post('/api/decisions', async (req, res) => {
    const owner = principal(req, res, 'DEMO_USER')
    if (!owner) return
    const key = idempotencyKey(req, res)
    if (!key) return
    const input = decisionInput(req.body)
    if (!input) return void sendError(res, 400, 'INVALID_INPUT')
    try {
      const result = await issuance.issue({ principal: owner, idempotencyKey: key, text: input.text })
      res.status(result.status).json({ ok: true, request_id: res.locals.requestId as string, data: result.data })
    } catch (error) {
      if (error instanceof IdempotencyConflictError) return void sendError(res, 409, 'IDEMPOTENCY_CONFLICT')
      if (error instanceof IdempotencyInProgressError) return void sendError(res, 503, 'INFERENCE_UNAVAILABLE', true)
      return void sendError(res, 503, 'INFERENCE_UNAVAILABLE', true)
    }
  })

  app.get('/api/receipts/:id', async (req, res) => {
    const row = database.prepare('SELECT canonical_body, receipt_hash FROM receipts WHERE receipt_id = ?').get(req.params.id) as
      | { canonical_body: string; receipt_hash: string }
      | undefined
    if (!row) return void sendError(res, 404, 'NOT_FOUND')
    const membership = database.prepare('SELECT e.epoch_id,e.status,e.tx_hash,e.block_number,e.fail_reason FROM epoch_members m JOIN epochs e ON e.epoch_id=m.epoch_id WHERE m.receipt_hash=?').get(row.receipt_hash) as { epoch_id: string; status: string; tx_hash: string | null; block_number: string | null; fail_reason: string | null } | undefined
    let confirmations = membership?.status === 'CONFIRMED' ? 12 : 0
    if (membership?.status === 'SUBMITTED' && membership.tx_hash && options.confirmationProgress) {
      try { confirmations = await options.confirmationProgress(membership.tx_hash) } catch { /* Next poll retries. */ }
    }
    res.json({
      ok: true,
      request_id: res.locals.requestId as string,
      data: { receipt_body: JSON.parse(row.canonical_body), receipt_hash: row.receipt_hash, state: membership?.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING_ANCHOR', epoch: membership ? { ...membership, confirmations } : null },
    })
  })

  app.get('/api/receipts/:id/bundle', async (req, res) => {
    try {
      const bundle = await epochs.bundle(req.params.id)
      if (!bundle) return void sendError(res, 404, 'NOT_FOUND')
      res.json({ ok: true, request_id: res.locals.requestId as string, data: bundle })
    } catch {
      sendError(res, 500, 'INTERNAL_ERROR')
    }
  })

  app.get('/api/manifests', async (_req, res) => {
    const hashes = await manifestHashes()
    res.json({
      ok: true,
      request_id: res.locals.requestId as string,
      data: {
        model: { manifest: MODEL_MANIFEST, hash: hashes.model, scope: 'LEGACY_SYNTHETIC_DEMO' },
        policy: { manifest: POLICY_MANIFEST, hash: hashes.policy, scope: 'LEGACY_SYNTHETIC_DEMO' },
        review: { manifest: REVIEW_POLICY_MANIFEST, hash: hashes.review, scope: 'LEGACY_SYNTHETIC_DEMO' },
        target_taxonomy: {
          status: 'AWAITING_W3_FREEZE',
          taxonomy_id: 'verimod-ko-beep-hate',
          native_classes: ['hate', 'offensive', 'none'],
          score_keys: ['hate', 'offensive'],
        },
      },
    })
  })

  app.post('/api/appeals', (req, res) => {
    if (!principal(req, res, 'DEMO_USER') || !idempotencyKey(req, res)) return
    sendError(res, 501, 'NOT_IMPLEMENTED')
  })
  app.post('/api/reviews', (req, res) => {
    if (!principal(req, res, 'DEMO_REVIEWER') || !idempotencyKey(req, res)) return
    sendError(res, 501, 'NOT_IMPLEMENTED')
  })
  app.post('/api/epochs/freeze', async (req, res) => {
    const operator = principal(req, res, 'DEMO_OPERATOR')
    if (!operator) return
    const key = idempotencyKey(req, res)
    if (!key) return
    if (req.body !== undefined && (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body) || Object.keys(req.body).length !== 0)) {
      return void sendError(res, 400, 'INVALID_INPUT')
    }
    try {
      const frozen = await epochs.freeze({ principal: operator, idempotencyKey: key })
      res.status(201).json({ ok: true, request_id: res.locals.requestId as string, data: frozen })
    } catch (error) {
      if (error instanceof EmptyEpochError) return void sendError(res, 409, 'EMPTY_EPOCH')
      if (error instanceof FreezeIdempotencyConflictError) return void sendError(res, 409, 'IDEMPOTENCY_CONFLICT')
      if (error instanceof EpochStateError) return void sendError(res, 409, 'EPOCH_STATE_CONFLICT')
      return void sendError(res, 500, 'INTERNAL_ERROR')
    }
  })
  app.get('/api/epochs/:id', (req, res) => {
    try {
      const { signed_tx: _privateSignedTransaction, ...publicEpoch } = epochs.get(req.params.id)
      res.json({ ok: true, request_id: res.locals.requestId as string, data: publicEpoch })
    } catch (error) {
      if (error instanceof EpochNotFoundError) return void sendError(res, 404, 'NOT_FOUND')
      if (error instanceof EpochStateError) return void sendError(res, 400, 'INVALID_INPUT')
      return void sendError(res, 500, 'INTERNAL_ERROR')
    }
  })

  app.use((error: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
    if (error instanceof SyntaxError) return void sendError(res, 400, 'INVALID_INPUT')
    return void sendError(res, 500, 'INTERNAL_ERROR')
  })

  return app
}
