import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { PageHero } from '../features/PageHero'
import { useAppState, useNow, useStore } from '../store/context'
import type { StoredReceipt } from '../store/state'
import { ActionBadge, AnchorBadge } from '../ui/bits'
import { EVENT_LABEL, OUTCOME_LABEL, formatDateTime, relativeTime } from '../ui/format'

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'DECISION', label: '최초 판정' },
  { id: 'APPEAL', label: '이의제기' },
  { id: 'REVIEW', label: '사람 검토' },
  { id: 'appealable', label: '이의제기 가능' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

export function ReceiptsPage() {
  const store = useStore()
  const state = useAppState()
  const now = useNow(1000)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [resetting, setResetting] = useState(false)

  const requested = params.get('filter')
  const filter: FilterId = FILTERS.find((f) => f.id === requested)?.id ?? 'all'
  const receipts = [...state.receipts].sort((a, b) => b.issued_at - a.issued_at)
  const rows = receipts.filter((r) =>
    filter === 'all' ? true : filter === 'appealable' ? store.canAppeal(r).ok : r.body.event_kind === filter,
  )
  const anchored = receipts.filter((r) => store.status(r, now).stage === 'ANCHORED').length

  const followUp = (receipt: StoredReceipt) => {
    const body = receipt.body
    if (body.event_kind === 'REVIEW') return OUTCOME_LABEL[body.payload.outcome]
    const decisionHash = body.event_kind === 'DECISION' ? receipt.hash : body.subject_receipt_hash
    const review = store.reviewOf(decisionHash)
    if (review && review.body.event_kind === 'REVIEW') return `검토 완료 · ${OUTCOME_LABEL[review.body.payload.outcome]}`
    if (body.event_kind === 'APPEAL') return '검토 대기'
    if (body.payload.policy.action === 'HUMAN_REVIEW') return '검토 대기'
    if (store.appealOf(receipt.hash)) return '이의제기 접수'
    if (store.canAppeal(receipt).ok) {
      return (
        <Link to={`/receipts/${body.receipt_id}#appeal`} onClick={(event) => event.stopPropagation()} className="arrow-link">
          이의제기 가능
        </Link>
      )
    }
    return <span className="faint">없음</span>
  }

  const reset = async () => {
    if (!window.confirm('이 브라우저의 영수증을 모두 지우고 합성 영수증 5건으로 되돌릴까요?')) return
    setResetting(true)
    await store.reset()
    setResetting(false)
  }

  return (
    <>
      <PageHero label="Prove · 내 영수증" title="발급받은 영수증과 봉인 상태">
        <dl className="stats">
          <div>
            <dt className="mono faint">전체</dt>
            <dd>{receipts.length}</dd>
          </div>
          <div>
            <dt className="mono faint">앵커 확인</dt>
            <dd>{anchored}</dd>
          </div>
          <div>
            <dt className="mono faint">진행 중</dt>
            <dd>{receipts.length - anchored}</dd>
          </div>
        </dl>
        <Link to="/check" className="btn btn--blue">
          판정 요청하기
        </Link>
      </PageHero>

      <section className="band" data-tone="white">
        <div className="frame inset list-section">
          <div className="filter-bar" role="group" aria-label="영수증 필터">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className="filter"
                aria-pressed={filter === f.id}
                onClick={() => setParams(f.id === 'all' ? {} : { filter: f.id }, { replace: true })}
              >
                {f.label}
              </button>
            ))}
          </div>

          {rows.length === 0 ? (
            <div className="empty empty--wide">
              <h2 className="title-s">
                {filter === 'appealable' ? '이의제기할 수 있는 제한 판정이 없습니다' : '아직 받은 영수증이 없습니다'}
              </h2>
              <p className="muted">판정을 요청하고 영수증을 발급하면 여기에 쌓입니다.</p>
              <Link to="/check" className="btn btn--blue">
                판정 요청하기
              </Link>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>발급 시각</th>
                    <th>영수증</th>
                    <th>기록</th>
                    <th>조치·결과</th>
                    <th>봉인 상태</th>
                    <th>이의·검토</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((receipt) => {
                    const body = receipt.body
                    return (
                      <tr key={receipt.hash} onClick={() => navigate(`/receipts/${body.receipt_id}`)}>
                        <td>
                          <span className="cell-strong">{relativeTime(receipt.issued_at, now)}</span>
                          <span className="cell-sub">{formatDateTime(receipt.issued_at)}</span>
                        </td>
                        <td>
                          <Link to={`/receipts/${body.receipt_id}`} className="cell-id" onClick={(event) => event.stopPropagation()}>
                            {body.receipt_id.slice(0, 8)}
                          </Link>
                          {receipt.seeded && <span className="cell-sub">합성 시드</span>}
                        </td>
                        <td>{EVENT_LABEL[body.event_kind]}</td>
                        <td>
                          {body.event_kind === 'DECISION' && <ActionBadge action={body.payload.policy.action} />}
                          {body.event_kind === 'APPEAL' && <span className="faint">접수</span>}
                          {body.event_kind === 'REVIEW' && <ActionBadge action={body.payload.resulting_action} />}
                        </td>
                        <td>
                          <AnchorBadge status={store.status(receipt, now)} />
                        </td>
                        <td>{followUp(receipt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="band" data-tone="mist" id="reset">
        <div className="frame inset reset-section">
          <div>
            <h2 className="title-s">시험 데이터 초기화</h2>
            <p className="muted">
              영수증과 원문은 이 브라우저의 저장소에만 있습니다. 초기화하면 직접 만든 기록을 지우고, 이의제기부터 검토까지 끝난 건을 포함한 합성 영수증 5건으로 되돌립니다.
            </p>
          </div>
          <button type="button" className="btn btn--outline" onClick={() => void reset()} disabled={resetting}>
            {resetting ? '초기화 중' : '합성 영수증으로 초기화'}
          </button>
        </div>
      </section>
    </>
  )
}
