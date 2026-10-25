import { canonicalBytes } from './canonical'
import { domainHash, DOMAINS, type Hex32 } from './hash'
import type { ManifestHashes } from './manifests'
import type { ReceiptBody } from './types'
import type { SideCheck } from './verify'

export interface PublicManifestDocument {
  kind: 'model' | 'policy' | 'review'
  expected_hash: Hex32
  manifest: unknown
}

export async function checkManifests(body: ReceiptBody, _known: ManifestHashes, documents: PublicManifestDocument[] = []): Promise<SideCheck> {
  if (body.event_kind === 'APPEAL') return { state: 'NOT_CHECKED', detail: '이의제기 기록은 manifest를 참조하지 않습니다' }
  const refs = body.event_kind === 'REVIEW'
    ? [{ kind: 'review' as const, hash: body.payload.review_policy_manifest_hash }]
    : [{ kind: 'model' as const, hash: body.payload.inference.model_manifest_hash },
      { kind: 'policy' as const, hash: body.payload.policy.policy_manifest_hash }]
  for (const ref of refs) {
    const doc = documents.find((d) => d.kind === ref.kind && d.expected_hash === ref.hash)
    if (!doc) return { state: 'NOT_CHECKED', detail: '참조 해시는 알지만 신뢰할 수 있는 manifest 원문을 확보하지 못했습니다.' }
    try {
      const computed = await domainHash(ref.kind === 'model' ? DOMAINS.model : DOMAINS.policy, canonicalBytes(doc.manifest))
      if (computed !== ref.hash) return { state: 'FAILED', detail: '제공된 manifest 원문의 계산 해시가 참조 해시와 다릅니다.' }
    } catch {
      return { state: 'NOT_CHECKED', detail: '제공된 manifest 원문을 읽거나 계산할 수 없습니다.' }
    }
  }
  return { state: 'PASSED', detail: '제공된 manifest 원문의 계산 해시가 모든 참조 해시와 일치합니다.' }
}
