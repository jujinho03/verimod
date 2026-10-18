import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import type { Hex32 } from '@verimod/protocol/hash'
import { canonicalize } from '@verimod/protocol/canonical'
import { contentCommitment, receiptHash } from '@verimod/protocol/receipt'
import { createApp } from '../src/app.js'
import { openDatabase } from '../src/database.js'
import {
  createThresholdPolicyEvaluator, W4_PROVISIONAL_POLICY_HASH, W4_R01_MODEL_HASH,
  type InferenceAdapter, type ThresholdPolicyConfig, type W3InferenceOutput,
} from '../src/inference.js'

const model = JSON.parse(readFileSync(new URL('../config/w4-r01.model_manifest.json', import.meta.url), 'utf8'))
const policyManifest = JSON.parse(readFileSync(new URL('../config/w4-provisional.policy_manifest.json', import.meta.url), 'utf8'))
const clone = <T>(value: T): T => structuredClone(value)
const headers = { 'x-demo-principal': 'w4-f-local', 'x-demo-role': 'DEMO_USER', 'Idempotency-Key': 'w4-f-boundary' }

function config(): ThresholdPolicyConfig {
  return {
    policyManifestHash: W4_PROVISIONAL_POLICY_HASH, policyManifest: clone(policyManifest), localW4E2E: true,
    hate: { review: 24495, restrict: 216950 }, offensive: { review: 180483, restrict: 646501 },
  }
}
function infer(override: Partial<W3InferenceOutput> = {}): InferenceAdapter {
  return { async infer({ contentCommitment }) {
    return {
      output_version: 'inference/1', inference_id: '11111111-1111-4111-8111-111111111111',
      content_commitment: contentCommitment, model_manifest_hash: W4_R01_MODEL_HASH,
      taxonomy_id: 'verimod-ko-beep-hate', taxonomy_version: '1',
      scores_ppm: { hate: 3364, offensive: 12979 }, score_semantics: 'UNCALIBRATED',
      input_status: 'FULL', evidence: [], inferred_at: '2026-10-16T00:00:00.000Z', ...override,
    }
  } }
}
async function runCase(name: string, options: {
  modelManifest?: unknown; inference?: InferenceAdapter; policyConfig?: ThresholdPolicyConfig; noPolicy?: boolean
}) {
  const database = openDatabase()
  try {
    const counts = () => {
      const count = (table: string) => Number((database.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n)
      return { decisions: count('receipts'), anchorCandidates: count('receipts') - count('epoch_members'),
        content: count('content_store'), epochs: count('epochs'), idempotency: count('idempotency_records') }
    }
    const before = counts()
    const response = await request(createApp({ database, modelManifest: options.modelManifest === undefined ? clone(model) : options.modelManifest,
      inference: options.inference ?? infer(),
      policy: options.noPolicy ? undefined : createThresholdPolicyEvaluator(options.policyConfig ?? config()),
    })).post('/api/decisions').set({ ...headers, 'Idempotency-Key': name }).send({ text: 'W4 합성 검증' })
    const after = counts()
    return { response, before, after }
  } finally { database.close() }
}

describe('W4 R01 manifest trust boundary, HTTP and SQLite', () => {
  const cases: [string, Parameters<typeof runCase>[1]][] = [
    ['model manifest missing', { modelManifest: null }],
    ['model manifest changed with old hash', { modelManifest: { ...model, run_id: 'unapproved' } }],
    ['model hash malformed', { inference: infer({ model_manifest_hash: 'invalid' as Hex32 }) }],
    ['model hash valid but unapproved', { inference: infer({ model_manifest_hash: `0x${'11'.repeat(32)}` }) }],
    ['wrong commitment', { inference: infer({ content_commitment: `0x${'00'.repeat(32)}` }) }],
    ['score out of range', { inference: infer({ scores_ppm: { hate: 1_000_001, offensive: 0 } }) }],
    ['taxonomy version changed', { inference: infer({ taxonomy_version: '2' }) }],
    ['score semantics changed', { inference: infer({ score_semantics: 'CALIBRATED' }) }],
    ['policy missing', { noPolicy: true }],
    ['policy hash valid but unbound', { policyConfig: { ...config(), policyManifestHash: `0x${'22'.repeat(32)}` } }],
    ['policy threshold changed with pinned hash', { policyConfig: { ...config(), hate: { review: 24496, restrict: 216950 } } }],
    ['policy manifest changed with old hash', { policyConfig: { ...config(), policyManifest: { ...policyManifest, comparison: 'greater_than' } } }],
    ['provisional local gate disabled', { policyConfig: { ...config(), localW4E2E: false } }],
    ['inference provider stopped', { inference: { async infer() { throw new Error('stopped') } } }],
    ['inference timeout', { inference: { async infer() { throw new Error('timeout') } } }],
  ]
  it.each(cases)('%s fails closed with zero durable DB delta', async (name, options) => {
    const { response, before, after } = await runCase(name, options)
    expect(response.status).toBe(503)
    expect(response.body.error).toEqual({ code: 'INFERENCE_UNAVAILABLE', retryable: true })
    expect(response.body.data).toBeUndefined()
    expect(after).toEqual(before)
  })

  it('issues with the pinned R01 identity and provisional policy', async () => {
    const { response, before, after } = await runCase('trusted R01 sample scores', {})
    expect(response.status).toBe(201)
    expect(response.body.data.bundle.receipt_body.payload.inference.model_manifest_hash).toBe(W4_R01_MODEL_HASH)
    expect(response.body.data.bundle.receipt_body.payload.policy).toEqual({
      policy_manifest_hash: W4_PROVISIONAL_POLICY_HASH, action: 'ALLOW', reason_codes: [], triggered_rule_ids: [],
    })
    expect(after.decisions - before.decisions).toBe(1)
    expect(after.anchorCandidates - before.anchorCandidates).toBe(1)
    expect(after.content - before.content).toBe(1)
  })

  it('replays two recorded R01 score fixtures through issuance and SQLite reopen', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'verimod-w4-f-'))
    const path = join(directory, 'w4.sqlite')
    const database = openDatabase(path)
    try {
      const inference: InferenceAdapter = { async infer({ text, contentCommitment: commitment }) {
        const truncated = text.length > 500
        return {
          output_version: 'inference/1', inference_id: '11111111-1111-4111-8111-111111111111',
          content_commitment: commitment, model_manifest_hash: W4_R01_MODEL_HASH,
          taxonomy_id: 'verimod-ko-beep-hate', taxonomy_version: '1', score_semantics: 'UNCALIBRATED',
          scores_ppm: truncated ? { hate: 31479, offensive: 102538 } : { hate: 3364, offensive: 12979 },
          input_status: truncated ? 'TRUNCATED' : 'FULL', evidence: [], inferred_at: '2026-10-16T00:00:00.000Z',
        }
      } }
      const app = createApp({ database, inference, modelManifest: clone(model), policy: createThresholdPolicyEvaluator(config()) })
      const texts = ['오늘은 친구와 도서관에서 함께 공부했어요.', '가 '.repeat(260)]
      for (const [index, text] of texts.entries()) {
        const key = `recorded-${index}`
        const first = await request(app).post('/api/decisions').set({ ...headers, 'Idempotency-Key': key }).send({ text })
        expect(first.status).toBe(201)
        const body = first.body.data.bundle.receipt_body
        expect(body.payload.policy.action).toBe(index === 0 ? 'ALLOW' : 'HUMAN_REVIEW')
        expect(await receiptHash(body)).toBe(first.body.data.bundle.receipt_hash)
        expect(await contentCommitment(`0x${first.body.data.private_package.content_salt}`, text)).toBe(body.content_commitment)
        const row = database.prepare('SELECT canonical_body FROM receipts WHERE receipt_id = ?').get(body.receipt_id) as { canonical_body: string }
        expect(row.canonical_body).toBe(canonicalize(body))
        const publicResponse = await request(app).get(`/api/receipts/${body.receipt_id}/bundle`)
        expect(publicResponse.status).toBe(200)
        expect(JSON.stringify(publicResponse.body)).not.toContain(first.body.data.private_package.content_salt)
        expect(JSON.stringify(publicResponse.body)).not.toContain(text)
        const replay = await request(app).post('/api/decisions').set({ ...headers, 'Idempotency-Key': key }).send({ text })
        expect(replay.body.data).toEqual(first.body.data)
        const conflict = await request(app).post('/api/decisions').set({ ...headers, 'Idempotency-Key': key }).send({ text: `${text} 변경` })
        expect(conflict.status).toBe(409)
      }
      database.close()
      const reopened = openDatabase(path)
      try { expect(reopened.prepare('SELECT COUNT(*) AS n FROM receipts').get()).toEqual({ n: 2 }) }
      finally { reopened.close() }
    } finally {
      try { database.close() } catch { /* already closed after verification */ }
      if (!resolve(directory).startsWith(`${resolve(tmpdir())}${sep}`)) throw new Error('unsafe test cleanup path')
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
