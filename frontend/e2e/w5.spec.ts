import { expect, test, type Page } from '@playwright/test'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const publicDir = resolve('../docs/handoffs/w4-anchored-epoch-public/20261020-r01')
// Keep new runs separate from the historical W4/W5 evidence and owner downloads.
const evidence = resolve('../private-data/w5-final-browser', process.env.W5_RUN_ID || new Date().toISOString().replace(/[:.]/g, '-'))
const bundle = (index = 0) => JSON.parse(readFileSync(resolve(publicDir, `receipt-${index}.bundle.json`), 'utf8'))

async function openPublic(page: Page, value: unknown) {
  await page.goto('/verify?profile=BASE_SEPOLIA_DEMO')
  await page.getByRole('tab', { name: 'JSON 붙여넣기' }).click()
  await page.locator('#verify-json').fill(JSON.stringify(value))
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await expect(page.locator('aside .verdict__code')).toBeVisible({ timeout: 100_000 })
}

test('Base mode, missing manifest, two blocked RPCs, offline and recovery guidance', async ({ page }, info) => {
  const hosts = new Set<string>()
  const block = async (route: import('@playwright/test').Route) => { hosts.add(new URL(route.request().url()).host); await route.abort('internetdisconnected') }
  await page.route('https://base-sepolia-rpc.publicnode.com/**', block)
  await page.route('https://sepolia.base.org/**', block)
  await openPublic(page, bundle())
  await expect(page.locator('aside .verdict__code')).toHaveText('RPC_UNAVAILABLE')
  expect(hosts.size).toBe(2)
  await expect(page.locator('.notice__tag')).toHaveText('BASE_SEPOLIA_DEMO')
  await expect(page.getByText('Prototype mode', { exact: true })).toHaveCount(0)
  const manifest = page.locator('aside .side-row').filter({ has: page.getByText('모델·정책 manifest', { exact: true }) })
  await expect(manifest).toHaveCount(1)
  // The UI label for Manifest NOT_CHECKED must agree with the missing-body explanation.
  await expect(manifest.getByText('확인 안 함', { exact: true })).toBeVisible()
  await expect(manifest).toContainText('신뢰할 수 있는 manifest 원문을 확보하지 못했습니다')
  await expect(page.locator('#rpc')).toContainText('Ethereum L1 finality와 다릅니다')
  await expect(page.locator('#rpc')).toContainText('다시 검증하세요')
  mkdirSync(evidence, { recursive: true })
  await page.screenshot({ path: resolve(evidence, `${info.project.name}-rpc-unavailable.png`) })
  await page.context().setOffline(true)
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await expect(page.locator('aside .verdict__code')).toHaveText('RPC_UNAVAILABLE')
  await page.context().setOffline(false)
  await page.unrouteAll({ behavior: 'wait' })
  // Recovery uses a clearly separate deterministic response; live RPC is tested below.
  await page.locator('#verify-json').fill(JSON.stringify({ ...bundle(), proof: null, anchor: null }))
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await expect(page.locator('aside .verdict__code')).toHaveText('PENDING_ANCHOR')
})

for (const [scenario, expected] of [['NORMAL', 'PASSED'], ['FORBIDDEN_TRANSITION', 'FAILED'],
  ['MISSING_HISTORY', 'INCOMPLETE_HISTORY'], ['PENDING_PREVIOUS', 'NOT_CHECKED'], ['RPC_FAILURE', 'NOT_CHECKED'], ['WRONG_REFERENCE', 'FAILED']]) {
  test(`Synthetic timeline ${scenario} -> ${expected}`, async ({ page }, info) => {
    await page.goto('/verify')
    await page.locator('#synthetic-case').selectOption(scenario)
    await page.getByRole('button', { name: '합성 연결 검증', exact: true }).click()
    await expect(page.getByTestId('synthetic-report')).toContainText(`Lifecycle ${expected}`)
    await expect(page.locator('#synthetic-lifecycle')).toContainText('공개 Base 증거 아님')
    mkdirSync(evidence, { recursive: true })
    await page.locator('#synthetic-lifecycle').screenshot({ path: resolve(evidence, `${info.project.name}-synthetic-${scenario.toLowerCase()}.png`) })
  })
}

test('owner export/import stays local and separates Content from Core', async ({ page }) => {
  await page.goto('/receipts/a91d3c07-6e2b-4b58-9f14-2c7e8d0b5a63')
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Private Package 저장', exact: true }).click()
  const download = await pending
  const path = await download.path()
  if (!path) throw Error('Local download missing')
  const localOnly = readFileSync(path)
  const requests: string[] = []
  page.on('request', (req) => { if (req.method() === 'POST') requests.push(req.postData() ?? '') })
  await page.goto('/verify?receipt=a91d3c07-6e2b-4b58-9f14-2c7e8d0b5a63')
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await expect(page.locator('aside .side-checks')).toContainText('제공하지 않았습니다')
  await page.locator('#private-package').setInputFiles({ name: 'owner-private.json', mimeType: 'application/json', buffer: localOnly })
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await expect(page.locator('aside .side-checks')).toContainText('Package의 ID와 원문·salt 재계산값이')
  const changed = JSON.parse(localOnly.toString()); changed.receipt_id = '11111111-1111-4111-8111-111111111111'
  await page.locator('#private-package').setInputFiles({ name: 'changed.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(changed)) })
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await expect(page.locator('aside .side-checks')).toContainText('일치하지 않습니다')
  await expect(page.locator('aside .verdict__code')).toHaveText('VALID')
  await page.getByRole('button', { name: '비공개 자료 지우기', exact: true }).click()
  expect(requests).toHaveLength(0)
  const persisted = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }))
  // Seed material already exists in the synthetic demo store; imported package blobs must not be saved.
  expect(persisted).not.toContain('package_version')
  await expect(page.locator('body')).not.toContainText(JSON.parse(localOnly.toString()).content_salt)
})

for (const [name, expected] of [['body', 'HASH_MISMATCH'], ['contract', 'UNTRUSTED_ANCHOR'], ['chain', 'UNTRUSTED_ANCHOR'], ['pending', 'PENDING_ANCHOR']]) {
  test(`W4 public regression without RPC: ${name}`, async ({ page }) => {
    const value = bundle()
    if (name === 'body') value.receipt_body.payload.policy.action = value.receipt_body.payload.policy.action === 'ALLOW' ? 'RESTRICT' : 'ALLOW'
    if (name === 'contract') value.anchor.contract_address = '0x' + '9'.repeat(40)
    if (name === 'chain') value.anchor.chain_id = '31337'
    if (name === 'pending') { value.proof = null; value.anchor = null }
    await openPublic(page, value)
    await expect(page.locator('aside .verdict__code')).toHaveText(expected)
  })
}

// Skip before creating a browser/page unless a manual live RPC run was requested.
const liveRpcTest = process.env.W5_LIVE_RPC === 'true' ? test : test.skip
for (const name of ['receipt-0', 'receipt-1', 'proof']) {
  liveRpcTest(`W5 NEW read-only live public RPC ${name}`, async ({ page }, info) => {
    const value = bundle(name === 'receipt-1' ? 1 : 0)
    if (name === 'proof') value.proof.siblings[0] = '0x' + 'f'.repeat(64)
    let calls = 0
    page.on('request', (req) => { if (req.method() === 'POST' && new URL(req.url()).protocol === 'https:') calls++ })
    await openPublic(page, value)
    const actual = await page.locator('aside .verdict__code').innerText()
    const result = { run: 'W5_NEW_READ_ONLY', project: info.project.name, case: name, actual, calls, at: new Date().toISOString(),
      expected: name === 'proof' ? 'INVALID_PROOF' : 'VALID', private_material_access: false, tx_sent: false }
    mkdirSync(evidence, { recursive: true })
    writeFileSync(resolve(evidence, `${info.project.name}-live-${name}.json`), JSON.stringify(result, null, 2) + '\n')
    test.skip(actual === 'RPC_UNAVAILABLE', 'BLOCKED: public RPC unavailable from this browser; W4 historical PASS is preserved')
    expect(actual).toBe(result.expected)
    await page.screenshot({ path: resolve(evidence, `${info.project.name}-live-${name}.png`) })
  })
}
