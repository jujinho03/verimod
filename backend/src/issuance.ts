import { randomUUID } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { canonicalBytes, canonicalize } from '@verimod/protocol/canonical'
import { bytesToHex, randomHex32, sha256, type Hex32 } from '@verimod/protocol/hash'
import { contentCommitment, ISSUER_ID, receiptHash } from '@verimod/protocol/receipt'
import { validateReceiptBody } from '@verimod/protocol/schema'
import { transaction } from './database.js'
import {
  assertValidInference,
  assertValidPolicy,
  type InferenceAdapter,
  type PolicyEvaluator,
  type W3InferenceOutput,
  type W3PolicyEvaluation,
} from './inference.js'

type DecisionBody = {
  protocol_version: 'verimod/1'
  receipt_id: string
  issuer_id: string
  issuer_seq: number
  event_kind: 'DECISION'
  recorded_at: string
  content_commitment: Hex32
  subject_receipt_hash: null
  previous_receipt_hash: null
  payload: { inference: W3InferenceOutput; policy: W3PolicyEvaluation }
}

export interface DecisionCreated {
  bundle: {
    receipt_body: DecisionBody
    receipt_hash: Hex32
    proof: null
    anchor: null
  }
  private_package: {
    receipt_id: string
    content_commitment: Hex32
    content_salt: string
  }
  state: 'PENDING_ANCHOR'
}

type IdempotencyClaim =
  | { kind: 'ACQUIRED' }
  | { kind: 'CONFLICT' }
  | { kind: 'IN_PROGRESS' }
  | { kind: 'REPLAY'; status: number; response: unknown }

export class IdempotencyConflictError extends Error {}
export class IdempotencyInProgressError extends Error {}

export class IssuanceService {
  private readonly running = new Map<string, { requestHash: string; promise: Promise<DecisionCreated> }>()
  private finalization: Promise<void> = Promise.resolve()

  constructor(
    private readonly database: DatabaseSync,
    private readonly inference: InferenceAdapter,
    private readonly policy: PolicyEvaluator,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async issue(input: { principal: string; idempotencyKey: string; text: string }): Promise<{ status: number; data: DecisionCreated }> {
    const operation = 'POST /api/decisions'
    const requestHash = bytesToHex(await sha256(canonicalBytes({ text: input.text })))
    const runningKey = `${input.principal}\u0000${operation}\u0000${input.idempotencyKey}`
    const current = this.running.get(runningKey)
    if (current) {
      if (current.requestHash !== requestHash) throw new IdempotencyConflictError()
      return { status: 201, data: await current.promise }
    }

    const claim = this.claim(input.principal, operation, input.idempotencyKey, requestHash)
    if (claim.kind === 'CONFLICT') throw new IdempotencyConflictError()
    if (claim.kind === 'IN_PROGRESS') throw new IdempotencyInProgressError()
    if (claim.kind === 'REPLAY') return { status: claim.status, data: claim.response as DecisionCreated }

    const promise = this.createDecision(input.principal, input.text, input.idempotencyKey, requestHash)
    this.running.set(runningKey, { requestHash, promise })
    try {
      return { status: 201, data: await promise }
    } catch (error) {
      this.database.prepare(
        "DELETE FROM idempotency_records WHERE principal = ? AND operation = ? AND idempotency_key = ? AND request_hash = ? AND status = 'IN_PROGRESS'",
      ).run(input.principal, operation, input.idempotencyKey, requestHash)
      throw error
    } finally {
      this.running.delete(runningKey)
    }
  }

  private claim(principal: string, operation: string, key: string, requestHash: string): IdempotencyClaim {
    return transaction(this.database, () => {
      const row = this.database.prepare(
        'SELECT request_hash, status, response_status, response_json FROM idempotency_records WHERE principal = ? AND operation = ? AND idempotency_key = ?',
      ).get(principal, operation, key) as { request_hash: string; status: string; response_status: number | null; response_json: string | null } | undefined
      if (row) {
        if (row.request_hash !== requestHash) return { kind: 'CONFLICT' }
        if (row.status === 'COMPLETED' && row.response_status !== null && row.response_json !== null) {
          return { kind: 'REPLAY', status: row.response_status, response: JSON.parse(row.response_json) }
        }
        return { kind: 'IN_PROGRESS' }
      }
      const timestamp = this.now().toISOString()
      this.database.prepare(
        'INSERT INTO idempotency_records (principal, operation, idempotency_key, request_hash, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).run(principal, operation, key, requestHash, 'IN_PROGRESS', timestamp, timestamp)
      return { kind: 'ACQUIRED' }
    })
  }

  private async createDecision(principal: string, text: string, key: string, requestHash: string): Promise<DecisionCreated> {
    const salt = randomHex32()
    const commitment = await contentCommitment(salt, text)
    const inference = await this.inference.infer({ text, contentCommitment: commitment })
    assertValidInference(inference, commitment)
    const policy = await this.policy.evaluate(inference)
    assertValidPolicy(policy)
    const recordedAt = this.now().toISOString()

    return this.finalize(async () => {
      const next = this.database.prepare('SELECT COALESCE(MAX(issuer_seq), 0) + 1 AS value FROM receipts').get() as { value: number }
      const receiptId = randomUUID()
      const body: DecisionBody = {
        protocol_version: 'verimod/1',
        receipt_id: receiptId,
        issuer_id: ISSUER_ID,
        issuer_seq: next.value,
        event_kind: 'DECISION',
        recorded_at: recordedAt,
        content_commitment: commitment,
        subject_receipt_hash: null,
        previous_receipt_hash: null,
        payload: { inference, policy },
      }
      // The shared schema now validates the actual profile before any persistence.
      const validated = validateReceiptBody(body)
      if (!validated.ok) throw new Error('invalid decision receipt')
      const hash = await receiptHash(validated.value)
      const response: DecisionCreated = {
        bundle: { receipt_body: body, receipt_hash: hash, proof: null, anchor: null },
        private_package: {
          receipt_id: receiptId,
          content_commitment: commitment,
          content_salt: salt.slice(2),
        },
        state: 'PENDING_ANCHOR',
      }
      transaction(this.database, () => {
        this.database.prepare(
          'INSERT INTO receipts (receipt_id, issuer_seq, canonical_body, receipt_hash, event_kind, subject_receipt_hash, previous_receipt_hash, owner_principal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ).run(receiptId, next.value, canonicalize(body), hash, 'DECISION', null, null, principal, recordedAt)
        this.database.prepare(
          'INSERT INTO content_store (receipt_id, original_text, content_salt, content_commitment, owner_principal) VALUES (?, ?, ?, ?, ?)',
        ).run(receiptId, text, salt.slice(2), commitment, principal)
        this.database.prepare(
          "UPDATE idempotency_records SET status = 'COMPLETED', response_status = 201, response_json = ?, updated_at = ? WHERE principal = ? AND operation = 'POST /api/decisions' AND idempotency_key = ? AND request_hash = ? AND status = 'IN_PROGRESS'",
        ).run(JSON.stringify(response), this.now().toISOString(), principal, key, requestHash)
      })
      return response
    })
  }

  private finalize<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.finalization.then(operation, operation)
    this.finalization = result.then(() => undefined, () => undefined)
    return result
  }
}
