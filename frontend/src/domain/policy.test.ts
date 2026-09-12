import { describe, expect, it } from 'vitest'
import type { Hex32 } from './hash'
import { evaluatePolicy } from './policy'
import type { ScoresPpm } from './types'

const HASH = `0x${'11'.repeat(32)}` as Hex32
const scores = (over: Partial<ScoresPpm>): ScoresPpm => ({ hate: 0, profanity: 0, sexual: 0, spam: 0, violence: 0, ...over })
const decide = (over: Partial<ScoresPpm>, status: 'FULL' | 'TRUNCATED' = 'FULL') =>
  evaluatePolicy({ input_status: status, scores_ppm: scores(over) }, HASH)

describe('evaluatePolicy (합성 threshold)', () => {
  it('검토 threshold 바로 아래는 승인', () => {
    expect(decide({ profanity: 399_999 })).toMatchObject({ action: 'ALLOW', triggered_rule_ids: [] })
  })

  it('검토 threshold와 같으면 검토 보류', () => {
    expect(decide({ profanity: 400_000 })).toMatchObject({
      action: 'HUMAN_REVIEW',
      triggered_rule_ids: ['R-PROFANITY-REVIEW'],
    })
  })

  it('제한 threshold 바로 아래는 검토 보류, 같으면 제한', () => {
    expect(decide({ violence: 799_999 }).action).toBe('HUMAN_REVIEW')
    expect(decide({ violence: 800_000 })).toMatchObject({ action: 'RESTRICT', triggered_rule_ids: ['R-VIOLENCE-RESTRICT'] })
  })

  it('스팸은 850,000부터 제한', () => {
    expect(decide({ spam: 849_999 }).action).toBe('HUMAN_REVIEW')
    expect(decide({ spam: 850_000 }).action).toBe('RESTRICT')
  })

  it('여러 규칙이 걸리면 rule id를 오름차순으로 기록', () => {
    expect(decide({ violence: 900_000, hate: 900_000 }).triggered_rule_ids).toEqual(['R-HATE-RESTRICT', 'R-VIOLENCE-RESTRICT'])
  })

  it('잘린 입력은 점수와 관계없이 검토 보류가 우선', () => {
    expect(decide({ violence: 990_000 }, 'TRUNCATED')).toMatchObject({
      action: 'HUMAN_REVIEW',
      reason_codes: ['INPUT_TRUNCATED'],
      triggered_rule_ids: ['R-INPUT-TRUNCATED'],
    })
  })
})
