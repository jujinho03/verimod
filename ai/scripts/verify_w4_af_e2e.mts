/** Actual loopback A/F verification. Every SQLite and private payload stays ignored. No chain RPC. */
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { createServer as createNetServer } from 'node:net'
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { once } from 'node:events'
import { performance } from 'node:perf_hooks'

const [aArg, fArg, privateArg, publicArg, tArg] = process.argv.slice(2)
const aroot = resolve(aArg), froot = resolve(fArg), privateDir = resolve(privateArg), publicDir = resolve(publicArg)
const F_REF = '2c99260c0eb6229d34b3f94191c2dab3238c1727'
const T_REF = 'fbcb3e9e99ae8dda2f9c70a32f35ec2c039b73de'
const troot = resolve(tArg)
assert.equal(execFileSync('git', ['-C', troot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), T_REF)
assert.equal(execFileSync('git', ['-C', troot, 'diff', 'HEAD', '--name-only'], { encoding: 'utf8' }).trim(), '')
assert.equal(execFileSync('git', ['-C', froot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), F_REF)
assert.equal(execFileSync('git', ['-C', froot, 'diff', 'HEAD', '--name-only'], { encoding: 'utf8' }).trim(), '')
execFileSync('git', ['check-ignore', '-q', resolve(privateDir, 'e2e.sqlite')], { cwd: aroot })
if (existsSync(resolve(publicDir, 'af_e2e.json'))) throw new Error('Preserve previous E2E report')
mkdirSync(privateDir, { recursive: true })
const moduleAt = (p: string) => import(pathToFileURL(resolve(p)).href)
const { createApp } = await moduleAt(`${froot}/backend/src/app.ts`)
const { openDatabase } = await moduleAt(`${froot}/backend/src/database.ts`)
const { createHttpInferenceAdapter, createThresholdPolicyEvaluator } = await moduleAt(`${froot}/backend/src/inference.ts`)
const { contentCommitment, receiptHash, issuerCommitment, ISSUER_ID } = await moduleAt(`${froot}/shared/protocol/src/receipt.ts`)
const { canonicalize } = await moduleAt(`${froot}/shared/protocol/src/canonical.ts`)
const { APPROVED_PROFILES } = await moduleAt(`${troot}/frontend/src/domain/approvedProfiles.ts`)
const { baseSepoliaProfileFromEnv } = await moduleAt(`${troot}/frontend/src/domain/rpcLedger.ts`)
const { verifyCore } = await moduleAt(`${troot}/frontend/src/domain/verify.ts`)
const { MERKLE_SPEC } = await moduleAt(`${troot}/shared/protocol/src/merkle.ts`)
const read = (p: string) => JSON.parse(readFileSync(resolve(publicDir, p), 'utf8'))
const manifest = read('policy_manifest.json'), policyHash = read('policy_hash.json').policy_manifest_hash
const modelHash = manifest.model_manifest_hash
const modelManifest = JSON.parse(readFileSync(resolve(aroot, 'ai/artifacts/manifests/AI07-BL-KLUE-RB-45126-R01.model_manifest.json'), 'utf8'))
assert.deepEqual(JSON.parse(readFileSync(resolve(froot, 'backend/config/w4-r01.model_manifest.json'), 'utf8')), modelManifest)
assert.deepEqual(JSON.parse(readFileSync(resolve(froot, 'backend/config/w4-provisional.policy_manifest.json'), 'utf8')), manifest)
const policyConfig = () => ({ policyManifestHash: policyHash, policyManifest: structuredClone(manifest), localW4E2E: true, ...structuredClone(manifest.thresholds_ppm) })
const selectedPolicy = () => createThresholdPolicyEvaluator(policyConfig())
const started = performance.now()
const ownedServers: any[] = [], ownedChildren: any[] = []
const report: any = { scope: 'W4_PROVISIONAL_E2E_ONLY', f_commit: F_REF, t_commit: T_REF,
  model_manifest_hash: modelHash, policy_manifest_hash: policyHash, team_approved: false,
  external_chain_calls: 0, test_accessed: false, success_tests: [], failure_tests: [],
  fault_method: 'Real Python HTTP responses are mutated only in explicitly named fault proxies; never success evidence.' }

function counts(db: any) {
  const scalar = (sql: string) => Number(db.prepare(sql).get().n)
  return { decisions: scalar("SELECT COUNT(*) n FROM receipts WHERE event_kind='DECISION'"),
    anchor_candidates: scalar('SELECT COUNT(*) n FROM receipts r LEFT JOIN epoch_members m ON m.receipt_hash=r.receipt_hash WHERE m.receipt_hash IS NULL'),
    content_store: scalar('SELECT COUNT(*) n FROM content_store'), epochs: scalar('SELECT COUNT(*) n FROM epochs'),
    completed_idempotency: scalar("SELECT COUNT(*) n FROM idempotency_records WHERE status='COMPLETED'") }
}
async function listen(server: any) {
  ownedServers.push(server)
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  return `http://127.0.0.1:${server.address().port}`
}
async function close(server: any) {
  if (!server.listening) return
  server.closeAllConnections?.()
  await new Promise<void>(done => server.close(() => done()))
}
async function stop(child: any) {
  if (child.exitCode !== null || child.signalCode !== null) return
  const exited = once(child, 'exit'); child.kill(); await exited
}
async function python(name: string, timeout?: string) {
  const reservation = createNetServer()
  await listen(reservation)
  const port = reservation.address().port
  await close(reservation)
  const env = { ...process.env, PYTHONUTF8: '1', HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1' }
  delete env.VERIMOD_MODEL_DIR; delete env.VERIMOD_INFERENCE_TIMEOUT_SECONDS
  if (timeout) env.VERIMOD_INFERENCE_TIMEOUT_SECONDS = timeout
  const log = createWriteStream(resolve(privateDir, `${name}.log`), { flags: 'wx' })
  const child = spawn(resolve(aroot, 'ai/.venv/Scripts/python.exe'),
    ['-B', 'ai/scripts/serve_w4_inference.py', '--port', String(port)], { cwd: aroot, env, windowsHide: true })
  ownedChildren.push(child); child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false })
  child.once('exit', () => log.end())
  const url = `http://127.0.0.1:${port}`
  const deadline = performance.now() + 120_000
  while (true) {
    if (child.exitCode !== null) throw new Error('Python startup exited; inspect private log')
    try {
      const response = await fetch(`${url}/healthz`, { signal: AbortSignal.timeout(1000) })
      if (response.status === 200) {
        const health: any = await response.json()
        assert.equal(health.model_manifest_hash, modelHash)
        return { child, url }
      }
    } catch {}
    if (performance.now() > deadline) throw new Error('Python readiness timed out')
    await new Promise(done => setTimeout(done, 100))
  }
}
async function issue(url: string, text: string, key: string) {
  const response = await fetch(`${url}/api/decisions`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-demo-principal': 'w4-a-synthetic',
      'x-demo-role': 'DEMO_USER', 'Idempotency-Key': key }, body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(15000) })
  return { status: response.status, body: await response.json() as any }
}
function database(name: string) {
  const path = resolve(privateDir, `${name}.sqlite`)
  if (existsSync(path)) throw new Error('Preserve prior private DB')
  return { path, db: openDatabase(path) }
}
async function failureCase(name: string, endpoint: string, policy: any = selectedPolicy(), trustedModel: any = modelManifest) {
  const { db } = database(name)
  const server = createServer(createApp({ database: db, inference: createHttpInferenceAdapter({ endpoint, timeoutMs: 10000 }), policy, modelManifest: trustedModel }))
  const url = await listen(server), before = counts(db)
  try {
    const response = await issue(url, '검증용 합성 문장입니다.', name)
    const after = counts(db)
    const delta = Object.fromEntries(Object.keys(before).map(k => [k, after[k] - before[k]]))
    const ok = response.status === 503 && response.body.ok === false && response.body.error?.code === 'INFERENCE_UNAVAILABLE'
      && Object.values(delta).every(n => n === 0) && response.body.data === undefined
      && Object.keys(response.body).sort().join(',') === 'error,ok,request_id'
    report.failure_tests.push({ case: name, status: ok ? 'PASS' : 'FAIL', http_status: response.status,
      error_code: response.body.error?.code ?? null, before, after, delta,
      emitted_policy_action: response.body.data?.bundle?.receipt_body?.payload?.policy?.action ?? null,
      emitted_model_manifest_hash: response.body.data?.bundle?.receipt_body?.payload?.inference?.model_manifest_hash ?? null,
      emitted_policy_manifest_hash: response.body.data?.bundle?.receipt_body?.payload?.policy?.policy_manifest_hash ?? null })
    // Raw response (may include salts if a fail-closed defect issued a receipt) stays private.
    writeFileSync(resolve(privateDir, `${name}.response.json`), JSON.stringify(response, null, 2))
  } finally { await close(server); db.close() }
}
async function proxy(endpoint: string, mutate: (v: any) => void) {
  const server = createServer(async (req, res) => {
    try {
      const chunks = []; for await (const chunk of req) chunks.push(chunk)
      const upstream = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: Buffer.concat(chunks) })
      const body: any = await upstream.json()
      if (upstream.status === 200) mutate(body)
      res.writeHead(upstream.status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body))
    } catch { res.writeHead(503); res.end('{}') }
  })
  return { server, endpoint: `${await listen(server)}/infer` }
}

try {
  const actual = await python('actual-python')
  const endpoint = `${actual.url}/infer`
  const { db, path } = database('actual-success')
  let forwardCalls = 0
  const adapter = createHttpInferenceAdapter({ endpoint, timeoutMs: 10000 })
  const observed = { infer: async (input: any) => { forwardCalls++; return adapter.infer(input) } }
  const server = createServer(createApp({ database: db, inference: observed, policy: selectedPolicy(), modelManifest }))
  const url = await listen(server)
  const texts = ['오늘은 친구와 도서관에서 함께 공부했어요.', '가 '.repeat(260)]
  const successful = []
  try {
    for (let i = 0; i < texts.length; i++) {
      const response = await issue(url, texts[i], `actual-${i}`)
      assert.equal(response.status, 201)
      const data = response.body.data, bundle = data.bundle, body = bundle.receipt_body
      assert.equal(body.payload.inference.model_manifest_hash, modelHash)
      assert.equal(body.payload.inference.score_semantics, 'UNCALIBRATED')
      assert.equal(body.payload.policy.policy_manifest_hash, policyHash)
      assert.equal(await receiptHash(body), bundle.receipt_hash)
      assert.equal(await contentCommitment(`0x${data.private_package.content_salt}`, texts[i]), body.content_commitment)
      assert.equal(body.content_commitment, body.payload.inference.content_commitment)
      assert.equal(body.content_commitment, data.private_package.content_commitment)
      assert.equal(body.payload.inference.input_status, i === 0 ? 'FULL' : 'TRUNCATED')
      const expectedPolicy = await selectedPolicy().evaluate(body.payload.inference)
      assert.deepEqual(body.payload.policy, expectedPolicy)
      if (i === 1) assert.equal(body.payload.policy.action, 'HUMAN_REVIEW')
      const row: any = db.prepare('SELECT canonical_body, receipt_hash FROM receipts WHERE receipt_id=?').get(body.receipt_id)
      assert.equal(row.canonical_body, canonicalize(body)); assert.equal(row.receipt_hash, bundle.receipt_hash)
      const stored: any = db.prepare('SELECT original_text,content_salt FROM content_store WHERE receipt_id=?').get(body.receipt_id)
      assert.equal(stored.original_text, texts[i]); assert.equal(stored.content_salt, data.private_package.content_salt)
      const publicResponse: any = await (await fetch(`${url}/api/receipts/${body.receipt_id}/bundle`)).json()
      const serialized = JSON.stringify(publicResponse.data)
      assert.deepEqual(Object.keys(publicResponse.data).sort(), ['anchor', 'proof', 'receipt_body', 'receipt_hash'])
      assert.equal(publicResponse.data.anchor, null); assert.equal(publicResponse.data.proof, null)
      for (const forbidden of ['original_text', 'content_salt', 'private_package', 'signed_tx', texts[i], data.private_package.content_salt]) {
        assert.equal(serialized.includes(forbidden), false)
      }
      const beforeReplay = forwardCalls
      const replay = await issue(url, texts[i], `actual-${i}`)
      assert.equal(replay.status, 201); assert.deepEqual(replay.body.data, data); assert.equal(forwardCalls, beforeReplay)
      const conflict = await issue(url, texts[i] + ' 변경', `actual-${i}`)
      assert.equal(conflict.status, 409); assert.equal(conflict.body.error.code, 'IDEMPOTENCY_CONFLICT')
      assert.equal(forwardCalls, beforeReplay)
      writeFileSync(resolve(privateDir, `success-${i}.json`), JSON.stringify({ text: texts[i], response: response.body }, null, 2))
      successful.push({ receipt_id: body.receipt_id, receipt_hash: bundle.receipt_hash, input_status: body.payload.inference.input_status,
        action: body.payload.policy.action, issuer_id: body.issuer_id, scores_ppm: body.payload.inference.scores_ppm,
        score_semantics: body.payload.inference.score_semantics,
        policy: body.payload.policy, receipt_hash_valid: true, commitment_valid: true,
        private_public_boundary: 'PASS', idempotent_replay: 'PASS', changed_request_409: 'PASS' })
    }
    assert.equal(counts(db).decisions, 2); assert.equal(forwardCalls, 2)
    report.success_tests = successful; report.success_counts = counts(db)
    const approved = APPROVED_PROFILES.BASE_SEPOLIA_DEMO
    // Transport values exercise pure profile construction; no RPC reader is created.
    const envProfile = baseSepoliaProfileFromEnv({ VITE_BASE_SEPOLIA_CONTRACT_ADDRESS: approved.contract_address,
      VITE_BASE_SEPOLIA_PUBLISHER: approved.publisher, VITE_BASE_SEPOLIA_RPC_URLS: 'https://unused.invalid',
      VITE_BASE_SEPOLIA_DEPLOYMENT_BLOCK: '0', VITE_BASE_SEPOLIA_MIN_CONFIRMATIONS: String(approved.min_confirmations) })
    assert.ok(envProfile)
    const issuerMatch = [ISSUER_ID, envProfile.issuer_id, ...successful.map(v => v.issuer_id)].every(v => v === approved.issuer_id)
    report.issuer_compatibility = { status: issuerMatch ? 'MATCH' : 'MISMATCH', f_shared_issuer: ISSUER_ID,
      env_profile_issuer: envProfile.issuer_id, env_profile_test: 'Pure constructor with approved contract/publisher and inert transport; no deployment/RPC validation',
      receipt_issuer_id: successful[0].issuer_id, approved_profile_issuer_id: APPROVED_PROFILES.BASE_SEPOLIA_DEMO.issuer_id,
      profile: 'BASE_SEPOLIA_DEMO', t_commit: T_REF }
    const currentBody = JSON.parse(db.prepare('SELECT canonical_body FROM receipts ORDER BY issuer_seq LIMIT 1').get().canonical_body)
    const changedBody = { ...currentBody, issuer_id: 'verimod-demo-issuer' }
    const currentHash = await receiptHash(currentBody), changedHash = await receiptHash(changedBody)
    const currentIssuerCommitment = await issuerCommitment(currentBody.issuer_id)
    const changedIssuerCommitment = await issuerCommitment(changedBody.issuer_id)
    assert.notEqual(currentHash, changedHash); assert.notEqual(currentIssuerCommitment, changedIssuerCommitment)
    let ledgerCalls = 0
    const ctx = { trust: approved, ledger: { getEpoch: async () => { ledgerCalls++; throw new Error('No RPC permitted') },
      blockNumber: async () => { ledgerCalls++; throw new Error('No RPC permitted') } } }
    const pending = await verifyCore({ receipt_body: currentBody, receipt_hash: currentHash, proof: null, anchor: null }, ctx)
    assert.equal(pending.code, 'PENDING_ANCHOR')
    // Synthetic locator is only for exercising the issuer gate before any ledger access.
    const rejected = await verifyCore({ receipt_body: changedBody, receipt_hash: changedHash,
      proof: { merkle_spec: MERKLE_SPEC, tree_size: 1, leaf_index: 0, siblings: [] },
      anchor: { chain_id: approved.chain_id, contract_address: approved.contract_address, epoch_id: '1',
        block_number: '0', block_hash: '0x' + '00'.repeat(32), tx_hash: '0x' + '00'.repeat(32) } }, ctx)
    assert.equal(rejected.code, 'UNTRUSTED_ANCHOR'); assert.equal(ledgerCalls, 0)
    report.issuer_contract = { status: 'PASS', currentHash, changedHash, currentIssuerCommitment, changedIssuerCommitment,
      unanchored_result: pending.code, unapproved_issuer_result: rejected.code, ledger_calls: ledgerCalls,
      scope: 'Local verifier gate with synthetic locator; no public-chain VALID claim' }
  } finally { await close(server); db.close() }
  const reopened = openDatabase(path)
  try { assert.equal(counts(reopened).decisions, 2); report.sqlite_reopen_persistence = 'PASS' } finally { reopened.close() }

  await failureCase('policy_not_configured', endpoint, null)
  for (const [name, mutate] of [
    ['invalid_model_output', (v: any) => { v.inference.scores_ppm.hate = 1_000_001 }],
    ['malformed_model_manifest', (v: any) => { v.inference.model_manifest_hash = 'invalid' }],
    ['wrong_commitment', (v: any) => { v.inference.content_commitment = '0x' + '00'.repeat(32) }],
    ['unapproved_model_manifest', (v: any) => { v.inference.model_manifest_hash = '0x' + '11'.repeat(32) }],
    ['taxonomy_version_mismatch', (v: any) => { v.inference.taxonomy_version = '2' }],
    ['score_semantics_mismatch', (v: any) => { v.inference.score_semantics = 'CALIBRATED' }],
  ] as const) {
    const fault = await proxy(endpoint, mutate)
    try { await failureCase(name, fault.endpoint) } finally { await close(fault.server) }
  }
  await failureCase('unapproved_policy_manifest', endpoint,
    createThresholdPolicyEvaluator({ ...policyConfig(), policyManifestHash: '0x' + '22'.repeat(32) }))
  for (const label of ['hate', 'offensive']) for (const band of ['review', 'restrict']) {
    const config = policyConfig(); config[label][band]++
    await failureCase(`threshold_only_${label}_${band}`, endpoint, createThresholdPolicyEvaluator(config))
  }
  await failureCase('model_manifest_content_tampered', endpoint, selectedPolicy(), { ...modelManifest, run_id: 'tampered' })
  await failureCase('policy_manifest_content_tampered', endpoint, createThresholdPolicyEvaluator({ ...policyConfig(),
    policyManifest: { ...manifest, comparison: 'greater_than' } }))
  await failureCase('provisional_gate_disabled', endpoint, createThresholdPolicyEvaluator({ ...policyConfig(), localW4E2E: false }))
  await stop(actual.child)
  await failureCase('ai_service_stopped', endpoint)
  const timed = await python('timeout-python', '0.000001')
  await failureCase('python_timeout', `${timed.url}/infer`)
  await stop(timed.child)
  report.happy_path = 'PASS'
  report.fail_closed = report.failure_tests.every((r: any) => r.status === 'PASS') ? 'PASS' : 'FAIL'
  report.status = report.fail_closed === 'PASS' && report.issuer_compatibility.status === 'MATCH'
    && report.issuer_contract.status === 'PASS' && report.success_tests.length === 2 && report.failure_tests.length === 17 ? 'PASS' : 'FAIL'
} catch (error) {
  report.status = 'FAIL'; report.execution_error = 'Harness exception; inspect private error log'
  writeFileSync(resolve(privateDir, 'e2e-error.log'), error instanceof Error ? error.stack ?? error.message : String(error))
  process.exitCode = 1
} finally {
  for (const server of ownedServers.reverse()) await close(server)
  for (const child of ownedChildren) await stop(child)
  report.elapsed_seconds = (performance.now() - started) / 1000
  writeFileSync(resolve(publicDir, 'af_e2e.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ status: report.status, happy_path: report.happy_path,
    failure_cases: report.failure_tests.length, failed_cases: report.failure_tests.filter((r: any) => r.status === 'FAIL').map((r: any) => r.case),
    issuer: report.issuer_compatibility?.status, elapsed_seconds: report.elapsed_seconds }))
  if (report.status !== 'PASS') process.exitCode = 1
}
