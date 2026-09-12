import { REQUIRED_CONFIRMATIONS } from '../domain/verify'
import type { AnchorStatus } from '../store/ledger'
import { STAGE_LABEL, STAGE_ORDER } from '../ui/format'

export function AnchorProgress({ status }: { status: AnchorStatus }) {
  const current = STAGE_ORDER.indexOf(status.stage)
  const finished = status.stage === 'ANCHORED'
  return (
    <ol className="stages" aria-label="봉인 단계">
      {STAGE_ORDER.map((stage, i) => {
        const done = finished || i < current
        const active = !finished && i === current
        return (
          <li key={stage} className={`stage${done ? ' is-done' : ''}${active ? ' is-current' : ''}`} aria-current={active ? 'step' : undefined}>
            <span className="mono stage__index">0{i + 1}</span>
            <span className="stage__name">
              {STAGE_LABEL[stage]}
              {stage === 'CONFIRMING' && (active || finished) && (
                <span className="stage__count mono">
                  {finished ? `${REQUIRED_CONFIRMATIONS}+` : status.confirmations}/{REQUIRED_CONFIRMATIONS}
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
