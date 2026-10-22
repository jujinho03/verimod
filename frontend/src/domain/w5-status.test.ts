import { describe, expect, it } from 'vitest'
import { checkManifests } from './manifestCheck'
import { manifestHashes, MODEL_MANIFEST, POLICY_MANIFEST, REVIEW_POLICY_MANIFEST } from './manifests'
import { syntheticLifecycleCase, type SyntheticCase } from './syntheticLifecycle'
import { verifyReceipt } from './verify'

describe('W5 synthetic state contract', () => {
  it.each([
    ['NORMAL', 'VALID', 'PASSED'], ['FORBIDDEN_TRANSITION', 'VALID', 'FAILED'],
    ['MISSING_HISTORY', 'VALID', 'INCOMPLETE_HISTORY'], ['PENDING_PREVIOUS', 'VALID', 'NOT_CHECKED'],
    ['RPC_FAILURE', 'RPC_UNAVAILABLE', 'NOT_CHECKED'], ['WRONG_REFERENCE', 'VALID', 'FAILED'],
  ] as const)('%s separates core %s from lifecycle %s', async (scenario, code, lifecycle) => {
    const f = await syntheticLifecycleCase(scenario as SyntheticCase)
    const original = JSON.stringify(f.bundles[0])
    const report = await verifyReceipt(f.bundles[2], f.context)
    expect(report.code).toBe(code)
    expect(report.lifecycle.state).toBe(lifecycle)
    expect(JSON.stringify(f.bundles[0])).toBe(original)
    expect(f.bundles.every((b) => b.anchor?.chain_id === '31337')).toBe(true)
  })
  it('requires actual manifest documents before reporting PASSED', async () => {
    const f = await syntheticLifecycleCase('NORMAL')
    const decision = f.bundles[0].receipt_body
    if (decision.event_kind !== 'DECISION') throw Error()
    const body = f.bundles[2].receipt_body
    if (body.event_kind !== 'REVIEW') throw Error()
    const known = await manifestHashes()
    const unknown = { ...body, payload: { ...body.payload, review_policy_manifest_hash: `0x${'f'.repeat(64)}` as const } }

    // A bundled hash allowlist is not evidence that a specific manifest body was verified.
    expect((await checkManifests(decision, known)).state).toBe('NOT_CHECKED')
    expect((await checkManifests(unknown, known)).state).toBe('NOT_CHECKED')
    expect((await checkManifests(decision, known, [{ kind: 'model', expected_hash: known.model, manifest: MODEL_MANIFEST }])).state).toBe('NOT_CHECKED')
    expect((await checkManifests(decision, known, [
      { kind: 'model', expected_hash: known.model, manifest: MODEL_MANIFEST },
      { kind: 'policy', expected_hash: known.policy, manifest: POLICY_MANIFEST },
    ])).state).toBe('PASSED')
    expect((await checkManifests(decision, known, [{ kind: 'model', expected_hash: known.model, manifest: { altered: true } }])).state).toBe('FAILED')

    // REVIEW has the same evidence requirement; APPEAL remains unreferenced.
    expect((await checkManifests(body, known)).state).toBe('NOT_CHECKED')
    expect((await checkManifests(body, known, [{ kind: 'review', expected_hash: known.review, manifest: { altered: true } }])).state).toBe('FAILED')
    expect((await checkManifests(body, known, [{ kind: 'review', expected_hash: known.review, manifest: REVIEW_POLICY_MANIFEST }])).state).toBe('PASSED')
    expect((await checkManifests(body, known, [{ kind: 'review', expected_hash: known.review, manifest: undefined }])).state).toBe('NOT_CHECKED')
  })
  it('manifest side checks never change a VALID core result', async () => {
    const f = await syntheticLifecycleCase('NORMAL')
    const report = await verifyReceipt(f.bundles[0], { ...f.context, manifestDocuments: [] })
    expect(report.code).toBe('VALID')
    expect(report.manifest.state).toBe('NOT_CHECKED')
  })
  it('unconfirmed current receipt cannot release a PASSED lifecycle', async () => {
    const f = await syntheticLifecycleCase('NORMAL')
    const report = await verifyReceipt({ ...f.bundles[2], proof: null, anchor: null }, f.context)
    expect(report.code).toBe('PENDING_ANCHOR')
    expect(report.lifecycle.state).toBe('NOT_CHECKED')
  })
})
