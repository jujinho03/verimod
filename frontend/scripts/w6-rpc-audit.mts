import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { manifestHashes } from '../src/domain/manifests'
import { receiptHash } from '../src/domain/receipt'
import { baseSepoliaProfileFromEnv, createPublicRpcLedger } from '../src/domain/rpcLedger'
import type { VerificationBundle } from '../src/domain/types'
import { verifyCore, type VerifierContext } from '../src/domain/verify'

const allowedMethods = new Set([
  'eth_chainId',
  'eth_call',
  'eth_blockNumber',
  'eth_getLogs',
  'eth_getTransactionReceipt',
])
const attempts = Number(process.env.W6_RPC_AUDIT_ATTEMPTS ?? '1')
if (!Number.isSafeInteger(attempts) || attempts < 1 || attempts > 10) {
  throw new Error('W6_RPC_AUDIT_ATTEMPTS must be an integer from 1 to 10')
}
const scenario = process.env.W6_RPC_AUDIT_SCENARIO ?? 'VALID'
if (!['VALID', 'HASH_MISMATCH', 'INVALID_PROOF'].includes(scenario)) {
  throw new Error('W6_RPC_AUDIT_SCENARIO must be VALID, HASH_MISMATCH, or INVALID_PROOF')
}
const runId = process.env.W6_RPC_AUDIT_RUN_ID ?? new Date().toISOString().replace(/[:.]/g, '-')
const outputDir = resolve('../private-data/w6-f-rpc-audit', runId)
const bundlePath = resolve('../docs/handoffs/w4-anchored-epoch-public/20261020-r01/receipt-0.bundle.json')
const originalBytes = readFileSync(bundlePath)
const original = JSON.parse(originalBytes.toString('utf8')) as VerificationBundle
const bundle = structuredClone(original)
if (bundle.receipt_body.event_kind !== 'DECISION') throw new Error('W4 Decision fixture expected')
if (scenario !== 'VALID') {
  bundle.receipt_body.payload.policy.action = bundle.receipt_body.payload.policy.action === 'ALLOW' ? 'RESTRICT' : 'ALLOW'
  if (scenario === 'INVALID_PROOF') bundle.receipt_hash = await receiptHash(bundle.receipt_body)
}

const profile = baseSepoliaProfileFromEnv({
  VITE_BASE_SEPOLIA_CONTRACT_ADDRESS: '0xd17ba590b23e984e3f3408bcdc3529be9868ec50',
  VITE_BASE_SEPOLIA_PUBLISHER: '0xd47675be41ec3476f541c1d8d8a9f622c90182ed',
  VITE_BASE_SEPOLIA_RPC_URLS: 'https://base-sepolia-rpc.publicnode.com,https://sepolia.base.org',
  VITE_BASE_SEPOLIA_DEPLOYMENT_BLOCK: '48012271',
  VITE_BASE_SEPOLIA_MIN_CONFIRMATIONS: '12',
})
if (!profile) throw new Error('approved profile is incomplete')

type RpcCall = {
  endpoint: string
  method: string
  started_at: string
  latency_ms: number
  http_status: number | null
  response_bytes: number | null
  error: string | null
  rate_limited: boolean
  block_range: { from: number; to: number; blocks: number } | null
}

function rangeOf(method: string, params: unknown[]): RpcCall['block_range'] {
  if (method !== 'eth_getLogs' || typeof params[0] !== 'object' || params[0] === null) return null
  const filter = params[0] as Record<string, unknown>
  if (typeof filter.fromBlock !== 'string' || typeof filter.toBlock !== 'string') return null
  const from = Number(BigInt(filter.fromBlock))
  const to = Number(BigInt(filter.toBlock))
  return { from, to, blocks: to - from + 1 }
}

const results: Array<Record<string, unknown>> = []
for (let attempt = 1; attempt <= attempts; attempt++) {
  const calls: RpcCall[] = []
  const measuredFetch: typeof fetch = async (input, init) => {
    const body = JSON.parse(String(init?.body)) as { method?: unknown; params?: unknown }
    if (typeof body.method !== 'string' || !allowedMethods.has(body.method) || !Array.isArray(body.params)) {
      throw new Error('unexpected or write-capable RPC method')
    }
    const startedAt = new Date().toISOString()
    const started = performance.now()
    const call: RpcCall = {
      endpoint: new URL(String(input)).host,
      method: body.method,
      started_at: startedAt,
      latency_ms: 0,
      http_status: null,
      response_bytes: null,
      error: null,
      rate_limited: false,
      block_range: rangeOf(body.method, body.params),
    }
    calls.push(call)
    try {
      const response = await fetch(input, init)
      call.latency_ms = Math.round(performance.now() - started)
      call.http_status = response.status
      call.rate_limited = response.status === 429
      call.response_bytes = Buffer.byteLength(await response.clone().text())
      return response
    } catch (error) {
      call.latency_ms = Math.round(performance.now() - started)
      call.error = error instanceof Error ? `${error.name}: ${error.message}` : 'UnknownError'
      throw error
    }
  }
  const started = performance.now()
  let code = 'SCRIPT_ERROR'
  let scriptError: string | null = null
  try {
    const context: VerifierContext = {
      trust: profile,
      ledger: createPublicRpcLedger(profile, measuredFetch),
      manifests: await manifestHashes(),
      findBundle: () => null,
      findPrivateContent: () => null,
    }
    code = (await verifyCore(bundle, context)).code
  } catch (error) {
    scriptError = error instanceof Error ? `${error.name}: ${error.message}` : 'UnknownError'
  }
  results.push({
    attempt,
    code,
    elapsed_ms: Math.round(performance.now() - started),
    rpc_calls: calls.length,
    rate_limited_calls: calls.filter((call) => call.rate_limited).length,
    timed_out_calls: calls.filter((call) => call.error?.includes('TimeoutError')).length,
    methods: Object.fromEntries([...allowedMethods].map((method) => [method, calls.filter((call) => call.method === method).length])),
    endpoints: Object.fromEntries(profile.rpc_urls.map((url) => {
      const host = new URL(url).host
      const endpointCalls = calls.filter((call) => call.endpoint === host)
      return [host, {
        calls: endpointCalls.length,
        successful_http: endpointCalls.filter((call) => call.http_status !== null && call.http_status >= 200 && call.http_status < 300).length,
        errors: endpointCalls.filter((call) => call.error || (call.http_status !== null && call.http_status >= 400)).length,
      }]
    })),
    script_error: scriptError,
    calls,
  })
}

const expected = scenario
const passed = results.filter((result) => result.code === expected).length
const report = {
  schema_version: 'verimod/w6-rpc-audit/v1',
  run_id: runId,
  source_head: process.env.W6_SOURCE_HEAD ?? 'UNSET',
  scenario,
  expected,
  profile: profile.profile_id,
  receipt_hash: bundle.receipt_hash,
  original_receipt_hash: original.receipt_hash,
  input_sha256: createHash('sha256').update(JSON.stringify(bundle)).digest('hex'),
  original_file_sha256: createHash('sha256').update(originalBytes).digest('hex'),
  attempts,
  passed,
  failed: attempts - passed,
  consecutive_pass: passed === attempts,
  results,
  safety: {
    allowed_rpc_methods: [...allowedMethods],
    route_failure_injection: false,
    chain_transaction_sent: false,
    authoritative_database_modified: false,
    private_material_access: false,
  },
  observed_at: new Date().toISOString(),
}
mkdirSync(outputDir, { recursive: true })
writeFileSync(resolve(outputDir, 'rpc-audit.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
process.exitCode = passed === attempts ? 0 : 1
