import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { useAppState, useStore } from '../store/context'
import { VerificationModeNotice } from '../features/VerificationModeNotice'
import { baseSepoliaProfileFromEnv } from '../domain/rpcLedger'

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
  const { pathname, search } = useLocation()
  const mode = pathname === '/verify' ? new URLSearchParams(search).get('profile') === 'BASE_SEPOLIA_DEMO' && baseSepoliaProfileFromEnv(import.meta.env)
    ? 'BASE_SEPOLIA_DEMO' : 'SYNTHETIC_LOCAL' : pathname.startsWith('/receipts') || pathname === '/review' ? 'SYNTHETIC_LOCAL' : 'SERVICE'
  return <VerificationModeNotice mode={mode} />
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
