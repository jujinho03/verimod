import { canonicalBytes } from './canonical'
import { DOMAINS, domainHash, type Hex32 } from './hash'
import type { LabelId } from './types'

/**
 * 합성 manifest. 실제 모델 artifact·평가를 거친 threshold가 아니며
 * 사이트가 판정 → 영수증 → 검증 흐름을 보여주기 위한 예시 값이다.
 */
export const TAXONOMY = { id: 'verimod-example-ko', version: '0' } as const
export const MAX_INPUT_CODE_POINTS = 500

export const LABEL_NAMES: Record<LabelId, string> = {
  hate: '혐오',
  profanity: '욕설',
  sexual: '성적 표현',
  spam: '스팸',
  violence: '폭력',
}

export interface PolicyRule {
  rule_id: string
  label_id: LabelId
  comparison: 'GTE'
  threshold_ppm: number
  action: 'HUMAN_REVIEW' | 'RESTRICT'
}

const THRESHOLDS: Record<LabelId, { review: number; restrict: number }> = {
  hate: { review: 400_000, restrict: 800_000 },
  profanity: { review: 400_000, restrict: 800_000 },
  sexual: { review: 400_000, restrict: 800_000 },
  spam: { review: 400_000, restrict: 850_000 },
  violence: { review: 400_000, restrict: 800_000 },
}

const RULES: PolicyRule[] = (Object.keys(THRESHOLDS) as LabelId[])
  .flatMap((label): PolicyRule[] => [
    {
      rule_id: `R-${label.toUpperCase()}-RESTRICT`,
      label_id: label,
      comparison: 'GTE',
      threshold_ppm: THRESHOLDS[label].restrict,
      action: 'RESTRICT',
    },
    {
      rule_id: `R-${label.toUpperCase()}-REVIEW`,
      label_id: label,
      comparison: 'GTE',
      threshold_ppm: THRESHOLDS[label].review,
      action: 'HUMAN_REVIEW',
    },
  ])
  .sort((a, b) => (a.rule_id < b.rule_id ? -1 : 1))

export const TRUNCATION_RULE_ID = 'R-INPUT-TRUNCATED'

export const POLICY_MANIFEST = {
  manifest_version: 'policy-manifest/1',
  policy_id: 'verimod-example-policy',
  version_label: '2026-09-synthetic',
  status: 'SYNTHETIC_EXAMPLE',
  taxonomy_id: TAXONOMY.id,
  taxonomy_version: TAXONOMY.version,
  score_unit: 'PPM_INTEGER',
  input_limit: {
    max_code_points: MAX_INPUT_CODE_POINTS,
    over_limit_status: 'TRUNCATED',
    rule_id: TRUNCATION_RULE_ID,
    action: 'HUMAN_REVIEW',
  },
  precedence: [TRUNCATION_RULE_ID, 'RESTRICT', 'HUMAN_REVIEW', 'ALLOW'],
  rules: RULES,
}

export const MODEL_MANIFEST = {
  manifest_version: 'model-manifest/1',
  model_id: 'verimod-synthetic-keyword-scorer',
  revision: '0.1.0',
  kind: 'SYNTHETIC',
  description: '실제 AI 모델이 아닌 키워드 기반 합성 점수 생성기',
  taxonomy_id: TAXONOMY.id,
  taxonomy_version: TAXONOMY.version,
  preprocessing: {
    unicode_normalization: 'NONE',
    max_code_points: MAX_INPUT_CODE_POINTS,
    truncation: 'HEAD',
  },
  score_semantics: 'UNCALIBRATED',
  calibration: 'NONE',
  artifacts: [],
}

export const APPEAL_REASONS: Record<string, string> = {
  CONTEXT_MISSING: '맥락이 반영되지 않았습니다',
  FALSE_POSITIVE_CLAIM: '규칙 위반이 아니라고 생각합니다',
  USER_REQUESTED_REVIEW: '사람의 검토를 요청합니다',
}

export const REVIEW_REASONS: Record<string, string> = {
  CONTEXT_NOT_HARMFUL: '맥락상 유해하지 않음',
  FALSE_POSITIVE_SLANG: '관용 표현을 잘못 분류함',
  INSUFFICIENT_EVIDENCE: '제한할 근거가 부족함',
  POLICY_VIOLATION_CONFIRMED: '정책 위반이 확인됨',
  REPEATED_SPAM_PATTERN: '반복적인 스팸 형태',
}

export const REVIEW_POLICY_MANIFEST = {
  manifest_version: 'review-policy-manifest/1',
  policy_id: 'verimod-example-review',
  version_label: '2026-09-synthetic',
  status: 'SYNTHETIC_EXAMPLE',
  outcomes_for_appeal: ['OVERTURN', 'UPHOLD'],
  outcomes_for_direct_review: ['RESOLVED'],
  reason_codes: Object.keys(REVIEW_REASONS).sort(),
}

export interface ManifestHashes {
  model: Hex32
  policy: Hex32
  review: Hex32
}

let cached: Promise<ManifestHashes> | null = null

export function manifestHashes(): Promise<ManifestHashes> {
  cached ??= (async () => ({
    model: await domainHash(DOMAINS.model, canonicalBytes(MODEL_MANIFEST)),
    policy: await domainHash(DOMAINS.policy, canonicalBytes(POLICY_MANIFEST)),
    review: await domainHash(DOMAINS.policy, canonicalBytes(REVIEW_POLICY_MANIFEST)),
  }))()
  return cached
}
