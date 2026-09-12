import { describe, expect, it } from 'vitest'
import { verifyReceipt } from '../domain/verify'
import { VeriModStore, draftDecision } from './store'

describe('VeriModStore', () => {
  it('합성 시드 영수증은 모두 VALID이고 이의제기·검토 연결도 통과한다', async () => {
    const store = await VeriModStore.open(null)
    const ctx = await store.verifierContext()
    const receipts = store.getState().receipts
    expect(receipts).toHaveLength(5)
    for (const receipt of receipts) {
      const report = await verifyReceipt(store.bundle(receipt), ctx)
      expect(report.code, receipt.body.event_kind).toBe('VALID')
      if (receipt.body.event_kind !== 'DECISION') expect(report.lifecycle.state).toBe('PASSED')
    }
    expect(store.reviewQueue().map((task) => task.kind)).toEqual(['DIRECT'])
  })

  it('새 판정은 봉인 전 PENDING_ANCHOR이고 배치와 블록 확인이 끝난 뒤에만 VALID', async () => {
    let t = Date.parse('2026-09-11T00:00:00.000Z')
    const store = await VeriModStore.open(null, () => t)
    const ctx = await store.verifierContext()
    const receipt = await store.issueDecision(await draftDecision('무료 당첨! 지금 바로 클릭하고 할인코드 받으세요', t))
    const check = async () => (await verifyReceipt(store.bundle(store.receipt(receipt.hash)!), ctx)).code

    expect(receipt.body.event_kind === 'DECISION' && receipt.body.payload.policy.action).toBe('RESTRICT')
    expect(await check()).toBe('PENDING_ANCHOR')

    t += 7_000
    await store.tick()
    const sealed = store.receipt(receipt.hash)!
    expect(store.status(sealed).stage).toBe('BATCHED')
    expect(await check()).toBe('PENDING_ANCHOR')

    t += 5_000
    expect(store.status(sealed).stage).toBe('CONFIRMING')
    expect(await check()).toBe('PENDING_ANCHOR')

    t += 15_000
    expect(store.status(sealed).stage).toBe('ANCHORED')
    expect(await check()).toBe('VALID')
  })

  it('제한 판정에 이의제기하면 대기열에 오르고, 검토를 기록하면 연결된 영수증이 남는다', async () => {
    let t = Date.parse('2026-09-11T00:00:00.000Z')
    const store = await VeriModStore.open(null, () => t)
    const decision = await store.issueDecision(await draftDecision('무료 당첨! 지금 바로 클릭하세요', t))
    expect(store.canAppeal(decision).ok).toBe(true)

    t += 1_000
    const appeal = await store.issueAppeal(decision.hash, 'FALSE_POSITIVE_CLAIM', '이벤트 공지 글입니다.')
    expect(store.canAppeal(decision).ok).toBe(false)
    expect(store.reviewQueue().some((task) => task.appeal?.hash === appeal.hash)).toBe(true)

    t += 1_000
    const review = await store.issueReview(decision.hash, 'RESTRICT', ['REPEATED_SPAM_PATTERN'])
    expect(review.body.event_kind === 'REVIEW' && review.body.payload.outcome).toBe('UPHOLD')
    expect(store.reviewQueue().some((task) => task.decision.hash === decision.hash)).toBe(false)
    expect(store.history(review).map((r) => r.body.event_kind)).toEqual(['DECISION', 'APPEAL', 'REVIEW'])
    await expect(store.issueReview(decision.hash, 'ALLOW', ['CONTEXT_NOT_HARMFUL'])).rejects.toThrow('이미 검토 결과')
  })
})
