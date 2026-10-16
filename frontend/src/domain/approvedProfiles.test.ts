import { describe, expect, it } from 'vitest'
import { ISSUER_ID, issuerCommitment } from './receipt'
import { APPROVED_PROFILES, approvedProfile } from './approvedProfiles'

describe('W4 approved issuer profiles', () => {
  it('uses the receipt issuer for both selectable profiles', () => {
    expect(ISSUER_ID).toBe('verimod-example-platform')
    expect(APPROVED_PROFILES.BASE_SEPOLIA_DEMO.issuer_id).toBe(ISSUER_ID)
    expect(APPROVED_PROFILES.LOCAL_HARDHAT_FALLBACK.issuer_id).toBe(ISSUER_ID)
    expect(APPROVED_PROFILES.BASE_SEPOLIA_DEMO.public_chain).toBe(true)
    expect(APPROVED_PROFILES.LOCAL_HARDHAT_FALLBACK.public_chain).toBe(false)
  })

  it('keeps the authoritative issuer commitment stable', async () => {
    await expect(issuerCommitment(APPROVED_PROFILES.BASE_SEPOLIA_DEMO.issuer_id))
      .resolves.toBe('0xf33ae051ff115acdd407db30a10b64b680621b2a2967871a48bcc30b9aa16fd5')
  })

  it('does not permit caller-supplied profiles', () => {
    expect(() => approvedProfile('verimod-demo-issuer')).toThrow('승인되지 않은 TrustProfile입니다')
  })
})
