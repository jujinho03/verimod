import type { Hex32 } from './hash'

/** docs/01 §4의 제안 값. 팀 합의 전 시험 구현에서만 사용한다. */
export const PROTOCOL_VERSION = 'verimod/1'
export const PROTOCOL_VERSION_NUMBER = 1

export type Action = 'ALLOW' | 'HUMAN_REVIEW' | 'RESTRICT'
export type FinalAction = 'ALLOW' | 'RESTRICT'
export type EventKind = 'DECISION' | 'APPEAL' | 'REVIEW'
/**
 * UPHOLD/OVERTURN은 이의제기 검토, RESOLVED는 HUMAN_REVIEW 판정을 직접 검토로 끝낼 때 쓰는 임시 값이다.
 * 직접 검토의 outcome은 MASTER_CONTEXT D08에서 아직 정하지 않았다.
 */
export type ReviewOutcome = 'OVERTURN' | 'RESOLVED' | 'UPHOLD'

/** ASCII 오름차순. 기획서의 예시 항목 중 허위정보는 별도 검토 대상이라 넣지 않았다. */
export const LABEL_IDS = ['hate', 'profanity', 'sexual', 'spam', 'violence'] as const
export type LabelId = (typeof LABEL_IDS)[number]
export type ScoresPpm = Record<LabelId, number>

export interface EvidenceSpan {
  start: number
  end: number
  label_id: LabelId
  method_id: string
  method_version: string
}

export interface InferenceOutput {
  output_version: 'inference/1'
  inference_id: string
  content_commitment: Hex32
  model_manifest_hash: Hex32
  taxonomy_id: string
  taxonomy_version: string
  scores_ppm: ScoresPpm
  score_semantics: 'CALIBRATED' | 'UNCALIBRATED'
  input_status: 'FULL' | 'TRUNCATED'
  evidence: EvidenceSpan[]
  inferred_at: string
}

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
