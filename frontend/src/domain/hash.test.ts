import { describe, expect, it } from 'vitest'
import { bytesToHex, concatBytes, domainHash, hexToBytes, sha256, utf8, type Hex32 } from './hash'

describe('hash', () => {
  it('SHA-256 표준 벡터 "abc"와 같다', async () => {
    expect(bytesToHex(await sha256(utf8('abc')))).toBe(
      '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('domain + 0x00 + payload를 해싱하고 domain이 다르면 값이 달라진다', async () => {
    const payload = utf8('{}')
    const manual = bytesToHex(await sha256(concatBytes(utf8('verimod:receipt:v1'), new Uint8Array([0]), payload)))
    expect(await domainHash('verimod:receipt:v1', payload)).toBe(manual)
    expect(await domainHash('verimod:policy:v1', payload)).not.toBe(manual)
  })

  it('hex와 bytes를 손실 없이 오간다', () => {
    const hex = `0x${'0a'.repeat(31)}ff` as Hex32
    expect(bytesToHex(hexToBytes(hex))).toBe(hex)
  })
})
