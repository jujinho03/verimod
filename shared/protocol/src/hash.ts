export type Bytes = Uint8Array<ArrayBuffer>
export type Hex32 = `0x${string}`

const encoder = new TextEncoder()
const HEX32 = /^0x[0-9a-f]{64}$/

export const DOMAINS = {
  receipt: 'verimod:receipt:v1',
  model: 'verimod:model:v1',
  policy: 'verimod:policy:v1',
  content: 'verimod:content:v1',
  appeal: 'verimod:appeal:v1',
  issuer: 'verimod:issuer:v1',
} as const

export function utf8(text: string): Bytes {
  return encoder.encode(text)
}

export function concatBytes(...parts: Bytes[]): Bytes {
  const out = new Uint8Array(parts.reduce((size, part) => size + part.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

export function isHex32(value: unknown): value is Hex32 {
  return typeof value === 'string' && HEX32.test(value)
}

export function bytesToHex(bytes: Bytes): Hex32 {
  if (bytes.length !== 32) throw new Error('Hex32는 정확히 32 bytes여야 합니다')
  let hex = '0x'
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0')
  return hex as Hex32
}

export function hexToBytes(hex: Hex32): Bytes {
  if (!isHex32(hex)) throw new Error('잘못된 Hex32')
  const out = new Uint8Array((hex.length - 2) / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(2 + i * 2, 4 + i * 2), 16)
  }
  return out
}

export function bytesEqual(a: Bytes, b: Bytes): boolean {
  if (a.length !== b.length) return false
  return a.every((byte, i) => byte === b[i])
}

export async function sha256(bytes: Bytes): Promise<Bytes> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
}

export function randomHex32(): Hex32 {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(32)))
}

/** SHA256(ASCII domain + 0x00 + payload) — docs/01 §5의 도메인 분리 제안. */
export async function domainHash(domain: string, ...payload: Bytes[]): Promise<Hex32> {
  return bytesToHex(await sha256(concatBytes(utf8(domain), new Uint8Array([0]), ...payload)))
}
