import { MAX_INPUT_CODE_POINTS } from '../domain/manifests'
import type { DecisionDraft } from '../store/store'
import { ActionBadge, SyntheticPill } from '../ui/bits'
import { shortHash } from '../ui/format'
import { EvidenceText } from './EvidenceText'
import { decisionSentence } from './explain'
import { ScoreBars } from './ScoreBars'

/** 현재 합성 계약의 표시 전용 카드. 발급과 입력 상태는 페이지가 관리한다. */
export function DecisionResult({ draft, stale, busy, issuing, onIssue }: {
  draft: DecisionDraft
  stale: boolean
  busy: boolean
  issuing: boolean
  onIssue: () => void
}) {
  return (
    <div className="result">
      <div className="result__head">
        <ActionBadge action={draft.policy.action} large />
        <SyntheticPill />
      </div>
      <p className="summary-line">{decisionSentence(draft.inference, draft.policy)}</p>
      {stale && <p className="inline-warn">입력이 바뀌었습니다. 다시 판정을 요청해야 영수증을 발급할 수 있습니다.</p>}

      <h3 className="mono faint sub-label">항목별 점수</h3>
      <ScoreBars scores={draft.inference.scores_ppm} />

      <h3 className="mono faint sub-label">근거 구간</h3>
      <p className="muted small">표시된 구간은 합성 키워드의 일치 위치이며, 모델 판단의 인과적 설명이 아닙니다.</p>
      {draft.inference.evidence.length > 0 ? (
        <EvidenceText
          text={draft.text}
          evidence={draft.inference.evidence}
          truncatedAt={draft.inference.input_status === 'TRUNCATED' ? MAX_INPUT_CODE_POINTS : undefined}
        />
      ) : (
        <p className="muted">표시할 근거 구간이 없습니다. 합성 점수기는 키워드가 일치한 구간만 근거로 기록합니다.</p>
      )}

      <dl className="kv">
        <dt>사유 코드</dt>
        <dd>{draft.policy.reason_codes.length ? draft.policy.reason_codes.join(', ') : '없음'}</dd>
        <dt>적용 규칙</dt>
        <dd>{draft.policy.triggered_rule_ids.length ? draft.policy.triggered_rule_ids.join(', ') : '없음'}</dd>
        <dt>입력 상태</dt>
        <dd>{draft.inference.input_status === 'FULL' ? '전체 사용' : `앞 ${MAX_INPUT_CODE_POINTS}자만 사용`}</dd>
        <dt>모델 manifest</dt>
        <dd>
          <code className="hash">{shortHash(draft.inference.model_manifest_hash)}</code> <span className="faint">합성 점수기 0.1.0</span>
        </dd>
        <dt>정책 manifest</dt>
        <dd>
          <code className="hash">{shortHash(draft.policy.policy_manifest_hash)}</code> <span className="faint">2026-09-synthetic</span>
        </dd>
        <dt>commitment</dt>
        <dd>
          <code className="hash">{shortHash(draft.inference.content_commitment)}</code>
        </dd>
      </dl>

      <div className="btn-row">
        <button type="button" className="btn btn--blue" onClick={onIssue} disabled={stale || busy}>
          {issuing ? '발급 중' : '영수증 발급'}
        </button>
      </div>
      <p className="muted small">영수증을 발급해야 기록이 남습니다. 발급 후 약 20초 동안 배치 포함, 트랜잭션 제출, 블록 확인을 거칩니다.</p>
    </div>
  )
}
