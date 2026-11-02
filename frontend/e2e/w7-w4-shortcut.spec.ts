import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

// Controlled JSON-RPC responses; these tests do not contact a public chain.
async function mockW4Rpc(page: import('@playwright/test').Page) {
  const evidence = JSON.parse(readFileSync(resolve('../docs/handoffs/w4-anchored-epoch-public/20261020-r01/chain-evidence.json'), 'utf8'))
  const word = (value: number) => value.toString(16).padStart(64, '0')
  await page.route('https://**/*', async route => {
    const request = route.request().postDataJSON() as { id: number; method: string; params: Array<Record<string, string>> }
    let result: unknown
    if (request.method === 'eth_chainId') result = '0x14a34'
    else if (request.method === 'eth_call' && request.params[0].data === '0x8c72c54e') result = `0x${'0'.repeat(24)}${evidence.publisher.slice(2)}`
    else if (request.method === 'eth_call') result = `${evidence.epoch.merkle_root}${word(2)}${word(1)}`
    else if (request.method === 'eth_blockNumber') result = `0x${(evidence.transaction.block_number + 20).toString(16)}`
    else if (request.method === 'eth_getLogs') {
      const start = Number(request.params[0].fromBlock), end = Number(request.params[0].toBlock)
      result = start <= evidence.transaction.block_number && evidence.transaction.block_number <= end
        ? [{ data: `${evidence.epoch.merkle_root}${word(2)}${word(1)}`, blockNumber: `0x${evidence.transaction.block_number.toString(16)}`, blockHash: evidence.transaction.block_hash, transactionHash: evidence.transaction.tx_hash }] : []
    } else if (request.method === 'eth_getTransactionReceipt') {
      result = { status: '0x1', to: evidence.contract, blockNumber: `0x${evidence.transaction.block_number.toString(16)}`, blockHash: evidence.transaction.block_hash }
    } else throw new Error(`Unexpected mocked RPC method: ${request.method}`)
    await route.fulfill({ json: { jsonrpc: '2.0', id: request.id, result } })
  })
}

test('mocked normal verification completes before the advisory deadline', async ({ page }) => {
  await mockW4Rpc(page)
  await page.goto('/verify')
  await page.getByRole('tab', { name: 'W4 공개 검증 샘플 불러오기' }).click()
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await expect(page.locator('aside .verdict__code')).toHaveText('VALID')
  await expect(page.getByRole('button', { name: '계속 기다리기' })).toHaveCount(0)
})

test('24 seconds is advisory; continuing can still produce a mocked VALID', async ({ page }) => {
  const start = new Date('2026-11-02T00:00:00.000Z')
  // Install before page timers and leave room for the clock to advance during load.
  await page.clock.install({ time: new Date(start.getTime() - 3_600_000) })
  await mockW4Rpc(page)
  await page.goto('/verify')
  await page.getByRole('tab', { name: 'W4 공개 검증 샘플 불러오기' }).click()
  await page.clock.pauseAt(start)
  await page.evaluate(() => {
    const subtle = crypto.subtle
    const digest = subtle.digest.bind(subtle)
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    Object.defineProperty(subtle, 'digest', { configurable: true, value: async (...args: Parameters<SubtleCrypto['digest']>) => { await gate; return digest(...args) } })
    Object.assign(window, { releaseSlowDigest: release })
  })
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await expect(page.getByText('실시간 블록체인 기록을 확인하고 있습니다.')).toBeVisible()
  await page.clock.fastForward(23_999)
  await expect(page.getByText('공개 네트워크 확인이 예상보다 오래 걸리고 있습니다.', { exact: false })).toHaveCount(0)
  await page.clock.fastForward(1)
  await expect(page.getByText('공개 네트워크 확인이 예상보다 오래 걸리고 있습니다.', { exact: false })).toBeVisible()
  await expect(page.locator('aside .verdict__code')).toHaveCount(0)
  await page.getByRole('button', { name: '계속 기다리기' }).click()
  await expect(page.getByRole('button', { name: '검증 중단' })).toBeVisible()
  await page.evaluate(() => (window as unknown as { releaseSlowDigest(): void }).releaseSlowDigest())
  await expect(page.locator('aside .verdict__code')).toHaveText('VALID')
})

test('selecting historical evidence cancels the current verification without a verdict', async ({ page }) => {
  const start = new Date('2026-11-02T00:00:00.000Z')
  await page.clock.install({ time: new Date(start.getTime() - 3_600_000) })
  await page.goto('/verify')
  await page.getByRole('tab', { name: 'W4 공개 검증 샘플 불러오기' }).click()
  await page.clock.pauseAt(start)
  await page.evaluate(() => {
    const subtle = crypto.subtle
    const digest = subtle.digest.bind(subtle)
    let release!: () => void
    const gate = new Promise<void>((resolve) => { release = resolve })
    Object.defineProperty(subtle, 'digest', { configurable: true, value: async (...args: Parameters<SubtleCrypto['digest']>) => { await gate; return digest(...args) } })
    Object.assign(window, { releaseHistoricalDigest: release })
  })
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await page.clock.fastForward(24_000)
  await page.getByRole('button', { name: '기존 공개 실증 자료 확인' }).click()
  await expect(page.getByRole('heading', { name: 'HISTORICAL_W4_EVIDENCE · 공개 Receipt 0' })).toBeVisible()
  await page.evaluate(() => (window as unknown as { releaseHistoricalDigest(): void }).releaseHistoricalDigest())
  await expect(page.locator('aside .verdict__code')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '검증하기', exact: true })).toBeEnabled()
})

for (const change of ['cancel', 'input', 'profile'] as const) {
  test(`${change} aborts a controlled fetch stub and prevents fallback`, async ({ page }) => {
    await mockW4Rpc(page)
    await page.goto('/verify')
    await page.getByRole('tab', { name: 'W4 공개 검증 샘플 불러오기' }).click()
    await page.evaluate(() => {
      const nativeFetch = window.fetch.bind(window)
      const observed = { requests: 0, aborted: false, hold: true }
      Object.assign(window, { rpcAbortObserved: observed })
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        if (!String(input).startsWith('https://') || !observed.hold) return nativeFetch(input, init)
        observed.requests++
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => { observed.aborted = true; reject(init.signal?.reason) }, { once: true })
        })
      }) as typeof fetch
    })
    await page.getByRole('button', { name: '검증하기', exact: true }).click()
    await expect.poll(() => page.evaluate(() => (window as unknown as { rpcAbortObserved: { requests: number } }).rpcAbortObserved.requests)).toBe(1)
    if (change === 'cancel') await page.getByRole('button', { name: '검증 중단' }).click()
    if (change === 'input') await page.locator('#verify-json').fill('{}')
    if (change === 'profile') await page.locator('#verify-profile').selectOption('LOCAL_HARDHAT_FALLBACK')
    await expect.poll(() => page.evaluate(() => (window as unknown as { rpcAbortObserved: { aborted: boolean } }).rpcAbortObserved.aborted)).toBe(true)
    expect(await page.evaluate(() => (window as unknown as { rpcAbortObserved: { requests: number } }).rpcAbortObserved.requests)).toBe(1)
    await expect(page.locator('aside .verdict__code')).toHaveCount(0)
    if (change === 'cancel') {
      await expect(page.getByText('검증을 중단했습니다.', { exact: false })).toBeVisible()
      await page.evaluate(() => { (window as unknown as { rpcAbortObserved: { hold: boolean } }).rpcAbortObserved.hold = false })
      await page.getByRole('button', { name: '검증하기', exact: true }).click()
      await expect(page.locator('aside .verdict__code')).toHaveText('VALID')
    }
  })
}

test('cancel aborts a native browser fetch and closes the local HTTP connection', async ({ page }) => {
  let posted = false
  let disconnected = false
  const server = createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'content-type')
    if (request.method === 'OPTIONS') { response.writeHead(204).end(); return }
    posted = true
    response.on('close', () => { if (!response.writableEnded) disconnected = true })
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('local test server unavailable')
  try {
    await page.goto('/verify')
    await page.getByRole('tab', { name: 'W4 공개 검증 샘플 불러오기' }).click()
    await page.evaluate((port) => {
      const nativeFetch = window.fetch.bind(window)
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => nativeFetch(
        String(input).startsWith('https://') ? `http://127.0.0.1:${port}/rpc` : input, init,
      )) as typeof fetch
    }, address.port)
    await page.getByRole('button', { name: '검증하기', exact: true }).click()
    await expect.poll(() => posted).toBe(true)
    await page.getByRole('button', { name: '검증 중단' }).click()
    await expect.poll(() => disconnected).toBe(true)
    await expect(page.locator('aside .verdict__code')).toHaveCount(0)
  } finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
})

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
  await expect(page.locator('.verification-design__step').nth(4)).toContainText('미실행')
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

test('a late RPC failure cannot overwrite a newer input or trust profile', async ({ page }) => {
  let release!: () => void
  let started!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  const requestStarted = new Promise<void>((resolve) => { started = resolve })
  await page.route('**/*', async (route) => {
    if (new URL(route.request().url()).hostname === '127.0.0.1') return route.continue()
    started()
    await gate
    return route.abort('internetdisconnected')
  })
  await page.goto('/verify')
  await page.getByRole('tab', { name: 'W4 공개 검증 샘플 불러오기' }).click()
  await page.getByRole('button', { name: '검증하기', exact: true }).click()
  await requestStarted
  await page.locator('#verify-json').fill('{}')
  await page.locator('#verify-profile').selectOption('LOCAL_HARDHAT_FALLBACK')
  release()
  await page.waitForTimeout(1000)
  await expect(page.locator('aside .verdict__code')).toHaveCount(0)
  await expect(page.locator('#verify-json')).toHaveValue('{}')
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
