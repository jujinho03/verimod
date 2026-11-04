import { Contract, Interface, JsonRpcProvider, Transaction } from 'ethers'
import { timingSafeEqual } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { EpochSenderHandoff, type SenderTarget } from './senderHandoff.js'
import { EpochService } from './epochs.js'

const ADDRESS = /^0x[0-9a-f]{40}$/
export interface AutoAnchorConfig { enabled: boolean; token: string; target: SenderTarget; cooldownMs: number }

export function autoAnchorConfig(env = process.env): AutoAnchorConfig | null {
  if (env.VERIMOD_AUTO_ANCHOR !== 'true') return null
  const token = env.VERIMOD_AUTO_ANCHOR_TOKEN?.trim() ?? ''
  const contractAddress = env.VERIMOD_AUTO_ANCHOR_CONTRACT?.trim().toLowerCase() ?? ''
  const publisher = env.VERIMOD_AUTO_ANCHOR_PUBLISHER?.trim().toLowerCase() ?? ''
  const cooldownMs = Number(env.VERIMOD_AUTO_ANCHOR_COOLDOWN_MS ?? 30_000)
  if (token.length < 24 || !ADDRESS.test(contractAddress) || !ADDRESS.test(publisher) || !Number.isSafeInteger(cooldownMs) || cooldownMs < 0) {
    throw new Error('invalid auto anchor configuration')
  }
  return { enabled: true, token, target: { chainId: '84532', contractAddress, publisher }, cooldownMs }
}

export function workerAuthorized(value: string | undefined, cfg: AutoAnchorConfig | null): boolean {
  return !!cfg && typeof value === 'string' && value.length === cfg.token.length && timingSafeEqual(Buffer.from(value), Buffer.from(cfg.token))
}

/** Returns the one durable signing job; raw signed bytes never leave this module after acknowledgement. */
export function nextSigningJob(db: DatabaseSync) {
  const row = db.prepare("SELECT * FROM epochs WHERE status IN ('FROZEN','SUBMITTING') ORDER BY CAST(epoch_id AS INTEGER) LIMIT 1").get() as ReturnType<EpochService['get']> | undefined
  if (!row) return null
  if (row.status === 'SUBMITTING') return { epoch_id: row.epoch_id, status: row.status, tx_hash: row.tx_hash, nonce: row.nonce, raw_transaction: row.signed_tx, merkle_root: row.merkle_root, receipt_count: row.receipt_count, protocol_version: row.protocol_version }
  return { epoch_id: row.epoch_id, status: row.status, merkle_root: row.merkle_root, receipt_count: row.receipt_count, protocol_version: row.protocol_version }
}

export function acceptSignedTransaction(db: DatabaseSync, cfg: AutoAnchorConfig, epochId: string, rawTransaction: string) {
  return new EpochSenderHandoff(db, cfg.target).persistBeforeBroadcast({ epochId, rawTransaction })
}

export function markBroadcast(db: DatabaseSync, epochId: string, txHash: string) {
  const epoch = new EpochService(db).get(epochId)
  if (epoch.status !== 'SUBMITTING' || epoch.tx_hash !== txHash || !epoch.signed_tx) throw new Error('broadcast does not match durable transaction')
  const decoded = Transaction.from(epoch.signed_tx)
  if (decoded.hash !== txHash) throw new Error('durable transaction hash mismatch')
  return new EpochService(db).markSubmitted(epochId)
}

export const REGISTER_EPOCH_INTERFACE = new Interface(['function registerEpoch(uint64 epochId, bytes32 root, uint32 count, uint16 protocolVersion)'])

export class AutoAnchorBatcher {
  private running = false
  constructor(private readonly db: DatabaseSync, private readonly cfg: AutoAnchorConfig, private readonly provider: JsonRpcProvider) {}
  async tick(): Promise<string | null> {
    if (this.running) return null
    this.running = true
    try {
      const pending = this.db.prepare(`SELECT COUNT(*) AS n FROM receipts r LEFT JOIN epoch_members m ON m.receipt_hash=r.receipt_hash WHERE m.receipt_hash IS NULL`).get() as { n: number }
      if (!pending.n || this.db.prepare("SELECT 1 FROM epochs WHERE status IN ('FROZEN','SUBMITTING','SUBMITTED') LIMIT 1").get()) return null
      const previous = this.db.prepare('SELECT created_at FROM epochs ORDER BY created_at DESC LIMIT 1').get() as { created_at: string } | undefined
      if (previous && Date.now() - Date.parse(previous.created_at) < this.cfg.cooldownMs) return null
      if (BigInt(await this.provider.send('eth_chainId', [])) !== 84532n) throw new Error('wrong auto anchor chain')
      const publisher = new Contract(this.cfg.target.contractAddress, ['function publisher() view returns(address)', 'function epochs(uint64) view returns(bytes32 root,uint32 count,uint16 protocolVersion)'], this.provider)
      if (String(await publisher.publisher()).toLowerCase() !== this.cfg.target.publisher) throw new Error('wrong auto anchor publisher')
      const rows = this.db.prepare('SELECT epoch_id FROM epochs').all() as { epoch_id: string }[]
      let next = rows.reduce((max, row) => BigInt(row.epoch_id) > max ? BigInt(row.epoch_id) : max, 0n) + 1n
      while ((await publisher.epochs(next)).count !== 0n) {
        if (next === 18_446_744_073_709_551_615n) throw new Error('epoch id space exhausted')
        next += 1n
      }
      const nextId = String(next)
      const frozen = await new EpochService(this.db).freeze({ principal: 'auto-anchor', idempotencyKey: `auto-${nextId}`, epochId: nextId })
      return frozen.epoch.epoch_id
    } finally { this.running = false }
  }
}
