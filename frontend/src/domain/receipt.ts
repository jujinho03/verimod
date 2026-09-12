import { canonicalBytes } from './canonical'
import { DOMAINS, domainHash, hexToBytes, utf8, type Hex32 } from './hash'
import {
  PROTOCOL_VERSION,
  type AppealBody,
  type DecisionBody,
  type FinalAction,
  type InferenceOutput,
  type PolicyEvaluation,
  type ReceiptBody,
  type ReviewBody,
  type ReviewOutcome,
} from './types'

export const ISSUER_ID = 'verimod-example-platform'

/** SHA256(ASCII "verimod:receipt:v1" + 0x00 + canonical body). */
export function receiptHash(body: ReceiptBody): Promise<Hex32> {
  return domainHash(DOMAINS.receipt, canonicalBytes(body))
}

/** SHA256(ASCII "verimod:content:v1" + 0x00 + salt32 + UTF8(원문)). 원문은 정규화하지 않는다. */
export function contentCommitment(salt: Hex32, text: string): Promise<Hex32> {
  return domainHash(DOMAINS.content, hexToBytes(salt), utf8(text))
}

export function appealCommitment(salt: Hex32, text: string): Promise<Hex32> {
  return domainHash(DOMAINS.appeal, hexToBytes(salt), utf8(text))
}

export function issuerCommitment(issuerId: string): Promise<Hex32> {
  return domainHash(DOMAINS.issuer, utf8(issuerId))
}

/** 항상 YYYY-MM-DDTHH:mm:ss.SSSZ 형식. */
export function isoTime(ms: number): string {
  return new Date(ms).toISOString()
}

export function buildDecision(input: {
  receiptId: string
  recordedAt: string
  inference: InferenceOutput
  policy: PolicyEvaluation
}): DecisionBody {
  return {
    protocol_version: PROTOCOL_VERSION,
    receipt_id: input.receiptId,
    issuer_id: ISSUER_ID,
    event_kind: 'DECISION',
    recorded_at: input.recordedAt,
    content_commitment: input.inference.content_commitment,
    subject_receipt_hash: null,
    previous_receipt_hash: null,
    payload: { inference: input.inference, policy: input.policy },
  }
}

export function buildAppeal(input: {
  receiptId: string
  recordedAt: string
  decision: DecisionBody
  decisionHash: Hex32
  appealCommitment: Hex32
  reasonCode: string
}): AppealBody {
  return {
    protocol_version: PROTOCOL_VERSION,
    receipt_id: input.receiptId,
    issuer_id: input.decision.issuer_id,
    event_kind: 'APPEAL',
    recorded_at: input.recordedAt,
    content_commitment: input.decision.content_commitment,
    subject_receipt_hash: input.decisionHash,
    previous_receipt_hash: input.decisionHash,
    payload: { appeal_commitment: input.appealCommitment, reason_code: input.reasonCode },
  }
}

export function buildReview(input: {
  receiptId: string
  recordedAt: string
  decision: DecisionBody
  decisionHash: Hex32
  previousHash: Hex32
  outcome: ReviewOutcome
  resultingAction: FinalAction
  reasonCodes: string[]
  reviewPolicyHash: Hex32
}): ReviewBody {
  return {
    protocol_version: PROTOCOL_VERSION,
    receipt_id: input.receiptId,
    issuer_id: input.decision.issuer_id,
    event_kind: 'REVIEW',
    recorded_at: input.recordedAt,
    content_commitment: input.decision.content_commitment,
    subject_receipt_hash: input.decisionHash,
    previous_receipt_hash: input.previousHash,
    payload: {
      outcome: input.outcome,
      resulting_action: input.resultingAction,
      reason_codes: [...new Set(input.reasonCodes)].sort(),
      review_policy_manifest_hash: input.reviewPolicyHash,
      reviewer_role: 'HUMAN_REVIEWER',
    },
  }
}
