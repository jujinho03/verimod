import { hexToBytes, type Hex32 } from './hash'
import type { ManifestHashes } from './manifests'
import { verifyInclusion } from './merkle'
import { contentCommitment, receiptHash } from './receipt'
import { validateBundle } from './schema'
import type { AppealBody, ReceiptBody, ReviewBody, VerificationBundle } from './types'

export const REQUIRED_CONFIRMATIONS = 12

/** 검증기가 미리 믿기로 정한 체인·컨트랙트·발급자. 번들에 적힌 locator는 신뢰 근거가 아니다. */
export interface TrustConfig {
  chain_id: string
  contract_address: string
  issuer_id: string
  issuer_commitment: Hex32
  publisher: string
  protocol_version: number
}

export interface EpochRecord {
  epoch_id: string
  root: Hex32
  receipt_count: number
  protocol_version: number
  publisher: string
  issuer_commitment: Hex32
  anchored_block: number
}

export class RpcUnavailableError extends Error {}

export interface LedgerReader {
  /** 컨트랙트에 등록된 epoch를 조회한다. 아직 블록에 포함되지 않았으면 null. RPC 장애는 RpcUnavailableError. */
  getEpoch(contractAddress: string, epochId: string): Promise<EpochRecord | null>
  blockNumber(): Promise<number>
}

export interface PrivateContent {
  salt: Hex32
  text: string
}

export interface VerifierContext {
  trust: TrustConfig
  ledger: LedgerReader
  manifests: ManifestHashes
  findBundle(receiptHash: Hex32): VerificationBundle | null
  findPrivateContent(commitment: Hex32): PrivateContent | null
}

export type VerifyCode =
  | 'VALID'
  | 'INVALID_SCHEMA'
  | 'UNSUPPORTED_VERSION'
  | 'HASH_MISMATCH'
  | 'INVALID_PROOF'
  | 'UNTRUSTED_ANCHOR'
  | 'PENDING_ANCHOR'
  | 'RPC_UNAVAILABLE'

export type StepId = 'schema' | 'hash' | 'anchor' | 'epoch' | 'inclusion' | 'finality'
export type StepState = 'PASSED' | 'FAILED' | 'PENDING' | 'SKIPPED'

export interface VerifyStep {
  id: StepId
  state: StepState
  detail: string
}

export type SideState = 'PASSED' | 'FAILED' | 'NOT_CHECKED' | 'INCOMPLETE_HISTORY'

export interface SideCheck {
  state: SideState
  detail: string
}

export interface CoreReport {
  code: VerifyCode
  steps: VerifyStep[]
  body: ReceiptBody | null
  claimedHash: Hex32 | null
  recomputedHash: Hex32 | null
  confirmations: number | null
}

export interface VerifyReport extends CoreReport {
  manifest: SideCheck
  content: SideCheck
  lifecycle: SideCheck
}

export const STEP_ORDER: StepId[] = ['schema', 'hash', 'anchor', 'epoch', 'inclusion', 'finality']

/** docs/01 §7 순서: 형식 → 해시 재계산 → 신뢰 앵커 → epoch 조회 → 포함 증명 → 확정. */
export async function verifyCore(input: unknown, ctx: VerifierContext): Promise<CoreReport> {
  const steps: VerifyStep[] = []
  const partial: Omit<CoreReport, 'code' | 'steps'> = { body: null, claimedHash: null, recomputedHash: null, confirmations: null }
  const step = (id: StepId, state: StepState, detail: string) => steps.push({ id, state, detail })
  const done = (code: VerifyCode): CoreReport => {
    for (const id of STEP_ORDER) {
      if (!steps.some((s) => s.id === id)) step(id, 'SKIPPED', '앞 단계에서 멈춰 확인하지 않았습니다')
    }
    return { code, steps, ...partial }
  }

  const parsed = validateBundle(input)
  if (!parsed.ok) {
    step('schema', 'FAILED', parsed.message)
    return done(parsed.code)
  }
  const { receipt_body: body, receipt_hash: claimed, proof, anchor } = parsed.value
  partial.body = body
  partial.claimedHash = claimed
  step('schema', 'PASSED', `${body.protocol_version} 형식의 ${body.event_kind} 기록입니다`)

  const recomputed = await receiptHash(body)
  partial.recomputedHash = recomputed
  if (recomputed !== claimed) {
    step('hash', 'FAILED', '본문으로 다시 계산한 해시가 영수증에 적힌 해시와 다릅니다')
    return done('HASH_MISMATCH')
  }
  step('hash', 'PASSED', '본문으로 다시 계산한 해시가 영수증에 적힌 해시와 같습니다')

  if (!proof || !anchor) {
    step('anchor', 'PENDING', '아직 배치에 포함되지 않아 포함 증명과 앵커 정보가 없습니다')
    return done('PENDING_ANCHOR')
  }
  if (anchor.chain_id !== ctx.trust.chain_id || anchor.contract_address !== ctx.trust.contract_address) {
    step('anchor', 'FAILED', '신뢰 설정에 없는 체인 또는 컨트랙트를 가리킵니다')
    return done('UNTRUSTED_ANCHOR')
  }
  if (body.issuer_id !== ctx.trust.issuer_id) {
    step('anchor', 'FAILED', '신뢰 설정과 다른 발급자의 영수증입니다')
    return done('UNTRUSTED_ANCHOR')
  }
  step('anchor', 'PASSED', `신뢰 설정의 체인 ${anchor.chain_id}과 컨트랙트를 가리킵니다`)

  let epoch: EpochRecord | null
  let block: number
  try {
    epoch = await ctx.ledger.getEpoch(ctx.trust.contract_address, anchor.epoch_id)
    block = await ctx.ledger.blockNumber()
  } catch (error) {
    if (!(error instanceof RpcUnavailableError)) throw error
    step('epoch', 'PENDING', 'RPC가 응답하지 않아 원장을 조회하지 못했습니다. 변조로 판단하지 않습니다')
    return done('RPC_UNAVAILABLE')
  }
  if (!epoch) {
    step('epoch', 'PENDING', `원장에 epoch #${anchor.epoch_id}가 아직 기록되지 않았습니다`)
    return done('PENDING_ANCHOR')
  }
  if (epoch.publisher !== ctx.trust.publisher || epoch.issuer_commitment !== ctx.trust.issuer_commitment) {
    step('epoch', 'FAILED', '원장에 epoch를 등록한 주체가 신뢰 설정과 다릅니다')
    return done('UNTRUSTED_ANCHOR')
  }
  if (epoch.protocol_version !== ctx.trust.protocol_version) {
    step('epoch', 'FAILED', `지원하지 않는 protocol version ${epoch.protocol_version}으로 등록된 epoch입니다`)
    return done('UNSUPPORTED_VERSION')
  }
  step('epoch', 'PASSED', `epoch #${epoch.epoch_id} · receipt ${epoch.receipt_count}건 · block ${epoch.anchored_block}`)

  if (proof.tree_size !== epoch.receipt_count) {
    step('inclusion', 'FAILED', `증명의 트리 크기 ${proof.tree_size}가 원장의 receipt 수 ${epoch.receipt_count}와 다릅니다`)
    return done('INVALID_PROOF')
  }
  const included = await verifyInclusion(
    hexToBytes(recomputed),
    proof.leaf_index,
    proof.tree_size,
    proof.siblings.map(hexToBytes),
    hexToBytes(epoch.root),
  )
  if (!included) {
    step('inclusion', 'FAILED', '포함 증명으로 계산한 root가 원장의 root와 다릅니다')
    return done('INVALID_PROOF')
  }
  step('inclusion', 'PASSED', `leaf #${proof.leaf_index}에서 root까지 ${proof.siblings.length}단계 경로가 원장의 root와 일치합니다`)

  const confirmations = Math.max(0, block - epoch.anchored_block + 1)
  partial.confirmations = confirmations
  if (confirmations < REQUIRED_CONFIRMATIONS) {
    step('finality', 'PENDING', `블록 확인 ${confirmations}/${REQUIRED_CONFIRMATIONS}회. 확정 전에는 VALID로 표시하지 않습니다`)
    return done('PENDING_ANCHOR')
  }
  step('finality', 'PASSED', `블록 확인 ${confirmations}회 (기준 ${REQUIRED_CONFIRMATIONS}회)`)
  return done('VALID')
}

const notChecked = (detail: string): SideCheck => ({ state: 'NOT_CHECKED', detail })

function checkManifests(body: ReceiptBody, manifests: ManifestHashes): SideCheck {
  if (body.event_kind === 'APPEAL') return notChecked('이의제기 기록은 manifest를 참조하지 않습니다')
  if (body.event_kind === 'REVIEW') {
    return body.payload.review_policy_manifest_hash === manifests.review
      ? { state: 'PASSED', detail: '공개된 검토 정책 manifest 해시와 일치합니다' }
      : { state: 'FAILED', detail: '검토 정책 manifest 해시가 공개 목록에 없습니다' }
  }
  const unknown = [
    body.payload.inference.model_manifest_hash !== manifests.model && '모델',
    body.payload.policy.policy_manifest_hash !== manifests.policy && '정책',
  ].filter(Boolean)
  return unknown.length === 0
    ? { state: 'PASSED', detail: '공개된 모델·정책 manifest 해시와 일치합니다' }
    : { state: 'FAILED', detail: `${unknown.join('·')} manifest 해시가 공개 목록에 없습니다` }
}

async function checkContent(body: ReceiptBody, ctx: VerifierContext): Promise<SideCheck> {
  const own = ctx.findPrivateContent(body.content_commitment)
  if (!own) return notChecked('원문과 salt가 이 기기에 없어 확인하지 않았습니다')
  return (await contentCommitment(own.salt, own.text)) === body.content_commitment
    ? { state: 'PASSED', detail: '이 기기에 보관한 원문과 salt로 다시 계산한 commitment가 일치합니다' }
    : { state: 'FAILED', detail: '보관한 원문과 salt로 계산한 commitment가 다릅니다' }
}

/** 이의제기·검토 기록이 선행 기록과 맞게 연결됐는지 본다. 문제가 없으면 null. */
export function transitionProblem(body: AppealBody | ReviewBody, subject: ReceiptBody, previous: ReceiptBody): string | null {
  if (subject.event_kind !== 'DECISION') return '연결 대상이 최초 판정 기록이 아닙니다'
  for (const linked of [subject, previous]) {
    if (linked.issuer_id !== body.issuer_id) return '연결된 기록의 발급자가 서로 다릅니다'
    if (linked.content_commitment !== body.content_commitment) return '연결된 기록의 콘텐츠 commitment가 서로 다릅니다'
  }
  const original = subject.payload.policy.action
  if (body.event_kind === 'APPEAL') {
    return original === 'RESTRICT' ? null : '이의제기는 제한 판정에만 연결할 수 있습니다'
  }
  if (previous.event_kind === 'DECISION') {
    if (original !== 'HUMAN_REVIEW') return '직접 검토는 검토 보류 판정에만 연결할 수 있습니다'
    return body.payload.outcome === 'RESOLVED' ? null : '직접 검토의 결과는 RESOLVED여야 합니다'
  }
  if (previous.event_kind !== 'APPEAL' || previous.subject_receipt_hash !== body.subject_receipt_hash) {
    return '검토는 같은 판정에 대한 이의제기에 연결돼야 합니다'
  }
  const { outcome, resulting_action: resulting } = body.payload
  if (outcome === 'UPHOLD') return resulting === original ? null : '유지 결과는 원래 조치와 같아야 합니다'
  if (outcome === 'OVERTURN') return resulting !== original ? null : '변경 결과는 원래 조치와 달라야 합니다'
  return '이의제기 검토의 결과는 UPHOLD 또는 OVERTURN이어야 합니다'
}

async function checkLifecycle(body: ReceiptBody, ctx: VerifierContext): Promise<SideCheck> {
  if (body.event_kind === 'DECISION') return notChecked('최초 판정이라 연결할 선행 기록이 없습니다')

  const refs = [...new Set([body.subject_receipt_hash, body.previous_receipt_hash])]
  const bundles = refs.map((hash) => ctx.findBundle(hash))
  if (bundles.some((b) => b === null)) {
    return { state: 'INCOMPLETE_HISTORY', detail: '선행 기록을 찾지 못해 이력 전체를 확인할 수 없습니다' }
  }
  const reports = await Promise.all(bundles.map((b) => verifyCore(b, ctx)))
  if (reports.some((report, i) => report.recomputedHash !== refs[i])) {
    return { state: 'FAILED', detail: '선행 기록의 해시가 참조한 값과 다릅니다' }
  }
  if (reports.some((report) => report.code === 'PENDING_ANCHOR' || report.code === 'RPC_UNAVAILABLE')) {
    return notChecked('선행 기록의 앵커 확인이 아직 끝나지 않았습니다')
  }
  if (reports.some((report) => report.code !== 'VALID')) {
    return { state: 'FAILED', detail: '선행 기록의 포함 검증에 실패했습니다' }
  }
  const subject = reports[0].body as ReceiptBody
  const previous = (reports[1] ?? reports[0]).body as ReceiptBody
  const problem = transitionProblem(body, subject, previous)
  return problem
    ? { state: 'FAILED', detail: problem }
    : { state: 'PASSED', detail: `선행 기록 ${refs.length}건의 포함과 연결 규칙을 확인했습니다` }
}

export async function verifyReceipt(input: unknown, ctx: VerifierContext): Promise<VerifyReport> {
  const core = await verifyCore(input, ctx)
  if (!core.body) {
    const skipped = notChecked('형식 확인에 실패해 확인하지 않았습니다')
    return { ...core, manifest: skipped, content: skipped, lifecycle: skipped }
  }
  return {
    ...core,
    manifest: checkManifests(core.body, ctx.manifests),
    content: await checkContent(core.body, ctx),
    lifecycle: await checkLifecycle(core.body, ctx),
  }
}
