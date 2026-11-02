import { useCallback, useEffect, useRef, useState } from 'react'
import { verifyReceipt, type VerifierContext, type VerifyReport } from '../domain/verify'
import { useStore } from '../store/context'

export const VERIFY_SOFT_DEADLINE_MS = 24_000
type ContextSource = VerifierContext | Promise<VerifierContext> | ((signal: AbortSignal) => VerifierContext | Promise<VerifierContext>)
type ActiveRun = { controller: AbortController; timer: ReturnType<typeof setTimeout>; startedAt: number }

export function useVerify() {
  const store = useStore()
  const [report, setReport] = useState<VerifyReport | null>(null)
  const [running, setRunning] = useState(false)
  const [slow, setSlow] = useState(false)
  const [cancelled, setCancelled] = useState<{ elapsedMs: number; endedAt: string } | null>(null)
  const sequence = useRef(0)
  const active = useRef<ActiveRun | null>(null)

  const abortActive = useCallback(() => {
    const previous = active.current
    active.current = null
    if (previous) {
      clearTimeout(previous.timer)
      previous.controller.abort()
    }
    return previous
  }, [])

  const clear = useCallback(() => {
    ++sequence.current
    abortActive()
    setReport(null)
    setRunning(false)
    setSlow(false)
    setCancelled(null)
  }, [abortActive])

  const cancel = useCallback(() => {
    ++sequence.current
    const previous = abortActive()
    setReport(null)
    setRunning(false)
    setSlow(false)
    if (previous) setCancelled({ elapsedMs: Date.now() - previous.startedAt, endedAt: new Date().toISOString() })
  }, [abortActive])

  // An unmounted page must not leave its outstanding public RPC fetch running.
  useEffect(() => () => { ++sequence.current; abortActive() }, [abortActive])

  const run = useCallback(
    async (input: unknown, source?: ContextSource) => {
      const request = ++sequence.current
      abortActive()
      const controller = new AbortController()
      const timer = setTimeout(() => {
        if (request === sequence.current && !controller.signal.aborted) setSlow(true)
      }, VERIFY_SOFT_DEADLINE_MS)
      active.current = { controller, timer, startedAt: Date.now() }
      setReport(null)
      setRunning(true)
      setSlow(false)
      setCancelled(null)
      try {
        const context = await (typeof source === 'function' ? source(controller.signal) : source ?? store.verifierContext())
        if (controller.signal.aborted || request !== sequence.current) return null
        const next = await verifyReceipt(input, context)
        if (controller.signal.aborted || request !== sequence.current) return null
        setReport(next)
        return next
      } catch (error) {
        if (controller.signal.aborted || request !== sequence.current) return null
        throw error
      } finally {
        clearTimeout(timer)
        if (request === sequence.current) {
          active.current = null
          setRunning(false)
          setSlow(false)
        }
      }
    },
    [store, abortActive],
  )

  const keepWaiting = useCallback(() => setSlow(false), [])
  return { report, running, slow, cancelled, run, clear, cancel, keepWaiting }
}
