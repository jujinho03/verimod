import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test, type Page, type Request } from '@playwright/test'

const publicDir = resolve('../docs/handoffs/w4-anchored-epoch-public/20261020-r01')
const runId = process.env.W6_RECOVERY_RUN_ID || new Date().toISOString().replace(/[:.]/g, '-')
const evidence = resolve('../private-data/w6-f-rpc-recovery', runId)
const rpcHosts = new Set(['base-sepolia-rpc.publicnode.com', 'sepolia.base.org'])
const rpcRoutes = ['https://base-sepolia-rpc.publicnode.com/**', 'https://sepolia.base.org/**']

type NetworkEvent = {
  at_ms: number
  event: 'request' | 'response' | 'request_failed' | 'injected_abort'
  host: string
  rpc_method?: string
  status?: number
  failure?: string | null
}

const bundle = () => JSON.parse(readFileSync(resolve(publicDir, 'receipt-0.bundle.json'), 'utf8'))
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')

function rpcMeta(request: Request) {
  const url = new URL(request.url())
  if (!rpcHosts.has(url.host) || request.method() !== 'POST') return null
  let rpcMethod: string | undefined
  try { rpcMethod = JSON.parse(request.postData() || '{}').method }
  catch { rpcMethod = 'UNPARSEABLE' }
  return { host: url.host, rpcMethod }
}

async function waitForRun(page: Page, timeout: number) {
  const button = page.locator('.work__main .btn--blue').first()
  const started = Date.now()
  await button.click()
  await page.waitForTimeout(50)
  try {
    await expect(button).toBeEnabled({ timeout })
    return { completed: true, elapsed_ms: Date.now() - started }
  } catch {
    return { completed: false, elapsed_ms: Date.now() - started }
  }
}

test('actual W4 receipt RPC outage and recovery timeline', async ({ page }, info) => {
  mkdirSync(evidence, { recursive: true })
  const started = Date.now()
  const value = bundle()
  const inputSha256 = digest(value)
  const network: NetworkEvent[] = []
  const stage: Record<string, unknown> = {}

  page.on('request', request => {
    const meta = rpcMeta(request)
    if (meta) network.push({ at_ms: Date.now() - started, event: 'request', host: meta.host, rpc_method: meta.rpcMethod })
  })
  page.on('response', response => {
    const meta = rpcMeta(response.request())
    if (meta) network.push({ at_ms: Date.now() - started, event: 'response', host: meta.host, rpc_method: meta.rpcMethod, status: response.status() })
  })
  page.on('requestfailed', request => {
    const meta = rpcMeta(request)
    if (meta) network.push({ at_ms: Date.now() - started, event: 'request_failed', host: meta.host, rpc_method: meta.rpcMethod, failure: request.failure()?.errorText ?? null })
  })

  await page.goto('/verify?profile=BASE_SEPOLIA_DEMO')
  await page.getByRole('tab', { name: 'JSON 붙여넣기' }).click()
  await page.locator('#verify-json').fill(JSON.stringify(value))

  stage.initial = await waitForRun(page, 360_000)
  stage.initial_code = await page.locator('aside .verdict__code').innerText()
  await page.screenshot({ path: resolve(evidence, `${info.project.name}-01-valid.png`) })
  expect(stage.initial_code).toBe('VALID')

  for (const url of rpcRoutes) {
    await page.route(url, async route => {
      const host = new URL(route.request().url()).host
      network.push({ at_ms: Date.now() - started, event: 'injected_abort', host, rpc_method: rpcMeta(route.request())?.rpcMethod })
      await route.abort('internetdisconnected')
    })
  }
  stage.outage = await waitForRun(page, 30_000)
  stage.outage_code = await page.locator('aside .verdict__code').innerText()
  await page.screenshot({ path: resolve(evidence, `${info.project.name}-02-rpc-unavailable.png`) })
  expect(stage.outage_code).toBe('RPC_UNAVAILABLE')

  await page.unrouteAll({ behavior: 'wait' })
  const recoveryStarted = Date.now()
  const button = page.locator('.work__main .btn--blue').first()
  await button.click()
  await page.waitForTimeout(50)
  let exceeded100s = false
  try {
    await expect(button).toBeEnabled({ timeout: 100_000 })
  } catch {
    exceeded100s = true
    stage.at_100s = {
      elapsed_ms: Date.now() - recoveryStarted,
      button_disabled: await button.isDisabled(),
      visible_code: await page.locator('aside .verdict__code').innerText().catch(() => 'NONE'),
      network_events: network.length,
    }
    await page.screenshot({ path: resolve(evidence, `${info.project.name}-03-at-100s.png`) })
  }
  let finalWaitTimedOut = false
  if (await button.isDisabled()) {
    try { await expect(button).toBeEnabled({ timeout: 320_000 }) }
    catch { finalWaitTimedOut = true }
  }
  stage.recovery = {
    completed: !finalWaitTimedOut,
    elapsed_ms: Date.now() - recoveryStarted,
    exceeded_100s: exceeded100s,
  }
  stage.recovery_code = await page.locator('aside .verdict__code').innerText().catch(() => 'NONE')
  await page.screenshot({ path: resolve(evidence, `${info.project.name}-04-recovered.png`) })

  const browser = page.context().browser()
  const result = {
    schema_version: 'verimod/w6-rpc-recovery/v1',
    run_id: runId,
    project: info.project.name,
    browser_name: browser?.browserType().name() ?? 'unknown',
    browser_version: browser?.version() ?? 'unknown',
    channel: info.project.use.channel || 'playwright-default',
    viewport: info.project.use.viewport,
    platform: process.platform,
    mobile_emulation: info.project.name === 'mobile-emulation',
    physical_network_disabled: false,
    failure_injection: 'PLAYWRIGHT_ROUTE_ABORT_INTERNETDISCONNECTED_FOR_BOTH_APPROVED_RPC_HOSTS',
    input_sha256: inputSha256,
    receipt_hash: value.receipt_hash,
    started_at: new Date(started).toISOString(),
    finished_at: new Date().toISOString(),
    stages: stage,
    network,
    private_material_access: false,
    tx_sent: false,
  }
  writeFileSync(resolve(evidence, `${info.project.name}-recovery.json`), JSON.stringify(result, null, 2) + '\n')
  await info.attach('rpc-network-log', { body: Buffer.from(JSON.stringify(network, null, 2)), contentType: 'application/json' })

  expect(finalWaitTimedOut).toBe(false)
  expect(stage.recovery_code).toBe('VALID')
})
