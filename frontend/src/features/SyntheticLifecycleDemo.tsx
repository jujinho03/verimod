import { useState } from 'react'
import { syntheticLifecycleCase, type SyntheticCase } from '../domain/syntheticLifecycle'
import { verifyReceipt, type VerifyReport } from '../domain/verify'
import { VerifyReportView } from './VerifyReportView'

const CASES: [SyntheticCase, string][] = [['NORMAL', '정상 연결'], ['FORBIDDEN_TRANSITION', '금지 전이'],
  ['MISSING_HISTORY', '이력 누락'], ['PENDING_PREVIOUS', '선행 anchor 미확정'], ['RPC_FAILURE', 'Mock RPC 실패'], ['WRONG_REFERENCE', '잘못된 참조']]

export function SyntheticLifecycleDemo() {
  const [scenario, setScenario] = useState<SyntheticCase>('NORMAL')
  const [report, setReport] = useState<VerifyReport | null>(null)
  const [receipts, setReceipts] = useState<{ id: string; kind: string; hash: string; previous: string | null }[]>([])
  const [busy, setBusy] = useState(false)
  return <section className="band" data-tone="mist" id="synthetic-lifecycle"><div className="frame inset">
    <h2 className="title-m">SYNTHETIC LIFECYCLE DEMO</h2>
    <p>사전 생성 DECISION → APPEAL → REVIEW · 각각 별도 영수증 · Mock ledger · 공개 Base 증거 아님</p>
    <p className="muted">실제 이의신청 접수·사람 심사·게시물 복구는 POST-MVP입니다. 제공된 기록의 연결만 확인하며 전체 이력의 완전성·최신성을 보장하지 않습니다. 위의 LIVE/W4 Base 영수증과 다른 자료입니다.</p>
    <label className="field__label" htmlFor="synthetic-case">합성 이력 사례</label>
    <select className="select" id="synthetic-case" disabled={busy} value={scenario} onChange={(e) => { setScenario(e.target.value as SyntheticCase); setReport(null); setReceipts([]) }}>
      {CASES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
    </select>
    <button className="btn btn--blue" type="button" disabled={busy} onClick={async () => {
      setBusy(true); setReport(null); setReceipts([])
      try {
        const f = await syntheticLifecycleCase(scenario)
        setReceipts(f.bundles.map((b) => ({ id: b.receipt_body.receipt_id, kind: b.receipt_body.event_kind,
          hash: b.receipt_hash, previous: b.receipt_body.previous_receipt_hash })))
        setReport(await verifyReceipt(f.bundles[2], f.context))
      }
      finally { setBusy(false) }
    }}>{busy ? '확인 중' : '합성 연결 검증'}</button>
    <ol className="timeline">{receipts.map((r) => <li key={r.id} className="timeline__item"><span className="timeline__node" aria-hidden />
      <div className="timeline__body"><p>{r.kind} · SYNTHETIC</p><code className="hash">{r.id}</code>
        <p className="small">hash <code className="hash">{r.hash}</code></p>
        {r.previous && <p className="small">← previous <code className="hash">{r.previous}</code></p>}</div>
    </li>)}</ol>
    {report && <div data-testid="synthetic-report"><p className="mono">Core {report.code} · Lifecycle {report.lifecycle.state} · SYNTHETIC / MOCK ONLY</p><VerifyReportView report={report} /></div>}
  </div></section>
}
