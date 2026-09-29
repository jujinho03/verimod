import { Wallet, formatEther } from "ethers";

const endpoints = [
  ["primary", process.env.VERIMOD_BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org"],
  ["backup", process.env.VERIMOD_BASE_SEPOLIA_BACKUP_RPC_URL ?? "https://base-sepolia-rpc.publicnode.com"],
];

// Read raw remote responses; configured network metadata is not chain evidence.
async function rpc(url, method, params = []) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("RPC HTTP failure");
  const body = await response.json();
  if (body.error || body.id !== 1 || body.jsonrpc !== "2.0" ||
      typeof body.result !== "string" || !/^0x[0-9a-f]+$/i.test(body.result)) {
    throw new Error("Invalid RPC quantity response");
  }
  return BigInt(body.result);
}

let address;
if (process.env.VERIMOD_DEPLOYER_PRIVATE_KEY) {
  try {
    address = new Wallet(process.env.VERIMOD_DEPLOYER_PRIVATE_KEY).address;
  } catch {
    console.error("Invalid dedicated test wallet private key (value omitted).");
    process.exit(1);
  }
}

for (const [name, url] of endpoints) {
  if (!url?.trim()) {
    console.error(`${name}: RPC URL is empty.`);
    process.exitCode = 1;
    continue;
  }
  try {
    const chainId = await rpc(url, "eth_chainId");
    if (chainId !== 84532n) {
      console.error(`${name}: wrong remote chainId=${chainId}; expected 84532 (0x14a34).`);
      process.exitCode = 1;
      continue;
    }
    const block = await rpc(url, "eth_blockNumber");
    const walletInfo = address
      ? ` wallet=${address} balance=${formatEther(await rpc(url, "eth_getBalance", [address, "latest"]))} ETH`
      : " wallet=not configured (read-only check)";
    console.log(`${name}: remote chainId=${chainId} block=${block}${walletInfo}`);
  } catch {
    // Provider errors can contain credential-bearing URLs; do not echo them.
    console.error(`${name}: RPC validation failed (transport, timeout or invalid response).`);
    process.exitCode = 1;
  }
}
