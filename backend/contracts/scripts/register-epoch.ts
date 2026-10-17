import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { network } from "hardhat";
import { broadcastAfterDurableAck, durableAckWireShape, requestDurableSubmissionAck, type FrozenEpoch } from "./fDurabilityGate.js";

type Journal = {
  epochId: string;
  root: string;
  count: string;
  protocolVersion: string;
  nonce: number;
  rawTransaction: string;
  txHash: string;
  // F owns the authoritative confirmation transition.  This sender records
  // only durable submission progress and must never present a mined receipt
  // as F's verified, 12-confirmation state.
  state: "SUBMITTING" | "SUBMITTED" | "FAILED";
};

const requireEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};
const asUint = (name: string, max: bigint): bigint => {
  const value = requireEnv(name);
  if (!/^[1-9]\d*$/.test(value)) throw new Error(`${name} must be a positive decimal integer`);
  const parsed = BigInt(value);
  if (parsed > max) throw new Error(`${name} is out of ABI range`);
  return parsed;
};
const root = requireEnv("VERIMOD_EPOCH_ROOT").toLowerCase();
if (!/^0x[0-9a-f]{64}$/.test(root) || root === `0x${"0".repeat(64)}`) throw new Error("VERIMOD_EPOCH_ROOT must be a non-zero bytes32");
const epochId = asUint("VERIMOD_EPOCH_ID", (1n << 64n) - 1n);
const count = asUint("VERIMOD_EPOCH_COUNT", (1n << 32n) - 1n);
const protocolVersion = asUint("VERIMOD_PROTOCOL_VERSION", (1n << 16n) - 1n);
const contractAddress = requireEnv("VERIMOD_ANCHOR_ADDRESS").toLowerCase();
if (!/^0x[0-9a-f]{40}$/.test(contractAddress)) throw new Error("VERIMOD_ANCHOR_ADDRESS must be an EVM address");
const APPROVED_CHAIN_ID = "84532";
const APPROVED_CONTRACT = "0xd17ba590b23e984e3f3408bcdc3529be9868ec50";
const APPROVED_PUBLISHER = "0xd47675be41ec3476f541c1d8d8a9f622c90182ed";
if (contractAddress !== APPROVED_CONTRACT) throw new Error("VERIMOD_ANCHOR_ADDRESS is not the approved W4 Base Sepolia contract");
const journalPath = resolve(process.env.VERIMOD_EPOCH_JOURNAL ?? `.runtime/epoch-${epochId}.json`);

function writeJournal(value: Journal): void {
  mkdirSync(dirname(journalPath), { recursive: true });
  const temp = `${journalPath}.tmp`;
  writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temp, journalPath);
}
function readJournal(): Journal | null {
  try { return JSON.parse(readFileSync(journalPath, "utf8")) as Journal; } catch { return null; }
}

const { ethers } = await network.connect();
const [publisher] = await ethers.getSigners();
const anchor = await ethers.getContractAt("VeriModAnchor", contractAddress, publisher);
const networkInfo = await ethers.provider.getNetwork();
if (networkInfo.chainId !== BigInt(APPROVED_CHAIN_ID)) throw new Error("connected RPC is not Base Sepolia");
if ((await anchor.publisher()).toLowerCase() !== APPROVED_PUBLISHER || publisher.address.toLowerCase() !== APPROVED_PUBLISHER) {
  throw new Error("configured signer or contract publisher is not the approved W4 publisher");
}
const existing = await anchor.epochs(epochId);
if (existing.count !== 0n) {
  if (existing.root.toLowerCase() !== root || existing.count !== count || existing.protocolVersion !== protocolVersion) {
    throw new Error("ROOT_CONFLICT: epoch is already registered with different root/count/version; no transaction sent");
  }
  console.log(`SUBMITTED existing epoch=${epochId} (same root/count/version); no resend; F trusted confirmation remains required`);
  process.exit(0);
}

let journal = readJournal();
if (journal && (journal.epochId !== String(epochId) || journal.root !== root || journal.count !== String(count) || journal.protocolVersion !== String(protocolVersion))) {
  throw new Error("Journal does not match frozen epoch input; refusing overwrite");
}
if (!journal) {
  const nonce = await publisher.getNonce("pending");
  const request = await anchor.registerEpoch.populateTransaction(epochId, root, count, protocolVersion);
  const fee = await ethers.provider.getFeeData();
  const rawTransaction = await publisher.signTransaction({ ...request, chainId: 84532, nonce, gasLimit: await anchor.registerEpoch.estimateGas(epochId, root, count, protocolVersion), maxFeePerGas: fee.maxFeePerGas ?? undefined, maxPriorityFeePerGas: fee.maxPriorityFeePerGas ?? undefined });
  const txHash = ethers.keccak256(rawTransaction);
  journal = { epochId: String(epochId), root, count: String(count), protocolVersion: String(protocolVersion), nonce, rawTransaction, txHash, state: "SUBMITTING" };
  // This is the durable pre-broadcast boundary. F must persist the same values in SQLite before invoking this sender.
  writeJournal(journal);
}

const expected: FrozenEpoch & { rawTransaction: string; txHash: string; nonce: string } = {
  epochId: String(epochId), root, count: String(count), protocolVersion: String(protocolVersion),
  chainId: APPROVED_CHAIN_ID, contractAddress, rawTransaction: journal.rawTransaction, txHash: journal.txHash, nonce: String(journal.nonce),
};
const executable = requireEnv("VERIMOD_F_PREBROADCAST_ACK_EXECUTABLE");
let args: string[];
try { args = JSON.parse(requireEnv("VERIMOD_F_PREBROADCAST_ACK_ARGS_JSON")) as string[]; }
catch { throw new Error("VERIMOD_F_PREBROADCAST_ACK_ARGS_JSON must be a JSON string array"); }
if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string") || args.length === 0) {
  throw new Error("VERIMOD_F_PREBROADCAST_ACK_ARGS_JSON must be a nonempty JSON string array");
}
const tx = await broadcastAfterDurableAck(
  async () => {
    const ack = await requestDurableSubmissionAck(expected, executable, args);
    return durableAckWireShape(ack);
  },
  expected,
  () => ethers.provider.broadcastTransaction(journal!.rawTransaction),
);
journal = { ...journal, txHash: tx.hash, state: "SUBMITTED" };
writeJournal(journal);
const receipt = await tx.wait();
if (!receipt || receipt.status !== 1 || receipt.to?.toLowerCase() !== contractAddress) throw new Error("REVERTED: transaction was not a successful trusted-contract call");
const event = receipt.logs.map((log) => { try { return anchor.interface.parseLog(log); } catch { return null; } }).find((log) => log?.name === "EpochRegistered");
const stored = await anchor.epochs(epochId);
if (!event || event.args.epochId !== epochId || event.args.root.toLowerCase() !== root || event.args.count !== count || event.args.protocolVersion !== protocolVersion || stored.root.toLowerCase() !== root || stored.count !== count || stored.protocolVersion !== protocolVersion) {
  throw new Error("Post-submit event/getter mismatch; do not create a replacement epoch");
}
console.log(`SUBMITTED epoch=${epochId} tx=${tx.hash} block=${receipt.blockNumber} root=${root} count=${count} version=${protocolVersion}; awaiting F trusted confirmation after 12 confirmations`);
