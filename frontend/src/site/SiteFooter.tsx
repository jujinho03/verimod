import { Link } from 'react-router'
import { LogoMark } from '../ui/icons'
import { REPO_URL } from './nav'

const GROUPS: { label: string; links: { to: string; title: string; external?: boolean; badge?: string }[] }[] = [
  {
    label: '기능',
    links: [
      { to: '/check', title: '판정 요청' },
      { to: '/receipts', title: '내 영수증' },
      { to: '/verify', title: '영수증 검증' },
      { to: '/verify#tamper', title: '변조 테스트' },
      { to: '/review', title: '검토 콘솔' },
    ],
  },
  {
    label: '프로토콜',
    links: [
      { to: '/protocol#receipt', title: '영수증 형식' },
      { to: '/protocol#hash', title: '해시와 Merkle' },
      { to: '/protocol#anchor', title: '앵커와 신뢰 설정' },
      { to: '/protocol#codes', title: '검증 결과 코드' },
      { to: '/protocol#simulation', title: '합성 요소', badge: '필독' },
    ],
  },
  {
    label: '자료',
    links: [
      { to: '/#faq', title: '자주 묻는 질문' },
      { to: '/#scope', title: '보장 범위와 한계' },
      { to: `${REPO_URL}/blob/main/docs/08-submission-guide.md`, title: '실행 안내', external: true },
      { to: REPO_URL, title: 'GitHub 저장소', external: true },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="band" data-tone="dark">
        <div className="frame">
          <div className="site-footer__brand">
            <LogoMark className="brand__mark" />
            <p>판정 기록의 무결성을 검증합니다. W4 공개 앵커와 새 R01 추론은 별도 사례입니다.</p>
            <p className="mono faint">Team HTTP 451 · BLOCK AI 2026</p>
          </div>
          <div className="site-footer__links">
            {GROUPS.map((group) => (
              <div className="footer-group" key={group.label}>
                <h2 className="mono">{group.label}</h2>
                {group.links.map((link) =>
                  link.external ? (
                    <a key={link.to} href={link.to} target="_blank" rel="noreferrer">
                      {link.title}
                    </a>
                  ) : (
                    <Link key={link.to} to={link.to}>
                      {link.title}
                      {link.badge && <span className="badge-new">{link.badge}</span>}
                    </Link>
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="band site-footer__base" data-tone="dark">
        <div className="band band--gap-top" data-tone="dark">
          <div className="frame">
            <span>기본 Lifecycle은 합성 데모입니다. W4 공개 검증과 R01 실제 추론은 별도 경로입니다.</span>
            <span>무결성 확인은 판정의 정확성·공정성을 증명하지 않습니다.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
