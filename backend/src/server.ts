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

createApp({ database, inference, policy, modelManifest: localW4E2E ? modelManifest : undefined }).listen(port, '127.0.0.1', () => {
  console.log(`verimod-backend listening on http://127.0.0.1:${port}`)
})
