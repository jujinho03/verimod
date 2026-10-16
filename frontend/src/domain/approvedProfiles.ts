import { ISSUER_ID } from './receipt'
import type { TrustConfig } from './verify'

/** These are the only profiles a browser build may select. RPC URLs are callers' transport choices. */
export type ApprovedProfileId = 'BASE_SEPOLIA_DEMO' | 'LOCAL_HARDHAT_FALLBACK'

export interface ApprovedProfile extends TrustConfig {
  profile_id: ApprovedProfileId
  public_chain: boolean
}

export const APPROVED_PROFILES: Readonly<Record<ApprovedProfileId, ApprovedProfile>> = {
  BASE_SEPOLIA_DEMO: {
    profile_id: 'BASE_SEPOLIA_DEMO',
    chain_id: '84532',
    // W4 deployment; this is deliberately not the W3 synthetic-smoke address.
    contract_address: '0xd17ba590b23e984e3f3408bcdc3529be9868ec50',
    publisher: '0xd47675be41ec3476f541c1d8d8a9f622c90182ed',
    issuer_id: ISSUER_ID,
    protocol_version: 1,
    // Kept conservative until the team separately adopts a safe/finalized policy.
    min_confirmations: 12,
    public_chain: true,
  },
  LOCAL_HARDHAT_FALLBACK: {
    profile_id: 'LOCAL_HARDHAT_FALLBACK',
    chain_id: '31337',
    contract_address: '0x0000000000000000000000000000000000000451',
    publisher: '0x000000000000000000000000000000000000a451',
    issuer_id: ISSUER_ID,
    protocol_version: 1,
    min_confirmations: 1,
    public_chain: false,
  },
}

export function approvedProfile(id: string): ApprovedProfile {
  if (id === 'BASE_SEPOLIA_DEMO' || id === 'LOCAL_HARDHAT_FALLBACK') return APPROVED_PROFILES[id]
  throw new Error('승인되지 않은 TrustProfile입니다')
}
