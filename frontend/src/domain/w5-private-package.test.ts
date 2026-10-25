import { beforeAll, describe, expect, it } from 'vitest'
import { createPrivatePackage, parsePrivatePackage, checkPrivatePackage, type PrivateReceiptPackage } from './privatePackage'
import { syntheticLifecycleCase } from './syntheticLifecycle'
import { verifyReceipt, type VerifyReport } from './verify'
import { buildSeedState } from '../store/seed'
import { contentCommitment } from './receipt'

let core: VerifyReport
let p: PrivateReceiptPackage
let fixture: Awaited<ReturnType<typeof syntheticLifecycleCase>>
beforeAll(async () => {
  fixture = await syntheticLifecycleCase('NORMAL')
  core = await verifyReceipt(fixture.bundles[2], fixture.context)
  const seed = await buildSeedState()
  const own = seed.contents[core.body!.content_commitment]
  p = await createPrivatePackage(core.body!, own.text, own.salt)
})

describe('W5 local-only Private Receipt Package', () => {
  it('roundtrips exact five fields and keeps core independent of content', async () => {
    expect(core.code).toBe('VALID')
    expect(core.content.state).toBe('NOT_CHECKED')
    expect(parsePrivatePackage(JSON.stringify(p))).toEqual(p)
    const result = await verifyReceipt(fixture.bundles[2], { ...fixture.context, privatePackage: JSON.stringify(p) })
    expect(result.code).toBe('VALID')
    expect(result.content.state).toBe('PASSED')
  })
  it.each([
    ['text', { original_text: 'altered synthetic text' }], ['salt', { content_salt: 'f'.repeat(64) }],
    ['id', { receipt_id: '11111111-1111-4111-8111-111111111111' }],
    ['commitment copy', { content_commitment: `0x${'f'.repeat(64)}` }], ['version', { package_version: 'verimod-private/2' }],
    ['extra field', { secret: 'SYNTHETIC_PRIVATE_SENTINEL' }], ['bad salt', { content_salt: '0x' + '1'.repeat(64) }],
    ['lone surrogate', { original_text: '\ud800' }],
  ])('rejects %s without echoing material', async (_name, patch) => {
    const result = await checkPrivatePackage({ ...p, ...patch }, core)
    expect(result.state).toBe('FAILED')
    expect(result.detail).not.toContain('SYNTHETIC_PRIVATE_SENTINEL')
    expect(result.detail).not.toContain(p.content_salt)
  })
  it.each(['package_version', 'receipt_id', 'original_text', 'content_salt', 'content_commitment'])('rejects missing %s', async (key) => {
    const value = { ...p } as Record<string, unknown>; delete value[key]
    expect((await checkPrivatePackage(value, core)).state).toBe('FAILED')
  })
  it.each([null, undefined])('absent package stays NOT_CHECKED (%s)', async (value) => {
    expect((await checkPrivatePackage(value, core)).state).toBe('NOT_CHECKED')
  })
  it.each(['PENDING_ANCHOR', 'RPC_UNAVAILABLE', 'HASH_MISMATCH', 'INVALID_PROOF', 'INVALID_SCHEMA'] as const)('never passes content before core %s', async (code) => {
    expect((await checkPrivatePackage(p, { ...core, code })).state).toBe('NOT_CHECKED')
  })
  it('rejects duplicate, escaped duplicate and oversized raw input', () => {
    for (const raw of ['{"receipt_id":1,"receipt_id":2}', '{"receipt_id":1,"\\u0072eceipt_id":2}', 'x'.repeat(1_048_577)]) {
      expect(() => parsePrivatePackage(raw)).toThrow('Private Package 형식 또는 버전을 확인하세요.')
    }
  })
  it('preserves whitespace, decomposed Unicode, CRLF and astral text exactly', async () => {
    const text = '  e\u0301 한글😀\r\n '
    const salt = 'a'.repeat(64)
    const body = { ...core.body!, content_commitment: await contentCommitment(`0x${salt}`, text) }
    const exact = await createPrivatePackage(body, text, salt)
    expect((await checkPrivatePackage(exact, { ...core, body })).state).toBe('PASSED')
    for (const wrong of [text.trim(), text.normalize('NFC'), text.replace('\r\n', '\n')]) {
      expect((await checkPrivatePackage({ ...exact, original_text: wrong }, { ...core, body })).state).toBe('FAILED')
    }
  })
  it('does not include owner material in public bundles or reports', async () => {
    const report = await verifyReceipt(fixture.bundles[2], { ...fixture.context, privatePackage: p })
    const publicData = JSON.stringify({ bundle: fixture.bundles[2], report })
    for (const forbidden of [p.content_salt, p.original_text, 'original_text', 'content_salt', 'private_package']) expect(publicData).not.toContain(forbidden)
  })
})
