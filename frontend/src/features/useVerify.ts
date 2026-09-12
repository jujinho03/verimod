import { useCallback, useState } from 'react'
import { verifyReceipt, type VerifyReport } from '../domain/verify'
import { useStore } from '../store/context'

export function useVerify() {
  const store = useStore()
  const [report, setReport] = useState<VerifyReport | null>(null)
  const [running, setRunning] = useState(false)

  const run = useCallback(
    async (input: unknown) => {
      setRunning(true)
      try {
        const next = await verifyReceipt(input, await store.verifierContext())
        setReport(next)
        return next
      } finally {
        setRunning(false)
      }
    },
    [store],
  )

  const clear = useCallback(() => setReport(null), [])

  return { report, running, run, clear }
}
