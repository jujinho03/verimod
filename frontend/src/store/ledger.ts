import { freezeEpoch, type EpochMember } from '../domain/epoch'
import { domainHash, hexToBytes, utf8, type Hex32 } from '../domain/hash'
import { ISSUER_ID, issuerCommitment } from '../domain/receipt'
import { PROTOCOL_VERSION_NUMBER, type AnchorLocator, type InclusionProof } from '../domain/types'
import {
  REQUIRED_CONFIRMATIONS,
  RpcUnavailableError,
  type EpochRecord,
  type LedgerReader,
  type TrustConfig,
} from '../domain/verify'

/**
 * 브라우저 안에서 도는 시뮬레이션 원장. 실제 블록체인 네트워크·트랜잭션이 아니다.
 * chain_id는 Hardhat 로컬 체인 형식을 빌렸고, 주소·tx hash는 합성 값이다.
 */
export const SIM_CHAIN = {
  name: '시뮬레이션 원장',
  chain_id: '31337',
  contract_address: '0x0000000000000000000000000000000000000451',
  publisher: '0x000000000000000000000000000000000000a451',
} as const

export const BLOCK_MS = 1000
export const BATCH_WINDOW_MS = 6000
export const SUBMIT_DELAY_MS = 1500
export const MINE_DELAY_MS = 3000
const GENESIS_MS = Date.UTC(2026, 7, 1)

export function blockAt(ms: number): number {
  return Math.max(0, Math.floor((ms - GENESIS_MS) / BLOCK_MS))
}

export interface StoredEpochMember extends EpochMember {
  mine: boolean
}

export interface StoredEpoch {
  record: EpochRecord
  frozen_at: number
  tx_hash: Hex32
  block_hash: Hex32
  members: StoredEpochMember[]
}

export type AnchorStage = 'ISSUED' | 'BATCHED' | 'SUBMITTED' | 'CONFIRMING' | 'ANCHORED'

export interface AnchorStatus {
  stage: AnchorStage
  confirmations: number
}

export function anchorStatus(epoch: StoredEpoch | null, now: number): AnchorStatus {
  if (!epoch) return { stage: 'ISSUED', confirmations: 0 }
  if (now < epoch.frozen_at + SUBMIT_DELAY_MS) return { stage: 'BATCHED', confirmations: 0 }
  const block = blockAt(now)
  if (block < epoch.record.anchored_block) return { stage: 'SUBMITTED', confirmations: 0 }
  const confirmations = block - epoch.record.anchored_block + 1
  return { stage: confirmations >= REQUIRED_CONFIRMATIONS ? 'ANCHORED' : 'CONFIRMING', confirmations }
}

let trust: Promise<TrustConfig> | null = null

export function trustConfig(): Promise<TrustConfig> {
  trust ??= issuerCommitment(ISSUER_ID).then((commitment) => ({
    chain_id: SIM_CHAIN.chain_id,
    contract_address: SIM_CHAIN.contract_address,
    issuer_id: ISSUER_ID,
    issuer_commitment: commitment,
    publisher: SIM_CHAIN.publisher,
    protocol_version: PROTOCOL_VERSION_NUMBER,
  }))
  return trust
}

export function createLedgerReader(
  epochs: () => readonly StoredEpoch[],
  rpcDown: () => boolean,
  now: () => number,
): LedgerReader {
  const guard = () => {
    if (rpcDown()) throw new RpcUnavailableError('시뮬레이션 RPC가 응답하지 않습니다')
  }
  return {
    async getEpoch(contractAddress, epochId) {
      guard()
      if (contractAddress !== SIM_CHAIN.contract_address) return null
      const found = epochs().find((e) => e.record.epoch_id === epochId)
      return found && blockAt(now()) >= found.record.anchored_block ? found.record : null
    },
    async blockNumber() {
      guard()
      return blockAt(now())
    },
  }
}

export function locatorOf(epoch: StoredEpoch): AnchorLocator {
  return {
    chain_id: SIM_CHAIN.chain_id,
    contract_address: SIM_CHAIN.contract_address,
    epoch_id: epoch.record.epoch_id,
    tx_hash: epoch.tx_hash,
    block_number: String(epoch.record.anchored_block),
    block_hash: epoch.block_hash,
  }
}

/** 내 영수증과 같은 epoch에 묶인 다른 영수증(합성)을 함께 동결하고 원장 기록을 만든다. */
export async function sealEpoch(
  epochId: string,
  mine: readonly EpochMember[],
  others: readonly EpochMember[],
  frozenAt: number,
): Promise<{ epoch: StoredEpoch; proofs: Record<Hex32, InclusionProof> }> {
  const frozen = await freezeEpoch([...mine, ...others])
  const { issuer_commitment } = await trustConfig()
  const anchoredBlock = blockAt(frozenAt + MINE_DELAY_MS)
  const mineHashes = new Set(mine.map((m) => m.receipt_hash))
  return {
    epoch: {
      record: {
        epoch_id: epochId,
        root: frozen.root,
        receipt_count: frozen.members.length,
        protocol_version: PROTOCOL_VERSION_NUMBER,
        publisher: SIM_CHAIN.publisher,
        issuer_commitment,
        anchored_block: anchoredBlock,
      },
      frozen_at: frozenAt,
      tx_hash: await domainHash('verimod:simulated-tx:v1', utf8(epochId), hexToBytes(frozen.root)),
      block_hash: await domainHash('verimod:simulated-block:v1', utf8(String(anchoredBlock))),
      members: frozen.members.map((m) => ({ ...m, mine: mineHashes.has(m.receipt_hash) })),
    },
    proofs: frozen.proofs,
  }
}
