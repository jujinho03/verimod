# SEC-W5-01 negative-test audit — 2026-10-29 KST

**Basis:** `f7c84f27ff964d114cacc8c5c181b4df8b9f766b` plus this T-only test branch.  Every fixture is made beneath `backend/private-data/callback-tests/` using `mkdtemp`; no authoritative database, key, original text, salt, RPC write, signing, or epoch registration is read or changed.

## Windows support boundary

`openApprovedDatabase()` rejects on Windows *before it reads `database_path`* with `WINDOWS_WRITABLE_NO_CREATE_UNSUPPORTED`.  Node's available SQLite API has no atomic writable-existing-file-only open there.  This is a fail-closed safety property, **not** support for a Windows writable callback.  A synthetic test or a Linux result must not be described as Windows callback support.

## Negative-test matrix

| # | scenario | actual test/input | assertion | result on this Windows run | Windows writable callback | non-Windows execution |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | deletion race | `durability-callback.test.ts` / delete the synthetic DB immediately before open | platform gate throws and the deleted path remains absent | PASS (fail-closed) | UNSUPPORTED | existing non-Windows opener needs a race-capable harness; NOT_EXECUTED here |
| 2 | file replacement | same file / copied synthetic SQLite at an alternate path | platform gate throws before writable open; original bytes unchanged | PASS (fail-closed) | UNSUPPORTED | existing identity test rejects copied identity; no new non-Windows run |
| 3 | identity change | same file / altered approved inode string | platform gate throws before writable open | PASS (fail-closed) | UNSUPPORTED | existing opener checks `dev` and `ino`; NOT_EXECUTED here |
| 4 | symlink / reparse point | no new Windows reparse fixture (creating one needs privilege/policy) | no writable callback reaches pathname evaluation; non-Windows code rejects symbolic links and noncanonical paths | UNSUPPORTED (reparse fixture) | UNSUPPORTED | dedicated privileged Windows/reparse or Linux symlink execution required |
| 5 | unapproved DB creation | existing missing synthetic path | rejection and `existsSync(missing) === false` | PASS (fail-closed) | UNSUPPORTED | existing non-Windows `mode=rw` test; NOT_EXECUTED here |
| 6 | SQLite header/schema alteration | new non-SQLite synthetic file; existing non-Windows `NOT_SQLITE_FILE` and `UNSUPPORTED_F_SCHEMA` checks | Windows gate throws first; no mutable open | PASS for Windows fail-closed; schema opener test NOT_EXECUTED on Windows | UNSUPPORTED | non-Windows execution required for header/schema opener assertions |
| 7 | no-create guarantee | existing deleted/missing synthetic paths | no new file after rejection | PASS (fail-closed) | UNSUPPORTED | existing `mode=rw` path is not a Windows substitute |
| 8 | durability and ACK | Windows gate plus existing durable ACK tests | Windows: no ACK/writable open; supported platforms: FULL synchronous + non-memory/off journal and persisted `SUBMITTING` ACK/reopen | PASS for denial; writable ACK is SKIP on Windows | UNSUPPORTED | supported non-Windows execution required for writable ACK PASS |

`replacement`, `identity`, header/schema, symlink/reparse, and writable ACK must therefore not be reported as a Windows operational PASS.  “PASS (fail-closed)” only means the unsafe operation was prevented.

## Execution receipt (Windows, synthetic fixtures only)

Run on 2026-10-29 KST from this branch's test worktree.  No test process received an operational DB path, wallet/signing material, raw content, salt, or a write-capable public-chain RPC.

| command | observed result |
| --- | --- |
| `backend: npm test -- test/durability-callback.test.ts` | 8 passed, 53 skipped |
| `backend: npm test` | 12 files passed; 158 passed, 53 skipped |
| `backend: npm run typecheck` | PASS |
| `backend: npm run build` | PASS |
| `backend/contracts: npm test` | 18 passing (LOCAL Hardhat harness only) |
| `backend/contracts: npm run build` | PASS |
| `frontend: npm test` | 23 files passed; 250 passed |
| `frontend: npm run lint` | exit 0; existing optional-chaining warnings (2) |
| `frontend: npm run build` | PASS |

## F RPC independent review

Reviewed code at this basis: `frontend/src/domain/rpcLedger.ts`, `verify.ts`, `merkle.ts`, and `approvedProfiles.ts`.  The W6 F change `1620f82` only separates manual W6 RPC recovery from deterministic CI; it does not change the ledger/verifier trust logic.

The implementation retains: approved HTTPS endpoints; chain ID `84532`; publisher call; `epochs()` root/count/version; bounded but complete deployment-to-head event windows with duplicate rejection; event/getter/transaction-receipt cross-checks; confirmation and Merkle inclusion in `verifyCore`; and fail-closed `RPC_UNAVAILABLE`.  It keeps `HASH_MISMATCH` before ledger access and `INVALID_PROOF` after a rehashed body/proof mismatch.

**Disposition: APPROVE for `1620f82` CI isolation only.**  It is not approval of a separate caching/range-omission optimization: no such diff or artifact was supplied.  Any later optimization that omits an event window, getter/receipt recheck, profile binding, confirmation, or proof check is **CHANGES_REQUESTED**.

## Base, local, and demonstration claims

- Base Sepolia review is read-only and refers only to W4 Epoch 1; this audit neither signs nor transmits.
- `LOCAL_HARDHAT_FALLBACK` is a configured browser trust profile, but an actual product Hardhat-31337 endpoint/path is **NOT_VERIFIED**.  A standalone Hardhat test harness is not product LOCAL verification.
- Browser `SYNTHETIC_LOCAL` is a mock/explanatory path, not Hardhat.
- `RECORDED` is pre-recorded and must show run time, commit SHA, mode, and input/seed identity separately from LIVE.
- The W4 receipt/anchor verifies recorded-chain consistency, not AI accuracy or completeness of issuer history.  A new unanchored receipt remains `PENDING_ANCHOR`.

## Remaining mentoring risks

1. Windows authoritative writable callback has no safe atomic no-create API and remains unsupported.
2. Browser LIVE RPC availability is distinct from direct host RPC availability; route abort is injected failure, not a physical outage.
3. Actual Hardhat product-path evidence and physical mobile LIVE evidence remain unexecuted.
4. W4 trust evidence does not establish model accuracy, policy approval/LOCK, or an all-history completeness claim.
