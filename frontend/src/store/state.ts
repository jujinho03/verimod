import type { Hex32 } from '../domain/hash'
import type { InclusionProof, ReceiptBody } from '../domain/types'
import type { StoredEpoch } from './ledger'

export interface StoredReceipt {
  hash: Hex32
  body: ReceiptBody
  issued_at: number
  epoch_id: string | null
  proof: InclusionProof | null
  seeded: boolean
}

/** 원문·이의제기 본문과 salt. 공개 원장이 아니라 이 브라우저에만 보관한다. */
export interface PrivateText {
  salt: Hex32
  text: string
}

export interface AppState {
  schema: 1
  receipts: StoredReceipt[]
  epochs: StoredEpoch[]
  contents: Record<string, PrivateText>
  appeals: Record<string, PrivateText>
  rpc_down: boolean
}

export const STORAGE_KEY = 'verimod:state:v1'

export function loadState(storage: Storage | null): AppState | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AppState>
    if (parsed.schema !== 1 || !Array.isArray(parsed.receipts) || !Array.isArray(parsed.epochs)) return null
    return {
      schema: 1,
      receipts: parsed.receipts,
      epochs: parsed.epochs,
      contents: parsed.contents ?? {},
      appeals: parsed.appeals ?? {},
      rpc_down: parsed.rpc_down === true,
    }
  } catch {
    return null
  }
}

export function saveState(storage: Storage | null, state: AppState) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 저장 공간이 없거나 막혀 있으면 이번 방문 동안만 메모리에 유지한다.
  }
}

export function browserStorage(): Storage | null {
  try {
    const storage = window.localStorage
    storage.setItem('verimod:probe', '1')
    storage.removeItem('verimod:probe')
    return storage
  } catch {
    return null
  }
}
