import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAppState } from '../store/context'
import { EVENT_LABEL, receiptTitle } from '../ui/format'
import { DocIcon, FlaskIcon, InputIcon, ReceiptIcon, SearchIcon } from '../ui/icons'
import { PAGE_ENTRIES, POPULAR_ENTRIES, type SearchEntry } from './nav'

const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, '')

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <SearchPanel onClose={onClose} /> : null
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const state = useAppState()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'all' | 'receipts'>('all')
  const [active, setActive] = useState(0)

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    inputRef.current?.focus()
    return () => previous?.focus()
  }, [])

  const receiptEntries = useMemo<SearchEntry[]>(
    () =>
      [...state.receipts]
        .sort((a, b) => b.issued_at - a.issued_at)
        .map((receipt) => ({
          title: `${receiptTitle(receipt)} · ${receipt.body.receipt_id.slice(0, 8)}`,
          to: `/receipts/${receipt.body.receipt_id}`,
          tag: EVENT_LABEL[receipt.body.event_kind],
          keywords: `${receipt.body.receipt_id} ${receipt.hash} 영수증 receipt ${receipt.body.event_kind}`,
          kind: 'receipt',
        })),
    [state.receipts],
  )

  const results = useMemo(() => {
    const q = normalize(query)
    if (!q) return scope === 'receipts' ? receiptEntries.slice(0, 8) : POPULAR_ENTRIES
    const pool = scope === 'receipts' ? receiptEntries : [...PAGE_ENTRIES, ...receiptEntries]
    return pool.filter((entry) => normalize(`${entry.title} ${entry.keywords}`).includes(q)).slice(0, 8)
  }, [query, scope, receiptEntries])

  const activeIndex = Math.min(active, Math.max(0, results.length - 1))

  const go = (entry: SearchEntry) => {
    onClose()
    navigate(entry.to)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') {
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('input, button, a[href]')]
        .filter((element) => !element.hasAttribute('disabled') && element.getClientRects().length > 0)
      const first = controls[0]
      const last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    } else if (event.key === 'ArrowDown' && results.length > 0 && event.target === inputRef.current) {
      event.preventDefault()
      setActive((activeIndex + 1) % results.length)
    } else if (event.key === 'ArrowUp' && results.length > 0 && event.target === inputRef.current) {
      event.preventDefault()
      setActive((activeIndex - 1 + results.length) % results.length)
    } else if (event.key === 'Enter' && results[activeIndex] && event.target === inputRef.current) {
      event.preventDefault()
      go(results[activeIndex])
    }
  }

  const heading = query ? `검색 결과 ${results.length}건` : scope === 'receipts' ? '최근 영수증' : '자주 찾는 곳'

  return (
    <div
      className="search"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="search__panel" role="dialog" aria-modal="true" aria-label="사이트 검색" onKeyDown={onKeyDown}>
        <div className="search__bar">
          <SearchIcon />
          <input
            ref={inputRef}
            className="search__input"
            type="search"
            aria-label="페이지 또는 영수증 검색"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-activedescendant={results.length ? `search-result-${activeIndex}` : undefined}
            placeholder="페이지, 영수증 ID, 해시 앞자리로 찾기"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            aria-controls="search-results"
          />
          <div className="search__scope" role="group" aria-label="검색 범위">
            {(['all', 'receipts'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={scope === value}
                onClick={() => setScope(value)}
              >
                {value === 'all' ? '전체' : '영수증'}
              </button>
            ))}
          </div>
        </div>

        <div className="search__body">
          <div className="search__main">
            <p className="search__heading">{heading}</p>
            <div id="search-results" role="listbox" aria-label={heading}>
              {results.length === 0 && (
                <p className="search__empty">
                  “{query}”와 맞는 페이지나 영수증이 없습니다. 영수증 ID 앞 8자리나 해시 앞자리로도 찾을 수 있습니다.
                </p>
              )}
              {results.map((entry, i) => (
                <Link
                  key={entry.to + entry.title}
                  to={entry.to}
                  role="option"
                  id={`search-result-${i}`}
                  aria-selected={i === activeIndex}
                  data-active={i === activeIndex}
                  className="search__result"
                  onMouseEnter={() => setActive(i)}
                  onClick={onClose}
                >
                  <span className="search__result-icon">{entry.kind === 'receipt' ? <ReceiptIcon /> : <DocIcon />}</span>
                  <span className="search__result-title">{entry.title}</span>
                  <span className="search__tag">{entry.tag}</span>
                </Link>
              ))}
            </div>
          </div>

          <aside className="search__side">
            <p className="search__heading">처음이라면</p>
            <div className="search__tiles">
              <Link to="/check" className="search__tile" onClick={onClose}>
                <span className="search__tile-art">
                  <InputIcon />
                </span>
                <span>판정 요청해 보기</span>
              </Link>
              <Link to="/verify#tamper" className="search__tile" onClick={onClose}>
                <span className="search__tile-art">
                  <FlaskIcon />
                </span>
                <span>변조 테스트</span>
              </Link>
            </div>
            <p className="search__heading">시험 버전 안내</p>
            <p className="search__empty" style={{ padding: 0 }}>
              점수와 원장 기록은 합성 데이터입니다. 해시·Merkle 증명·검증 계산은 이 브라우저에서 실제로 수행합니다.
            </p>
          </aside>
        </div>

        <div className="search__foot">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> 이동 · <kbd>Enter</kbd> 열기
          </span>
          <button type="button" onClick={onClose}>
            <kbd>esc</kbd> 닫기
          </button>
        </div>
      </div>
    </div>
  )
}
