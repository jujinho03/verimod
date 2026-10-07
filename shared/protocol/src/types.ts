import type { Hex32 } from './hash.js'

/** docs/01 §4의 제안 값. 팀 합의 전 시험 구현에서만 사용한다. */
export const PROTOCOL_VERSION = 'verimod/1'
export const PROTOCOL_VERSION_NUMBER = 1

export type Action = 'ALLOW' | 'HUMAN_REVIEW' | 'RESTRICT'
export type FinalAction = 'ALLOW' | 'RESTRICT'
export type EventKind = 'DECISION' | 'APPEAL' | 'REVIEW'
/**
 * UPHOLD/OVERTURN은 이의제기 검토, RESOLVED는 HUMAN_REVIEW 판정을 직접 검토로 끝낼 때 쓰는 임시 값이다.
 * 직접 검토의 outcome은 docs/04-interface-contract-draft.md C02의 미확정 제안이다.
 */
export type ReviewOutcome = 'OVERTURN' | 'RESOLVED' | 'UPHOLD'

/** Historical synthetic demo only. Never require these keys for actual BEEP inference. */
export const LABEL_IDS = ['hate', 'profanity', 'sexual', 'spam', 'violence'] as const
export type LabelId = (typeof LABEL_IDS)[number]
export type ScoresPpm = Record<LabelId, number>
export const ACTUAL_TAXONOMY = { id: 'verimod-ko-beep-hate', version: '1' } as const
export const ACTUAL_NATIVE_CLASSES = ['hate', 'offensive', 'none'] as const
export const ACTUAL_SCORE_KEYS = ['hate', 'offensive'] as const
export type ActualScoresPpm = Record<(typeof ACTUAL_SCORE_KEYS)[number], number>

export interface EvidenceSpan {
  start: number
  end: number
  label_id: LabelId | 'offensive'
  method_id: string
  method_version: string
}

interface InferenceBase {
  output_version: 'inference/1'
  inference_id: string
  content_commitment: Hex32
  model_manifest_hash: Hex32
  score_semantics: 'CALIBRATED' | 'UNCALIBRATED'
  input_status: 'FULL' | 'TRUNCATED'
  evidence: EvidenceSpan[]
  inferred_at: string
}

export interface LegacyInferenceOutput extends InferenceBase {
  taxonomy_id: 'verimod-example-ko'
  taxonomy_version: '0'
  scores_ppm: ScoresPpm
}

export interface ActualInferenceOutput extends InferenceBase {
  taxonomy_id: typeof ACTUAL_TAXONOMY.id
  taxonomy_version: typeof ACTUAL_TAXONOMY.version
  scores_ppm: ActualScoresPpm
}

export type InferenceOutput = LegacyInferenceOutput | ActualInferenceOutput

export interface PolicyEvaluation {
  policy_manifest_hash: Hex32
  action: Action
  reason_codes: string[]
  triggered_rule_ids: string[]
}

export interface DecisionPayload {
  inference: InferenceOutput
  policy: PolicyEvaluation
}

export interface AppealPayload {
  appeal_commitment: Hex32
  reason_code: string
}

export interface ReviewPayload {
  outcome: ReviewOutcome
  resulting_action: FinalAction
  reason_codes: string[]
  review_policy_manifest_hash: Hex32
  reviewer_role: 'HUMAN_REVIEWER'
}

interface ReceiptBase {
  protocol_version: typeof PROTOCOL_VERSION
  receipt_id: string
  issuer_id: string
  /** 발급자별 1부터 빈틈없이 증가하는 감사용 순번. */
  issuer_seq: number
  recorded_at: string
  content_commitment: Hex32
}

export interface DecisionBody extends ReceiptBase {
  event_kind: 'DECISION'
  subject_receipt_hash: null
  previous_receipt_hash: null
  payload: DecisionPayload
}

export interface AppealBody extends ReceiptBase {
  event_kind: 'APPEAL'
  subject_receipt_hash: Hex32
  previous_receipt_hash: Hex32
  payload: AppealPayload
}

export interface ReviewBody extends ReceiptBase {
  event_kind: 'REVIEW'
  subject_receipt_hash: Hex32
  previous_receipt_hash: Hex32
  payload: ReviewPayload
}

export type ReceiptBody = DecisionBody | AppealBody | ReviewBody

export interface InclusionProof {
  merkle_spec: 'ct-sha256-receipt-v1'
  leaf_index: number
  tree_size: number
  siblings: Hex32[]
}

export interface AnchorLocator {
  chain_id: string
  contract_address: string
  epoch_id: string
  tx_hash: Hex32
  block_number: string
  block_hash: Hex32
}

/** receipt 본문과 나중에 붙는 증명·앵커 정보를 분리한 전달 구조 (docs/01 §4). */
export interface VerificationBundle {
  receipt_body: ReceiptBody
  receipt_hash: Hex32
  proof: InclusionProof | null
  anchor: AnchorLocator | null
}
