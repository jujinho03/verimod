import { Transaction } from 'ethers'
import type { DatabaseSync } from 'node:sqlite'
import { CallbackError, type CallbackApproval, verifyApprovedEpoch } from './durabilityCallback.js'
import { EpochService } from './epochs.js'

export interface SubmissionReader {
  getNetwork(): Promise<{ chainId: bigint }>
  getTransaction(hash: string): Promise<null | {
    hash: string; from: string; to: string | null; chainId: bigint; nonce: number; data: string; value: bigint
  }>
}

/** Narrow read-only JSON-RPC surface with bounded requests and no provider background logging. */
export function submissionReader(endpoint: string): SubmissionReader {
  const url = new URL(endpoint)
  if (!(url.protocol === 'https:' || (url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)))) throw new CallbackError('TRUSTED_RPC_REQUIRED')
  let sequence = 0
  const rpc = async (method: string, params: string[]) => {
    const id = ++sequence
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params }), signal: AbortSignal.timeout(3000) })
    const body = await response.json() as any
    if (!response.ok || body.jsonrpc !== '2.0' || body.id !== id || body.error || !Object.hasOwn(body, 'result')) throw new CallbackError('RPC_READ_FAILED')
    return body.result
  }
  return {
    getNetwork: async () => ({ chainId: BigInt(await rpc('eth_chainId', [])) }),
    getTransaction: async hash => {
      const tx = await rpc('eth_getTransactionByHash', [hash])
      if (tx === null) return null
      if (!tx || typeof tx.hash !== 'string' || typeof tx.from !== 'string' || typeof tx.to !== 'string'
        || typeof tx.input !== 'string' || typeof tx.chainId !== 'string' || typeof tx.nonce !== 'string' || typeof tx.value !== 'string') throw new CallbackError('RPC_READ_FAILED')
      const nonce = Number(BigInt(tx.nonce))
      if (!Number.isSafeInteger(nonce) || nonce < 0) throw new CallbackError('RPC_READ_FAILED')
      return { hash: tx.hash, from: tx.from, to: tx.to, chainId: BigInt(tx.chainId), nonce, data: tx.input, value: BigInt(tx.value) }
    },
  }
}
/** Only a host-configured trusted read-only RPC reader may supply acceptance evidence. No signing/broadcast. */
export async function reconcileSubmitted(database: DatabaseSync, cfg: CallbackApproval, reader: SubmissionReader) {
  if (cfg.allow_submitted_return !== true) throw new CallbackError('SUBMITTED_RETURN_NOT_AUTHORIZED')
  const epoch = await verifyApprovedEpoch(database, cfg)
  if (!['SUBMITTING', 'SUBMITTED'].includes(epoch.status) || !epoch.signed_tx || !epoch.tx_hash) throw new CallbackError('NO_DURABLE_SUBMISSION')
  const tx = Transaction.from(epoch.signed_tx)
  const network = await reader.getNetwork(), observed = await reader.getTransaction(epoch.tx_hash)
  if (network.chainId !== BigInt(cfg.target.chainId) || !observed || observed.hash !== epoch.tx_hash || tx.hash !== epoch.tx_hash
    || observed.chainId !== tx.chainId || observed.from.toLowerCase() !== cfg.target.publisher
    || observed.to?.toLowerCase() !== cfg.target.contractAddress || observed.nonce !== tx.nonce || String(tx.nonce) !== epoch.nonce
    || observed.data.toLowerCase() !== tx.data.toLowerCase() || observed.value !== tx.value
    || epoch.chain_id !== cfg.target.chainId || epoch.contract_address !== cfg.target.contractAddress) throw new CallbackError('UNVERIFIED_SUBMISSION_RETURN')
  const stored = new EpochService(database).markSubmitted(epoch.epoch_id)
  return { epoch_id: stored.epoch_id, status: stored.status, tx_hash: stored.tx_hash }
}
