import type { DatabaseSync } from 'node:sqlite'
import { freezeEpoch } from '@verimod/protocol/epoch'
import { isHex32, type Hex32 } from '@verimod/protocol/hash'
import type { AnchorLocator, InclusionProof } from '@verimod/protocol/types'

const UINT64_MAX = 18_446_744_073_709_551_615n
const ADDRESS = /^0x[0-9a-f]{40}$/
const DECIMAL = /^(0|[1-9]\d*)$/
const SIGNED_TX = /^0x(?:[0-9a-f]{2})+$/

export type EpochStatus = 'FROZEN' | 'SUBMITTING' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED'

export interface EpochView {
  epoch_id: string
  merkle_root: Hex32
  receipt_count: number
  protocol_version: number
  status: EpochStatus
  signed_tx: string | null
  tx_hash: Hex32 | null
  nonce: string | null
  chain_id: string | null
  contract_address: string | null
  block_number: string | null
  block_hash: Hex32 | null
  fail_reason: string | null
  created_at: string
  updated_at: string
}

export interface PublicBundle {
  receipt_body: unknown
  receipt_hash: Hex32
  proof: InclusionProof | null
  anchor: AnchorLocator | null
}

type FreezeResult = { epoch: EpochView; members: Array<{ receipt_id: string; receipt_hash: Hex32; issuer_seq: number; leaf_index: number }> }

export class EmptyEpochError extends Error {}
export class EpochNotFoundError extends Error {}
export class EpochStateError extends Error {}
export class FreezeIdempotencyConflictError extends Error {}

function failUnless(condition: unknown, message: string): asserts condition {
  if (!condition) throw new EpochStateError(message)
}

function epochRow(database: DatabaseSync, epochId: string): EpochView | null {
  return (database.prepare('SELECT * FROM epochs WHERE epoch_id = ?').get(epochId) as EpochView | undefined) ?? null
}

function nextEpochId(database: DatabaseSync): string {
  let greatest = 0n
  const rows = database.prepare('SELECT epoch_id FROM epochs').all() as { epoch_id: string }[]
  for (const row of rows) {
    if (!/^[1-9]\d*$/.test(row.epoch_id)) throw new EpochStateError('stored epoch id is invalid')
    const value = BigInt(row.epoch_id)
    if (value > greatest) greatest = value
  }
  if (greatest >= UINT64_MAX) throw new EpochStateError('epoch id space exhausted')
  return String(greatest + 1n)
}

function validateEpochId(epochId: string): void {
  failUnless(/^[1-9]\d*$/.test(epochId) && BigInt(epochId) <= UINT64_MAX, 'epoch id must be uint64 decimal')
}

export class EpochService {
  private queue: Promise<void> = Promise.resolve()

  constructor(private readonly database: DatabaseSync, private readonly now: () => Date = () => new Date()) {}

  freeze(input: { principal: string; idempotencyKey: string }): Promise<FreezeResult> {
    const result = this.queue.then(() => this.freezeLocked(input), () => this.freezeLocked(input))
    this.queue = result.then(() => undefined, () => undefined)
    return result
  }

  private async freezeLocked(input: { principal: string; idempotencyKey: string }): Promise<FreezeResult> {
    const operation = 'POST /api/epochs/freeze'
    const requestHash = 'all-unfrozen-receipts:v1'
    this.database.exec('BEGIN IMMEDIATE')
    try {
      const existing = this.database.prepare(
        'SELECT request_hash, status, response_json FROM idempotency_records WHERE principal = ? AND operation = ? AND idempotency_key = ?',
      ).get(input.principal, operation, input.idempotencyKey) as { request_hash: string; status: string; response_json: string | null } | undefined
      if (existing) {
        if (existing.request_hash !== requestHash) throw new FreezeIdempotencyConflictError()
        if (existing.status !== 'COMPLETED' || existing.response_json === null) throw new EpochStateError('freeze is already in progress')
        const replay = JSON.parse(existing.response_json) as FreezeResult
        this.database.exec('COMMIT')
        return replay
      }

      const timestamp = this.now().toISOString()
      this.database.prepare(
        'INSERT INTO idempotency_records (principal, operation, idempotency_key, request_hash, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ).run(input.principal, operation, input.idempotencyKey, requestHash, 'IN_PROGRESS', timestamp, timestamp)

      const candidates = this.database.prepare(`
        SELECT r.receipt_id, r.receipt_hash, r.issuer_seq
        FROM receipts r
        LEFT JOIN epoch_members m ON m.receipt_hash = r.receipt_hash
        WHERE m.receipt_hash IS NULL
        ORDER BY r.issuer_seq ASC
      `).all() as Array<{ receipt_id: string; receipt_hash: Hex32; issuer_seq: number }>
      if (candidates.length === 0) throw new EmptyEpochError()

      const frozen = await freezeEpoch(candidates)
      const epochId = nextEpochId(this.database)
      this.database.prepare(
        'INSERT INTO epochs (epoch_id, merkle_root, receipt_count, protocol_version, status, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?)',
      ).run(epochId, frozen.root, frozen.members.length, 'FROZEN', timestamp, timestamp)
      const insertMember = this.database.prepare(
        'INSERT INTO epoch_members (epoch_id, receipt_hash, leaf_index) VALUES (?, ?, ?)',
      )
      const byHash = new Map(candidates.map((candidate) => [candidate.receipt_hash, candidate]))
      const members = frozen.members.map((member, leafIndex) => {
        insertMember.run(epochId, member.receipt_hash, leafIndex)
        const source = byHash.get(member.receipt_hash)
        if (!source) throw new EpochStateError('frozen member disappeared')
        return { ...source, leaf_index: leafIndex }
      })
      const epoch = epochRow(this.database, epochId)
      if (!epoch) throw new EpochStateError('frozen epoch was not stored')
      const response = { epoch, members }
      this.database.prepare(
        "UPDATE idempotency_records SET status = 'COMPLETED', response_status = 201, response_json = ?, updated_at = ? WHERE principal = ? AND operation = ? AND idempotency_key = ?",
      ).run(JSON.stringify(response), timestamp, input.principal, operation, input.idempotencyKey)
      this.database.exec('COMMIT')
      return response
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }

  get(epochId: string): EpochView {
    validateEpochId(epochId)
    const row = epochRow(this.database, epochId)
    if (!row) throw new EpochNotFoundError()
    return row
  }

  recordSubmitting(input: { epochId: string; signedTx: string; txHash: Hex32; nonce: string; chainId: string; contractAddress: string }): EpochView {
    validateEpochId(input.epochId)
    failUnless(SIGNED_TX.test(input.signedTx), 'signed transaction must be hex bytes')
    failUnless(isHex32(input.txHash), 'transaction hash must be hex32')
    failUnless(DECIMAL.test(input.nonce), 'nonce must be decimal')
    failUnless(/^[1-9]\d*$/.test(input.chainId), 'chain id must be positive decimal')
    failUnless(ADDRESS.test(input.contractAddress), 'contract address must be normalized lowercase hex')
    return this.transition(input.epochId, ['FROZEN', 'SUBMITTING'], 'SUBMITTING', {
      signed_tx: input.signedTx,
      tx_hash: input.txHash,
      nonce: input.nonce,
      chain_id: input.chainId,
      contract_address: input.contractAddress,
      fail_reason: null,
    })
  }

  markSubmitted(epochId: string): EpochView {
    const current = this.get(epochId)
    failUnless(current.signed_tx && current.tx_hash && current.nonce, 'signed transaction must be durable before SUBMITTED')
    return this.transition(epochId, ['SUBMITTING', 'SUBMITTED'], 'SUBMITTED', {})
  }

  markConfirmed(input: { epochId: string; blockNumber: string; blockHash: Hex32 }): EpochView {
    failUnless(DECIMAL.test(input.blockNumber), 'block number must be decimal')
    failUnless(isHex32(input.blockHash), 'block hash must be hex32')
    return this.transition(input.epochId, ['SUBMITTED', 'CONFIRMED'], 'CONFIRMED', {
      block_number: input.blockNumber,
      block_hash: input.blockHash,
      fail_reason: null,
    })
  }

  markFailed(epochId: string, reason: 'ROOT_CONFLICT' | 'REVERTED' | 'MAX_RETRY'): EpochView {
    return this.transition(epochId, ['FROZEN', 'SUBMITTING', 'SUBMITTED', 'FAILED'], 'FAILED', { fail_reason: reason })
  }

  async bundle(receiptId: string): Promise<PublicBundle | null> {
    const receipt = this.database.prepare('SELECT canonical_body, receipt_hash FROM receipts WHERE receipt_id = ?').get(receiptId) as
      | { canonical_body: string; receipt_hash: Hex32 }
      | undefined
    if (!receipt) return null
    const membership = this.database.prepare('SELECT epoch_id FROM epoch_members WHERE receipt_hash = ?').get(receipt.receipt_hash) as
      | { epoch_id: string }
      | undefined
    if (!membership) return { receipt_body: JSON.parse(receipt.canonical_body), receipt_hash: receipt.receipt_hash, proof: null, anchor: null }

    const epoch = this.get(membership.epoch_id)
    const members = this.database.prepare(`
      SELECT r.receipt_id, r.receipt_hash, r.issuer_seq
      FROM epoch_members m JOIN receipts r ON r.receipt_hash = m.receipt_hash
      WHERE m.epoch_id = ? ORDER BY m.leaf_index ASC
    `).all(epoch.epoch_id) as Array<{ receipt_id: string; receipt_hash: Hex32; issuer_seq: number }>
    const frozen = await freezeEpoch(members)
    failUnless(frozen.root === epoch.merkle_root && frozen.members.length === epoch.receipt_count, 'stored epoch does not match its members')

    const hasPublicAnchor = epoch.status === 'CONFIRMED' && epoch.tx_hash && epoch.chain_id && epoch.contract_address && epoch.block_number && epoch.block_hash
    return {
      receipt_body: JSON.parse(receipt.canonical_body),
      receipt_hash: receipt.receipt_hash,
      proof: hasPublicAnchor ? frozen.proofs[receipt.receipt_hash] : null,
      anchor: hasPublicAnchor ? {
        chain_id: epoch.chain_id!,
        contract_address: epoch.contract_address!,
        epoch_id: epoch.epoch_id,
        tx_hash: epoch.tx_hash!,
        block_number: epoch.block_number!,
        block_hash: epoch.block_hash!,
      } : null,
    }
  }

  private transition(epochId: string, allowed: EpochStatus[], target: EpochStatus, fields: Record<string, string | null>): EpochView {
    this.database.exec('BEGIN IMMEDIATE')
    try {
      const current = this.get(epochId)
      failUnless(allowed.includes(current.status), `cannot move ${current.status} to ${target}`)
      for (const [key, value] of Object.entries(fields)) {
        const old = current[key as keyof EpochView]
        if (current.status === target && old !== value) throw new EpochStateError(`conflicting retry for ${key}`)
      }
      if (current.status !== target) {
        const assignments = ['status = ?', ...Object.keys(fields).map((key) => `${key} = ?`), 'updated_at = ?']
        this.database.prepare(`UPDATE epochs SET ${assignments.join(', ')} WHERE epoch_id = ?`).run(
          target,
          ...Object.values(fields),
          this.now().toISOString(),
          epochId,
        )
      }
      const result = this.get(epochId)
      this.database.exec('COMMIT')
      return result
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }
}
