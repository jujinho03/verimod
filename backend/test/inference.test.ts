import { describe, expect, it, vi } from 'vitest'
import type { Hex32 } from '@verimod/protocol/hash'
import { createHttpInferenceAdapter, createThresholdPolicyEvaluator, InferenceUnavailableError } from '../src/inference.js'

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
    policyManifestHash: `0x${'3'.repeat(64)}`,
    hate: { review: 300_000, restrict: 700_000 },
    offensive: { review: 400_000, restrict: 800_000 },
  })
  const cases = [
    [299_999, 399_999, 'FULL', 'ALLOW'],
    [300_000, 0, 'FULL', 'HUMAN_REVIEW'],
    [300_001, 0, 'FULL', 'HUMAN_REVIEW'],
    [699_999, 0, 'FULL', 'HUMAN_REVIEW'],
    [700_000, 0, 'FULL', 'RESTRICT'],
    [700_001, 0, 'FULL', 'RESTRICT'],
    [0, 399_999, 'FULL', 'ALLOW'],
    [0, 400_000, 'FULL', 'HUMAN_REVIEW'],
    [0, 800_000, 'FULL', 'RESTRICT'],
    [700_000, 800_000, 'FULL', 'RESTRICT'],
    [1_000_000, 1_000_000, 'TRUNCATED', 'HUMAN_REVIEW'],
  ] as const

  it.each(cases)('maps hate=%i offensive=%i input=%s to %s', async (hate, offensive, inputStatus, action) => {
    await expect(evaluator.evaluate({ ...output, scores_ppm: { hate, offensive }, input_status: inputStatus })).resolves.toMatchObject({ action })
  })
})
