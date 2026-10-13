import { mkdirSync } from 'node:fs'
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
const inferenceEndpoint = process.env.VERIMOD_INFERENCE_URL?.trim()
const inference = inferenceEndpoint
  ? createHttpInferenceAdapter({ endpoint: inferenceEndpoint, timeoutMs: Number(process.env.VERIMOD_INFERENCE_TIMEOUT_MS ?? 8_000) })
  : unavailableInferenceAdapter
const policyValues = [
  process.env.VERIMOD_POLICY_MANIFEST_HASH,
  process.env.VERIMOD_HATE_REVIEW_PPM,
  process.env.VERIMOD_HATE_RESTRICT_PPM,
  process.env.VERIMOD_OFFENSIVE_REVIEW_PPM,
  process.env.VERIMOD_OFFENSIVE_RESTRICT_PPM,
]
const policy = policyValues.every((value) => typeof value === 'string' && value.trim() !== '')
  ? createThresholdPolicyEvaluator({
      policyManifestHash: policyValues[0] as Hex32,
      hate: { review: Number(policyValues[1]), restrict: Number(policyValues[2]) },
      offensive: { review: Number(policyValues[3]), restrict: Number(policyValues[4]) },
    })
  : unavailablePolicyEvaluator

createApp({ database, inference, policy }).listen(port, () => {
  console.log(`verimod-backend listening on http://localhost:${port}`)
})
