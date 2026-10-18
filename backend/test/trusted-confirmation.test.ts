import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { appendFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, join, resolve, sep } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Transaction } from 'ethers'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { openDatabase } from '../src/database.js'
import { EpochService } from '../src/epochs.js'
import { openApprovedDatabase, type CallbackApproval } from '../src/durabilityCallback.js'
import { EpochSenderHandoff } from '../src/senderHandoff.js'
import { CONFIRMATION_ABI as abi, confirmationReader, verifyAndConfirm, type ConfirmationReader } from '../src/trustedConfirmation.js'
import { CONFIRMATION_TABLE, hasTrustedConfirmation } from '../src/confirmationEvidence.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..'), base = join(root, 'backend/private-data/confirmation-tests')
const contract = `0x${'b'.repeat(40)}`, blockHash = `0x${'c'.repeat(64)}`, headHash = `0x${'d'.repeat(64)}`
const id = '00000000-0000-4000-8000-000000000001'
let directory: string, dbPath: string, db: DatabaseSync, cfg: CallbackApproval, raw: string, txHash: string
let model: { tx: any; receipt: any; block: any; head: any; publisher: string; getter: string }
type Change = (method: string, params: any[], value: any, n: number) => any
function reader(change?: Change): ConfirmationReader & { calls: string[] } {
  const calls: string[] = [], counts = new Map<string, number>()
  return { calls, async request(method, params) {
    calls.push(method)
    const key = method + (method === 'eth_getBlockByNumber' ? params[0] : '')
    const n = (counts.get(key) ?? 0) + 1; counts.set(key, n)
    let value: any
    if (method === 'eth_chainId') value = '0x14a34'
    else if (method === 'eth_getTransactionByHash') value = model.tx
    else if (method === 'eth_getTransactionReceipt') value = model.receipt
    else if (method === 'eth_getBlockByNumber') value = params[0] === '0x64' ? model.block : model.head
    else if (method === 'eth_call') {
      expect(params[0]).toMatchObject({ to: contract })
      expect(params[1]).toEqual({ blockHash: model.receipt.blockHash, requireCanonical: true })
      value = (params[0] as any).data === abi.encodeFunctionData('publisher') ? model.publisher : model.getter
    }
    value = structuredClone(value)
    return change ? change(method, params as any[], value, n) : value
  } }
}
function log(value: object) {
  if (process.env.VERIMOD_CONFIRMATION_LOG) appendFileSync(process.env.VERIMOD_CONFIRMATION_LOG,
    JSON.stringify({ at: new Date().toISOString(), platform: process.platform, node: process.version, scope: 'SYNTHETIC_RPC_STUB_ONLY', ...value }) + '\n')
}
function row() { return new EpochService(db).get('1') }
async function expectClosed(rpc: ConfirmationReader) {
  await expect(verifyAndConfirm(db, cfg, rpc)).rejects.toThrow()
  expect(row().status).toBe('SUBMITTED'); expect(row().block_hash).toBeNull()
  const bundle = await new EpochService(db).bundle(id)
  expect(bundle?.proof).toBeNull(); expect(bundle?.anchor).toBeNull()
}
beforeEach(async () => {
  mkdirSync(base, { recursive: true }); directory = mkdtempSync(join(base, 'Windows confirmation spaces ')); dbPath = join(directory, 'synthetic.sqlite')
  db = openDatabase(dbPath)
  for (let i = 1; i <= 2; i++) {
    const receiptId = id.slice(0, -1) + i
    db.prepare('INSERT INTO receipts (receipt_id,issuer_seq,canonical_body,receipt_hash,event_kind,owner_principal,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(receiptId, i, JSON.stringify({ receipt_id: receiptId, issuer_id: 'verimod-example-platform' }), `0x${String(i).repeat(64)}`, 'DECISION', 'synthetic', '2026-10-17')
    db.prepare('INSERT INTO content_store (receipt_id,original_text,content_salt,content_commitment,owner_principal) VALUES (?,?,?,?,?)')
      .run(receiptId, 'synthetic private text', 'e'.repeat(64), `0x${String(i + 4).repeat(64)}`, 'synthetic')
  }
  const epochs = new EpochService(db), frozen = (await epochs.freeze({ principal: 'synthetic', idempotencyKey: 'one' })).epoch
  const tx = Transaction.from({ type: 2, chainId: 84532, nonce: 7, to: contract, value: 0, gasLimit: 100000,
    maxFeePerGas: 2, maxPriorityFeePerGas: 1,
    data: new (await import('ethers')).Interface(['function registerEpoch(uint64,bytes32,uint32,uint16)']).encodeFunctionData('registerEpoch', [1, frozen.merkle_root, 2, 1]),
    // Fixed inert signature bytes: no key, signer, Wallet or signing call.
    signature: { r: `0x${'01'.repeat(32)}`, s: `0x${'02'.repeat(32)}`, yParity: 0 } })
  raw = tx.serialized; txHash = tx.hash!
  const info = statSync(dbPath, { bigint: true })
  cfg = { schema_version: 'w4-f-callback-approval/1', mode: 'SYNTHETIC_TEST_ONLY', approval_id: 'SYNTHETIC_APPROVAL',
    database_path: realpathSync(dbPath), database_identity: { dev: String(info.dev), ino: String(info.ino) },
    epoch: { epochId: '1', root: frozen.merkle_root, count: '2', protocolVersion: '1' },
    target: { chainId: '84532', contractAddress: contract, publisher: tx.from!.toLowerCase() }, policy_status: 'W4_PROVISIONAL_E2E_ONLY', team_approved: false,
    allow_confirmed_return: true, confirmation_approval_id: 'SYNTHETIC_CONFIRMATION_APPROVAL', minimum_confirmations: 12 }
  new EpochSenderHandoff(db, cfg.target).persistBeforeBroadcast({ epochId: '1', rawTransaction: raw }); epochs.markSubmitted('1')
  const encoded = abi.encodeEventLog(abi.getEvent('EpochRegistered')!, [1, frozen.merkle_root, 2, 1])
  model = {
    tx: { hash: txHash, from: tx.from, to: contract, chainId: '0x14a34', nonce: '0x7', input: tx.data, value: '0x0', blockNumber: '0x64', blockHash, transactionIndex: '0x0' },
    receipt: { status: '0x1', transactionHash: txHash, from: tx.from, to: contract, blockNumber: '0x64', blockHash, transactionIndex: '0x0',
      logs: [{ address: contract, transactionHash: txHash, blockNumber: '0x64', blockHash, transactionIndex: '0x0', logIndex: '0x0', removed: false, ...encoded }] },
    block: { number: '0x64', hash: blockHash, transactions: [txHash] }, head: { number: '0x6f', hash: headHash, transactions: [] },
    publisher: abi.encodeFunctionResult('publisher', [tx.from]), getter: abi.encodeFunctionResult('epochs', [frozen.merkle_root, 2, 1]),
  }
})
afterEach(() => {
  try { db.close() } catch {}
  if (!resolve(directory).startsWith(resolve(base) + sep)) throw Error('Unsafe temporary cleanup')
  rmSync(directory, { recursive: true, force: true })
})

describe('trusted confirmation and durable public release', () => {
  it.each([12, 13])('confirms at %i confirmations only after receipt/event/getter/canonical rechecks', async count => {
    model.head.number = '0x' + (100 + count - 1).toString(16)
    const before = await request(createApp({ database: db })).get(`/api/receipts/${id}/bundle`)
    expect(before.body.data).toMatchObject({ proof: null, anchor: null })
    const rpc = reader(), result = await verifyAndConfirm(db, cfg, rpc)
    expect(result).toMatchObject({ status: 'CONFIRMED', confirmations: String(count), minimum_confirmations: 12 })
    expect(row()).toMatchObject({ status: 'CONFIRMED', block_number: '100', block_hash: blockHash })
    const after = await request(createApp({ database: db })).get(`/api/receipts/${id}/bundle`)
    expect(after.body.data.proof).toMatchObject({ tree_size: 2, leaf_index: 0 })
    expect(after.body.data.anchor).toMatchObject({ tx_hash: txHash, block_hash: blockHash, block_number: '100', chain_id: '84532' })
    for (const secret of [raw, 'synthetic private text', 'content_salt', 'private_package']) expect(JSON.stringify(after.body)).not.toContain(secret)
    expect(rpc.calls.every(m => !m.includes('send') && !m.includes('sign'))).toBe(true)
    log({ case: 'verified-confirmation-and-public-http-bundle', confirmations: count, result: 'PASS', before_release: false, after_release: true })
  })
  it('survives SQLite reopen and identical duplicate verification without changing trusted identity', async () => {
    const first = await verifyAndConfirm(db, cfg, reader())
    const firstRow = row()
    db.close(); db = openApprovedDatabase(cfg)
    expect(hasTrustedConfirmation(db, row())).toBe(true)
    expect(await verifyAndConfirm(db, cfg, reader())).toEqual(first)
    expect(row()).toEqual(firstRow)
    expect((db.prepare('SELECT COUNT(*) AS n FROM epoch_confirmation_evidence').get() as any).n).toBe(1)
  })
  it.each([0, 1, 10, 11])('rejects only %i confirmations with no state/evidence release', async count => {
    model.head.number = '0x' + (100 + count - 1).toString(16); await expectClosed(reader())
  })
  it.each([0, 11, 12.5, '12'])('refuses weakened/invalid minimum %s', async minimum => {
    cfg.minimum_confirmations = minimum as number; await expectClosed(reader())
  })
  it('requires separate confirmation approval and a submitted durable transaction', async () => {
    const approved = { ...cfg }; cfg.allow_confirmed_return = false; await expectClosed(reader())
    cfg = { ...approved, confirmation_approval_id: 'no' }; await expectClosed(reader())
    cfg = approved; db.exec("UPDATE epochs SET status='SUBMITTING'")
    await expect(verifyAndConfirm(db, cfg, reader())).rejects.toThrow('NO_SUBMITTED')
  })
  it.each([
    ['receipt-missing', () => { model.receipt = null }], ['tx-missing', () => { model.tx = null }],
    ['reverted', () => { model.receipt.status = '0x0' }], ['receipt-hash', () => { model.receipt.transactionHash = headHash }],
    ['receipt-to', () => { model.receipt.to = `0x${'a'.repeat(40)}` }], ['receipt-from', () => { model.receipt.from = `0x${'a'.repeat(40)}` }],
    ['receipt-block', () => { model.receipt.blockHash = headHash }], ['receipt-index', () => { model.receipt.transactionIndex = '0x1' }],
    ['malformed-quantity', () => { model.receipt.status = '0x01' }], ['missing-status', () => { delete model.receipt.status }],
    ['tx-hash', () => { model.tx.hash = headHash }], ['tx-chain', () => { model.tx.chainId = '0x1' }],
    ['tx-publisher', () => { model.tx.from = `0x${'a'.repeat(40)}` }], ['tx-contract', () => { model.tx.to = `0x${'a'.repeat(40)}` }],
    ['tx-nonce', () => { model.tx.nonce = '0x8' }], ['tx-value', () => { model.tx.value = '0x1' }], ['tx-calldata', () => { model.tx.input = '0x00' }],
    ['canonical-hash', () => { model.block.hash = headHash }], ['canonical-number', () => { model.block.number = '0x65' }], ['block-membership', () => { model.block.transactions = [] }],
    ['event-missing', () => { model.receipt.logs = [] }], ['event-duplicate', () => { model.receipt.logs.push(structuredClone(model.receipt.logs[0])) }],
    ['event-emitter', () => { model.receipt.logs[0].address = `0x${'a'.repeat(40)}` }], ['event-removed', () => { model.receipt.logs[0].removed = true }],
    ['event-no-removed-flag', () => { delete model.receipt.logs[0].removed }], ['event-tx-hash', () => { model.receipt.logs[0].transactionHash = headHash }],
    ['event-block-hash', () => { model.receipt.logs[0].blockHash = headHash }], ['event-malformed-data', () => { model.receipt.logs[0].data = '0x00' }],
    ['event-root', () => { Object.assign(model.receipt.logs[0], abi.encodeEventLog(abi.getEvent('EpochRegistered')!, [1, headHash, 2, 1])) }],
    ['event-epoch', () => { Object.assign(model.receipt.logs[0], abi.encodeEventLog(abi.getEvent('EpochRegistered')!, [2, cfg.epoch.root, 2, 1])) }],
    ['event-count', () => { Object.assign(model.receipt.logs[0], abi.encodeEventLog(abi.getEvent('EpochRegistered')!, [1, cfg.epoch.root, 3, 1])) }],
    ['event-version', () => { Object.assign(model.receipt.logs[0], abi.encodeEventLog(abi.getEvent('EpochRegistered')!, [1, cfg.epoch.root, 2, 2])) }],
    ['getter-root', () => { model.getter = abi.encodeFunctionResult('epochs', [headHash, 2, 1]) }],
    ['getter-count', () => { model.getter = abi.encodeFunctionResult('epochs', [cfg.epoch.root, 3, 1]) }],
    ['getter-version', () => { model.getter = abi.encodeFunctionResult('epochs', [cfg.epoch.root, 2, 2]) }],
    ['getter-publisher', () => { model.publisher = abi.encodeFunctionResult('publisher', [`0x${'a'.repeat(40)}`]) }],
  ])('fails closed for %s', async (_label, mutate) => { mutate(); await expectClosed(reader()) })
  it.each(['chain', 'receipt-recheck', 'block-reorg', 'head-reorg', 'head-regression', 'getter-recheck', 'final-block-reorg'])('rejects reorg or inconsistent RPC %s', async change => {
    await expectClosed(reader((method, params, value, n) => {
      if (change === 'chain' && method === 'eth_chainId' && n === 2) return '0x1'
      if (change === 'receipt-recheck' && method === 'eth_getTransactionReceipt' && n === 2) value.status = '0x0'
      if (change === 'block-reorg' && method === 'eth_getBlockByNumber' && params[0] === '0x64' && n === 2) value.hash = headHash
      if (change === 'final-block-reorg' && method === 'eth_getBlockByNumber' && params[0] === '0x64' && n === 3) value.hash = headHash
      if (change === 'head-reorg' && method === 'eth_getBlockByNumber' && params[0] === '0x6f') value.hash = blockHash
      if (change === 'head-regression' && method === 'eth_getBlockByNumber' && params[0] === 'latest' && n === 2) value.number = '0x6e'
      if (change === 'getter-recheck' && method === 'eth_call' && n === 4) return abi.encodeFunctionResult('epochs', [headHash, 2, 1])
      return value
    }))
  })
  it.each(['signed_tx', 'tx_hash', 'nonce', 'chain_id', 'contract_address'])('rejects corrupted durable %s', async field => {
    const values: any = { signed_tx: '0x1234', tx_hash: headHash, nonce: '8', chain_id: '1', contract_address: `0x${'a'.repeat(40)}` }
    db.prepare(`UPDATE epochs SET ${field}=?`).run(values[field]); await expectClosed(reader())
  })
  it('times out without late promotion after the losing RPC promise eventually resolves', async () => {
    const rpc = reader(), delayed: ConfirmationReader = { request: async (m, p) => { await new Promise(done => setTimeout(done, 60)); return rpc.request(m, p) } }
    await expect(verifyAndConfirm(db, cfg, delayed, 10)).rejects.toThrow('CONFIRMATION_TIMEOUT')
    await new Promise(done => setTimeout(done, 450)); expect(row().status).toBe('SUBMITTED')
  })
  it('rolls back the state transition if evidence persistence fails', async () => {
    db.exec(CONFIRMATION_TABLE + "; CREATE TRIGGER reject_evidence BEFORE INSERT ON epoch_confirmation_evidence BEGIN SELECT RAISE(ABORT,'synthetic failure'); END")
    await expectClosed(reader()); expect((db.prepare('SELECT COUNT(*) AS n FROM epoch_confirmation_evidence').get() as any).n).toBe(0)
  })
  it.each(['epoch', 'members'])('rejects concurrent F %s changes before atomic promotion', async field => {
    let changed = false
    await expectClosed(reader((method, _params, value) => {
      if (!changed && method === 'eth_chainId') { changed = true; if (field === 'epoch') db.exec("UPDATE epochs SET nonce='8'"); else db.exec("UPDATE receipts SET canonical_body='{}'") }
      return value
    }))
  })
  it('invalidates public release after a contradictory confirmed retry while retaining the trusted history', async () => {
    await verifyAndConfirm(db, cfg, reader())
    const prior = row()
    model.block.hash = headHash; model.tx.blockHash = headHash; model.receipt.blockHash = headHash; model.receipt.logs[0].blockHash = headHash
    await expect(verifyAndConfirm(db, cfg, reader())).rejects.toThrow()
    expect(row()).toEqual(prior); expect(hasTrustedConfirmation(db, row())).toBe(false)
    const response = await request(createApp({ database: db })).get(`/api/receipts/${id}/bundle`)
    expect(response.body.data).toMatchObject({ proof: null, anchor: null })
    db.close(); db = openApprovedDatabase(cfg); expect(hasTrustedConfirmation(db, row())).toBe(false)
    log({ case: 'contradictory-retry-revokes-release', result: 'PASS', trusted_row_preserved: true, public_release: false })
  })
  it('suspends previously confirmed public release before starting any revalidation RPC', async () => {
    await verifyAndConfirm(db, cfg, reader())
    expect(hasTrustedConfirmation(db, row())).toBe(true)
    const rpc = reader()
    const observing: ConfirmationReader = { request: async (method, params) => {
      expect(hasTrustedConfirmation(db, row())).toBe(false)
      return rpc.request(method, params)
    } }
    await verifyAndConfirm(db, cfg, observing)
    expect(hasTrustedConfirmation(db, row())).toBe(true)
  })
  it('withholds legacy CONFIRMED and tampered evidence or member bindings', async () => {
    new EpochService(db).markConfirmed({ epochId: '1', blockNumber: '100', blockHash: blockHash as any })
    expect(hasTrustedConfirmation(db, row())).toBe(false)
    await verifyAndConfirm(db, cfg, reader()); expect(hasTrustedConfirmation(db, row())).toBe(true)
    db.exec("UPDATE epoch_confirmation_evidence SET binding_hash='wrong'"); expect(hasTrustedConfirmation(db, row())).toBe(false)
  })
})

describe('actual Windows CLI and bounded read-only RPC transport', () => {
  async function runCli(input = '', operation = 'confirmed') {
    const rpc = reader(), methods: string[] = []
    const server = createServer(async (req, res) => {
      try {
        let body = ''; for await (const chunk of req) body += String(chunk)
        const call = JSON.parse(body); methods.push(call.method)
        const result = await rpc.request(call.method, call.params)
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ jsonrpc: '2.0', id: call.id, result }))
      } catch { res.writeHead(500); res.end('{}') }
    })
    server.listen(0, '127.0.0.1'); await once(server, 'listening')
    const config = join(directory, 'private confirmation approval.json')
    writeFileSync(config, JSON.stringify({ ...cfg, rpc_url: `http://127.0.0.1:${(server.address() as any).port}` }))
    try {
      const child = spawn(process.execPath, ['--import', pathToFileURL(join(root, 'backend/node_modules/tsx/dist/loader.mjs')).href,
        join(root, 'backend/scripts/f-durability-callback.mts'), '--config', config, '--synthetic-test-only', '--operation', operation], { windowsHide: true })
      let stdout = '', stderr = ''; child.stdout.on('data', c => { stdout += String(c) }); child.stderr.on('data', c => { stderr += String(c) })
      const timer = setTimeout(() => child.kill(), 20000); child.stdin.end(input)
      const [code] = await once(child, 'close'); clearTimeout(timer)
      return { code, stdout, stderr, methods }
    } finally { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())) }
  }
  it('executes confirmed CLI against only loopback stub RPC and persists the release gate', async () => {
    const result = await runCli()
    expect(result.code).toBe(0); expect(JSON.parse(result.stdout)).toMatchObject({ status: 'CONFIRMED', confirmations: '12' })
    expect(result.stdout.trim().split('\n')).toHaveLength(1)
    for (const secret of [raw, dbPath, cfg.confirmation_approval_id!]) expect(result.stdout).not.toContain(secret)
    expect(hasTrustedConfirmation(db, row())).toBe(true)
    expect(result.methods.every(m => ['eth_chainId', 'eth_getTransactionByHash', 'eth_getTransactionReceipt', 'eth_getBlockByNumber', 'eth_call'].includes(m))).toBe(true)
    log({ case: 'actual-windows-confirmed-cli', result: 'PASS', exit_code: result.code, confirmations: 12, public_release: true, read_only_rpc_methods: [...new Set(result.methods)], actual_chain_tx_sent: false })
  }, 25000)
  it('rejects a plain CONFIRMED JSON request and disabled approval with empty stdout', async () => {
    const plain = await runCli('{"status":"CONFIRMED"}', 'prepare')
    expect(plain.code).not.toBe(0); expect(plain.stdout).toBe(''); expect(plain.methods).toEqual([])
    cfg.allow_confirmed_return = false
    const blocked = await runCli(); expect(blocked.code).not.toBe(0); expect(blocked.stdout).toBe(''); expect(blocked.methods).toEqual([])
    expect(row().status).toBe('SUBMITTED')
  }, 25000)
  it('rejects public plaintext RPC and mismatched JSON-RPC ids', async () => {
    expect(() => confirmationReader('http://example.com')).toThrow('TRUSTED_RPC_REQUIRED')
    const server = createServer((_req, res) => { res.writeHead(200); res.end('{"jsonrpc":"2.0","id":-1,"result":"0x14a34"}') })
    server.listen(0, '127.0.0.1'); await once(server, 'listening')
    try { await expect(confirmationReader(`http://127.0.0.1:${(server.address() as any).port}`).request('eth_chainId', [])).rejects.toThrow('RPC_READ_FAILED') }
    finally { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())) }
  })
  it('fails closed when real loopback HTTP RPC reads time out', async () => {
    const server = createServer(() => { /* deliberately never return a response */ })
    server.listen(0, '127.0.0.1'); await once(server, 'listening')
    try { await expectClosed(confirmationReader(`http://127.0.0.1:${(server.address() as any).port}`)) }
    finally { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())) }
    log({ case: 'actual-http-rpc-timeout', result: 'PASS', state: 'SUBMITTED', public_release: false })
  }, 10000)
})
