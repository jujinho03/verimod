import { useLayoutEffect, useRef, useState } from 'react'

/** 화살표로 카드 한 장씩 이동하는 캐러셀 상태. 보이는 카드 수를 재서 끝에서 멈춘다. */
export function useCarousel(count: number) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [metrics, setMetrics] = useState({ card: 355, visible: 2 })

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const measure = () => {
      const card = viewport.querySelector<HTMLElement>('.carousel__item')?.offsetWidth || 355
      setMetrics({ card, visible: Math.max(1, Math.floor((viewport.clientWidth + 2) / card)) })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [count])

  const max = Math.max(0, count - metrics.visible)
  const current = Math.min(index, max)

  return {
    viewportRef,
    canPrev: current > 0,
    canNext: current < max,
    prev: () => setIndex(Math.max(0, current - 1)),
    next: () => setIndex(Math.min(max, current + 1)),
    trackStyle: { transform: `translateX(${-current * metrics.card}px)` },
  }
}
