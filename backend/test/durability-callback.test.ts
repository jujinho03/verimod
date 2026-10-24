import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { appendFileSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Interface, Transaction } from 'ethers'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { openDatabase } from '../src/database.js'
import { EpochService } from '../src/epochs.js'
import { loadCallbackApproval, openApprovedDatabase, parseCallbackRequest, persistCallback, type CallbackApproval } from '../src/durabilityCallback.js'
import { reconcileSubmitted } from '../src/submissionReturn.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const base = join(root, 'backend/private-data/callback-tests')
const T_SHA = '34447502f8843f1be585b56fb31c51b41c0f2fc7'
const contractAddress = `0x${'b'.repeat(40)}`
const iface = new Interface(['function registerEpoch(uint64,bytes32,uint32,uint16)'])
type TRequest = ReturnType<typeof parseCallbackRequest>
let gate: {
  requestDurableSubmissionAck(request: TRequest, executable: string, args: readonly string[], timeoutMs?: number): Promise<Omit<TRequest, 'rawTransaction'> & { status: 'SUBMITTING' }>
  broadcastAfterDurableAck<T>(acknowledge: () => Promise<unknown>, expected: TRequest, broadcast: () => Promise<T>): Promise<T>
}
let gateSource = '', senderSource = ''
let directory: string, dbPath: string, configPath: string, cfg: CallbackApproval, request: ReturnType<typeof parseCallbackRequest>
function evidence(value: Record<string, unknown>) {
  if (process.env.VERIMOD_CALLBACK_EVIDENCE_LOG) appendFileSync(process.env.VERIMOD_CALLBACK_EVIDENCE_LOG,
    JSON.stringify({ timestamp: new Date().toISOString(), platform: process.platform, node: process.version, scope: 'SYNTHETIC_TEST_ONLY', ...value }) + '\n')
}
function envelope(rootHash: string, overrides: Record<string, unknown> = {}) {
  return Transaction.from({ type: 2, chainId: 84532, nonce: 7, gasLimit: 100000, maxFeePerGas: 2, maxPriorityFeePerGas: 1,
    to: contractAddress, value: 0, data: iface.encodeFunctionData('registerEpoch', [1, rootHash, 2, 1]),
    // Inert fixed signature bytes only. No key, signer, Wallet or signing operation.
    signature: { r: `0x${'01'.repeat(32)}`, s: `0x${'02'.repeat(32)}`, yParity: 0 }, ...overrides })
}
function withTx(overrides: Record<string, unknown>) {
  const tx = envelope(cfg.epoch.root, overrides)
  return { ...request, rawTransaction: tx.serialized, txHash: tx.hash!, nonce: String(tx.nonce) }
}
function saveConfig(value: unknown = cfg) { writeFileSync(configPath, JSON.stringify(value)) }
function args(extra: string[] = []) {
  return ['--import', pathToFileURL(join(root, 'backend/node_modules/tsx/dist/loader.mjs')).href,
    join(root, 'backend/scripts/f-durability-callback.mts'), '--config', configPath, '--synthetic-test-only', ...extra]
}
async function cli(input = JSON.stringify(request), extra: string[] = []) {
  const child = spawn(process.execPath, args(extra), { windowsHide: true })
  let stdout = '', stderr = ''
  child.stdout.on('data', data => { stdout += String(data) }); child.stderr.on('data', data => { stderr += String(data) })
  const timer = setTimeout(() => child.kill(), 10000)
  child.stdin.on('error', () => {}); child.stdin.end(input)
  const [code] = await once(child, 'close'); clearTimeout(timer)
  let publicResult: unknown = null
  try {
    const parsed = JSON.parse(stdout)
    const keys = ['epoch_id', 'merkle_root', 'receipt_count', 'protocol_version', 'status', 'tx_hash', 'nonce', 'chain_id', 'contract_address', 'confirmation_path']
    publicResult = Object.fromEntries(keys.filter(key => Object.hasOwn(parsed, key)).map(key => [key, parsed[key]]))
  } catch {}
  evidence({ case: 'actual-cli-exit', operation: extra[1] ?? 'prepare', exit_code: code, stdout_bytes: Buffer.byteLength(stdout), sanitized_result: publicResult })
  return { code, stdout, stderr }
}
function stored() {
  const database = new DatabaseSync(dbPath, { readOnly: true })
  try { return new EpochService(database).get('1') } finally { database.close() }
}
async function rejected(input = JSON.stringify(request), extra: string[] = []) {
  const result = await cli(input, extra)
  expect(result.code).not.toBe(0); expect(result.stdout).toBe('')
  for (const secret of [request.rawTransaction, dbPath, directory]) expect(result.stderr).not.toContain(secret)
  return result
}
beforeAll(async () => {
  mkdirSync(base, { recursive: true })
  const pinnedSource = (name: string, digest: string) => {
    const text = readFileSync(join(root, 'backend/test/fixtures/w4-t-3444750', name + '.txt'), 'utf8').replaceAll('\r\n', '\n')
    expect(createHash('sha256').update(text).digest('hex')).toBe(digest)
    return text
  }
  gateSource = pinnedSource('fDurabilityGate.ts', '267c6826767d4d37bddcb1c0bad70ba309237e2162938cfff50b2439c67b192d')
  senderSource = pinnedSource('register-epoch.ts', '500d003ed992645e74450faa231a5ed030102ec283ab3d99123e24c3eb136d11')
  // Hash-pinned, read-only snapshots extracted from the exact T object, usable in shallow CI.
  const sourcePath = join(base, `T-fDurabilityGate-${T_SHA}.ts`)
  writeFileSync(sourcePath, gateSource)
  gate = await import(/* @vite-ignore */ pathToFileURL(sourcePath).href)
})
beforeEach(async () => {
  directory = mkdtempSync(join(base, 'Windows callback spaces ')); dbPath = join(directory, 'authoritative test.sqlite'); configPath = join(directory, 'private approval.json')
  const db = openDatabase(dbPath)
  try {
    for (let i = 1; i <= 2; i++) db.prepare('INSERT INTO receipts (receipt_id,issuer_seq,canonical_body,receipt_hash,event_kind,owner_principal,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(`00000000-0000-4000-8000-00000000000${i}`, i, JSON.stringify({ issuer_id: 'verimod-example-platform' }), `0x${String(i).repeat(64)}`, 'DECISION', 'synthetic', '2026-10-17')
    const epoch = (await new EpochService(db).freeze({ principal: 'synthetic', idempotencyKey: 'freeze' })).epoch
    const tx = envelope(epoch.merkle_root), info = statSync(dbPath, { bigint: true })
    cfg = { schema_version: 'w4-f-callback-approval/1', mode: 'SYNTHETIC_TEST_ONLY', approval_id: 'SYNTHETIC_LOCAL_ONLY',
      database_path: realpathSync(dbPath), database_identity: { dev: String(info.dev), ino: String(info.ino) },
      epoch: { epochId: '1', root: epoch.merkle_root, count: '2', protocolVersion: '1' },
      target: { chainId: '84532', contractAddress, publisher: tx.from!.toLowerCase() }, policy_status: 'W4_PROVISIONAL_E2E_ONLY', team_approved: false }
    request = { ...cfg.epoch, chainId: '84532', contractAddress, rawTransaction: tx.serialized, txHash: tx.hash!, nonce: '7' }
    saveConfig()
  } finally { db.close() }
})
afterEach(() => {
  if (!resolve(directory).startsWith(resolve(base) + sep)) throw Error('Unsafe temporary cleanup')
  rmSync(directory, { recursive: true, force: true })
})

describe.skipIf(process.platform !== 'win32')('SEC-W5-01 Windows callback guard', () => {
  it('fails closed before opening or creating the approved database', () => {
    const before = readFileSync(dbPath)
    expect(() => openApprovedDatabase(cfg)).toThrow('WINDOWS_WRITABLE_NO_CREATE_UNSUPPORTED')
    expect(readFileSync(dbPath)).toEqual(before)
    expect(existsSync(dbPath)).toBe(true)
  })
})

const writableCallback = process.platform === 'win32' ? describe.skip : describe

writableCallback('F callback CLI and authoritative database binding', () => {
  it('runs on Windows, emits one snake_case ACK, survives reopen and retries identical bytes', async () => {
    const result = await cli()
    expect(result.code).toBe(0)
    const ack = JSON.parse(result.stdout)
    expect(result.stdout.trim().split('\n')).toHaveLength(1)
    expect(ack).toEqual({ epoch_id: '1', merkle_root: cfg.epoch.root, receipt_count: 2, protocol_version: 1, status: 'SUBMITTING', tx_hash: request.txHash, nonce: '7', chain_id: '84532', contract_address: contractAddress })
    expect(result.stdout).not.toContain(request.rawTransaction); expect(result.stdout).not.toContain(dbPath)
    expect(stored()).toMatchObject({ status: 'SUBMITTING', signed_tx: request.rawTransaction, tx_hash: request.txHash, nonce: '7' })
    expect((await cli()).stdout).toBe(result.stdout)
  }, 15000)
  it.each([
    ['missing-field', () => { const value: any = { ...request }; delete value.nonce; return JSON.stringify(value) }],
    ['unknown-field', () => JSON.stringify({ ...request, database_path: dbPath })],
    ['multiple-json', () => JSON.stringify(request) + '\n{}'], ['malformed-json', () => '{'],
    ['oversized', () => 'x'.repeat(32769)], ['numeric-count', () => JSON.stringify({ ...request, count: 2 })],
    ['invalid-root', () => JSON.stringify({ ...request, root: '0x00' })], ['negative-nonce', () => JSON.stringify({ ...request, nonce: '-1' })],
  ])('rejects invalid input %s with empty stdout', async (_name, value) => { await rejected(value()); expect(stored().status).toBe('FROZEN') })
  it.each(['epochId', 'root', 'count', 'protocolVersion', 'chainId', 'contractAddress', 'txHash', 'nonce'] as const)('rejects advertised %s mismatch without persisting', async key => {
    const changes = { epochId: '2', root: `0x${'e'.repeat(64)}`, count: '3', protocolVersion: '2', chainId: '1', contractAddress: `0x${'c'.repeat(40)}`, txHash: `0x${'d'.repeat(64)}`, nonce: '8' }
    await rejected(JSON.stringify({ ...request, [key]: changes[key] })); expect(stored().status).toBe('FROZEN')
  })
  it.each([
    ['publisher', { signature: { r: `0x${'03'.repeat(32)}`, s: `0x${'04'.repeat(32)}`, yParity: 1 } }],
    ['chain', { chainId: 1 }], ['contract', { to: `0x${'c'.repeat(40)}` }], ['value', { value: 1 }],
    ['calldata', { data: '0x12345678' }], ['calldata-root', { data: iface.encodeFunctionData('registerEpoch', [1, `0x${'e'.repeat(64)}`, 2, 1]) }],
  ])('reuses real adapter rejection for signed %s mismatch', async (_label, overrides) => {
    await rejected(JSON.stringify(withTx(overrides))); expect(stored().status).toBe('FROZEN')
  })
  it('rejects malformed and unsigned transactions', async () => {
    await rejected(JSON.stringify({ ...request, rawTransaction: '0x1234' }))
    await rejected(JSON.stringify({ ...request, rawTransaction: envelope(cfg.epoch.root).unsignedSerialized }))
    expect(stored().status).toBe('FROZEN')
  })
  it('does not create a missing database and rejects memory, relative and copied database identities', async () => {
    const missing = join(directory, 'does not exist.sqlite')
    saveConfig({ ...cfg, database_path: missing }); await rejected(); expect(existsSync(missing)).toBe(false)
    for (const path of [':memory:', 'relative.sqlite']) { saveConfig({ ...cfg, database_path: path }); await rejected() }
    const copied = join(directory, 'masquerading copy.sqlite'); copyFileSync(dbPath, copied)
    saveConfig({ ...cfg, database_path: copied }); await rejected()
    expect(stored().status).toBe('FROZEN')
  }, 15000)
  it('rejects a synthetic approval as authoritative, a forged production target and non-SQLite files', async () => {
    expect(() => loadCallbackApproval(configPath, false)).toThrow()
    saveConfig({ ...cfg, mode: 'AUTHORITATIVE' }); expect(() => loadCallbackApproval(configPath, false)).toThrow()
    writeFileSync(dbPath, 'not sqlite'); await rejected()
  })
  it.each(['absent', 'wrong-count', 'wrong-members', 'SUBMITTED', 'CONFIRMED', 'FAILED'])('rejects inappropriate frozen database %s', async change => {
    const db = openDatabase(dbPath)
    if (change === 'absent') db.exec('DELETE FROM epoch_members; DELETE FROM epochs')
    else if (change === 'wrong-count') db.exec('UPDATE epochs SET receipt_count=3')
    else if (change === 'wrong-members') db.exec('DELETE FROM epoch_members WHERE leaf_index=1')
    else db.prepare('UPDATE epochs SET status=?').run(change)
    db.close(); await rejected()
  })
  it('rejects disabled durable journaling via the adapter and rolls back SQLite write failure', async () => {
    const db = openApprovedDatabase(cfg)
    try {
      db.exec('PRAGMA synchronous=OFF')
      await expect(persistCallback(db, cfg, request)).rejects.toThrow('durable')
      db.exec('PRAGMA synchronous=FULL; PRAGMA journal_mode=MEMORY')
      await expect(persistCallback(db, cfg, request)).rejects.toThrow('durable')
      db.exec('PRAGMA journal_mode=DELETE; PRAGMA query_only=ON')
      await expect(persistCallback(db, cfg, request)).rejects.toThrow()
      expect(new EpochService(db).get('1').status).toBe('FROZEN')
    } finally { db.close() }
  })
  it('rejects conflicting SUBMITTING bytes and locked database writes with no ACK', async () => {
    expect((await cli()).code).toBe(0)
    await rejected(JSON.stringify(withTx({ nonce: 8 })))
    expect(stored().nonce).toBe('7')
    const lock = new DatabaseSync(dbPath); lock.exec('BEGIN IMMEDIATE')
    try { const result = await rejected(); expect(result.stdout).toBe('') }
    finally { lock.exec('ROLLBACK'); lock.close() }
  }, 15000)
  it('exposes read-only status and blocks unverified CONFIRMED/FAILED strings', async () => {
    expect(JSON.parse((await cli('', ['--operation', 'status'])).stdout)).toMatchObject({ status: 'FROZEN', confirmation_path: 'BLOCKED', team_approved: false })
    await rejected('', ['--operation', 'confirmed']); await rejected('', ['--operation', 'failed'])
    await rejected('', ['--operation', 'submitted']); expect(stored().status).toBe('FROZEN')
  }, 15000)
})

writableCallback('exact pinned T protocol, using the actual F CLI and adapter', () => {
  it('T requestDurableSubmissionAck accepts the F wire ACK after durable SQLite commit', async () => {
    const ack = await gate.requestDurableSubmissionAck(request, process.execPath, args())
    expect(ack).toMatchObject({ epochId: '1', root: cfg.epoch.root, count: '2', protocolVersion: '1', txHash: request.txHash, nonce: '7', status: 'SUBMITTING' })
    expect(stored().status).toBe('SUBMITTING')
    evidence({ case: 'T-request-function-with-real-F-adapter', result: 'PASS', durable_reopen: true })
  })
  it('reproduces T camelCase-to-snake_case composition defect: valid ACK still gives zero broadcast', async () => {
    const broadcast = vi.fn(async () => 'never')
    await expect(gate.broadcastAfterDurableAck(() => gate.requestDurableSubmissionAck(request, process.execPath, args()), request, broadcast)).rejects.toThrow('epoch_id')
    expect(broadcast).not.toHaveBeenCalled(); expect(stored().status).toBe('SUBMITTING')
    expect(senderSource).toContain('() => requestDurableSubmissionAck(expected, executable, args)')
    evidence({ case: 'pinned-T-full-composition', compatibility: 'FAIL', reason: 'T_CAMELCASE_RESULT_RECHECKED_AS_SNAKE_CASE', broadcast_stub_calls: broadcast.mock.calls.length })
  })
  it('supports an explicit wire-shape bridge after the real T request function; stub runs only after durable reopen', async () => {
    // This demonstrates the REQUIRED T fix, not the currently pinned register-epoch path.
    const acknowledge = async () => {
      const ack = await gate.requestDurableSubmissionAck(request, process.execPath, args())
      return { epoch_id: ack.epochId, merkle_root: ack.root, receipt_count: ack.count, protocol_version: ack.protocolVersion,
        chain_id: ack.chainId, contract_address: ack.contractAddress, status: ack.status, tx_hash: ack.txHash, nonce: ack.nonce }
    }
    const broadcast = vi.fn(async () => { expect(stored()).toMatchObject({ status: 'SUBMITTING', signed_tx: request.rawTransaction }); return 'BROADCAST_STUB_ONLY' })
    await expect(gate.broadcastAfterDurableAck(acknowledge, request, broadcast)).resolves.toBe('BROADCAST_STUB_ONLY')
    expect(broadcast).toHaveBeenCalledOnce()
    evidence({ case: 'proposed-T-wire-bridge', result: 'PASS', production_T_modified: false, broadcast_stub_calls: 1, actual_broadcast_calls: 0 })
  })
  it.each(['callback-rejected', 'timeout', 'missing-ack', 'bad-ack'])('keeps zero broadcasts for %s', async failure => {
    const broadcast = vi.fn(async () => 'never')
    const acknowledge = failure === 'callback-rejected'
      ? () => gate.requestDurableSubmissionAck({ ...request, nonce: '8' }, process.execPath, args())
      : failure === 'timeout' ? () => gate.requestDurableSubmissionAck(request, process.execPath, ['-e', 'setTimeout(()=>{},30000)'], 100)
      : async () => failure === 'missing-ack' ? undefined : { status: 'SUBMITTING', epoch_id: '99' }
    await expect(gate.broadcastAfterDurableAck(acknowledge, request, broadcast)).rejects.toThrow()
    expect(broadcast).not.toHaveBeenCalled(); expect(stored().status).toBe('FROZEN')
  })
})

writableCallback('trusted post-submission acceptance, confirmation remains blocked', () => {
  it('runs the SUBMITTED CLI against a loopback read-only RPC stub without signing or sending', async () => {
    expect((await cli()).code).toBe(0)
    const tx = Transaction.from(request.rawTransaction), methods: string[] = []
    const server = createServer(async (req, res) => {
      let input = ''; for await (const chunk of req) input += String(chunk)
      const call = JSON.parse(input); methods.push(call.method)
      const result = call.method === 'eth_chainId' ? '0x14a34' : {
        hash: tx.hash, from: tx.from, to: tx.to, chainId: '0x14a34', nonce: '0x7', input: tx.data, value: '0x0',
      }
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ jsonrpc: '2.0', id: call.id, result }))
    })
    server.listen(0, '127.0.0.1'); await once(server, 'listening')
    try {
      saveConfig({ ...cfg, allow_submitted_return: true, rpc_url: `http://127.0.0.1:${(server.address() as { port: number }).port}` })
      const result = await cli('', ['--operation', 'submitted'])
      expect(result.code).toBe(0); expect(JSON.parse(result.stdout)).toMatchObject({ status: 'SUBMITTED' })
      expect(methods).toEqual(['eth_chainId', 'eth_getTransactionByHash']); expect(stored().block_hash).toBeNull()
    } finally { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())) }
  }, 15000)
  it('marks SUBMITTED only after trusted RPC identity checks and safely replays', async () => {
    expect((await cli()).code).toBe(0)
    const tx = Transaction.from(request.rawTransaction), db = openApprovedDatabase(cfg)
    const reader = { getNetwork: async () => ({ chainId: 84532n }), getTransaction: async () => ({ hash: tx.hash!, from: tx.from!, to: tx.to, chainId: tx.chainId, nonce: tx.nonce, data: tx.data, value: tx.value }) }
    try {
      await expect(reconcileSubmitted(db, cfg, reader)).rejects.toThrow('NOT_AUTHORIZED')
      const permitted = { ...cfg, allow_submitted_return: true }
      expect(await reconcileSubmitted(db, permitted, reader)).toMatchObject({ status: 'SUBMITTED', tx_hash: request.txHash })
      expect(await reconcileSubmitted(db, permitted, reader)).toMatchObject({ status: 'SUBMITTED' })
      expect(new EpochService(db).get('1').block_hash).toBeNull()
    } finally { db.close() }
  })
  it.each(['network', 'missing', 'hash', 'sender', 'contract', 'nonce', 'calldata', 'value', 'chain'])('rejects unverified RPC %s without changing SUBMITTING', async field => {
    expect((await cli()).code).toBe(0)
    const tx = Transaction.from(request.rawTransaction), db = openApprovedDatabase(cfg)
    const observed = { hash: tx.hash!, from: tx.from!, to: tx.to, chainId: tx.chainId, nonce: tx.nonce, data: tx.data, value: tx.value }
    const override: any = { hash: { hash: `0x${'f'.repeat(64)}` }, sender: { from: `0x${'a'.repeat(40)}` }, contract: { to: `0x${'a'.repeat(40)}` }, nonce: { nonce: 8 }, calldata: { data: '0x00' }, value: { value: 1n }, chain: { chainId: 1n } }
    const reader = { getNetwork: async () => ({ chainId: field === 'network' ? 1n : 84532n }), getTransaction: async () => field === 'missing' ? null : { ...observed, ...override[field] } }
    try {
      await expect(reconcileSubmitted(db, { ...cfg, allow_submitted_return: true }, reader)).rejects.toThrow()
      expect(new EpochService(db).get('1').status).toBe('SUBMITTING')
    } finally { db.close() }
  })
})
