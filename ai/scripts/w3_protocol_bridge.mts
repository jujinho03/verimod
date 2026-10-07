/** ESM thin caller of T-owned protocol functions. No canonical/hash implementation here. */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { canonicalBytes } from '../../shared/protocol/src/canonical.js'
import { DOMAINS, domainHash } from '../../shared/protocol/src/hash.js'
import * as sharedHash from '../../shared/protocol/src/hash.js'
import { contentCommitment } from '../../shared/protocol/src/receipt.js'
import { validateReceiptBody } from '../../shared/protocol/src/schema.js'
import { LABEL_IDS, PROTOCOL_VERSION } from '../../shared/protocol/src/types.js'

const [manifestPath, inputPath, consumerRef] = process.argv.slice(2)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''))
const modelHash = await domainHash(DOMAINS.model, canonicalBytes(manifest))
const result: Record<string, unknown> = {
  model_manifest_hash: modelHash, mechanism: 'domainHash(DOMAINS.model, canonicalBytes(manifest))',
  modules: ['shared/protocol/src/canonical.ts', 'shared/protocol/src/hash.ts'],
  protocol_version: PROTOCOL_VERSION, domain: DOMAINS.model,
  reference_call: 'shared/protocol/src/manifests.ts:manifestHashes',
}
if (inputPath) {
  const data = JSON.parse(readFileSync(inputPath, 'utf8').replace(/^\uFEFF/, ''))
  if (Array.isArray(data)) {
    result.content_commitments = await Promise.all(data.map(async (row, i) => ({
      fixture_id: row.fixture_id,
      synthetic_public_salt: `0x${(i + 1).toString(16).padStart(2, '0').repeat(32)}`,
      content_commitment: await contentCommitment(`0x${(i + 1).toString(16).padStart(2, '0').repeat(32)}`, row.synthetic_text),
    })))
  } else {
    if (data.model_manifest_hash !== modelHash) throw new Error('Manifest reference mismatch')
    result.shared_label_ids = LABEL_IDS
    result.shared_receipt_schema_probes = data.results.map((row) => {
      // Only a schema probe; no issuance, policy selection, hash, persistence or anchor.
      const body = {
        protocol_version: PROTOCOL_VERSION, receipt_id: row.i1_response.inference.inference_id,
        issuer_id: 'synthetic-schema-probe', issuer_seq: 1, event_kind: 'DECISION',
        recorded_at: row.i1_response.inference.inferred_at,
        content_commitment: row.i1_response.inference.content_commitment,
        subject_receipt_hash: null, previous_receipt_hash: null,
        payload: { inference: row.i1_response.inference, policy: {
          policy_manifest_hash: `0x${'0'.repeat(64)}`, action: 'HUMAN_REVIEW',
          reason_codes: ['SCHEMA_PROBE_ONLY'], triggered_rule_ids: [],
        } },
      }
      return { fixture_id: row.fixture_id, validation: validateReceiptBody(body) }
    })
    result.receipts_issued = 0
    if (consumerRef) {
      if (!/^[0-9a-f]{40}$/.test(consumerRef)) throw new Error('Consumer ref must be immutable')
      const source = execFileSync('git', ['show', `${consumerRef}:backend/src/inference.ts`], { encoding: 'utf8' })
      const require = createRequire(new URL('../../backend/package.json', import.meta.url))
      const { transformSync } = require('esbuild')
      const compiled = transformSync(source, { loader: 'ts', format: 'cjs', target: 'es2022' })
      const module = { exports: {} as { assertValidInference: (value: unknown, commitment: string) => void } }
      // Execute the exact F Git blob after TS erasure, with backend's existing module resolver.
      const consumerRequire = (id: string) => id === '@verimod/protocol/hash' ? sharedHash : require(id)
      new Function('require', 'module', 'exports', compiled.code)(consumerRequire, module, module.exports)
      result.f_consumer_ref = consumerRef
      result.f_consumer_path = 'backend/src/inference.ts'
      result.f_consumer_checks = data.results.map((row) => {
        module.exports.assertValidInference(row.i1_response.inference, row.i1_response.inference.content_commitment)
        return { fixture_id: row.fixture_id, status: 'PASS' }
      })
    }
  }
}
console.log(JSON.stringify(result, null, 2))
