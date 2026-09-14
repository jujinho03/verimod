import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router'
import { PAGE_ENTRIES } from '../../site/nav'
import { ChevronDown } from '../../ui/icons'

/** 티커에 쓸 짧은 이름. 가는 곳은 메뉴와 같고 표기만 줄인다. 없으면 메뉴 제목을 그대로 쓴다. */
const SHORT_LABEL: Record<string, string> = {
  '/check': '판정 요청',
  '/protocol#policy': '정책 기준',
  '/receipts': '내 영수증',
  '/verify': '영수증 검증',
  '/verify#tamper': '변조 테스트',
  '/verify#rpc': 'RPC 장애',
  '/receipts?filter=appealable': '이의제기',
  '/receipts#reset': '데이터 초기화',
  '/review': '검토 콘솔',
  '/protocol': '프로토콜',
  '/protocol#receipt': '영수증 형식',
  '/protocol#hash': '해시 규칙',
  '/protocol#merkle': 'Merkle 배치',
  '/protocol#anchor': 'Epoch 앵커',
  '/protocol#codes': '결과 코드',
  '/protocol#simulation': '합성 요소',
  '/#flow': '전체 흐름',
  '/#people': '이용 주체',
  '/#scope': '보장 범위',
  '/#background': '규제 배경',
  '/#faq': 'FAQ',
}

/** 헤더 메뉴 안의 세부 항목을 돌린다. 같은 곳으로 가는 항목은 한 번만 쓴다. */
const LINKS = PAGE_ENTRIES.filter((entry) => entry.to !== '/')
  .filter((entry, i, all) => all.findIndex((other) => other.to === entry.to) === i)
  .map((entry) => ({ to: entry.to, title: SHORT_LABEL[entry.to] ?? entry.title }))

/* 한 번의 회전은 최대 (3n-1) + 2n + (n-1) = 6n-2 만큼 인덱스가 커진다.
   복제본이 그보다 적으면 목록 끝을 넘어가 빈 화면이 지나간다. */
const COPIES = 7
const ITEMS = Array.from({ length: LINKS.length * COPIES }, (_, i) => LINKS[i % LINKS.length])
const MIDDLE = LINKS.length * 2

const DWELL_MS = 4200
const SPIN_MS = 2600
const STEP_MS = 420
const SNAP_MS = 260
/** 직접 고르거나 옮긴 뒤 자동 회전을 다시 시작하기까지의 짧은 텀 */
const RESUME_MS = 2000
const DRAG_SLOP = 6

/**
 * chain.link 히어로의 슬롯 회전: 멈춤 → 살짝 뒤로 당김 → 빠르게 돌아 목표를 지나침 → 되돌아와 멈추고 노란색으로 표시.
 * 자동 회전은 계속 돌고, 위/아래 버튼과 마우스 드래그로 직접 넘길 때만 잠깐 멈춘다.
 */
export function HeroTicker() {
  const windowRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<Animation | null>(null)
  const landedRef = useRef(MIDDLE)
  const holdUntilRef = useRef(0)
  const dragRef = useRef<{ id: number; startY: number; from: number; moved: number; captured: boolean } | null>(null)
  const suppressClickRef = useRef(false)

  const [landed, setLanded] = useState(MIDDLE)
  const [spinning, setSpinning] = useState(false)
  const [grabbing, setGrabbing] = useState(false)
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  /* offsetHeight·clientHeight는 정수로 반올림된다. 그 값으로 index를 곱하면 항목마다 1px 미만의
     오차가 쌓여 멈춘 글자가 VERIFY와 어긋난다. 소수점을 그대로 주는 rect를 쓴다. */
  const itemHeight = useCallback(() => {
    const first = trackRef.current?.firstElementChild as HTMLElement | null
    return first ? first.getBoundingClientRect().height : 0
  }, [])

  const centerOffset = useCallback(() => {
    const view = windowRef.current
    return view ? view.getBoundingClientRect().height / 2 - itemHeight() / 2 : 0
  }, [itemHeight])

  const offsetFor = useCallback(
    (index: number) => {
      const height = itemHeight()
      if (!windowRef.current || !height) return 0
      return centerOffset() - index * height
    },
    [centerOffset, itemHeight],
  )

  const setY = useCallback((y: number, ms: number) => {
    const track = trackRef.current
    if (!track) return
    animRef.current?.cancel()
    animRef.current = null
    track.style.transition = ms > 0 ? `transform ${ms}ms cubic-bezier(0.19, 1, 0.22, 1)` : 'none'
    track.style.transform = `translateY(${y}px)`
  }, [])

  /** 목록이 반복되므로 가장자리에 닿으면 같은 내용의 가운데 복제본으로 조용히 옮긴다. */
  const rebase = useCallback(() => {
    const n = LINKS.length
    const current = landedRef.current
    if (current >= n && current < ITEMS.length - n) return
    const next = (((current % n) + n) % n) + MIDDLE
    landedRef.current = next
    setLanded(next)
    setY(offsetFor(next), 0)
  }, [offsetFor, setY])

  const goTo = useCallback(
    (index: number, ms: number) => {
      landedRef.current = index
      setLanded(index)
      setY(offsetFor(index), ms)
      window.setTimeout(rebase, ms + 40)
    },
    [offsetFor, rebase, setY],
  )

  /** 회전 중에 손대면 지금 보이는 위치에서 멈춘다. 그냥 취소하면 회전 시작 위치로 튄다. */
  const freeze = useCallback(() => {
    const track = trackRef.current
    if (!track) return offsetFor(landedRef.current)
    const y = new DOMMatrixReadOnly(getComputedStyle(track).transform).m42
    animRef.current?.cancel()
    animRef.current = null
    track.style.transition = 'none'
    track.style.transform = `translateY(${y}px)`
    const height = itemHeight() || 1
    const index = Math.round((centerOffset() - y) / height)
    landedRef.current = index
    setLanded(index)
    setSpinning(false)
    return y
  }, [centerOffset, itemHeight, offsetFor])

  const hold = () => {
    holdUntilRef.current = Date.now() + RESUME_MS
  }

  const step = (direction: number) => {
    hold()
    freeze()
    goTo(landedRef.current + direction, STEP_MS)
  }

  useLayoutEffect(() => {
    const view = windowRef.current
    if (!view) return
    const place = () => setY(offsetFor(landedRef.current), 0)
    place()
    void document.fonts?.ready.then(place)
    const observer = new ResizeObserver(place)
    observer.observe(view)
    return () => observer.disconnect()
  }, [offsetFor, setY])

  useEffect(() => {
    if (paused) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let timer = 0
    let cancelled = false

    // 예약은 애니메이션 완료가 아니라 이 타이머가 책임진다.
    // onfinish에만 걸어 두면 버튼·드래그로 애니메이션을 취소했을 때 자동 회전이 영영 멈춘다.
    const schedule = (ms: number) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(tick, ms)
    }

    function tick() {
      if (cancelled) return
      const track = trackRef.current
      if (!track) {
        schedule(DWELL_MS)
        return
      }
      // 직접 고르거나 옮기는 중에만 잠깐 미룬다. 마우스를 얹어 둔 것으로는 멈추지 않는다.
      if (dragRef.current || Date.now() < holdUntilRef.current) {
        schedule(400)
        return
      }

      const words = LINKS.length
      // 회전은 항상 가운데 구간에서 시작한다. 끝쪽에서 출발하면 목표가 목록 밖으로 나가
      // 회전 내내 빈 화면이 보인다(한 번 걸러 한 번 비어 보이던 원인).
      const base = (((landedRef.current % words) + words) % words) + MIDDLE
      landedRef.current = base
      setLanded(base)
      const stride = 1 + Math.floor(Math.random() * (words - 1))

      if (reduceMotion || typeof track.animate !== 'function') {
        goTo(base + stride, 0)
        schedule(DWELL_MS)
        return
      }

      const target = base + words * 2 + stride
      const from = offsetFor(base)
      const to = offsetFor(target)
      track.style.transition = 'none'
      track.style.transform = `translateY(${from}px)`
      setSpinning(true)
      const animation = track.animate(
        [
          { transform: `translateY(${from}px)`, easing: 'cubic-bezier(0.45, 0, 0.55, 1)' },
          { transform: `translateY(${from + 14}px)`, offset: 0.16, easing: 'cubic-bezier(0.6, 0, 0.2, 1)' },
          { transform: `translateY(${to - 50}px)`, offset: 0.74, easing: 'cubic-bezier(0.3, 0, 0.25, 1)' },
          { transform: `translateY(${to}px)` },
        ],
        { duration: SPIN_MS, fill: 'forwards' },
      )
      animRef.current = animation
      animation.onfinish = () => {
        if (cancelled || animRef.current !== animation) return
        animation.cancel()
        animRef.current = null
        setSpinning(false)
        // 애니메이션이 남긴 위치가 아니라 계산한 정확한 위치로 다시 놓는다.
        goTo(target, 0)
      }
      schedule(SPIN_MS + DWELL_MS)
    }

    schedule(DWELL_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      animRef.current?.cancel()
    }
  }, [goTo, offsetFor, paused])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    // 새 제스처가 시작되면 지난 드래그의 클릭 차단을 푼다.
    suppressClickRef.current = false
    hold()
    // 여기서 포인터를 붙잡으면 click 대상이 링크가 아니라 이 컨테이너가 되어 항목을 눌러도
    // 페이지 이동이 되지 않는다. 실제로 끌기 시작할 때만 붙잡는다.
    dragRef.current = { id: event.pointerId, startY: event.clientY, from: freeze(), moved: 0, captured: false }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.id) return
    const dy = event.clientY - drag.startY
    drag.moved = Math.max(drag.moved, Math.abs(dy))
    if (!drag.captured) {
      if (drag.moved <= DRAG_SLOP) return
      drag.captured = true
      setGrabbing(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    setY(drag.from + dy, 0)
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.id) return
    dragRef.current = null
    hold()
    // 끌지 않았으면 그냥 클릭이다. 링크가 그대로 처리하게 둔다.
    if (!drag.captured) return
    setGrabbing(false)
    suppressClickRef.current = true
    // 끌어서 놓은 자리에서 가장 가까운 항목으로 맞춘다.
    const height = itemHeight() || 1
    const y = drag.from + (event.clientY - drag.startY)
    goTo(Math.round((centerOffset() - y) / height), SNAP_MS)
  }

  return (
    <>
      <div
        className={`ticker${grabbing ? ' is-grabbing' : ''}`}
        ref={windowRef}
        aria-hidden
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="ticker__track" ref={trackRef}>
          {ITEMS.map((item, i) => (
            <Link
              key={`${item.to}-${i}`}
              to={item.to}
              tabIndex={-1}
              draggable={false}
              className={`ticker__item${!spinning && i === landed ? ' is-landed' : ''}`}
              onClick={(event) => {
                if (!suppressClickRef.current) return
                suppressClickRef.current = false
                event.preventDefault()
              }}
            >
              {item.title}
            </Link>
          ))}
        </div>
      </div>

      <div className="ticker__nav">
        <button type="button" className="carousel__arrow ticker__arrow" aria-label="자동 회전 정지" aria-pressed={paused} onClick={() => { freeze(); setPaused(!paused) }}>
          <span aria-hidden>{paused ? '▶' : 'Ⅱ'}</span>
        </button>
        <button type="button" className="carousel__arrow ticker__arrow ticker__arrow--up" onClick={() => step(-1)} aria-label="이전 항목 보기">
          <ChevronDown />
        </button>
        <button type="button" className="carousel__arrow ticker__arrow" onClick={() => step(1)} aria-label="다음 항목 보기">
          <ChevronDown />
        </button>
      </div>
    </>
  )
}
