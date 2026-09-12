import { useEffect, useState } from 'react'
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

/** 검증 단계를 하나씩 드러낸 뒤 결과 코드를 보여준다. 확정 전에는 VALID를 표시하지 않는다. */
export function VerifyReportView({ report }: { report: VerifyReport }) {
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(report.steps.length)
      return
    }
    setVisible(0)
    const timers = report.steps.map((_, i) => window.setTimeout(() => setVisible(i + 1), 170 * (i + 1)))
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [report])

  const done = visible >= report.steps.length
  const info = CODE_INFO[report.code]

  return (
    <div className="report">
      <div className={`verdict verdict--${done ? info.tone : 'neutral'}`} aria-live="polite">
        <p className="verdict__code">{done ? report.code : '확인 중'}</p>
        <p className="verdict__title">{done ? info.title : '단계별로 다시 계산하고 있습니다'}</p>
        {done && <p className="verdict__desc">{info.description}</p>}
      </div>

      <ol className="checklist">
        {report.steps.map((step, i) => (
          <li key={step.id} className={`check-row check-row--${step.state}${i < visible ? ' is-shown' : ''}`}>
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

      {done && report.code === 'HASH_MISMATCH' && report.claimedHash && report.recomputedHash && (
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

      {done && (
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
