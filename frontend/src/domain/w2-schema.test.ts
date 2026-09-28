import { beforeAll, describe, expect, it } from 'vitest'
import { buildSeedState } from '../store/seed'
import { validateReceiptBody } from './schema'
import type { ReceiptBody } from './types'

const HASH = '0xabababababababababababababababababababababababababababababababab'

describe('W2 ReceiptBody schema rejection matrix', () => {
  let decision: ReceiptBody
  let review: ReceiptBody

  beforeAll(async () => {
    const receipts = (await buildSeedState()).receipts.map((item) => item.body)
    decision = receipts.find((body) => body.event_kind === 'DECISION')!
    review = receipts.find((body) => body.event_kind === 'REVIEW')!
  })

  it.each([
    ['required field omitted', (body: ReceiptBody) => { const x = structuredClone(body) as unknown as Record<string, unknown>; delete x.issuer_id; return x }],
    ['unknown field', (body: ReceiptBody) => ({ ...structuredClone(body), unexpected: true })],
    ['DECISION subject must be null', (body: ReceiptBody) => ({ ...structuredClone(body), subject_receipt_hash: HASH })],
    ['REVIEW requires a reason', (body: ReceiptBody) => ({ ...structuredClone(body), payload: { ...(structuredClone(body) as typeof review).payload, reason_codes: [] } })],
    ['REVIEW rejects an unknown outcome', (body: ReceiptBody) => ({ ...structuredClone(body), payload: { ...(structuredClone(body) as typeof review).payload, outcome: 'PENDING' } })],
  ])('%s is rejected at runtime', (name, mutate) => {
    const source = name.startsWith('REVIEW') ? review : decision
    expect(validateReceiptBody(mutate(source)).ok).toBe(false)
  })
})
