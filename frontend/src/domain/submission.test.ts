/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildSeedState } from '../store/seed'
import { createLedgerReader, locatorOf, trustConfig } from '../store/ledger'
import { manifestHashes } from './manifests'
import { receiptHash } from './receipt'
import { verifyReceipt, type VerifierContext } from './verify'

const fixture = (name: string) => readFileSync(new URL(`../../../docs/examples/${name}`, import.meta.url), 'utf8')

describe('published submission examples', () => {
  let ctx: VerifierContext
  let state: Awaited<ReturnType<typeof buildSeedState>>

  beforeAll(async () => {
    state = await buildSeedState()
    ctx = {
      trust: await trustConfig(),
      manifests: await manifestHashes(),
      ledger: createLedgerReader(() => state.epochs, () => false, () => Date.UTC(2026, 8, 14)),
      findBundle: () => null,
      findPrivateContent: () => null,
    }
  })

  it.each([
    ['01-valid.json', 'VALID'],
    ['02-tampered.json', 'HASH_MISMATCH'],
    ['03-rehashed.json', 'INVALID_PROOF'],
  ])('%s produces %s using the fixed synthetic ledger', async (name, code) => {
    const report = await verifyReceipt(fixture(name), ctx)
    expect(report.code).toBe(code)
    expect(report.content.state).toBe('NOT_CHECKED')
  })

  it('keeps the public examples equal to the seed and the documented single-field edits', async () => {
    const item = state.receipts.find((r) => r.body.receipt_id === 'a91d3c07-6e2b-4b58-9f14-2c7e8d0b5a63')!
    const epoch = state.epochs.find((e) => e.record.epoch_id === item.epoch_id)!
    const valid = JSON.parse(fixture('01-valid.json'))
    expect(valid).toEqual({ receipt_body: item.body, receipt_hash: item.hash, proof: item.proof, anchor: locatorOf(epoch) })
    const changed = structuredClone(valid)
    changed.receipt_body.payload.inference.scores_ppm.violence = 120000
    expect(JSON.parse(fixture('02-tampered.json'))).toEqual(changed)
    changed.receipt_hash = await receiptHash(changed.receipt_body)
    expect(JSON.parse(fixture('03-rehashed.json'))).toEqual(changed)
  })

  it('reports ledger unavailability separately from tampering', async () => {
    const ledger = createLedgerReader(() => state.epochs, () => true, () => Date.UTC(2026, 8, 14))
    expect((await verifyReceipt(fixture('01-valid.json'), { ...ctx, ledger })).code).toBe('RPC_UNAVAILABLE')
  })
})
