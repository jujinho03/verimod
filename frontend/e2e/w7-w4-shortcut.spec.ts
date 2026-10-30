import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

test('W4 shortcut keeps provenance and fails closed when both RPCs are blocked', async ({ page }) => {
  const original = JSON.parse(readFileSync(resolve('../docs/handoffs/w4-anchored-epoch-public/20261020-r01/receipt-0.bundle.json'), 'utf8'))
  const blockedHosts = new Set<string>()
  // Block all nonlocal requests from the beginning, including if a future regression
  // unexpectedly tries RPC during the body-hash check. This is not a live RPC test.
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === '127.0.0.1') return route.continue()
    blockedHosts.add(url.hostname)
    return route.abort('internetdisconnected')
  })
  await page.goto('/verify')
  await page.getByRole('tab', { name: 'W4 공개 검증 샘플 불러오기' }).click()
  await expect(page.locator('#verify-profile')).toHaveValue('BASE_SEPOLIA_DEMO')
  await expect(page.getByRole('heading', { name: 'HISTORICAL_W4_EVIDENCE · 공개 Receipt 0' })).toBeVisible()
  expect(JSON.parse(await page.locator('#verify-json').inputValue())).toEqual(original)
  await page.getByRole('button', { name: '본문 변경 · 기존 해시 유지' }).click()
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await expect(page.locator('aside .verdict__code')).toHaveText('HASH_MISMATCH')
  expect(blockedHosts.size).toBe(0)
  await page.getByRole('button', { name: '본문 변경 · 해시 재계산' }).click()
  await expect(page.locator('aside .verdict__code')).toHaveCount(0)
  await expect(page.getByText('현재 입력: 본문 변경 + 해시 재계산 (기존 proof 유지)', { exact: true })).toBeVisible()
  const rehashed = JSON.parse(await page.locator('#verify-json').inputValue())
  expect(rehashed.receipt_hash).not.toBe(original.receipt_hash)
  expect(rehashed.proof).toEqual(original.proof)
  expect(rehashed.anchor).toEqual(original.anchor)
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await expect(page.locator('aside .verdict__code')).toHaveText('RPC_UNAVAILABLE', { timeout: 30_000 })
  expect(blockedHosts).toEqual(new Set(['base-sepolia-rpc.publicnode.com', 'sepolia.base.org']))
  await page.getByRole('button', { name: 'W4 원본 복원' }).click()
  expect(JSON.parse(await page.locator('#verify-json').inputValue())).toEqual(original)
  await expect(page.locator('aside .verdict__code')).toHaveCount(0)
  await page.locator('#verify-profile').selectOption('LOCAL_HARDHAT_FALLBACK')
  await expect(page.getByRole('button', { name: '검증하기', exact: true })).toBeDisabled()
  await page.getByRole('tab', { name: '내 영수증에서 고르기' }).click()
  await expect(page.locator('aside .verdict__code')).toHaveCount(0)
  await expect(page.locator('#verify-profile')).toHaveValue('LOCAL_HARDHAT_FALLBACK')
  await expect(page.locator('#rpc dd').first()).toContainText('공개 체인 증거 아님')
  await expect(page.getByText('입력 출처:', { exact: false })).toContainText('브라우저 내부 합성 영수증 · 검증 모드: SYNTHETIC_LOCAL')
})

test('delayed rehash and file loading cannot leave stale results or overwrite a newer source', async ({ page }) => {
  await page.route('**/*', (route) => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
  await page.goto('/verify')
  await page.getByRole('tab', { name: 'W4 공개 검증 샘플 불러오기' }).click()
  await page.getByRole('button', { name: '본문 변경 · 기존 해시 유지' }).click()
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await expect(page.locator('aside .verdict__code')).toHaveText('HASH_MISMATCH')

  await page.evaluate(() => {
    const subtle = crypto.subtle
    const digest = subtle.digest.bind(subtle)
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    Object.defineProperty(subtle, 'digest', { configurable: true, value: async (...args: Parameters<SubtleCrypto['digest']>) => { await gate; return digest(...args) } })
    Object.assign(window, { releaseDigest: release })
  })
  await page.getByRole('button', { name: '본문 변경 · 해시 재계산' }).click()
  await expect(page.getByRole('button', { name: '입력 준비 중' })).toBeDisabled()
  await expect(page.locator('aside .verdict__code')).toHaveCount(0)
  await page.getByRole('tab', { name: '내 영수증에서 고르기' }).click()
  const synthetic = await page.locator('#verify-json').inputValue()
  await page.evaluate(() => (window as unknown as { releaseDigest(): void }).releaseDigest())
  await page.waitForTimeout(100)
  expect(await page.locator('#verify-json').inputValue()).toBe(synthetic)
  await expect(page.locator('aside .verdict__code')).toHaveCount(0)

  await page.getByRole('tab', { name: '파일 올리기' }).click()
  await page.evaluate(() => {
    const text = File.prototype.text
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    Object.defineProperty(File.prototype, 'text', { configurable: true, value: async function (this: File) { await gate; return text.call(this) } })
    Object.assign(window, { releaseFile: release })
  })
  await page.locator('#verify-file').setInputFiles({ name: 'input.json', mimeType: 'application/json', buffer: Buffer.from('{"test":"delayed"}') })
  await expect(page.getByRole('button', { name: '입력 준비 중' })).toBeDisabled()
  await page.getByRole('tab', { name: '내 영수증에서 고르기' }).click()
  const afterSwitch = await page.locator('#verify-json').inputValue()
  await page.evaluate(() => (window as unknown as { releaseFile(): void }).releaseFile())
  await page.waitForTimeout(100)
  expect(await page.locator('#verify-json').inputValue()).toBe(afterSwitch)
  await expect(page.locator('aside .verdict__code')).toHaveCount(0)
})

test('changing synthetic RPC outage assumption clears an earlier result', async ({ page }) => {
  await page.goto('/verify')
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await expect(page.locator('aside .verdict__code')).toBeVisible()
  await page.getByRole('checkbox', { name: /RPC 장애 가정/ }).check()
  await expect(page.locator('aside .verdict__code')).toHaveCount(0)
})

test('unexpected verification errors remain visible and do not display a verdict', async ({ page }) => {
  await page.goto('/verify')
  await page.evaluate(() => {
    Object.defineProperty(crypto.subtle, 'digest', { configurable: true, value: () => Promise.reject(new Error('injected digest failure')) })
  })
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await expect(page.getByText('검증 준비 또는 실행에 실패했습니다.', { exact: false })).toBeVisible()
  await expect(page.locator('aside .verdict__code')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '검증하기', exact: true })).toBeEnabled()
})
