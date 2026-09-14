import { useId, useState, type ReactNode } from 'react'

export interface AccordionItem {
  id: string
  title: string
  body: ReactNode
}

export function Accordion({ items, initial }: { items: AccordionItem[]; initial?: string | null }) {
  const baseId = useId()
  const [open, setOpen] = useState<string | null>(initial === undefined ? (items[0]?.id ?? null) : initial)

  return (
    <div className="accordion">
      {items.map((item) => {
        const isOpen = open === item.id
        const panelId = `${baseId}-${item.id}`
        return (
          <div className="accordion__item" key={item.id}>
            <h3>
              <button
                type="button"
                id={`${panelId}-trigger`}
                className="accordion__trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : item.id)}
              >
                {item.title}
                <span className="plus" aria-hidden />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={`${panelId}-trigger`} className={`collapse${isOpen ? ' is-open' : ''}`} inert={!isOpen}>
              <div>
                <div className="accordion__body">{item.body}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
