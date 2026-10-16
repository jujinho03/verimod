/** W4 local actual-model issuance/freeze only. No signer, chain provider or sender is imported. */
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { once } from 'node:events'
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createServer as netServer } from 'node:net'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { canonicalBytes, canonicalize } from '../../shared/protocol/src/canonical.ts'
import { DOMAINS, domainHash } from '../../shared/protocol/src/hash.ts'
import { contentCommitment, ISSUER_ID, receiptHash } from '../../shared/protocol/src/receipt.ts'
import { createThresholdPolicyEvaluator, trustedModelHash, W4_PROVISIONAL_POLICY_HASH, W4_R01_MODEL_HASH } from '../src/inference.ts'

const A_SHA = '9bcbec677d89d10364b327aae7e60955e2e4315d'
const T_SHA = 'fbcb3e9e99ae8dda2f9c70a32f35ec2c039b73de'
const WEIGHT_SHA = 'a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f'
const froot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const { values } = parseArgs({ options: {
  'a-root': { type: 'string' }, 'expected-f-sha': { type: 'string' },
  'python': { type: 'string' }, 'model-dir': { type: 'string' },
  'public-dir': { type: 'string' }, 'private-dir': { type: 'string' },
  'preflight-only': { type: 'boolean' }, help: { type: 'boolean' },
} })
if (values.help) {
  console.log('npm run w4:integration -- --a-root <verified A checkout> --expected-f-sha <F SHA> --public-dir <NEW public directory> --private-dir <NEW Git-ignored directory> [--python <existing Python>] [--model-dir <existing selected_model>] [--preflight-only]')
  process.exit(0)
}
if (!values['public-dir']) throw new Error('--public-dir must name a new evidence directory')
const publicDir = resolve(values['public-dir'])
if (existsSync(publicDir)) throw new Error('Preserve existing public evidence; choose a new directory')
const aroot = values['a-root'] ? resolve(values['a-root']) : undefined
const privateDir = values['private-dir'] ? resolve(values['private-dir']) : undefined
const within = (parent: string, child: string) => {
  const path = relative(parent, child)
  return path === '' || (!isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`))
}
if (privateDir && (within(privateDir, publicDir) || within(publicDir, privateDir))) throw new Error('Public and private evidence directories must be separate')
const git = (root: string, args: string[]) => execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\', '/')}`, '-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const source = (revision: string, path: string) => git(froot, ['show', `${revision}:${path}`]).replaceAll('\r\n', '\n')
const sha = (content: string) => createHash('sha256').update(content).digest('hex')
const modelManifest = JSON.parse(readFileSync(resolve(froot, 'backend/config/w4-r01.model_manifest.json'), 'utf8'))
const policyManifest = JSON.parse(readFileSync(resolve(froot, 'backend/config/w4-provisional.policy_manifest.json'), 'utf8'))
const fsha = git(froot, ['rev-parse', 'HEAD'])
const report: any = {
  schema_version: 'w4-f-final-integration/1', scope: 'W4_PROVISIONAL_E2E_ONLY', team_approved: false,
  source_commits: { a: A_SHA, f: fsha, t: T_SHA }, created_at: new Date().toISOString(),
  issuer_id: ISSUER_ID, model_manifest_hash: W4_R01_MODEL_HASH, policy_manifest_hash: W4_PROVISIONAL_POLICY_HASH,
  source_digest_encoding: 'UTF-8 after CRLF-to-LF and trim',
  chain_transactions: 0, signing_operations: 0, test_data_accessed: false,
  checks: {}, blockers: [], actual_receipt_count: 0,
  statuses: { ACTUAL_R01_ISSUANCE: 'BLOCKED', EPOCH_FREEZE: 'BLOCKED', F_T_HANDOFF: 'BLOCKED', PRE_BROADCAST_DURABILITY: 'BLOCKED', PUBLIC_CHAIN: 'NOT_EXECUTED' },
}
const check = (name: string, pass: boolean) => { report.checks[name] = pass ? 'PASS' : 'BLOCKED'; return pass }
check('f_revision', values['expected-f-sha'] === fsha)
check('f_tracked_clean', git(froot, ['diff', 'HEAD', '--name-only']) === '')
try { check('f_tool_committed', sha(readFileSync(fileURLToPath(import.meta.url), 'utf8').replaceAll('\r\n', '\n').trim()) === sha(source(fsha, 'backend/scripts/w4-final-integration.mts'))) }
catch { check('f_tool_committed', false) }
check('model_manifest', await trustedModelHash(modelManifest) === W4_R01_MODEL_HASH)
check('policy_manifest', await domainHash(DOMAINS.policy, canonicalBytes(policyManifest)) === W4_PROVISIONAL_POLICY_HASH)
assert.equal(policyManifest.usage, 'W4_PROVISIONAL_E2E_ONLY')
assert.equal(policyManifest.team_approved, false)
const profileSource = source(T_SHA, 'frontend/src/domain/approvedProfiles.ts')
const rpcSource = source(T_SHA, 'frontend/src/domain/rpcLedger.ts')
const tReceiptSource = source(T_SHA, 'shared/protocol/src/receipt.ts')
const verifierSource = source(T_SHA, 'frontend/src/domain/verify.ts')
check('t_issuer_source_binding', /ISSUER_ID = 'verimod-example-platform'/.test(tReceiptSource)
  && /issuer_id: ISSUER_ID/.test(profileSource) && /issuer_id: ISSUER_ID/.test(rpcSource)
  && /body\.issuer_id !== ctx\.trust\.issuer_id/.test(verifierSource))
report.t_source_digests = { approved_profiles: sha(profileSource), rpc_ledger: sha(rpcSource), verifier: sha(verifierSource) }
const senderSource = source(T_SHA, 'backend/contracts/scripts/register-epoch.ts')
report.t_sender_audit = {
  source_sha256: sha(senderSource), journal_before_broadcast: senderSource.indexOf('writeJournal(journal)') < senderSource.indexOf('broadcastTransaction(journal.rawTransaction)'),
  f_sqlite_callback_present: /persistBeforeBroadcast|EpochSenderHandoff|recordSubmitting/.test(senderSource),
}
report.blockers.push('T: pinned sender journals then broadcasts without awaiting the F SQLite durability callback. Adopt EpochSenderHandoff before any transmission.')
let pythonPath: string | undefined
let modelDir: string | undefined
if (aroot) {
  check('a_revision', git(aroot, ['rev-parse', 'HEAD']) === A_SHA)
  check('a_tracked_clean', git(aroot, ['diff', 'HEAD', '--name-only']) === '')
  pythonPath = resolve(values.python ?? resolve(aroot, process.platform === 'win32' ? 'ai/.venv/Scripts/python.exe' : 'ai/.venv/bin/python'))
  modelDir = resolve(values['model-dir'] ?? resolve(aroot, 'ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model'))
  check('python_runtime_present', existsSync(pythonPath))
  const weight = resolve(modelDir, 'model.safetensors')
  if (existsSync(weight)) {
    const hash = createHash('sha256')
    for await (const chunk of createReadStream(weight)) hash.update(chunk)
    check('selected_weight_sha256', hash.digest('hex') === WEIGHT_SHA)
  } else check('selected_weight_sha256', false)
  check('a_service_source', existsSync(resolve(aroot, 'ai/scripts/serve_w4_inference.py'))
    && readFileSync(resolve(aroot, 'ai/scripts/serve_w4_inference.py'), 'utf8').replaceAll('\r\n', '\n').trim() === source(A_SHA, 'ai/scripts/serve_w4_inference.py'))
} else {
  check('a_revision', false); check('python_runtime_present', false); check('selected_weight_sha256', false)
  report.blockers.push('A: provide the verified A checkout on the host that already holds private R01 weights, Python environment and offline tokenizer cache.')
}
mkdirSync(publicDir, { recursive: true })
const saveReport = () => writeFileSync(resolve(publicDir, 'execution-status.json'), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' })
if (values['preflight-only'] || Object.values(report.checks).includes('BLOCKED')) {
  if (Object.values(report.checks).includes('BLOCKED')) report.blockers.push('Actual issuance/freeze not started: required preflight checks did not all pass.')
  saveReport()
  console.log(JSON.stringify({ scope: report.scope, statuses: report.statuses, checks: report.checks, actual_receipt_count: 0 }))
  process.exitCode = 2
} else {
  if (!privateDir || existsSync(privateDir)) throw new Error('--private-dir must name a new ignored private directory')
  git(froot, ['check-ignore', '-q', resolve(privateDir, 'f.sqlite')])
  mkdirSync(privateDir, { recursive: true, mode: 0o700 })
  const databasePath = resolve(privateDir, 'f.sqlite')
  const children: ReturnType<typeof spawn>[] = []
  const servers: ReturnType<typeof createServer>[] = []
  const privateSave = (name: string, value: unknown) => writeFileSync(resolve(privateDir, name), JSON.stringify(value), { flag: 'wx', mode: 0o600 })
  const start = (name: string, command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv) => {
    const log = createWriteStream(resolve(privateDir, `${name}.log`), { flags: 'wx', mode: 0o600 })
    const child = spawn(command, args, { cwd, env, windowsHide: true })
    children.push(child); child.stdout?.pipe(log, { end: false }); child.stderr?.pipe(log, { end: false })
    child.on('error', () => log.end()); child.on('exit', () => log.end())
    return child
  }
  const stop = async (child: ReturnType<typeof spawn>) => {
    if (!child.pid || child.exitCode !== null || child.signalCode !== null) return
    const exited = once(child, 'exit'); child.kill(); await exited
  }
  const port = async () => {
    const server = netServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening')
    const selected = (server.address() as { port: number }).port
    await new Promise<void>(done => server.close(() => done())); return selected
  }
  const ready = async (url: string, child: ReturnType<typeof spawn>) => {
    const deadline = Date.now() + 120000
    while (Date.now() < deadline) {
      if (!child.pid || child.exitCode !== null) throw new Error('local child process failed before readiness')
      try { const response = await fetch(url, { signal: AbortSignal.timeout(1000) }); if (response.status === 200) return await response.json() as any } catch {}
      await new Promise(done => setTimeout(done, 100))
    }
    throw new Error('local service readiness timed out')
  }
  let backend: ReturnType<typeof spawn> | undefined
  try {
    const pythonPort = await port()
    const python = start('actual-python', pythonPath!, ['-B', 'ai/scripts/serve_w4_inference.py', '--host', '127.0.0.1', '--port', String(pythonPort)], aroot!, {
      ...process.env, PYTHONUTF8: '1', HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1', VERIMOD_MODEL_DIR: modelDir!, VERIMOD_INFERENCE_TIMEOUT_SECONDS: '10',
    })
    const pythonUrl = `http://127.0.0.1:${pythonPort}`
    const health = await ready(`${pythonUrl}/healthz`, python)
    assert.equal(health.model_manifest_hash, W4_R01_MODEL_HASH); assert.equal(health.artifact_sha256, WEIGHT_SHA)
    let forwards = 0
    const observer = createServer(async (req, res) => {
      if (req.method !== 'POST' || req.url !== '/infer') { res.writeHead(404); res.end(); return }
      try {
        const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk))
        forwards++
        const upstream = await fetch(`${pythonUrl}/infer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: Buffer.concat(chunks), signal: AbortSignal.timeout(12000) })
        const body = await upstream.text(); res.writeHead(upstream.status, { 'Content-Type': 'application/json' }); res.end(body)
      } catch { res.writeHead(503); res.end('{}') }
    })
    servers.push(observer); observer.listen(0, '127.0.0.1'); await once(observer, 'listening')
    const inferenceUrl = `http://127.0.0.1:${(observer.address() as { port: number }).port}/infer`
    const backendPort = await port()
    const backendEnv = {
      ...process.env, PORT: String(backendPort), VERIMOD_DB_PATH: databasePath,
      VERIMOD_W4_PROVISIONAL_E2E_ONLY: 'true', VERIMOD_INFERENCE_URL: inferenceUrl, VERIMOD_INFERENCE_TIMEOUT_MS: '15000',
      VERIMOD_MODEL_MANIFEST_PATH: resolve(froot, 'backend/config/w4-r01.model_manifest.json'),
      VERIMOD_POLICY_MANIFEST_PATH: resolve(froot, 'backend/config/w4-provisional.policy_manifest.json'),
      VERIMOD_POLICY_MANIFEST_HASH: W4_PROVISIONAL_POLICY_HASH,
      VERIMOD_HATE_REVIEW_PPM: '24495', VERIMOD_HATE_RESTRICT_PPM: '216950',
      VERIMOD_OFFENSIVE_REVIEW_PPM: '180483', VERIMOD_OFFENSIVE_RESTRICT_PPM: '646501',
    }
    const launchBackend = (name: string) => start(name, process.execPath, ['--import', resolve(froot, 'backend/node_modules/tsx/dist/loader.mjs'), 'src/server.ts'], resolve(froot, 'backend'), backendEnv)
    backend = launchBackend('f-backend')
    const base = `http://127.0.0.1:${backendPort}`
    await ready(`${base}/api/health`, backend)
    const post = async (path: string, key: string, role: string, body: unknown) => {
      const response = await fetch(`${base}${path}`, { method: 'POST', headers: {
        'Content-Type': 'application/json', 'x-demo-role': role, 'x-demo-principal': role === 'DEMO_USER' ? 'w4-f-synthetic' : 'w4-f-operator', 'Idempotency-Key': key,
      }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) })
      return { status: response.status, body: await response.json() as any }
    }
    const texts = ['오늘은 친구와 도서관에서 함께 공부했어요.', '가 '.repeat(260)]
    const receipts: any[] = []
    const issuedData: any[] = []
    const privateRows: any[] = []
    const policy = createThresholdPolicyEvaluator({ policyManifestHash: W4_PROVISIONAL_POLICY_HASH, policyManifest, localW4E2E: true, ...policyManifest.thresholds_ppm })
    report.success_tests = []
    for (const [index, text] of texts.entries()) {
      const issued = await post('/api/decisions', `actual-${index}`, 'DEMO_USER', { text })
      privateSave(`issued-${index}.json`, issued)
      assert.equal(issued.status, 201)
      const { bundle, private_package: privatePackage } = issued.body.data
      const body = bundle.receipt_body
      assert.equal(body.issuer_id, ISSUER_ID); assert.equal(body.payload.inference.model_manifest_hash, W4_R01_MODEL_HASH)
      assert.equal(body.payload.policy.policy_manifest_hash, W4_PROVISIONAL_POLICY_HASH)
      assert.equal(body.payload.inference.score_semantics, 'UNCALIBRATED')
      assert.equal(body.payload.inference.input_status, index === 0 ? 'FULL' : 'TRUNCATED')
      assert.deepEqual(body.payload.policy, await policy.evaluate(body.payload.inference))
      assert.equal(await receiptHash(body), bundle.receipt_hash)
      assert.equal(await contentCommitment(`0x${privatePackage.content_salt}`, text), body.content_commitment)
      assert.equal(body.payload.inference.content_commitment, body.content_commitment)
      assert.equal(bundle.proof, null); assert.equal(bundle.anchor, null)
      const publicBundle: any = await (await fetch(`${base}/api/receipts/${body.receipt_id}/bundle`)).json()
      assert.equal(publicBundle.ok, true)
      for (const forbidden of ['original_text', 'content_salt', 'private_package', 'signed_tx', text, privatePackage.content_salt]) assert.equal(JSON.stringify(publicBundle.data).includes(forbidden), false)
      const beforeReplay = forwards
      const replay = await post('/api/decisions', `actual-${index}`, 'DEMO_USER', { text })
      assert.deepEqual(replay.body.data, issued.body.data)
      const conflict = await post('/api/decisions', `actual-${index}`, 'DEMO_USER', { text: `${text} 변경` })
      assert.equal(conflict.status, 409); assert.equal(conflict.body.error.code, 'IDEMPOTENCY_CONFLICT'); assert.equal(forwards, beforeReplay)
      receipts.push(bundle)
      issuedData.push(issued.body.data)
      privateRows.push({ receipt_id: body.receipt_id, original_text: text, content_salt: privatePackage.content_salt, content_commitment: body.content_commitment })
      report.actual_receipt_count = receipts.length
      report.success_tests.push({ input_status: body.payload.inference.input_status, scores_ppm: body.payload.inference.scores_ppm,
        action: body.payload.policy.action, reason_codes: body.payload.policy.reason_codes, triggered_rule_ids: body.payload.policy.triggered_rule_ids,
        canonical_hash: 'PASS', commitment: 'PASS', privacy: 'PASS', replay: 'PASS', conflict_409: 'PASS' })
    }
    assert.equal(forwards, 2)
    report.statuses.ACTUAL_R01_ISSUANCE = 'PASS'
    const frozen = await post('/api/epochs/freeze', 'actual-freeze', 'DEMO_OPERATOR', {})
    assert.equal(frozen.status, 201)
    const { epoch, members } = frozen.body.data
    assert.match(epoch.epoch_id, /^[1-9]\d*$/); assert(BigInt(epoch.epoch_id) <= (1n << 64n) - 1n)
    assert.match(epoch.merkle_root, /^0x[0-9a-f]{64}$/); assert.notEqual(epoch.merkle_root, `0x${'0'.repeat(64)}`)
    assert.equal(epoch.receipt_count, 2); assert.equal(epoch.protocol_version, 1); assert.equal(epoch.status, 'FROZEN')
    const ordered = [...receipts].sort((a, b) => a.receipt_body.receipt_id < b.receipt_body.receipt_id ? -1 : 1)
    assert.deepEqual(members.map((member: any) => member.receipt_hash), ordered.map(bundle => bundle.receipt_hash))
    assert.deepEqual(members.map((member: any) => member.leaf_index), [0, 1])
    const leaves = ordered.map(bundle => createHash('sha256').update(Buffer.from([0])).update(Buffer.from(bundle.receipt_hash.slice(2), 'hex')).digest())
    const independentRoot = `0x${createHash('sha256').update(Buffer.from([1])).update(leaves[0]).update(leaves[1]).digest('hex')}`
    assert.equal(epoch.merkle_root, independentRoot)
    const replayFreeze = await post('/api/epochs/freeze', 'actual-freeze', 'DEMO_OPERATOR', {})
    assert.deepEqual(replayFreeze.body.data, frozen.body.data)
    const empty = await post('/api/epochs/freeze', 'new-empty', 'DEMO_OPERATOR', {})
    assert.equal(empty.status, 409); assert.equal(empty.body.error.code, 'EMPTY_EPOCH')
    await stop(backend)
    const reopened = new DatabaseSync(databasePath, { readOnly: true })
    try {
      assert.equal((reopened.prepare('SELECT COUNT(*) AS n FROM receipts').get() as any).n, 2)
      assert.equal((reopened.prepare('SELECT COUNT(*) AS n FROM epoch_members').get() as any).n, 2)
      assert.equal((reopened.prepare('SELECT COUNT(*) AS n FROM epochs').get() as any).n, 1)
      for (const bundle of receipts) {
        const row: any = reopened.prepare('SELECT canonical_body, receipt_hash FROM receipts WHERE receipt_id=?').get(bundle.receipt_body.receipt_id)
        assert.equal(row.canonical_body, canonicalize(bundle.receipt_body)); assert.equal(row.receipt_hash, bundle.receipt_hash)
      }
      for (const expected of privateRows) {
        const row = reopened.prepare('SELECT receipt_id, original_text, content_salt, content_commitment FROM content_store WHERE receipt_id=?').get(expected.receipt_id)
        assert.deepEqual({ ...row }, expected)
      }
      const row: any = reopened.prepare('SELECT status, merkle_root FROM epochs WHERE epoch_id=?').get(epoch.epoch_id)
      assert.equal(row.status, 'FROZEN'); assert.equal(row.merkle_root, independentRoot)
    } finally { reopened.close() }
    backend = launchBackend('f-backend-reopened'); await ready(`${base}/api/health`, backend)
    assert.deepEqual((await post('/api/epochs/freeze', 'actual-freeze', 'DEMO_OPERATOR', {})).body.data, frozen.body.data)
    for (const [index, bundle] of receipts.entries()) {
      assert.deepEqual((await post('/api/decisions', `actual-${index}`, 'DEMO_USER', { text: texts[index] })).body.data, issuedData[index])
      assert.equal(forwards, 2)
      const publicBundle: any = await (await fetch(`${base}/api/receipts/${bundle.receipt_body.receipt_id}/bundle`)).json()
      assert.equal(publicBundle.data.proof, null); assert.equal(publicBundle.data.anchor, null)
      for (const forbidden of ['original_text', 'content_salt', 'private_package', 'signed_tx', texts[index], privateRows[index].content_salt]) assert.equal(JSON.stringify(publicBundle.data).includes(forbidden), false)
      writeFileSync(resolve(publicDir, `receipt-${index}.bundle.json`), `${JSON.stringify(publicBundle.data, null, 2)}\n`, { flag: 'wx' })
    }
    const handoff = {
      schema_version: 'w4-frozen-epoch-handoff/1', source_commits: report.source_commits,
      epoch_id: epoch.epoch_id, merkle_root: epoch.merkle_root, receipt_count: epoch.receipt_count, protocol_version: 1, status: 'FROZEN',
      member_receipt_hashes: members.map((member: any) => member.receipt_hash), member_order: 'receipt_id ASCII ascending; leaf_index 0..count-1',
      issuer_id: ISSUER_ID, model_manifest_hash: W4_R01_MODEL_HASH, policy_manifest_hash: W4_PROVISIONAL_POLICY_HASH,
      policy_status: 'W4_PROVISIONAL_E2E_ONLY', team_approved: false,
      actual_model_evidence: { a_commit: A_SHA, weight_sha256: WEIGHT_SHA, verified_python_health: true, observed_http_forward_calls: forwards, fixture_adapter: false },
      checks: { canonical_receipt_hashes: 'PASS', independent_merkle_root: 'PASS', freeze_replay: 'PASS', empty_epoch_409: 'PASS', sqlite_reopen: 'PASS', public_private_boundary: 'PASS' },
      transmission_authorized: false,
      required_before_transmission: ['Team authorization for this provisional-policy epoch', 'T sender awaits F EpochSenderHandoff acknowledgement before broadcast', 'Approved chain/contract/publisher and on-chain epoch collision checks'],
    }
    writeFileSync(resolve(publicDir, 'frozen-epoch-handoff.json'), `${JSON.stringify(handoff, null, 2)}\n`, { flag: 'wx' })
    report.actual_receipt_count = 2; report.observed_http_forwards = forwards
    report.statuses.ACTUAL_R01_ISSUANCE = 'PASS'; report.statuses.EPOCH_FREEZE = 'PASS'; report.statuses.F_T_HANDOFF = 'READY'
    report.checks.sqlite_reopen = 'PASS'; report.checks.independent_merkle_root = 'PASS'
  } catch (error) {
    report.blockers.push('Actual local execution failed; inspect the private error log. No PASS is inferred from a partial run.')
    privateSave('execution-error.json', { error: error instanceof Error ? error.stack : String(error) })
    process.exitCode = 1
  } finally {
    for (const server of servers) { server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())) }
    for (const child of children.reverse()) await stop(child)
    saveReport()
    console.log(JSON.stringify({ statuses: report.statuses, actual_receipt_count: report.actual_receipt_count }))
  }
}
