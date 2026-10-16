/** One request, one sanitized ACK. Never invokes a signer, sender or database migrations. */
import { parseArgs } from 'node:util'
import { CallbackError, loadCallbackApproval, MAX_CALLBACK_BYTES, openApprovedDatabase, parseCallbackRequest, persistCallback, verifyApprovedEpoch } from '../src/durabilityCallback.js'
import { reconcileSubmitted, submissionReader } from '../src/submissionReturn.js'

async function readOnce(): Promise<string> {
  return await new Promise((done, reject) => {
    const chunks: Buffer[] = []; let length = 0
    const cleanup = () => { clearTimeout(timer); process.stdin.off('data', data); process.stdin.off('end', end); process.stdin.off('error', failed); process.stdin.pause() }
    const failed = () => { cleanup(); reject(new CallbackError('INPUT_READ_FAILED')) }
    const data = (chunk: Buffer) => {
      length += chunk.length
      if (length > MAX_CALLBACK_BYTES) { cleanup(); reject(new CallbackError('INPUT_TOO_LARGE')); return }
      chunks.push(chunk)
    }
    const end = () => { cleanup(); done(Buffer.concat(chunks).toString('utf8')) }
    const timer = setTimeout(() => { cleanup(); reject(new CallbackError('INPUT_TIMEOUT')) }, 5000)
    process.stdin.on('data', data); process.stdin.once('end', end); process.stdin.once('error', failed)
  })
}
try {
  const { values } = parseArgs({ options: { config: { type: 'string' }, 'synthetic-test-only': { type: 'boolean' }, operation: { type: 'string', default: 'prepare' } } })
  if (!values.config) throw new CallbackError('HOST_CONFIG_REQUIRED')
  const cfg = loadCallbackApproval(values.config, values['synthetic-test-only'] === true)
  if (!['prepare', 'status', 'submitted'].includes(values.operation!)) throw new CallbackError('POST_STATE_VERIFIER_REQUIRED')
  // T stdin cannot choose database paths, approved identities or lifecycle operations.
  const request = values.operation === 'prepare' ? parseCallbackRequest(await readOnce()) : undefined
  const database = openApprovedDatabase(cfg)
  let output: unknown
  try {
    if (request) output = await persistCallback(database, cfg, request)
    else if (values.operation === 'status') {
      const epoch = await verifyApprovedEpoch(database, cfg)
      output = { epoch_id: epoch.epoch_id, merkle_root: epoch.merkle_root, receipt_count: epoch.receipt_count,
        protocol_version: epoch.protocol_version, status: epoch.status, tx_hash: epoch.tx_hash,
        policy_status: cfg.policy_status, team_approved: false, confirmation_path: 'BLOCKED' }
    } else {
      if (!cfg.allow_submitted_return || !cfg.rpc_url) throw new CallbackError('TRUSTED_RPC_REQUIRED')
      output = await reconcileSubmitted(database, cfg, submissionReader(cfg.rpc_url))
    }
  } finally { database.close() }
  process.stdout.write(`${JSON.stringify(output)}\n`)
} catch (error) {
  // Never emit exception messages/stacks: SQLite/JSON/provider errors can include private paths or raw bytes.
  process.stderr.write(`${error instanceof CallbackError ? error.code : 'CALLBACK_REJECTED'}\n`)
  process.exitCode = 1
}
