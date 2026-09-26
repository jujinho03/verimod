import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";

const baseSepoliaRpcUrl = process.env.VERIMOD_BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
const baseSepoliaBackupRpcUrl = process.env.VERIMOD_BASE_SEPOLIA_BACKUP_RPC_URL ?? "https://base-sepolia-rpc.publicnode.com";
const deployerAccounts = process.env.VERIMOD_DEPLOYER_PRIVATE_KEY
  ? [process.env.VERIMOD_DEPLOYER_PRIVATE_KEY]
  : "remote";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  networks: {
    baseSepolia: {
      type: "http",
      chainType: "op",
      chainId: 84532,
      url: baseSepoliaRpcUrl,
      accounts: deployerAccounts,
    },
    baseSepoliaBackup: {
      type: "http",
      chainType: "op",
      chainId: 84532,
      url: baseSepoliaBackupRpcUrl,
      accounts: deployerAccounts,
    },
  },
  solidity: {
    profiles: {
      default: {
        version: "0.8.34",
      },
      production: {
        version: "0.8.34",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
});
