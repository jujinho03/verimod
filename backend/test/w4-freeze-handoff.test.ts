import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import { Interface, Transaction } from 'ethers'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Hex32 } from '@verimod/protocol/hash'
import { createApp } from '../src/app.js'
import { openDatabase } from '../src/database.js'
import { EpochService } from '../src/epochs.js'
import { EpochSenderHandoff } from '../src/senderHandoff.js'

// Entirely synthetic fixtures for local regression; no signer or RPC is invoked.
const contractAddress = `0x${'b'.repeat(40)}`
const iface = new Interface(['function registerEpoch(uint64, bytes32, uint32, uint16)'])
const headers = { 'x-demo-principal': 'w4-local-operator', 'x-demo-role': 'DEMO_OPERATOR', 'Idempotency-Key': 'freeze-1' }

function seed(db: DatabaseSync) {
  for (const [index, id] of ['00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001'].entries()) {
    const hash = `0x${String(index + 1).repeat(64)}`
    db.prepare('INSERT INTO receipts (receipt_id, issuer_seq, canonical_body, receipt_hash, event_kind, owner_principal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, index + 1, JSON.stringify({ receipt_id: id, issuer_id: 'verimod-example-platform' }), hash, 'DECISION', 'owner', '2026-10-16T00:00:00.000Z')
    db.prepare('INSERT INTO content_store (receipt_id, original_text, content_salt, content_commitment, owner_principal) VALUES (?, ?, ?, ?, ?)')
      .run(id, 'private synthetic text', String(index + 4).repeat(64), `0x${String(index + 5).repeat(64)}`, 'owner')
  }
}

function signedBytes(root: string, overrides: { epoch?: bigint; count?: bigint; version?: bigint; chain?: bigint; to?: string; value?: bigint; data?: string } = {}) {
  const tx = Transaction.from({
    type: 2, chainId: overrides.chain ?? 84532n, nonce: 7, gasLimit: 100000n,
    maxFeePerGas: 2n, maxPriorityFeePerGas: 1n, to: overrides.to ?? contractAddress,
    value: overrides.value ?? 0n,
    data: overrides.data ?? iface.encodeFunctionData('registerEpoch', [overrides.epoch ?? 1n, root, overrides.count ?? 2n, overrides.version ?? 1n]),
    // Fixed inert signature bytes: this constructs a test envelope without signing.
    signature: { r: `0x${'01'.repeat(32)}`, s: `0x${'02'.repeat(32)}`, yParity: 0 },
  })
  return { raw: tx.serialized, hash: tx.hash as Hex32, publisher: tx.from!.toLowerCase() }
}

describe('W4 file-backed freeze and pre-broadcast durability contract', () => {
  let directory: string
  let path: string
  let db: DatabaseSync
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'verimod-w4-handoff-'))
    path = join(directory, 'f.sqlite')
    db = openDatabase(path)
    seed(db)
  })
  afterEach(() => {
    try { db.close() } catch { /* test reopened the connection */ }
    if (!resolve(directory).startsWith(`${resolve(tmpdir())}${sep}`)) throw new Error('unsafe cleanup path')
    rmSync(directory, { recursive: true, force: true })
  })

  it('freezes through HTTP, independently checks root/order, replay, EMPTY_EPOCH and restart', async () => {
    const app = createApp({ database: db })
    const responses = await Promise.all(Array.from({ length: 6 }, () => request(app).post('/api/epochs/freeze').set(headers).send({})))
    expect(responses.every(r => r.status === 201)).toBe(true)
    const frozen = responses[0].body.data
    for (const response of responses) expect(response.body.data).toEqual(frozen)
    expect(frozen.epoch).toMatchObject({ epoch_id: '1', receipt_count: 2, protocol_version: 1, status: 'FROZEN' })
    expect(frozen.members.map((m: { receipt_id: string }) => m.receipt_id)).toEqual([
      '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002',
    ])
    expect(frozen.members.map((m: { leaf_index: number }) => m.leaf_index)).toEqual([0, 1])
    const leaves = frozen.members.map((m: { receipt_hash: string }) => createHash('sha256').update(Buffer.from([0])).update(Buffer.from(m.receipt_hash.slice(2), 'hex')).digest())
    const independentRoot = `0x${createHash('sha256').update(Buffer.from([1])).update(leaves[0]).update(leaves[1]).digest('hex')}`
    expect(frozen.epoch.merkle_root).toBe(independentRoot)
    const empty = await request(app).post('/api/epochs/freeze').set({ ...headers, 'Idempotency-Key': 'new-empty' }).send({})
    expect(empty.status).toBe(409)
    expect(empty.body.error.code).toBe('EMPTY_EPOCH')
    expect(db.prepare('SELECT COUNT(*) AS n FROM epoch_members').get()).toEqual({ n: 2 })
    expect(db.prepare('SELECT COUNT(*) AS n FROM epochs').get()).toEqual({ n: 1 })
    db.close()
    db = openDatabase(path)
    const replay = await request(createApp({ database: db })).post('/api/epochs/freeze').set(headers).send({})
    expect(replay.body.data).toEqual(frozen)
    for (const member of frozen.members) {
      const bundle = await new EpochService(db).bundle(member.receipt_id)
      expect(bundle?.proof).toBeNull()
      expect(bundle?.anchor).toBeNull()
      expect(JSON.stringify(bundle)).not.toContain('private synthetic text')
      expect(JSON.stringify(bundle)).not.toContain('content_salt')
    }
  })

  it('allocates one epoch under concurrent distinct freeze keys', async () => {
    const app = createApp({ database: db })
    const results = await Promise.all(['one', 'two'].map(key => request(app).post('/api/epochs/freeze').set({ ...headers, 'Idempotency-Key': key }).send({})))
    expect(results.map(r => r.status).sort()).toEqual([201, 409])
    expect(db.prepare('SELECT COUNT(*) AS n FROM epochs').get()).toEqual({ n: 1 })
    expect(db.prepare('SELECT COUNT(DISTINCT receipt_hash) AS n FROM epoch_members').get()).toEqual({ n: 2 })
  })

  it('acknowledges only after F SQLite stores the decoded transaction and survives reopen', async () => {
    const frozen = await new EpochService(db).freeze({ principal: 'operator', idempotencyKey: 'one' })
    const tx = signedBytes(frozen.epoch.merkle_root)
    const target = { chainId: '84532' as const, contractAddress, publisher: tx.publisher }
    const hook = new EpochSenderHandoff(db, target)
    const ack = hook.persistBeforeBroadcast({ epochId: '1', rawTransaction: tx.raw })
    expect(hook.persistBeforeBroadcast({ epochId: '1', rawTransaction: tx.raw })).toEqual(ack)
    expect(ack).toMatchObject({ status: 'SUBMITTING', tx_hash: tx.hash, nonce: '7', chain_id: '84532' })
    expect(JSON.stringify(ack)).not.toContain(tx.raw)
    db.close()
    db = openDatabase(path)
    const durable = new EpochService(db).get('1')
    expect(durable).toMatchObject({ status: 'SUBMITTING', signed_tx: tx.raw, tx_hash: tx.hash, nonce: '7' })
    const publicEpoch = await request(createApp({ database: db })).get('/api/epochs/1')
    expect(publicEpoch.body.data.signed_tx).toBeUndefined()
    expect(JSON.stringify(publicEpoch.body)).not.toContain(tx.raw)
    new EpochService(db).markSubmitted('1')
    expect(() => new EpochSenderHandoff(db, target).persistBeforeBroadcast({ epochId: '1', rawTransaction: tx.raw })).toThrow('not ready')
  })

  it.each([
    ['epoch', { epoch: 2n }], ['count', { count: 3n }], ['version', { version: 2n }],
    ['chain', { chain: 1n }], ['recipient', { to: `0x${'c'.repeat(40)}` }],
    ['value', { value: 1n }], ['calldata', { data: '0x12345678' }],
  ])('rejects mismatched %s before persisting SUBMITTING', async (_label, overrides) => {
    const frozen = await new EpochService(db).freeze({ principal: 'operator', idempotencyKey: 'one' })
    const tx = signedBytes(frozen.epoch.merkle_root, overrides)
    const hook = new EpochSenderHandoff(db, { chainId: '84532', contractAddress, publisher: tx.publisher })
    expect(() => hook.persistBeforeBroadcast({ epochId: '1', rawTransaction: tx.raw })).toThrow()
    expect(new EpochService(db).get('1')).toMatchObject({ status: 'FROZEN', signed_tx: null, tx_hash: null, nonce: null })
  })

  it('rejects wrong publisher, conflicting retry and non-durable SQLite configuration', async () => {
    const epochs = new EpochService(db)
    const frozen = await epochs.freeze({ principal: 'operator', idempotencyKey: 'one' })
    const tx = signedBytes(frozen.epoch.merkle_root)
    const hook = new EpochSenderHandoff(db, { chainId: '84532', contractAddress, publisher: tx.publisher })
    expect(() => new EpochSenderHandoff(db, { chainId: '84532', contractAddress, publisher: `0x${'a'.repeat(40)}` })
      .persistBeforeBroadcast({ epochId: '1', rawTransaction: tx.raw })).toThrow('approved target')
    db.exec('PRAGMA synchronous=OFF')
    expect(() => hook.persistBeforeBroadcast({ epochId: '1', rawTransaction: tx.raw })).toThrow('durable')
    db.exec('PRAGMA synchronous=FULL')
    epochs.recordSubmitting({ epochId: '1', signedTx: '0x1234', txHash: `0x${'a'.repeat(64)}`, nonce: '8', chainId: '84532', contractAddress })
    expect(() => hook.persistBeforeBroadcast({ epochId: '1', rawTransaction: tx.raw })).toThrow('conflicting retry')
  })

  it('rejects a different root, malformed bytes and unsigned envelopes without changing the frozen row', async () => {
    const frozen = await new EpochService(db).freeze({ principal: 'operator', idempotencyKey: 'one' })
    const wrongRoot = signedBytes(`0x${'e'.repeat(64)}`)
    const hook = new EpochSenderHandoff(db, { chainId: '84532', contractAddress, publisher: wrongRoot.publisher })
    expect(() => hook.persistBeforeBroadcast({ epochId: '1', rawTransaction: wrongRoot.raw })).toThrow('frozen epoch')
    expect(() => hook.persistBeforeBroadcast({ epochId: '1', rawTransaction: '0x1234' })).toThrow('invalid signed')
    const unsigned = Transaction.from({ chainId: 84532, nonce: 1, to: contractAddress, gasLimit: 100000,
      data: iface.encodeFunctionData('registerEpoch', [1n, frozen.epoch.merkle_root, 2n, 1n]) }).unsignedSerialized
    expect(() => hook.persistBeforeBroadcast({ epochId: '1', rawTransaction: unsigned })).toThrow('approved target')
    expect(new EpochService(db).get('1')).toMatchObject({ status: 'FROZEN', signed_tx: null, tx_hash: null })
  })

  it('withholds anchor material in every unconfirmed lifecycle state', async () => {
    const epochs = new EpochService(db)
    const frozen = await epochs.freeze({ principal: 'operator', idempotencyKey: 'one' })
    // Staged metadata is not trusted confirmation evidence, even if every field is present.
    db.prepare('UPDATE epochs SET tx_hash=?, chain_id=?, contract_address=?, block_number=?, block_hash=? WHERE epoch_id=?')
      .run(`0x${'a'.repeat(64)}`, '84532', contractAddress, '123', `0x${'d'.repeat(64)}`, '1')
    for (const status of ['FROZEN', 'SUBMITTING', 'SUBMITTED', 'FAILED']) {
      db.prepare('UPDATE epochs SET status=? WHERE epoch_id=?').run(status, '1')
      const bundle = await epochs.bundle(frozen.members[0].receipt_id)
      expect(bundle?.proof, status).toBeNull()
      expect(bundle?.anchor, status).toBeNull()
    }
  })
})
