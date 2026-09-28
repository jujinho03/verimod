/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { canonicalize } from './canonical'
import { parseUniqueJson } from './json'
import { receiptHash } from './receipt'
import { validateReceiptBody } from './schema'

const fixture = (name: string) => JSON.parse(readFileSync(new URL('../../../docs/examples/' + name, import.meta.url), 'utf8'))
const valid = fixture('01-valid.json')
const tampered = fixture('02-tampered.json')
const rehashed = fixture('03-rehashed.json')
const clone = <T>(value: T): T => structuredClone(value)

describe('W2 RCPT-03/04 regression matrix (20/20)', () => {
  it.each([
    ['normal-valid', valid],
    ['normal-tampered-body', tampered],
    ['normal-rehashed', rehashed],
  ])('%s has valid ReceiptBody bytes/hash', async (_id, bundle) => {
    expect(validateReceiptBody(bundle.receipt_body).ok).toBe(true)
    const expected = bundle === tampered ? rehashed.receipt_hash : bundle.receipt_hash
    expect(await receiptHash(bundle.receipt_body)).toBe(expected)
  })

  it.each([
    ['top-level', { b: 2, a: 1 }, { a: 1, b: 2 }],
    ['nested', { x: { z: 2, a: 1 } }, { x: { a: 1, z: 2 } }],
    ['receipt-body', valid.receipt_body, Object.fromEntries(Object.entries(valid.receipt_body).reverse())],
  ])('%s key order is deterministic', (_id, a, b) => expect(canonicalize(a)).toBe(canonicalize(b)))

  it.each([
    ['korean', '한글 영수증'],
    ['astral', '😀'],
    ['no-nfc', 'e\u0301'],
  ])('%s Unicode is preserved', (_id, text) => expect(canonicalize({ text })).toContain(text))

  it('accepts required nulls', () => expect(validateReceiptBody(valid.receipt_body).ok).toBe(true))
  it('rejects a required field omission', () => {
    const body = clone(valid.receipt_body); delete body.subject_receipt_hash
    expect(validateReceiptBody(body).ok).toBe(false)
  })
  it('distinguishes null from omission', () => expect(canonicalize({ x: null })).not.toBe(canonicalize({})))

  it.each([
    ['max-safe', Number.MAX_SAFE_INTEGER, true],
    ['min-safe', Number.MIN_SAFE_INTEGER, true],
    ['unsafe', Number.MAX_SAFE_INTEGER + 1, false],
  ])('%s integer boundary', (_id, value, accepted) => {
    if (accepted) expect(canonicalize({ value })).toContain(String(value))
    else expect(() => canonicalize({ value })).toThrow()
  })

  it.each([
    ['literal duplicate', '{"x":1,"x":2}'],
    ['escaped duplicate', '{"x":1,"\\u0078":2}'],
  ])('%s is rejected through parseUniqueJson', (_id, raw) => expect(() => parseUniqueJson(raw)).toThrow('중복 JSON key'))

  it.each([
    ['valid time', '2026-09-08T01:12:30.000Z', true],
    ['invalid date', '2026-02-30T01:12:30.000Z', false],
    ['invalid format', '2026-09-08T01:12:30Z', false],
  ])('%s timestamp rule', (_id, recordedAt, accepted) => {
    const body = clone(valid.receipt_body); body.recorded_at = recordedAt
    expect(validateReceiptBody(body).ok).toBe(accepted)
  })
})
