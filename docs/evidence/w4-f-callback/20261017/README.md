# W4 F durable callback — Windows verification, 2026-10-17 KST

## Result

| Status | Result |
|---|---|
| F_CALLBACK_RUNNER_IMPLEMENTED | PASS |
| T_F_PROTOCOL_COMPATIBILITY | **FAIL** for full pinned T composition; F wire ACK → T request parser PASS |
| CALLBACK_FAILURE_ZERO_BROADCAST | PASS (broadcast stubs only) |
| LOCAL_SQLITE_DURABILITY | PASS (synthetic file DBs, commit/reopen/identical retry) |
| WINDOWS_RUNNER | PASS (actual Windows child processes, Node v24.16.0 / tsx 4.23.13) |
| ACTUAL_A_HOST_DB_CONNECTED | BLOCKED |
| POST_SUBMISSION_F_STATE_PATH | BLOCKED for operational end-to-end/confirmation; local verified SUBMITTED code tested |
| ACTUAL_CHAIN_TX_SENT | NO |
| GATE_4 | PARTIAL |

Policy stays `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`. A reports an actual frozen epoch, but no authoritative A DB path/access was provided here. All new tests use fresh synthetic DBs, fixed inert signed envelopes without signing, and local stubs. No actual A database, R01 artifacts, TEST dataset, public RPC, signer, chain transaction, W3 frozen material or W5 work was accessed or changed.

## Verification

`npm run typecheck`, `npm run w4:typecheck`, `npm run build`: PASS.

`npm test -- --reporter=json --outputFile=../private-data/callback-final-regression.json`: **121/121 PASS, 10 files, zero skipped/failed**. Existing 68 preserved; 53 new tests in `durability-callback.test.ts`. A focused run also passed 53/53. Public `regression-summary.json` contains sanitized counts/source digests; the full local reporter JSON remains ignored. `windows-cli.jsonl` preserves the initial full verification log. `windows-cli-final.jsonl` records the final full run after making the T snapshots self-contained for shallow CI. Both are emitted from actual child exit/output observations and exact-T assertions, using an allowlisted projection, not a raw private transcript.

Covered: stdin size/JSON/field/type/bounds rejection; same-request replay; no DB creation; missing/memory/relative/copied/non-SQLite DB rejection; synthetic approval refused in authoritative mode; approved inode/device/path/header/schema/epoch binding; actual member root/count/order/issuer checks; wrong metadata/hash/nonce/publisher/chain/recipient/value/calldata; malformed/unsigned envelopes; inappropriate/absent epochs; SQLite durability/query-only/lock errors; conflicting requests; safe status and blocked CONFIRMED/FAILED strings; exact pinned T request and ACK parser; missing/bad/error/timeout ACK zero-stub-send; local SUBMITTED CLI with loopback read-only JSON-RPC and negative identity evidence. Existing Windows first-start/restart/503/cleanup tests also pass.

The runner uses `file:` URI `mode=rw`, including Windows drive/space encoding, to prevent SQLite from creating a missing DB. This is supported by the [Node v24.16.0 SQLite open implementation](https://github.com/nodejs/node/blob/v24.16.0/src/node_sqlite.cc#L868) and [SQLite URI mode rules](https://www.sqlite.org/uri.html). It checks file identity before and after open and runs no migrations. Host-protected configuration is the approval trust root; it is not a cryptographic provenance certificate and must be independently provisioned by A's operator. No example DB is treated as authoritative.

## Concrete T failure

T pin `34447502f8843f1be585b56fb31c51b41c0f2fc7` is read from Git objects, not edited or merged. Hash-verified copies under `backend/test/fixtures/w4-t-3444750/` make this read-only reference available in shallow CI: gate SHA-256 `267c6826767d4d37bddcb1c0bad70ba309237e2162938cfff50b2439c67b192d`, sender SHA-256 `500d003ed992645e74450faa231a5ed030102ec283ab3d99123e24c3eb136d11` (UTF-8, LF). The actual `requestDurableSubmissionAck()` validates F's snake_case stdout and then returns camelCase. The actual `broadcastAfterDurableAck()` rechecks snake_case. The exact composition used by T `register-epoch.ts` rejects a valid real F CLI response at `epoch_id`, after F has durably stored SUBMITTING, with **zero broadcast-stub calls**. An ACK stdout workaround cannot restore fields already stripped by T.

A separate test supplies the documented explicit wire-shape bridge after the actual T request function; the gate then invokes one stub only after SQLite reopen sees committed bytes. **This demonstrates a proposed T fix; the pinned production T path remains broken.** Tests passing must not be read as T_F_PROTOCOL_COMPATIBILITY=PASS. T must publish a corrected SHA and rerun the actual sender composition.

## Post-state and host boundary

The new `submitted` operation uses only a host-approved read-only RPC reader and exact durable transaction matching before `markSubmitted`. Tests use only injected readers and a loopback RPC stub. No production endpoint/transport is configured and T does not invoke this return path yet. CONFIRMED/FAILED CLI transitions are refused; successful receipt/event/getter/canonical block/12 confirmations and authenticated return evidence are still required before any confirmation path. A journal string or ACK cannot mark CONFIRMED.

See [A/T execution and deployment contract](../../../handoffs/W4-F-durable-callback-runner.md) for source pins, config/request/ACK schemas, exact T settings, same-host vs restricted authenticated SSH deployment, recovery, proposed T callback fix and approval prohibitions. No key or private DB is to be copied by default, and no unauthenticated HTTP endpoint is introduced. Existing real/failed-run evidence is retained.
