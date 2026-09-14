import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

type RevealTag = 'div' | 'section' | 'header' | 'li' | 'p' | 'h2' | 'h3' | 'figure'

interface RevealProps {
  as?: RevealTag
  delay?: number
  className?: string
  id?: string
  children?: ReactNode
}

/** 화면에 들어오면 아래에서 올라오며 나타난다 (chain.link의 스크롤 등장). */
export function Reveal({ as = 'div', delay = 0, className, id, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(() => typeof IntersectionObserver === 'undefined')
  const setRef = useCallback((element: HTMLElement | null) => { ref.current = element }, [])

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -6% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const Tag = as
  return <Tag ref={setRef} id={id} className={['reveal', shown && 'is-in', className].filter(Boolean).join(' ')} style={{ '--i': delay } as CSSProperties}>{children}</Tag>
}
