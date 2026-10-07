import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import request from 'supertest'
import { canonicalize, canonicalBytes } from '@verimod/protocol/canonical'
import { domainHash, DOMAINS, bytesToHex, hexToBytes, type Hex32 } from '@verimod/protocol/hash'
import { contentCommitment, receiptHash } from '@verimod/protocol/receipt'
import { validateBundle, validateReceiptBody } from '@verimod/protocol/schema'
import { freezeEpoch } from '@verimod/protocol/epoch'
import { leafHash, verifyInclusion } from '@verimod/protocol/merkle'
import type { ReceiptBody } from '@verimod/protocol/types'
import { createApp } from '../../src/app.js'
import { openDatabase } from '../../src/database.js'
import type { InferenceAdapter, PolicyEvaluator, W3InferenceOutput } from '../../src/inference.js'

const read = (path: string) => JSON.parse(readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8'))
const fixture = read('ai/fixtures/w3_real_model_i1_fixture.json')
const manifest = read('ai/artifacts/manifests/AI07-BL-KLUE-RB-45126-R01.model_manifest.json')
const headers = {'x-demo-principal':'w3-joint-synthetic-user', 'x-demo-role':'DEMO_USER'}

/** Actual saved scores only. Rebind the commitment to F's fresh private salt.
 * This is fixture replay, not a new inference or proof of model execution. */
export const actualFixtureAdapter: InferenceAdapter = {
  async infer({text, contentCommitment}) {
    const row = fixture.results.find((item: {synthetic_text:string}) => item.synthetic_text === text)
    if (!row) throw new Error('Only authored synthetic fixture inputs allowed')
    return {...structuredClone(row.i1_response.inference), content_commitment:contentCommitment} as W3InferenceOutput
  },
}

export async function exerciseW3Issuance() {
  const database = openDatabase()
  const fixedTime = '2026-10-07T00:00:00.000Z'
  const modelHash = await domainHash(DOMAINS.model, canonicalBytes(manifest))
  assert.equal(modelHash, fixture.model_manifest_hash)
  const policyManifest = {manifest_version:'policy-manifest/1', policy_id:'w3-joint-checkpoint-only',
    scope:'TEST_DEPENDENCY_ONLY', action:'HUMAN_REVIEW', threshold_selection:false}
  const policyHash = await domainHash(DOMAINS.policy, canonicalBytes(policyManifest))
  const policy: PolicyEvaluator = {async evaluate() {return {policy_manifest_hash:policyHash,
    action:'HUMAN_REVIEW',reason_codes:['W3_JOINT_TEST_ONLY'],triggered_rule_ids:[]}}}
  const app = createApp({database,inference:actualFixtureAdapter,policy,now:()=>new Date(fixedTime),actualModelManifest:manifest})
  const results: {fixture_id:string; receipt_id:string; issuer_seq:number; receipt_hash:Hex32; receipt_body:ReceiptBody; i1:string; issuance:string; public_privacy:string; status:string}[] = []
  try {
    const publicManifest = await request(app).get('/api/manifests')
    assert.equal(publicManifest.status,200)
    assert.equal(publicManifest.body.data.actual_model.hash,modelHash)
    assert.deepEqual(publicManifest.body.data.actual_model.manifest,manifest)
    for (const row of fixture.results) {
      const response = await request(app).post('/api/decisions').set({...headers,'Idempotency-Key':row.fixture_id}).send({text:row.synthetic_text})
      assert.equal(response.status,201)
      const data=response.body.data; const body=data.bundle.receipt_body
      assert.equal(data.state,'PENDING_ANCHOR')
      assert.equal(validateReceiptBody(body).ok,true)
      assert.equal(validateBundle(data.bundle).ok,true)
      assert.notEqual(body.receipt_id,row.i1_response.inference.inference_id)
      assert.match(body.receipt_id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
      assert.equal(body.issuer_seq,results.length+1)
      assert.deepEqual(body.payload.inference.scores_ppm,row.i1_response.inference.scores_ppm)
      assert.equal(body.payload.inference.model_manifest_hash,modelHash)
      assert.equal(body.payload.inference.score_semantics,'UNCALIBRATED')
      assert.equal(body.content_commitment,await contentCommitment(`0x${data.private_package.content_salt}`,row.synthetic_text))
      assert.equal(await receiptHash(body),data.bundle.receipt_hash)
      const parsed=validateReceiptBody(Object.fromEntries(Object.entries(body).reverse()))
      assert.equal(parsed.ok,true)
      const reordered=parsed.value
      assert.equal(canonicalize(reordered),canonicalize(body))
      assert.equal(await receiptHash(reordered),data.bundle.receipt_hash)
      const stored=database.prepare('SELECT canonical_body FROM receipts WHERE receipt_id = ?').get(body.receipt_id) as {canonical_body:string}
      assert.equal(stored.canonical_body,canonicalize(body))
      for (const suffix of ['', '/bundle']) {
        const publicResponse=await request(app).get(`/api/receipts/${body.receipt_id}${suffix}`)
        assert.equal(publicResponse.status,200)
        const serialized=JSON.stringify(publicResponse.body)
        assert.equal(serialized.includes(row.synthetic_text),false)
        assert.equal(serialized.includes(data.private_package.content_salt),false)
        assert.equal(serialized.includes('content_salt'),false)
        assert.equal(serialized.includes('private_package'),false)
      }
      const replay=await request(app).post('/api/decisions').set({...headers,'Idempotency-Key':row.fixture_id}).send({text:row.synthetic_text})
      assert.equal(replay.status,201); assert.deepEqual(replay.body.data,data)
      results.push({fixture_id:row.fixture_id,receipt_id:body.receipt_id,issuer_seq:body.issuer_seq,
        receipt_hash:data.bundle.receipt_hash,receipt_body:body,i1:'PASS',issuance:'PASS',public_privacy:'PASS',status:'PENDING_ANCHOR'})
    }
    const members=results.map(({receipt_id,receipt_hash,issuer_seq})=>({receipt_id,receipt_hash,issuer_seq}))
    const frozen=await freezeEpoch(members)
    const repeat=await freezeEpoch([...members].reverse())
    assert.deepEqual(frozen,repeat)
    const leaves=[]
    for (const member of frozen.members) {
      const proof=frozen.proofs[member.receipt_hash]
      assert.equal(await verifyInclusion(hexToBytes(member.receipt_hash),proof.leaf_index,proof.tree_size,proof.siblings.map(hexToBytes),hexToBytes(frozen.root)),true)
      leaves.push({receipt_hash:member.receipt_hash,leaf_hash:bytesToHex(await leafHash(hexToBytes(member.receipt_hash))),proof})
    }
    assert.equal(database.prepare('SELECT COUNT(*) AS n FROM receipts').get()?.n,3)
    return {run_id:fixture.run_id,fixture_type:fixture.fixture_type,fixture_count:3,model_manifest_hash:modelHash,
      model_artifact_sha256:fixture.model_artifact_sha256,results,root:frozen.root,count:frozen.members.length,
      issuer_seq_min:frozen.issuer_seq_min,issuer_seq_max:frozen.issuer_seq_max,leaves,
      canonical_hash_deterministic:true,merkle_order_deterministic:true,public_manifest_hash_verified:true,
      idempotent_replay:'PASS',raw_text_exported:false,salts_exported:false,
      policy_scope:'FIXED HUMAN_REVIEW TEST DEPENDENCY; NO THRESHOLD/POLICY LOCK',
      receipt_state:'PENDING_ANCHOR',test_accessed:false,secondary_accessed:false,model_inference_executed:false}
  } finally {database.close()}
}
