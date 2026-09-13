import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { REPO_URL } from '../../site/nav'
import { Accordion } from '../../ui/Accordion'
import { ArrowLink } from '../../ui/bits'
import { ArrowUpRight, CheckIcon, ChevronLeft, ChevronRight, CrossIcon } from '../../ui/icons'
import { Marquee } from '../../ui/Marquee'
import { MediaCard } from '../../ui/MediaCard'
import { Reveal } from '../../ui/Reveal'
import { Tabs } from '../../ui/Tabs'
import { useCarousel } from '../../ui/useCarousel'
import { AppealArt, CtaArt, DecideArt, PipelineDiagram, ReceiptArt, RoleArt, TamperArt } from './art'
import { ChecklistVisual, MerkleVisual, ReceiptVisual, ScoresVisual, TamperVisual, TimelineVisual } from './FlowVisuals'
import { HashBand } from './HashBand'
import { HeroTicker } from './HeroTicker'

function Hero() {
  return (
    <section className="band hero" data-tone="blue">
      <div className="frame hero__frame">
        <h1 className="sr-only">VeriMod: AI 콘텐츠 판정 기록을 이용자가 직접 검증하는 프로토콜</h1>
        <div className="hero__stage">
          <span className="hero__fixed display" aria-hidden>
            VERIFY
          </span>
          <HeroTicker />
        </div>
        <div className="hero__aside">
          <p>
            AI가 콘텐츠를 제한한 판정과 근거를 영수증으로 받고, 외부 원장에 고정된 기록과 직접 대조합니다. 이의제기와 사람 검토도 같은 기록에 이어집니다.
          </p>
          <div className="btn-row">
            <Link to="/check" className="btn btn--navy">
              판정 요청하기
            </Link>
            <Link to="/verify" className="btn btn--outline">
              영수증 검증하기
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

const BACKGROUND = [
  ['규제 배경', 'EU DSA'],
  ['규제 배경', 'EU AI Act'],
  ['규제 배경', '한국 AI 기본법'],
  ['직렬화', 'RFC 8785'],
  ['Merkle', 'RFC 9162'],
  ['해시', 'SHA-256'],
  ['원장 후보', 'EVM testnet'],
]

function Background() {
  return (
    <section className="band" data-tone="mist" id="background" aria-labelledby="background-title">
      <h2 id="background-title" className="sr-only">
        규제와 표준 배경
      </h2>
      <div className="frame">
        <Marquee label="참고한 규제와 표준">
          {BACKGROUND.map(([kind, name]) => (
            <div className="marquee-item" key={name}>
              <span className="mono faint">{kind}</span>
              <span className="marquee-item__name">{name}</span>
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  )
}

function Highlights() {
  const cards = [
    { to: '/check', label: 'Decide', title: '문장을 넣으면 항목별 점수와 조치가 나옵니다', art: <DecideArt /> },
    { to: '/receipts', label: 'Prove', title: '판정마다 바뀌지 않는 영수증을 발급하고 원장에 봉인합니다', art: <ReceiptArt /> },
    { to: '/verify#tamper', label: 'Verify', title: '사본의 점수 하나만 바꿔도 원래 앵커 기준 검증에 실패합니다', art: <TamperArt /> },
    { to: '/review', label: 'Appeal', title: '이의제기와 사람 검토가 최초 판정에 새 기록으로 이어집니다', art: <AppealArt /> },
  ]
  return (
    <section className="band" data-tone="mist" aria-label="핵심 기능">
      <div className="frame highlights">
        {cards.map((card, i) => (
          <Reveal key={card.label} delay={i}>
            <MediaCard {...card} />
          </Reveal>
        ))}
        <p className="highlights__note faint">
          위 띠의 규제·표준은 수요 배경과 참고 규격입니다. 법이 VeriMod 도입을 요구한다거나 인증을 받았다는 뜻이 아닙니다.
        </p>
      </div>
    </section>
  )
}

function Platform() {
  return (
    <section className="band" data-tone="dark" aria-labelledby="platform-title">
      <div className="frame platform">
        <div className="platform__text">
          <Reveal as="h2" className="title-l two-tone">
            <span id="platform-title">
              <span className="dim">VeriMod 프로토콜:</span>
              <br />
              판정 기록을 이용자가 직접 대조합니다
            </span>
          </Reveal>
          <Reveal delay={1}>
            <p className="lead">
              AI가 콘텐츠를 분류해 점수를 내고, 정책이 조치를 정합니다. 그 결과를 담은 영수증의 해시를 여러 건씩 Merkle root로 묶어 외부 원장에 기록합니다.
            </p>
          </Reveal>
          <Reveal delay={2}>
            <p className="lead">
              이용자는 플랫폼이 지금 보여주는 DB 값에 기대지 않고, 받은 영수증과 포함 증명으로 원장의 root까지 직접 다시 계산합니다. 블록체인이 보증하는 것은 AI의 정답 여부가 아니라 기록의 일치입니다.
            </p>
          </Reveal>
          <Reveal delay={3}>
            <ArrowLink to="/protocol">프로토콜 규칙 보기</ArrowLink>
          </Reveal>
        </div>
        <Reveal as="figure" className="platform__art" delay={1}>
          <PipelineDiagram />
        </Reveal>
      </div>
    </section>
  )
}

function FlowPane({ visual, title, points, to, cta }: { visual: ReactNode; title: string; points: string[]; to: string; cta: string }) {
  return (
    <div className="flow-pane">
      <div className="flow-pane__card">{visual}</div>
      <div className="flow-pane__text">
        <h3 className="title-s">{title}</h3>
        <ul className="checks">
          {points.map((point) => (
            <li key={point}>
              <CheckIcon />
              {point}
            </li>
          ))}
        </ul>
        <Link to={to} className="btn btn--ink">
          {cta}
        </Link>
      </div>
    </div>
  )
}

function Flow() {
  const items = [
    {
      id: 'decide',
      label: '판정',
      content: (
        <FlowPane
          visual={<ScoresVisual />}
          title="입력한 글에 항목별 점수와 조치를 기록합니다"
          points={['라벨별 점수를 0부터 1,000,000까지의 정수로 기록합니다', '정책 threshold에 따라 승인·검토 보류·제한을 정합니다', '입력이 너무 길면 제한 대신 검토 보류로 보냅니다']}
          to="/check"
          cta="판정 요청하기"
        />
      ),
    },
    {
      id: 'receipt',
      label: '영수증',
      content: (
        <FlowPane
          visual={<ReceiptVisual />}
          title="판정마다 바뀌지 않는 영수증을 발급합니다"
          points={['모델·정책 manifest 해시와 기록 시각을 함께 담습니다', '원문 대신 salt를 더한 commitment만 넣습니다', '해시·증명·앵커 정보는 본문 밖에 따로 붙입니다']}
          to="/receipts"
          cta="내 영수증 보기"
        />
      ),
    },
    {
      id: 'seal',
      label: '봉인',
      content: (
        <FlowPane
          visual={<MerkleVisual />}
          title="여러 영수증을 Merkle root 하나로 묶어 원장에 기록합니다"
          points={['receipt_id 순으로 동결하고 RFC 9162 방식으로 트리를 만듭니다', '합성 원장에는 root·건수·버전·발급자 메타데이터를 기록하며 원문은 제외합니다', '블록 확인이 끝나기 전에는 일치로 표시하지 않습니다']}
          to="/protocol#merkle"
          cta="Merkle 규칙 보기"
        />
      ),
    },
    {
      id: 'verify',
      label: '검증',
      content: (
        <FlowPane
          visual={<ChecklistVisual />}
          title="받은 자료만으로 이용자가 다시 계산합니다"
          points={['본문으로 영수증 해시를 다시 계산합니다', '포함 증명을 따라 root까지 경로를 확인합니다', '미리 정한 체인·컨트랙트의 root와만 비교합니다']}
          to="/verify"
          cta="검증기 열기"
        />
      ),
    },
    {
      id: 'tamper',
      label: '변조 탐지',
      content: (
        <FlowPane
          visual={<TamperVisual />}
          title="사본을 고치면 원래 앵커 기준으로 검증에 실패합니다"
          points={['점수 하나만 바꿔도 HASH_MISMATCH가 나옵니다', '해시까지 새로 적으면 INVALID_PROOF가 나옵니다', 'RPC 장애는 변조로 판단하지 않고 보류로 표시합니다']}
          to="/verify#tamper"
          cta="변조 테스트하기"
        />
      ),
    },
    {
      id: 'appeal',
      label: '이의제기와 검토',
      content: (
        <FlowPane
          visual={<TimelineVisual />}
          title="이의제기와 검토 결과를 새 기록으로 연결합니다"
          points={['원래 판정은 그대로 두고 이의제기 영수증을 추가합니다', '검토자는 조치를 유지하거나 바꾸고 사유를 남깁니다', '선행 기록의 해시와 원장 포함 여부까지 함께 확인합니다']}
          to="/review"
          cta="검토 콘솔 열기"
        />
      ),
    },
  ]
  return (
    <section className="band" data-tone="mist" id="flow" aria-labelledby="flow-title">
      <div className="frame inset flow">
        <Reveal as="h2" className="title-m">
          <span id="flow-title">판정부터 사람 검토까지, 영수증 하나로 이어집니다</span>
        </Reveal>
        <Tabs items={items} label="작동 단계" />
      </div>
    </section>
  )
}

function Scope() {
  const yes = [
    ['기록 일치', '받은 영수증이 발급 당시 원장에 고정된 기록과 같은지 확인합니다.'],
    ['원장 포함', '영수증 해시가 신뢰한 컨트랙트의 epoch root에 포함되는지 확인합니다.'],
    ['이의제기 연결', '이의제기와 검토 기록이 어느 최초 판정에 이어지는지 확인합니다.'],
  ]
  const no = [
    ['판정의 정확성과 공정성', '기록이 일치해도 AI가 옳게 판단했다는 뜻은 아닙니다. 오탐 평가와 사람 검토가 따로 필요합니다.'],
    ['실제 모델 실행', '영수증에 적힌 모델 식별자로 추론이 실제로 실행됐다는 증명은 아닙니다.'],
    ['기록의 완전성', '플랫폼이 처음부터 기록하지 않은 사건이 없다는 것까지 보장하지는 않습니다.'],
  ]
  const list = (rows: string[][], positive: boolean) => (
    <ul className="scope__list">
      {rows.map(([title, body], i) => (
        <Reveal as="li" key={title} delay={i}>
          <span className={`scope__icon${positive ? '' : ' is-no'}`}>{positive ? <CheckIcon /> : <CrossIcon />}</span>
          <div>
            <h4>{title}</h4>
            <p>{body}</p>
          </div>
        </Reveal>
      ))}
    </ul>
  )
  return (
    <section className="band" data-tone="white" id="scope" aria-labelledby="scope-title">
      <div className="frame scope">
        <div className="scope__intro">
          <Reveal as="h2" className="title-m">
            <span id="scope-title">VeriMod가 확인하는 것과 확인하지 않는 것</span>
          </Reveal>
          <Reveal delay={1}>
            <p className="muted">플랫폼의 로컬 데이터 수정 자체를 막는 구조가 아니라, 기준 기록과의 불일치를 찾아내는 구조입니다.</p>
          </Reveal>
        </div>
        <div className="scope__cols">
          <div>
            <p className="mono faint scope__label">확인하는 것</p>
            {list(yes, true)}
          </div>
          <div>
            <p className="mono faint scope__label">확인하지 않는 것</p>
            {list(no, false)}
          </div>
        </div>
      </div>
    </section>
  )
}

const ROLES = [
  { to: '/receipts', tone: 'blue', title: '콘텐츠 작성 이용자', body: '제한 이유와 점수를 확인하고, 영수증을 보관하고, 이의제기합니다', tag: '이용자' },
  { to: '/receipts', tone: 'navy', title: '플랫폼 운영자', body: '같은 형식의 영수증을 발급하고 외부 앵커로 분쟁에 대응합니다', tag: '발급자' },
  { to: '/review', tone: 'teal', title: '사람 검토자', body: '최초 판단과 정책을 보고 조치를 유지하거나 바꿔 기록합니다', tag: '검토' },
  { to: '/verify', tone: 'ink', title: '감사자와 연구자', body: '제공받은 영수증과 증명을 원장의 root와 직접 대조합니다', tag: '검증' },
  { to: '/protocol', tone: 'yellow', title: '개발자', body: '직렬화·해시·Merkle 규칙을 같은 테스트 벡터로 확인합니다', tag: '프로토콜' },
] as const

function People() {
  const carousel = useCarousel(ROLES.length)
  return (
    <section className="band" data-tone="dark" id="people" aria-labelledby="people-title">
      <div className="band band--gap" data-tone="dark">
        <div className="frame" />
      </div>
      <div className="frame people">
        <div className="people__intro">
          <Reveal as="h2" className="title-m">
            <span id="people-title">이 영수증을 쓰는 다섯 주체</span>
          </Reveal>
          <div className="people__controls">
            <ArrowLink to="/review">검토 콘솔 열기</ArrowLink>
            <div className="carousel__nav">
              <button type="button" className="carousel__arrow" onClick={carousel.prev} disabled={!carousel.canPrev} aria-label="이전 카드">
                <ChevronLeft />
              </button>
              <button type="button" className="carousel__arrow" onClick={carousel.next} disabled={!carousel.canNext} aria-label="다음 카드">
                <ChevronRight />
              </button>
            </div>
          </div>
        </div>
        <div className="carousel" ref={carousel.viewportRef}>
          <div className="carousel__track" style={carousel.trackStyle}>
            {ROLES.map((role, i) => (
              <Link key={role.title} to={role.to} className="carousel__item role-card">
                <RoleArt tone={role.tone} title={role.title} index={i + 1} />
                <p className="role-card__body">{role.body}</p>
                <div className="role-card__foot">
                  <span className="pill">{role.tag}</span>
                  <ArrowUpRight className="role-card__arrow" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="band band--gap band--gap-top" data-tone="dark">
        <div className="frame" />
      </div>
    </section>
  )
}

function Faq() {
  const items = [
    {
      id: 'db',
      title: '그냥 DB에 기록하면 안 되나요?',
      body: 'DB는 서비스 운영에 꼭 필요합니다. 외부 앵커는 플랫폼이 지금 보여주는 DB 응답과 별개로, 이용자가 받은 기록을 대조하기 위해 씁니다. 전자서명이나 transparency log 같은 대안도 있으며, 블록체인은 이 프로젝트가 고른 공개 기준점입니다.',
    },
    {
      id: 'why',
      title: '플랫폼은 왜 도입하나요?',
      body: '기록 신뢰, 감사 자료 준비, 분쟁 대응을 개선할 가능성이 있습니다. 실제 비용 절감이나 도입 의사는 아직 검증하지 않았고 실증이 필요합니다.',
    },
    {
      id: 'wrong',
      title: 'AI가 틀리면요?',
      body: '무결성 검증과 판정의 정확성은 다른 문제입니다. 기록이 일치한다는 것은 판정이 옳다는 뜻이 아닙니다. 그래서 오탐 평가, 불확실한 입력의 검토 보류, 이의제기와 사람 검토를 함께 둡니다.',
    },
    {
      id: 'privacy',
      title: '원문이나 개인정보가 원장에 올라가나요?',
      body: '올라가지 않습니다. 원장에는 여러 영수증을 묶은 root와 건수, 버전만 기록합니다. 영수증에도 원문 대신 무작위 salt를 더한 commitment만 넣고, 현재 PoC는 원문과 salt를 이 브라우저 localStorage에 평문 보관하며 인증·접근 통제가 없습니다. 실제 서비스에는 별도 접근 통제가 필요합니다.',
    },
    {
      id: 'inference',
      title: '블록체인이 AI 추론 자체를 검증하나요?',
      body: '아닙니다. VeriMod는 기록의 commitment와 원장 포함 여부를 확인합니다. 모델이 실제로 그렇게 실행됐는지에 대한 증명이나 영지식 추론 검증은 범위 밖입니다.',
    },
  ]
  return (
    <section className="band" data-tone="white" id="faq" aria-labelledby="faq-title">
      <div className="frame faq">
        <div className="faq__intro" data-tone="mist">
          <Reveal as="h2" className="title-m">
            <span id="faq-title">자주 묻는 질문</span>
          </Reveal>
          <Reveal delay={1}>
            <p className="muted">발표와 심사에서 반복해서 받는 질문에 팀이 함께 쓰는 답입니다.</p>
          </Reveal>
          <Reveal delay={2}>
            <ArrowLink to={`${REPO_URL}/blob/main/docs/08-submission-guide.md`} external>
              실행 안내 읽기
            </ArrowLink>
          </Reveal>
        </div>
        <div className="faq__list">
          <Accordion items={items} />
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="band cta" data-tone="blue" aria-labelledby="cta-title">
      <div className="band--gap">
        <div className="frame" />
      </div>
      <div className="frame cta__frame">
        <div className="cta__box" data-tone="dark">
          <div className="cta__text">
            <Reveal as="h2" className="title-l">
              <span id="cta-title">받은 판정, 직접 확인해 보세요</span>
            </Reveal>
            <Reveal delay={1}>
              <Link to="/verify" className="btn btn--blue">
                영수증 검증하기
              </Link>
            </Reveal>
          </div>
          <CtaArt />
        </div>
      </div>
      <div className="band--gap band--gap-top">
        <div className="frame" />
      </div>
    </section>
  )
}

export function Home() {
  return (
    <>
      <Hero />
      <Background />
      <Highlights />
      <Platform />
      <HashBand />
      <div className="band band--gap band--gap-top" data-tone="white">
        <div className="frame" />
      </div>
      <Flow />
      <Scope />
      <People />
      <Faq />
      <FinalCta />
    </>
  )
}
