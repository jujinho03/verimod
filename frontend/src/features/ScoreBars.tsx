import { LABEL_NAMES, thresholdsOf } from '../domain/manifests'
import { LABEL_IDS, type AnyScoresPpm } from '../domain/types'
import { formatPpm } from '../ui/format'

const BEEP_NAMES: Record<string, string> = { hate: '혐오', offensive: '공격적 표현' }

export function ScoreBars({ scores }: { scores: AnyScoresPpm }) {
  const labels = Object.keys(scores)
  const legacy = labels.length === LABEL_IDS.length && LABEL_IDS.every((label) => Object.hasOwn(scores, label))
  return (
    <div className="score-bars">
      {labels.map((label) => {
        const value = (scores as Record<string, number>)[label]
        const t = legacy ? thresholdsOf(label as (typeof LABEL_IDS)[number]) : null
        const level = t ? (value >= t.restrict ? 'restrict' : value >= t.review ? 'review' : 'none') : 'none'
        const name = BEEP_NAMES[label] ?? LABEL_NAMES[label as (typeof LABEL_IDS)[number]] ?? label
        return (
          <div className={`score-row score-row--${level}`} key={label}>
            <span className="score-row__label">{name}</span>
            <div
              className="score-row__rail"
              role="img"
              aria-label={t ? `${name} 점수 ${formatPpm(value)}, 검토 기준 ${formatPpm(t.review)}, 제한 기준 ${formatPpm(t.restrict)}` : `${name} 점수 ${formatPpm(value)}`}
            >
              <i className="score-row__fill" style={{ width: `${value / 10_000}%` }} />
              {t && <><b className="score-row__tick" style={{ left: `${t.review / 10_000}%` }} /><b className="score-row__tick score-row__tick--restrict" style={{ left: `${t.restrict / 10_000}%` }} /></>}
            </div>
            <code className="score-row__value">{formatPpm(value)}</code>
          </div>
        )
      })}
      <div className="score-legend mono faint">
        {legacy ? <>
        <span>
          <b className="legend-tick" /> 검토 기준
        </span>
        <span>
          <b className="legend-tick legend-tick--restrict" /> 제한 기준
        </span>
        <span>단위 ppm · 보정하지 않은 합성 점수</span>
        </> : <span>단위 ppm · 실제 모델 score와 정책 조치는 별도 계층입니다</span>}
      </div>
    </div>
  )
}
