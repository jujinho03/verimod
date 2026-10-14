/** Read-only validation of live AI-09 outputs by existing Node consumer. */
import { readFileSync } from 'node:fs'
import { assertValidInference } from '../../backend/src/inference.js'
import { canonicalBytes } from '../../shared/protocol/src/canonical.js'
import { DOMAINS, domainHash } from '../../shared/protocol/src/hash.js'

const [reportPath, manifestPath] = process.argv.slice(2)
const report = JSON.parse(readFileSync(reportPath, 'utf8'))
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const hash = await domainHash(DOMAINS.model, canonicalBytes(manifest))
for (const row of report.success_responses) {
  if (row.response.inference.model_manifest_hash !== hash) throw new Error('Manifest hash mismatch')
  assertValidInference(row.response.inference, row.request.content_commitment)
}
console.log(JSON.stringify({status: 'PASS', checked: report.success_responses.length, model_manifest_hash: hash}))
