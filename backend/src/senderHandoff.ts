import type { DatabaseSync } from 'node:sqlite'
import { Interface, Transaction } from 'ethers'
import type { Hex32 } from '@verimod/protocol/hash'
import { EpochService, EpochStateError } from './epochs.js'

const registerEpoch = new Interface(['function registerEpoch(uint64 epochId, bytes32 root, uint32 count, uint16 protocolVersion)'])
const ADDRESS = /^0x[0-9a-f]{40}$/

export interface SenderTarget {
  chainId: '84532'
  contractAddress: string
  publisher: string
}

export interface DurableSubmissionAck {
  epoch_id: string
  merkle_root: Hex32
  receipt_count: number
  protocol_version: number
  status: 'SUBMITTING'
  tx_hash: Hex32
  nonce: string
  chain_id: string
  contract_address: string
}

/** T must await this callback on the authoritative F DB before broadcasting the exact bytes.
 * This adapter only decodes, verifies and persists; it has no signer or RPC client.
 */
export class EpochSenderHandoff {
  private readonly epochs: EpochService

  constructor(private readonly database: DatabaseSync, private readonly target: SenderTarget) {
    if (target.chainId !== '84532' || !ADDRESS.test(target.contractAddress) || !ADDRESS.test(target.publisher)) {
      throw new EpochStateError('approved sender target is required')
    }
    this.epochs = new EpochService(database)
  }

  persistBeforeBroadcast(input: { epochId: string; rawTransaction: string }): DurableSubmissionAck {
    const epoch = this.epochs.get(input.epochId)
    if (!['FROZEN', 'SUBMITTING'].includes(epoch.status)) throw new EpochStateError('epoch is not ready for preparation')
    let tx: Transaction
    try { tx = Transaction.from(input.rawTransaction) }
    catch { throw new EpochStateError('invalid signed epoch transaction') }
    if (!tx.isSigned() || !tx.hash || !tx.from || tx.chainId !== BigInt(this.target.chainId)
      || tx.to?.toLowerCase() !== this.target.contractAddress || tx.from.toLowerCase() !== this.target.publisher
      || tx.value !== 0n) throw new EpochStateError('signed transaction does not match the approved target')
    let args: ReturnType<Interface['decodeFunctionData']>
    try { args = registerEpoch.decodeFunctionData('registerEpoch', tx.data) }
    catch { throw new EpochStateError('signed transaction is not registerEpoch') }
    if (args[0] !== BigInt(epoch.epoch_id) || String(args[1]).toLowerCase() !== epoch.merkle_root
      || args[2] !== BigInt(epoch.receipt_count) || args[3] !== BigInt(epoch.protocol_version)
      || registerEpoch.encodeFunctionData('registerEpoch', args).toLowerCase() !== tx.data.toLowerCase()) {
      throw new EpochStateError('signed transaction does not match the frozen epoch')
    }
    const main = (this.database.prepare('PRAGMA database_list').all() as { name: string; file: string }[]).find(row => row.name === 'main')
    const synchronous = this.database.prepare('PRAGMA synchronous').get() as { synchronous: number }
    const journal = this.database.prepare('PRAGMA journal_mode').get() as { journal_mode: string }
    if (!main?.file || synchronous.synchronous < 2 || ['off', 'memory'].includes(journal.journal_mode.toLowerCase())) {
      throw new EpochStateError('pre-broadcast acknowledgement requires durable file-backed SQLite')
    }
    const durable = this.epochs.recordSubmitting({
      epochId: epoch.epoch_id, signedTx: input.rawTransaction, txHash: tx.hash as Hex32,
      nonce: String(tx.nonce), chainId: String(tx.chainId), contractAddress: this.target.contractAddress,
    })
    return {
      epoch_id: durable.epoch_id, merkle_root: durable.merkle_root, receipt_count: durable.receipt_count,
      protocol_version: durable.protocol_version, status: 'SUBMITTING', tx_hash: durable.tx_hash!,
      nonce: durable.nonce!, chain_id: durable.chain_id!, contract_address: durable.contract_address!,
    }
  }
}
