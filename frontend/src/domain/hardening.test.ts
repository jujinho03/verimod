/// <reference types="node" />
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { canonicalize, CanonicalizationError } from './canonical'
import { freezeEpoch } from './epoch'
import { bytesToHex, hexToBytes, utf8, type Hex32 } from './hash'
import { MAX_JSON_BYTES, parseUniqueJson } from './json'
import { inclusionProof, merkleRoot, verifyInclusion } from './merkle'
import { evaluatePolicy } from './policy'
import { buildSeedState } from '../store/seed'
import { VeriModStore } from '../store/store'
import { transitionProblem, verifyReceipt } from './verify'
import { validateReceiptBody } from './schema'
import type { ScoresPpm } from './types'

const H = `0x${'ab'.repeat(32)}` as Hex32

describe('restricted canonical inputs', () => {
  it.each([undefined, 1n, NaN, Infinity, -Infinity, new Date(0), new Array(2)])('rejects unsupported %s', (value) => {
    expect(() => canonicalize(value)).toThrow(CanonicalizationError)
  })
  it('rejects cycles but allows repeated acyclic references', () => {
    const cyclic: unknown[] = []; cyclic.push(cyclic)
    expect(() => canonicalize(cyclic)).toThrow(CanonicalizationError)
    const same = { a: 1 }
    expect(canonicalize([same, same, true, false, null, -0])).toBe('[{"a":1},{"a":1},true,false,null,0]')
  })
  it('sorts UTF-16 keys, keeps Unicode and safe integer limits', () => {
    expect(canonicalize({ '\uE000': 0, '😀': Number.MAX_SAFE_INTEGER, a: Number.MIN_SAFE_INTEGER })).toBe('{"a":-9007199254740991,"😀":9007199254740991,"":0}')
  })
  it('rejects malformed hash values and widths', () => {
    expect(() => hexToBytes('0xzz' as Hex32)).toThrow()
    expect(() => hexToBytes(`0x${'AA'.repeat(32)}`)).toThrow()
    expect(() => bytesToHex(new Uint8Array(31))).toThrow()
  })
})

describe('JSON text boundary', () => {
  it.each(['{"x":1,"x":2}', '{"x":1,"\\u0078":2}', '{"a":[{"x":1,"x":2}]}'])('rejects duplicate keys %s', (text) => {
    expect(() => parseUniqueJson(text)).toThrow('중복 JSON key')
  })
  it('allows separate object keys and escaped punctuation inside strings', () => {
    const value = [{ x: 'a"b\\c,:{}[]' }, { x: 2 }, null, true, false, -1.5e2]
    expect(parseUniqueJson(JSON.stringify(value))).toEqual(value)
  })
  it('rejects bad syntax, oversized and deeply nested documents', () => {
    expect(() => parseUniqueJson('{')).toThrow()
    expect(() => parseUniqueJson(' '.repeat(MAX_JSON_BYTES + 1))).toThrow('1 MiB')
    expect(() => parseUniqueJson('['.repeat(65) + '0' + ']'.repeat(65))).toThrow('64')
  })
})

describe('epoch compatibility and independent Merkle reference', () => {
  // Separate Node crypto primitive and iterative CT frontier; no production tree/hash helpers.
  const hash = (bytes: Uint8Array) => new Uint8Array(createHash('sha256').update(bytes).digest())
  const join = (l: Uint8Array, r: Uint8Array) => hash(new Uint8Array([1, ...l, ...r]))
  const reference = (entries: Uint8Array[]) => {
    const frontier: (Uint8Array | undefined)[] = []
    for (const entry of entries) {
      let carry = hash(new Uint8Array([0, ...entry])); let level = 0
      while (frontier[level]) { carry = join(frontier[level]!, carry); frontier[level++] = undefined }
      frontier[level] = carry
    }
    let root: Uint8Array | undefined
    for (const node of frontier) if (node) root = root ? join(node, root) : node
    return root!
  }
  it('matches independent Node crypto CT frontier for n=1..32 and every index', async () => {
    for (let n = 1; n <= 32; n++) {
      const entries = Array.from({ length: n }, (_, i) => utf8(`entry-${i}`))
      const root = await merkleRoot(entries)
      expect([...root]).toEqual([...reference(entries)])
      for (let i = 0; i < n; i++) expect(await verifyInclusion(entries[i], i, n, await inclusionProof(entries, i), root)).toBe(true)
    }
  })
  it('rejects empty and duplicate members, preserves a snapshot across awaits', async () => {
    const a = { receipt_id: '00000000-0000-4000-8000-000000000001', receipt_hash: H }
    const b = { receipt_id: '00000000-0000-4000-8000-000000000002', receipt_hash: `0x${'cd'.repeat(32)}` as Hex32 }
    await expect(freezeEpoch([])).rejects.toThrow()
    await expect(freezeEpoch([a, { ...b, receipt_id: a.receipt_id }])).rejects.toThrow('중복')
    await expect(freezeEpoch([a, { ...b, receipt_hash: a.receipt_hash }])).rejects.toThrow('중복')
    const expected = await freezeEpoch([a, b])
    const pending = freezeEpoch([b, a])
    a.receipt_hash = b.receipt_hash
    expect(await pending).toEqual(expected)
  })
  it('keeps the five receipt hashes and three roots captured BEFORE P0 edits at 908f64e', async () => {
    const seed = await buildSeedState()
    expect(seed.receipts.map((r) => r.hash)).toEqual([
      '0x3d025217441ade9f894603476a66a5627168cab5f90c7d4cf347ad397d5c8151',
      '0x2dcaff4155a88bd14317e9b9969784b5d0ab5cbfc34cd2c21a00ab462e34687f',
      '0xf95ac6d6c7cd255be4fdd2db809b0b6a946cbb389cd360188ab7e7b7ee6b4563',
      '0x621889d300a699f5a2155974a0b1d5ce786cb2304205ed943c3c2be5ede5ccb1',
      '0x4d0c5b70d0957fdaeeb224c1a59bfcdd275ed2afb0f19252c60818f25413e60f',
    ])
    expect(seed.epochs.map((e) => e.record.root)).toEqual([
      '0x591581275bfa1666d7a918df669157509cbb0b930b7066bba7dcf784fe881589',
      '0x59026f4deca36a8c9436e032b8da8fd7e49398cde6a23249ab5099e8b2f2bec0',
      '0xa9d8491ed18f963ea19faca1a6f494ffeaa20bad59d04e95d0ef4a5b1fe0caa4',
    ])
  })
})

describe('verifier hostile inputs and unavailable ledger', () => {
  it('returns reports instead of crashing for malformed imported bundles', async () => {
    const store = await VeriModStore.open(null)
    const ctx = await store.verifierContext()
    const bundle = store.bundle(store.getState().receipts[0])
    const bad = structuredClone(bundle); bad.receipt_body.issuer_id = '\uD800'
    for (const value of [null, {}, [], '{', bad, { ...bundle, proof: {} }]) {
      expect((await verifyReceipt(value, ctx)).code).toBe('INVALID_SCHEMA')
    }
    const duplicate = JSON.stringify(bundle).replace('"receipt_hash":', '"receipt_hash":"ignored","receipt_hash":')
    expect((await verifyReceipt(duplicate, ctx)).code).toBe('INVALID_SCHEMA')
    expect((await verifyReceipt(JSON.stringify(bundle), ctx)).code).toBe('VALID')
  })
  it('validates required types, score ranges, labels, evidence, timestamps and anchors', async () => {
    const store = await VeriModStore.open(null)
    const base = store.bundle(store.getState().receipts[0])
    const ctx = await store.verifierContext()
    const paths: [string[], unknown][] = [
      [['receipt_body', 'recorded_at'], '2026-02-30T00:00:00.000Z'],
      [['receipt_body', 'issuer_id'], null],
      [['receipt_hash'], '0x12'],
      [['anchor', 'block_number'], '-1'],
      [['proof', 'leaf_index'], -1],
      [['proof', 'tree_size'], 0],
      [['receipt_body', 'payload', 'inference', 'scores_ppm', 'hate'], 1_000_001],
      [['receipt_body', 'payload', 'inference', 'scores_ppm', 'hate'], 0.5],
      [['receipt_body', 'payload', 'inference', 'scores_ppm', 'hate'], undefined],
      [['receipt_body', 'payload', 'inference', 'evidence'], [{ start: 2, end: 1 }]],
      [['receipt_body', 'payload', 'policy', 'reason_codes'], ['Z', 'A']],
    ]
    for (const [path, value] of paths) {
      const copy = structuredClone(base)
      let target = copy as unknown as Record<string, unknown>
      for (const key of path.slice(0, -1)) target = target[key] as Record<string, unknown>
      target[path[path.length - 1]] = value
      expect((await verifyReceipt(copy, ctx)).code, path.join('.')).toBe('INVALID_SCHEMA')
    }
    expect(validateReceiptBody(Object.create(base.receipt_body)).ok).toBe(false)
  })
  it.each([NaN, Infinity, -1, 1.5])('does not accept bad block number %s', async (block) => {
    const store = await VeriModStore.open(null); const ctx = await store.verifierContext()
    ctx.ledger = { ...ctx.ledger, blockNumber: async () => block }
    expect((await verifyReceipt(store.bundle(store.getState().receipts[0]), ctx)).code).toBe('RPC_UNAVAILABLE')
  })
  it('maps ordinary reader errors and malformed epoch responses to unavailable', async () => {
    const store = await VeriModStore.open(null); const ctx = await store.verifierContext()
    const bundle = store.bundle(store.getState().receipts[0])
    const get = ctx.ledger.getEpoch.bind(ctx.ledger)
    for (const patch of [{ root: '0xzz' }, { anchored_block: NaN }, { epoch_id: '999' }, { receipt_count: 0 }]) {
      ctx.ledger.getEpoch = async (a, id) => ({ ...(await get(a, id))!, ...patch }) as Awaited<ReturnType<typeof get>>
      expect((await verifyReceipt(bundle, ctx)).code).toBe('RPC_UNAVAILABLE')
    }
    ctx.ledger.getEpoch = async () => { throw new Error('offline') }
    expect((await verifyReceipt(bundle, ctx)).code).toBe('RPC_UNAVAILABLE')
  })
  it('rejects direct review of a different decision and review of an impossible appeal', async () => {
    const seed = await buildSeedState()
    const review = structuredClone(seed.receipts.find((r) => r.body.event_kind === 'REVIEW')!.body)
    const appeal = structuredClone(seed.receipts.find((r) => r.body.event_kind === 'APPEAL')!.body)
    const direct = seed.receipts.find((r) => r.body.event_kind === 'DECISION' && r.body.payload.policy.action === 'HUMAN_REVIEW')!.body
    const subject = structuredClone(seed.receipts.find((r) => r.hash === appeal.subject_receipt_hash)!.body)
    if (review.event_kind !== 'REVIEW' || subject.event_kind !== 'DECISION') throw new Error('fixture')
    direct.content_commitment = review.content_commitment
    expect(transitionProblem(review, direct, direct)).toContain('같은 최초 판정')
    subject.payload.policy.action = 'ALLOW'
    expect(transitionProblem(review, subject, appeal)).toContain('제한 판정')
  })
  it.each([NaN, -1, 1_000_001, 0.5, undefined])('never fabricates ALLOW from invalid scores %s', (value) => {
    const scores = { hate: value, profanity: 0, sexual: 0, spam: 0, violence: 0 } as ScoresPpm
    expect(() => evaluatePolicy({ input_status: 'FULL', scores_ppm: scores }, H)).toThrow()
  })
})
