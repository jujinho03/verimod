import { expect } from 'chai'
import { mkdirSync, writeFileSync } from 'node:fs'
import { network } from 'hardhat'
import { exerciseW3Issuance } from '../../test/helpers/w3-joint.js'

describe('W3 A/F/T joint checkpoint — LOCAL HARDHAT ONLY', function () {
  it('registers the actual-fixture authoritative receipt epoch and reads back its exact root/count', async function () {
    const issued=await exerciseW3Issuance()
    const { ethers }=await network.create()
    const [publisher,other]=await ethers.getSigners()
    const anchor=await ethers.deployContract('VeriModAnchor',[publisher.address])
    await anchor.waitForDeployment()
    const epochId=1n
    await expect(anchor.connect(other).registerEpoch(epochId,issued.root,issued.count,1))
      .to.be.revertedWithCustomError(anchor,'NotPublisher')
    const tx=await anchor.connect(publisher).registerEpoch(epochId,issued.root,issued.count,1)
    const mined=await tx.wait()
    expect(mined?.status).to.equal(1)
    expect(await anchor.epochs(epochId)).to.deep.equal([issued.root,3n,1n])
    expect(await anchor.publisher()).to.equal(publisher.address)
    await expect(anchor.connect(publisher).registerEpoch(epochId,issued.root,issued.count,1))
      .to.be.revertedWithCustomError(anchor,'EpochExists')
    const chain=await ethers.provider.getNetwork()
    expect(chain.chainId).to.equal(31337n)
    const report={...issued,status:'TEAM_W3_INTEGRATION_PASS',generated_at:new Date().toISOString(),
      network:'LOCAL HARDHAT',public_chain_evidence:false,boundary:'LOCAL HARDHAT — NOT PUBLIC CHAIN EVIDENCE',
      epoch_id:epochId.toString(),protocol_version_number:1,contract_address:await anchor.getAddress(),
      publisher:publisher.address,chain_id:chain.chainId.toString(),register_tx:tx.hash,
      register_block:mined?.blockNumber,register_status:mined?.status,read_back:'MATCH',
      publisher_authorization:'PASS',duplicate_protection:'PASS',external_anchor_state:'PENDING_ANCHOR'}
    if(process.env.W3_TEAM_REPORT==='1') {
      const dir=new URL('../../../docs/evidence/w3-team/',import.meta.url)
      mkdirSync(dir,{recursive:true})
      writeFileSync(new URL('joint-checkpoint.json',dir),JSON.stringify(report,null,2)+'\n')
    }
  })
})
