import { freezeEpoch } from './epoch'
import { receiptHash } from './receipt'
import { manifestHashes } from './manifests'
import type { Hex32 } from './hash'
import type { VerificationBundle } from './types'
import { RpcUnavailableError, type VerifierContext } from './verify'
import { buildSeedState } from '../store/seed'
import { trustConfig } from '../store/ledger'

export type SyntheticCase = 'NORMAL' | 'FORBIDDEN_TRANSITION' | 'MISSING_HISTORY' | 'PENDING_PREVIOUS' | 'RPC_FAILURE' | 'WRONG_REFERENCE'

/** Pre-generated synthetic bodies, rebuilt only in isolated memory. No real DB, RPC or sender. */
export async function syntheticLifecycleCase(scenario: SyntheticCase) {
  const seed = await buildSeedState()
  const review = seed.receipts.find((r) => r.body.event_kind === 'REVIEW')!
  if (review.body.event_kind !== 'REVIEW') throw Error('Synthetic fixture')
  const selected = [seed.receipts.find((r) => r.hash === review.body.subject_receipt_hash)!,
    seed.receipts.find((r) => r.hash === review.body.previous_receipt_hash)!, review]
  const bodies = structuredClone(selected.map((r) => r.body))
  const final = bodies[2]
  if (final.event_kind !== 'REVIEW') throw Error('Synthetic fixture')
  if (scenario === 'FORBIDDEN_TRANSITION') final.payload.outcome = 'UPHOLD'
  if (scenario === 'WRONG_REFERENCE') final.previous_receipt_hash = final.subject_receipt_hash
  const hashes = await Promise.all(bodies.map(receiptHash))
  // A supplied lifecycle is a subset of issuer history (2,4,5 here), not a global sequence interval.
  const frozen = await freezeEpoch(bodies.map((b, i) => ({ receipt_id: b.receipt_id, receipt_hash: hashes[i] })))
  const trust = await trustConfig()
  const bundles: VerificationBundle[] = bodies.map((body, i) => ({ receipt_body: body, receipt_hash: hashes[i],
    proof: frozen.proofs[hashes[i]], anchor: { chain_id: trust.chain_id, contract_address: trust.contract_address,
      epoch_id: '1', tx_hash: `0x${'1'.repeat(64)}`, block_number: '100', block_hash: `0x${'2'.repeat(64)}` } }))
  const lookup = new Map<Hex32, VerificationBundle>(bundles.map((b) => [b.receipt_hash, b]))
  if (scenario === 'MISSING_HISTORY') lookup.delete(hashes[1])
  if (scenario === 'PENDING_PREVIOUS') lookup.set(hashes[1], { ...bundles[1], proof: null, anchor: null })
  const context: VerifierContext = { trust, manifests: await manifestHashes(), findPrivateContent: () => null,
    privatePackage: null, findBundle: (hash) => lookup.get(hash) ?? null,
    ledger: {
      async blockNumber() { return 111 },
      async getEpoch() {
        if (scenario === 'RPC_FAILURE') throw new RpcUnavailableError()
        return { epoch_id: '1', root: frozen.root, receipt_count: 3, protocol_version: 1, publisher: trust.publisher,
          issuer_commitment: trust.issuer_commitment, issuer_seq_min: null, issuer_seq_max: null, anchored_block: 100 }
      },
    } }
  return { bundles, context }
}
