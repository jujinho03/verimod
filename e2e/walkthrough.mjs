// Main direct-comment journey plus the preserved YouTube analysis entry.
// node e2e/walkthrough.mjs <output-directory>
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const OUT = process.argv[2] ?? 'e2e/shots'
const BASE = process.env.APP_URL ?? 'http://localhost:5190'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
const report = []
for (const [label, viewport] of Object.entries({ desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } })) {
  const page = await browser.newPage({ viewport })
  const shot = async (name) => {
    const path = `${OUT}/${label}-${name}.png`
    await page.screenshot({ path })
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    report.push({ label, name, path, horizontalOverflow })
  }
  await page.goto(BASE)
  await page.getByRole('heading', { name: /댓글을 쓰고/ }).waitFor()
  await shot('home')
  await page.locator('#home-comment').fill('오늘도 좋은 글 감사합니다.')
  await page.getByRole('button', { name: '게시하고 AI 판정받기' }).click()
  await page.getByRole('heading', { name: 'AI 판정서가 발급됐어요' }).waitFor({ timeout: 60000 })
  await shot('decision')
  const receiptUrl = await page.locator('.vlinkrow__url').innerText()
  await page.getByRole('link', { name: /영수증 열기/ }).click()
  await page.getByRole('heading', { name: /판정 영수증/ }).waitFor()
  await shot('receipt')
  await page.goto(`${BASE}/verify`)
  await shot('verify')
  await page.goto(`${BASE}/analyze?demo=1`)
  await page.getByRole('button', { name: '데모로 계속' }).waitFor()
  await shot('youtube-secondary')
  report.push({ label, receiptUrl })
  await page.close()
}
await browser.close()
writeFileSync(`${OUT}/walkthrough.json`, JSON.stringify(report, null, 2))
if (report.some((row) => row.horizontalOverflow > 1)) process.exitCode = 1
