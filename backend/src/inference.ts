import { canonicalBytes } from '@verimod/protocol/canonical'
import { DOMAINS, domainHash, isHex32, type Hex32 } from '@verimod/protocol/hash'

export const W4_R01_MODEL_HASH: Hex32 = '0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1'
export const W4_PROVISIONAL_POLICY_HASH: Hex32 = '0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e'

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
  policyManifest: unknown
  /** The unapproved W4 policy is confined to explicitly enabled local E2E. */
  localW4E2E: boolean
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

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new InferenceUnavailableError()
  return value as Record<string, unknown>
}

export async function trustedModelHash(manifest: unknown): Promise<Hex32> {
  const model = record(manifest)
  if (model.manifest_type !== 'ACTUAL_TRAINED_MODEL' || model.run_id !== 'AI07-BL-KLUE-RB-45126-R01'
    || model.taxonomy_id !== 'verimod-ko-beep-hate' || model.taxonomy_version !== '1'
    || model.score_semantics !== 'UNCALIBRATED'
    || JSON.stringify(model.exposed_score_keys) !== '["hate","offensive"]') throw new InferenceUnavailableError()
  try {
    const hash = await domainHash(DOMAINS.model, canonicalBytes(manifest))
    if (hash !== W4_R01_MODEL_HASH) throw new InferenceUnavailableError()
    return hash
  } catch { throw new InferenceUnavailableError() }
}

export async function assertValidInference(value: W3InferenceOutput, commitment: Hex32, modelManifest: unknown): Promise<void> {
  const trustedHash = await trustedModelHash(modelManifest)
  if (typeof value !== 'object' || value === null || typeof value.scores_ppm !== 'object' || value.scores_ppm === null) throw new InferenceUnavailableError()
  const scoreKeys = Object.keys(value.scores_ppm)
  const scores = Object.values(value.scores_ppm)
  if (
    value.output_version !== 'inference/1'
    || !UUID_V4.test(value.inference_id)
    || value.content_commitment !== commitment
    || value.model_manifest_hash !== trustedHash
    || value.taxonomy_id !== 'verimod-ko-beep-hate'
    || value.taxonomy_version !== '1'
    || scoreKeys.length !== 2
    || !scoreKeys.includes('hate')
    || !scoreKeys.includes('offensive')
    || scores.some((score) => !Number.isSafeInteger(score) || score < 0 || score > 1_000_000)
    || value.score_semantics !== 'UNCALIBRATED'
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
    value.policy_manifest_hash !== W4_PROVISIONAL_POLICY_HASH
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

/** W4 provisional policy must match the pinned canonical manifest and exact active rules. */
async function assertTrustedPolicy(config: ThresholdPolicyConfig): Promise<void> {
  if (!config.localW4E2E || config.policyManifestHash !== W4_PROVISIONAL_POLICY_HASH) throw new InferenceUnavailableError()
  const manifest = record(config.policyManifest)
  try {
    if (await domainHash(DOMAINS.policy, canonicalBytes(manifest)) !== W4_PROVISIONAL_POLICY_HASH) throw new InferenceUnavailableError()
  } catch { throw new InferenceUnavailableError() }
  const thresholds = record(manifest.thresholds_ppm)
  for (const label of ['hate', 'offensive'] as const) {
    const expected = record(thresholds[label])
    if (config[label].review !== expected.review || config[label].restrict !== expected.restrict) throw new InferenceUnavailableError()
  }
  if (manifest.policy_status !== 'W4_PROVISIONAL' || manifest.usage !== 'W4_PROVISIONAL_E2E_ONLY'
    || manifest.team_approved !== false || manifest.model_manifest_hash !== W4_R01_MODEL_HASH
    || manifest.taxonomy_id !== 'verimod-ko-beep-hate' || manifest.taxonomy_version !== '1'
    || manifest.score_semantics !== 'UNCALIBRATED'
    || JSON.stringify(manifest.score_keys) !== '["hate","offensive"]'
    || manifest.comparison !== 'greater_than_or_equal'
    || JSON.stringify(manifest.precedence) !== '["TRUNCATED_HUMAN_REVIEW","ANY_RESTRICT","ANY_REVIEW","ALLOW"]'
    || JSON.stringify(manifest.truncated) !== '{"action":"HUMAN_REVIEW","overrides_high_scores":true,"reason_codes":["INPUT_TRUNCATED"],"triggered_rule_ids":["W4-TRUNCATED"]}'
    || JSON.stringify(manifest.score_rules) !== JSON.stringify([
      { label: 'hate', band: 'review', action: 'HUMAN_REVIEW', reason_code: 'SCORE_HATE_REVIEW', rule_id: 'W4-HATE-REVIEW' },
      { label: 'hate', band: 'restrict', action: 'RESTRICT', reason_code: 'SCORE_HATE_RESTRICT', rule_id: 'W4-HATE-RESTRICT' },
      { label: 'offensive', band: 'review', action: 'HUMAN_REVIEW', reason_code: 'SCORE_OFFENSIVE_REVIEW', rule_id: 'W4-OFFENSIVE-REVIEW' },
      { label: 'offensive', band: 'restrict', action: 'RESTRICT', reason_code: 'SCORE_OFFENSIVE_RESTRICT', rule_id: 'W4-OFFENSIVE-RESTRICT' },
    ]) || JSON.stringify(manifest.allow) !== '{"reason_codes":[],"triggered_rule_ids":[]}') throw new InferenceUnavailableError()
}

export function createThresholdPolicyEvaluator(config: ThresholdPolicyConfig): PolicyEvaluator {
  if (!isHex32(config.policyManifestHash)) throw new Error('policy manifest hash must be hex32')
  for (const label of ['hate', 'offensive'] as const) {
    const review = threshold(config[label].review, `${label}.review`)
    const restrict = threshold(config[label].restrict, `${label}.restrict`)
    if (review > restrict) throw new Error(`${label} review threshold cannot exceed restrict threshold`)
  }
  return {
    async evaluate(inference) {
      await assertTrustedPolicy(config)
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
