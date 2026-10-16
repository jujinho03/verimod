# W4 F → T: mandatory F SQLite boundary before broadcast

F basis: `2c99260c0eb6229d34b3f94191c2dab3238c1727` plus the F integration adapter in this branch.
T audited source: `fbcb3e9e99ae8dda2f9c70a32f35ec2c039b73de`, `backend/contracts/scripts/register-epoch.ts`.

**BLOCKED until T connects the callback.** The pinned T sender writes its own journal and then calls `broadcastTransaction(journal.rawTransaction)`. Its comment requires F SQLite persistence, but the executable path never calls F. F cannot know the newly signed raw transaction before that sender runs. Running the current `npm run epoch:register` command would bypass the required F persistence boundary.

## F adapter and required T sequence

`backend/src/senderHandoff.ts` exports `EpochSenderHandoff`. It has no signer, private key, RPC client or broadcast method. A T-owned integration on the same trusted host must:

1. Read the actual F frozen epoch and the approved chain/contract/publisher. Require explicit team authorization for this provisional-policy epoch.
2. Prepare/sign the exact `registerEpoch(uint64,bytes32,uint32,uint16)` transaction using T's approved key handling, and persist the private T journal.
3. Call `persistBeforeBroadcast({ epochId, rawTransaction })` on the **authoritative F database**, then wait for its successful return. For example, the sender can import `EpochSenderHandoff` in-process and pass its existing F `DatabaseSync` connection. The constructor also requires the approved `SenderTarget`.
4. The adapter recovers the signed sender, computes the Ethereum transaction hash, and verifies chain `84532`, recipient, publisher, zero value, exact ABI calldata, epoch ID, root, count and version against F's frozen row. It rejects unapproved or changed transactions.
5. The adapter requires file-backed SQLite with synchronous FULL/EXTRA and a persistent journal, then commits raw transaction/hash/nonce/chain/contract with state `SUBMITTING`. Its acknowledgement contains the public epoch and transaction identifiers and omits raw bytes.
6. Compare the acknowledgement hash with the T journal hash. Only after that acknowledgement may T broadcast the **identical bytes**. A callback error, conflicting retry, DB error or missing acknowledgement must prevent broadcast.
7. After node acceptance, persist `markSubmitted`. After a restart, reconcile the same stored hash/nonce/bytes. Do not allocate a replacement epoch, nonce or transaction merely because a transport call timed out.

This is a prepared F interface. The current T CLI does not call it. There is no new unauthenticated HTTP endpoint for raw signed transactions. T owns wiring the callback and testing its own broadcast stub to prove that missing/failed F acknowledgement results in zero sends.

## Trusted confirmation return

T must authenticate all of the following before asking F to call `markConfirmed`: successful receipt status, trusted chain/contract/publisher, transaction hash, `receipt.to`, block number/hash, canonical `EpochRegistered` event, `epochs()` getter, exact frozen root/count/version, and the approved confirmation policy (T profile currently specifies 12). Existing equal-root epochs require reconciliation of the same evidence rather than an unsupported success message.

F already stores `tx_hash`, `nonce`, `chain_id`, `contract_address` and private `signed_tx` at `SUBMITTING`. The trusted return supplies `epochId`, decimal `blockNumber` and lowercase bytes32 `blockHash` for `markConfirmed`. T should retain verification evidence privately and publish only its sanitized confirmation record. F's method itself is not an on-chain verifier; the caller must enforce this contract.

Until trusted confirmation, frozen public bundles have `proof=null`, `anchor=null`. F now also requires epoch status `CONFIRMED` before exporting either field, even if unconfirmed rows contain staged block metadata. A `FAILED` row cannot expose those fields.

## Local verification boundary

The F adapter tests use fixed inert transaction signature bytes, synthetic epochs and fresh temporary SQLite. They perform **zero signing operations and zero RPC/broadcast calls**. Tests cover persistent reopen, same-byte replay, conflicting retry, wrong chain/publisher/recipient/epoch/root/count/version/calldata/value, malformed/unsigned envelopes, disabled SQLite durability, public raw-byte exclusion, concurrent freeze, EMPTY_EPOCH, and unconfirmed bundle withholding.

These tests establish F callback behavior. They do not establish that T's existing sender invokes it. Actual R01 issuance/Freeze and the T callback integration remain separately reported execution gates.
