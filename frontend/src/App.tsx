import { useEffect, useState } from 'react'
import './App.css'

type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; service: string }
  | { kind: 'error'; message: string }

function App() {
  const [health, setHealth] = useState<HealthState>({ kind: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/health', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const body: { status: string; service: string } = await res.json()
        if (body.status !== 'ok') throw new Error(`status=${body.status}`)
        setHealth({ kind: 'ok', service: body.service })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : String(err)
        setHealth({ kind: 'error', message })
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="shell">
      <p className="eyebrow">Team HTTP 451 · BLOCK AI 2026</p>
      <h1>VeriMod</h1>
      <p className="tagline">Decide. Prove. Appeal.</p>

      <section className="status" aria-live="polite">
        <h2>백엔드 연결</h2>
        {health.kind === 'loading' && <p>확인 중…</p>}
        {health.kind === 'ok' && (
          <p className="ok">연결됨 · {health.service}</p>
        )}
        {health.kind === 'error' && (
          <p className="error">연결 실패 · {health.message}</p>
        )}
      </section>
    </main>
  )
}

export default App
