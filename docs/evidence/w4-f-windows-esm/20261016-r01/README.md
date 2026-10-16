# W4 F Windows ESM launch fix — 2026-10-16

Scope: F runner, shared process launcher, regression tests and A handoff documentation. Policy remains `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`; X/B approval pending. No inference/manifest/issuer/canonical hash/Merkle/sender implementation was changed.

## Observed on Windows

Host runtime: `win32`, Node `v24.16.0`, tsx `4.23.13`. Base F revision: `c14fb914afa1d7c7f25fb5f6fb768e7b2ba7b628`. A pin: `9bcbec677d89d10364b327aae7e60955e2e4315d`. T pin: `fbcb3e9e99ae8dda2f9c70a32f35ec2c039b73de`.

The original Windows absolute loader path reproduces `ERR_UNSUPPORTED_ESM_URL_SCHEME` with exit 1. The shared launcher now converts that path with `pathToFileURL(...).href`. Actual installed tsx loads the TypeScript server successfully with `--import`; no CLI fallback is needed on this runtime.

`windows-smoke.jsonl` contains timestamped observations from the separate smoke command. The tests copy the actual server source and installed tsx into an owned drive path containing spaces; remaining installed dependencies resolve from the real backend ancestor. This needs no Windows junction privilege. No model or inference fixture is used. Each test removes only its own temporary directory.

| Check | Result |
|---|---|
| Original ESM error reproduction | Reproduced |
| First child start / HTTP health | PASS / 200 |
| No-model decision request | 503; zero receipt/content/epoch/member/idempotency rows |
| Anchor candidates | 0 (there are no receipts) |
| Stop / port release | PASS |
| Same SQLite reopen / backend restart | PASS / health 200 / decision 503 / zero rows |
| Drive path and spaces / encoded file URL | PASS |
| Readiness timeout cleanup | PASS; child exited and listening port rebound |
| Entry-point failure cleanup | PASS; child exited and port rebound |

Both actual-runner calls (first start and `f-backend-reopened`) call the same `launchBackend` in `backend/scripts/backend-process.ts`. The smoke imports that same function. Backend readiness failure stops its child; the runner's final cleanup also stops all owned children. Shutdown has a bounded graceful wait and force-kill fallback.

## Validation

- `npm run w4:windows-smoke`: **4/4 PASS**, 1 test file. The start/restart test observes both phases separately.
- `npm run typecheck`: PASS.
- `npm run w4:typecheck`: PASS.
- `npm run build`: PASS.
- `npm test`: **68/68 PASS**, 9 files: all existing 64 plus the 4 Windows process tests. Existing manifest rejection and policy parity tests remain present.
- `validation.json` records commands, counts and tested source SHA-256 values. The Windows logs contain no model, private text/salt, signed transaction or private DB path.
- `f-revision-preflight.json` records the committed fix's `--expected-f-sha` and committed-tool checks. Its other A-environment checks remain BLOCKED because this F host has no actual R01 environment. Exit 2 is expected for that preflight.

## A rerun and remaining work

`READY_FOR_A_HOST_RERUN=YES` means the Windows launch blocker is resolved for the verified runtime. It does not certify A's actual R01 rerun. Follow `docs/handoffs/W4-F-actual-host-run-request.md`, supply the exact newly published full F SHA, fetch it, create a **new detached worktree** and unique run directories, and rerun Windows smoke there first. A must validate its pinned weights, offline tokenizer, manifests, issuer and A/F/T revisions before inference.

Preserve A's independent E2E evidence, F's `20261016-r01` integration preparation, and A's failed `20261016-150318-a-r01` run. A's failure description is user-supplied; F did not inspect or rerun A's private model artifacts.

Required actual success remains: FULL/TRUNCATED R01 receipts (2), freeze in the same F SQLite, exact root/count/members, independent Merkle recomputation, freeze replay, EMPTY_EPOCH, SQLite reopen, and `frozen-epoch-handoff.json`.

`ACTUAL_R01_ISSUANCE=NOT_RERUN_ON_F_HOST`; `EPOCH_FREEZE=PENDING_A_HOST`; `T_SENDER_DURABILITY=BLOCKED`; `PUBLIC_CHAIN_TX_SENT=NO`. No model retraining, TEST dataset access, policy LOCK, W3 frozen changes, chain signing/broadcast, actual epoch sending, branch merges or W5 work occurred.
