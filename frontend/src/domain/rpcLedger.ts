import type { Hex32 } from './hash'
import { ISSUER_ID } from './receipt'
import {
  RpcUnavailableError,
  UntrustedLedgerError,
  type EpochRecord,
  type LedgerReader,
  type TrustConfig,
} from './verify'

const ADDRESS = /^0x[0-9a-f]{40}$/
const HEX_QUANTITY = /^0x(?:0|[1-9a-f][0-9a-f]*)$/
const HEX_DATA = /^0x[0-9a-f]*$/
const EPOCHS_SELECTOR = '0x4bd2d7f9'
const PUBLISHER_SELECTOR = '0x8c72c54e'
const EPOCH_REGISTERED_TOPIC = '0x71ec63fe81bedeb984bf4a9033c8cb5d207929603415afbf0a88e1322887a6c4'
/** Public Base Sepolia RPCs reject wide eth_getLogs ranges (publicnode caps 50,000 blocks). */
export const LOG_RANGE_BLOCKS = 10_000

export interface ApprovedTrustProfile extends TrustConfig {
  profile_id: 'BASE_SEPOLIA_DEMO'
  chain_id: '84532'
  issuer_id: typeof ISSUER_ID
  rpc_urls: readonly string[]
  deployment_block: number
  min_confirmations: number
}

type Env = Record<string, unknown>

/** T가 승인한 실제 값이 모두 주입된 경우에만 Base profile을 활성화한다. */
export function baseSepoliaProfileFromEnv(env: Env): ApprovedTrustProfile | null {
  const contract = String(env.VITE_BASE_SEPOLIA_CONTRACT_ADDRESS ?? '').toLowerCase()
  const publisher = String(env.VITE_BASE_SEPOLIA_PUBLISHER ?? '').toLowerCase()
  const rpcUrls = String(env.VITE_BASE_SEPOLIA_RPC_URLS ?? '').split(',').map((value) => value.trim()).filter(Boolean)
  const deploymentBlock = Number(env.VITE_BASE_SEPOLIA_DEPLOYMENT_BLOCK)
  const confirmations = Number(env.VITE_BASE_SEPOLIA_MIN_CONFIRMATIONS)
  if (!ADDRESS.test(contract) || !ADDRESS.test(publisher) || rpcUrls.length === 0 ||
    rpcUrls.some((url) => !/^https:\/\//.test(url)) || !Number.isSafeInteger(deploymentBlock) || deploymentBlock < 0 ||
    !Number.isSafeInteger(confirmations) || confirmations < 1) return null
  return {
    profile_id: 'BASE_SEPOLIA_DEMO', chain_id: '84532', contract_address: contract,
    publisher, issuer_id: ISSUER_ID, protocol_version: 1,
    rpc_urls: rpcUrls, deployment_block: deploymentBlock, min_confirmations: confirmations,
  }
}

function word(value: bigint): string {
  if (value < 0n || value >= 1n << 256n) throw new RpcUnavailableError('ABI word out of range')
  return value.toString(16).padStart(64, '0')
}

function quantity(value: unknown): number {
  if (typeof value !== 'string' || !HEX_QUANTITY.test(value)) throw new RpcUnavailableError('invalid RPC quantity')
  const parsed = Number(BigInt(value))
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new RpcUnavailableError('RPC quantity exceeds browser range')
  return parsed
}

function bytes32(value: string): Hex32 {
  if (!/^0x[0-9a-f]{64}$/.test(value)) throw new RpcUnavailableError('invalid bytes32')
  return value as Hex32
}

function words(data: unknown, count: number): string[] {
  if (typeof data !== 'string' || !HEX_DATA.test(data) || data.length !== 2 + count * 64) throw new RpcUnavailableError('invalid ABI response')
  return Array.from({ length: count }, (_, index) => data.slice(2 + index * 64, 2 + (index + 1) * 64))
}

function addressWord(data: unknown): string {
  const [value] = words(data, 1)
  if (!/^0{24}[0-9a-f]{40}$/.test(value)) throw new RpcUnavailableError('invalid address response')
  return `0x${value.slice(24)}`
}

export function createPublicRpcLedger(profile: ApprovedTrustProfile, fetcher: typeof fetch = fetch): LedgerReader {
  let requestId = 0
  const callUrl = async (url: string, method: string, params: unknown[]) => {
    const response = await fetcher(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method, params }),
    })
    if (!response.ok) throw new RpcUnavailableError(`RPC HTTP ${response.status}`)
    const payload = await response.json() as { result?: unknown; error?: unknown }
    if (payload.error || !Object.hasOwn(payload, 'result')) throw new RpcUnavailableError('RPC error response')
    return payload.result
  }
  const rpc = async (method: string, params: unknown[]) => {
    let untrusted: UntrustedLedgerError | null = null
    for (const url of profile.rpc_urls) {
      try {
        const chain = await callUrl(url, 'eth_chainId', [])
        if (typeof chain !== 'string' || BigInt(chain) !== BigInt(profile.chain_id)) {
          untrusted = new UntrustedLedgerError('RPC chain id mismatch')
          continue
        }
        return await callUrl(url, method, params)
      } catch (error) {
        if (error instanceof UntrustedLedgerError) untrusted = error
      }
    }
    if (untrusted) throw untrusted
    throw new RpcUnavailableError('approved RPC endpoints are unavailable')
  }

  const publisher = async () => {
    const actual = addressWord(await rpc('eth_call', [{ to: profile.contract_address, data: PUBLISHER_SELECTOR }, 'latest']))
    if (actual !== profile.publisher) throw new UntrustedLedgerError('publisher mismatch')
    return actual
  }

  return {
    async getEpoch(contractAddress, epochId): Promise<EpochRecord | null> {
      if (contractAddress !== profile.contract_address || !/^[1-9]\d*$/.test(epochId)) throw new UntrustedLedgerError('unapproved anchor')
      await publisher()
      const epoch = BigInt(epochId)
      if (epoch > 18_446_744_073_709_551_615n) throw new RpcUnavailableError('epoch id exceeds uint64')
      const getter = words(await rpc('eth_call', [{ to: profile.contract_address, data: `${EPOCHS_SELECTOR}${word(epoch)}` }, 'latest']), 3)
      const root = bytes32(`0x${getter[0]}`)
      const count = Number(BigInt(`0x${getter[1]}`))
      const protocolVersion = Number(BigInt(`0x${getter[2]}`))
      if (/^0x0{64}$/.test(root)) return null
      if (!Number.isSafeInteger(count) || count < 1 || count > 0xffffffff || !Number.isSafeInteger(protocolVersion)) {
        throw new RpcUnavailableError('invalid epoch getter')
      }

      const topicEpoch = `0x${word(epoch)}`
      // Scan the whole deployment..head range in bounded windows; every window is still read, so a
      // duplicate event anywhere is detected exactly as with one unbounded request.
      const head = quantity(await rpc('eth_blockNumber', []))
      if (head < profile.deployment_block) throw new RpcUnavailableError('head is below the deployment block')
      const logs: unknown[] = []
      for (let from = profile.deployment_block; from <= head; from += LOG_RANGE_BLOCKS) {
        const to = Math.min(from + LOG_RANGE_BLOCKS - 1, head)
        const part = await rpc('eth_getLogs', [{
          address: profile.contract_address,
          fromBlock: `0x${from.toString(16)}`,
          toBlock: `0x${to.toString(16)}`,
          topics: [EPOCH_REGISTERED_TOPIC, topicEpoch],
        }])
        if (!Array.isArray(part)) throw new RpcUnavailableError('invalid log response')
        logs.push(...part)
      }
      if (logs.length !== 1) throw new RpcUnavailableError('epoch event is missing or ambiguous')
      const log = logs[0] as Record<string, unknown>
      if (log.removed === true) throw new RpcUnavailableError('removed epoch event')
      const event = words(log.data, 3)
      if (`0x${event[0]}` !== root || Number(BigInt(`0x${event[1]}`)) !== count || Number(BigInt(`0x${event[2]}`)) !== protocolVersion) {
        throw new RpcUnavailableError('event/getter mismatch')
      }
      const block = quantity(log.blockNumber)
      const transactionHash = bytes32(String(log.transactionHash))
      const blockHash = bytes32(String(log.blockHash))
      const receipt = await rpc('eth_getTransactionReceipt', [transactionHash]) as Record<string, unknown> | null
      if (!receipt || receipt.status !== '0x1' || String(receipt.to).toLowerCase() !== profile.contract_address ||
        quantity(receipt.blockNumber) !== block || bytes32(String(receipt.blockHash)) !== blockHash) {
        throw new RpcUnavailableError('transaction receipt does not authenticate the event')
      }
      return {
        epoch_id: epochId, root, receipt_count: count, protocol_version: protocolVersion,
        publisher: profile.publisher, issuer_seq_min: null, issuer_seq_max: null, anchored_block: block,
      }
    },
    async blockNumber() {
      return quantity(await rpc('eth_blockNumber', []))
    },
  }
}
