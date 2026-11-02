import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { canonicalBytes } from '@verimod/protocol/canonical'
import { DOMAINS, domainHash } from '@verimod/protocol/hash'
import { receiptHash } from '@verimod/protocol/receipt'
import { W4_PROVISIONAL_POLICY_HASH, W4_R01_MODEL_HASH } from '../src/inference.js'

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const model = read('../config/w4-r01.model_manifest.json')
const policy = read('../config/w4-provisional.policy_manifest.json')
const bundles = [0, 1].map(i => read(`../../docs/handoffs/w4-anchored-epoch-public/20261020-r01/receipt-${i}.bundle.json`))

describe('historical W4 manifest evidence', () => {
  it('recalculates both manifests and checks each historical receipt and receipt hash', async () => {
    const modelHash = await domainHash(DOMAINS.model, canonicalBytes(model))
    const policyHash = await domainHash(DOMAINS.policy, canonicalBytes(policy))
    expect(modelHash).toBe(W4_R01_MODEL_HASH)
    expect(policyHash).toBe(W4_PROVISIONAL_POLICY_HASH)
    for (const bundle of bundles) {
      expect(await receiptHash(bundle.receipt_body)).toBe(bundle.receipt_hash)
      expect(bundle.receipt_body.payload.inference.model_manifest_hash).toBe(modelHash)
      expect(bundle.receipt_body.payload.policy.policy_manifest_hash).toBe(policyHash)
    }
  })

  it('detects changes instead of assuming manifest equality', async () => {
    expect(await domainHash(DOMAINS.model, canonicalBytes({ ...model, run_id: 'changed' }))).not.toBe(W4_R01_MODEL_HASH)
    expect(await domainHash(DOMAINS.policy, canonicalBytes({ ...policy, comparison: 'changed' }))).not.toBe(W4_PROVISIONAL_POLICY_HASH)
  })
})
