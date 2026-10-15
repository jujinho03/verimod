import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import type { Hex32 } from '@verimod/protocol/hash'
import { createHttpInferenceAdapter, createThresholdPolicyEvaluator, InferenceUnavailableError, W4_PROVISIONAL_POLICY_HASH } from '../src/inference.js'

const policyManifest = JSON.parse(readFileSync(new URL('../config/w4-provisional.policy_manifest.json', import.meta.url), 'utf8'))
const aVectors = JSON.parse(readFileSync(new URL('./fixtures/w4-a-policy-vectors.json', import.meta.url), 'utf8'))

const commitment = `0x${'1'.repeat(64)}` as Hex32
const output = {
  output_version: 'inference/1' as const,
  inference_id: '11111111-1111-4111-8111-111111111111',
  content_commitment: commitment,
  model_manifest_hash: `0x${'2'.repeat(64)}` as Hex32,
  taxonomy_id: 'verimod-ko-beep-hate' as const,
  taxonomy_version: 'w4-r01',
  scores_ppm: { hate: 100_000, offensive: 200_000 },
  score_semantics: 'UNCALIBRATED' as const,
  input_status: 'FULL' as const,
  evidence: [] as [],
  inferred_at: '2026-10-12T00:00:00.000Z',
}

describe('INT-01 HTTP inference adapter', () => {
  it('sends exact text and commitment and accepts the I1 success envelope', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toEqual({ text: '한국어 입력', content_commitment: commitment })
      return new Response(JSON.stringify({ ok: true, request_id: 'req-1', inference: output }), { status: 200 })
    }) as unknown as typeof fetch
    const adapter = createHttpInferenceAdapter({ endpoint: 'http://ai.local/infer', fetcher })
    await expect(adapter.infer({ text: '한국어 입력', contentCommitment: commitment })).resolves.toEqual(output)
  })

  it.each([
    new Response('{}', { status: 200 }),
    new Response(JSON.stringify({ ok: false, request_id: 'req-2', error: { code: 'INFERENCE_TIMEOUT', retryable: true } }), { status: 503 }),
  ])('maps malformed or failed inference to unavailable without fabricating output', async (response) => {
    const adapter = createHttpInferenceAdapter({ endpoint: 'http://ai.local/infer', fetcher: async () => response })
    await expect(adapter.infer({ text: 'x', contentCommitment: commitment })).rejects.toBeInstanceOf(InferenceUnavailableError)
  })
})

describe('A/F validation-backed policy parity boundary', () => {
  const evaluator = createThresholdPolicyEvaluator({
    policyManifestHash: W4_PROVISIONAL_POLICY_HASH, policyManifest, localW4E2E: true,
    hate: { review: 24_495, restrict: 216_950 },
    offensive: { review: 180_483, restrict: 646_501 },
  })
  const cases = [
    [24_494, 180_482, 'FULL', 'ALLOW'],
    [24_495, 0, 'FULL', 'HUMAN_REVIEW'],
    [24_496, 0, 'FULL', 'HUMAN_REVIEW'],
    [216_949, 0, 'FULL', 'HUMAN_REVIEW'],
    [216_950, 0, 'FULL', 'RESTRICT'],
    [216_951, 0, 'FULL', 'RESTRICT'],
    [0, 180_482, 'FULL', 'ALLOW'],
    [0, 180_483, 'FULL', 'HUMAN_REVIEW'],
    [0, 646_501, 'FULL', 'RESTRICT'],
    [216_950, 646_501, 'FULL', 'RESTRICT'],
    [1_000_000, 1_000_000, 'TRUNCATED', 'HUMAN_REVIEW'],
  ] as const

  it.each(cases)('maps hate=%i offensive=%i input=%s to %s', async (hate, offensive, inputStatus, action) => {
    await expect(evaluator.evaluate({ ...output, scores_ppm: { hate, offensive }, input_status: inputStatus })).resolves.toMatchObject({ action })
  })

  it('matches all 21 A/Python expected policy vectors exactly', async () => {
    expect(aVectors.policy_manifest_hash).toBe(W4_PROVISIONAL_POLICY_HASH)
    expect(aVectors.vectors).toHaveLength(21)
    for (const vector of aVectors.vectors) {
      expect(await evaluator.evaluate({ ...output, scores_ppm: vector.scores_ppm, input_status: vector.input_status }), vector.id).toEqual(vector.expected)
    }
  })
})
