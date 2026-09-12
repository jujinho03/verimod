import { describe, expect, it } from 'vitest'
import type { Hex32 } from './hash'
import { InferenceError, runSyntheticInference } from './scorer'
import { LABEL_IDS } from './types'

const HASH = `0x${'22'.repeat(32)}` as Hex32
const ctx = {
  inferenceId: '7d0c2f4e-5b1a-4c3d-9e8f-0a1b2c3d4e5f',
  inferredAt: '2026-09-11T00:00:00.000Z',
  contentCommitment: HASH,
  modelManifestHash: HASH,
}

describe('runSyntheticInference', () => {
  it('같은 입력에는 같은 점수를 낸다', async () => {
    const text = '주문한 지 2주째인데 답도 없고 진짜 짜증나네요.'
    expect((await runSyntheticInference(text, ctx)).scores_ppm).toEqual((await runSyntheticInference(text, ctx)).scores_ppm)
  })

  it('빈 입력은 가짜 승인 대신 오류를 낸다', async () => {
    await expect(runSyntheticInference('   ', ctx)).rejects.toBeInstanceOf(InferenceError)
  })

  it('키워드가 없으면 모든 점수가 검토 threshold 아래다', async () => {
    const out = await runSyntheticInference('주말에 한강에서 자전거 탔는데 날씨가 정말 좋았어요.', ctx)
    for (const label of LABEL_IDS) expect(out.scores_ppm[label]).toBeLessThan(400_000)
    expect(out.evidence).toEqual([])
  })

  it('evidence 위치는 UTF-16이 아니라 code point 기준이다', async () => {
    const out = await runSyntheticInference('😀😀 무료 쿠폰', ctx)
    expect(out.evidence).toEqual([
      { start: 3, end: 5, label_id: 'spam', method_id: 'synthetic-keyword-match', method_version: '0.1' },
    ])
  })

  it('500 code point를 넘으면 TRUNCATED로 표시한다', async () => {
    expect((await runSyntheticInference('가'.repeat(500), ctx)).input_status).toBe('FULL')
    expect((await runSyntheticInference('가'.repeat(501), ctx)).input_status).toBe('TRUNCATED')
  })
})
