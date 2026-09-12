import type { Hex32 } from './hash'
import { POLICY_MANIFEST, TRUNCATION_RULE_ID } from './manifests'
import type { InferenceOutput, PolicyEvaluation } from './types'

/**
 * docs/01 §3의 규칙 제안: 입력이 잘렸으면 먼저 검토 보류, 그다음 제한 threshold, 검토 threshold 순.
 * 점수는 생산자가 만든 정수 ppm만 비교한다.
 */
export function evaluatePolicy(
  inference: Pick<InferenceOutput, 'input_status' | 'scores_ppm'>,
  policyManifestHash: Hex32,
): PolicyEvaluation {
  if (inference.input_status === 'TRUNCATED') {
    return {
      policy_manifest_hash: policyManifestHash,
      action: 'HUMAN_REVIEW',
      reason_codes: ['INPUT_TRUNCATED'],
      triggered_rule_ids: [TRUNCATION_RULE_ID],
    }
  }

  const hit = (action: 'HUMAN_REVIEW' | 'RESTRICT') =>
    POLICY_MANIFEST.rules
      .filter((rule) => rule.action === action && inference.scores_ppm[rule.label_id] >= rule.threshold_ppm)
      .map((rule) => rule.rule_id)
      .sort()

  const restrict = hit('RESTRICT')
  if (restrict.length > 0) {
    return {
      policy_manifest_hash: policyManifestHash,
      action: 'RESTRICT',
      reason_codes: ['SCORE_GTE_RESTRICT_THRESHOLD'],
      triggered_rule_ids: restrict,
    }
  }

  const review = hit('HUMAN_REVIEW')
  if (review.length > 0) {
    return {
      policy_manifest_hash: policyManifestHash,
      action: 'HUMAN_REVIEW',
      reason_codes: ['SCORE_GTE_REVIEW_THRESHOLD'],
      triggered_rule_ids: review,
    }
  }

  return {
    policy_manifest_hash: policyManifestHash,
    action: 'ALLOW',
    reason_codes: ['NO_THRESHOLD_REACHED'],
    triggered_rule_ids: [],
  }
}
