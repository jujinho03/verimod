import { createHash } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { canonicalize } from '@verimod/protocol/canonical'
import type { EpochView } from './epochs.js'

export const CONFIRMATION_TABLE = `CREATE TABLE IF NOT EXISTS epoch_confirmation_evidence (
  epoch_id TEXT PRIMARY KEY REFERENCES epochs(epoch_id), binding_json TEXT NOT NULL,
  binding_hash TEXT NOT NULL, evidence_json TEXT NOT NULL, verified_at TEXT NOT NULL,
  release_valid INTEGER NOT NULL CHECK(release_valid IN (0,1)), invalidated_reason TEXT
)`
export const confirmationDigest = (value: string) => createHash('sha256').update(value).digest('hex')
export function confirmationMembersDigest(db: DatabaseSync, epochId: string): string {
  return confirmationDigest(canonicalize(db.prepare(`SELECT r.receipt_id,r.receipt_hash,r.issuer_seq,r.canonical_body,m.leaf_index
    FROM epoch_members m JOIN receipts r ON r.receipt_hash=m.receipt_hash WHERE m.epoch_id=? ORDER BY m.leaf_index`).all(epochId)))
}
export function confirmationBinding(epoch: EpochView, publisher: string) {
  return canonicalize({ schema_version: 'w4-trusted-confirmation/1', epoch_id: epoch.epoch_id,
    merkle_root: epoch.merkle_root, receipt_count: epoch.receipt_count, protocol_version: epoch.protocol_version,
    tx_hash: epoch.tx_hash, nonce: epoch.nonce, chain_id: epoch.chain_id, contract_address: epoch.contract_address,
    block_number: epoch.block_number, block_hash: epoch.block_hash, publisher,
    raw_sha256: confirmationDigest(epoch.signed_tx ?? '') })
}
export function hasConfirmationTable(db: DatabaseSync): boolean {
  return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='epoch_confirmation_evidence'").get()
}
/** Legacy CONFIRMED strings or stale/tampered metadata cannot release public anchor material. */
export function hasTrustedConfirmation(db: DatabaseSync, epoch: EpochView): boolean {
  if (epoch.status !== 'CONFIRMED' || !hasConfirmationTable(db)) return false
  try {
    const row = db.prepare('SELECT * FROM epoch_confirmation_evidence WHERE epoch_id=?').get(epoch.epoch_id) as
      { binding_json: string; binding_hash: string; evidence_json: string; release_valid: number } | undefined
    if (!row || row.release_valid !== 1) return false
    const evidence = JSON.parse(row.evidence_json), publisher = JSON.parse(row.binding_json).publisher
    return evidence.verifier === 'w4-rpc-confirmation/1' && evidence.minimum_confirmations >= 12
      && evidence.members_sha256 === confirmationMembersDigest(db, epoch.epoch_id)
      && BigInt(evidence.head_number) - BigInt(epoch.block_number!) + 1n >= BigInt(evidence.minimum_confirmations)
      && row.binding_json === confirmationBinding(epoch, publisher) && row.binding_hash === confirmationDigest(row.binding_json)
  } catch { return false }
}
