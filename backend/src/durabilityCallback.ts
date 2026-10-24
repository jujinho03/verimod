import { closeSync, fstatSync, lstatSync, openSync, readFileSync, readSync, realpathSync, statSync } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { pathToFileURL } from 'node:url'
import { freezeEpoch } from '@verimod/protocol/epoch'
import type { Hex32 } from '@verimod/protocol/hash'
import { EpochService } from './epochs.js'
import { EpochSenderHandoff, type DurableSubmissionAck, type SenderTarget } from './senderHandoff.js'

export const MAX_CALLBACK_BYTES = 32768
export const APPROVED_TARGET: SenderTarget = {
  chainId: '84532', contractAddress: '0xd17ba590b23e984e3f3408bcdc3529be9868ec50',
  publisher: '0xd47675be41ec3476f541c1d8d8a9f622c90182ed',
}
export const ACTUAL_EPOCH = { epochId: '1', root: '0x32bf54ab91c8727e476bd4aaa13dacc6af4eaa8273656317ce7f331e29a29f82', count: '2', protocolVersion: '1' }
export class CallbackError extends Error { constructor(readonly code: string) { super(code) } }
function requireThat(value: unknown, code: string): asserts value { if (!value) throw new CallbackError(code) }
function object(value: unknown): Record<string, unknown> {
  requireThat(value && typeof value === 'object' && !Array.isArray(value), 'INVALID_OBJECT')
  return value as Record<string, unknown>
}
const DECIMAL = /^(0|[1-9]\d*)$/
const HEX32 = /^0x[0-9a-f]{64}$/
const ADDRESS = /^0x[0-9a-f]{40}$/
function uint(value: unknown, max: bigint, positive = false): string {
  requireThat(typeof value === 'string' && value.length <= 20 && DECIMAL.test(value), 'INVALID_UINT')
  requireThat(BigInt(value) <= max && (!positive || BigInt(value) > 0n), 'INVALID_UINT')
  return value
}
export interface CallbackRequest {
  epochId: string; root: string; count: string; protocolVersion: string; chainId: string
  contractAddress: string; rawTransaction: string; txHash: string; nonce: string
}
export function parseCallbackRequest(text: string): CallbackRequest {
  requireThat(Buffer.byteLength(text) <= MAX_CALLBACK_BYTES, 'INPUT_TOO_LARGE')
  let input: Record<string, unknown>
  try { input = object(JSON.parse(text)) } catch { throw new CallbackError('INVALID_JSON_REQUEST') }
  const keys = ['epochId', 'root', 'count', 'protocolVersion', 'chainId', 'contractAddress', 'rawTransaction', 'txHash', 'nonce']
  requireThat(Object.keys(input).length === keys.length && keys.every(key => Object.hasOwn(input, key)), 'INVALID_REQUEST_FIELDS')
  uint(input.epochId, (1n << 64n) - 1n, true); uint(input.count, (1n << 32n) - 1n, true)
  uint(input.protocolVersion, 65535n, true); uint(input.chainId, (1n << 64n) - 1n, true)
  uint(input.nonce, BigInt(Number.MAX_SAFE_INTEGER))
  requireThat(typeof input.root === 'string' && HEX32.test(input.root) && input.root !== `0x${'0'.repeat(64)}`, 'INVALID_ROOT')
  requireThat(typeof input.txHash === 'string' && HEX32.test(input.txHash), 'INVALID_TX_HASH')
  requireThat(typeof input.contractAddress === 'string' && ADDRESS.test(input.contractAddress), 'INVALID_CONTRACT')
  requireThat(typeof input.rawTransaction === 'string' && /^0x(?:[0-9a-f]{2})+$/.test(input.rawTransaction), 'INVALID_RAW_TRANSACTION')
  return input as unknown as CallbackRequest
}

export interface CallbackApproval {
  schema_version: 'w4-f-callback-approval/1'
  mode: 'AUTHORITATIVE' | 'SYNTHETIC_TEST_ONLY'
  approval_id: string
  database_path: string
  database_identity: { dev: string; ino: string }
  epoch: { epochId: string; root: string; count: string; protocolVersion: string }
  target: SenderTarget
  policy_status: 'W4_PROVISIONAL_E2E_ONLY'
  team_approved: false
  allow_submitted_return?: boolean
  allow_confirmed_return?: boolean
  confirmation_approval_id?: string
  minimum_confirmations?: number
  rpc_url?: string
}

/** Configuration is provisioned by the trusted DB host operator, never received from T stdin. */
export function loadCallbackApproval(path: string, syntheticTestOnly: boolean): CallbackApproval {
  requireThat(isAbsolute(path) && !lstatSync(path).isSymbolicLink() && statSync(path).isFile() && statSync(path).size <= 16384, 'INVALID_APPROVAL_FILE')
  const cfg = object(JSON.parse(readFileSync(path, 'utf8')))
  requireThat(cfg.schema_version === 'w4-f-callback-approval/1' && cfg.mode === (syntheticTestOnly ? 'SYNTHETIC_TEST_ONLY' : 'AUTHORITATIVE'), 'APPROVAL_MODE_MISMATCH')
  requireThat(typeof cfg.approval_id === 'string' && /^[A-Za-z0-9_-]{8,100}$/.test(cfg.approval_id), 'HOST_APPROVAL_REQUIRED')
  requireThat(cfg.policy_status === 'W4_PROVISIONAL_E2E_ONLY' && cfg.team_approved === false, 'POLICY_SCOPE_MISMATCH')
  requireThat(typeof cfg.database_path === 'string' && isAbsolute(cfg.database_path) && !cfg.database_path.includes('\0'), 'INVALID_DB_PATH')
  const identity = object(cfg.database_identity), epoch = object(cfg.epoch), target = object(cfg.target)
  requireThat(typeof identity.dev === 'string' && DECIMAL.test(identity.dev) && typeof identity.ino === 'string' && DECIMAL.test(identity.ino) && BigInt(identity.ino) > 0n, 'INVALID_DB_IDENTITY')
  uint(epoch.epochId, (1n << 64n) - 1n, true); uint(epoch.count, (1n << 32n) - 1n, true); uint(epoch.protocolVersion, 65535n, true)
  requireThat(typeof epoch.root === 'string' && HEX32.test(epoch.root), 'INVALID_APPROVED_EPOCH')
  requireThat(target.chainId === '84532' && typeof target.contractAddress === 'string' && ADDRESS.test(target.contractAddress)
    && typeof target.publisher === 'string' && ADDRESS.test(target.publisher), 'INVALID_APPROVED_TARGET')
  if (!syntheticTestOnly) {
    requireThat(Object.entries(APPROVED_TARGET).every(([key, value]) => target[key] === value), 'UNAPPROVED_TARGET')
    requireThat(Object.entries(ACTUAL_EPOCH).every(([key, value]) => epoch[key] === value), 'UNAPPROVED_ACTUAL_EPOCH')
  }
  return cfg as unknown as CallbackApproval
}

/** Opens only on platforms where the runtime can safely uphold the approved DB binding. No migrations. */
export function openApprovedDatabase(cfg: CallbackApproval): DatabaseSync {
  // node:sqlite does not expose a writable, existing-file-only open mode on
  // Windows. Its normal writable open can create a replacement after our
  // pathname/identity checks, so never use it for an approved callback DB.
  // Keep this fail-closed until the runtime supplies an atomic no-create API.
  requireThat(process.platform !== 'win32', 'WINDOWS_WRITABLE_NO_CREATE_UNSUPPORTED')
  const path = resolve(cfg.database_path)
  requireThat(!lstatSync(path).isSymbolicLink() && realpathSync(path) === path, 'NONCANONICAL_DB_PATH')
  const matchesIdentity = () => {
    const info = statSync(path, { bigint: true })
    requireThat(info.isFile() && String(info.dev) === cfg.database_identity.dev && String(info.ino) === cfg.database_identity.ino, 'DB_IDENTITY_MISMATCH')
  }
  matchesIdentity()
  const fd = openSync(path, 'r')
  try {
    const info = fstatSync(fd, { bigint: true }), header = Buffer.alloc(16)
    requireThat(String(info.dev) === cfg.database_identity.dev && String(info.ino) === cfg.database_identity.ino, 'DB_IDENTITY_MISMATCH')
    requireThat(readSync(fd, header, 0, 16, 0) === 16 && header.equals(Buffer.from('SQLite format 3\0')), 'NOT_SQLITE_FILE')
  } finally { closeSync(fd) }
  const database = new DatabaseSync(`${pathToFileURL(path).href}?mode=rw`, { timeout: 1000, allowExtension: false })
  try {
    matchesIdentity()
    const main = (database.prepare('PRAGMA database_list').all() as { name: string; file: string }[]).find(row => row.name === 'main')
    requireThat(main?.file && realpathSync(main.file) === path, 'SQLITE_PATH_MISMATCH')
    // FULL is per connection. Keep the existing persistent journal mode; never turn OFF/MEMORY into a pass.
    database.exec('PRAGMA synchronous=FULL')
    const journal = database.prepare('PRAGMA journal_mode').get() as { journal_mode: string }
    requireThat(!['off', 'memory'].includes(journal.journal_mode.toLowerCase()), 'NON_DURABLE_SQLITE')
    requireThat((database.prepare('PRAGMA user_version').get() as { user_version: number }).user_version === 2, 'UNSUPPORTED_F_SCHEMA')
    return database
  } catch (error) { database.close(); throw error }
}

export async function verifyApprovedEpoch(database: DatabaseSync, cfg: CallbackApproval) {
  const epochs = new EpochService(database), epoch = epochs.get(cfg.epoch.epochId)
  requireThat(epoch.merkle_root === cfg.epoch.root && String(epoch.receipt_count) === cfg.epoch.count && String(epoch.protocol_version) === cfg.epoch.protocolVersion, 'APPROVED_EPOCH_MISMATCH')
  const members = database.prepare(`SELECT r.receipt_id, r.receipt_hash, r.issuer_seq, r.canonical_body, m.leaf_index
    FROM epoch_members m JOIN receipts r ON r.receipt_hash=m.receipt_hash WHERE m.epoch_id=? ORDER BY m.leaf_index`).all(epoch.epoch_id) as
    Array<{ receipt_id: string; receipt_hash: Hex32; issuer_seq: number; canonical_body: string; leaf_index: number }>
  const frozen = await freezeEpoch(members)
  requireThat(frozen.root === epoch.merkle_root && members.length === epoch.receipt_count
    && members.every((m, i) => m.leaf_index === i && m.receipt_hash === frozen.members[i].receipt_hash), 'FROZEN_MEMBERS_MISMATCH')
  requireThat(members.every(member => JSON.parse(member.canonical_body).issuer_id === 'verimod-example-platform'), 'FROZEN_ISSUER_MISMATCH')
  return epoch
}

export async function persistCallback(database: DatabaseSync, cfg: CallbackApproval, request: CallbackRequest): Promise<DurableSubmissionAck> {
  const epoch = await verifyApprovedEpoch(database, cfg)
  requireThat(request.epochId === epoch.epoch_id && request.root === epoch.merkle_root && request.count === String(epoch.receipt_count)
    && request.protocolVersion === String(epoch.protocol_version) && request.chainId === cfg.target.chainId && request.contractAddress === cfg.target.contractAddress, 'REQUEST_FROZEN_TARGET_MISMATCH')
  // The existing adapter performs all signature/calldata/target/durability checks. Expected hash/nonce
  // must be checked BEFORE it commits, so a bad advertised hash cannot leave a successful preparation.
  const { Transaction } = await import('ethers')
  const decoded = Transaction.from(request.rawTransaction)
  requireThat(decoded.hash === request.txHash && String(decoded.nonce) === request.nonce, 'REQUEST_TX_IDENTITY_MISMATCH')
  return new EpochSenderHandoff(database, cfg.target).persistBeforeBroadcast({ epochId: request.epochId, rawTransaction: request.rawTransaction })
}
