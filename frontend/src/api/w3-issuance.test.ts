/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { randomHex32 } from '../domain/hash'
import { decodeDecisionCreated } from './client'

// Public-only evidence from an actual F issuance run. Private material is generated
// afresh in memory for decoder shape checks; no issuer salt is exported or reused.
const checkpoint=JSON.parse(readFileSync(new URL('../../../docs/evidence/w3-team/joint-checkpoint.json',import.meta.url),'utf8'))
const value=()=>{
  const row=checkpoint.results[0]
  return {bundle:{receipt_body:row.receipt_body,receipt_hash:row.receipt_hash,proof:null,anchor:null},
    private_package:{receipt_id:row.receipt_id,content_commitment:row.receipt_body.content_commitment,content_salt:randomHex32().slice(2)},
    state:'PENDING_ANCHOR'}
}
describe('actual backend issuance response consumer',()=>{
  it('accepts the current state field and actual two-score receipt',()=>{
    const data=value()
    expect(decodeDecisionCreated(data).state).toBe('PENDING_ANCHOR')
    expect(decodeDecisionCreated(data).bundle.receipt_body).toEqual(data.bundle.receipt_body)
  })
  it('rejects a false public anchor claim or missing state on actual issuance',()=>{
    const data: Record<string,unknown>=value()
    data.state='ANCHORED'
    expect(()=>decodeDecisionCreated(data)).toThrow()
    delete data.state
    expect(()=>decodeDecisionCreated(data)).toThrow()
  })
})
