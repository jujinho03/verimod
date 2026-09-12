import { Link } from 'react-router'
import { APPEAL_REASONS, MAX_INPUT_CODE_POINTS, REVIEW_REASONS } from '../domain/manifests'
import type { VerificationBundle } from '../domain/types'
import { SIM_CHAIN } from '../store/ledger'
import { useAppState, useNow, useStore } from '../store/context'
import type { StoredReceipt } from '../store/state'
import { ActionBadge, AnchorBadge, HashText, SyntheticPill } from '../ui/bits'
import { OUTCOME_LABEL, formatDateTime, receiptTitle, shortHash } from '../ui/format'
import { EvidenceText } from './EvidenceText'
import { decisionSentence } from './explain'
import { DetailSection } from './PageHero'
import { ScoreBars } from './ScoreBars'

function ReceiptLink({ hash }: { hash: string }) {
  const store = useStore()
  const target = store.receipt(hash)
  return target ? <Link to={`/receipts/${target.body.receipt_id}`}>{receiptTitle(target)}</Link> : <code className="hash">{shortHash(hash)}</code>
}

export function ReceiptSummary({ receipt }: { receipt: StoredReceipt }) {
  const state = useAppState()
  const body = receipt.body

  if (body.event_kind === 'DECISION') {
    const { inference, policy } = body.payload
    const own = state.contents[body.content_commitment]
    return (
      <DetailSection title="판정 요약" aside={<SyntheticPill />}>
        <p className="summary-line">{decisionSentence(inference, policy)}</p>
        <ScoreBars scores={inference.scores_ppm} />
        <h3 className="mono faint sub-label">근거 구간</h3>
        {own ? (
          inference.evidence.length > 0 ? (
            <EvidenceText text={own.text} evidence={inference.evidence} truncatedAt={inference.input_status === 'TRUNCATED' ? MAX_INPUT_CODE_POINTS : undefined} />
          ) : (
            <p className="muted">기록된 근거 구간이 없습니다. 원문: “{own.text}”</p>
          )
        ) : (
          <p className="muted">원문과 salt가 이 기기에 없어 근거 구간을 문장 위에 표시할 수 없습니다.</p>
        )}
        <dl className="kv">
          <dt>조치</dt>
          <dd>
            <ActionBadge action={policy.action} />
          </dd>
          <dt>적용 규칙</dt>
          <dd>{policy.triggered_rule_ids.length ? policy.triggered_rule_ids.join(', ') : '없음'}</dd>
          <dt>사유 코드</dt>
          <dd>{policy.reason_codes.join(', ')}</dd>
          <dt>입력 상태</dt>
          <dd>{inference.input_status === 'FULL' ? '전체 사용' : `앞 ${MAX_INPUT_CODE_POINTS}자만 사용 (TRUNCATED)`}</dd>
          <dt>추론 시각</dt>
          <dd>{formatDateTime(inference.inferred_at)}</dd>
        </dl>
      </DetailSection>
    )
  }

  if (body.event_kind === 'APPEAL') {
    const own = state.appeals[body.payload.appeal_commitment]
    return (
      <DetailSection title="이의제기 내용">
        <dl className="kv">
          <dt>대상 판정</dt>
          <dd>
            <ReceiptLink hash={body.subject_receipt_hash} />
          </dd>
          <dt>사유</dt>
          <dd>
            {APPEAL_REASONS[body.payload.reason_code]} <span className="mono faint">{body.payload.reason_code}</span>
          </dd>
          <dt>본문</dt>
          <dd>{own ? own.text : <span className="muted">이 기기에 본문이 없습니다</span>}</dd>
          <dt>commitment</dt>
          <dd>
            <HashText value={body.payload.appeal_commitment} short />
          </dd>
        </dl>
        <p className="muted small">본문은 공개 원장에 올리지 않습니다. 영수증에는 salt를 더해 계산한 commitment만 들어갑니다.</p>
      </DetailSection>
    )
  }

  const { payload } = body
  return (
    <DetailSection title="검토 결과">
      <p className="summary-line">
        {OUTCOME_LABEL[payload.outcome]} · 최종 조치 <ActionBadge action={payload.resulting_action} />
      </p>
      <dl className="kv">
        <dt>대상 판정</dt>
        <dd>
          <ReceiptLink hash={body.subject_receipt_hash} />
        </dd>
        <dt>직전 기록</dt>
        <dd>
          <ReceiptLink hash={body.previous_receipt_hash} />
        </dd>
        <dt>결과 코드</dt>
        <dd className="mono">{payload.outcome}</dd>
        <dt>검토 사유</dt>
        <dd>
          <ul className="plain-list">
            {payload.reason_codes.map((code) => (
              <li key={code}>
                {REVIEW_REASONS[code]} <span className="mono faint">{code}</span>
              </li>
            ))}
          </ul>
        </dd>
      </dl>
      <p className="muted small">
        reviewer_role이 HUMAN_REVIEWER라고 적힌 것만으로 실제 사람이 검토했다는 증명은 되지 않습니다. 검토자 권한 확인은 서비스가 따로 해야 합니다.
        {payload.outcome === 'RESOLVED' && ' 직접 검토의 결과 값 RESOLVED는 팀 합의 전 임시 값입니다 (기준서 D08).'}
      </p>
    </DetailSection>
  )
}

export function ProofDetails({ receipt, bundle }: { receipt: StoredReceipt; bundle: VerificationBundle }) {
  const store = useStore()
  const epoch = store.epochOf(receipt)
  return (
    <dl className="kv">
      <dt>receipt_hash</dt>
      <dd>
        <HashText value={receipt.hash} />
      </dd>
      {bundle.proof ? (
        <>
          <dt>leaf 위치</dt>
          <dd>
            #{bundle.proof.leaf_index} / 트리 크기 {bundle.proof.tree_size}
          </dd>
          <dt>sibling</dt>
          <dd>
            {bundle.proof.siblings.length === 0 ? (
              '없음 (단일 leaf)'
            ) : (
              <ol className="siblings">
                {bundle.proof.siblings.map((sibling, i) => (
                  <li key={sibling + i}>
                    <span className="mono faint">{i + 1}</span>
                    <code className="hash">{sibling}</code>
                  </li>
                ))}
              </ol>
            )}
          </dd>
        </>
      ) : (
        <>
          <dt>포함 증명</dt>
          <dd className="muted">트랜잭션 제출 후 채워집니다</dd>
        </>
      )}
      {epoch && bundle.anchor && (
        <>
          <dt>epoch root</dt>
          <dd>
            <HashText value={epoch.record.root} />
          </dd>
          <dt>체인</dt>
          <dd>
            {bundle.anchor.chain_id} <span className="faint">{SIM_CHAIN.name} · 실제 네트워크 아님</span>
          </dd>
          <dt>컨트랙트</dt>
          <dd>
            <code className="hash">{bundle.anchor.contract_address}</code>
          </dd>
          <dt>tx hash</dt>
          <dd>
            <code className="hash">{bundle.anchor.tx_hash}</code> <span className="faint">합성</span>
          </dd>
          <dt>block</dt>
          <dd>{bundle.anchor.block_number}</dd>
        </>
      )}
    </dl>
  )
}

export function EpochMembers({ receipt }: { receipt: StoredReceipt }) {
  const store = useStore()
  const epoch = store.epochOf(receipt)
  if (!epoch) {
    return <p className="muted">아직 배치에 포함되지 않았습니다. 발급 후 약 6초 안에 다음 epoch로 묶입니다.</p>
  }
  return (
    <div className="epoch">
      <p className="mono faint">
        epoch #{epoch.record.epoch_id} · receipt {epoch.record.receipt_count}건 · root {shortHash(epoch.record.root)}
      </p>
      <ol className="epoch__members">
        {epoch.members.map((member, i) => {
          const self = member.receipt_hash === receipt.hash
          const sibling = store.receipt(member.receipt_hash)
          return (
            <li key={member.receipt_hash} className={self ? 'is-self' : member.mine ? 'is-mine' : ''}>
              <span className="mono faint">#{i}</span>
              <code className="hash">{shortHash(member.receipt_hash, 12, 8)}</code>
              <span>
                {self ? (
                  '이 영수증'
                ) : sibling ? (
                  <Link to={`/receipts/${sibling.body.receipt_id}`}>{receiptTitle(sibling)}</Link>
                ) : (
                  '다른 영수증 · 내용 비공개 (합성)'
                )}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function LifecycleTimeline({ receipt }: { receipt: StoredReceipt }) {
  const store = useStore()
  useAppState()
  const now = useNow(1000)
  const history = store.history(receipt)
  const last = history[history.length - 1]
  const decision = history[0]

  let hint: string | null = null
  if (last.body.event_kind === 'DECISION' && last.body.payload.policy.action === 'RESTRICT') hint = '이의제기하면 여기에 새 기록이 이어집니다.'
  if (last.body.event_kind === 'DECISION' && last.body.payload.policy.action === 'HUMAN_REVIEW') hint = '사람 검토를 기다리고 있습니다.'
  if (last.body.event_kind === 'APPEAL') hint = '검토 결과가 기록되면 여기에 이어집니다.'

  return (
    <ol className="timeline">
      {history.map((item) => (
        <li key={item.hash} className={`timeline__item${item.hash === receipt.hash ? ' is-current' : ''}`}>
          <span className="timeline__node" aria-hidden />
          <div className="timeline__body">
            <p className="mono faint">
              {item.body.event_kind} · {formatDateTime(item.issued_at)}
            </p>
            <Link to={`/receipts/${item.body.receipt_id}`} className="timeline__title">
              {receiptTitle(item)}
            </Link>
            <div className="timeline__meta">
              <AnchorBadge status={store.status(item, now)} />
              <code className="hash">{shortHash(item.hash)}</code>
              {item.body.event_kind !== 'DECISION' && (
                <span className="mono faint">
                  ← previous {shortHash(item.body.previous_receipt_hash, 8, 4)}
                  {item.body.previous_receipt_hash !== decision.hash && ` · subject ${shortHash(item.body.subject_receipt_hash, 8, 4)}`}
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
      {hint && (
        <li className="timeline__item timeline__item--next">
          <span className="timeline__node" aria-hidden />
          <p className="timeline__hint muted">{hint}</p>
        </li>
      )}
    </ol>
  )
}
