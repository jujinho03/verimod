import { sha256, utf8, type Hex32 } from './hash'
import { MAX_INPUT_CODE_POINTS, TAXONOMY } from './manifests'
import { LABEL_IDS, type EvidenceSpan, type LegacyInferenceOutput, type LabelId, type ScoresPpm } from './types'

/**
 * 합성 점수 생성기. 실제 AI 추론이 아니다.
 * 키워드 일치 수와 입력 hash에서 뽑은 작은 잡음으로 0~1,000,000 정수 점수를 만든다.
 */
export const SYNTHETIC_METHOD = { id: 'synthetic-keyword-match', version: '0.1' } as const

const KEYWORDS: Record<LabelId, string[]> = {
  hate: ['열등한', '쫓아내', '혐오스러운'],
  profanity: ['짜증나', '멍청', '바보', '젠장'],
  sexual: ['음란', '야한 사진', '성인 인증'],
  spam: ['무료', '당첨', '클릭', '할인코드', 'http'],
  violence: ['죽여', '때려', '부숴', '가만 안 둬'],
}

const MATCH_WEIGHT = 420_000
const NOISE_MIN = 20_000
const NOISE_SPAN = 120_000
const SCORE_CAP = 990_000

export type InferenceErrorCode = 'EMPTY_INPUT'

export class InferenceError extends Error {
  readonly code: InferenceErrorCode
  constructor(code: InferenceErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

export function codePointLength(text: string): number {
  let count = 0
  for (const _ of text) count++
  return count
}

function codePointIndex(text: string, utf16Index: number): number {
  return codePointLength(text.slice(0, utf16Index))
}

function findSpans(text: string, label: LabelId): EvidenceSpan[] {
  const spans: EvidenceSpan[] = []
  for (const keyword of KEYWORDS[label]) {
    let from = 0
    for (;;) {
      const at = text.indexOf(keyword, from)
      if (at === -1) break
      const start = codePointIndex(text, at)
      spans.push({
        start,
        end: start + codePointLength(keyword),
        label_id: label,
        method_id: SYNTHETIC_METHOD.id,
        method_version: SYNTHETIC_METHOD.version,
      })
      from = at + keyword.length
    }
  }
  return spans
}

async function noise(label: LabelId, text: string): Promise<number> {
  const digest = await sha256(utf8(`${label}\u0000${text}`))
  const n = ((digest[0] << 24) | (digest[1] << 16) | (digest[2] << 8) | digest[3]) >>> 0
  return NOISE_MIN + (n % NOISE_SPAN)
}

export function compareEvidence(a: EvidenceSpan, b: EvidenceSpan): number {
  return (
    a.start - b.start ||
    a.end - b.end ||
    (a.label_id < b.label_id ? -1 : a.label_id > b.label_id ? 1 : 0) ||
    (a.method_id < b.method_id ? -1 : a.method_id > b.method_id ? 1 : 0) ||
    (a.method_version < b.method_version ? -1 : a.method_version > b.method_version ? 1 : 0)
  )
}

export interface InferenceContext {
  inferenceId: string
  inferredAt: string
  contentCommitment: Hex32
  modelManifestHash: Hex32
}

export async function runSyntheticInference(text: string, ctx: InferenceContext): Promise<LegacyInferenceOutput> {
  if (text.trim().length === 0) {
    throw new InferenceError('EMPTY_INPUT', '판정할 내용을 입력하세요.')
  }

  const codePoints = Array.from(text)
  const truncated = codePoints.length > MAX_INPUT_CODE_POINTS
  const scored = truncated ? codePoints.slice(0, MAX_INPUT_CODE_POINTS).join('') : text

  const scores = {} as ScoresPpm
  const evidence: EvidenceSpan[] = []
  for (const label of LABEL_IDS) {
    const spans = findSpans(scored, label)
    scores[label] = Math.min(SCORE_CAP, (await noise(label, scored)) + spans.length * MATCH_WEIGHT)
    evidence.push(...spans)
  }

  return {
    output_version: 'inference/1',
    inference_id: ctx.inferenceId,
    content_commitment: ctx.contentCommitment,
    model_manifest_hash: ctx.modelManifestHash,
    taxonomy_id: TAXONOMY.id,
    taxonomy_version: TAXONOMY.version,
    scores_ppm: scores,
    score_semantics: 'UNCALIBRATED',
    input_status: truncated ? 'TRUNCATED' : 'FULL',
    evidence: evidence.sort(compareEvidence),
    inferred_at: ctx.inferredAt,
  }
}
