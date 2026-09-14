import { LABEL_NAMES, thresholdsOf } from '../domain/manifests'
import { LABEL_IDS, type ScoresPpm } from '../domain/types'
import { formatPpm } from '../ui/format'

export function ScoreBars({ scores }: { scores: ScoresPpm }) {
  return (
    <div className="score-bars">
      {LABEL_IDS.map((label) => {
        const value = scores[label]
        const t = thresholdsOf(label)
        const level = value >= t.restrict ? 'restrict' : value >= t.review ? 'review' : 'none'
        return (
          <div className={`score-row score-row--${level}`} key={label}>
            <span className="score-row__label">{LABEL_NAMES[label]}</span>
            <div
              className="score-row__rail"
              role="img"
              aria-label={`${LABEL_NAMES[label]} 점수 ${formatPpm(value)}, 검토 기준 ${formatPpm(t.review)}, 제한 기준 ${formatPpm(t.restrict)}`}
            >
              <i className="score-row__fill" style={{ width: `${value / 10_000}%` }} />
              <b className="score-row__tick" style={{ left: `${t.review / 10_000}%` }} />
              <b className="score-row__tick score-row__tick--restrict" style={{ left: `${t.restrict / 10_000}%` }} />
            </div>
            <code className="score-row__value">{formatPpm(value)}</code>
          </div>
        )
      })}
      <div className="score-legend mono faint">
        <span>
          <b className="legend-tick" /> 검토 기준
        </span>
        <span>
          <b className="legend-tick legend-tick--restrict" /> 제한 기준
        </span>
        <span>단위 ppm · 보정하지 않은 합성 점수</span>
      </div>
    </div>
  )
}
