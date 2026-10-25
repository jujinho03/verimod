import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { freezeEpoch } from './epoch'
import { randomHex32, type Hex32 } from './hash'
import { manifestHashes, MODEL_MANIFEST, POLICY_MANIFEST, REVIEW_POLICY_MANIFEST } from './manifests'
import { evaluatePolicy } from './policy'
import {
  ISSUER_ID,
  appealCommitment,
  buildAppeal,
  buildDecision,
  buildReview,
  contentCommitment,
  issuerCommitment,
  receiptHash,
} from './receipt'
import { runSyntheticInference } from './scorer'
import type { ReceiptBody, VerificationBundle } from './types'
import {
  RpcUnavailableError,
  transitionProblem,
  verifyReceipt,
  type EpochRecord,
  type LedgerReader,
  type TrustConfig,
  type VerifierContext,
} from './verify'

const CONTRACT = `0x${'0'.repeat(37)}451`
const PUBLISHER = `0x${'0'.repeat(36)}a451`
const PLACEHOLDER = `0x${'ab'.repeat(32)}` as Hex32

async function fixture() {
  const manifests = await manifestHashes()
  const text = '이번 영화 결말 진짜 죽여주네요. 배우들이 연기로 극장을 부숴 버렸어요.'
  const salt = randomHex32()
  const commitment = await contentCommitment(salt, text)
  const inference = await runSyntheticInference(text, {
    inferenceId: crypto.randomUUID(),
    inferredAt: '2026-09-08T01:12:29.500Z',
    contentCommitment: commitment,
    modelManifestHash: manifests.model,
  })
  const decision = buildDecision({
    receiptId: crypto.randomUUID(),
    issuerSeq: 1,
    recordedAt: '2026-09-08T01:12:30.000Z',
    inference,
    policy: evaluatePolicy(inference, manifests.policy),
  })
  const decisionHash = await receiptHash(decision)
  const appeal = buildAppeal({
    receiptId: crypto.randomUUID(),
    issuerSeq: 2,
    recordedAt: '2026-09-08T02:00:00.000Z',
    decision,
    decisionHash,
    appealCommitment: await appealCommitment(randomHex32(), '영화 칭찬이었습니다.'),
    reasonCode: 'CONTEXT_MISSING',
  })
  const appealHash = await receiptHash(appeal)
  const review = buildReview({
    receiptId: crypto.randomUUID(),
    issuerSeq: 3,
    recordedAt: '2026-09-09T09:00:00.000Z',
    decision,
    decisionHash,
    previousHash: appealHash,
    outcome: 'OVERTURN',
    resultingAction: 'ALLOW',
    reasonCodes: ['FALSE_POSITIVE_SLANG', 'CONTEXT_NOT_HARMFUL'],
    reviewPolicyHash: manifests.review,
  })
  const reviewHash = await receiptHash(review)

  const members = [
    { receipt_id: decision.receipt_id, receipt_hash: decisionHash },
    { receipt_id: appeal.receipt_id, receipt_hash: appealHash },
    { receipt_id: review.receipt_id, receipt_hash: reviewHash },
    ...Array.from({ length: 4 }, () => ({ receipt_id: crypto.randomUUID(), receipt_hash: randomHex32() })),
  ]
  const frozen = await freezeEpoch(members)
  const issuer = await issuerCommitment(ISSUER_ID)
  const trust: TrustConfig = {
    chain_id: '31337',
    contract_address: CONTRACT,
    issuer_id: ISSUER_ID,
    issuer_commitment: issuer,
    publisher: PUBLISHER,
    protocol_version: 1,
  }
  const epoch: EpochRecord = {
    epoch_id: '1',
    root: frozen.root,
    receipt_count: members.length,
    protocol_version: 1,
    publisher: PUBLISHER,
    issuer_commitment: issuer,
    issuer_seq_min: frozen.issuer_seq_min,
    issuer_seq_max: frozen.issuer_seq_max,
    anchored_block: 1000,
  }
  const chain = { block: 1100, rpcDown: false }
  const ledger: LedgerReader = {
    async getEpoch(address, epochId) {
      if (chain.rpcDown) throw new RpcUnavailableError('RPC down')
      return address === CONTRACT && epochId === '1' && chain.block >= epoch.anchored_block ? epoch : null
    },
    async blockNumber() {
      if (chain.rpcDown) throw new RpcUnavailableError('RPC down')
      return chain.block
    },
  }
  const bundleOf = (body: ReceiptBody, hash: Hex32): VerificationBundle => ({
    receipt_body: body,
    receipt_hash: hash,
    proof: frozen.proofs[hash],
    anchor: {
      chain_id: '31337',
      contract_address: CONTRACT,
      epoch_id: '1',
      tx_hash: PLACEHOLDER,
      block_number: '1000',
      block_hash: PLACEHOLDER,
    },
  })
  const bundles = new Map<Hex32, VerificationBundle>([
    [decisionHash, bundleOf(decision, decisionHash)],
    [appealHash, bundleOf(appeal, appealHash)],
    [reviewHash, bundleOf(review, reviewHash)],
  ])
  const ctx: VerifierContext = {
    trust,
    ledger,
    manifests,
    manifestDocuments: [
      { kind: 'model', expected_hash: manifests.model, manifest: MODEL_MANIFEST },
      { kind: 'policy', expected_hash: manifests.policy, manifest: POLICY_MANIFEST },
      { kind: 'review', expected_hash: manifests.review, manifest: REVIEW_POLICY_MANIFEST },
    ],
    findBundle: (hash) => bundles.get(hash) ?? null,
    findPrivateContent: (c) => (c === commitment ? { salt, text } : null),
  }
  return {
    ctx,
    chain,
    bundles,
    decision: bundles.get(decisionHash)!,
    appeal: bundles.get(appealHash)!,
    review: bundles.get(reviewHash)!,
  }
}

type Fixture = Awaited<ReturnType<typeof fixture>>
let f: Fixture

beforeAll(async () => {
  f = await fixture()
})

afterEach(() => {
  f.chain.block = 1100
  f.chain.rpcDown = false
})

const clone = <T>(value: T): T => structuredClone(value)

/** Builds a wholly in-memory, separately anchored ledger so lifecycle tests exercise verifyReceipt end-to-end. */
async function lifecycleLedger(bodies: ReceiptBody[]) {
  const hashes = await Promise.all(bodies.map(receiptHash))
  const base = await f.ctx.ledger.getEpoch(CONTRACT, '1')
  if (!base) throw new Error('fixture epoch missing')
  const bundles = new Map<Hex32, VerificationBundle>()
  const epochs = new Map<string, EpochRecord>()
  for (let i = 0; i < bodies.length; i++) {
    const frozen = await freezeEpoch([{ receipt_id: bodies[i].receipt_id, receipt_hash: hashes[i] }])
    const epochId = String(i + 1)
    epochs.set(epochId, { ...base, epoch_id: epochId, root: frozen.root, receipt_count: 1, issuer_seq_min: frozen.issuer_seq_min, issuer_seq_max: frozen.issuer_seq_max })
    bundles.set(hashes[i], {
      receipt_body: bodies[i], receipt_hash: hashes[i], proof: frozen.proofs[hashes[i]],
      anchor: { ...f.decision.anchor!, epoch_id: epochId },
    })
  }
  const ctx: VerifierContext = {
    ...f.ctx,
    ledger: { getEpoch: async (_address, epochId) => epochs.get(epochId) ?? null, blockNumber: async () => 1100 },
    findBundle: (hash) => bundles.get(hash) ?? null,
  }
  return { ctx, bundles, hashes }
}

describe('verifyReceipt', () => {
  it('합성 시나리오의 최초 판정은 제한이다', () => {
    expect(f.decision.receipt_body.event_kind === 'DECISION' && f.decision.receipt_body.payload.policy.action).toBe('RESTRICT')
  })

  it('원본 영수증은 VALID이고 원문·manifest 확인도 통과한다', async () => {
    const report = await verifyReceipt(f.decision, f.ctx)
    expect(report.code).toBe('VALID')
    expect(report.steps.every((s) => s.state === 'PASSED')).toBe(true)
    expect(report.content.state).toBe('PASSED')
    expect(report.manifest.state).toBe('PASSED')
    expect(report.lifecycle.state).toBe('NOT_CHECKED')
  })

  it('이의제기와 검토 기록은 선행 기록과의 연결까지 통과한다', async () => {
    expect((await verifyReceipt(f.appeal, f.ctx)).lifecycle.state).toBe('PASSED')
    const review = await verifyReceipt(f.review, f.ctx)
    expect(review.code).toBe('VALID')
    expect(review.lifecycle.state).toBe('PASSED')
  })

  it('사본의 점수를 바꾸면 HASH_MISMATCH', async () => {
    const copy = clone(f.decision)
    if (copy.receipt_body.event_kind !== 'DECISION') throw new Error('fixture')
    ;(copy.receipt_body.payload.inference.scores_ppm as Record<string, number>).violence = 120_000
    const report = await verifyReceipt(copy, f.ctx)
    expect(report.code).toBe('HASH_MISMATCH')
    expect(report.recomputedHash).not.toBe(report.claimedHash)
  })

  it('본문을 바꾸고 해시까지 새로 적어도 원래 앵커 기준 INVALID_PROOF', async () => {
    const copy = clone(f.decision)
    if (copy.receipt_body.event_kind !== 'DECISION') throw new Error('fixture')
    copy.receipt_body.payload.policy.action = 'ALLOW'
    copy.receipt_hash = await receiptHash(copy.receipt_body)
    expect((await verifyReceipt(copy, f.ctx)).code).toBe('INVALID_PROOF')
  })

  it('증명의 tree_size가 원장 count와 다르면 INVALID_PROOF', async () => {
    const copy = clone(f.decision)
    copy.proof!.tree_size += 1
    expect((await verifyReceipt(copy, f.ctx)).code).toBe('INVALID_PROOF')
  })

  it('신뢰 설정에 없는 컨트랙트는 UNTRUSTED_ANCHOR', async () => {
    const copy = clone(f.decision)
    copy.anchor!.contract_address = `0x${'9'.repeat(40)}`
    expect((await verifyReceipt(copy, f.ctx)).code).toBe('UNTRUSTED_ANCHOR')
  })

  it('승인되지 않은 issuer는 해시를 다시 계산해도 UNTRUSTED_ANCHOR', async () => {
    const copy = clone(f.decision)
    copy.receipt_body.issuer_id = 'verimod-demo-issuer'
    copy.receipt_hash = await receiptHash(copy.receipt_body)
    expect((await verifyReceipt(copy, f.ctx)).code).toBe('UNTRUSTED_ANCHOR')
  })

  it('확인 횟수가 모자라거나 아직 블록에 없으면 VALID 대신 PENDING_ANCHOR', async () => {
    f.chain.block = 1005
    const confirming = await verifyReceipt(f.decision, f.ctx)
    expect(confirming.code).toBe('PENDING_ANCHOR')
    expect(confirming.confirmations).toBe(6)
    f.chain.block = 999
    expect((await verifyReceipt(f.decision, f.ctx)).code).toBe('PENDING_ANCHOR')
  })

  it('배치 전이라 proof가 없으면 PENDING_ANCHOR', async () => {
    const copy = { ...clone(f.decision), proof: null, anchor: null }
    expect((await verifyReceipt(copy, f.ctx)).code).toBe('PENDING_ANCHOR')
  })

  it('RPC 장애는 변조가 아니라 RPC_UNAVAILABLE', async () => {
    f.chain.rpcDown = true
    expect((await verifyReceipt(f.decision, f.ctx)).code).toBe('RPC_UNAVAILABLE')
  })

  it('필드 누락·미지 필드는 INVALID_SCHEMA, 다른 protocol은 UNSUPPORTED_VERSION', async () => {
    const missing = clone(f.decision) as unknown as { receipt_body: Record<string, unknown> }
    delete missing.receipt_body.issuer_id
    expect((await verifyReceipt(missing, f.ctx)).code).toBe('INVALID_SCHEMA')

    const extra = clone(f.decision) as unknown as { receipt_body: Record<string, unknown> }
    extra.receipt_body.verified = true
    expect((await verifyReceipt(extra, f.ctx)).code).toBe('INVALID_SCHEMA')

    const version = clone(f.decision) as unknown as { receipt_body: Record<string, unknown> }
    version.receipt_body.protocol_version = 'verimod/2'
    expect((await verifyReceipt(version, f.ctx)).code).toBe('UNSUPPORTED_VERSION')
  })

  it('선행 기록을 찾을 수 없으면 INCOMPLETE_HISTORY', async () => {
    const ctx = { ...f.ctx, findBundle: () => null }
    expect((await verifyReceipt(f.review, ctx)).lifecycle.state).toBe('INCOMPLETE_HISTORY')
  })

  it('유지 결과인데 조치를 바꾸면 연결 규칙 위반', () => {
    const review = clone(f.review.receipt_body)
    if (review.event_kind !== 'REVIEW') throw new Error('fixture')
    review.payload.outcome = 'UPHOLD'
    expect(transitionProblem(review, f.decision.receipt_body, f.appeal.receipt_body)).toBe('유지 결과는 원래 조치와 같아야 합니다')
  })

  it('W5: 제공된 synthetic lifecycle의 issuer_seq 역순과 중복을 거부한다', () => {
    const reversed = clone(f.review.receipt_body)
    if (reversed.event_kind !== 'REVIEW') throw new Error('fixture')
    reversed.issuer_seq = f.appeal.receipt_body.issuer_seq
    expect(transitionProblem(reversed, f.decision.receipt_body, f.appeal.receipt_body))
      .toBe('제공된 연결 기록의 issuer_seq가 단조 증가하지 않습니다')

    const direct = clone(f.decision.receipt_body)
    if (direct.event_kind !== 'DECISION') throw new Error('fixture')
    direct.payload.policy.action = 'HUMAN_REVIEW'
    const directReview = clone(f.review.receipt_body)
    if (directReview.event_kind !== 'REVIEW') throw new Error('fixture')
    directReview.subject_receipt_hash = f.decision.receipt_hash
    directReview.previous_receipt_hash = f.decision.receipt_hash
    directReview.issuer_seq = direct.issuer_seq
    directReview.payload.outcome = 'RESOLVED'
    directReview.payload.resulting_action = 'ALLOW'
    expect(transitionProblem(directReview, direct, direct))
      .toBe('연결 기록의 issuer_seq가 최초 판정 뒤로 증가하지 않습니다')
  })

  it('W5: UUID 충돌로 issuer_seq 역순을 우회하지 않고 Core와 Lifecycle을 분리한다', async () => {
    const decision = buildDecision({
      receiptId: '00000000-0000-4000-8000-000000000010', issuerSeq: 10, recordedAt: '2026-09-10T00:00:00.000Z',
      inference: clone((f.decision.receipt_body as Extract<ReceiptBody, { event_kind: 'DECISION' }>).payload.inference) as Parameters<typeof buildDecision>[0]['inference'],
      policy: clone((f.decision.receipt_body as Extract<ReceiptBody, { event_kind: 'DECISION' }>).payload.policy),
    })
    const decisionHash = await receiptHash(decision)
    const appeal = buildAppeal({
      receiptId: decision.receipt_id, issuerSeq: 30, recordedAt: '2026-09-10T00:01:00.000Z', decision, decisionHash,
      appealCommitment: await appealCommitment(randomHex32(), 'synthetic appeal'), reasonCode: 'CONTEXT_MISSING',
    })
    const appealHash = await receiptHash(appeal)
    const review = buildReview({
      receiptId: '00000000-0000-4000-8000-000000000020', issuerSeq: 20, recordedAt: '2026-09-10T00:02:00.000Z',
      decision, decisionHash, previousHash: appealHash, outcome: 'OVERTURN', resultingAction: 'ALLOW',
      reasonCodes: ['FALSE_POSITIVE_SLANG'], reviewPolicyHash: f.ctx.manifests.review,
    })
    const ledger = await lifecycleLedger([decision, appeal, review])
    const report = await verifyReceipt(ledger.bundles.get(ledger.hashes[2])!, ledger.ctx)
    expect(report.code).toBe('VALID')
    expect(report.lifecycle).toMatchObject({ state: 'FAILED', detail: expect.stringContaining('같은 receipt_id') })

    const distinctAppeal = buildAppeal({
      receiptId: '00000000-0000-4000-8000-000000000011', issuerSeq: 30, recordedAt: '2026-09-10T00:01:00.000Z', decision, decisionHash,
      appealCommitment: await appealCommitment(randomHex32(), 'synthetic appeal'), reasonCode: 'CONTEXT_MISSING',
    })
    const distinctAppealHash = await receiptHash(distinctAppeal)
    const reversedReview = buildReview({
      receiptId: '00000000-0000-4000-8000-000000000012', issuerSeq: 20, recordedAt: '2026-09-10T00:02:00.000Z',
      decision, decisionHash, previousHash: distinctAppealHash, outcome: 'OVERTURN', resultingAction: 'ALLOW',
      reasonCodes: ['FALSE_POSITIVE_SLANG'], reviewPolicyHash: f.ctx.manifests.review,
    })
    const reversedLedger = await lifecycleLedger([decision, distinctAppeal, reversedReview])
    expect((await verifyReceipt(reversedLedger.bundles.get(reversedLedger.hashes[2])!, reversedLedger.ctx)).lifecycle.state).toBe('FAILED')
  })

  it('W5: 순방향 연결과 hash가 같은 직접 REVIEW는 lifecycle을 통과한다', async () => {
    const decision = buildDecision({
      receiptId: '00000000-0000-4000-8000-000000000030', issuerSeq: 10, recordedAt: '2026-09-10T00:00:00.000Z',
      inference: clone((f.decision.receipt_body as Extract<ReceiptBody, { event_kind: 'DECISION' }>).payload.inference) as Parameters<typeof buildDecision>[0]['inference'],
      policy: { ...clone((f.decision.receipt_body as Extract<ReceiptBody, { event_kind: 'DECISION' }>).payload.policy), action: 'HUMAN_REVIEW' },
    })
    const decisionHash = await receiptHash(decision)
    const review = buildReview({
      receiptId: '00000000-0000-4000-8000-000000000031', issuerSeq: 20, recordedAt: '2026-09-10T00:01:00.000Z',
      decision, decisionHash, previousHash: decisionHash, outcome: 'RESOLVED', resultingAction: 'ALLOW',
      reasonCodes: ['FALSE_POSITIVE_SLANG'], reviewPolicyHash: f.ctx.manifests.review,
    })
    const ledger = await lifecycleLedger([decision, review])
    expect((await verifyReceipt(ledger.bundles.get(ledger.hashes[1])!, ledger.ctx)).lifecycle.state).toBe('PASSED')
  })

  it('W5: 선행 앵커 RPC 장애는 lifecycle 실패가 아니라 NOT_CHECKED다', async () => {
    f.chain.rpcDown = true
    const report = await verifyReceipt(f.review, f.ctx)
    expect(report.code).toBe('RPC_UNAVAILABLE')
    expect(report.lifecycle).toMatchObject({ state: 'NOT_CHECKED' })
  })
})
