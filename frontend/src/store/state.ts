import { isHex32, type Hex32 } from '../domain/hash'
import { canonicalize } from '../domain/canonical'
import { freezeEpoch } from '../domain/epoch'
import { receiptHash } from '../domain/receipt'
import { validateBundle, validateReceiptBody } from '../domain/schema'
import { transitionProblem } from '../domain/verify'
import type { InclusionProof, ReceiptBody } from '../domain/types'
import { locatorOf, type StoredEpoch } from './ledger'

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
  const raw = storage.getItem(STORAGE_KEY)
  if (raw === null) return null
  const parsed = JSON.parse(raw) as Partial<AppState>
  if (!parsed || parsed.schema !== 1 || !Array.isArray(parsed.receipts) || !Array.isArray(parsed.epochs) || typeof parsed.rpc_down !== 'boolean') {
    throw new Error('저장 schema가 맞지 않습니다')
  }
  return {
    schema: 1,
    receipts: parsed.receipts,
    epochs: parsed.epochs,
    contents: parsed.contents === undefined ? {} : parsed.contents,
    appeals: parsed.appeals === undefined ? {} : parsed.appeals,
    rpc_down: parsed.rpc_down,
  }
}

/** 읽은 snapshot의 구조·연결·계산 일치를 검사한다. 외부 원장의 진실성을 인증하지는 않는다. */
export async function validateState(state: AppState): Promise<void> {
  const require = (ok: unknown) => { if (!ok) throw new Error('저장된 영수증·epoch·비공개 자료가 올바르지 않습니다') }
  const uint = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
  const uuid = (v: unknown) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v)
  canonicalize(state)
  for (const map of [state.contents, state.appeals]) {
    require(map && typeof map === 'object' && !Array.isArray(map))
    for (const [key, value] of Object.entries(map)) require(isHex32(key) && value && isHex32(value.salt) && typeof value.text === 'string')
  }
  const epochIds = new Set<string>()
  for (const epoch of state.epochs) {
    require(epoch && epoch.record && Array.isArray(epoch.members))
    const r = epoch.record
    require(typeof r.epoch_id === 'string' && /^[1-9]\d*$/.test(r.epoch_id) && Number.isSafeInteger(Number(r.epoch_id)))
    require(!epochIds.has(r.epoch_id))
    epochIds.add(r.epoch_id)
    require(uint(epoch.frozen_at) && uint(r.anchored_block) && uint(r.protocol_version) && r.protocol_version > 0)
    require(isHex32(r.root) && isHex32(r.issuer_commitment) && typeof r.publisher === 'string' && /^0x[0-9a-f]{40}$/.test(r.publisher))
    require(isHex32(epoch.tx_hash) && isHex32(epoch.block_hash) && r.receipt_count === epoch.members.length)
    for (const member of epoch.members) require(member && uuid(member.receipt_id) && isHex32(member.receipt_hash) && typeof member.mine === 'boolean')
    const frozen = await freezeEpoch(epoch.members)
    require(frozen.root === r.root)
    require(frozen.members.every((m, i) => m.receipt_hash === epoch.members[i].receipt_hash))
  }
  const hashes = new Set<string>()
  const ids = new Set<string>()
  for (const receipt of state.receipts) {
    require(receipt && isHex32(receipt.hash) && validateReceiptBody(receipt.body).ok)
    require(uint(receipt.issued_at) && typeof receipt.seeded === 'boolean')
    require(!hashes.has(receipt.hash) && !ids.has(receipt.body.receipt_id))
    hashes.add(receipt.hash)
    ids.add(receipt.body.receipt_id)
    require(await receiptHash(receipt.body) === receipt.hash)
    const epoch = state.epochs.find((e) => e.record.epoch_id === receipt.epoch_id)
    require(receipt.epoch_id === null ? receipt.proof === null : epoch && receipt.proof)
    require(validateBundle({ receipt_body: receipt.body, receipt_hash: receipt.hash, proof: receipt.proof, anchor: epoch ? locatorOf(epoch) : null }).ok)
    if (epoch && receipt.proof) {
      const frozen = await freezeEpoch(epoch.members)
      require(canonicalize(frozen.proofs[receipt.hash]) === canonicalize(receipt.proof))
      require(epoch.members.some((m) => m.mine && m.receipt_hash === receipt.hash && m.receipt_id === receipt.body.receipt_id))
    }
  }
  const transitions = new Set<string>()
  for (const receipt of state.receipts) {
    const body = receipt.body
    if (body.event_kind === 'DECISION') continue
    const subject = state.receipts.find((r) => r.hash === body.subject_receipt_hash)
    const previous = state.receipts.find((r) => r.hash === body.previous_receipt_hash)
    require(subject && previous && transitionProblem(body, subject.body, previous.body) === null)
    const key = `${body.subject_receipt_hash}:${body.event_kind}`
    require(!transitions.has(key))
    transitions.add(key)
  }
  for (const epoch of state.epochs) for (const member of epoch.members) {
    if (member.mine) require(state.receipts.some((r) => r.hash === member.receipt_hash && r.epoch_id === epoch.record.epoch_id))
  }
}

export function saveState(storage: Storage | null, state: AppState) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 저장 공간이 없거나 막혀 있으면 이번 방문 동안만 메모리에 유지한다.
    console.warn('[VeriMod] 저장할 수 없어 이번 방문의 메모리에만 유지합니다.')
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
