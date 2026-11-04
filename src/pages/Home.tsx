import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FloatingIcon } from '../components/FloatingIcon'
import { Icon3D } from '../components/Icon3D'
import { KineticBand } from '../components/Kinetic'
import { ThemeToggle } from '../components/ThemeToggle'
import { Modal } from '../components/ui'

export function Home() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [introOpen, setIntroOpen] = useState(false)
  return <div className="page home home--link">
    <KineticBand rows={['DECIDE · PROVE · VERIFY · ', '판정 · 영수증 · 검증 · ']} />
    <div className="home__topbar"><button type="button" className="topbar__help" onClick={() => setIntroOpen(true)} aria-label="VeriMod 전체 흐름 보기">?</button><ThemeToggle /><span className="home__topbar-spacer" /></div>
    <div className="home__hero">
      <FloatingIcon><Icon3D src="receipt" size={78} /></FloatingIcon>
      <h1 className="home__title">댓글을 쓰고<br />AI 판정서를 받아보세요</h1>
      <p className="home__subtitle">VeriMod가 적용된 가상 커뮤니티에 댓글을 게시하면 실제 AI 판정과 영수증 발급이 이어집니다.</p>
    </div>
    <form className="home-link" onSubmit={(event) => { event.preventDefault(); if (text.trim()) navigate('/comment', { state: { draft: text.trim(), submit: true, idempotencyKey: crypto.randomUUID() } }) }}>
      <label htmlFor="home-comment" className="vlabel">댓글 작성</label>
      <textarea id="home-comment" className="vinput vtextarea" placeholder="댓글을 입력하세요" value={text} onChange={(event) => setText(event.target.value)} />
      <button type="submit" className="btn-primary home-link__go" disabled={!text.trim()}>게시하고 AI 판정받기</button>
      <button type="button" className="link-button home-link__alt" onClick={() => navigate('/analyze')}>영상 댓글 일괄 분석</button>
      <button type="button" className="link-button home-link__alt" onClick={() => navigate('/verify')}>영수증 ID로 다시 검증하기</button>
    </form>
    <p className="home__footer">© 2026 VeriMod · 팀 HTTP 451</p>
    {introOpen && <Modal title="댓글 하나가 영수증이 되기까지" onClose={() => setIntroOpen(false)}><p>댓글 작성 → 실제 R01 AI 판정 → 영수증 발급 → 온체인 등록 → 나중에 영수증 링크로 독립 검증</p><p>영상 댓글 일괄 분석은 보조 기능입니다.</p></Modal>}
  </div>
}
