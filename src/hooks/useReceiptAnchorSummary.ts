import { useEffect, useMemo, useState } from 'react'
import { VeriModApiClient } from '../../frontend/src/api/client'

type Epoch = { status?: string; confirmations?: number; fail_reason?: string }
type ReceiptState = { state?: string; epoch?: Epoch | null }

export interface AnchorSummary {
  tone: 'info' | 'ok' | 'error'
  icon: 'hourglass' | 'tick' | 'warning'
  text: string
  complete: boolean
}

export function summarizeAnchors(states: ReceiptState[], total: number): AnchorSummary {
  if (total === 0) return { tone: 'info', icon: 'hourglass', text: '등록할 실제 영수증이 없어요.', complete: true }
  const confirmed = states.filter((item) => item.state === 'CONFIRMED' || item.epoch?.status === 'CONFIRMED').length
  const failed = states.filter((item) => item.epoch?.status === 'FAILED').length
  const submitted = states.filter((item) => item.epoch?.status === 'SUBMITTED').length
  const confirmations = states.reduce((sum, item) => sum + (item.epoch?.status === 'SUBMITTED' ? Math.min(item.epoch.confirmations ?? 0, 12) : 0), 0)
  if (confirmed === total) return { tone: 'ok', icon: 'tick', text: `온체인 등록 완료 · ${confirmed}/${total} 영수증 확정 · 각 영수증에서 독립 검증 가능`, complete: true }
  if (failed > 0) return { tone: 'error', icon: 'warning', text: `온체인 등록 실패 ${failed}개 · 확정 ${confirmed}/${total} · 영수증에서 실패 원인을 확인하세요.`, complete: true }
  const progress = submitted > 0 ? ` · 블록 확인 합계 ${confirmations}/${submitted * 12}` : ''
  return { tone: 'info', icon: 'hourglass', text: `자동 온체인 등록 진행 중 · 확정 ${confirmed}/${total}${progress}`, complete: false }
}

export function useReceiptAnchorSummary(receiptIds: Array<string | null | undefined>) {
  const ids = useMemo(() => [...new Set(receiptIds.filter((id): id is string => Boolean(id)))], [receiptIds.join('|')])
  const [summary, setSummary] = useState<AnchorSummary>(() => summarizeAnchors([], ids.length))
  useEffect(() => {
    if (ids.length === 0) { setSummary(summarizeAnchors([], 0)); return }
    let active = true
    let timer = 0
    const client = new VeriModApiClient({ timeoutMs: 8000 })
    const poll = async () => {
      try {
        const states = await Promise.all(ids.map(async (id) => (await client.getReceipt(id, (value: unknown) => value as ReceiptState)).data))
        if (!active) return
        const next = summarizeAnchors(states, ids.length)
        setSummary(next)
        if (!next.complete) timer = window.setTimeout(poll, 1500)
      } catch {
        if (!active) return
        setSummary({ tone: 'error', icon: 'warning', text: '온체인 상태를 불러오지 못했어요. 자동으로 다시 확인합니다.', complete: false })
        timer = window.setTimeout(poll, 3000)
      }
    }
    void poll()
    return () => { active = false; window.clearTimeout(timer) }
  }, [ids.join('|')])
  return summary
}
