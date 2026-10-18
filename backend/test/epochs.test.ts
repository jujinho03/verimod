import type { DatabaseSync } from 'node:sqlite'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Hex32 } from '@verimod/protocol/hash'
import { openDatabase } from '../src/database.js'
import { EmptyEpochError, EpochService, EpochStateError } from '../src/epochs.js'

const hashes = [1, 2, 3].map((n) => `0x${String(n).repeat(64)}` as Hex32)

function insertReceipts(database: DatabaseSync) {
  hashes.forEach((hash, index) => {
    const receiptId = `00000000-0000-4000-8000-00000000000${index + 1}`
    const body = { receipt_id: receiptId, index }
    database.prepare(
      'INSERT INTO receipts (receipt_id, issuer_seq, canonical_body, receipt_hash, event_kind, owner_principal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(receiptId, index + 1, JSON.stringify(body), hash, 'DECISION', 'owner', '2026-10-12T00:00:00.000Z')
    database.prepare(
      'INSERT INTO content_store (receipt_id, original_text, content_salt, content_commitment, owner_principal) VALUES (?, ?, ?, ?, ?)',
    ).run(receiptId, `private-${index}`, String(index + 1).repeat(64), `0x${String(index + 4).repeat(64)}`, 'owner')
  })
}

describe('API-07 epoch freeze and sender handoff', () => {
  let database: DatabaseSync

  beforeEach(() => { database = openDatabase() })
  afterEach(() => { database.close() })

  it('atomically freezes all pending receipts and replays the same key without allocating another id', async () => {
    insertReceipts(database)
    const epochs = new EpochService(database, () => new Date('2026-10-12T01:02:03.000Z'))
    const [first, replay] = await Promise.all([
      epochs.freeze({ principal: 'operator-1', idempotencyKey: 'freeze-1' }),
      epochs.freeze({ principal: 'operator-1', idempotencyKey: 'freeze-1' }),
    ])

    expect(first).toEqual(replay)
    expect(first.epoch).toMatchObject({ epoch_id: '1', receipt_count: 3, status: 'FROZEN', protocol_version: 1 })
    expect(first.members.map((member) => member.leaf_index)).toEqual([0, 1, 2])
    expect(database.prepare('SELECT COUNT(*) AS count FROM epochs').get()).toEqual({ count: 1 })
    expect(database.prepare('SELECT COUNT(*) AS count FROM epoch_members').get()).toEqual({ count: 3 })
  })

  it('returns 409 for an empty candidate set and never creates epoch zero', async () => {
    const epochs = new EpochService(database)
    await expect(epochs.freeze({ principal: 'operator-1', idempotencyKey: 'freeze-1' })).rejects.toBeInstanceOf(EmptyEpochError)
    expect(database.prepare('SELECT COUNT(*) AS count FROM epochs').get()).toEqual({ count: 0 })
    expect(database.prepare("SELECT COUNT(*) AS count FROM idempotency_records WHERE operation = 'POST /api/epochs/freeze'").get()).toEqual({ count: 0 })
  })

  it('stores signed transaction material before submission and rejects conflicting retries', async () => {
    insertReceipts(database)
    const epochs = new EpochService(database, () => new Date('2026-10-12T01:02:03.000Z'))
    await epochs.freeze({ principal: 'operator-1', idempotencyKey: 'freeze-1' })
    const submitting = epochs.recordSubmitting({
      epochId: '1', signedTx: '0x1234', txHash: `0x${'a'.repeat(64)}`, nonce: '7', chainId: '84532',
      contractAddress: `0x${'b'.repeat(40)}`,
    })
    expect(submitting.status).toBe('SUBMITTING')
    expect(epochs.markSubmitted('1').status).toBe('SUBMITTED')
    const confirmed = epochs.markConfirmed({ epochId: '1', blockNumber: '123456', blockHash: `0x${'c'.repeat(64)}` })
    expect(confirmed.status).toBe('CONFIRMED')
    expect(() => epochs.markFailed('1', 'ROOT_CONFLICT')).toThrow(EpochStateError)
  })

  it('withholds proof and anchor when internal CONFIRMED has no trusted RPC evidence', async () => {
    insertReceipts(database)
    const epochs = new EpochService(database)
    await epochs.freeze({ principal: 'operator-1', idempotencyKey: 'freeze-1' })
    const pending = await epochs.bundle('00000000-0000-4000-8000-000000000001')
    expect(pending?.proof).toBeNull()
    expect(pending?.anchor).toBeNull()

    epochs.recordSubmitting({
      epochId: '1', signedTx: '0x1234', txHash: `0x${'a'.repeat(64)}`, nonce: '7', chainId: '84532',
      contractAddress: `0x${'b'.repeat(40)}`,
    })
    epochs.markSubmitted('1')
    epochs.markConfirmed({ epochId: '1', blockNumber: '123456', blockHash: `0x${'c'.repeat(64)}` })
    const anchored = await epochs.bundle('00000000-0000-4000-8000-000000000001')
    expect(anchored?.proof).toBeNull()
    expect(anchored?.anchor).toBeNull()
    expect(JSON.stringify(anchored)).not.toContain('private-0')
    expect(JSON.stringify(anchored)).not.toContain('content_salt')
  })
})
