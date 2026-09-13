import { useCallback, useRef, useState } from 'react'
import { verifyReceipt, type VerifyReport } from '../domain/verify'
import { useStore } from '../store/context'

export function useVerify() {
  const store = useStore()
  const [report, setReport] = useState<VerifyReport | null>(null)
  const [running, setRunning] = useState(false)
  const sequence = useRef(0)

  const run = useCallback(
    async (input: unknown) => {
      const request = ++sequence.current
      setReport(null)
      setRunning(true)
      try {
        const next = await verifyReceipt(input, await store.verifierContext())
        if (request === sequence.current) setReport(next)
        return next
      } finally {
        if (request === sequence.current) setRunning(false)
      }
    },
    [store],
  )

  const clear = useCallback(() => { ++sequence.current; setReport(null); setRunning(false) }, [])

  return { report, running, run, clear }
}
