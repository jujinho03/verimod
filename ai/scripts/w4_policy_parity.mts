/** Execute the pinned F evaluator and T canonical/hash functions, without policy edits. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'

const [froot, troot, publicDir, mode] = process.argv.slice(2)
const load = (p: string) => JSON.parse(readFileSync(resolve(publicDir, p), 'utf8'))
const save = (p: string, v: unknown) => writeFileSync(resolve(publicDir, p), JSON.stringify(v, null, 2) + '\n', { flag: 'wx' })
const moduleAt = (p: string) => import(pathToFileURL(resolve(p)).href)
const { canonicalBytes } = await moduleAt(`${troot}/canonical.ts`)
const { DOMAINS, domainHash } = await moduleAt(`${troot}/hash.ts`)
const manifest = load('policy_manifest.json')
const canonical = canonicalBytes(manifest)
const hash = await domainHash(DOMAINS.policy, canonical)
if (mode === 'hash') {
  assert.equal(existsSync(resolve(publicDir, 'policy_manifest.canonical.json')), false)
  writeFileSync(resolve(publicDir, 'policy_manifest.canonical.json'), canonical, { flag: 'wx' })
  save('policy_hash.json', { policy_manifest_hash: hash, domain: DOMAINS.policy,
    mechanism: 'T canonicalBytes(manifest) + domainHash(DOMAINS.policy, canonicalBytes)',
    manifest_file_sha256: createHash('sha256').update(readFileSync(resolve(publicDir, 'policy_manifest.json'))).digest('hex'),
    canonical_bytes_sha256: createHash('sha256').update(canonical).digest('hex'), canonical_length: canonical.length })
  console.log(JSON.stringify({ status: 'HASHED', policy_manifest_hash: hash }))
} else {
  const started = performance.now()
  const { createThresholdPolicyEvaluator, assertValidPolicy } = await moduleAt(`${froot}/backend/src/inference.ts`)
  const policy = createThresholdPolicyEvaluator({ policyManifestHash: hash, policyManifest: manifest, localW4E2E: true, ...manifest.thresholds_ppm })
  const vectors = load('policy_vectors.json')
  assert.equal(vectors.policy_manifest_hash, hash)
  const results = []
  for (const vector of vectors.vectors) {
    const actual = await policy.evaluate(vector)
    assertValidPolicy(actual)
    const equal = JSON.stringify(actual) === JSON.stringify(vector.expected)
    results.push({ id: vector.id, status: equal ? 'PASS' : 'FAIL', expected: vector.expected, actual })
  }
  const passed = results.every(r => r.status === 'PASS')
  save('policy_parity.json', { status: passed ? 'PASS' : 'FAIL', vector_count: results.length,
    policy_manifest_hash: hash, elapsed_ms: performance.now() - started, results })
  console.log(JSON.stringify({ status: passed ? 'PASS' : 'FAIL', vectors: results.length, policy_manifest_hash: hash }))
  if (!passed) process.exitCode = 1
}
