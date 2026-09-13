import { useId, useState } from 'react'
import { Link } from 'react-router'
import { REVIEW_REASONS } from '../domain/manifests'
import type { FinalAction } from '../domain/types'
import { EvidenceText } from '../features/EvidenceText'
import { decisionSentence } from '../features/explain'
import { PageHero } from '../features/PageHero'
import { ScoreBars } from '../features/ScoreBars'
import { useAppState, useNow, useStore } from '../store/context'
import type { StoredReceipt } from '../store/state'
import type { ReviewTask } from '../store/store'
import { ActionBadge, AnchorBadge, ArrowLink, SyntheticPill } from '../ui/bits'
import { ACTION_LABEL, OUTCOME_LABEL, formatDateTime, receiptTitle, relativeTime } from '../ui/format'
import { APPEAL_REASONS } from '../domain/manifests'

function ReviewForm({ task, onDone }: { task: ReviewTask; onDone: (receipt: StoredReceipt) => void }) {
  const store = useStore()
  const name = useId()
  const [action, setAction] = useState<FinalAction | null>(null)
  const [reasons, setReasons] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const options: { value: FinalAction; label: string; note: string }[] =
    task.kind === 'APPEAL'
      ? [
          { value: 'RESTRICT', label: '조치 유지', note: '제한을 유지합니다 · UPHOLD' },
          { value: 'ALLOW', label: '조치 변경', note: '승인으로 바꿔 게시를 복구합니다 · OVERTURN' },
        ]
      : [
          { value: 'ALLOW', label: '승인', note: '게시를 유지합니다 · RESOLVED' },
          { value: 'RESTRICT', label: '제한', note: '노출을 제한합니다 · RESOLVED' },
        ]

  const submit = async () => {
    if (!action) return
    setError(null)
    setBusy(true)
    try {
      onDone(await store.issueReview(task.decision.hash, action, reasons))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
      setBusy(false)
    }
  }

  return (
    <form
      className="review-form"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <fieldset className="choices choices--row">
        <legend className="field__label">검토 결과</legend>
        {options.map((option) => (
          <label className="choice" key={option.value}>
            <input type="radio" name={`${name}-action`} checked={action === option.value} onChange={() => setAction(option.value)} />
            <span>
              <strong>{option.label}</strong>
              <span className="choice__hint">{option.note}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <fieldset className="choices">
        <legend className="field__label">사유 (하나 이상)</legend>
        {Object.entries(REVIEW_REASONS).map(([code, label]) => (
          <label className="choice" key={code}>
            <input
              type="checkbox"
              checked={reasons.includes(code)}
              onChange={(event) => setReasons((current) => (event.target.checked ? [...current, code] : current.filter((c) => c !== code)))}
            />
            <span>
              <strong>{label}</strong>
              <span className="choice__hint mono">{code}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {task.kind === 'DIRECT' && <p className="muted small">검토 보류 판정을 직접 끝낼 때의 결과 값 RESOLVED는 팀 합의 전 임시 값입니다 (기준서 D08).</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn--blue" disabled={busy || !action || reasons.length === 0}>
        {busy ? '기록 중' : '검토 결과 기록'}
      </button>
    </form>
  )
}

export function ReviewPage() {
  const store = useStore()
  const state = useAppState()
  const now = useNow(1000)
  const queue = store.reviewQueue()
  const [selected, setSelected] = useState<string | null>(null)
  const [recorded, setRecorded] = useState<StoredReceipt | null>(null)
  const current = queue.find((task) => task.decision.hash === selected) ?? queue[0] ?? null
  const reviews = state.receipts.filter((r) => r.body.event_kind === 'REVIEW').sort((a, b) => b.issued_at - a.issued_at)

  return (
    <>
      <PageHero label="Review · 검토 콘솔" title="대기 중인 이의제기와 검토 보류 건">
        <p>시험 버전에서는 누구나 검토자 역할로 들어갑니다. 실제 서비스에서는 서버가 검토자 권한과 중복 처리를 확인해야 합니다.</p>
        <dl className="stats">
          <div>
            <dt className="mono faint">대기</dt>
            <dd>{queue.length}</dd>
          </div>
          <div>
            <dt className="mono faint">이의제기</dt>
            <dd>{queue.filter((t) => t.kind === 'APPEAL').length}</dd>
          </div>
          <div>
            <dt className="mono faint">검토 보류</dt>
            <dd>{queue.filter((t) => t.kind === 'DIRECT').length}</dd>
          </div>
        </dl>
      </PageHero>

      <section className="band" data-tone="white">
        <div className="frame review-layout">
          <nav className="queue" aria-label="검토 대기열">
            <p className="mono faint queue__label">대기열 {queue.length}건</p>
            {queue.length === 0 && <p className="muted queue__empty">대기 중인 건이 없습니다.</p>}
            {queue.map((task) => {
              const own = state.contents[task.decision.body.content_commitment]
              const isCurrent = current?.decision.hash === task.decision.hash
              return (
                <button
                  key={task.decision.hash}
                  type="button"
                  className="queue__item"
                  aria-current={isCurrent}
                  onClick={() => {
                    setSelected(task.decision.hash)
                    setRecorded(null)
                  }}
                >
                  <span className="queue__top">
                    <span className="mono">{task.kind === 'APPEAL' ? '이의제기' : '검토 보류'}</span>
                    <span className="faint">{relativeTime(task.waitingSince, now)}</span>
                  </span>
                  <span className="queue__text">{own ? own.text.slice(0, 60) : task.decision.body.receipt_id}</span>
                  <span className="mono faint">{task.decision.body.receipt_id.slice(0, 8)}</span>
                </button>
              )
            })}
          </nav>

          <div className="review-detail" aria-live="polite">
            {recorded && (
              <div className="success-box">
                <p className="title-s">검토 결과를 기록했습니다</p>
                <p className="muted">{receiptTitle(recorded)} 영수증이 발급됐고, 다음 배치에서 원장에 봉인됩니다.</p>
                <ArrowLink to={`/receipts/${recorded.body.receipt_id}`}>검토 영수증 보기</ArrowLink>
              </div>
            )}
            {!current ? (
              <div className="empty empty--wide">
                <h2 className="title-s">처리할 건이 없습니다</h2>
                <p className="muted">제한 판정에 이의제기가 들어오거나, 검토 보류 판정이 발급되면 여기에 표시됩니다.</p>
                <div className="btn-row">
                  <Link to="/check" className="btn btn--blue">
                    판정 요청하기
                  </Link>
                  <Link to="/receipts?filter=appealable" className="btn btn--outline">
                    이의제기할 판정 찾기
                  </Link>
                </div>
              </div>
            ) : (
              <TaskDetail key={current.decision.hash} task={current} onDone={setRecorded} />
            )}
          </div>
        </div>
      </section>

      <section className="band" data-tone="mist">
        <div className="frame inset list-section">
          <h2 className="title-m">최근 검토 기록</h2>
          {reviews.length === 0 ? (
            <p className="muted">아직 검토 기록이 없습니다.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>기록 시각</th>
                    <th>결과</th>
                    <th>최종 조치</th>
                    <th>봉인 상태</th>
                    <th>영수증</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) =>
                    review.body.event_kind === 'REVIEW' ? (
                      <tr key={review.hash}>
                        <td>{formatDateTime(review.issued_at)}</td>
                        <td>{OUTCOME_LABEL[review.body.payload.outcome]}</td>
                        <td>
                          <ActionBadge action={review.body.payload.resulting_action} />
                        </td>
                        <td>
                          <AnchorBadge status={store.status(review, now)} />
                        </td>
                        <td>
                          <Link to={`/receipts/${review.body.receipt_id}`} className="cell-id">
                            {review.body.receipt_id.slice(0, 8)}
                          </Link>
                        </td>
                      </tr>
                    ) : null,
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function TaskDetail({ task, onDone }: { task: ReviewTask; onDone: (receipt: StoredReceipt) => void }) {
  const state = useAppState()
  const body = task.decision.body
  if (body.event_kind !== 'DECISION') return null
  const own = state.contents[body.content_commitment]
  const appealBody = task.appeal?.body.event_kind === 'APPEAL' ? task.appeal.body : null
  const appealText = appealBody ? state.appeals[appealBody.payload.appeal_commitment] : null

  return (
    <div className="task">
      <header className="task__head">
        <div>
          <p className="mono faint">{task.kind === 'APPEAL' ? '이의제기 검토' : '검토 보류 판정 직접 검토'}</p>
          <h2 className="title-m">
            최초 판정 <ActionBadge action={body.payload.policy.action} />
          </h2>
        </div>
        <Link to={`/receipts/${body.receipt_id}`} className="arrow-link">
          최초 판정 영수증
        </Link>
      </header>

      <div className="task__block">
        <h3 className="mono faint sub-label">이 브라우저에 저장된 원문 · 권한 확인 없는 PoC</h3>
        {own ? (
          <EvidenceText text={own.text} evidence={body.payload.inference.evidence} />
        ) : (
          <p className="muted">원문이 이 기기에 없습니다.</p>
        )}
        <p className="summary-line">{decisionSentence(body.payload.inference, body.payload.policy)}</p>
      </div>

      <div className="task__block">
        <h3 className="mono faint sub-label">
          항목별 점수 <SyntheticPill />
        </h3>
        <ScoreBars scores={body.payload.inference.scores_ppm} />
      </div>

      {appealBody && task.appeal && (
        <div className="task__block task__appeal">
          <h3 className="mono faint sub-label">이의제기 · {formatDateTime(task.appeal.issued_at)}</h3>
          <p className="title-s">{APPEAL_REASONS[appealBody.payload.reason_code]}</p>
          <p>{appealText ? appealText.text : '본문이 이 기기에 없습니다.'}</p>
          <Link to={`/receipts/${appealBody.receipt_id}`} className="arrow-link">
            이의제기 영수증
          </Link>
        </div>
      )}

      <div className="task__block">
        <h3 className="mono faint sub-label">결정 · 원래 조치 {ACTION_LABEL[body.payload.policy.action]}</h3>
        <ReviewForm task={task} onDone={onDone} />
      </div>
    </div>
  )
}
