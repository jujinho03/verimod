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

export async function checkManifests(body: ReceiptBody, known: ManifestHashes, documents: PublicManifestDocument[] = []): Promise<SideCheck> {
  if (body.event_kind === 'APPEAL') return { state: 'NOT_CHECKED', detail: '이의제기 기록은 manifest를 참조하지 않습니다' }
  const refs = body.event_kind === 'REVIEW'
    ? [{ kind: 'review' as const, hash: body.payload.review_policy_manifest_hash }]
    : [{ kind: 'model' as const, hash: body.payload.inference.model_manifest_hash },
      { kind: 'policy' as const, hash: body.payload.policy.policy_manifest_hash }]
  let unavailable = false
  for (const ref of refs) {
    const doc = documents.find((d) => d.kind === ref.kind && d.expected_hash === ref.hash)
    if (doc) {
      try {
        const computed = await domainHash(ref.kind === 'model' ? DOMAINS.model : DOMAINS.policy, canonicalBytes(doc.manifest))
        if (computed !== ref.hash) return { state: 'FAILED', detail: '알려진 manifest의 실제 내용과 참조 해시가 다릅니다.' }
      } catch { return { state: 'NOT_CHECKED', detail: '공개 manifest 내용을 계산할 수 없습니다.' } }
    } else if (known[ref.kind] !== ref.hash) unavailable = true
  }
  return unavailable
    ? { state: 'NOT_CHECKED', detail: '참조된 manifest가 공개 목록에 없어 보조 검사를 완료하지 못했습니다.' }
    : { state: 'PASSED', detail: '공개된 manifest의 계산 해시와 일치합니다.' }
}
