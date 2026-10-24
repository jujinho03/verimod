import { isHex32, type Hex32 } from './hash'
import { parseUniqueJson } from './json'
import { contentCommitment } from './receipt'
import type { ReceiptBody } from './types'
import type { CoreReport, SideCheck } from './verify'

export const PACKAGE_VERSION = 'verimod-private/1'
export interface PrivateReceiptPackage {
  package_version: typeof PACKAGE_VERSION
  receipt_id: string
  original_text: string
  /** Same unprefixed 32-byte salt as the owner issuance response. */
  content_salt: string
  content_commitment: Hex32
}

/** Local-only parser. Errors never include the input, filename, or private fields. */
export function parsePrivatePackage(input: unknown): PrivateReceiptPackage {
  try {
    const value: unknown = typeof input === 'string' ? parseUniqueJson(input) : input
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error()
    const p = value as Record<string, unknown>
    if (Object.keys(p).sort().join(',') !== 'content_commitment,content_salt,original_text,package_version,receipt_id' ||
      p.package_version !== PACKAGE_VERSION || typeof p.receipt_id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(p.receipt_id) ||
      typeof p.original_text !== 'string' || typeof p.content_salt !== 'string' ||
      !/^[0-9a-f]{64}$/.test(p.content_salt) || !isHex32(p.content_commitment)) throw Error()
    // UTF-8 encoding must not silently replace unpaired surrogates.
    if (new TextDecoder('utf-8', { fatal: true }).decode(new TextEncoder().encode(p.original_text)) !== p.original_text) throw Error()
    return { package_version: PACKAGE_VERSION, receipt_id: p.receipt_id, original_text: p.original_text,
      content_salt: p.content_salt, content_commitment: p.content_commitment }
  } catch { throw new Error('Private Package 형식 또는 버전을 확인하세요.') }
}

export async function createPrivatePackage(body: ReceiptBody, text: string, salt: string): Promise<PrivateReceiptPackage> {
  const p = parsePrivatePackage({ package_version: PACKAGE_VERSION, receipt_id: body.receipt_id,
    original_text: text, content_salt: salt.replace(/^0x/, ''), content_commitment: body.content_commitment })
  if (await contentCommitment(`0x${p.content_salt}`, p.original_text) !== body.content_commitment) {
    throw new Error('소유자 자료가 영수증 commitment와 일치하지 않습니다.')
  }
  return p
}

/** Core must succeed first. Package copies are never trust roots. No storage or network I/O. */
export async function checkPrivatePackage(input: unknown, core: CoreReport): Promise<SideCheck> {
  if (core.code !== 'VALID' || !core.body) return { state: 'NOT_CHECKED', detail: 'Core VALID 이후에만 비공개 자료를 대조합니다.' }
  if (input == null) return { state: 'NOT_CHECKED', detail: 'Private Package를 제공하지 않았습니다.' }
  try {
    const p = parsePrivatePackage(input)
    if (p.receipt_id !== core.body.receipt_id || p.content_commitment !== core.body.content_commitment ||
      await contentCommitment(`0x${p.content_salt}`, p.original_text) !== core.body.content_commitment) {
      return { state: 'FAILED', detail: 'Package의 ID 또는 commitment가 검증된 영수증과 일치하지 않습니다.' }
    }
    return { state: 'PASSED', detail: 'Package의 ID와 원문·salt 재계산값이 검증된 영수증과 일치합니다.' }
  } catch { return { state: 'FAILED', detail: 'Private Package 형식 또는 버전이 올바르지 않습니다.' } }
}
