import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

test('LIVE results cannot be mistaken for another input, mode or failed request', async ({ page }) => {
  const bundle = JSON.parse(readFileSync(resolve('../docs/handoffs/w4-anchored-epoch-public/20261020-r01/receipt-0.bundle.json'), 'utf8'))
  bundle.proof = null
  bundle.anchor = null
  const data = {
    bundle,
    private_package: {
      receipt_id: bundle.receipt_body.receipt_id,
      content_commitment: bundle.receipt_body.content_commitment,
      content_salt: '00'.repeat(32),
    },
    state: 'PENDING_ANCHOR',
  }
  let calls = 0
  let releaseFailure: (() => void) | undefined
  const hold = new Promise<void>((resolveHold) => { releaseFailure = resolveHold })
  await page.route('**/api/decisions', async route => {
    calls++
    if (calls === 1 || calls === 3) {
      await route.fulfill({ status: 201, json: { ok: true, request_id: 'mock-success', data } })
    } else {
      await hold
      await route.fulfill({ status: 503, json: { ok: false, request_id: 'mock-failure', error: { code: 'INFERENCE_UNAVAILABLE', retryable: true } } })
    }
  })
  await page.goto('/check')
  const input = page.locator('#check-text')
  const mode = page.locator('#decision-mode')
  await input.fill('안전한 예시 문장입니다.')
  await page.getByRole('button', { name: '실제 판정서 발급' }).click()
  await expect(page.getByText('PENDING_ANCHOR · 아직 공개 Base 검증 결과가 아닙니다')).toBeVisible()
  await input.fill('다른 예시 문장입니다.')
  await expect(page.getByText('PENDING_ANCHOR · 아직 공개 Base 검증 결과가 아닙니다')).toHaveCount(0)
  await page.getByRole('button', { name: '실제 판정서 발급' }).click()
  await expect(input).toBeDisabled()
  await expect(mode).toBeDisabled()
  await expect(page.getByRole('button', { name: '승인 예시' })).toBeDisabled()
  releaseFailure?.()
  await expect(page.getByRole('alert')).toContainText('실제 AI 추론을 사용할 수 없어')
  await expect(input).toBeEnabled()
  await expect(page.getByText('PENDING_ANCHOR · 아직 공개 Base 검증 결과가 아닙니다')).toHaveCount(0)
  await page.getByRole('button', { name: '실제 판정서 발급' }).click()
  await expect(page.getByText('PENDING_ANCHOR · 아직 공개 Base 검증 결과가 아닙니다')).toBeVisible()
  await mode.selectOption('SYNTHETIC')
  await mode.selectOption('LIVE')
  await expect(page.getByText('PENDING_ANCHOR · 아직 공개 Base 검증 결과가 아닙니다')).toHaveCount(0)
})
