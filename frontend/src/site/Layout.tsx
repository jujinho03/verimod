import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

function useScrollOnNavigate() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }
    const id = decodeURIComponent(hash.slice(1))
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
        <span className="notice__tag mono">시험 버전</span>
        <p>
          점수와 블록체인 기록은 합성 데이터입니다. 영수증 해시·Merkle 증명·검증은 이 브라우저에서 실제로 계산합니다.{' '}
          <Link to="/protocol#simulation" className="arrow-link" style={{ display: 'inline' }}>
            무엇이 합성인가요
          </Link>
        </p>
      </div>
    </div>
  )
}

export function Layout() {
  const { pathname } = useLocation()
  useScrollOnNavigate()

  return (
    <>
      <a className="skip-link" href="#main">
        본문으로 건너뛰기
      </a>
      <SiteHeader />
      {pathname !== '/' && <SyntheticNotice />}
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <SiteFooter />
    </>
  )
}
