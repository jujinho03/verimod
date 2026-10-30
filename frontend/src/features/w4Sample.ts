import original from '../../../docs/handoffs/w4-anchored-epoch-public/20261020-r01/receipt-0.bundle.json?raw'
import { receiptHash } from '../domain/receipt'
import { parseBundleJson } from '../domain/schema'
import type { ApprovedTrustProfile } from '../domain/rpcLedger'

// Import the evidence itself: there is no second, independently maintained fixture.
export const w4OriginalJson = original

// This shortcut is only for the specific published W4 trust profile. Other profiles can
// still use the regular file/paste verifier, without a misleading W4 shortcut label.
export function isW4Profile(profile: ApprovedTrustProfile | null): boolean {
  const urls = ['https://base-sepolia-rpc.publicnode.com', 'https://sepolia.base.org']
  return profile !== null && profile.chain_id === '84532'
    && profile.contract_address === '0xd17ba590b23e984e3f3408bcdc3529be9868ec50'
    && profile.publisher === '0xd47675be41ec3476f541c1d8d8a9f622c90182ed'
    && profile.deployment_block === 48012271 && profile.min_confirmations >= 12
    && profile.rpc_urls.length === urls.length && urls.every((url) => profile.rpc_urls.includes(url))
}

export async function w4TamperedJson(rehash: boolean): Promise<string> {
  const parsed = parseBundleJson(w4OriginalJson)
  if (!parsed.ok || parsed.value.receipt_body.event_kind !== 'DECISION') throw new Error('W4 sample invalid')
  const copy = structuredClone(parsed.value)
  if (copy.receipt_body.event_kind !== 'DECISION') throw new Error('W4 sample is not a decision')
  const policy = copy.receipt_body.payload.policy
  policy.action = policy.action === 'ALLOW' ? 'RESTRICT' : 'ALLOW'
  if (rehash) copy.receipt_hash = await receiptHash(copy.receipt_body)
  return JSON.stringify(copy, null, 2)
}
