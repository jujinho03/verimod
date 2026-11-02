import type { StepState, VerifyReport } from '../domain/verify'
import { StatusBadge } from '../ui/bits'
import type { StatusTone } from '../ui/format'
import { toW3VerificationStages } from './verificationStages'

const TONE: Record<StepState, StatusTone> = {
  PASSED: 'pass',
  FAILED: 'fail',
  PENDING: 'pending',
  SKIPPED: 'neutral',
}

const LABEL: Record<StepState, string> = {
  PASSED: '통과',
  FAILED: '실패',
  PENDING: '보류',
  SKIPPED: '미실행',
}

export function VerificationStagePanel({ report }: { report?: VerifyReport | null }) {
  const stages = toW3VerificationStages(report ?? null)
  return (
    <section className="verification-design" aria-labelledby="verification-design-title">
      <header className="verification-design__head">
        <div>
          <p className="mono faint">검증 단계 상세</p>
          <h2 className="title-s" id="verification-design-title">어디서 멈췄는지 단계별로 표시</h2>
        </div>
      </header>
      <ol className="verification-design__list">
        {stages.map((stage, index) => (
          <li key={stage.id} className={`verification-design__step verification-design__step--${stage.state}`}>
            <span className="verification-design__number">{index + 1}</span>
            <div>
              <code>{stage.formula}</code>
              <p>{stage.title}</p>
              <span className="muted small">{stage.detail}</span>
            </div>
            <StatusBadge tone={TONE[stage.state]}>{LABEL[stage.state]}</StatusBadge>
          </li>
        ))}
      </ol>
      <p className="muted small">RPC 오류 시 포함 증명은 미실행으로 표시하며 변조 여부를 판정하지 않습니다. L2 블록 확인은 L1 finality가 아닙니다.</p>
    </section>
  )
}
