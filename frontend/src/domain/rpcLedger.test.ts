import { describe, expect, it, vi } from 'vitest'
import { ISSUER_ID } from './receipt'
import { baseSepoliaProfileFromEnv, createPublicRpcLedger, type ApprovedTrustProfile } from './rpcLedger'
import { UntrustedLedgerError } from './verify'

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
    }) as unknown as typeof fetch
    const reader = createPublicRpcLedger(profile, fetcher)
    await expect(reader.getEpoch(contract, '1')).resolves.toEqual({
      epoch_id: '1', root, receipt_count: 3, protocol_version: 1, publisher,
      issuer_seq_min: null, issuer_seq_max: null, anchored_block: 120,
    })
    await expect(reader.blockNumber()).resolves.toBe(122)
  })

  it('treats a responsive wrong-chain RPC as untrusted rather than unavailable', async () => {
    const fetcher = async () => new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x7a69' }))
    await expect(createPublicRpcLedger(profile, fetcher).blockNumber()).rejects.toBeInstanceOf(UntrustedLedgerError)
  })
})
