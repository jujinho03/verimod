import type { EpochMember } from '../domain/epoch'
import { bytesToHex, domainHash, sha256, utf8, type Hex32 } from '../domain/hash'
import { manifestHashes } from '../domain/manifests'
import { evaluatePolicy } from '../domain/policy'
import {
  appealCommitment,
  buildAppeal,
  buildDecision,
  buildReview,
  contentCommitment,
  isoTime,
  receiptHash,
} from '../domain/receipt'
import { runSyntheticInference } from '../domain/scorer'
import type { DecisionBody, ReceiptBody } from '../domain/types'
import { sealEpoch } from './ledger'
import type { AppState, StoredReceipt } from './state'

/** 합성 시드. 실제 이용자·판정 기록이 아니다. 시각과 ID를 고정해 매번 같은 해시가 나온다. */
export const SEED_TEXTS = {
  allow: '주말에 한강에서 자전거 탔는데 날씨가 정말 좋았어요. 다음 주에도 같이 갈 분 계신가요?',
  restrict: '이번 영화 결말 진짜 죽여주네요. 배우들이 연기로 극장을 부숴 버렸어요.',
  review: '주문한 지 2주째인데 답도 없고 진짜 짜증나네요. 환불 절차 좀 알려주세요.',
  appeal: '영화를 칭찬하는 표현이었습니다. 누구를 해치자는 뜻이 아닙니다.',
} as const

async function seedSalt(key: string): Promise<Hex32> {
  return bytesToHex(await sha256(utf8(`verimod-seed-salt:${key}`)))
}

async function fillers(epochId: string, count: number): Promise<EpochMember[]> {
  const out: EpochMember[] = []
  for (let i = 0; i < count; i++) {
    const h = (await domainHash('verimod:seed-filler-id:v1', utf8(`${epochId}:${i}`))).slice(2)
    const variant = '89ab'[Number.parseInt(h[16], 16) % 4]
    out.push({
      receipt_id: `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`,
      receipt_hash: await domainHash('verimod:seed-filler:v1', utf8(`${epochId}:${i}`)),
    })
  }
  return out
}

export async function buildSeedState(): Promise<AppState> {
  const manifests = await manifestHashes()
  const contents: AppState['contents'] = {}
  const appeals: AppState['appeals'] = {}

  const decide = async (key: 'allow' | 'restrict' | 'review', receiptId: string, inferenceId: string, recordedAt: string) => {
    const salt = await seedSalt(key)
    const text = SEED_TEXTS[key]
    const commitment = await contentCommitment(salt, text)
    contents[commitment] = { salt, text }
    const inference = await runSyntheticInference(text, {
      inferenceId,
      inferredAt: isoTime(Date.parse(recordedAt) - 400),
      contentCommitment: commitment,
      modelManifestHash: manifests.model,
    })
    return buildDecision({ receiptId, recordedAt, inference, policy: evaluatePolicy(inference, manifests.policy) })
  }

  const allow = await decide('allow', '3b8f5a1c-2d4e-4f60-8a7b-9c0d1e2f3a41', '7a1c4e2b-9d3f-4b6a-8c5e-1f2a3b4c5d61', '2026-09-08T01:04:12.000Z')
  const restrict = await decide('restrict', 'a91d3c07-6e2b-4b58-9f14-2c7e8d0b5a63', '8b2d5f3c-0e4a-4c7b-9d6f-2a3b4c5d6e72', '2026-09-08T01:12:30.000Z')
  const review = await decide('review', 'c47e2b19-8d3a-4e71-a5c2-6b9f0e1d7a24', '9c3e6a4d-1f5b-4d8c-ae7a-3b4c5d6e7f83', '2026-09-08T01:26:05.000Z')
  const restrictHash = await receiptHash(restrict)

  const appealSalt = await seedSalt('appeal')
  const appealC = await appealCommitment(appealSalt, SEED_TEXTS.appeal)
  appeals[appealC] = { salt: appealSalt, text: SEED_TEXTS.appeal }
  const appeal = buildAppeal({
    receiptId: 'e5b0d8f2-1c7a-4d93-8e6b-3a2f9c4d1b85',
    recordedAt: '2026-09-08T02:41:10.000Z',
    decision: restrict,
    decisionHash: restrictHash,
    appealCommitment: appealC,
    reasonCode: 'CONTEXT_MISSING',
  })
  const appealHash = await receiptHash(appeal)

  const overturn = buildReview({
    receiptId: '0f6a9e3b-4d2c-4a17-b8e5-7c1d2f6a9e30',
    recordedAt: '2026-09-09T09:48:33.000Z',
    decision: restrict,
    decisionHash: restrictHash,
    previousHash: appealHash,
    outcome: 'OVERTURN',
    resultingAction: 'ALLOW',
    reasonCodes: ['CONTEXT_NOT_HARMFUL', 'FALSE_POSITIVE_SLANG'],
    reviewPolicyHash: manifests.review,
  })

  const receipts: StoredReceipt[] = []
  const epochs: AppState['epochs'] = []
  const batches: { id: string; frozenAt: string; bodies: ReceiptBody[]; others: number }[] = [
    { id: '1', frozenAt: '2026-09-08T01:30:00.000Z', bodies: [allow, restrict, review], others: 4 },
    { id: '2', frozenAt: '2026-09-08T03:00:00.000Z', bodies: [appeal], others: 2 },
    { id: '3', frozenAt: '2026-09-09T10:00:00.000Z', bodies: [overturn], others: 4 },
  ]

  for (const batch of batches) {
    const mine = await Promise.all(batch.bodies.map(async (body) => ({ body, hash: await receiptHash(body) })))
    const { epoch, proofs } = await sealEpoch(
      batch.id,
      mine.map((m) => ({ receipt_id: m.body.receipt_id, receipt_hash: m.hash })),
      await fillers(batch.id, batch.others),
      Date.parse(batch.frozenAt),
    )
    epochs.push(epoch)
    for (const m of mine) {
      receipts.push({
        hash: m.hash,
        body: m.body,
        issued_at: Date.parse(m.body.recorded_at),
        epoch_id: batch.id,
        proof: proofs[m.hash],
        seeded: true,
      })
    }
  }

  return { schema: 1, receipts, epochs, contents, appeals, rpc_down: false }
}

export function isDecision(body: ReceiptBody): body is DecisionBody {
  return body.event_kind === 'DECISION'
}
