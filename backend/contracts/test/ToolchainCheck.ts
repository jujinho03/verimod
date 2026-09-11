import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("ToolchainCheck", function () {
  it("deploys and responds to ping", async function () {
    const check = await ethers.deployContract("ToolchainCheck");

    expect(await check.ping()).to.equal("verimod-contracts");
  });
});
