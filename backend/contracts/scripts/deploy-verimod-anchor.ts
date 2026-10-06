import { network } from "hardhat";

const publisher = process.env.VERIMOD_PUBLISHER_ADDRESS;
if (!publisher) throw new Error("VERIMOD_PUBLISHER_ADDRESS is required and must be the dedicated publisher EOA.");

const { ethers } = await network.connect();
const [deployer] = await ethers.getSigners();
if (deployer.address.toLowerCase() !== publisher.toLowerCase()) {
  throw new Error("Deployer key does not match VERIMOD_PUBLISHER_ADDRESS.");
}

const anchor = await ethers.deployContract("VeriModAnchor", [publisher]);
await anchor.waitForDeployment();
const deployment = anchor.deploymentTransaction();
const receipt = deployment ? await deployment.wait() : null;
console.log(`VeriModAnchor deployed: ${await anchor.getAddress()}`);
if (deployment && receipt) {
  console.log(`Deployment tx: ${deployment.hash}`);
  console.log(`Deployment block: ${receipt.blockNumber}`);
}
