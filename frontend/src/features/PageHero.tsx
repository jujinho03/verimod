import type { ReactNode } from 'react'

/** 기능 페이지 머리: 왼쪽 큰 제목, 오른쪽 아래 설명과 행동 (chain.link 히어로의 좌우 배치). */
export function PageHero({ label, title, children, tone = 'dark' }: { label: string; title: ReactNode; children?: ReactNode; tone?: 'dark' | 'blue' }) {
  return (
    <>
      <section className="band page-hero" data-tone={tone}>
        <div className="frame page-hero__frame">
          <div className="page-hero__main">
            <p className="mono faint">{label}</p>
            <h1 className="title-xl">{title}</h1>
          </div>
          {children && <div className="page-hero__aside">{children}</div>}
        </div>
      </section>
      {/* 홈처럼 세로 기준선을 이어가며 숨 쉬는 빈 행 */}
      <div className="band band--gap" data-tone={tone}>
        <div className="frame" />
      </div>
    </>
  )
}

export function DetailSection({ title, aside, note, children, id }: { title: string; aside?: ReactNode; note?: string; children: ReactNode; id?: string }) {
  return (
    <section className="detail-section" id={id}>
      <header className="detail-section__head">
        <h2 className="title-s">{title}</h2>
        {aside}
      </header>
      {note && <p className="muted detail-section__note">{note}</p>}
      {children}
    </section>
  )
}
