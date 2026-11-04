import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Interface, Transaction } from 'ethers'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { openDatabase } from '../src/database.js'
import { EpochService } from '../src/epochs.js'
import type { AutoAnchorConfig } from '../src/autoAnchor.js'

const directory = mkdtempSync(join(tmpdir(), 'verimod-auto-anchor-'))
const db = openDatabase(join(directory, 'demo.sqlite'))
const iface = new Interface(['function registerEpoch(uint64,bytes32,uint32,uint16)'])
afterEach(() => { db.prepare('DELETE FROM epoch_members').run(); db.prepare('DELETE FROM idempotency_records').run(); db.prepare('DELETE FROM epochs').run(); db.prepare('DELETE FROM content_store').run(); db.prepare('DELETE FROM receipts').run() })
describe('auto anchor durable worker boundary', () => {
  it('authenticates, persists signed bytes before ACK, and never returns them publicly', async () => {
    const hash = `0x${'1'.repeat(64)}`
    db.prepare('INSERT INTO receipts (receipt_id,issuer_seq,canonical_body,receipt_hash,event_kind,owner_principal,created_at) VALUES (?,?,?,?,?,?,?)')
      .run('00000000-0000-4000-8000-000000000001', 1, JSON.stringify({ receipt_id: '00000000-0000-4000-8000-000000000001', issuer_id: 'verimod-example-platform' }), hash, 'DECISION', 'owner', new Date().toISOString())
    const frozen = await new EpochService(db).freeze({ principal: 'auto', idempotencyKey: 'one' })
    const contractAddress = `0x${'b'.repeat(40)}`
    const unsigned = { type: 2, chainId: 84532, nonce: 4, gasLimit: 180000, maxFeePerGas: 2, maxPriorityFeePerGas: 1, to: contractAddress,
      data: iface.encodeFunctionData('registerEpoch', [1, frozen.epoch.merkle_root, 1, 1]) }
    const tx = Transaction.from({ ...unsigned, signature: { r: `0x${'01'.repeat(32)}`, s: `0x${'02'.repeat(32)}`, yParity: 0 } })
    const cfg: AutoAnchorConfig = { enabled: true, token: 'this-is-a-long-test-worker-token', cooldownMs: 0, target: { chainId: '84532', contractAddress, publisher: tx.from!.toLowerCase() } }
    const app = createApp({ database: db, autoAnchor: cfg })
    expect((await request(app).get('/api/auto-anchor/next')).status).toBe(403)
    const auth = { Authorization: `Bearer ${cfg.token}` }
    expect((await request(app).get('/api/auto-anchor/next').set(auth)).body.data.status).toBe('FROZEN')
    const ack = await request(app).post('/api/auto-anchor/signed').set(auth).send({ epochId: '1', rawTransaction: tx.serialized })
    expect(ack.status).toBe(200)
    expect(ack.body.data.status).toBe('SUBMITTING')
    expect(new EpochService(db).get('1').signed_tx).toBe(tx.serialized)
    expect(JSON.stringify(ack.body)).not.toContain(tx.serialized)
    const repeatedAck = await request(app).post('/api/auto-anchor/signed').set(auth).send({ epochId: '1', rawTransaction: tx.serialized })
    expect(repeatedAck.status).toBe(200)
    expect(repeatedAck.body.data.tx_hash).toBe(ack.body.data.tx_hash)
    const publicEpoch = await request(app).get('/api/epochs/1')
    expect(JSON.stringify(publicEpoch.body)).not.toContain(tx.serialized)
    const result = await request(app).post('/api/auto-anchor/broadcast').set(auth).send({ epochId: '1', txHash: tx.hash })
    expect(result.body.data.status).toBe('SUBMITTED')
    expect(JSON.stringify(result.body)).not.toContain(tx.serialized)
    expect((await request(app).post('/api/auto-anchor/broadcast').set(auth).send({ epochId: '1', txHash: tx.hash })).status).toBe(409)
  })
  it('freezes at a chain-checked increasing epoch ID', async () => {
    const receiptId = '00000000-0000-4000-8000-000000000002'
    db.prepare('INSERT INTO receipts (receipt_id,issuer_seq,canonical_body,receipt_hash,event_kind,owner_principal,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(receiptId, 2, JSON.stringify({ receipt_id: receiptId }), `0x${'2'.repeat(64)}`, 'DECISION', 'owner', new Date().toISOString())
    const frozen = await new EpochService(db).freeze({ principal: 'auto', idempotencyKey: 'chain-checked-7', epochId: '7' })
    expect(frozen.epoch.epoch_id).toBe('7')
    const secondId = '00000000-0000-4000-8000-000000000003'
    db.prepare('INSERT INTO receipts (receipt_id,issuer_seq,canonical_body,receipt_hash,event_kind,owner_principal,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(secondId, 3, JSON.stringify({ receipt_id: secondId }), `0x${'3'.repeat(64)}`, 'DECISION', 'owner', new Date().toISOString())
    await expect(new EpochService(db).freeze({ principal: 'auto', idempotencyKey: 'invalid-6', epochId: '6' })).rejects.toThrow('epoch id must increase')
  })
})
