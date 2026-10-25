import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { approvedProfile } from '../src/domain/approvedProfiles'
import { createPublicRpcLedger, type ApprovedTrustProfile } from '../src/domain/rpcLedger'
import { manifestHashes } from '../src/domain/manifests'
import type { VerificationBundle } from '../src/domain/types'
import { verifyReceipt, type VerifierContext } from '../src/domain/verify'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const folder = resolve(root, 'docs/handoffs/w4-anchored-epoch-public/20261020-r01')
const output = resolve(root, 'docs/evidence/w5-f/20261022')
const files = ['receipt-0.bundle.json', 'receipt-1.bundle.json']
const bytes = files.map((f) => readFileSync(resolve(folder, f)))
const digest = (b: Buffer) => createHash('sha256').update(b).digest('hex')
const bundles = bytes.map((b) => JSON.parse(b.toString('utf8')) as VerificationBundle)
const profile: ApprovedTrustProfile = { ...approvedProfile('BASE_SEPOLIA_DEMO'), profile_id: 'BASE_SEPOLIA_DEMO',
  chain_id: '84532', issuer_id: 'verimod-example-platform', deployment_block: 48012271,
  min_confirmations: 12, rpc_urls: ['https://base-sepolia-rpc.publicnode.com', 'https://sepolia.base.org'] }
const allowed = new Set(['eth_chainId', 'eth_call', 'eth_blockNumber', 'eth_getLogs', 'eth_getTransactionReceipt'])
const calls: { host: string; method: string; success: boolean }[] = []
const fetcher: typeof fetch = async (input, init) => {
  const method = JSON.parse(String(init?.body)).method
  if (!allowed.has(method)) throw Error('Read-only RPC methods only')
  const call = { host: new URL(String(input)).host, method, success: false }; calls.push(call)
  const response = await fetch(input, init); call.success = response.ok; return response
}
const ledger = createPublicRpcLedger(profile, fetcher)
const context: VerifierContext = { trust: profile, ledger, manifests: await manifestHashes(), privatePackage: null,
  findBundle: () => null, findPrivateContent: () => null }
const cases: { name: string; input: VerificationBundle; expected: string }[] = [
  { name: 'CASE1a receipt-0', input: bundles[0], expected: 'VALID' },
  { name: 'CASE1b receipt-1', input: bundles[1], expected: 'VALID' },
]
const tampered = structuredClone(bundles[0])
if (tampered.receipt_body.event_kind !== 'DECISION') throw Error('W4 Decision expected')
tampered.receipt_body.payload.policy.action = tampered.receipt_body.payload.policy.action === 'ALLOW' ? 'RESTRICT' : 'ALLOW'
cases.push({ name: 'CASE2 body mutation', input: tampered, expected: 'HASH_MISMATCH' })
const proof = structuredClone(bundles[0]); proof.proof!.siblings[0] = `0x${'f'.repeat(64)}`
cases.push({ name: 'CASE3 proof mutation', input: proof, expected: 'INVALID_PROOF' })
for (const key of ['contract_address', 'chain_id'] as const) {
  const input = structuredClone(bundles[0]); input.anchor![key] = key === 'chain_id' ? '31337' : `0x${'9'.repeat(40)}`
  cases.push({ name: `CASE4 ${key}`, input, expected: 'UNTRUSTED_ANCHOR' })
}
cases.push({ name: 'CASE5 not anchored', input: { ...bundles[0], proof: null, anchor: null }, expected: 'PENDING_ANCHOR' })
const results = []
// Query once for the immutable W4 registration in this bounded test window, then reuse the
// observed record for negative copies. This cache is test-only; the production reader is unchanged.
let observed: Awaited<ReturnType<typeof ledger.getEpoch>> = null
let head = 0
let blocked = false
try { observed = await ledger.getEpoch(profile.contract_address, '1'); head = await ledger.blockNumber() } catch { blocked = true }
const observedContext = { ...context, ledger: { getEpoch: async () => observed, blockNumber: async () => head } }
for (const c of cases) {
  const networkDependent = c.expected === 'VALID' || c.expected === 'INVALID_PROOF'
  if (blocked && networkDependent) { results.push({ name: c.name, expected: c.expected, actual: 'RPC_UNAVAILABLE', status: 'BLOCKED' }); continue }
  const r = await verifyReceipt(c.input, observedContext)
  results.push({ name: c.name, expected: c.expected, actual: r.code, status: r.code === c.expected ? 'PASS' : 'FAIL',
    manifest: r.manifest.state, content: r.content.state, confirmations: r.confirmations })
}
const unchanged = files.every((f, i) => digest(readFileSync(resolve(folder, f))) === digest(bytes[i]))
const report = { run: 'W5_NEW_NODE_RPC_READ_ONLY', at: new Date().toISOString(), platform: process.platform, node: process.version,
  browser_qa: 'BLOCKED_SEPARATE_ENVIRONMENT', profile, head, observed_epoch: observed,
  public_bundle_sha256: Object.fromEntries(files.map((f, i) => [f, digest(bytes[i])])), historical_files_unchanged: unchanged,
  results, calls, authoritative_db_opened: false, private_material_accessed: false, chain_tx_sent: false,
  policy: 'W4_PROVISIONAL_E2E_ONLY', team_approved: false }
mkdirSync(output, { recursive: true })
writeFileSync(resolve(output, 'node-public-rpc.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ passed: results.filter((r) => r.status === 'PASS').length, blocked: results.filter((r) => r.status === 'BLOCKED').length,
  failed: results.filter((r) => r.status === 'FAIL').length, calls: calls.length, historical_files_unchanged: unchanged }))
if (!unchanged || results.some((r) => r.status === 'FAIL')) process.exitCode = 1
