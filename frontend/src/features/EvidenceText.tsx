import type { ReactNode } from 'react'
import { LABEL_NAMES } from '../domain/manifests'
import type { EvidenceSpan } from '../domain/types'

/** 원문 위에 근거 구간을 표시한다. 위치는 Unicode code point 기준이다. */
export function EvidenceText({ text, evidence, truncatedAt }: { text: string; evidence: EvidenceSpan[]; truncatedAt?: number }) {
  const chars = Array.from(text)
  const limit = Math.min(truncatedAt ?? chars.length, chars.length)
  const parts: ReactNode[] = []
  let cursor = 0

  const plain = (from: number, to: number) => {
    if (to <= from) return
    const cut = Math.max(from, Math.min(to, limit))
    if (cut > from) parts.push(<span key={`p${from}`}>{chars.slice(from, cut).join('')}</span>)
    if (to > cut) parts.push(<span key={`c${cut}`} className="evidence-cut">{chars.slice(cut, to).join('')}</span>)
  }

  for (const span of [...evidence].sort((a, b) => a.start - b.start)) {
    if (span.start < cursor || span.end > chars.length) continue
    plain(cursor, span.start)
    parts.push(
      <mark key={`m${span.start}-${span.label_id}`} className="evidence" title={`${LABEL_NAMES[span.label_id]} · ${span.method_id} ${span.method_version}`}>
        {chars.slice(span.start, span.end).join('')}
        <span className="evidence__label mono">{LABEL_NAMES[span.label_id]}</span>
      </mark>,
    )
    cursor = span.end
  }
  plain(cursor, chars.length)

  return (
    <div className="evidence-block">
      <p className="evidence-text">{parts}</p>
      {limit < chars.length && <p className="mono faint">흐리게 표시한 {chars.length - limit}자는 입력 제한을 넘어 점수에 쓰지 않았습니다</p>}
    </div>
  )
}
