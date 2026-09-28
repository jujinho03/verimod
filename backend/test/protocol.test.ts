import { describe, expect, it } from 'vitest'
import { canonicalBytes, canonicalize } from '@verimod/protocol/canonical'
import { bytesToHex, domainHash } from '@verimod/protocol/hash'
import { validateReceiptBody } from '@verimod/protocol/schema'

describe('shared protocol import', () => {
  it('uses the same canonical bytes and receipt domain hash as the browser core', async () => {
    const body = { receipt_id: 'example', payload: { value: null }, protocol_version: 'verimod/1' }
    const bytes = canonicalBytes(body)
    expect(new TextDecoder().decode(bytes)).toBe(canonicalize(body))
    expect(await domainHash('verimod:receipt:v1', bytes)).toBe(
      bytesToHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(
        'verimod:receipt:v1\u0000{"payload":{"value":null},"protocol_version":"verimod/1","receipt_id":"example"}',
      )).then((value) => new Uint8Array(value))),
    )
  })

  it('shares runtime ReceiptBody schema rejection with the browser', () => {
    expect(validateReceiptBody({ protocol_version: 'verimod/1' }).ok).toBe(false)
  })
})
