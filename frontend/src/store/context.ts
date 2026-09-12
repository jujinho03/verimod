import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import type { VeriModStore } from './store'

export const StoreContext = createContext<VeriModStore | null>(null)

export function useStore(): VeriModStore {
  const store = useContext(StoreContext)
  if (!store) throw new Error('StoreProvider 안에서만 사용할 수 있습니다')
  return store
}

export function useAppState() {
  const store = useStore()
  return useSyncExternalStore(store.subscribe, store.getState)
}

/** 봉인 진행처럼 시간에 따라 바뀌는 표시를 위해 주기적으로 현재 시각을 갱신한다. */
export function useNow(intervalMs = 1000) {
  const store = useStore()
  const [now, setNow] = useState(() => store.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(store.now()), intervalMs)
    return () => window.clearInterval(timer)
  }, [store, intervalMs])
  return now
}
