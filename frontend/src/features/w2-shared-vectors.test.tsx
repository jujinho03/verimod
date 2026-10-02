/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import { canonicalize } from '../domain/canonical'
import { validateReceiptBody } from '../domain/schema'
import { verifyReceipt, type VerifyCode } from '../domain/verify'
import { VeriModStore } from '../store/store'
import { DecisionResult } from './DecisionResult'
import { VerifyReportView } from './VerifyReportView'

const read = (path: string) => JSON.parse(readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8'))
const matrix = read('shared/vectors/receipt-regression-v1.json') as { cases: { id: string }[] }
const vectors = read('shared/vectors/receipt-regression-results.json') as {
  cases: { id: string; input: unknown }[]
}
const valid = read('docs/examples/01-valid.json')
const acceptedCodes: Record<string, VerifyCode> = {
  'normal-valid': 'VALID', 'normal-tampered-body': 'HASH_MISMATCH',
  'normal-rehashed': 'INVALID_PROOF', 'key-receipt-body': 'VALID',
  'null-required': 'VALID', 'time-valid': 'VALID',
}

/** Resolve T's documented references; canonical-only inputs stay non-receipts. */
function resolve(id: string, input: unknown): unknown {
  if (id.startsWith('normal-')) {
    if (typeof input !== 'string' || !/^docs\/examples\/0[123]-[a-z]+\.json#\/receipt_body$/.test(input)) {
      throw new Error(`Unknown receipt reference: ${id}`)
    }
    return read(input.split('#')[0])
  }
  if (id === 'key-receipt-body' || id === 'null-required' || id === 'required-omitted' || id.startsWith('time-')) {
    const bundle = structuredClone(valid)
    if (id === 'key-receipt-body') bundle.receipt_body = Object.fromEntries(Object.entries(bundle.receipt_body).reverse())
    if (id === 'required-omitted') delete bundle.receipt_body.subject_receipt_hash
    if (id.startsWith('time-')) bundle.receipt_body.recorded_at = input
    return bundle
  }
  return input
}

let store: VeriModStore
beforeAll(async () => { store = await VeriModStore.open(null, () => Date.parse('2026-10-01T00:00:00Z')) })

describe('F UI consumption of T shared regression vectors', () => {
  it('uses every ID from the T-owned 20-case matrix exactly once', () => {
    expect(vectors.cases).toHaveLength(20)
    expect(new Set(vectors.cases.map((v) => v.id)).size).toBe(20)
    expect(vectors.cases.map((v) => v.id).sort()).toEqual(matrix.cases.map((v) => v.id).sort())
  })

  it.each(vectors.cases)('$id renders a safe report or decision card', async ({ id, input }) => {
    const candidate = resolve(id, input)
    const report = await verifyReceipt(candidate, await store.verifierContext())
    expect(report.code).toBe(acceptedCodes[id] ?? 'INVALID_SCHEMA')
    const html = renderToStaticMarkup(<VerifyReportView report={report} />)
    expect(html).toContain(report.code)
    let card: string | null = null
    if (candidate && typeof candidate === 'object' && 'receipt_body' in candidate) {
      const parsed = validateReceiptBody(candidate.receipt_body)
      if (parsed.ok && parsed.value.event_kind === 'DECISION') {
        const body = parsed.value
        const own = store.getState().contents[body.content_commitment]
        if (!own) throw new Error(`Missing synthetic seed text for ${id}`)
        card = renderToStaticMarkup(<DecisionResult draft={{ ...own, ...body.payload }} stale={false} busy={false} issuing={false} onIssue={() => {}} />)
        expect(card).not.toContain(own.salt)
        expect(card).toContain('사유 코드')
        // Consumer rendering must not mutate the producer's canonical bytes.
        expect(canonicalize(candidate.receipt_body)).toBe(canonicalize(body))
      }
    }
    expect({ report: html.match(/<div class="verdict[\s\S]*?<\/div>/)?.[0],
      steps: report.steps.map(({ id, state }) => ({ id, state })), card }).toMatchSnapshot()
  })
})
