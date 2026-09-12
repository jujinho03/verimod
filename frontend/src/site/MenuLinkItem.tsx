import { Link } from 'react-router'
import type { MenuLink } from './nav'

export function MenuLinkItem({ link, onNavigate }: { link: MenuLink; onNavigate: () => void }) {
  const Icon = link.icon
  const content = (
    <>
      <Icon className="menu-item__icon" />
      <span>
        <span className="menu-item__title">
          {link.title}
          {link.badge && <span className="badge-new">{link.badge}</span>}
        </span>
        <span className="menu-item__desc">{link.desc}</span>
      </span>
    </>
  )
  if (link.external) {
    return (
      <a className="menu-item" href={link.to} target="_blank" rel="noreferrer" onClick={onNavigate}>
        {content}
      </a>
    )
  }
  return (
    <Link className="menu-item" to={link.to} onClick={onNavigate}>
      {content}
    </Link>
  )
}
