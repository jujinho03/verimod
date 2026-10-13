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

export interface ThresholdPolicyConfig {
  policyManifestHash: Hex32
  hate: { review: number; restrict: number }
  offensive: { review: number; restrict: number }
}

export class InferenceUnavailableError extends Error {
  constructor() {
    super('inference provider unavailable')
    this.name = 'InferenceUnavailableError'
  }
}

export interface HttpInferenceAdapterOptions {
  endpoint: string
  timeoutMs?: number
  fetcher?: typeof fetch
}

function inferenceEnvelope(value: unknown): W3InferenceOutput {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new InferenceUnavailableError()
  const record = value as Record<string, unknown>
  if (record.ok !== true || typeof record.request_id !== 'string' || !record.inference) throw new InferenceUnavailableError()
  return record.inference as W3InferenceOutput
}

/** I1 success envelope만 받아들이며 timeout, HTTP 오류, malformed output은 모두 safe failure로 닫는다. */
export function createHttpInferenceAdapter(options: HttpInferenceAdapterOptions): InferenceAdapter {
  const endpoint = options.endpoint.trim()
  if (!/^https?:\/\//.test(endpoint)) throw new Error('inference endpoint must be an absolute http(s) URL')
  const timeoutMs = options.timeoutMs ?? 8_000
  const fetcher = options.fetcher ?? fetch
  return {
    async infer({ text, contentCommitment }) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const response = await fetcher(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, content_commitment: contentCommitment }),
          signal: controller.signal,
        })
        if (!response.ok) throw new InferenceUnavailableError()
        return inferenceEnvelope(await response.json())
      } catch (error) {
        if (error instanceof InferenceUnavailableError) throw error
        throw new InferenceUnavailableError()
      } finally {
        clearTimeout(timer)
      }
    },
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

function threshold(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > 1_000_000) throw new Error(`${name} must be integer ppm`)
  return value
}

/** Validation 결과로 주입한 임계값만 사용한다. 소스 안에 운영 임계값 기본값을 두지 않는다. */
export function createThresholdPolicyEvaluator(config: ThresholdPolicyConfig): PolicyEvaluator {
  if (!isHex32(config.policyManifestHash)) throw new Error('policy manifest hash must be hex32')
  for (const label of ['hate', 'offensive'] as const) {
    const review = threshold(config[label].review, `${label}.review`)
    const restrict = threshold(config[label].restrict, `${label}.restrict`)
    if (review > restrict) throw new Error(`${label} review threshold cannot exceed restrict threshold`)
  }
  return {
    async evaluate(inference) {
      if (inference.input_status === 'TRUNCATED') return {
        policy_manifest_hash: config.policyManifestHash,
        action: 'HUMAN_REVIEW', reason_codes: ['INPUT_TRUNCATED'], triggered_rule_ids: ['W4-TRUNCATED'],
      }
      const restricted = (['hate', 'offensive'] as const).filter((label) => inference.scores_ppm[label] >= config[label].restrict)
      if (restricted.length) return {
        policy_manifest_hash: config.policyManifestHash,
        action: 'RESTRICT', reason_codes: restricted.map((label) => `SCORE_${label.toUpperCase()}_RESTRICT`),
        triggered_rule_ids: restricted.map((label) => `W4-${label.toUpperCase()}-RESTRICT`),
      }
      const reviewed = (['hate', 'offensive'] as const).filter((label) => inference.scores_ppm[label] >= config[label].review)
      if (reviewed.length) return {
        policy_manifest_hash: config.policyManifestHash,
        action: 'HUMAN_REVIEW', reason_codes: reviewed.map((label) => `SCORE_${label.toUpperCase()}_REVIEW`),
        triggered_rule_ids: reviewed.map((label) => `W4-${label.toUpperCase()}-REVIEW`),
      }
      return { policy_manifest_hash: config.policyManifestHash, action: 'ALLOW', reason_codes: [], triggered_rule_ids: [] }
    },
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
