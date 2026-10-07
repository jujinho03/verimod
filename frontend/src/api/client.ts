import { validateBundle } from '../domain/schema'
import type { VerificationBundle } from '../domain/types'
import { ApiClientError, type ApiFailure, type ApiSuccess, type DecisionCreated, type PrivateReceiptMaterial } from './types'

type Decoder<T> = (value: unknown) => T

export interface ApiClientOptions {
  baseUrl?: string
  timeoutMs?: number
  fetcher?: typeof fetch
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

function requestIdOf(value: unknown): string | null {
  return isObject(value) && typeof value.request_id === 'string' && value.request_id.length > 0 ? value.request_id : null
}

function decodeSuccess<T>(value: unknown, decodeData: Decoder<T>): ApiSuccess<T> {
  if (!isObject(value) || value.ok !== true || requestIdOf(value) === null || !('data' in value)) {
    throw new ApiClientError('INVALID_RESPONSE', '성공 응답 envelope 형식이 계약과 다릅니다')
  }
  return { ok: true, request_id: value.request_id as string, data: decodeData(value.data) }
}

function decodeFailure(value: unknown): ApiFailure | null {
  if (!isObject(value) || value.ok !== false || requestIdOf(value) === null || !isObject(value.error)) return null
  if (typeof value.error.code !== 'string' || typeof value.error.retryable !== 'boolean') return null
  return {
    ok: false,
    request_id: value.request_id as string,
    error: { code: value.error.code, retryable: value.error.retryable },
  }
}

export function decodeBundle(value: unknown): VerificationBundle {
  const parsed = validateBundle(value)
  if (!parsed.ok) throw new ApiClientError('INVALID_RESPONSE', `bundle 형식 오류: ${parsed.message}`)
  return parsed.value
}

function decodePrivateMaterial(value: unknown): PrivateReceiptMaterial {
  if (!isObject(value) || Object.keys(value).sort().join(',') !== 'content_commitment,content_salt,receipt_id') {
    throw new ApiClientError('INVALID_RESPONSE', 'private_package 필드가 계약과 다릅니다')
  }
  if (typeof value.receipt_id !== 'string' || typeof value.content_commitment !== 'string' || typeof value.content_salt !== 'string') {
    throw new ApiClientError('INVALID_RESPONSE', 'private_package 값 형식이 계약과 다릅니다')
  }
  if (!/^[0-9a-f]{64}$/.test(value.content_salt)) {
    throw new ApiClientError('INVALID_RESPONSE', 'content_salt는 32바이트 lowercase hex여야 합니다')
  }
  return value as unknown as PrivateReceiptMaterial
}

export function decodeDecisionCreated(value: unknown): DecisionCreated {
  if (!isObject(value) || !['bundle,private_package','bundle,private_package,state'].includes(Object.keys(value).sort().join(','))) {
    throw new ApiClientError('INVALID_RESPONSE', '판정 발급 data 형식이 계약과 다릅니다')
  }
  const bundle = decodeBundle(value.bundle)
  const material = decodePrivateMaterial(value.private_package)
  if (bundle.receipt_body.event_kind !== 'DECISION' || bundle.proof !== null || bundle.anchor !== null) {
    throw new ApiClientError('INVALID_RESPONSE', '신규 판정 응답은 미앵커 DECISION bundle이어야 합니다')
  }
  const actual = bundle.receipt_body.payload.inference.taxonomy_id === 'verimod-ko-beep-hate'
  if ((actual || 'state' in value) && value.state !== 'PENDING_ANCHOR') {
    throw new ApiClientError('INVALID_RESPONSE', '실제 W3 신규 발급 상태는 PENDING_ANCHOR여야 합니다')
  }
  if (material.receipt_id !== bundle.receipt_body.receipt_id || material.content_commitment !== bundle.receipt_body.content_commitment) {
    throw new ApiClientError('INVALID_RESPONSE', 'private_package가 발급된 영수증과 일치하지 않습니다')
  }
  return { bundle, private_package: material, ...(value.state === 'PENDING_ANCHOR' ? {state:'PENDING_ANCHOR' as const} : {}) }
}

export class VeriModApiClient {
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly fetcher: typeof fetch

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? '').replace(/\/$/, '')
    this.timeoutMs = options.timeoutMs ?? 8000
    this.fetcher = options.fetcher ?? fetch
  }

  /**
   * Request JSON keys are intentionally unknown until T freezes API-01.
   * The W3 boundary validates the response without inventing request fields.
   */
  postDecision(request: unknown, idempotencyKey: string): Promise<ApiSuccess<DecisionCreated>> {
    if (idempotencyKey.trim() === '') throw new ApiClientError('INVALID_RESPONSE', 'Idempotency-Key가 필요합니다')
    return this.request('/api/decisions', decodeDecisionCreated, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(request),
    })
  }

  /** GET response data remains caller-decoded until T freezes the exact receipt read model. */
  getReceipt<T>(receiptId: string, decodeData: Decoder<T>): Promise<ApiSuccess<T>> {
    return this.request(`/api/receipts/${encodeURIComponent(receiptId)}`, decodeData)
  }

  getBundle(receiptId: string): Promise<ApiSuccess<VerificationBundle>> {
    return this.request(`/api/receipts/${encodeURIComponent(receiptId)}/bundle`, decodeBundle)
  }

  private async request<T>(path: string, decodeData: Decoder<T>, init?: RequestInit): Promise<ApiSuccess<T>> {
    const controller = new AbortController()
    const timer = globalThis.setTimeout(() => controller.abort(), this.timeoutMs)
    let response: Response
    try {
      response = await this.fetcher(`${this.baseUrl}${path}`, { ...init, signal: controller.signal })
    } catch (error) {
      if (controller.signal.aborted) throw new ApiClientError('TIMEOUT', '서버 응답 시간이 초과됐습니다', null, null, true)
      throw new ApiClientError('NETWORK', error instanceof Error ? error.message : '네트워크 요청에 실패했습니다', null, null, true)
    } finally {
      globalThis.clearTimeout(timer)
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new ApiClientError('INVALID_RESPONSE', '서버가 JSON 응답을 반환하지 않았습니다', response.status)
    }

    if (!response.ok) {
      const failure = decodeFailure(payload)
      throw new ApiClientError(
        'HTTP',
        failure ? `서버 오류: ${failure.error.code}` : `서버 오류: HTTP ${response.status}`,
        response.status,
        failure?.error.code ?? null,
        failure?.error.retryable ?? response.status >= 500,
        failure?.request_id ?? requestIdOf(payload),
      )
    }
    return decodeSuccess(payload, decodeData)
  }
}
