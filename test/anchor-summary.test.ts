import { describe, expect, it } from 'vitest'
import { summarizeAnchors } from '../src/hooks/useReceiptAnchorSummary'

describe('shared receipt anchor summary', () => {
  it('reports the real confirmed aggregate', () => {
    const result = summarizeAnchors([
      { state: 'CONFIRMED', epoch: { status: 'CONFIRMED', confirmations: 20 } },
      { state: 'CONFIRMED', epoch: { status: 'CONFIRMED', confirmations: 12 } },
    ], 2)
    expect(result.complete).toBe(true)
    expect(result.text).toContain('2/2')
    expect(result.text).toContain('등록 완료')
  })

  it('reports submitted confirmation progress instead of a fixed pending label', () => {
    const result = summarizeAnchors([{ state: 'PENDING_ANCHOR', epoch: { status: 'SUBMITTED', confirmations: 7 } }], 1)
    expect(result.complete).toBe(false)
    expect(result.text).toContain('7/12')
    expect(result.text).not.toContain('PENDING_ANCHOR')
  })
})
