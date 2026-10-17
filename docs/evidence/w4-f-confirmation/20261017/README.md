# W4 F trusted confirmation — local Windows evidence

Client date: 2026-10-17 KST. Base F `4605ec0553a27b0b1a57856856b903e608ff5845`; read-only T reference `ecc4edc9ea89e739845a362c956b66b6f9613cf9`. Scope: synthetic file SQLite, inert signature bytes, injected/loopback RPC stubs. No real RPC, signing, broadcast, authoritative A DB modification, TEST dataset access, policy LOCK or W5 work. Policy remains `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`.

## Outcome

| Requested status | Result |
|---|---|
| TRUSTED_CONFIRMATION_VERIFIER | PASS — implemented and verified locally; real execution BLOCKED |
| MIN_12_CONFIRMATIONS | PASS |
| RECEIPT_EVENT_GETTER_MATCH | PASS |
| REORG_FAIL_CLOSED | PASS |
| F_STATE_PERSISTENCE | PASS |
| PUBLIC_BUNDLE_RELEASE_GATE | PASS — HTTP API regression |
| REAL_A_DB_CONFIRMED | NO |
| ACTUAL_CHAIN_TX_SENT | NO |
| GATE_4 | PARTIAL |

`regression-summary.json` gives exact final test counts, command results, per-file counts and tested source digests. **Final full verification: 192/192 PASS, 11 files, zero skipped/failed (existing 121 plus 71 new).** Initial full verification passed 191/191; the final run adds actual HTTP timeout coverage. No skipped Windows tests were accepted as Windows PASS. Runtime: win32, Node v24.16.0, tsx 4.23.13. `windows-confirmation-final.jsonl` comes from actual test/CLI observations and contains only sanitized fields. `windows-confirmation.jsonl` preserves the earlier verification log.

All existing 121 test cases remain. One existing Bundle assertion was tightened: an internal `markConfirmed` call without trusted evidence must now withhold proof/anchor. New validated-confirmation tests cover successful release. Historical old-T ACK defect tests remain intentionally pinned to their old source; `t-source-audit.json` separately records the current T normalization fix and lack of an F confirmation callback in the sender.

## What was verified

- Recovered publisher/approved chain/contract and exact durable raw transaction/hash/nonce/calldata/value/epoch/root/count/version.
- Successful receipt and exact sender/target/hash/block/index; canonical receipt block and transaction membership.
- Correct contract-emitted `EpochRegistered`, exact ABI/topics/data and all epoch fields; removed, malformed, duplicate and misbound logs rejected.
- Hash-bound canonical `publisher()` and `epochs()` getters; no fallback for unsupported EIP-1898.
- Confirmation depth 12/13 accepted; 0/1/10/11 and weakened/invalid policies rejected.
- Repeated receipt/transaction/chain/block/head/getter checks reject reorg and inconsistent RPC. Authenticated endpoint selection remains an external host prerequisite.
- SQLite state plus verifier evidence are atomic; evidence-write failure rolls back promotion. Epoch/member changes during RPC are rejected under the write lock.
- Reopen/identical retries preserve the trusted identity. Contradictory confirmed retries preserve original block history and disable public release. Revalidation suspends release before RPC I/O and re-enables it only after success.
- Timeout cannot cause late DB promotion; actual loopback HTTP timeout leaves SUBMITTED and no public proof/anchor.
- Actual Windows CLI emits one sanitized ACK after stub-backed verification. Disabled approval/plain CONFIRMED JSON emit no success ACK.
- Public HTTP Bundle before verification has null proof/anchor; after verified commit it exposes the exact inclusion proof/anchor; private text/salt/raw bytes remain excluded. Legacy/unverified CONFIRMED and tampered bindings remain withheld.

## Browser QA boundary

An additional in-app-browser check against a temporary synthetic loopback server timed out. A separate shell request also timed out. Therefore **browser UI QA is BLOCKED**, recorded in `browser-check.json`; no browser observation of a confirmed A DB is claimed. The automated real HTTP API release-gate tests passed. These are distinct observations. No real browser signing, wallet action or chain transaction was attempted.

## Operations and limitations

See [T return contract and protected invocation](../../../handoffs/W4-F-trusted-confirmation.md) for approved settings, exact RPC checks, ACK fields, call order, restart/reorg recovery and remaining operator/real-RPC prerequisites. The real operation is disabled by default. Evidence rows attest verification against the configured trusted RPC at that time; they do not eliminate every future deep reorg or authenticate a consistently dishonest provider. Revalidation/consumer refresh is required when new reorg evidence is observed. No live RPC query runs on each public Bundle GET.

Existing actual R01 artifacts, earlier failed runs and private A SQLite were not touched. T branches and source code were not modified. Existing SHA-256/canonical/Merkle/model/policy/issuer rules are retained; only shared signed-transaction validation was extracted for reuse, and the public release gate was tightened.
