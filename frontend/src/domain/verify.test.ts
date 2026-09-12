import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { freezeEpoch } from './epoch'
import { randomHex32, type Hex32 } from './hash'
import { manifestHashes } from './manifests'
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
    recordedAt: '2026-09-08T01:12:30.000Z',
    inference,
    policy: evaluatePolicy(inference, manifests.policy),
  })
  const decisionHash = await receiptHash(decision)
  const appeal = buildAppeal({
    receiptId: crypto.randomUUID(),
    recordedAt: '2026-09-08T02:00:00.000Z',
    decision,
    decisionHash,
    appealCommitment: await appealCommitment(randomHex32(), '영화 칭찬이었습니다.'),
    reasonCode: 'CONTEXT_MISSING',
  })
  const appealHash = await receiptHash(appeal)
  const review = buildReview({
    receiptId: crypto.randomUUID(),
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
    copy.receipt_body.payload.inference.scores_ppm.violence = 120_000
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
})
