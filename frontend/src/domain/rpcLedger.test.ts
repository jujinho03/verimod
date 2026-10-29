import { describe, expect, it, vi } from 'vitest'
import { ISSUER_ID } from './receipt'
import { baseSepoliaProfileFromEnv, createPublicRpcLedger, LOG_RANGE_BLOCKS, type ApprovedTrustProfile } from './rpcLedger'
import { RpcUnavailableError } from './verify'

const contract = `0x${'a'.repeat(40)}`
const publisher = `0x${'b'.repeat(40)}`
const root = `0x${'c'.repeat(64)}`
const txHash = `0x${'d'.repeat(64)}`
const blockHash = `0x${'e'.repeat(64)}`
const w = (value: bigint) => value.toString(16).padStart(64, '0')

const profile: ApprovedTrustProfile = {
  profile_id: 'BASE_SEPOLIA_DEMO', chain_id: '84532', contract_address: contract,
  publisher, issuer_id: ISSUER_ID, protocol_version: 1,
  rpc_urls: ['https://rpc.example'], deployment_block: 100, min_confirmations: 2,
}

describe('FE-02 approved Base Sepolia RPC reader', () => {
  it('W5 keeps two endpoint failures pending and supplies bounded abort signals', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      expect(init?.signal).toBeInstanceOf(AbortSignal)
      throw new TypeError('synthetic network failure')
    })
    await expect(createPublicRpcLedger({ ...profile, rpc_urls: ['https://primary.example', 'https://backup.example'] }, fetcher).blockNumber())
      .rejects.toBeInstanceOf(RpcUnavailableError)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('loads a profile only when every approved value is present and normalized', () => {
    expect(baseSepoliaProfileFromEnv({})).toBeNull()
    expect(baseSepoliaProfileFromEnv({
      VITE_BASE_SEPOLIA_CONTRACT_ADDRESS: contract,
      VITE_BASE_SEPOLIA_PUBLISHER: publisher,
      VITE_BASE_SEPOLIA_RPC_URLS: 'https://rpc.example',
      VITE_BASE_SEPOLIA_DEPLOYMENT_BLOCK: '100',
      VITE_BASE_SEPOLIA_MIN_CONFIRMATIONS: '2',
    })).toEqual(profile)
  })

  it('checks chain, publisher, getter, event and successful transaction receipt', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as { id: number; method: string; params: Array<Record<string, string>> }
      let result: unknown
      if (request.method === 'eth_chainId') result = '0x14a34'
      else if (request.method === 'eth_call' && request.params[0].data === '0x8c72c54e') result = `0x${'0'.repeat(24)}${publisher.slice(2)}`
      else if (request.method === 'eth_call') result = `${root}${w(3n)}${w(1n)}`
      else if (request.method === 'eth_getLogs') result = [{ data: `${root}${w(3n)}${w(1n)}`, blockNumber: '0x78', blockHash, transactionHash: txHash }]
      else if (request.method === 'eth_getTransactionReceipt') result = { status: '0x1', to: contract, blockNumber: '0x78', blockHash }
      else if (request.method === 'eth_blockNumber') result = '0x7a'
      else throw new Error(`unexpected ${request.method}`)
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: request.id, result }))
    })
    const reader = createPublicRpcLedger(profile, fetcher as unknown as typeof fetch)
    await expect(reader.getEpoch(contract, '1')).resolves.toEqual({
      epoch_id: '1', root, receipt_count: 3, protocol_version: 1, publisher,
      issuer_seq_min: null, issuer_seq_max: null, anchored_block: 120,
    })
    await expect(reader.blockNumber()).resolves.toBe(122)
    // Every logical call re-authenticates the endpoint chain first.
    expect(fetcher.mock.calls.map(([, init]) => JSON.parse(String(init?.body)).method)).toEqual([
      'eth_chainId', 'eth_call',
      'eth_chainId', 'eth_call',
      'eth_chainId', 'eth_blockNumber',
      'eth_chainId', 'eth_getLogs',
      'eth_chainId', 'eth_getTransactionReceipt',
      'eth_chainId', 'eth_blockNumber',
    ])
  })

  const chunkedFetcher = (head: number, logBlocks: number[], ranges: Array<[number, number]>) => (async (_url: string | URL | Request, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body)) as { id: number; method: string; params: Array<Record<string, string>> }
    let result: unknown
    if (request.method === 'eth_chainId') result = '0x14a34'
    else if (request.method === 'eth_call' && request.params[0].data === '0x8c72c54e') result = `0x${'0'.repeat(24)}${publisher.slice(2)}`
    else if (request.method === 'eth_call') result = `${root}${w(3n)}${w(1n)}`
    else if (request.method === 'eth_blockNumber') result = `0x${head.toString(16)}`
    else if (request.method === 'eth_getLogs') {
      const from = Number(request.params[0].fromBlock), to = Number(request.params[0].toBlock)
      ranges.push([from, to])
      result = logBlocks.filter((b) => b >= from && b <= to).map((b) => ({ data: `${root}${w(3n)}${w(1n)}`, blockNumber: `0x${b.toString(16)}`, blockHash, transactionHash: txHash }))
    } else if (request.method === 'eth_getTransactionReceipt') result = { status: '0x1', to: contract, blockNumber: `0x${(logBlocks[0]).toString(16)}`, blockHash }
    else throw new Error(`unexpected ${request.method}`)
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: request.id, result }))
  }) as unknown as typeof fetch

  it('scans deployment..head in bounded log windows and finds the single event', async () => {
    const ranges: Array<[number, number]> = []
    const wide = { ...profile, deployment_block: 0 }
    const reader = createPublicRpcLedger(wide, chunkedFetcher(25_000, [21_000], ranges))
    await expect(reader.getEpoch(contract, '1')).resolves.toMatchObject({ anchored_block: 21_000, root })
    expect(ranges).toEqual([[0, 25_000]])
    expect(ranges.every(([from, to]) => to - from + 1 <= LOG_RANGE_BLOCKS)).toBe(true)
  })

  it('rejects an epoch event duplicated across different windows', async () => {
    const reader = createPublicRpcLedger({ ...profile, deployment_block: 0 }, chunkedFetcher(125_000, [5_000, 105_000], []))
    await expect(reader.getEpoch(contract, '1')).rejects.toThrow('epoch event is missing or ambiguous')
  })

  it('does not cache a failed chain identity check', async () => {
    let chainAttempts = 0
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as { id: number; method: string }
      if (request.method === 'eth_chainId') {
        chainAttempts++
        if (chainAttempts === 1) throw new TypeError('synthetic first-attempt failure')
        return new Response(JSON.stringify({ jsonrpc: '2.0', id: request.id, result: '0x14a34' }))
      }
      if (request.method === 'eth_blockNumber') {
        return new Response(JSON.stringify({ jsonrpc: '2.0', id: request.id, result: '0x7a' }))
      }
      throw new Error('unexpected method')
    }) as unknown as typeof fetch
    const reader = createPublicRpcLedger(profile, fetcher)
    await expect(reader.blockNumber()).rejects.toBeInstanceOf(RpcUnavailableError)
    await expect(reader.blockNumber()).resolves.toBe(122)
    expect(chainAttempts).toBe(2)
  })

  /** Synthetic endpoint whose backend chain can be switched between calls. */
  const switchable = (state: { chain: string; head: number }) => (async (_url: string | URL | Request, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body)) as { id: number; method: string }
    const result = request.method === 'eth_chainId' ? state.chain : `0x${state.head.toString(16)}`
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: request.id, result }))
  }) as unknown as typeof fetch

  it('re-checks chain id after an earlier successful check (chain switch mid-verification)', async () => {
    const state = { chain: '0x14a34', head: 122 }
    const reader = createPublicRpcLedger(profile, switchable(state))
    await expect(reader.blockNumber()).resolves.toBe(122)
    Object.assign(state, { chain: '0x1', head: 9999 })
    await expect(reader.blockNumber()).rejects.toBeInstanceOf(RpcUnavailableError)
  })

  it('re-checks chain id after a plain RPC error', async () => {
    const state = { chain: '0x14a34', head: 122 }
    let failOnce = true
    const base = switchable(state)
    const fetcher = (async (url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as { id: number; method: string }
      if (request.method === 'eth_blockNumber' && failOnce) {
        failOnce = false
        return new Response(JSON.stringify({ jsonrpc: '2.0', id: request.id, error: { code: -32000, message: 'synthetic' } }))
      }
      return base(url, init)
    }) as unknown as typeof fetch
    const reader = createPublicRpcLedger(profile, fetcher)
    await expect(reader.blockNumber()).rejects.toBeInstanceOf(RpcUnavailableError)
    Object.assign(state, { chain: '0x1', head: 9999 })
    await expect(reader.blockNumber()).rejects.toBeInstanceOf(RpcUnavailableError)
  })

  it('re-checks a previously validated backup endpoint after failover', async () => {
    const backup = { chain: '0x14a34', head: 122 }
    const backupFetch = switchable(backup)
    const fetcher = (async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url) === 'https://primary.example') throw new TypeError('synthetic primary outage')
      return backupFetch(url, init)
    }) as unknown as typeof fetch
    const reader = createPublicRpcLedger({ ...profile, rpc_urls: ['https://primary.example', 'https://backup.example'] }, fetcher)
    await expect(reader.blockNumber()).resolves.toBe(122)
    Object.assign(backup, { chain: '0x1', head: 9999 })
    await expect(reader.blockNumber()).rejects.toBeInstanceOf(RpcUnavailableError)
  })

  it('rejects an event served after the endpoint switched chain during the windowed scan', async () => {
    let chain = '0x14a34'
    let logsServed = 0
    const fetcher = (async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as { id: number; method: string; params: Array<Record<string, string>> }
      let result: unknown
      if (request.method === 'eth_chainId') result = chain
      else if (request.method === 'eth_call' && request.params[0].data === '0x8c72c54e') result = `0x${'0'.repeat(24)}${publisher.slice(2)}`
      else if (request.method === 'eth_call') result = `${root}${w(3n)}${w(1n)}`
      else if (request.method === 'eth_blockNumber') result = `0x${(125_000).toString(16)}`
      else if (request.method === 'eth_getLogs') {
        const from = Number(request.params[0].fromBlock), to = Number(request.params[0].toBlock)
        if (++logsServed === 1) chain = '0x1'
        result = chain === '0x1' && from <= 60_000 && 60_000 <= to
          ? [{ data: `${root}${w(3n)}${w(1n)}`, blockNumber: '0xea60', blockHash, transactionHash: txHash }] : []
      } else if (request.method === 'eth_getTransactionReceipt') result = { status: '0x1', to: contract, blockNumber: '0xea60', blockHash }
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: request.id, result }))
    }) as unknown as typeof fetch
    await expect(createPublicRpcLedger({ ...profile, deployment_block: 0 }, fetcher).getEpoch(contract, '1'))
      .rejects.toBeInstanceOf(RpcUnavailableError)
  })

  it('treats a wrong-chain RPC endpoint as unavailable without changing the approved profile', async () => {
    const fetcher = async () => new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x7a69' }))
    await expect(createPublicRpcLedger(profile, fetcher).blockNumber()).rejects.toBeInstanceOf(RpcUnavailableError)
  })
})
