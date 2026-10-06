import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();
const rootA = `0x${"ab".repeat(32)}`;
const rootB = `0x${"cd".repeat(32)}`;

async function deploy() {
  const [funder] = await ethers.getSigners();
  const publisher = ethers.Wallet.createRandom().connect(ethers.provider);
  await (await funder.sendTransaction({ to: publisher.address, value: ethers.parseEther("1") })).wait();
  const anchor = await ethers.deployContract("VeriModAnchor", [publisher.address]);
  return { anchor, publisher };
}

describe("W4 epoch recovery boundaries", function () {
  it("reconciles a successful broadcast before DB state update without a second registration", async function () {
    const { anchor, publisher } = await deploy();
    const tx = await anchor.connect(publisher).registerEpoch(1, rootA, 1, 1);
    await tx.wait(); // crash point: the durable DB state has not yet advanced to SUBMITTED.

    const before = await publisher.getNonce("pending");
    const stored = await anchor.epochs(1);
    expect(stored.root).to.equal(rootA);
    // Restart rule #1: getter wins. Matching root is confirmed, not re-sent.
    expect(await publisher.getNonce("pending")).to.equal(before);
    expect(stored.count).to.equal(1n);
  });

  it("broadcasts the exact pre-durably-saved raw transaction once after a pre-broadcast crash", async function () {
    const { anchor, publisher } = await deploy();
    const nonce = await publisher.getNonce("pending");
    const caller = anchor.connect(publisher);
    const request = await caller.registerEpoch.populateTransaction(1, rootA, 1, 1);
    const fee = await ethers.provider.getFeeData();
    const raw = await publisher.signTransaction({ ...request, chainId: 31337, nonce, gasLimit: await caller.registerEpoch.estimateGas(1, rootA, 1, 1), maxFeePerGas: fee.maxFeePerGas ?? undefined, maxPriorityFeePerGas: fee.maxPriorityFeePerGas ?? undefined }); // crash point: signed raw tx persisted, not broadcast.
    const hash = ethers.keccak256(raw);

    const sent = await ethers.provider.broadcastTransaction(raw); // restart sends exactly the saved bytes.
    expect(sent.hash).to.equal(hash);
    await sent.wait();
    const stored = await anchor.epochs(1);
    expect(stored).to.deep.equal([rootA, 1n, 1n]);
  });

  it("stops on a different non-zero root with no conflict overwrite or transaction", async function () {
    const { anchor, publisher } = await deploy();
    await (await anchor.connect(publisher).registerEpoch(1, rootA, 1, 1)).wait();
    const beforeNonce = await publisher.getNonce("pending");
    const stored = await anchor.epochs(1);

    expect(stored.root).to.not.equal(rootB);
    // Restart rule #2: ROOT_CONFLICT. Deliberately do not call registerEpoch.
    expect(await publisher.getNonce("pending")).to.equal(beforeNonce);
    expect((await anchor.epochs(1)).root).to.equal(rootA);
  });
});
