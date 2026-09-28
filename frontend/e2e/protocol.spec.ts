import { expect, test } from '@playwright/test'

test('browser runs the W2 ReceiptBody regression matrix 20/20', async ({ page }) => {
  await page.goto('/')
  const results = await page.evaluate(async () => {
    const canonical = await import('/src/domain/canonical.ts')
    const receipt = await import('/src/domain/receipt.ts')
    const schema = await import('/src/domain/schema.ts')
    const json = await import('/src/domain/json.ts')
    const seedModule = await import('/src/store/seed.ts')
    const seed = await seedModule.buildSeedState()
    const body = seed.receipts[0].body
    const out: boolean[] = []
    const expected = [
      '0x3d025217441ade9f894603476a66a5627168cab5f90c7d4cf347ad397d5c8151',
      '0x2dcaff4155a88bd14317e9b9969784b5d0ab5cbfc34cd2c21a00ab462e34687f',
      '0xf95ac6d6c7cd255be4fdd2db809b0b6a946cbb389cd360188ab7e7b7ee6b4563',
    ]
    for (let i = 0; i < 3; i++) out.push(await receipt.receiptHash(seed.receipts[i].body) === expected[i])
    out.push(canonical.canonicalize({ b: 2, a: 1 }) === canonical.canonicalize({ a: 1, b: 2 }))
    out.push(canonical.canonicalize({ x: { z: 2, a: 1 } }) === canonical.canonicalize({ x: { a: 1, z: 2 } }))
    out.push(canonical.canonicalize(body) === canonical.canonicalize(Object.fromEntries(Object.entries(body).reverse())))
    for (const text of ['한글 영수증', '😀', 'e\u0301']) out.push(canonical.canonicalize({ text }).includes(text))
    out.push(schema.validateReceiptBody(body).ok)
    const missing = structuredClone(body) as Record<string, unknown>; delete missing.subject_receipt_hash
    out.push(!schema.validateReceiptBody(missing).ok)
    out.push(canonical.canonicalize({ x: null }) !== canonical.canonicalize({}))
    out.push(canonical.canonicalize({ value: Number.MAX_SAFE_INTEGER }).includes(String(Number.MAX_SAFE_INTEGER)))
    out.push(canonical.canonicalize({ value: Number.MIN_SAFE_INTEGER }).includes(String(Number.MIN_SAFE_INTEGER)))
    try { canonical.canonicalize({ value: Number.MAX_SAFE_INTEGER + 1 }); out.push(false) } catch { out.push(true) }
    for (const raw of ['{"x":1,"x":2}', '{"x":1,"\\u0078":2}']) {
      try { json.parseUniqueJson(raw); out.push(false) } catch { out.push(true) }
    }
    for (const [time, accepted] of [['2026-09-08T01:12:30.000Z', true], ['2026-02-30T01:12:30.000Z', false], ['2026-09-08T01:12:30Z', false]] as const) {
      out.push(schema.validateReceiptBody({ ...structuredClone(body), recorded_at: time }).ok === accepted)
    }
    return out
  })
  expect(results).toHaveLength(20)
  expect(results.every(Boolean)).toBe(true)
})
