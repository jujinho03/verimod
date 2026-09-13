import { useEffect, useState, type ReactNode } from 'react'
import { StoreContext } from './context'
import { STORAGE_KEY, browserStorage } from './state'
import { VeriModStore } from './store'

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<VeriModStore | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    VeriModStore.open(browserStorage()).then(
      (opened) => {
        if (active) setStore(opened)
      },
      (error: unknown) => {
        if (active) setFailure(error instanceof Error ? error.message : String(error))
      },
    )
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!store) return
    const tick = () => void store.tick().catch(() => console.warn('[VeriMod] 합성 배치를 처리하지 못했습니다. 다음 tick에서 재시도합니다.'))
    const timer = window.setInterval(tick, 1000)
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) void store.reloadFromStorage()
    }
    window.addEventListener('storage', onStorage)
    tick()
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('storage', onStorage)
    }
  }, [store])

  if (failure) {
    return (
      <div className="boot" role="alert">
        <p>영수증 저장소를 열지 못했습니다.</p>
        <p className="boot__detail">{failure}</p>
        <p>Web Crypto를 지원하는 최신 브라우저에서 https 또는 localhost 주소로 접속했는지 확인하세요.</p>
      </div>
    )
  }
  if (!store) {
    return (
      <div className="boot" aria-live="polite">
        영수증 저장소를 준비하고 있습니다
      </div>
    )
  }
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}
