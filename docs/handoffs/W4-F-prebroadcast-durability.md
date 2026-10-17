# W4 F → T: mandatory F SQLite boundary before broadcast

Current confirmation contract: [W4-F-trusted-confirmation.md](W4-F-trusted-confirmation.md). T ecc4edc contains the ACK normalization fix; the T 3444750 defect below is retained as historical context. Actual host wiring and confirmation still require approved execution.

F basis: `f157b9aa7506093207e6695cc4b0ff7b83b69088` plus the F-owned callback runner in this branch.
T audited source: `34447502f8843f1be585b56fb31c51b41c0f2fc7`, `backend/contracts/scripts/fDurabilityGate.ts` and `register-epoch.ts`.

**BLOCKED pending the T ACK composition fix and approved DB-host wiring.** T now invokes the pre-broadcast gate. F now provides a local CLI using the real adapter and SQLite. However, T's request function returns camelCase while its broadcast gate validates snake_case, so the pinned composition rejects even a valid durable F ACK. The read-only pinned-T integration test reproduces this with zero broadcast-stub calls. See [F callback execution contract](W4-F-durable-callback-runner.md) for the concrete T fix request, private DB approval/binding, exact T settings, deployment choices and remaining host/post-state blockers. Do not run the actual sender in this task.

## F adapter and required T sequence

`backend/src/senderHandoff.ts` exports `EpochSenderHandoff`. It has no signer, private key, RPC client or broadcast method. A T-owned integration on the same trusted host must:

1. Read the actual F frozen epoch and the approved chain/contract/publisher. Require explicit team authorization for this provisional-policy epoch.
2. Prepare/sign the exact `registerEpoch(uint64,bytes32,uint32,uint16)` transaction using T's approved key handling, and persist the private T journal.
3. Call `persistBeforeBroadcast({ epochId, rawTransaction })` on the **authoritative F database**, then wait for its successful return. For example, the sender can import `EpochSenderHandoff` in-process and pass its existing F `DatabaseSync` connection. The constructor also requires the approved `SenderTarget`.
4. The adapter recovers the signed sender, computes the Ethereum transaction hash, and verifies chain `84532`, recipient, publisher, zero value, exact ABI calldata, epoch ID, root, count and version against F's frozen row. It rejects unapproved or changed transactions.
5. The adapter requires file-backed SQLite with synchronous FULL/EXTRA and a persistent journal, then commits raw transaction/hash/nonce/chain/contract with state `SUBMITTING`. Its acknowledgement contains the public epoch and transaction identifiers and omits raw bytes.
6. Compare the acknowledgement hash with the T journal hash. Only after that acknowledgement may T broadcast the **identical bytes**. A callback error, conflicting retry, DB error or missing acknowledgement must prevent broadcast.
7. After node acceptance, persist `markSubmitted`. After a restart, reconcile the same stored hash/nonce/bytes. Do not allocate a replacement epoch, nonce or transaction merely because a transport call timed out.

The F CLI now calls this adapter. There is no new unauthenticated HTTP endpoint for raw signed transactions. T owns fixing its ACK composition and configuring the approved local/SSH callback. F tests invoke the exact T gate and F CLI with synthetic SQLite/inert transaction bytes, including rejection/timeout/missing/bad ACK and zero-send checks.

## Trusted confirmation return

T must authenticate all of the following before asking F to call `markConfirmed`: successful receipt status, trusted chain/contract/publisher, transaction hash, `receipt.to`, block number/hash, canonical `EpochRegistered` event, `epochs()` getter, exact frozen root/count/version, and the approved confirmation policy (T profile currently specifies 12). Existing equal-root epochs require reconciliation of the same evidence rather than an unsupported success message.

F already stores `tx_hash`, `nonce`, `chain_id`, `contract_address` and private `signed_tx` at `SUBMITTING`. The trusted return supplies `epochId`, decimal `blockNumber` and lowercase bytes32 `blockHash` for `markConfirmed`. T should retain verification evidence privately and publish only its sanitized confirmation record. F's method itself is not an on-chain verifier; the caller must enforce this contract.

Until trusted confirmation, frozen public bundles have `proof=null`, `anchor=null`. F now also requires epoch status `CONFIRMED` before exporting either field, even if unconfirmed rows contain staged block metadata. A `FAILED` row cannot expose those fields.

## Local verification boundary

The F adapter tests use fixed inert transaction signature bytes, synthetic epochs and fresh temporary SQLite. They perform **zero signing operations and zero RPC/broadcast calls**. Tests cover persistent reopen, same-byte replay, conflicting retry, wrong chain/publisher/recipient/epoch/root/count/version/calldata/value, malformed/unsigned envelopes, disabled SQLite durability, public raw-byte exclusion, concurrent freeze, EMPTY_EPOCH, and unconfirmed bundle withholding.

These tests establish the local F callback and T wire-parser compatibility. They also prove that the pinned T gate composition still fails; the demonstrated wire-shape bridge is a proposed T fix, not a production T change. The user reports an actual A-host frozen epoch, but its private DB is not accessible here, so actual host binding and post-submission propagation remain BLOCKED. No confirmation state is inferred from that report.
