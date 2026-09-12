import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight } from './icons'

export function MediaCard({ to, label, title, art }: { to: string; label: string; title: string; art: ReactNode }) {
  return (
    <Link to={to} className="media-card">
      <div className="media-card__art">
        <div className="art">{art}</div>
        <span className="media-card__badge" aria-hidden>
          <ArrowUpRight />
        </span>
      </div>
      <span className="media-card__label mono">{label}</span>
      <span className="media-card__title">{title}</span>
    </Link>
  )
}
