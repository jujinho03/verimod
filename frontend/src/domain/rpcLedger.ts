import type { AnchorLocator } from './types'
import { isHex32, type Hex32 } from './hash'
import type { ApprovedProfile } from './approvedProfiles'
import { RpcUnavailableError, UntrustedAnchorError, type EpochRecord, type LedgerReader } from './verify'

const PUBLISHER_SELECTOR = '0x8c72c54e'
const EPOCHS_SELECTOR = '0x4bd2d7f9'
const EPOCH_REGISTERED_TOPIC = '0x71ec63fe81bedeb984bf4a9033c8cb5d207929603415afbf0a88e1322887a6c4'
const quantity = (value: string): number => {
  if (!/^0x[0-9a-f]+$/i.test(value)) throw new RpcUnavailableError('invalid RPC quantity')
  const n = Number(BigInt(value))
  if (!Number.isSafeInteger(n) || n < 0) throw new RpcUnavailableError('unsafe RPC quantity')
  return n
}
const word = (hex: string, index: number): string => `0x${hex.slice(2 + index * 64, 2 + (index + 1) * 64)}`
const address = (value: string): string => {
  if (!/^0x[0-9a-f]{40}$/i.test(value)) throw new RpcUnavailableError('invalid EVM address')
  return value.toLowerCase()
}

/** Minimal browser JSON-RPC reader. It trusts only its selected built-in profile, never bundle metadata. */
export class RpcLedgerReader implements LedgerReader {
  private readonly registrationBlocks = new Map<string, number>()
  private readonly profile: ApprovedProfile
  private readonly rpcUrl: string
  constructor(profile: ApprovedProfile, rpcUrl: string) {
    this.profile = profile
    this.rpcUrl = rpcUrl
  }

  private async call<T>(method: string, params: unknown[]): Promise<T> {
    let response: Response
    try {
      response = await fetch(this.rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) })
    } catch { throw new RpcUnavailableError('RPC transport failure') }
    if (!response.ok) throw new RpcUnavailableError('RPC HTTP failure')
    const body: unknown = await response.json()
    if (!body || typeof body !== 'object' || (body as { jsonrpc?: unknown }).jsonrpc !== '2.0' || 'error' in body) throw new RpcUnavailableError('RPC error')
    return (body as { result: T }).result
  }

  async getEpoch(contractAddress: string, epochId: string): Promise<EpochRecord | null> {
    if (address(contractAddress) !== this.profile.contract_address) throw new UntrustedAnchorError('승인 profile과 다른 contract입니다')
    if (!/^[1-9]\d*$/.test(epochId)) throw new RpcUnavailableError('invalid epoch id')
    const callData = `${EPOCHS_SELECTOR}${BigInt(epochId).toString(16).padStart(64, '0')}`
    const result = await this.call<string>('eth_call', [{ to: this.profile.contract_address, data: callData }, 'latest'])
    if (!/^0x[0-9a-f]{192}$/i.test(result)) throw new RpcUnavailableError('invalid epochs result')
    const root = word(result, 0).toLowerCase() as Hex32
    const count = quantity(word(result, 1))
    const protocolVersion = quantity(word(result, 2))
    if (!isHex32(root) || root === `0x${'0'.repeat(64)}` || count === 0) return null
    return { epoch_id: epochId, root, receipt_count: count, protocol_version: protocolVersion, publisher: this.profile.publisher, issuer_seq_min: null, issuer_seq_max: null, anchored_block: this.registrationBlocks.get(epochId) ?? -1 }
  }

  async blockNumber(): Promise<number> { return quantity(await this.call<string>('eth_blockNumber', [])) }

  async validateAnchor(anchor: AnchorLocator): Promise<void> {
    const chainId = quantity(await this.call<string>('eth_chainId', []))
    if (String(chainId) !== this.profile.chain_id) throw new UntrustedAnchorError('RPC가 승인 profile과 다른 chain을 반환했습니다')
    const publisher = await this.call<string>('eth_call', [{ to: this.profile.contract_address, data: PUBLISHER_SELECTOR }, 'latest'])
    if (!/^0x[0-9a-f]{64}$/i.test(publisher) || address(`0x${publisher.slice(-40)}`) !== this.profile.publisher) throw new UntrustedAnchorError('contract publisher()가 승인 profile과 다릅니다')
    const receipt = await this.call<{ status?: string, to?: string | null, blockNumber?: string, logs?: Array<{ address?: string, topics?: string[], data?: string }> } | null>('eth_getTransactionReceipt', [anchor.tx_hash])
    if (!receipt || receipt.status !== '0x1' || address(receipt.to ?? '') !== this.profile.contract_address || !receipt.blockNumber) throw new UntrustedAnchorError('등록 tx가 성공한 trusted contract transaction이 아닙니다')
    const topicEpoch = `0x${BigInt(anchor.epoch_id).toString(16).padStart(64, '0')}`
    const event = receipt.logs?.find((log) => address(log.address ?? '') === this.profile.contract_address && log.topics?.[0]?.toLowerCase() === EPOCH_REGISTERED_TOPIC && log.topics?.[1]?.toLowerCase() === topicEpoch && typeof log.data === 'string' && /^0x[0-9a-f]{192}$/i.test(log.data))
    if (!event) throw new UntrustedAnchorError('EpochRegistered event를 찾지 못했습니다')
    const epoch = await this.getEpoch(this.profile.contract_address, anchor.epoch_id)
    const data = event.data as string
    if (!epoch || word(data, 0).toLowerCase() !== epoch.root || quantity(word(data, 1)) !== epoch.receipt_count || quantity(word(data, 2)) !== epoch.protocol_version) throw new UntrustedAnchorError('event와 epochs getter가 일치하지 않습니다')
    const block = quantity(receipt.blockNumber)
    if (anchor.block_number !== String(block)) throw new UntrustedAnchorError('bundle block_number가 실제 receipt와 다릅니다')
    this.registrationBlocks.set(anchor.epoch_id, block)
  }
}
