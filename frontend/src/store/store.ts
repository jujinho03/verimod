import { randomHex32, type Hex32 } from '../domain/hash'
import { manifestHashes } from '../domain/manifests'
import { evaluatePolicy } from '../domain/policy'
import {
  appealCommitment,
  buildAppeal,
  buildDecision,
  buildReview,
  contentCommitment,
  isoTime,
  receiptHash,
} from '../domain/receipt'
import { runSyntheticInference } from '../domain/scorer'
import { validateReceiptBody } from '../domain/schema'
import type { FinalAction, InferenceOutput, PolicyEvaluation, VerificationBundle } from '../domain/types'
import type { VerifierContext } from '../domain/verify'
import {
  BATCH_WINDOW_MS,
  anchorStatus,
  createLedgerReader,
  locatorOf,
  sealEpoch,
  trustConfig,
  type AnchorStatus,
  type StoredEpoch,
} from './ledger'
import { buildSeedState } from './seed'
import { loadState, saveState, validateState, type AppState, type StoredReceipt } from './state'

export interface DecisionDraft {
  text: string
  salt: Hex32
  inference: InferenceOutput
  policy: PolicyEvaluation
}

/** 원문에 새 salt를 붙여 commitment를 만들고 합성 점수와 정책 판단을 계산한다. 아직 영수증은 발급하지 않는다. */
export async function draftDecision(text: string, now: number): Promise<DecisionDraft> {
  const manifests = await manifestHashes()
  const salt = randomHex32()
  const inference = await runSyntheticInference(text, {
    inferenceId: crypto.randomUUID(),
    inferredAt: isoTime(now),
    contentCommitment: await contentCommitment(salt, text),
    modelManifestHash: manifests.model,
  })
  return { text, salt, inference, policy: evaluatePolicy(inference, manifests.policy) }
}

export type Eligibility = { ok: true } | { ok: false; reason: string }

export interface ReviewTask {
  kind: 'APPEAL' | 'DIRECT'
  decision: StoredReceipt
  appeal: StoredReceipt | null
  waitingSince: number
}

export class StoreError extends Error {}

type Clock = () => number

export class VeriModStore {
  private state: AppState
  private readonly storage: Storage | null
  private readonly clock: Clock
  private readonly listeners = new Set<() => void>()
  private sealing: Promise<void> | null = null
  private generation = 0
  private revision = 0
  private resetting = false
  recoveryReason: string | null = null

  private constructor(state: AppState, storage: Storage | null, clock: Clock) {
    this.state = state
    this.storage = storage
    this.clock = clock
  }

  static async open(storage: Storage | null, clock: Clock = Date.now): Promise<VeriModStore> {
    let loaded: AppState | null = null
    let recoveryReason: string | null = null
    try {
      loaded = loadState(storage)
      if (loaded) await validateState(loaded)
    } catch {
      loaded = null
      recoveryReason = '저장 상태가 손상됐거나 지원하지 않는 형식입니다. 기존 저장값은 보존하고 임시 seed로 열었습니다. 초기화를 선택하기 전까지 새 변경도 저장하지 않습니다.'
      console.warn('[VeriMod]', recoveryReason)
    }
    const store = new VeriModStore(loaded ?? (await buildSeedState()), storage, clock)
    store.recoveryReason = recoveryReason
    if (!loaded && !recoveryReason) saveState(storage, store.state)
    return store
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState = () => this.state

  now() {
    return this.clock()
  }

  private commit(next: AppState) {
    ++this.revision
    this.state = next
    if (!this.recoveryReason) saveState(this.storage, next)
    for (const listener of this.listeners) listener()
  }

  async reloadFromStorage() {
    if (this.resetting) return
    const revision = this.revision
    const generation = ++this.generation
    try {
      const loaded = loadState(this.storage)
      if (!loaded) return
      await validateState(loaded)
      if (generation !== this.generation || revision !== this.revision) return
      this.state = loaded
      this.recoveryReason = null
    } catch {
      if (generation !== this.generation || revision !== this.revision) return
      this.recoveryReason = '다른 탭의 저장 변경을 읽지 못했습니다. 현재 상태와 기존 저장값을 보존하며 새 저장은 중단합니다. 초기화 전에 자료를 확인하세요.'
      console.warn('[VeriMod]', this.recoveryReason)
      this.state = { ...this.state }
    }
    for (const listener of this.listeners) listener()
  }

  async reset() {
    if (this.resetting) throw new StoreError('초기화 중입니다. 잠시 후 다시 시도하세요.')
    this.resetting = true
    ++this.generation
    try {
      const seed = await buildSeedState()
      this.recoveryReason = null
      this.commit(seed)
    } finally {
      this.resetting = false
    }
  }

  setRpcDown(down: boolean) {
    this.commit({ ...this.state, rpc_down: down })
  }

  receipt(hash: string): StoredReceipt | null {
    return this.state.receipts.find((r) => r.hash === hash) ?? null
  }

  receiptById(id: string): StoredReceipt | null {
    return this.state.receipts.find((r) => r.body.receipt_id === id) ?? null
  }

  epochOf(receipt: StoredReceipt): StoredEpoch | null {
    return receipt.epoch_id ? (this.state.epochs.find((e) => e.record.epoch_id === receipt.epoch_id) ?? null) : null
  }

  status(receipt: StoredReceipt, now = this.clock()): AnchorStatus {
    return anchorStatus(this.epochOf(receipt), now)
  }

  /** 트랜잭션 제출 전에는 proof와 anchor를 모두 비워 둔다. */
  bundle(receipt: StoredReceipt, now = this.clock()): VerificationBundle {
    const epoch = this.epochOf(receipt)
    const submitted = epoch !== null && anchorStatus(epoch, now).stage !== 'BATCHED'
    return {
      receipt_body: receipt.body,
      receipt_hash: receipt.hash,
      proof: submitted ? receipt.proof : null,
      anchor: submitted ? locatorOf(epoch) : null,
    }
  }

  async verifierContext(): Promise<VerifierContext> {
    return {
      trust: await trustConfig(),
      manifests: await manifestHashes(),
      ledger: createLedgerReader(() => this.state.epochs, () => this.state.rpc_down, this.clock),
      findBundle: (hash) => {
        const found = this.receipt(hash)
        return found ? this.bundle(found) : null
      },
      findPrivateContent: (commitment) => this.state.contents[commitment] ?? null,
    }
  }

  /** 같은 최초 판정에 연결된 이의제기·검토 기록을 시간순으로 모은다. */
  history(receipt: StoredReceipt): StoredReceipt[] {
    const root = receipt.body.event_kind === 'DECISION' ? receipt.hash : receipt.body.subject_receipt_hash
    return this.state.receipts
      .filter((r) => r.hash === root || (r.body.event_kind !== 'DECISION' && r.body.subject_receipt_hash === root))
      .sort((a, b) => a.issued_at - b.issued_at)
  }

  private linked(decisionHash: string, kind: 'APPEAL' | 'REVIEW') {
    return this.state.receipts.find((r) => r.body.event_kind === kind && r.body.subject_receipt_hash === decisionHash) ?? null
  }

  appealOf(decisionHash: string) {
    return this.linked(decisionHash, 'APPEAL')
  }

  reviewOf(decisionHash: string) {
    return this.linked(decisionHash, 'REVIEW')
  }

  canAppeal(receipt: StoredReceipt): Eligibility {
    const body = receipt.body
    if (body.event_kind !== 'DECISION') return { ok: false, reason: '최초 판정 영수증에만 이의제기할 수 있습니다.' }
    if (body.payload.policy.action === 'ALLOW') return { ok: false, reason: '승인된 판정은 이의제기 대상이 아닙니다.' }
    if (body.payload.policy.action === 'HUMAN_REVIEW') return { ok: false, reason: '검토 보류 판정은 이미 사람 검토 대기열에 있습니다.' }
    if (this.appealOf(receipt.hash)) return { ok: false, reason: '이 판정에는 이미 이의제기가 접수됐습니다. 시험 버전은 판정당 1건만 받습니다.' }
    return { ok: true }
  }

  reviewQueue(): ReviewTask[] {
    const tasks: ReviewTask[] = []
    for (const r of this.state.receipts) {
      if (r.body.event_kind === 'APPEAL') {
        const decision = this.receipt(r.body.subject_receipt_hash)
        if (decision && !this.reviewOf(decision.hash)) tasks.push({ kind: 'APPEAL', decision, appeal: r, waitingSince: r.issued_at })
      } else if (r.body.event_kind === 'DECISION' && r.body.payload.policy.action === 'HUMAN_REVIEW' && !this.reviewOf(r.hash)) {
        tasks.push({ kind: 'DIRECT', decision: r, appeal: null, waitingSince: r.issued_at })
      }
    }
    return tasks.sort((a, b) => a.waitingSince - b.waitingSince)
  }

  private add(receipt: StoredReceipt, patch: Partial<Pick<AppState, 'contents' | 'appeals'>> = {}) {
    const parsed = validateReceiptBody(receipt.body)
    if (!parsed.ok) throw new StoreError(parsed.message)
    this.commit({
      ...this.state,
      receipts: [...this.state.receipts, receipt],
      contents: { ...this.state.contents, ...patch.contents },
      appeals: { ...this.state.appeals, ...patch.appeals },
    })
    return receipt
  }

  async issueDecision(draft: DecisionDraft): Promise<StoredReceipt> {
    if (this.resetting) throw new StoreError('초기화 중입니다. 잠시 후 다시 시도하세요.')
    const generation = this.generation
    draft = structuredClone(draft)
    const now = this.clock()
    const body = buildDecision({ receiptId: crypto.randomUUID(), recordedAt: isoTime(now), inference: draft.inference, policy: draft.policy })
    const hash = await receiptHash(body)
    if (generation !== this.generation) throw new StoreError('저장 상태가 바뀌었습니다. 다시 시도하세요.')
    return this.add(
      { hash, body, issued_at: now, epoch_id: null, proof: null, seeded: false },
      { contents: { [body.content_commitment]: { salt: draft.salt, text: draft.text } } },
    )
  }

  async issueAppeal(decisionHash: string, reasonCode: string, text: string): Promise<StoredReceipt> {
    if (this.resetting) throw new StoreError('초기화 중입니다. 잠시 후 다시 시도하세요.')
    const generation = this.generation
    const decision = this.receipt(decisionHash)
    if (!decision || decision.body.event_kind !== 'DECISION') throw new StoreError('이의제기할 판정을 찾지 못했습니다.')
    const eligibility = this.canAppeal(decision)
    if (!eligibility.ok) throw new StoreError(eligibility.reason)
    if (text.trim().length === 0) throw new StoreError('이의제기 사유를 적어 주세요.')

    const now = this.clock()
    const salt = randomHex32()
    const commitment = await appealCommitment(salt, text)
    const body = buildAppeal({
      receiptId: crypto.randomUUID(),
      recordedAt: isoTime(now),
      decision: decision.body,
      decisionHash: decision.hash,
      appealCommitment: commitment,
      reasonCode,
    })
    const hash = await receiptHash(body)
    if (generation !== this.generation) throw new StoreError('저장 상태가 바뀌었습니다. 다시 시도하세요.')
    const currentEligibility = this.canAppeal(decision)
    if (!currentEligibility.ok) throw new StoreError(currentEligibility.reason)
    return this.add({ hash, body, issued_at: now, epoch_id: null, proof: null, seeded: false }, { appeals: { [commitment]: { salt, text } } })
  }

  async issueReview(decisionHash: string, resultingAction: FinalAction, reasonCodes: string[]): Promise<StoredReceipt> {
    if (this.resetting) throw new StoreError('초기화 중입니다. 잠시 후 다시 시도하세요.')
    const generation = this.generation
    reasonCodes = [...reasonCodes]
    const decision = this.receipt(decisionHash)
    if (!decision || decision.body.event_kind !== 'DECISION') throw new StoreError('검토할 판정을 찾지 못했습니다.')
    if (this.reviewOf(decisionHash)) throw new StoreError('이미 검토 결과가 기록된 판정입니다.')
    if (reasonCodes.length === 0) throw new StoreError('검토 사유를 하나 이상 고르세요.')

    const appeal = this.appealOf(decisionHash)
    const original = decision.body.payload.policy.action
    let previousHash: Hex32
    let outcome: 'OVERTURN' | 'RESOLVED' | 'UPHOLD'
    if (appeal) {
      previousHash = appeal.hash
      outcome = resultingAction === original ? 'UPHOLD' : 'OVERTURN'
    } else if (original === 'HUMAN_REVIEW') {
      previousHash = decision.hash
      outcome = 'RESOLVED'
    } else {
      throw new StoreError('이의제기나 검토 보류가 없는 판정은 검토 대상이 아닙니다.')
    }

    const now = this.clock()
    const manifests = await manifestHashes()
    const body = buildReview({
      receiptId: crypto.randomUUID(),
      recordedAt: isoTime(now),
      decision: decision.body,
      decisionHash: decision.hash,
      previousHash,
      outcome,
      resultingAction,
      reasonCodes,
      reviewPolicyHash: manifests.review,
    })
    const hash = await receiptHash(body)
    if (generation !== this.generation) throw new StoreError('저장 상태가 바뀌었습니다. 다시 시도하세요.')
    if (this.reviewOf(decisionHash)) throw new StoreError('이미 검토 결과가 기록된 판정입니다.')
    return this.add({ hash, body, issued_at: now, epoch_id: null, proof: null, seeded: false })
  }

  /** 가장 오래 기다린 영수증이 배치 창을 넘기면 대기 중인 영수증을 모두 새 epoch로 봉인한다. */
  async tick(): Promise<void> {
    if (this.resetting) return
    const generation = this.generation
    if (this.sealing) return this.sealing
    const now = this.clock()
    const pending = this.state.receipts.filter((r) => r.epoch_id === null)
    if (pending.length === 0 || now - Math.min(...pending.map((r) => r.issued_at)) < BATCH_WINDOW_MS) return

    this.sealing = (async () => {
      const epochId = String(Math.max(0, ...this.state.epochs.map((e) => Number(e.record.epoch_id))) + 1)
      const others = Array.from({ length: 3 }, () => ({
        receipt_id: crypto.randomUUID(),
        receipt_hash: randomHex32(),
      }))
      const { epoch, proofs } = await sealEpoch(
        epochId,
        pending.map((r) => ({ receipt_id: r.body.receipt_id, receipt_hash: r.hash })),
        others,
        now,
      )
      const sealed = new Set(pending.map((r) => r.hash))
      if (generation !== this.generation) return
      this.commit({
        ...this.state,
        epochs: [...this.state.epochs, epoch],
        receipts: this.state.receipts.map((r) => (sealed.has(r.hash) ? { ...r, epoch_id: epochId, proof: proofs[r.hash] } : r)),
      })
    })().finally(() => {
      this.sealing = null
    })
    return this.sealing
  }
}
