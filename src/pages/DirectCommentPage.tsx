import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { VeriModApiClient } from '@vm-api/client'
import { ApiClientError, type DecisionCreated } from '@vm-api/types'
import { ActionBadge, CopyButton, downloadJson, Notice, shortHash, TopBar } from '../components/ui'
import { saveGuestReceipt } from '../lib/guestVault'

const client = new VeriModApiClient({ timeoutMs: 20_000 })

export function useAnchorStatus(receiptId: string | null) {
  const [status, setStatus] = useState('자동 등록 준비 중')
  useEffect(() => {
    if (!receiptId) { setStatus('자동 등록 준비 중'); return }
    let active = true
    const poll = async () => {
      try {
        const response = await client.getReceipt(receiptId, (value) => value as { epoch?: { status?: string; confirmations?: number; fail_reason?: string } })
        if (!active) return
        const epoch = response.data.epoch
        setStatus(!epoch ? '자동 등록 대기' : epoch.status === 'FROZEN' ? '배치 완료 · 자동 서명 중' : epoch.status === 'SUBMITTING' ? '서명 완료 · 송신 중' : epoch.status === 'SUBMITTED' ? `블록 확인 ${Math.min(epoch.confirmations ?? 0, 12)}/12` : epoch.status === 'CONFIRMED' ? '확정 완료 · 검증 가능' : epoch.status === 'FAILED' ? `등록 실패 · ${epoch.fail_reason ?? '원인 확인 중'}` : '자동 등록 진행 중')
      } catch { /* Keep the last known state; the next poll retries. */ }
    }
    void poll()
    const timer = window.setInterval(() => { void poll() }, 5000)
    return () => { active = false; window.clearInterval(timer) }
  }, [receiptId])
  return status
}

function issueError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === 'INFERENCE_UNAVAILABLE') return 'AI 판정 서비스를 사용할 수 없어 영수증을 발급하지 않았어요. 잠시 후 다시 시도해 주세요.'
    if (error.code === 'IDEMPOTENCY_CONFLICT') return '같은 게시 요청에 다른 내용이 들어왔어요. 댓글을 다시 작성해 주세요.'
    if (error.kind === 'TIMEOUT' || error.kind === 'NETWORK') return '서버 응답을 확인하지 못했어요. 같은 요청으로 다시 시도할 수 있어요.'
  }
  return '판정서를 발급하지 못했어요. 잠시 후 다시 시도해 주세요.'
}

export function DirectCommentPage() {
  const location = useLocation()
  const initial = (location.state as { draft?: string; submit?: boolean; idempotencyKey?: string } | null) ?? null
  const [text, setText] = useState(initial?.draft ?? '')
  const [result, setResult] = useState<DecisionCreated | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const key = useRef<{ text: string; value: string } | null>(initial?.idempotencyKey && initial.draft ? { text: initial.draft, value: initial.idempotencyKey } : null)
  const inFlight = useRef(false)
  const autoStarted = useRef(false)
  const receiptId = result?.bundle.receipt_body.receipt_id ?? null
  const anchorStatus = useAnchorStatus(receiptId)

  const post = async () => {
    const draft = text.trim()
    if (!draft || inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError(null)
    try {
      if (!key.current || key.current.text !== draft) key.current = { text: draft, value: crypto.randomUUID() }
      const created = (await client.postDecision({ text: draft }, key.current.value)).data
      setResult(created)
      saveGuestReceipt({ receipt_id: created.bundle.receipt_body.receipt_id, created_at: created.bundle.receipt_body.recorded_at })
    } catch (caught) { setError(issueError(caught)) }
    finally { inFlight.current = false; setBusy(false) }
  }
  useEffect(() => {
    if (initial?.submit && !autoStarted.current) { autoStarted.current = true; void post() }
  }, [])

  const again = () => { setText(''); setResult(null); setError(null); key.current = null }
  const body = result?.bundle.receipt_body
  const decision = body?.event_kind === 'DECISION' ? body.payload : null
  const privatePackage = result ? {
    package_version: 'verimod-private/1', receipt_id: result.private_package.receipt_id,
    original_text: text.trim(), content_salt: result.private_package.content_salt,
    content_commitment: result.private_package.content_commitment,
  } : null
  const url = receiptId ? `${window.location.origin}/r/${receiptId}` : ''
  return <div className="page vpage direct-comment-page">
    <TopBar title="댓글 판정" />
    <div className="vpanel direct-comment-panel">
      <h1>{result ? 'AI 판정서가 발급됐어요' : '댓글을 작성해 보세요'}</h1>
      {!result ? <form onSubmit={(event) => { event.preventDefault(); void post() }} className="vfield">
        <label htmlFor="direct-comment" className="vlabel">댓글</label>
        <textarea id="direct-comment" className="vinput vtextarea" value={text} onChange={(event) => { setText(event.target.value); setError(null) }} placeholder="댓글을 입력하세요" />
        <p className="vhint">게시하면 실제 R01 모델이 판정하고 영수증을 발급합니다. 긴 입력은 잘려서 사람 검토로 분류될 수 있어요.</p>
        <button className="btn-primary" type="submit" disabled={busy || !text.trim()}>{busy ? '판정 중...' : '게시하고 판정받기'}</button>
      </form> : <>
        <p className="vquote">{text.trim()}</p>
        <dl className="vrows">
          <div><dt>조치</dt><dd><ActionBadge action={decision?.policy.action ?? null} /></dd></div>
          <div><dt>근거 코드</dt><dd>{decision?.policy.reason_codes.join(', ') || '없음(허용)'}</dd></div>
          <div><dt>발동 규칙</dt><dd>{decision?.policy.triggered_rule_ids.join(', ') || '없음'}</dd></div>
          <div><dt>입력 상태</dt><dd>{decision?.inference.input_status === 'TRUNCATED' ? 'TRUNCATED_HUMAN_REVIEW · 긴 입력이 잘려 사람 검토로 분류됨' : '전체 입력'}</dd></div>
          <div><dt>모델 점수</dt><dd>UNCALIBRATED · {Object.entries(decision?.inference.scores_ppm ?? {}).map(([name, value]) => `${name} ${value} ppm`).join(', ')}</dd></div>
          <div><dt>영수증 ID</dt><dd><code>{receiptId}</code></dd></div>
          <div><dt>온체인 등록</dt><dd role="status">{anchorStatus}</dd></div>
        </dl>
        <Notice tone="info">점수는 확률이 아닙니다. 등록은 자동으로 진행되며, 확정되면 영수증 화면에서 독립 검증할 수 있어요.</Notice>
        <div className="vlinkrow"><code className="vlinkrow__url">{url}</code><CopyButton value={url} label="영수증 링크 복사" /></div>
        <div className="vactions-grid direct-result__actions">
          <Link className="vaction" to={`/r/${receiptId}`}>영수증 열기 · {shortHash(receiptId)}</Link>
          <Link className="vaction" to="/verify">영수증 검증</Link>
          <button type="button" className="vaction" onClick={() => privatePackage && downloadJson(`verimod-private-${receiptId}.json`, privatePackage)}>Private Package 저장</button>
          <button type="button" className="vaction" onClick={again}>다른 댓글 쓰기</button>
        </div>
      </>}
      {error && <p role="alert" className="error-box">{error}</p>}
    </div>
  </div>
}
