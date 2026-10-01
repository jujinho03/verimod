import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Hex32 } from '../domain/hash'
import { receiptHash } from '../domain/receipt'
import { verifyReceipt } from '../domain/verify'
import { VeriModStore, draftDecision } from '../store/store'
import { AnchorBadge } from '../ui/bits'
import { DecisionResult } from './DecisionResult'
import { tamperOptions } from './tamper'
import { VerifyReportView } from './VerifyReportView'

// F-owned synthetic UI regressions, not T's shared protocol vectors.
const NOW = Date.parse('2026-10-01T00:00:00.000Z')
const FIXED_HASH = `0x${'12'.repeat(32)}` as Hex32

describe('W2 decision card', () => {
  it.each([
    ['ALLOW', '오늘 도서관에 다녀왔어요.'],
    ['HUMAN_REVIEW', '배송이 일주일째 안 와서 너무 짜증나요.'],
    ['RESTRICT', '무료 당첨! 지금 바로 클릭하고 할인코드 받으세요'],
  ])('%s shows policy reasons and synthetic scores without exposing salt', async (action, text) => {
    const draft = await draftDecision(text, NOW)
    // Stable display fixture only; never issued as a protocol receipt.
    draft.inference.content_commitment = FIXED_HASH
    expect(draft.policy.action).toBe(action)
    const html = renderToStaticMarkup(<DecisionResult draft={draft} stale={false} busy={false} issuing={false} onIssue={() => {}} />)
    expect(html).toContain(`action--${action}`)
    for (const reason of draft.policy.reason_codes) expect(html).toContain(reason)
    for (const rule of draft.policy.triggered_rule_ids) expect(html).toContain(rule)
    expect(html).toContain('합성 점수')
    expect(html).not.toContain(draft.salt)
    expect(html).toMatchSnapshot()
  })

  it.each([
    [true, false, false],
    [false, true, false],
    [false, true, true],
  ])('blocks issuance when stale=%s busy=%s issuing=%s', async (stale, busy, issuing) => {
    const draft = await draftDecision('안녕하세요', NOW)
    const html = renderToStaticMarkup(<DecisionResult draft={draft} stale={stale} busy={busy} issuing={issuing} onIssue={() => {}} />)
    expect(html).toMatch(/<button[^>]*disabled=""/)
    if (stale) expect(html).toContain('입력이 바뀌었습니다')
    if (issuing) expect(html).toContain('발급 중')
  })

  it('renders TRUNCATED and missing optional spans without inventing evidence', async () => {
    const draft = await draftDecision('가'.repeat(501), NOW)
    const html = renderToStaticMarkup(<DecisionResult draft={draft} stale={false} busy={false} issuing={false} onIssue={() => {}} />)
    expect(html).toContain('INPUT_TRUNCATED')
    expect(html).toContain('앞 500자만 사용')
    expect(html).toContain('표시할 근거 구간이 없습니다')
    expect(html).not.toContain('<mark')
  })
})

describe('W2 report rendering from actual local verifier', () => {
  it.each(['VALID', 'PENDING_ANCHOR', 'RPC_UNAVAILABLE', 'HASH_MISMATCH', 'INVALID_PROOF'] as const)(
    '%s preserves verdict and step states', async (expected) => {
      const store = await VeriModStore.open(null, () => NOW)
      const receipt = expected === 'PENDING_ANCHOR'
        ? await store.issueDecision(await draftDecision('안녕하세요', NOW))
        : store.getState().receipts.find((r) => r.body.event_kind === 'DECISION')!
      const bundle = structuredClone(store.bundle(receipt))
      if (expected === 'RPC_UNAVAILABLE') store.setRpcDown(true)
      if (expected === 'HASH_MISMATCH' || expected === 'INVALID_PROOF') {
        const original = JSON.stringify(receipt.body)
        tamperOptions(bundle.receipt_body).find((o) => o.id === 'score')!.apply(bundle.receipt_body)
        expect(JSON.stringify(receipt.body)).toBe(original)
        if (expected === 'INVALID_PROOF') bundle.receipt_hash = await receiptHash(bundle.receipt_body)
      }
      const report = await verifyReceipt(bundle, await store.verifierContext())
      expect(report.code).toBe(expected)
      const html = renderToStaticMarkup(<VerifyReportView report={report} />)
      const tone = expected === 'VALID' ? 'pass' : expected === 'PENDING_ANCHOR' || expected === 'RPC_UNAVAILABLE' ? 'pending' : 'fail'
      expect(html).toContain(`verdict--${tone}`)
      if (expected !== 'VALID') expect(html).not.toContain('verdict--pass')
      if (expected === 'RPC_UNAVAILABLE') expect(html).toContain('변조로 판단하지 않으며')
      const labels = { PASSED: '통과', FAILED: '실패', PENDING: '대기', SKIPPED: '건너뜀' }
      for (const step of report.steps) {
        expect(html).toContain(`check-row--${step.state}`)
        expect(html).toContain(` · ${labels[step.state]}`)
      }
      // Snapshot visible verdict/step markup; omit variable hash/time details.
      expect({ verdict: html.match(/<div class="verdict[\s\S]*?<\/div>/)?.[0],
        steps: html.match(/<p class="check-row__title">[\s\S]*?<\/p>/g) }).toMatchSnapshot()
    },
  )

  it.each(['ISSUED', 'BATCHED', 'SUBMITTED', 'CONFIRMING'] as const)('never marks %s as anchored', (stage) => {
    const html = renderToStaticMarkup(<AnchorBadge status={{ stage, confirmations: 0 }} />)
    expect(html).toContain('status--pending')
    expect(html).not.toContain('status--pass')
    expect(html).toMatchSnapshot()
  })
})
