import { expect } from "chai";
import { assertDurableSubmissionAck, broadcastAfterDurableAck, requestDurableSubmissionAck, type FrozenEpoch } from "../scripts/fDurabilityGate.js";

const frozen: FrozenEpoch & { txHash: string; nonce: string } = {
  epochId: "1", root: `0x${"a".repeat(64)}`, count: "2", protocolVersion: "1",
  chainId: "84532", contractAddress: "0xd17ba590b23e984e3f3408bcdc3529be9868ec50",
  txHash: `0x${"b".repeat(64)}`, nonce: "7",
};
const acknowledgement = () => ({
  epoch_id: frozen.epochId, merkle_root: frozen.root, receipt_count: 2, protocol_version: 1,
  status: "SUBMITTING", tx_hash: frozen.txHash, nonce: frozen.nonce,
  chain_id: frozen.chainId, contract_address: frozen.contractAddress,
});

describe("F SQLite pre-broadcast gate", function () {
  it("permits broadcast only after an exact durable F acknowledgement", async function () {
    let broadcasts = 0;
    await broadcastAfterDurableAck(async () => acknowledgement(), frozen, async () => { broadcasts += 1; return "sent"; });
    expect(broadcasts).to.equal(1);
  });

  it("prevents broadcast when F rejects, times out, or returns mismatched transaction data", async function () {
    for (const bad of [
      async () => { throw new Error("SQLite unavailable"); },
      async () => ({ ...acknowledgement(), tx_hash: `0x${"c".repeat(64)}` }),
      async () => ({ ...acknowledgement(), nonce: "8" }),
      async () => ({ ...acknowledgement(), merkle_root: `0x${"d".repeat(64)}` }),
      async () => ({ ...acknowledgement(), chain_id: "31337" }),
    ]) {
      let broadcasts = 0;
      let rejected = false;
      try { await broadcastAfterDurableAck(bad, frozen, async () => { broadcasts += 1; }); }
      catch { rejected = true; }
      expect(rejected).to.equal(true);
      expect(broadcasts).to.equal(0);
    }
    let broadcasts = 0;
    const timedOut = () => requestDurableSubmissionAck(
      { ...frozen, rawTransaction: "0x00" }, process.execPath, ["-e", "setTimeout(() => {}, 1000)"], 20,
    );
    try { await broadcastAfterDurableAck(timedOut, frozen, async () => { broadcasts += 1; }); }
    catch { /* expected timeout */ }
    expect(broadcasts).to.equal(0);
  });

  it("rejects unapproved epoch and contract acknowledgement fields", function () {
    expect(() => assertDurableSubmissionAck(frozen, { ...acknowledgement(), epoch_id: "2" })).to.throw("epoch_id");
    expect(() => assertDurableSubmissionAck(frozen, { ...acknowledgement(), contract_address: `0x${"e".repeat(40)}` })).to.throw("contract_address");
  });
});
