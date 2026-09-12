import { isHex32, type Hex32 } from './hash'
import { APPEAL_REASONS, REVIEW_REASONS, TAXONOMY } from './manifests'
import { MERKLE_SPEC } from './merkle'
import {
  LABEL_IDS,
  PROTOCOL_VERSION,
  type AnchorLocator,
  type InclusionProof,
  type ReceiptBody,
  type VerificationBundle,
} from './types'

export type SchemaFailure = { ok: false; code: 'INVALID_SCHEMA' | 'UNSUPPORTED_VERSION'; message: string }
export type SchemaResult<T> = { ok: true; value: T } | SchemaFailure

class SchemaError extends Error {}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const DECIMAL = /^(0|[1-9]\d*)$/
const ADDRESS = /^0x[0-9a-f]{40}$/
const ASCII_ID = /^[A-Za-z0-9._:-]+$/

function fail(message: string): never {
  throw new SchemaError(message)
}

type Obj = Record<string, unknown>

function object(value: unknown, path: string, keys: readonly string[]): Obj {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail(`${path}: 객체여야 합니다`)
  const record = value as Obj
  for (const key of Object.keys(record)) {
    if (!keys.includes(key)) fail(`${path}.${key}: 명세에 없는 필드입니다`)
  }
  for (const key of keys) {
    if (!(key in record)) fail(`${path}.${key}: 필드가 없습니다`)
  }
  return record
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) fail(`${path}: 비어 있지 않은 문자열이어야 합니다`)
  return value
}

function literal<T extends string>(value: unknown, path: string, allowed: readonly T[]): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    fail(`${path}: ${allowed.join(' / ')} 중 하나여야 합니다`)
  }
  return value as T
}

function hex32(value: unknown, path: string): Hex32 {
  if (!isHex32(value)) fail(`${path}: 0x와 소문자 hex 64자여야 합니다`)
  return value
}

function uuid(value: unknown, path: string) {
  if (typeof value !== 'string' || !UUID_V4.test(value)) fail(`${path}: 소문자 UUID v4여야 합니다`)
}

function isoTime(value: unknown, path: string) {
  if (typeof value !== 'string' || !ISO_UTC.test(value)) fail(`${path}: YYYY-MM-DDTHH:mm:ss.SSSZ 형식이어야 합니다`)
  const date = new Date(value)
  if (Number.isNaN(date.getTime()) || date.toISOString() !== value) fail(`${path}: 존재하지 않는 날짜입니다`)
}

function integer(value: unknown, path: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) {
    fail(`${path}: ${min}~${max} 범위의 정수여야 합니다`)
  }
  return value
}

function sortedIds(value: unknown, path: string, allowed?: readonly string[]): string[] {
  if (!Array.isArray(value)) fail(`${path}: 배열이어야 합니다`)
  value.forEach((item, i) => {
    if (typeof item !== 'string' || !ASCII_ID.test(item)) fail(`${path}[${i}]: ASCII ID여야 합니다`)
    if (allowed && !allowed.includes(item)) fail(`${path}[${i}]: 허용되지 않은 코드입니다`)
    if (i > 0 && !(value[i - 1] < item)) fail(`${path}: 중복 없이 오름차순이어야 합니다`)
  })
  return value as string[]
}

function inference(value: unknown, path: string, contentCommitment: Hex32) {
  const record = object(value, path, [
    'content_commitment',
    'evidence',
    'inference_id',
    'inferred_at',
    'input_status',
    'model_manifest_hash',
    'output_version',
    'score_semantics',
    'scores_ppm',
    'taxonomy_id',
    'taxonomy_version',
  ])
  literal(record.output_version, `${path}.output_version`, ['inference/1'])
  uuid(record.inference_id, `${path}.inference_id`)
  if (hex32(record.content_commitment, `${path}.content_commitment`) !== contentCommitment) {
    fail(`${path}.content_commitment: 상위 content_commitment와 같아야 합니다`)
  }
  hex32(record.model_manifest_hash, `${path}.model_manifest_hash`)
  if (string(record.taxonomy_id, `${path}.taxonomy_id`) !== TAXONOMY.id) fail(`${path}.taxonomy_id: 지원하지 않는 라벨 체계입니다`)
  if (string(record.taxonomy_version, `${path}.taxonomy_version`) !== TAXONOMY.version) {
    fail(`${path}.taxonomy_version: 지원하지 않는 라벨 체계 버전입니다`)
  }
  const scores = object(record.scores_ppm, `${path}.scores_ppm`, LABEL_IDS)
  for (const label of LABEL_IDS) integer(scores[label], `${path}.scores_ppm.${label}`, 0, 1_000_000)
  literal(record.score_semantics, `${path}.score_semantics`, ['CALIBRATED', 'UNCALIBRATED'])
  literal(record.input_status, `${path}.input_status`, ['FULL', 'TRUNCATED'])
  if (!Array.isArray(record.evidence)) fail(`${path}.evidence: 배열이어야 합니다`)
  record.evidence.forEach((span, i) => {
    const p = `${path}.evidence[${i}]`
    const s = object(span, p, ['end', 'label_id', 'method_id', 'method_version', 'start'])
    const start = integer(s.start, `${p}.start`, 0, Number.MAX_SAFE_INTEGER)
    integer(s.end, `${p}.end`, start + 1, Number.MAX_SAFE_INTEGER)
    literal(s.label_id, `${p}.label_id`, LABEL_IDS)
    string(s.method_id, `${p}.method_id`)
    string(s.method_version, `${p}.method_version`)
  })
  isoTime(record.inferred_at, `${path}.inferred_at`)
}

function policy(value: unknown, path: string) {
  const record = object(value, path, ['action', 'policy_manifest_hash', 'reason_codes', 'triggered_rule_ids'])
  hex32(record.policy_manifest_hash, `${path}.policy_manifest_hash`)
  literal(record.action, `${path}.action`, ['ALLOW', 'HUMAN_REVIEW', 'RESTRICT'])
  sortedIds(record.reason_codes, `${path}.reason_codes`)
  sortedIds(record.triggered_rule_ids, `${path}.triggered_rule_ids`)
}

function receiptBody(value: unknown): ReceiptBody {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const version = (value as Obj).protocol_version
    if (typeof version === 'string' && version !== PROTOCOL_VERSION) {
      throw new UnsupportedVersion(`protocol_version "${version}"는 지원하지 않습니다`)
    }
  }
  const body = object(value, 'receipt_body', [
    'content_commitment',
    'event_kind',
    'issuer_id',
    'payload',
    'previous_receipt_hash',
    'protocol_version',
    'receipt_id',
    'recorded_at',
    'subject_receipt_hash',
  ])
  literal(body.protocol_version, 'receipt_body.protocol_version', [PROTOCOL_VERSION])
  uuid(body.receipt_id, 'receipt_body.receipt_id')
  string(body.issuer_id, 'receipt_body.issuer_id')
  isoTime(body.recorded_at, 'receipt_body.recorded_at')
  const content = hex32(body.content_commitment, 'receipt_body.content_commitment')
  const kind = literal(body.event_kind, 'receipt_body.event_kind', ['APPEAL', 'DECISION', 'REVIEW'])

  if (kind === 'DECISION') {
    if (body.subject_receipt_hash !== null) fail('receipt_body.subject_receipt_hash: 최초 판정은 null이어야 합니다')
    if (body.previous_receipt_hash !== null) fail('receipt_body.previous_receipt_hash: 최초 판정은 null이어야 합니다')
    const payload = object(body.payload, 'receipt_body.payload', ['inference', 'policy'])
    inference(payload.inference, 'receipt_body.payload.inference', content)
    policy(payload.policy, 'receipt_body.payload.policy')
  } else {
    const subject = hex32(body.subject_receipt_hash, 'receipt_body.subject_receipt_hash')
    const previous = hex32(body.previous_receipt_hash, 'receipt_body.previous_receipt_hash')
    if (kind === 'APPEAL') {
      if (subject !== previous) fail('receipt_body.previous_receipt_hash: 이의제기는 최초 판정을 직접 가리켜야 합니다')
      const payload = object(body.payload, 'receipt_body.payload', ['appeal_commitment', 'reason_code'])
      hex32(payload.appeal_commitment, 'receipt_body.payload.appeal_commitment')
      literal(payload.reason_code, 'receipt_body.payload.reason_code', Object.keys(APPEAL_REASONS))
    } else {
      const payload = object(body.payload, 'receipt_body.payload', [
        'outcome',
        'reason_codes',
        'resulting_action',
        'review_policy_manifest_hash',
        'reviewer_role',
      ])
      literal(payload.outcome, 'receipt_body.payload.outcome', ['OVERTURN', 'RESOLVED', 'UPHOLD'])
      literal(payload.resulting_action, 'receipt_body.payload.resulting_action', ['ALLOW', 'RESTRICT'])
      const codes = sortedIds(payload.reason_codes, 'receipt_body.payload.reason_codes', Object.keys(REVIEW_REASONS))
      if (codes.length === 0) fail('receipt_body.payload.reason_codes: 사유가 하나 이상 필요합니다')
      hex32(payload.review_policy_manifest_hash, 'receipt_body.payload.review_policy_manifest_hash')
      literal(payload.reviewer_role, 'receipt_body.payload.reviewer_role', ['HUMAN_REVIEWER'])
    }
  }
  return value as ReceiptBody
}

class UnsupportedVersion extends Error {}

function proof(value: unknown): InclusionProof | null {
  if (value === null) return null
  const record = object(value, 'proof', ['leaf_index', 'merkle_spec', 'siblings', 'tree_size'])
  literal(record.merkle_spec, 'proof.merkle_spec', [MERKLE_SPEC])
  integer(record.tree_size, 'proof.tree_size', 1, 0xffffffff)
  integer(record.leaf_index, 'proof.leaf_index', 0, 0xffffffff)
  if (!Array.isArray(record.siblings)) fail('proof.siblings: 배열이어야 합니다')
  record.siblings.forEach((sibling, i) => hex32(sibling, `proof.siblings[${i}]`))
  return value as InclusionProof
}

function anchor(value: unknown): AnchorLocator | null {
  if (value === null) return null
  const record = object(value, 'anchor', ['block_hash', 'block_number', 'chain_id', 'contract_address', 'epoch_id', 'tx_hash'])
  for (const key of ['chain_id', 'epoch_id', 'block_number'] as const) {
    if (typeof record[key] !== 'string' || !DECIMAL.test(record[key] as string)) fail(`anchor.${key}: 10진수 문자열이어야 합니다`)
  }
  if (typeof record.contract_address !== 'string' || !ADDRESS.test(record.contract_address)) {
    fail('anchor.contract_address: 0x와 소문자 hex 40자여야 합니다')
  }
  hex32(record.tx_hash, 'anchor.tx_hash')
  hex32(record.block_hash, 'anchor.block_hash')
  return value as AnchorLocator
}

function run<T>(fn: () => T): SchemaResult<T> {
  try {
    return { ok: true, value: fn() }
  } catch (error) {
    if (error instanceof UnsupportedVersion) return { ok: false, code: 'UNSUPPORTED_VERSION', message: error.message }
    if (error instanceof SchemaError) return { ok: false, code: 'INVALID_SCHEMA', message: error.message }
    throw error
  }
}

export function validateReceiptBody(value: unknown): SchemaResult<ReceiptBody> {
  return run(() => receiptBody(value))
}

export function validateBundle(value: unknown): SchemaResult<VerificationBundle> {
  return run(() => {
    const record = object(value, 'bundle', ['anchor', 'proof', 'receipt_body', 'receipt_hash'])
    receiptBody(record.receipt_body)
    hex32(record.receipt_hash, 'receipt_hash')
    const p = proof(record.proof)
    const a = anchor(record.anchor)
    if ((p === null) !== (a === null)) fail('proof와 anchor는 함께 있거나 함께 null이어야 합니다')
    return value as VerificationBundle
  })
}

/** JSON 문자열을 해석한다. 문법 오류도 INVALID_SCHEMA로 돌려준다. */
export function parseBundleJson(text: string): SchemaResult<VerificationBundle> {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, code: 'INVALID_SCHEMA', message: 'JSON 문법이 올바르지 않습니다' }
  }
  return validateBundle(parsed)
}
