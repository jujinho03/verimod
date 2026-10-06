import type { VerificationBundle } from '../domain/types'

export interface ApiSuccess<T> {
  ok: true
  request_id: string
  data: T
}

export interface ApiFailure {
  ok: false
  request_id: string
  error: {
    code: string
    retryable: boolean
  }
}

export interface PrivateReceiptMaterial {
  receipt_id: string
  content_commitment: string
  /** API-00 candidate encoding: 32 bytes as lowercase hex without 0x. */
  content_salt: string
}

export interface DecisionCreated {
  bundle: VerificationBundle
  private_package: PrivateReceiptMaterial
}

export type ApiErrorKind = 'TIMEOUT' | 'NETWORK' | 'HTTP' | 'INVALID_RESPONSE'

export class ApiClientError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly code: string | null
  readonly retryable: boolean
  readonly requestId: string | null

  constructor(
    kind: ApiErrorKind,
    message: string,
    status: number | null = null,
    code: string | null = null,
    retryable = false,
    requestId: string | null = null,
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.kind = kind
    this.status = status
    this.code = code
    this.retryable = retryable
    this.requestId = requestId
  }
}
