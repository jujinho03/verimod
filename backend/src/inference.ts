import { isHex32, type Hex32 } from '@verimod/protocol/hash'

export interface W3InferenceOutput {
  output_version: 'inference/1'
  inference_id: string
  content_commitment: Hex32
  model_manifest_hash: Hex32
  taxonomy_id: 'verimod-ko-beep-hate'
  taxonomy_version: string
  scores_ppm: { hate: number; offensive: number }
  score_semantics: 'CALIBRATED' | 'UNCALIBRATED'
  input_status: 'FULL' | 'TRUNCATED'
  evidence: []
  inferred_at: string
}

export interface W3PolicyEvaluation {
  policy_manifest_hash: Hex32
  action: 'ALLOW' | 'HUMAN_REVIEW' | 'RESTRICT'
  reason_codes: string[]
  triggered_rule_ids: string[]
}

export interface InferenceAdapter {
  infer(input: { text: string; contentCommitment: Hex32 }): Promise<W3InferenceOutput>
}

export interface PolicyEvaluator {
  evaluate(inference: W3InferenceOutput): Promise<W3PolicyEvaluation>
}

export class InferenceUnavailableError extends Error {
  constructor() {
    super('inference provider unavailable')
    this.name = 'InferenceUnavailableError'
  }
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const ASCII_ID = /^[A-Za-z0-9._:-]+$/

function sortedUniqueIds(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item, index) =>
    typeof item === 'string' && ASCII_ID.test(item) && (index === 0 || value[index - 1] < item),
  )
}

export function assertValidInference(value: W3InferenceOutput, commitment: Hex32): void {
  const scoreKeys = Object.keys(value.scores_ppm)
  const scores = Object.values(value.scores_ppm)
  if (
    value.output_version !== 'inference/1'
    || !UUID_V4.test(value.inference_id)
    || value.content_commitment !== commitment
    || !isHex32(value.model_manifest_hash)
    || value.taxonomy_id !== 'verimod-ko-beep-hate'
    || value.taxonomy_version.length === 0
    || scoreKeys.length !== 2
    || !scoreKeys.includes('hate')
    || !scoreKeys.includes('offensive')
    || scores.some((score) => !Number.isSafeInteger(score) || score < 0 || score > 1_000_000)
    || !['CALIBRATED', 'UNCALIBRATED'].includes(value.score_semantics)
    || !['FULL', 'TRUNCATED'].includes(value.input_status)
    || !Array.isArray(value.evidence)
    || Number.isNaN(Date.parse(value.inferred_at))
    || new Date(value.inferred_at).toISOString() !== value.inferred_at
  ) {
    throw new Error('invalid inference output')
  }
}

export function assertValidPolicy(value: W3PolicyEvaluation): void {
  if (
    !isHex32(value.policy_manifest_hash)
    || !['ALLOW', 'HUMAN_REVIEW', 'RESTRICT'].includes(value.action)
    || !sortedUniqueIds(value.reason_codes)
    || !sortedUniqueIds(value.triggered_rule_ids)
  ) {
    throw new Error('invalid policy output')
  }
}

export const unavailableInferenceAdapter: InferenceAdapter = {
  async infer() {
    throw new InferenceUnavailableError()
  },
}

export const unavailablePolicyEvaluator: PolicyEvaluator = {
  async evaluate() {
    throw new InferenceUnavailableError()
  },
}
