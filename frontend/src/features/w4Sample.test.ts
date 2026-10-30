import { describe, expect, it } from 'vitest'
import { receiptHash } from '../domain/receipt'
import { parseBundleJson } from '../domain/schema'
import { baseSepoliaProfileFromEnv } from '../domain/rpcLedger'
import { isW4Profile, w4OriginalJson, w4TamperedJson } from './w4Sample'

const env = {
  VITE_BASE_SEPOLIA_CONTRACT_ADDRESS: '0xd17ba590b23e984e3f3408bcdc3529be9868ec50',
  VITE_BASE_SEPOLIA_PUBLISHER: '0xd47675be41ec3476f541c1d8d8a9f622c90182ed',
  VITE_BASE_SEPOLIA_RPC_URLS: 'https://base-sepolia-rpc.publicnode.com,https://sepolia.base.org',
  VITE_BASE_SEPOLIA_DEPLOYMENT_BLOCK: '48012271',
  VITE_BASE_SEPOLIA_MIN_CONFIRMATIONS: '12',
}

describe('published W4 sample', () => {
  it('limits the shortcut to the expected W4 profile', () => {
    expect(isW4Profile(baseSepoliaProfileFromEnv(env))).toBe(true)
    expect(isW4Profile(baseSepoliaProfileFromEnv({ ...env, VITE_BASE_SEPOLIA_PUBLISHER: '0x0000000000000000000000000000000000000001' }))).toBe(false)
    expect(isW4Profile(baseSepoliaProfileFromEnv({ ...env, VITE_BASE_SEPOLIA_MIN_CONFIRMATIONS: '1' }))).toBe(false)
    expect(isW4Profile(null)).toBe(false)
  })

  it('keeps original untouched, changes only policy action and optionally recomputes the hash', async () => {
    const input = parseBundleJson(w4OriginalJson)
    const mismatched = parseBundleJson(await w4TamperedJson(false))
    const rehashed = parseBundleJson(await w4TamperedJson(true))
    if (!input.ok || !mismatched.ok || !rehashed.ok) throw new Error('sample parse failed')
    const original = input.value
    const changed = mismatched.value
    const changedRehash = rehashed.value
    if (original.receipt_body.event_kind !== 'DECISION' || changed.receipt_body.event_kind !== 'DECISION' || changedRehash.receipt_body.event_kind !== 'DECISION') throw new Error('wrong event')
    expect(original.receipt_hash).toBe('0x96684f068edaaec7b2ae8abafdaae40c90c118f2d7bede9e4b0dec2278eed3b6')
    expect(changed.receipt_body.payload.policy.action).not.toBe(original.receipt_body.payload.policy.action)
    expect(changed.receipt_hash).toBe(original.receipt_hash)
    expect(await receiptHash(changed.receipt_body)).not.toBe(original.receipt_hash)
    expect(changedRehash.receipt_hash).toBe(await receiptHash(changedRehash.receipt_body))
    expect(changedRehash.proof).toEqual(original.proof)
    expect(changedRehash.anchor).toEqual(original.anchor)
    expect(changedRehash.receipt_body).toEqual(changed.receipt_body)
    const restoredBody = structuredClone(changed.receipt_body)
    restoredBody.payload.policy.action = original.receipt_body.payload.policy.action
    expect(restoredBody).toEqual(original.receipt_body)
  })
})
