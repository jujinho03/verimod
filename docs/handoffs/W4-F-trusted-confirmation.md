# W4 F → T: trusted CONFIRMED persistence contract

F base: `4605ec0553a27b0b1a57856856b903e608ff5845`. Execute the **new full F SHA in the final report**. T reference: `ecc4edc9ea89e739845a362c956b66b6f9613cf9`, inspected read-only. The T ACK normalization fix is present in this reference. Its journal's CONFIRMED message and default `tx.wait()` do not establish F's required 12 confirmations. Neither T's journal nor arbitrary JSON can authorize an F confirmation.

Scope remains `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`, Gate 4 PARTIAL. This implementation/verification uses only synthetic DBs and loopback/injected RPC stubs. Actual authoritative A DB confirmation, operator approval and real RPC verification remain **BLOCKED**. No actual signing, broadcast, TEST data, policy LOCK, W3 frozen changes or W5 work is included.

## Verifier and release boundary

`backend/src/trustedConfirmation.ts` exports `verifyAndConfirm` and a bounded read-only `confirmationReader`. The existing `EpochSenderHandoff` and the verifier share the same pure `verifyEpochTransaction` checks; signature/calldata rules are retained. Before any promotion, F checks:

1. Separate host-owned confirmation authorization, approved DB file identity and epoch binding, persistent journal and synchronous FULL/EXTRA; existing SUBMITTED transaction (or identical CONFIRMED replay).
2. Approved chain `84532`, contract `0xd17ba590b23e984e3f3408bcdc3529be9868ec50`, publisher `0xd47675be41ec3476f541c1d8d8a9f622c90182ed`. In production the target is pinned; synthetic tests use an explicitly separate mode.
3. Exact durable raw transaction/hash/nonce, recovered publisher, chain, zero value and exact `registerEpoch(uint64,bytes32,uint32,uint16)` calldata matching F's actual epoch/root/count/version. F recomputes its existing member root/order/count and validates issuer.
4. RPC transaction identity/data/value/nonce/inclusion metadata and a successful receipt (`status=0x1`) with exact hash/from/to/block/index.
5. Canonical receipt block at the exact height, matching hash, and the stored transaction at its receipt index.
6. Exactly one canonical `EpochRegistered` log from the approved contract: `removed=false`, exact transaction/block/index, ABI topic/data encoding and epoch/root/count/version. Malformed, duplicate, removed or wrong-emitter logs are rejected.
7. `publisher()` and `epochs(epochId)` results at the **receipt block hash with `requireCanonical=true`**, with exact ABI encoding/values. No fallback to `latest` or block number if the provider lacks this capability.
8. At least **12 confirmations**, computed as `head.number - receipt.blockNumber + 1`. Host policy may increase this threshold; it cannot reduce it.
9. Repeated chain/transaction/receipt/canonical-block/head checks and repeated hash-bound getter calls; any changed receipt, head rollback/hash disagreement, reorg or incomplete response rejects promotion.
10. The F epoch snapshot and member digest must still match under the state-transition write lock. State and evidence are committed in the same SQLite transaction. If evidence insertion fails, the status change rolls back.

The verifier has a 12-second decision deadline. The read-only HTTP transport bounds each request to 3 seconds and each JSON response to 2 MiB, checks JSON-RPC version/id/errors, disallows redirects, and accepts HTTPS or loopback HTTP only. Methods used: `eth_chainId`, `eth_getTransactionByHash`, `eth_getTransactionReceipt`, `eth_getBlockByNumber`, `eth_call`. It has no signer/send method. A losing timeout promise cannot subsequently promote the DB.

These semantics follow [Ethereum JSON-RPC](https://ethereum.org/developers/docs/apis/json-rpc/) and [EIP-1898 canonical block-hash calls](https://eips.ethereum.org/EIPS/eip-1898). An approved authenticated RPC is a trust dependency; repeated reads detect observed contradictions but are not a consensus proof against a consistently dishonest endpoint. Twelve confirmations are the approved depth, not a guarantee against every future deep reorg. Operators must revalidate/reconcile when reorg information becomes available.

## Durable evidence and public Bundle

The verifier creates `epoch_confirmation_evidence` only during an explicitly authorized local confirmation. No real DB migration is performed in this task. It stores a canonical binding/digest over epoch/root/count/version, transaction hash/nonce/chain/contract, publisher, block number/hash and a digest of private raw bytes; evidence also binds member rows and observed head/depth. Private raw bytes and DB/config paths are never included in its stdout ACK or public evidence.

`EpochService.markConfirmed()` remains an internal transition method. Calling it alone, or writing a CONFIRMED string, does **not** release proof/anchor. `EpochService.bundle()` additionally requires matching verifier evidence and an enabled release flag. Old CONFIRMED rows without verified evidence remain withheld and need operator-approved reconciliation; there is no automatic backfill.

For an authorized recheck of a previously verified CONFIRMED row, F first durably suspends public release **before RPC I/O**. Successful identical verification re-enables it; timeout, crash or conflicting evidence leaves proof/anchor withheld while preserving the previous trusted epoch/block history. Conflicting retries cannot overwrite the original confirmed block. Suspension is not an automatic FAILED state or permission to resend.

The initial confirmation state/evidence write is atomic. A per-request API gate validates the stored binding and member digest; no live RPC is invoked by each browser GET. It serves the last enabled verification record. A detected reorg must therefore trigger the approved revalidation path or operator suspension, followed by consumer refresh. If the DB cannot persist a suspension, stop serving that DB until the operator restores a writable, consistent environment; no new verification is claimed.

## T return fields and execution order

T must retain privately and return to the trusted integration operator: source T/F SHAs, epoch ID/root/count/version, chain ID, approved contract/publisher, exact txHash/nonce, broadcast acceptance outcome, receipt block number/hash/index/status, canonical event log/index, getter results and observed head/confirmation depth. Keep raw transaction bytes in the existing private journals/SQLite; do not put them in command arguments, public logs or documents. These fields are reconciliation hints, **not trusted confirmation input**; F independently queries the configured RPC for its stored transaction.

Required future authorized sequence:

1. Complete the real F durable pre-broadcast ACK before T sends the identical transaction. This task sends nothing.
2. After node acceptance, run the existing restricted `submitted` path to verify acceptance and persist F SUBMITTED. Preserve exact hash/nonce/bytes on retry.
3. Wait for the approved depth and obtain separate operator approval for F confirmation. Never trust a T journal status or an equal-root shortcut as sufficient proof.
4. Invoke F's `confirmed` operation on the authoritative DB host through the existing protected same-host wrapper or authenticated restricted SSH channel. The operation takes no T-supplied receipt/status JSON; it selects the approved stored epoch/transaction from the host config and DB.
5. Require exit 0, parse exactly one JSON ACK, and compare epoch/hash/block/confirmation fields. Confirm DB reopen/release evidence privately before treating F state as reconciled. On error/timeout, do not mark confirmed externally or allocate a replacement transaction.

The `submitted` operation and actual T post-send callback wiring are not replaced by this task. T should add/operate a distinct post-send caller; do not run the signing/broadcasting sender as a confirmation check.

## Protected host configuration and command

Reuse the existing private, owner-controlled approval config described in `W4-F-durable-callback-runner.md`, with its actual canonical A DB path/device/inode, frozen epoch and approved target. The A DB path is unknown here and must be supplied by its operator. Additional fields are **disabled/unset by default**:

```json
{
  "allow_confirmed_return": false,
  "confirmation_approval_id": "<SEPARATE_OPERATOR_APPROVAL_ID>",
  "minimum_confirmations": 12,
  "rpc_url": "<APPROVED_AUTHENTICATED_PRIVATE_RPC_ENDPOINT>"
}
```

The operator may set `allow_confirmed_return=true` only after explicit approval for the specific real DB/epoch, checking source pins, DB backups, RPC trust/TLS/EIP-1898 support and policy scope. That approval does not change `team_approved=false` or authorize chain transmission. Do not provision real credentials or enable this on A during this implementation task. Protect code/config/RPC credentials with the same dedicated-account ACLs and restricted forced-command SSH boundary as the earlier callback. No unauthenticated HTTP endpoint is added.

**Future invocation only, after the required host approval/configuration.** Existing `$fRoot` must be the clean checkout of the newly reported F SHA; `$config` must be the actual protected config path on that host. No signing process is involved:

```powershell
$loader = Join-Path $fRoot 'backend/node_modules/tsx/dist/loader.mjs'
$loaderUrl = ([System.Uri]::new((Resolve-Path -LiteralPath $loader).Path)).AbsoluteUri
$runner = Join-Path $fRoot 'backend/scripts/f-durability-callback.mts'
node --import $loaderUrl $runner --config $config --operation confirmed
if ($LASTEXITCODE -ne 0) { throw 'F confirmation remains unverified; preserve evidence and reconcile' }
```

Keep the existing pre-broadcast callback settings pointing at `prepare`. Do **not** replace `VERIMOD_F_PREBROADCAST_ACK_ARGS_JSON` with the confirmation command. The post-send wrapper must allow at least the 12-second verifier decision window plus process/network startup (use a separately reviewed timeout, e.g. 20 seconds), and must preserve exit/error propagation. Timeout is never an ACK.

Success ACK fields: `epoch_id`, `status="CONFIRMED"`, `tx_hash`, `block_number` (decimal), `block_hash`, `confirmations` (decimal), `minimum_confirmations` (number, at least 12). Failure: nonzero exit, empty stdout, sanitized stderr code. No raw transaction, signing material, original content/salt, RPC secret, approval ID or private DB path is emitted.

## Recovery and local verification

Same exact transaction/block verification is idempotent across restart/reopen. A contradictory existing binding is rejected and retained; investigate reorg/RPC/DB mismatch, do not overwrite evidence, silently rebind file identity or move FAILED back to CONFIRMED. Re-enabling release requires a fresh successful authorized verification of the original compatible binding. Actual host execution stays BLOCKED until approved and observed there.

From `backend/`: `npm run typecheck`, `npm run w4:typecheck`, `npm run build`, `npm test`. New tests use fresh synthetic file SQLite, inert signature bytes and RPC stubs only. Existing 121 tests remain, with one legacy Bundle expectation tightened to withhold proof after an unverified internal CONFIRMED call; new tests cover the validated release path. Real browser UI QA is recorded separately from HTTP API verification, with no claim of actual A-host or on-chain confirmation.
