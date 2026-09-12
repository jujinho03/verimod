import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

/** 같은 내용을 두 번 이어 붙여 끊김 없이 왼쪽으로 흐른다. 속도는 chain.link 실측 약 47px/s. */
export function Marquee({ children, label, speed = 47 }: { children: ReactNode; label: string; speed?: number }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [duration, setDuration] = useState(60)

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => setDuration(Math.max(10, track.scrollWidth / 2 / speed))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    return () => observer.disconnect()
  }, [speed])

  return (
    <div className="marquee" role="region" aria-label={label}>
      <div className="marquee__track" ref={trackRef} style={{ '--marquee-duration': `${duration}s` } as CSSProperties}>
        <div className="marquee__group">{children}</div>
        <div className="marquee__group" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  )
}
