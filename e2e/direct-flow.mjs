import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const OUT = process.argv[2] ?? 'e2e/direct-flow'
const BASE = process.env.APP_URL ?? 'http://localhost:5190'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage()
const results = []
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); if (!ok) throw new Error(`${name}: ${detail}`) }
await page.goto(BASE)
check('empty input disabled', !(await page.getByRole('button', { name: '게시하고 AI 판정받기' }).isEnabled()))
const examples = [
  ['ALLOW', '오늘도 좋은 글 감사합니다.'],
  ['HUMAN_REVIEW', '특정 집단 사람들은 모두 없어져야 한다.'],
  ['RESTRICT', '여자는 모두 멍청해서 사회에서 사라져야 해.'],
]
for (const [expected, input] of examples) {
  const field = page.locator(expected === 'ALLOW' ? '#home-comment' : '#direct-comment')
  await field.fill(input)
  await page.getByRole('button', { name: expected === 'ALLOW' ? '게시하고 AI 판정받기' : '게시하고 판정받기' }).click()
  await page.getByRole('heading', { name: 'AI 판정서가 발급됐어요' }).waitFor({ timeout: 60000 })
  const action = await page.locator('.vrows > div').first().locator('dd').innerText()
  const expectedKo = { ALLOW: '허용', HUMAN_REVIEW: '검토', RESTRICT: '제한' }[expected]
  check(expected, action === expectedKo, action)
  check(`${expected} automatic anchor`, /자동|배치|서명|송신|블록 확인|확정 완료/.test(await page.getByRole('status').innerText()))
  const link = await page.locator('.vlinkrow__url').innerText()
  check(`${expected} receipt link`, /\/r\/[0-9a-f-]{36}$/.test(link), link)
  if (expected === 'ALLOW') {
    const stored = await page.evaluate(() => localStorage.getItem('verimod_direct_receipts_v1'))
    check('public receipt reference in browser vault', Boolean(stored) && stored.includes(link.slice(-36)))
    check('private text and salt absent from vault', Boolean(stored) && !stored.includes(input) && !stored.includes('content_salt'))
    const downloadReady = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Private Package 저장' }).click()
    check('private package download', (await downloadReady).suggestedFilename().startsWith('verimod-private-'))
  }
  await page.getByRole('button', { name: '다른 댓글 쓰기' }).click()
}
await page.locator('#direct-comment').fill('가'.repeat(800))
await page.getByRole('button', { name: '게시하고 판정받기' }).click()
await page.getByRole('heading', { name: 'AI 판정서가 발급됐어요' }).waitFor({ timeout: 60000 })
check('truncated human review', (await page.locator('.vrows').innerText()).includes('TRUNCATED_HUMAN_REVIEW'))
await page.getByRole('button', { name: '다른 댓글 쓰기' }).click()
await page.route('**/api/decisions', async (route) => { await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ ok: false, request_id: crypto.randomUUID(), error: { code: 'INFERENCE_UNAVAILABLE', retryable: true } }) }) })
await page.locator('#direct-comment').fill('AI 연결 실패 시험')
await page.getByRole('button', { name: '게시하고 판정받기' }).click()
check('503 guidance', (await page.getByRole('alert').innerText()).includes('영수증을 발급하지 않았어요'))
await page.unroute('**/api/decisions')
const headers = { 'Idempotency-Key': crypto.randomUUID(), 'x-demo-principal': 'direct-flow-idempotency', 'x-demo-role': 'DEMO_USER' }
const first = await page.request.post(`${BASE}/api/decisions`, { headers, data: { text: '동일 게시 요청 시험' } })
const second = await page.request.post(`${BASE}/api/decisions`, { headers, data: { text: '동일 게시 요청 시험' } })
check('idempotency replay', (await first.json()).data.bundle.receipt_body.receipt_id === (await second.json()).data.bundle.receipt_body.receipt_id)
await browser.close()
writeFileSync(`${OUT}/direct-flow.json`, JSON.stringify(results, null, 2))
console.log(`${results.length} checks passed`)
