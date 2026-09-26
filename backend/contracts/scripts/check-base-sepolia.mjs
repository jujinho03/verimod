import { JsonRpcProvider, Wallet, formatEther } from "ethers";

const address = new Wallet(process.env.VERIMOD_DEPLOYER_PRIVATE_KEY).address;
const endpoints = [
  ["primary", process.env.VERIMOD_BASE_SEPOLIA_RPC_URL],
  ["backup", process.env.VERIMOD_BASE_SEPOLIA_BACKUP_RPC_URL],
];

for (const [name, url] of endpoints) {
  const provider = new JsonRpcProvider(url, 84532, { staticNetwork: true });
  const [network, block, balance] = await Promise.all([
    provider.getNetwork(),
    provider.getBlockNumber(),
    provider.getBalance(address),
  ]);
  if (network.chainId !== 84532n) throw new Error(`${name} returned chain ${network.chainId}`);
  console.log(`${name}: chainId=${network.chainId} block=${block} wallet=${address} balance=${formatEther(balance)} ETH`);
}
