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

export interface AppOptions {
  database?: DatabaseSync
  inference?: InferenceAdapter
  policy?: PolicyEvaluator
  now?: () => Date
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
  )
  const app = express()
  app.use((_req, res, next) => {
    res.locals.requestId = randomUUID()
    next()
  })
  app.use(express.json({ limit: '64kb' }))

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'verimod-backend' })
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

  app.get('/api/receipts/:id', (req, res) => {
    const row = database.prepare('SELECT canonical_body, receipt_hash FROM receipts WHERE receipt_id = ?').get(req.params.id) as
      | { canonical_body: string; receipt_hash: string }
      | undefined
    if (!row) return void sendError(res, 404, 'NOT_FOUND')
    res.json({
      ok: true,
      request_id: res.locals.requestId as string,
      data: { receipt_body: JSON.parse(row.canonical_body), receipt_hash: row.receipt_hash, state: 'PENDING_ANCHOR' },
    })
  })

  app.get('/api/receipts/:id/bundle', (req, res) => {
    const row = database.prepare('SELECT canonical_body, receipt_hash FROM receipts WHERE receipt_id = ?').get(req.params.id) as
      | { canonical_body: string; receipt_hash: string }
      | undefined
    if (!row) return void sendError(res, 404, 'NOT_FOUND')
    res.json({
      ok: true,
      request_id: res.locals.requestId as string,
      data: { receipt_body: JSON.parse(row.canonical_body), receipt_hash: row.receipt_hash, proof: null, anchor: null },
    })
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
  app.post('/api/epochs/freeze', (req, res) => {
    if (!principal(req, res, 'DEMO_OPERATOR')) return
    sendError(res, 501, 'NOT_IMPLEMENTED')
  })
  app.get('/api/epochs/:id', (req, res) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) return void sendError(res, 400, 'INVALID_INPUT')
    const row = database.prepare('SELECT * FROM epochs WHERE epoch_id = ?').get(req.params.id)
    if (!row) return void sendError(res, 404, 'NOT_FOUND')
    res.json({ ok: true, request_id: res.locals.requestId as string, data: row })
  })

  app.use((error: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
    if (error instanceof SyntaxError) return void sendError(res, 400, 'INVALID_INPUT')
    return void sendError(res, 500, 'INTERNAL_ERROR')
  })

  return app
}
