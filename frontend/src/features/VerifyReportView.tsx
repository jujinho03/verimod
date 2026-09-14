import type { StepState, VerifyReport } from '../domain/verify'
import { StatusBadge } from '../ui/bits'
import { CODE_INFO, SIDE_INFO, STEP_LABEL } from '../ui/format'
import { CheckIcon, CrossIcon } from '../ui/icons'

const SIDE_TITLE = {
  manifest: '모델·정책 manifest',
  content: '원문 commitment',
  lifecycle: '이의제기·검토 연결',
} as const

function StepIcon({ state }: { state: StepState }) {
  return (
    <span className={`check-row__icon check-row__icon--${state}`} aria-hidden>
      {state === 'PASSED' && <CheckIcon />}
      {state === 'FAILED' && <CrossIcon />}
    </span>
  )
}

const STATE_TEXT: Record<StepState, string> = { PASSED: '통과', FAILED: '실패', PENDING: '대기', SKIPPED: '건너뜀' }

/** 완료된 검증 결과를 지연 없이 표시한다. 검증 중 상태는 호출자가 관리한다. */
export function VerifyReportView({ report }: { report: VerifyReport }) {
  const info = CODE_INFO[report.code]

  return (
    <div className="report">
      <div className={`verdict verdict--${info.tone}`} aria-live="polite">
        <p className="verdict__code">{report.code}</p>
        <p className="verdict__title">{info.title}</p>
        <p className="verdict__desc">{info.description}</p>
      </div>

      <ol className="checklist">
        {report.steps.map((step) => (
          <li key={step.id} className={`check-row check-row--${step.state} is-shown`}>
            <StepIcon state={step.state} />
            <div>
              <p className="check-row__title">
                {STEP_LABEL[step.id]}
                <span className="sr-only"> {STATE_TEXT[step.state]}</span>
              </p>
              <p className="check-row__detail">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      {report.code === 'HASH_MISMATCH' && report.claimedHash && report.recomputedHash && (
        <dl className="kv hash-compare">
          <dt>영수증에 적힌 해시</dt>
          <dd>
            <code className="hash">{report.claimedHash}</code>
          </dd>
          <dt>본문으로 계산한 해시</dt>
          <dd>
            <code className="hash is-bad">{report.recomputedHash}</code>
          </dd>
        </dl>
      )}

      {(
        <dl className="side-checks">
          {(['manifest', 'content', 'lifecycle'] as const).map((key) => (
            <div className="side-row" key={key}>
              <dt>{SIDE_TITLE[key]}</dt>
              <dd>
                <StatusBadge tone={SIDE_INFO[report[key].state].tone}>{SIDE_INFO[report[key].state].label}</StatusBadge>
                <span>{report[key].detail}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
