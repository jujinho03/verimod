import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

export interface TabItem {
  id: string
  label: string
  content: ReactNode
}

export function Tabs({ items, label, initial }: { items: TabItem[]; label: string; initial?: string }) {
  const baseId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(initial ?? items[0]?.id)
  const [ink, setInk] = useState({ x: 0, width: 0 })

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const update = () => {
      const tab = list.querySelector<HTMLElement>(`[data-tab="${active}"]`)
      if (tab) setInk({ x: tab.offsetLeft, width: tab.offsetWidth })
    }
    update()
    void document.fonts?.ready.then(update)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [active])

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const index = items.findIndex((item) => item.id === active)
    const next = event.key === 'Home' ? items[0] : event.key === 'End' ? items[items.length - 1]
      : items[(index + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length]
    setActive(next.id)
    listRef.current?.querySelector<HTMLElement>(`[data-tab="${next.id}"]`)?.focus()
  }

  const current = items.find((item) => item.id === active) ?? items[0]
  if (!current) return null

  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist" aria-label={label} ref={listRef}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${baseId}-tab-${item.id}`}
            data-tab={item.id}
            aria-selected={item.id === current.id}
            aria-controls={`${baseId}-panel`}
            tabIndex={item.id === current.id ? 0 : -1}
            className="tabs__tab"
            onClick={() => setActive(item.id)}
            onKeyDown={onKeyDown}
          >
            {item.label}
          </button>
        ))}
        <span className="tabs__ink" style={{ width: ink.width, transform: `translateX(${ink.x}px)` }} aria-hidden />
      </div>
      <div
        key={current.id}
        role="tabpanel"
        tabIndex={0}
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${current.id}`}
        className="tabs__panel"
      >
        {current.content}
      </div>
    </div>
  )
}
