/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { validateReceiptBody } from './schema'
import { ACTUAL_NATIVE_CLASSES, ACTUAL_SCORE_KEYS } from './types'
import { ScoreBars } from '../features/ScoreBars'

const read = (path: string) => JSON.parse(readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8'))
const fixture = read('ai/fixtures/w3_real_model_i1_fixture.json')
const legacy = read('docs/examples/01-valid.json').receipt_body
const actual = (index = 0) => ({ ...structuredClone(legacy),
  content_commitment: fixture.results[index].i1_response.inference.content_commitment,
  payload: { ...structuredClone(legacy.payload), inference: structuredClone(fixture.results[index].i1_response.inference) },
})

describe('W3 actual vs historical synthetic taxonomy boundary', () => {
  it('keeps native three-class and exposed harmful keys distinct', () => {
    expect(ACTUAL_NATIVE_CLASSES).toEqual(['hate', 'offensive', 'none'])
    expect(ACTUAL_SCORE_KEYS).toEqual(['hate', 'offensive'])
  })
  it.each([0, 1, 2])('accepts actual selected-model fixture %i', (i) => {
    expect(validateReceiptBody(actual(i)).ok).toBe(true)
  })
  it('preserves the historical legacy synthetic receipt', () => {
    expect(validateReceiptBody(legacy).ok).toBe(true)
  })
  it.each(['none', 'spam', 'offensiv'])('rejects extra/malformed actual score %s', (label) => {
    const body = actual(); body.payload.inference.scores_ppm[label] = 1
    expect(validateReceiptBody(body).ok).toBe(false)
  })
  it('rejects missing harmful score and profile/version confusion', () => {
    const missing = actual(); delete missing.payload.inference.scores_ppm.offensive
    expect(validateReceiptBody(missing).ok).toBe(false)
    for (const [id, version] of [['verimod-example-ko','0'],['verimod-ko-beep-hate','0'],['unknown','1']]) {
      const body = actual(); Object.assign(body.payload.inference, {taxonomy_id:id, taxonomy_version:version})
      expect(validateReceiptBody(body).ok).toBe(false)
    }
    const mislabeled = structuredClone(legacy)
    Object.assign(mislabeled.payload.inference, {taxonomy_id:'verimod-ko-beep-hate',taxonomy_version:'1'})
    expect(validateReceiptBody(mislabeled).ok).toBe(false)
  })
  it('rejects cross-profile evidence labels', () => {
    const body = actual()
    body.payload.inference.evidence = [{start:0,end:1,label_id:'spam',method_id:'toy',method_version:'1'}]
    expect(validateReceiptBody(body).ok).toBe(false)
  })
  it('does not apply synthetic thresholds to actual score display', () => {
    const html = renderToStaticMarkup(createElement(ScoreBars, {scores:{hate:3770,offensive:14497}}))
    expect(html).toContain('정책 기준 미동결')
    expect(html).not.toContain('score-row__tick')
    expect(html).not.toContain('보정하지 않은 합성 점수')
  })
})
