import { beforeAll, describe, expect, it } from 'vitest'
import { buildSeedState } from '../store/seed'
import type { VerificationBundle } from '../domain/types'
import { VeriModApiClient } from './client'
import { ApiClientError } from './types'

let bundle: VerificationBundle

beforeAll(async () => {
  const seed = await buildSeedState()
  const receipt = seed.receipts.find((item) => item.body.event_kind === 'DECISION')!
  bundle = { receipt_body: receipt.body, receipt_hash: receipt.hash, proof: null, anchor: null }
})

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('VeriModApiClient W3 boundary', () => {
  it('accepts the proposed decision envelope and never requires original_text from the server', async () => {
    let sent: RequestInit | undefined
    const client = new VeriModApiClient({
      baseUrl: 'https://api.example.test/',
      fetcher: async (_input, init) => {
        sent = init
        return json({
          ok: true,
          request_id: 'req-1',
          data: {
            bundle,
            private_package: {
              receipt_id: bundle.receipt_body.receipt_id,
              content_commitment: bundle.receipt_body.content_commitment,
              content_salt: 'ab'.repeat(32),
            },
          },
        }, 201)
      },
    })
    const result = await client.postDecision({ contract_pending: true }, 'idem-1')
    expect(result.data.bundle).toEqual(bundle)
    if (!sent) throw new Error('request not captured')
    expect(JSON.parse(String(sent.body))).toEqual({ contract_pending: true })
    expect((sent.headers as Record<string, string>)['Idempotency-Key']).toBe('idem-1')
    expect(JSON.stringify(result)).not.toContain('original_text')
  })

  it('maps a structured server failure without exposing the response body', async () => {
    const client = new VeriModApiClient({ fetcher: async () => json({
      ok: false,
      request_id: 'req-503',
      error: { code: 'INFERENCE_UNAVAILABLE', retryable: true },
    }, 503) })
    await expect(client.postDecision({}, 'idem-2')).rejects.toMatchObject({
      kind: 'HTTP', status: 503, code: 'INFERENCE_UNAVAILABLE', retryable: true, requestId: 'req-503',
    })
  })

  it('separates timeout, network, and invalid response failures', async () => {
    const timeout = new VeriModApiClient({
      timeoutMs: 1,
      fetcher: async (_input, init) => new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      }),
    })
    await expect(timeout.getBundle('receipt')).rejects.toMatchObject({ kind: 'TIMEOUT', retryable: true })

    const network = new VeriModApiClient({ fetcher: async () => { throw new TypeError('offline') } })
    await expect(network.getBundle('receipt')).rejects.toMatchObject({ kind: 'NETWORK', retryable: true })

    const invalid = new VeriModApiClient({ fetcher: async () => json({ ok: true, request_id: 'req-bad', data: {} }) })
    await expect(invalid.getBundle('receipt')).rejects.toBeInstanceOf(ApiClientError)
    await expect(invalid.getBundle('receipt')).rejects.toMatchObject({ kind: 'INVALID_RESPONSE' })
  })

  it('leaves the GET receipt read model behind a caller decoder until T freezes it', async () => {
    const client = new VeriModApiClient({ fetcher: async (input) => {
      expect(String(input)).toBe('/api/receipts/id%2Fwith%20space')
      return json({ ok: true, request_id: 'req-read', data: { status: 'PENDING' } })
    } })
    const result = await client.getReceipt('id/with space', (value) => {
      if (typeof value !== 'object' || value === null || !('status' in value)) throw new Error('fixture')
      return (value as { status: string }).status
    })
    expect(result.data).toBe('PENDING')
  })
})
