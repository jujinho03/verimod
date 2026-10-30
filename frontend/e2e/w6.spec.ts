import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { receiptHash } from '../src/domain/receipt'

const publicDir = resolve('../docs/handoffs/w4-anchored-epoch-public/20261020-r01')
const runId = process.env.W6_RUN_ID || new Date().toISOString().replace(/[:.]/g, '-')
const evidence = resolve('../private-data/w6-f-browser', runId)
const rpcUrls = ['https://base-sepolia-rpc.publicnode.com/**', 'https://sepolia.base.org/**']

const bundle = () => JSON.parse(readFileSync(resolve(publicDir, 'receipt-0.bundle.json'), 'utf8'))
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')

async function openPublic(page: Page, value: unknown) {
  await page.goto('/verify?profile=BASE_SEPOLIA_DEMO')
  await page.getByRole('tab', { name: 'JSON 붙여넣기' }).click()
  await page.locator('#verify-json').fill(JSON.stringify(value))
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await expect(page.locator('aside .verdict__code')).toBeVisible({ timeout: 120_000 })
}

async function verifyAgain(page: Page) {
  const button = page.locator('.work__main .btn--blue').first()
  await button.click()
  await page.waitForTimeout(50)
  await expect(button).toBeEnabled({ timeout: 120_000 })
  await expect(page.locator('aside .verdict__code')).toBeVisible({ timeout: 120_000 })
}

async function expectLiveCode(page: Page, expected: string, maxAttempts = 3, allowRpcBlocked = false): Promise<number | null> {
  let rpcRetries = 0
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const actual = await page.locator('aside .verdict__code').innerText()
    if (actual === expected) return rpcRetries
    if (actual !== 'RPC_UNAVAILABLE' || attempt === maxAttempts) {
      if (allowRpcBlocked && actual === 'RPC_UNAVAILABLE') return null
      expect(actual).toBe(expected)
    }
    rpcRetries++
    await verifyAgain(page)
  }
  throw new Error(`unreachable: ${expected}`)
}

test('same W4 seed distinguishes live RPC outage from tamper and recovers', async ({ page }, info) => {
  mkdirSync(evidence, { recursive: true })
  const value = bundle()
  const inputDigest = digest(value)
  const observedHosts = new Set<string>()

  await openPublic(page, value)
  const initialRpcRetries = await expectLiveCode(page, 'VALID')
  await expect(page.getByRole('status')).toContainText('L2 Confirmed')
  await page.screenshot({ path: resolve(evidence, `${info.project.name}-01-valid.png`) })

  for (const url of rpcUrls) {
    await page.route(url, async route => {
      observedHosts.add(new URL(route.request().url()).host)
      await route.abort('internetdisconnected')
    })
  }
  await verifyAgain(page)
  await expect(page.locator('aside .verdict__code')).toHaveText('RPC_UNAVAILABLE')
  await expect(page.locator('aside')).toContainText('변조로 판단하지 않으며')
  expect(observedHosts).toEqual(new Set(['base-sepolia-rpc.publicnode.com', 'sepolia.base.org']))
  expect(digest(JSON.parse(await page.locator('#verify-json').inputValue()))).toBe(inputDigest)
  await page.screenshot({ path: resolve(evidence, `${info.project.name}-02-rpc-unavailable.png`) })

  await page.unrouteAll({ behavior: 'wait' })
  await verifyAgain(page)
  const recoveryRpcRetries = await expectLiveCode(page, 'VALID', 3, true)
  if (recoveryRpcRetries === null) {
    await page.screenshot({ path: resolve(evidence, `${info.project.name}-03-recovery-rpc-blocked.png`) })
    writeFileSync(resolve(evidence, `${info.project.name}-rpc-recovery.json`), JSON.stringify({
      case: 'W6_ACTUAL_RPC_RECOVERY',
      status: 'BLOCKED',
      input_sha256: inputDigest,
      observed_states: ['VALID', 'RPC_UNAVAILABLE', 'RPC_UNAVAILABLE'],
      expected_after_unblock: 'VALID',
      blocked_hosts: [...observedHosts].sort(),
      initial_rpc_retries: initialRpcRetries,
      recovery_rpc_retries: 3,
      profile: 'BASE_SEPOLIA_DEMO',
      public_chain: true,
      private_material_access: false,
      tx_sent: false,
      observed_at: new Date().toISOString(),
    }, null, 2) + '\n')
    test.skip(true, 'BLOCKED: approved public RPCs remained unavailable after route recovery; preserve the observed availability boundary')
  }
  expect(digest(JSON.parse(await page.locator('#verify-json').inputValue()))).toBe(inputDigest)
  await page.screenshot({ path: resolve(evidence, `${info.project.name}-03-recovered-valid.png`) })

  mkdirSync(evidence, { recursive: true })
  writeFileSync(resolve(evidence, `${info.project.name}-rpc-recovery.json`), JSON.stringify({
    case: 'W6_ACTUAL_RPC_RECOVERY',
    input_sha256: inputDigest,
    states: ['VALID', 'RPC_UNAVAILABLE', 'VALID'],
    blocked_hosts: [...observedHosts].sort(),
    initial_rpc_retries: initialRpcRetries,
    recovery_rpc_retries: recoveryRpcRetries,
    profile: 'BASE_SEPOLIA_DEMO',
    public_chain: true,
    private_material_access: false,
    tx_sent: false,
    observed_at: new Date().toISOString(),
  }, null, 2) + '\n')
})

test('same W4 seed yields hash mismatch then invalid proof after rehash', async ({ page }, info) => {
  mkdirSync(evidence, { recursive: true })
  const original = bundle()
  await page.goto('/verify')
  await page.getByRole('tab', { name: 'W4 공개 검증 샘플 불러오기' }).click()
  expect(JSON.parse(await page.locator('#verify-json').inputValue())).toEqual(original)
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await expect(page.locator('aside .verdict__code')).toBeVisible({ timeout: 120_000 })
  const initialRpcRetries = await expectLiveCode(page, 'VALID')

  await page.getByRole('button', { name: '본문 변경 · 기존 해시 유지' }).click()
  const changed = JSON.parse(await page.locator('#verify-json').inputValue())
  expect(changed.receipt_hash).toBe(original.receipt_hash)
  await verifyAgain(page)
  await expect(page.locator('aside .verdict__code')).toHaveText('HASH_MISMATCH')
  await page.screenshot({ path: resolve(evidence, `${info.project.name}-04-hash-mismatch.png`) })

  await page.getByRole('button', { name: '본문 변경 · 해시 재계산' }).click()
  await expect(page.getByText('현재 입력: 본문 변경 + 해시 재계산 (기존 proof 유지)', { exact: true })).toBeVisible()
  const rehashed = JSON.parse(await page.locator('#verify-json').inputValue())
  expect(rehashed.receipt_hash).toBe(await receiptHash(rehashed.receipt_body))
  expect(rehashed.proof).toEqual(original.proof)
  expect(rehashed.anchor).toEqual(original.anchor)
  await verifyAgain(page)
  const rehashRpcRetries = await expectLiveCode(page, 'INVALID_PROOF', 3, true)
  if (rehashRpcRetries === null) {
    await page.screenshot({ path: resolve(evidence, `${info.project.name}-05-rehash-rpc-blocked.png`) })
    writeFileSync(resolve(evidence, `${info.project.name}-tamper.json`), JSON.stringify({
      case: 'W6_W4_SEED_TAMPER',
      status: 'BLOCKED',
      original_sha256: digest(original),
      changed_field: 'receipt_body.payload.policy.action',
      observed_states: ['VALID', 'HASH_MISMATCH', 'RPC_UNAVAILABLE'],
      expected_after_rehash: 'INVALID_PROOF',
      rehash_rpc_retries: 3,
      private_material_access: false,
      tx_sent: false,
      observed_at: new Date().toISOString(),
    }, null, 2) + '\n')
    test.skip(true, 'BLOCKED: approved public RPCs remained unavailable after rehash; do not report INVALID_PROOF as observed')
  }
  await page.screenshot({ path: resolve(evidence, `${info.project.name}-05-invalid-proof.png`) })

  mkdirSync(evidence, { recursive: true })
  writeFileSync(resolve(evidence, `${info.project.name}-tamper.json`), JSON.stringify({
    case: 'W6_W4_SEED_TAMPER',
    original_sha256: digest(original),
    changed_field: 'receipt_body.payload.policy.action',
    states: ['VALID', 'HASH_MISMATCH', 'INVALID_PROOF'],
    initial_rpc_retries: initialRpcRetries,
    rehash_rpc_retries: rehashRpcRetries,
    private_material_access: false,
    tx_sent: false,
    observed_at: new Date().toISOString(),
  }, null, 2) + '\n')
})
