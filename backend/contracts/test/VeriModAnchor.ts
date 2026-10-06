import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("VeriModAnchor", function () {
  const root = "0x" + "ab".repeat(32);

  async function deploy() {
    const [publisher, other] = await ethers.getSigners();
    const anchor = await ethers.deployContract("VeriModAnchor", [publisher.address]);
    return { anchor, publisher, other };
  }

  it("rejects a zero publisher at deployment", async function () {
    await expect(ethers.deployContract("VeriModAnchor", [ethers.ZeroAddress]))
      .to.be.revertedWithCustomError(await ethers.getContractFactory("VeriModAnchor"), "NotPublisher");
  });

  it("registers an epoch and exposes it through the getter", async function () {
    const { anchor, publisher } = await deploy();
    await anchor.connect(publisher).registerEpoch(1, root, 3, 7);
    expect(await anchor.epochs(1)).to.deep.equal([root, 3n, 7n]);
  });

  it("rejects a duplicate epoch", async function () {
    const { anchor, publisher } = await deploy();
    await anchor.connect(publisher).registerEpoch(1, root, 1, 1);
    await expect(anchor.connect(publisher).registerEpoch(1, root, 2, 1))
      .to.be.revertedWithCustomError(anchor, "EpochExists");
  });

  it("rejects an unauthorized publisher", async function () {
    const { anchor, other } = await deploy();
    await expect(anchor.connect(other).registerEpoch(1, root, 1, 1))
      .to.be.revertedWithCustomError(anchor, "NotPublisher");
  });

  it("rejects an empty epoch", async function () {
    const { anchor, publisher } = await deploy();
    await expect(anchor.connect(publisher).registerEpoch(1, root, 0, 1))
      .to.be.revertedWithCustomError(anchor, "EmptyEpoch");
  });

  it("rejects a zero root", async function () {
    const { anchor, publisher } = await deploy();
    await expect(anchor.connect(publisher).registerEpoch(1, ethers.ZeroHash, 1, 1))
      .to.be.revertedWithCustomError(anchor, "ZeroRoot");
  });

  it("emits the complete EpochRegistered arguments", async function () {
    const { anchor, publisher } = await deploy();
    await expect(anchor.connect(publisher).registerEpoch(42, root, 9, 65535))
      .to.emit(anchor, "EpochRegistered")
      .withArgs(42, root, 9, 65535);
  });

  it("stores an arbitrary protocol version; support is a verifier concern", async function () {
    const { anchor, publisher } = await deploy();
    await anchor.connect(publisher).registerEpoch(2, root, 1, 65535);
    expect((await anchor.epochs(2)).protocolVersion).to.equal(65535n);
  });
});
