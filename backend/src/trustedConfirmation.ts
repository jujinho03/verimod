import { Interface } from 'ethers'
import type { DatabaseSync } from 'node:sqlite'
import { canonicalize } from '@verimod/protocol/canonical'
import type { Hex32 } from '@verimod/protocol/hash'
import { APPROVED_TARGET, CallbackError, type CallbackApproval, verifyApprovedEpoch } from './durabilityCallback.js'
import { EpochService, type EpochView } from './epochs.js'
import { verifyEpochTransaction } from './senderHandoff.js'
import { CONFIRMATION_TABLE, confirmationBinding, confirmationDigest, confirmationMembersDigest, hasConfirmationTable } from './confirmationEvidence.js'

export const CONFIRMATION_ABI = new Interface([
  'function publisher() view returns (address)', 'function epochs(uint64) view returns (bytes32 root,uint32 count,uint16 protocolVersion)',
  'event EpochRegistered(uint64 indexed epochId,bytes32 root,uint32 count,uint16 protocolVersion)',
])
type Method = 'eth_chainId' | 'eth_getTransactionByHash' | 'eth_getTransactionReceipt' | 'eth_getBlockByNumber' | 'eth_call'
export interface ConfirmationReader { request(method: Method, params: unknown[]): Promise<unknown> }
function requireThat(value: unknown, code: string): asserts value { if (!value) throw new CallbackError(code) }
function record(value: unknown): Record<string, any> {
  requireThat(value && typeof value === 'object' && !Array.isArray(value), 'INCOMPLETE_RPC_EVIDENCE')
  return value as Record<string, any>
}
function quantity(value: unknown): bigint {
  requireThat(typeof value === 'string' && /^0x(?:0|[1-9a-f][0-9a-f]*)$/.test(value) && value.length <= 18, 'INVALID_RPC_QUANTITY')
  return BigInt(value)
}
function hash(value: unknown): string {
  requireThat(typeof value === 'string' && /^0x[0-9a-f]{64}$/.test(value) && value !== `0x${'0'.repeat(64)}`, 'INVALID_RPC_HASH')
  return value
}
function address(value: unknown): string {
  requireThat(typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value), 'INVALID_RPC_ADDRESS')
  return value.toLowerCase()
}
const hex = (n: bigint) => `0x${n.toString(16)}`
const fingerprint = (value: unknown) => canonicalize(JSON.parse(JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? String(item) : item)))
function block(value: unknown) {
  const b = record(value)
  requireThat(Array.isArray(b.transactions) && b.transactions.length <= 100000 && b.transactions.every((tx: unknown) => typeof tx === 'string' && /^0x[0-9a-f]{64}$/.test(tx)), 'INVALID_RPC_BLOCK')
  return { number: quantity(b.number), hash: hash(b.hash), transactions: b.transactions as string[] }
}
function durable(db: DatabaseSync) {
  const main = (db.prepare('PRAGMA database_list').all() as { name: string; file: string }[]).find(r => r.name === 'main')
  const sync = db.prepare('PRAGMA synchronous').get() as { synchronous: number }, journal = db.prepare('PRAGMA journal_mode').get() as { journal_mode: string }
  requireThat(main?.file && sync.synchronous >= 2 && !['off', 'memory'].includes(journal.journal_mode.toLowerCase()), 'CONFIRMATION_REQUIRES_DURABLE_SQLITE')
}
function validateInclusion(txValue: unknown, receiptValue: unknown, epoch: EpochView, cfg: CallbackApproval) {
  const tx = record(txValue), receipt = record(receiptValue), stored = verifyEpochTransaction(epoch, epoch.signed_tx!, cfg.target)
  requireThat(stored.hash === epoch.tx_hash && String(stored.nonce) === epoch.nonce && epoch.chain_id === cfg.target.chainId
    && epoch.contract_address === cfg.target.contractAddress, 'DURABLE_TX_IDENTITY_MISMATCH')
  requireThat(hash(tx.hash) === epoch.tx_hash && quantity(tx.chainId) === 84532n && quantity(tx.nonce) === BigInt(epoch.nonce!)
    && address(tx.from) === cfg.target.publisher && address(tx.to) === cfg.target.contractAddress
    && tx.input === stored.data && quantity(tx.value) === 0n, 'RPC_TX_IDENTITY_MISMATCH')
  requireThat(quantity(receipt.status) === 1n && hash(receipt.transactionHash) === epoch.tx_hash
    && address(receipt.from) === cfg.target.publisher && address(receipt.to) === cfg.target.contractAddress, 'UNSUCCESSFUL_OR_UNTRUSTED_RECEIPT')
  const blockNumber = quantity(receipt.blockNumber), blockHash = hash(receipt.blockHash), index = quantity(receipt.transactionIndex)
  requireThat(blockNumber > 0n && quantity(tx.blockNumber) === blockNumber && hash(tx.blockHash) === blockHash
    && quantity(tx.transactionIndex) === index, 'TX_RECEIPT_BLOCK_MISMATCH')
  requireThat(Array.isArray(receipt.logs) && receipt.logs.length <= 1024, 'INVALID_RECEIPT_LOGS')
  const topic = CONFIRMATION_ABI.getEvent('EpochRegistered')!.topicHash
  const candidates = receipt.logs.filter((item: unknown) => {
    const log = record(item)
    return address(log.address) === cfg.target.contractAddress && Array.isArray(log.topics) && log.topics[0] === topic
  })
  requireThat(candidates.length === 1, 'MISSING_OR_DUPLICATE_EPOCH_EVENT')
  const log = candidates[0]
  requireThat(log.removed === false && hash(log.transactionHash) === epoch.tx_hash && hash(log.blockHash) === blockHash
    && quantity(log.blockNumber) === blockNumber && quantity(log.transactionIndex) === index, 'REMOVED_OR_MISBOUND_EVENT')
  const eventIndex = quantity(log.logIndex)
  const args = CONFIRMATION_ABI.decodeEventLog('EpochRegistered', log.data, log.topics)
  const encoded = CONFIRMATION_ABI.encodeEventLog(CONFIRMATION_ABI.getEvent('EpochRegistered')!, args)
  requireThat(canonicalize(encoded.topics) === canonicalize(log.topics) && encoded.data === log.data
    && args.epochId === BigInt(epoch.epoch_id) && args.root === epoch.merkle_root
    && args.count === BigInt(epoch.receipt_count) && args.protocolVersion === BigInt(epoch.protocol_version), 'EPOCH_EVENT_MISMATCH')
  return { blockNumber, blockHash, index, eventIndex }
}
async function contractEvidence(reader: ConfirmationReader, epoch: EpochView, cfg: CallbackApproval, blockHash: string) {
  const at = { blockHash, requireCanonical: true }
  const [publisherResult, epochResult] = await Promise.all([
    reader.request('eth_call', [{ to: cfg.target.contractAddress, data: CONFIRMATION_ABI.encodeFunctionData('publisher') }, at]),
    reader.request('eth_call', [{ to: cfg.target.contractAddress, data: CONFIRMATION_ABI.encodeFunctionData('epochs', [epoch.epoch_id]) }, at]),
  ])
  const publisher = CONFIRMATION_ABI.decodeFunctionResult('publisher', publisherResult as string)
  const state = CONFIRMATION_ABI.decodeFunctionResult('epochs', epochResult as string)
  requireThat(CONFIRMATION_ABI.encodeFunctionResult('publisher', publisher) === publisherResult && address(publisher[0]) === cfg.target.publisher
    && CONFIRMATION_ABI.encodeFunctionResult('epochs', state) === epochResult && state.root === epoch.merkle_root
    && state.count === BigInt(epoch.receipt_count) && state.protocolVersion === BigInt(epoch.protocol_version), 'PUBLISHER_OR_EPOCH_GETTER_MISMATCH')
}
async function collect(reader: ConfirmationReader, epoch: EpochView, cfg: CallbackApproval, minimum: number) {
  const [chain, tx, receipt, headRaw] = await Promise.all([
    reader.request('eth_chainId', []), reader.request('eth_getTransactionByHash', [epoch.tx_hash]),
    reader.request('eth_getTransactionReceipt', [epoch.tx_hash]), reader.request('eth_getBlockByNumber', ['latest', false]),
  ])
  requireThat(quantity(chain) === 84532n, 'WRONG_CONFIRMATION_CHAIN')
  const inclusion = validateInclusion(tx, receipt, epoch, cfg), head = block(headRaw)
  requireThat(head.number >= inclusion.blockNumber && head.number - inclusion.blockNumber + 1n >= BigInt(minimum), 'INSUFFICIENT_CONFIRMATIONS')
  const included = block(await reader.request('eth_getBlockByNumber', [hex(inclusion.blockNumber), false]))
  requireThat(included.number === inclusion.blockNumber && included.hash === inclusion.blockHash
    && included.transactions[Number(inclusion.index)] === epoch.tx_hash, 'NONCANONICAL_RECEIPT_BLOCK')
  await contractEvidence(reader, epoch, cfg, inclusion.blockHash)
  // Re-read the transaction/receipt and both canonical anchors immediately before persistence.
  const [chain2, tx2, receipt2, included2Raw, anchor2Raw, latest2Raw] = await Promise.all([
    reader.request('eth_chainId', []), reader.request('eth_getTransactionByHash', [epoch.tx_hash]), reader.request('eth_getTransactionReceipt', [epoch.tx_hash]),
    reader.request('eth_getBlockByNumber', [hex(inclusion.blockNumber), false]), reader.request('eth_getBlockByNumber', [hex(head.number), false]),
    reader.request('eth_getBlockByNumber', ['latest', false]),
  ])
  const second = validateInclusion(tx2, receipt2, epoch, cfg), included2 = block(included2Raw), anchor2 = block(anchor2Raw), latest2 = block(latest2Raw)
  requireThat(quantity(chain2) === 84532n && canonicalize(tx) === canonicalize(tx2) && canonicalize(receipt) === canonicalize(receipt2)
    && fingerprint(inclusion) === fingerprint(second) && fingerprint(included) === fingerprint(included2)
    && fingerprint(anchor2) === fingerprint(head) && latest2.number >= head.number
    && (latest2.number !== head.number || latest2.hash === head.hash), 'REORG_OR_INCONSISTENT_RPC')
  await contractEvidence(reader, epoch, cfg, inclusion.blockHash)
  // The hash-bound calls themselves require canonical membership; reject unsupported EIP-1898 rather than downgrade.
  const finalBlock = block(await reader.request('eth_getBlockByNumber', [hex(inclusion.blockNumber), false]))
  requireThat(fingerprint(finalBlock) === fingerprint(included), 'REORG_OR_INCONSISTENT_RPC')
  return { block_number: String(inclusion.blockNumber), block_hash: inclusion.blockHash as Hex32, head_number: String(head.number), head_hash: head.hash,
    confirmations: String(head.number - inclusion.blockNumber + 1n), event_log_index: String(inclusion.eventIndex) }
}

export async function verifyAndConfirm(db: DatabaseSync, cfg: CallbackApproval, reader: ConfirmationReader, deadlineMs = 12000) {
  requireThat(cfg.allow_confirmed_return === true && typeof cfg.confirmation_approval_id === 'string'
    && /^[A-Za-z0-9_-]{8,100}$/.test(cfg.confirmation_approval_id), 'CONFIRMATION_NOT_AUTHORIZED')
  const minimum = cfg.minimum_confirmations ?? 12
  requireThat(Number.isSafeInteger(minimum) && minimum >= 12 && minimum <= 100000 && deadlineMs > 0 && deadlineMs <= 12000, 'INVALID_CONFIRMATION_POLICY')
  requireThat(cfg.target.chainId === '84532' && (cfg.mode === 'SYNTHETIC_TEST_ONLY' || Object.entries(APPROVED_TARGET).every(([k, v]) => cfg.target[k as keyof typeof APPROVED_TARGET] === v)), 'UNAPPROVED_CONFIRMATION_TARGET')
  durable(db)
  const epochs = new EpochService(db), initial = epochs.get(cfg.epoch.epochId), membersDigest = confirmationMembersDigest(db, initial.epoch_id)
  requireThat(['SUBMITTED', 'CONFIRMED'].includes(initial.status) && initial.signed_tx && initial.tx_hash && initial.nonce !== null, 'NO_SUBMITTED_TRANSACTION')
  await verifyApprovedEpoch(db, cfg)
  requireThat(canonicalize(epochs.get(initial.epoch_id)) === canonicalize(initial) && confirmationMembersDigest(db, initial.epoch_id) === membersDigest, 'F_SNAPSHOT_CHANGED')
  if (initial.status === 'CONFIRMED' && hasConfirmationTable(db)) {
    // Commit suspension BEFORE RPC I/O. A crash, timeout or later DB error cannot leave stale release enabled.
    db.prepare('UPDATE epoch_confirmation_evidence SET release_valid=0,invalidated_reason=? WHERE epoch_id=? AND binding_json=?')
      .run('REVALIDATION_PENDING_OR_FAILED', initial.epoch_id, confirmationBinding(initial, cfg.target.publisher))
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const evidence = await Promise.race([collect(reader, initial, cfg, minimum), new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new CallbackError('CONFIRMATION_TIMEOUT')), deadlineMs)
    })])
    const confirmed = epochs.markConfirmed({ epochId: initial.epoch_id, blockNumber: evidence.block_number, blockHash: evidence.block_hash }, (before, after) => {
      requireThat(canonicalize(before) === canonicalize(initial) && confirmationMembersDigest(db, before.epoch_id) === membersDigest, 'F_SNAPSHOT_CHANGED')
      durable(db)
      db.exec(CONFIRMATION_TABLE)
      const binding = confirmationBinding(after, cfg.target.publisher), digest = confirmationDigest(binding)
      const existing = db.prepare('SELECT binding_json,binding_hash FROM epoch_confirmation_evidence WHERE epoch_id=?').get(after.epoch_id) as { binding_json: string; binding_hash: string } | undefined
      requireThat(!existing || (existing.binding_json === binding && existing.binding_hash === digest), 'CONFLICTING_CONFIRMATION_RETRY')
      db.prepare(`INSERT INTO epoch_confirmation_evidence (epoch_id,binding_json,binding_hash,evidence_json,verified_at,release_valid)
        VALUES (?,?,?,?,?,1) ON CONFLICT(epoch_id) DO UPDATE SET evidence_json=excluded.evidence_json,
        verified_at=excluded.verified_at,release_valid=1,invalidated_reason=NULL`).run(after.epoch_id, binding, digest,
        canonicalize({ verifier: 'w4-rpc-confirmation/1', minimum_confirmations: minimum, members_sha256: membersDigest, ...evidence }), new Date().toISOString())
    })
    return { epoch_id: confirmed.epoch_id, status: confirmed.status, tx_hash: confirmed.tx_hash,
      block_number: confirmed.block_number, block_hash: confirmed.block_hash, confirmations: evidence.confirmations, minimum_confirmations: minimum }
  } finally { clearTimeout(timer) }
}

/** Strict, bounded read-only RPC transport. The endpoint is taken only from host-owned config. */
export function confirmationReader(endpoint: string): ConfirmationReader {
  const url = new URL(endpoint)
  requireThat(url.protocol === 'https:' || (url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)), 'TRUSTED_RPC_REQUIRED')
  let id = 0
  const expiresAt = Date.now() + 12000
  return { async request(method, params) {
    const remaining = expiresAt - Date.now()
    requireThat(remaining > 0, 'CONFIRMATION_TIMEOUT')
    const current = ++id
    const response = await fetch(url, { method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: current, method, params }), signal: AbortSignal.timeout(Math.min(3000, remaining)) })
    requireThat(response.ok && response.body, 'RPC_READ_FAILED')
    const chunks: Uint8Array[] = []; let length = 0
    for await (const chunk of response.body) { length += chunk.length; if (length > 2 * 1024 * 1024) { await response.body.cancel().catch(() => {}); throw new CallbackError('RPC_RESPONSE_TOO_LARGE') }; chunks.push(chunk) }
    const body = record(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))))
    requireThat(body.jsonrpc === '2.0' && body.id === current && !body.error && Object.hasOwn(body, 'result'), 'RPC_READ_FAILED')
    return body.result
  } }
}
