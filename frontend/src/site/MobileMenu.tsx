import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown } from '../ui/icons'
import { MenuLinkItem } from './MenuLinkItem'
import { MENUS } from './nav'

export function MobileMenu({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div id="mobile-menu" className={`mobile-menu${open ? ' is-open' : ''}`} aria-hidden={!open} inert={!open}>
      <nav className="mobile-menu__scroll" aria-label="모바일 메뉴">
        {MENUS.map((menu) => {
          const isOpen = expanded === menu.id
          return (
            <div key={menu.id}>
              <button
                type="button"
                className="mobile-menu__trigger"
                aria-expanded={isOpen}
                onClick={() => setExpanded(isOpen ? null : menu.id)}
              >
                {menu.label}
                <ChevronDown className="chevron" />
              </button>
              <div className={`collapse${isOpen ? ' is-open' : ''}`} inert={!isOpen}>
                <div>
                  {menu.foot && <MenuLinkItem link={menu.foot} onNavigate={onNavigate} />}
                  {menu.columns.map((column) => (
                    <div key={column.label}>
                      <div className="menu-label">{column.label}</div>
                      {column.links.map((link) => (
                        <MenuLinkItem key={link.to + link.title} link={link} onNavigate={onNavigate} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
        <Link to="/receipts" className="mobile-menu__link" onClick={onNavigate}>
          내 영수증
        </Link>
      </nav>
      <div className="mobile-menu__cta">
        <Link to="/check" className="btn btn--blue" onClick={onNavigate}>
          판정 요청하기
        </Link>
        <Link to="/verify" className="btn btn--outline" onClick={onNavigate}>
          영수증 검증하기
        </Link>
      </div>
    </div>
  )
}
