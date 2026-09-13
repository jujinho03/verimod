import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { useAppState, useStore } from '../store/context'

function useScrollOnNavigate() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }
    let id: string
    try { id = decodeURIComponent(hash.slice(1)) } catch { return }
    let tries = 12
    let timer = 0
    const attempt = () => {
      const target = document.getElementById(id)
      if (target) {
        const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
      } else if (tries-- > 0) {
        timer = window.setTimeout(attempt, 60)
      }
    }
    attempt()
    return () => window.clearTimeout(timer)
  }, [pathname, hash])
}

function SyntheticNotice() {
  return (
    <div className="band notice" data-tone="dark">
      <div className="frame">
        <span className="notice__tag mono">Prototype mode</span>
        <p>
          Synthetic moderation · Simulated ledger. 점수와 anchor는 simulation이며 영수증 해시·Merkle 증명은 브라우저에서 실제 계산합니다.{' '}
          <Link to="/protocol#simulation" className="arrow-link" style={{ display: 'inline' }}>
            무엇이 합성인가요
          </Link>
        </p>
      </div>
    </div>
  )
}

export function Layout() {
  const store = useStore()
  useAppState()
  useScrollOnNavigate()

  return (
    <>
      <a className="skip-link" href="#main">
        본문으로 건너뛰기
      </a>
      <SiteHeader />
      <SyntheticNotice />
      {store.recoveryReason && <div className="band notice" data-tone="white" role="alert"><div className="frame"><p>{store.recoveryReason} <Link to="/receipts#reset">초기화 안내</Link></p></div></div>}
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter />
    </>
  )
}
