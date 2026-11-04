import { chromium } from '@playwright/test'

const BASE = process.env.APP_URL ?? 'http://localhost:5190'
const receiptId = process.argv[2]
if (!receiptId) throw new Error('receipt id required')
const browser = await chromium.launch()
const page = await browser.newPage()
try {
  await page.goto(`${BASE}/r/${receiptId}`)
  await page.getByRole('tab', { name: '변조 시험' }).click()
  const content = page.getByRole('button', { name: /점수 한 항목 바꾸기/ })
  await content.click()
  await page.locator('.vexpect').waitFor()
  const contentResult = await page.locator('.vexpect').innerText()
  if (!contentResult.includes('예상대로 탐지') || !contentResult.includes('HASH_MISMATCH')) throw new Error(contentResult)
  await page.getByRole('button', { name: '앵커를 다른 컨트랙트로' }).click()
  await page.locator('.vexpect').waitFor()
  const anchorResult = await page.locator('.vexpect').innerText()
  if (!anchorResult.includes('예상대로 탐지') || !anchorResult.includes('UNTRUSTED_ANCHOR')) throw new Error(anchorResult)
  console.log('TAMPER_PASS HASH_MISMATCH UNTRUSTED_ANCHOR')
} finally { await browser.close() }
