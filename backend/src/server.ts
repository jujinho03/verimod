import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createApp } from './app.js'
import { openDatabase } from './database.js'
import {
  createHttpInferenceAdapter,
  createThresholdPolicyEvaluator,
  unavailableInferenceAdapter,
  unavailablePolicyEvaluator,
} from './inference.js'
import type { Hex32 } from '@verimod/protocol/hash'
import { autoAnchorConfig } from './autoAnchor.js'
import { AutoAnchorBatcher } from './autoAnchor.js'
import { JsonRpcProvider } from 'ethers'
import { confirmationReader, verifyAndConfirm } from './trustedConfirmation.js'
import type { CallbackApproval } from './durabilityCallback.js'

const port = Number(process.env.PORT ?? 3001)
const databasePath = resolve(process.env.VERIMOD_DB_PATH ?? './data/verimod.sqlite')
mkdirSync(dirname(databasePath), { recursive: true })
const database = openDatabase(databasePath)
const localW4E2E = process.env.VERIMOD_W4_PROVISIONAL_E2E_ONLY === 'true'
function loadManifest(path: string | undefined): unknown {
  if (!path) return undefined
  try { return JSON.parse(readFileSync(resolve(path), 'utf8')) } catch { return undefined }
}
const modelManifest = loadManifest(process.env.VERIMOD_MODEL_MANIFEST_PATH)
const policyManifest = loadManifest(process.env.VERIMOD_POLICY_MANIFEST_PATH)
const inferenceEndpoint = process.env.VERIMOD_INFERENCE_URL?.trim()
function isLocalEndpoint(endpoint: string | undefined): boolean {
  if (!endpoint) return false
  try {
    const url = new URL(endpoint)
    return ['http:', 'https:'].includes(url.protocol) && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
  } catch { return false }
}
const localEndpoint = isLocalEndpoint(inferenceEndpoint)
const inference = localW4E2E && localEndpoint && inferenceEndpoint
  ? createHttpInferenceAdapter({ endpoint: inferenceEndpoint, timeoutMs: Number(process.env.VERIMOD_INFERENCE_TIMEOUT_MS ?? 8_000) })
  : unavailableInferenceAdapter
const policyValues = [
  process.env.VERIMOD_POLICY_MANIFEST_HASH,
  process.env.VERIMOD_HATE_REVIEW_PPM,
  process.env.VERIMOD_HATE_RESTRICT_PPM,
  process.env.VERIMOD_OFFENSIVE_REVIEW_PPM,
  process.env.VERIMOD_OFFENSIVE_RESTRICT_PPM,
]
let policy = unavailablePolicyEvaluator
if (localW4E2E && policyManifest && policyValues.every((value) => typeof value === 'string' && value.trim() !== '')) {
  try { policy = createThresholdPolicyEvaluator({
      policyManifestHash: policyValues[0] as Hex32,
      policyManifest,
      localW4E2E,
      hate: { review: Number(policyValues[1]), restrict: Number(policyValues[2]) },
      offensive: { review: Number(policyValues[3]), restrict: Number(policyValues[4]) },
    }) } catch { policy = unavailablePolicyEvaluator }
}

const autoAnchor = autoAnchorConfig()
let confirmationProgress: ((txHash: string) => Promise<number>) | undefined
if (autoAnchor) {
  const endpoint = process.env.VERIMOD_AUTO_ANCHOR_RPC_URL ?? 'https://sepolia.base.org'
  database.exec('PRAGMA synchronous=FULL')
  const provider = new JsonRpcProvider(endpoint, 84532, { staticNetwork: true })
  confirmationProgress = async (txHash) => {
    const receipt = await provider.getTransactionReceipt(txHash)
    if (!receipt) return 0
    return Math.max(0, (await provider.getBlockNumber()) - receipt.blockNumber + 1)
  }
  const batcher = new AutoAnchorBatcher(database, autoAnchor, provider)
  let busy = false
  const tick = async () => {
    if (busy) return
    busy = true
    try {
      const pending = database.prepare("SELECT * FROM epochs WHERE status='SUBMITTED' ORDER BY CAST(epoch_id AS INTEGER) LIMIT 1").get() as import('./epochs.js').EpochView | undefined
      if (pending) {
        const cfg: CallbackApproval = {
          schema_version: 'w4-f-callback-approval/1', mode: 'AUTO_DEMO', approval_id: 'auto-demo-local', database_path: databasePath,
          database_identity: { dev: '0', ino: '1' }, epoch: { epochId: pending.epoch_id, root: pending.merkle_root, count: String(pending.receipt_count), protocolVersion: String(pending.protocol_version) },
          target: autoAnchor.target, policy_status: 'W4_PROVISIONAL_E2E_ONLY', team_approved: false,
          allow_confirmed_return: true, confirmation_approval_id: 'auto-demo-confirmation', minimum_confirmations: 12,
        }
        try { await verifyAndConfirm(database, cfg, confirmationReader(endpoint)) } catch { /* Remain SUBMITTED and retry on next tick. */ }
      }
      await batcher.tick()
    } catch { /* Preserve pending state for a later retry. */ }
    finally { busy = false }
  }
  setInterval(() => { void tick() }, 5000)
  void tick()
}
createApp({ database, inference, policy, modelManifest: localW4E2E ? modelManifest : undefined, autoAnchor, confirmationProgress }).listen(port, '127.0.0.1', () => {
  console.log(`verimod-backend listening on http://127.0.0.1:${port}`)
})
