import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Wallet } from "ethers";

const envPath = resolve(".env");
if (existsSync(envPath)) {
  throw new Error(".env already exists; refusing to overwrite a wallet configuration");
}

const wallet = Wallet.createRandom();
const env = [
  "VERIMOD_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org",
  "VERIMOD_BASE_SEPOLIA_BACKUP_RPC_URL=https://base-sepolia-rpc.publicnode.com",
  `VERIMOD_DEPLOYER_PRIVATE_KEY=${wallet.privateKey}`,
  "",
].join("\n");

writeFileSync(envPath, env, { encoding: "utf8", mode: 0o600, flag: "wx" });
console.log(`Dedicated Base Sepolia test wallet created: ${wallet.address}`);
console.log("Private key was saved only to ignored .env and is not printed.");
