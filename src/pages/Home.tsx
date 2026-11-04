import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { FloatingIcon } from '../components/FloatingIcon'
import { Icon3D } from '../components/Icon3D'
import { KineticBand } from '../components/Kinetic'
import { ThemeToggle } from '../components/ThemeToggle'
import { ArrowIcon } from '../components/ui'

const MAIN_FLOW = [
  { icon: 'chat-bubble', label: '01 · 댓글 작성', title: '평소처럼 댓글을 게시해요', detail: 'VeriMod가 적용된 댓글창에서 문장을 입력하면 실제 판정 절차가 바로 시작됩니다.' },
  { icon: 'gear', label: '02 · AI 판정', title: 'R01 모델과 정책이 판단해요', detail: '고정된 모델과 정책이 허용·검토·제한을 결정하고 근거 코드와 발동 규칙을 남깁니다.' },
  { icon: 'receipt', label: '03 · 영수증 발급', title: '판정 결과가 영수증이 돼요', detail: '모델·정책·점수·콘텐츠 commitment를 담은 검증 가능한 판정 영수증을 발급합니다.' },
  { icon: 'chains', label: '04 · 자동 온체인 등록', title: '묶어서 Base Sepolia에 등록해요', detail: 'Signer Worker가 Epoch를 자동 전송하고 12회 확인이 끝날 때까지 실제 상태를 갱신합니다.' },
  { icon: 'shield', label: '05 · 독립 검증', title: '링크로 언제든 다시 확인해요', detail: '영수증 링크에서 해시·포함 증명·신뢰 앵커·블록 확정을 브라우저가 직접 검증합니다.' },
] as const

function MainFlowGuide({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const reduce = useReducedMotion()
  const item = MAIN_FLOW[index]
  const next = () => setIndex((value) => (value + 1) % MAIN_FLOW.length)
  const previous = () => setIndex((value) => (value - 1 + MAIN_FLOW.length) % MAIN_FLOW.length)
  useEffect(() => {
    if (reduce) return
    const timer = window.setTimeout(next, 4200)
    return () => window.clearTimeout(timer)
  }, [index, reduce])
  return createPortal(<AnimatePresence><motion.div className="anchor-alert__overlay" role="presentation" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <motion.section className="anchor-alert" role="dialog" aria-modal="true" aria-labelledby="main-flow-title" initial={reduce ? false : { opacity: 0, y: 24, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
      <div className="anchor-alert__head"><div><span className="section-label">VERIMOD · 전체 흐름</span><h2 id="main-flow-title">댓글 하나가 검증되기까지</h2></div><div className="anchor-alert__head-actions"><span className="anchor-alert__counter">{index + 1} / {MAIN_FLOW.length}</span><button type="button" className="anchor-alert__close" onClick={onClose} aria-label="안내 닫기">×</button></div></div>
      <div className="anchor-alert__rail">{MAIN_FLOW.map((stage, stageIndex) => <button type="button" aria-label={`${stageIndex + 1}단계 보기`} onClick={() => setIndex(stageIndex)} key={stage.label} className={`anchor-alert__dot${stageIndex === index ? ' anchor-alert__dot--active' : stageIndex < index ? ' anchor-alert__dot--done' : ''}`} />)}</div>
      <div className="anchor-alert__viewport" aria-live="polite"><AnimatePresence mode="wait" initial={false}><motion.div key={item.label} className="anchor-alert__slide" initial={reduce ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={reduce ? undefined : { opacity: 0, x: -24 }}><div className="anchor-alert__art"><Icon3D src={item.icon} size={70} /></div><div className="anchor-alert__copy"><span>{item.label}</span><strong>{item.title}</strong><p>{item.detail}</p></div></motion.div></AnimatePresence></div>
      <div className="anchor-alert__footer"><button type="button" className="anchor-alert__previous" onClick={previous} aria-label="이전 안내 단계"><ArrowIcon direction="left" size={22} /></button><span className="anchor-alert__timer"><i key={index} /></span><button type="button" className="anchor-alert__next" onClick={next} aria-label="다음 안내 단계"><ArrowIcon size={26} /></button></div>
      <p className="anchor-alert__notice"><b>실제 동작 흐름입니다.</b> 발급 후 자동 등록 상태는 영수증에서 실시간으로 확인할 수 있어요.</p>
    </motion.section>
  </motion.div></AnimatePresence>, document.body)
}

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
    {introOpen && <MainFlowGuide onClose={() => setIntroOpen(false)} />}
  </div>
}
