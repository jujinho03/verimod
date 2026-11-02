import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { VerifyReport, VerifyStep } from '../domain/verify'
import { VerificationStagePanel } from './VerificationStagePanel'
import { toW3VerificationStages } from './verificationStages'

const steps = (patch: Partial<Record<VerifyStep['id'], VerifyStep['state']>>): VerifyStep[] =>
  (['schema', 'hash', 'anchor', 'epoch', 'inclusion', 'finality'] as const).map((id) => ({ id, state: patch[id] ?? 'SKIPPED', detail: `${id} detail` }))

function report(patch: Partial<Record<VerifyStep['id'], VerifyStep['state']>>): VerifyReport {
  return {
    code: patch.epoch === 'PENDING' ? 'RPC_UNAVAILABLE' : patch.hash === 'FAILED' ? 'HASH_MISMATCH' : 'VALID',
    steps: steps(patch), body: null, claimedHash: null, recomputedHash: null, confirmations: null,
    manifest: { state: 'NOT_CHECKED', detail: '' }, content: { state: 'NOT_CHECKED', detail: '' }, lifecycle: { state: 'NOT_CHECKED', detail: '' },
  }
}

describe('W3 verification stage panel', () => {
  it('shows the actual six stages in execution order before execution', () => {
    const html = renderToStaticMarkup(<VerificationStagePanel />)
    expect(html.match(/class="verification-design__step /g)).toHaveLength(6)
    expect(html).toContain('verimod:receipt:v1')
    expect(html).toContain('ledger → epochs(epoch_id)')
    expect(toW3VerificationStages(null).map((stage) => stage.id)).toEqual(['schema', 'hash', 'anchor', 'epoch', 'inclusion', 'finality'])
  })

  it('keeps RPC unavailability pending and never turns it into tampering', () => {
    const stages = toW3VerificationStages(report({ hash: 'PASSED', anchor: 'PASSED', epoch: 'PENDING' }))
    expect(stages.find((stage) => stage.id === 'epoch')?.state).toBe('PENDING')
    expect(stages.find((stage) => stage.id === 'inclusion')?.state).toBe('SKIPPED')
    expect(stages.some((stage) => stage.state === 'FAILED')).toBe(false)
  })

  it('marks downstream stages as not executed after a hash mismatch', () => {
    const stages = toW3VerificationStages(report({ hash: 'FAILED' }))
    expect(stages.map((stage) => stage.state)).toEqual(['SKIPPED', 'FAILED', 'SKIPPED', 'SKIPPED', 'SKIPPED', 'SKIPPED'])
  })
})
