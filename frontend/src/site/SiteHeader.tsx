import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { ChevronDown, CloseIcon, LogoMark, MenuIcon, SearchIcon } from '../ui/icons'
import { MenuLinkItem } from './MenuLinkItem'
import { MobileMenu } from './MobileMenu'
import { MENUS } from './nav'
import { SearchDialog } from './SearchDialog'

type Tone = 'white' | 'mist' | 'dark' | 'blue'

/** 헤더 바로 아래에 있는 섹션의 data-tone을 읽어 헤더 색을 맞춘다 (chain.link의 u-theme 전환). */
function useToneBelow(headerRef: RefObject<HTMLElement | null>, routeKey: string): Tone {
  const [tone, setTone] = useState<Tone>('dark')

  useEffect(() => {
    let frame = 0
    const measure = () => {
      frame = 0
      const header = headerRef.current
      if (!header) return
      const y = header.getBoundingClientRect().bottom + 1
      for (const element of document.elementsFromPoint(window.innerWidth / 2, y)) {
        if (header.contains(element) || element.closest('.mega, .mobile-menu, .search')) continue
        const band = element.closest<HTMLElement>('[data-tone]')
        if (band) {
          setTone(band.dataset.tone as Tone)
          return
        }
      }
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure)
    }
    measure()
    const settle = window.setTimeout(measure, 80)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(settle)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [headerRef, routeKey])

  return tone
}

export function SiteHeader() {
  const { pathname, search, hash } = useLocation()
  const headerRef = useRef<HTMLElement>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [shownId, setShownId] = useState(MENUS[0].id)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const toneBelow = useToneBelow(headerRef, pathname + search)
  const tone = mobileOpen ? 'white' : toneBelow

  const closeMenus = useCallback(() => {
    setOpenId(null)
    setMobileOpen(false)
  }, [])

  useEffect(() => {
    closeMenus()
  }, [pathname, search, hash, closeMenus])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenus()
      const target = event.target
      const typing = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      if ((event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey)) || (event.key === '/' && !typing)) {
        event.preventDefault()
        closeMenus()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeMenus])

  useEffect(() => {
    document.documentElement.style.overflow = mobileOpen || searchOpen ? 'hidden' : ''
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [mobileOpen, searchOpen])

  const toggleMenu = (id: string) => {
    setShownId(id)
    setOpenId((current) => (current === id ? null : id))
  }

  const shown = MENUS.find((menu) => menu.id === (openId ?? shownId)) ?? MENUS[0]

  return (
    <>
      <header ref={headerRef} className="site-header" data-tone={tone}>
        <div className="site-header__inner">
          <Link to="/" className="brand" aria-label="VeriMod 홈">
            <LogoMark className="brand__mark" />
            <span>VeriMod</span>
          </Link>

          <nav className={`primary-nav${openId ? ' has-open' : ''}`} aria-label="주요 메뉴">
            {MENUS.map((menu) => (
              <button
                key={menu.id}
                type="button"
                className="nav-trigger"
                aria-expanded={openId === menu.id}
                aria-controls="mega-panel"
                onClick={() => toggleMenu(menu.id)}
              >
                {menu.label}
                <ChevronDown className="chevron" />
              </button>
            ))}
            <NavLink to="/receipts" className="nav-link">
              내 영수증
            </NavLink>
          </nav>

          <div className="site-header__actions">
            <button
              type="button"
              className="icon-button"
              aria-label="검색 열기"
              title="검색 (Ctrl+K)"
              onClick={() => {
                closeMenus()
                setSearchOpen(true)
              }}
            >
              <SearchIcon />
            </button>
            <Link to="/verify" className="btn btn--outline btn--compact">
              영수증 검증하기
            </Link>
            <button
              type="button"
              className="icon-button menu-toggle"
              aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      <div className={`mega${openId ? ' is-open' : ''}`} aria-hidden={!openId}>
        <div className="mega__scrim" onClick={() => setOpenId(null)} />
        <nav id="mega-panel" className="mega__panel" aria-label={`${shown.label} 메뉴`}>
          {shown.columns.map((column, i) => (
            <div className="mega__col" key={column.label}>
              <div className="menu-label">{column.label}</div>
              <div className="mega__items">
                {column.links.map((link) => (
                  <MenuLinkItem key={link.to + link.title} link={link} onNavigate={closeMenus} />
                ))}
              </div>
              {i === 0 && shown.foot && (
                <div className="mega__foot">
                  <MenuLinkItem link={shown.foot} onNavigate={closeMenus} />
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <MobileMenu open={mobileOpen} onNavigate={closeMenus} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
