import { network } from "hardhat";

const { ethers } = await network.connect();
const [deployer] = await ethers.getSigners();
// A deployment must never accept a publisher unrelated to the signing key.
// Keeping this optional makes an existing dedicated-key .env sufficient while
// still allowing an operator to pin the expected public address explicitly.
const publisher = process.env.VERIMOD_PUBLISHER_ADDRESS ?? deployer.address;
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
