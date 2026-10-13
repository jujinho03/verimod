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
          <p className="mono faint">W3 검증 단계 상세</p>
          <h2 className="title-s" id="verification-design-title">어디서 멈췄는지 단계별로 표시</h2>
        </div>
        <span className="pill pill--synthetic">UI consumer</span>
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
      <p className="muted small">RPC 오류는 보류로 표시하며 변조로 판정하지 않습니다. 계산은 shared protocol consumer 결과를 사용합니다.</p>
    </section>
  )
}
