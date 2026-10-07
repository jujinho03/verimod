import type { DatabaseSync } from 'node:sqlite'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Hex32 } from '@verimod/protocol/hash'
import { freezeEpoch } from '@verimod/protocol/epoch'
import { createApp } from '../src/app.js'
import { openDatabase } from '../src/database.js'
import type { InferenceAdapter, PolicyEvaluator } from '../src/inference.js'

const MODEL_HASH = `0x${'1'.repeat(64)}` as Hex32
const POLICY_HASH = `0x${'2'.repeat(64)}` as Hex32
const headers = { 'x-demo-principal': 'demo-user-1', 'x-demo-role': 'DEMO_USER', 'Idempotency-Key': 'decision-key-1' }

function dependencies(delay = 0) {
  const infer: InferenceAdapter['infer'] = async ({ contentCommitment }) => {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay))
    return {
        output_version: 'inference/1',
        inference_id: '11111111-1111-4111-8111-111111111111',
        content_commitment: contentCommitment,
        model_manifest_hash: MODEL_HASH,
        taxonomy_id: 'verimod-ko-beep-hate',
        taxonomy_version: '1',
        scores_ppm: { hate: 125_000, offensive: 625_000 },
        score_semantics: 'UNCALIBRATED',
        input_status: 'FULL',
        evidence: [],
        inferred_at: '2026-10-06T00:00:00.000Z',
    }
  }
  const inference: InferenceAdapter = {
    infer: vi.fn(infer),
  }
  const evaluate: PolicyEvaluator['evaluate'] = async () => ({
    policy_manifest_hash: POLICY_HASH,
    action: 'HUMAN_REVIEW',
    reason_codes: ['W3_DETERMINISTIC_FIXTURE'],
    triggered_rule_ids: ['W3-FIXTURE-REVIEW'],
  })
  const policy: PolicyEvaluator = {
    evaluate: vi.fn(evaluate),
  }
  return { inference, policy }
}

describe('API-02/API-09 authoritative decision issuance', () => {
  let database: DatabaseSync

  beforeEach(() => {
    database = openDatabase()
  })
  afterEach(() => {
    database.close()
  })

  it('creates one pending receipt with private material only in the issuance response', async () => {
    const deps = dependencies()
    const app = createApp({ database, ...deps, now: () => new Date('2026-10-06T00:00:01.000Z') })
    const issued = await request(app).post('/api/decisions').set(headers).send({ text: '합성 통합 fixture' })

    expect(issued.status).toBe(201)
    expect(issued.body.ok).toBe(true)
    expect(issued.body.data.state).toBe('PENDING_ANCHOR')
    expect(issued.body.data.bundle.proof).toBeNull()
    expect(issued.body.data.bundle.anchor).toBeNull()
    expect(Object.keys(issued.body.data.bundle.receipt_body.payload.inference.scores_ppm)).toEqual(['hate', 'offensive'])
    expect(issued.body.data.private_package.content_salt).toMatch(/^[0-9a-f]{64}$/)
    expect(JSON.stringify(issued.body)).not.toContain('합성 통합 fixture')
    expect(database.prepare('SELECT COUNT(*) AS count FROM receipts').get()).toEqual({ count: 1 })
    expect(database.prepare('SELECT COUNT(*) AS count FROM content_store').get()).toEqual({ count: 1 })

    const id = issued.body.data.bundle.receipt_body.receipt_id as string
    const publicReceipt = await request(app).get(`/api/receipts/${id}`)
    const publicBundle = await request(app).get(`/api/receipts/${id}/bundle`)
    for (const response of [publicReceipt, publicBundle]) {
      expect(response.status).toBe(200)
      const serialized = JSON.stringify(response.body)
      expect(serialized).not.toContain('content_salt')
      expect(serialized).not.toContain('합성 통합 fixture')
    }

    const frozen = await freezeEpoch([{
      receipt_id: id,
      receipt_hash: issued.body.data.bundle.receipt_hash as Hex32,
      issuer_seq: issued.body.data.bundle.receipt_body.issuer_seq as number,
    }])
    expect(frozen.root).toMatch(/^0x[0-9a-f]{64}$/)
    expect(frozen.proofs[issued.body.data.bundle.receipt_hash].tree_size).toBe(1)
  })

  it('replays the same receipt, hash and salt for the same key and payload', async () => {
    const deps = dependencies()
    const app = createApp({ database, ...deps })
    const first = await request(app).post('/api/decisions').set(headers).send({ text: 'same' })
    const replay = await request(app).post('/api/decisions').set(headers).send({ text: 'same' })

    expect(replay.status).toBe(201)
    expect(replay.body.data).toEqual(first.body.data)
    expect(database.prepare('SELECT COUNT(*) AS count FROM receipts').get()).toEqual({ count: 1 })
    expect(deps.inference.infer).toHaveBeenCalledTimes(1)
  })

  it('returns 409 when the same key is reused with another payload', async () => {
    const app = createApp({ database, ...dependencies() })
    await request(app).post('/api/decisions').set(headers).send({ text: 'first' })
    const conflict = await request(app).post('/api/decisions').set(headers).send({ text: 'different' })

    expect(conflict.status).toBe(409)
    expect(conflict.body.error).toEqual({ code: 'IDEMPOTENCY_CONFLICT', retryable: false })
    expect(database.prepare('SELECT COUNT(*) AS count FROM receipts').get()).toEqual({ count: 1 })
  })

  it('coalesces concurrent identical requests into one receipt', async () => {
    const deps = dependencies(20)
    const app = createApp({ database, ...deps })
    const responses = await Promise.all(Array.from({ length: 8 }, () =>
      request(app).post('/api/decisions').set(headers).send({ text: 'concurrent' }),
    ))

    expect(responses.every((response) => response.status === 201)).toBe(true)
    expect(new Set(responses.map((response) => response.body.data.bundle.receipt_hash)).size).toBe(1)
    expect(database.prepare('SELECT COUNT(*) AS count FROM receipts').get()).toEqual({ count: 1 })
    expect(deps.inference.infer).toHaveBeenCalledTimes(1)
  })

  it('assigns unique increasing issuer_seq values to concurrent distinct requests', async () => {
    const app = createApp({ database, ...dependencies(5) })
    const responses = await Promise.all(Array.from({ length: 6 }, (_, index) =>
      request(app).post('/api/decisions').set({ ...headers, 'Idempotency-Key': `key-${index}` }).send({ text: `input-${index}` }),
    ))
    expect(responses.every((response) => response.status === 201)).toBe(true)
    const rows = database.prepare('SELECT issuer_seq FROM receipts ORDER BY issuer_seq').all() as { issuer_seq: number }[]
    expect(rows.map((row) => row.issuer_seq)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('requires the demo principal boundary and idempotency key', async () => {
    const app = createApp({ database, ...dependencies() })
    const forbidden = await request(app).post('/api/decisions').send({ text: 'x' })
    const missingKey = await request(app).post('/api/decisions')
      .set('x-demo-principal', 'demo-user-1').set('x-demo-role', 'DEMO_USER').send({ text: 'x' })
    expect(forbidden.status).toBe(403)
    expect(missingKey.status).toBe(400)
    expect(database.prepare('SELECT COUNT(*) AS count FROM receipts').get()).toEqual({ count: 0 })
  })

  it('labels current public manifests as legacy and exposes the W3 target taxonomy separately', async () => {
    const app = createApp({ database, ...dependencies() })
    const response = await request(app).get('/api/manifests')
    expect(response.status).toBe(200)
    expect(response.body.data.model.scope).toBe('LEGACY_SYNTHETIC_DEMO')
    expect(response.body.data.target_taxonomy).toEqual({
      status: 'W3_SCHEMA_ALIGNED',
      taxonomy_id: 'verimod-ko-beep-hate',
      native_classes: ['hate', 'offensive', 'none'],
      score_keys: ['hate', 'offensive'],
    })
  })
})

describe('API-09 safe failure', () => {
  it('returns 503 and creates no receipt, private material, anchor candidate or fallback score', async () => {
    const database = openDatabase()
    try {
      const app = createApp({ database })
      const response = await request(app).post('/api/decisions').set(headers).send({ text: 'provider down' })
      expect(response.status).toBe(503)
      expect(response.body.error).toEqual({ code: 'INFERENCE_UNAVAILABLE', retryable: true })
      expect(JSON.stringify(response.body)).not.toContain('provider down')
      expect(database.prepare('SELECT COUNT(*) AS count FROM receipts').get()).toEqual({ count: 0 })
      expect(database.prepare('SELECT COUNT(*) AS count FROM content_store').get()).toEqual({ count: 0 })
      expect(database.prepare('SELECT COUNT(*) AS count FROM epoch_members').get()).toEqual({ count: 0 })
      expect(database.prepare('SELECT COUNT(*) AS count FROM idempotency_records').get()).toEqual({ count: 0 })
    } finally {
      database.close()
    }
  })

  it('rejects an invalid provider output without issuing a receipt', async () => {
    const database = openDatabase()
    const deps = dependencies()
    deps.inference.infer = async ({ contentCommitment }) => ({
      output_version: 'inference/1',
      inference_id: '11111111-1111-4111-8111-111111111111',
      content_commitment: contentCommitment,
      model_manifest_hash: MODEL_HASH,
      taxonomy_id: 'verimod-ko-beep-hate',
      taxonomy_version: '1',
      scores_ppm: { hate: -1, offensive: 625_000 },
      score_semantics: 'UNCALIBRATED',
      input_status: 'FULL',
      evidence: [],
      inferred_at: '2026-10-06T00:00:00.000Z',
    })
    try {
      const response = await request(createApp({ database, ...deps }))
        .post('/api/decisions').set(headers).send({ text: 'invalid output' })
      expect(response.status).toBe(503)
      expect(database.prepare('SELECT COUNT(*) AS count FROM receipts').get()).toEqual({ count: 0 })
      expect(database.prepare('SELECT COUNT(*) AS count FROM content_store').get()).toEqual({ count: 0 })
    } finally {
      database.close()
    }
  })
})
