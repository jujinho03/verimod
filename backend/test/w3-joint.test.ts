import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { exerciseW3Issuance, actualFixtureAdapter } from './helpers/w3-joint.js'
import { createApp } from '../src/app.js'
import { openDatabase } from '../src/database.js'
import type { W3InferenceOutput } from '../src/inference.js'

describe('A actual fixture -> F authoritative issuance -> shared protocol', () => {
  it('issues all three fixtures, preserves scores/manifest, keeps privacy and verifies Merkle proofs', async () => {
    const result=await exerciseW3Issuance()
    expect(result.count).toBe(3)
    expect(result.results.every(row=>row.public_privacy==='PASS')).toBe(true)
  })
  it.each(['extra_label','wrong_version','extra_field','invalid_evidence'])('fails closed on shared actual-schema violation: %s', async (kind) => {
    const db=openDatabase()
    try {
      const app=createApp({database:db,inference:{async infer(input) {
        const output=await actualFixtureAdapter.infer(input)
        const bad: Record<string,unknown> = {...structuredClone(output)}
        if(kind==='extra_label') (bad.scores_ppm as Record<string,number>).spam=1
        if(kind==='wrong_version') bad.taxonomy_version='w3-fixture-1'
        if(kind==='extra_field') bad.extra='invalid'
        if(kind==='invalid_evidence') bad.evidence=[{start:0,end:1,label_id:'spam',method_id:'toy',method_version:'1'}]
        return bad as unknown as W3InferenceOutput
      }},policy:{async evaluate(){return {policy_manifest_hash:`0x${'2'.repeat(64)}`,action:'HUMAN_REVIEW',reason_codes:[],triggered_rule_ids:[]}}}})
      const res=await request(app).post('/api/decisions').set({'x-demo-principal':'joint-test','x-demo-role':'DEMO_USER','Idempotency-Key':'bad-output'}).send({text:'오늘 회의 자료를 정리해서 팀원들에게 공유했습니다.'})
      expect(res.status).toBe(503)
      expect(res.body.error.code).toBe('INFERENCE_UNAVAILABLE')
      for(const table of ['receipts','content_store','epoch_members','idempotency_records']) {
        expect(db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n).toBe(0)
      }
    } finally {db.close()}
  })
})
