import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Interface, JsonRpcProvider, Transaction, Wallet } from 'ethers'

const api = process.env.VERIMOD_BACKEND_URL ?? 'http://127.0.0.1:3001'
const token = process.env.VERIMOD_AUTO_ANCHOR_TOKEN ?? ''
const key = process.env.VERIMOD_DEPLOYER_PRIVATE_KEY ?? ''
const rpc = process.env.VERIMOD_BASE_SEPOLIA_RPC_URL ?? ''
const contract = process.env.VERIMOD_AUTO_ANCHOR_CONTRACT?.toLowerCase() ?? ''
const journal = resolve(process.env.VERIMOD_WORKER_JOURNAL ?? './private-data/signer-worker.journal.jsonl')
const failpoint = process.env.VERIMOD_WORKER_FAILPOINT ?? ''
function stopAt(point: string) { if (failpoint === point) { safeJournal({ phase: `INJECTED_${point}` }); process.exit(77) } }
if (!token || !key || !rpc || !/^0x[0-9a-f]{40}$/.test(contract)) throw new Error('missing signer worker configuration')
const provider = new JsonRpcProvider(rpc, 84532, { staticNetwork: true })
const wallet = new Wallet(key, provider)
if (wallet.address.toLowerCase() !== process.env.VERIMOD_AUTO_ANCHOR_PUBLISHER?.toLowerCase()) throw new Error('worker key does not match approved publisher')
if (BigInt(await provider.send('eth_chainId', [])) !== 84532n) throw new Error('wrong worker RPC chain')
const iface = new Interface(['function registerEpoch(uint64 epochId, bytes32 root, uint32 count, uint16 protocolVersion)', 'function epochs(uint64) view returns (bytes32 root,uint32 count,uint16 protocolVersion)'])
mkdirSync(dirname(journal), { recursive: true })
const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' }
const preflightFailures = new Map<string, number>()
if (existsSync(journal)) for (const line of readFileSync(journal, 'utf8').split('\n')) {
  if (!line) continue
  try {
    const entry = JSON.parse(line) as { epoch_id?: string; phase?: string; attempts?: number }
    if (entry.epoch_id && entry.phase === 'PREFLIGHT_RPC_ERROR' && Number.isSafeInteger(entry.attempts)) preflightFailures.set(entry.epoch_id, entry.attempts!)
    if (entry.epoch_id && entry.phase === 'PREFLIGHT_OK') preflightFailures.delete(entry.epoch_id)
  } catch { /* A truncated final journal line is ignored. */ }
}
function safeJournal(value: object) { appendFileSync(journal, `${JSON.stringify({ at: new Date().toISOString(), ...value })}\n`, { encoding: 'utf8' }) }
async function call(path: string, method = 'GET', body?: object) {
  const response = await fetch(`${api}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(12_000) })
  if (!response.ok) throw new Error(`backend ${response.status}`)
  return (await response.json()).data
}
async function runOnce() {
const job = await call('/api/auto-anchor/next')
if (!job) return
const existing = await provider.call({ to: contract, data: iface.encodeFunctionData('epochs', [job.epoch_id]) })
const state = iface.decodeFunctionResult('epochs', existing)
if (job.status === 'SUBMITTING') {
  if (!job.raw_transaction || Transaction.from(job.raw_transaction).hash !== job.tx_hash) throw new Error('invalid durable recovery bytes')
  const receipt = await provider.getTransactionReceipt(job.tx_hash)
  if (receipt?.status === 0) {
    await call('/api/auto-anchor/failed', 'POST', { epochId: job.epoch_id, reason: 'REVERTED' })
    safeJournal({ epoch_id: job.epoch_id, phase: 'FAILED_REVERTED', tx_hash: job.tx_hash })
    return
  }
  if (receipt || (state.root?.toLowerCase() === job.merkle_root && state.count === BigInt(job.receipt_count) && state.protocolVersion === BigInt(job.protocol_version))) {
    await call('/api/auto-anchor/broadcast', 'POST', { epochId: job.epoch_id, txHash: job.tx_hash })
    safeJournal({ epoch_id: job.epoch_id, phase: 'RECOVERED_SUBMITTED', tx_hash: job.tx_hash })
    return
  }
  if (state.count !== 0n) {
    await call('/api/auto-anchor/failed', 'POST', { epochId: job.epoch_id, reason: 'ROOT_CONFLICT' })
    safeJournal({ epoch_id: job.epoch_id, phase: 'FAILED_ROOT_CONFLICT' })
    return
  }
  await provider.broadcastTransaction(job.raw_transaction)
  await call('/api/auto-anchor/broadcast', 'POST', { epochId: job.epoch_id, txHash: job.tx_hash })
  safeJournal({ epoch_id: job.epoch_id, phase: 'REPLAYED_SAME_RAW', tx_hash: job.tx_hash })
  return
}
if (state.count !== 0n) {
  if (state.root?.toLowerCase() !== job.merkle_root || state.count !== BigInt(job.receipt_count) || state.protocolVersion !== BigInt(job.protocol_version)) {
    await call('/api/auto-anchor/failed', 'POST', { epochId: job.epoch_id, reason: 'ROOT_CONFLICT' })
    safeJournal({ epoch_id: job.epoch_id, phase: 'FAILED_ROOT_CONFLICT' })
  } else safeJournal({ epoch_id: job.epoch_id, phase: 'ONCHAIN_MATCH_WITHOUT_TX_HASH' })
  return
}
let nonce: number
let fee: Awaited<ReturnType<typeof provider.getFeeData>>
let balance: bigint
try {
  nonce = await wallet.getNonce('pending')
  fee = await provider.getFeeData()
  balance = await provider.getBalance(wallet.address)
  preflightFailures.delete(job.epoch_id)
  safeJournal({ epoch_id: job.epoch_id, phase: 'PREFLIGHT_OK' })
} catch {
  const attempts = (preflightFailures.get(job.epoch_id) ?? 0) + 1
  preflightFailures.set(job.epoch_id, attempts)
  safeJournal({ epoch_id: job.epoch_id, phase: 'PREFLIGHT_RPC_ERROR', attempts })
  if (attempts >= 10) {
    await call('/api/auto-anchor/failed', 'POST', { epochId: job.epoch_id, reason: 'MAX_RETRY' })
    safeJournal({ epoch_id: job.epoch_id, phase: 'FAILED_MAX_RETRY' })
  }
  return
}
if (balance < (fee.maxFeePerGas ?? 0n) * 180000n) {
  await call('/api/auto-anchor/failed', 'POST', { epochId: job.epoch_id, reason: 'INSUFFICIENT_FUNDS' })
  safeJournal({ epoch_id: job.epoch_id, phase: 'FAILED_INSUFFICIENT_FUNDS' })
  return
}
const raw = await wallet.signTransaction({ type: 2, chainId: 84532, to: contract, data: iface.encodeFunctionData('registerEpoch', [job.epoch_id, job.merkle_root, job.receipt_count, job.protocol_version]), nonce, value: 0n, gasLimit: 180000n, maxFeePerGas: fee.maxFeePerGas ?? undefined, maxPriorityFeePerGas: fee.maxPriorityFeePerGas ?? undefined })
stopAt('BEFORE_ACK')
const ack = await call('/api/auto-anchor/signed', 'POST', { epochId: job.epoch_id, rawTransaction: raw })
stopAt('AFTER_ACK')
stopAt('RPC_TIMEOUT_AFTER_ACK')
// Do not journal raw bytes. The durable backend row is the recovery source of truth.
const sent = await provider.broadcastTransaction(raw)
stopAt('AFTER_BROADCAST')
stopAt('RPC_TIMEOUT_AFTER_BROADCAST')
await call('/api/auto-anchor/broadcast', 'POST', { epochId: job.epoch_id, txHash: sent.hash })
safeJournal({ epoch_id: job.epoch_id, phase: 'BROADCAST', tx_hash: sent.hash, nonce: String(nonce), durable_ack: ack.tx_hash })
}

let busy = false
setInterval(() => {
  if (busy) return
  busy = true
  void runOnce().catch(() => { /* Keep the durable state for the next recovery poll. */ }).finally(() => { busy = false })
}, 5000)
await runOnce()
