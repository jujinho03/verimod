# W5 F final T/F integration — 2026-10-24

T PR #28 is merged as `639030b349e66a92c453e2e6936ba43ad165e8d7`; main CI [#252](https://github.com/jujinho03/verimod/actions/runs/40004650209) is SUCCESS. F `nohyusin` merged this main normally, without a conflict, rebase, or force push. The tested integration commit is `8405734b6abd4baa6d137b2e669e6fe9e9f39ed7`, with prior F parent `85a72a75552e766d00cee8f8c261a1411505cb01`. The subsequent evidence commit changes documentation only; its runtime source tree is identical to this tested commit.

## Completed regression

| Check | Result |
| --- | --- |
| Frontend entire unit run, default workers/timeouts | 23 files / 250 PASS, 0 FAIL, 0 SKIP |
| Frontend build / tsc build typecheck / lint / w5:typecheck | PASS; 2 existing lint warnings |
| Backend installed dependency audit | PASS, including ethers 6.17.0 |
| Backend entire unit run, default workers/timeouts | 12 files / 203 PASS, 0 FAIL, 0 SKIP; one complete execution |
| Backend typecheck / build | PASS |
| Basic browser | 1 PASS, 0 FAIL, 0 SKIP; 20/20 matrix assertions |
| W5 Desktop 1440×1000 | 12 executed / 12 PASS, 0 FAIL; 3 live RPC SKIP |
| W5 Mobile 390×844 emulation | 12 executed / 12 PASS, 0 FAIL; 3 live RPC SKIP |
| Live public RPC browser | 0 executed / 0 PASS / 6 SKIP, explicitly disabled |

The Backend run used the existing `vitest run` entry with default workers and test timeouts, plus default and JSON reporters. An external 180-second process bound was not reached: the entire execution exited 0 after 103.314 seconds. This is a complete integrated run, not the sum of previously split T runs.

Frontend `npm test`, `npm run build`, `npm run lint`, and `npm run w5:typecheck`, and Backend `npm ls --depth=0`, `npm run typecheck`, and `npm run build` all completed. Raw logs and JSON reports are under the ignored `private-data/w5-final-integration-20261024-01/` directory. Public aggregate results are in [validation.json](validation.json).

## Browser execution and earlier environment blocks

The official installed engine was Chrome Headless Shell 153.0.8010.12, Playwright revision 1243. Existing basic and W5 test bodies, assertions, viewport projects, and approved public profile parameters were retained. This is Chromium mobile emulation, not physical-device QA or Edge-specific QA.

The original Windows npm-based Playwright webServer wrapper hung during teardown after assertions had passed. That attempt is recorded as an environment block, not an overall PASS. Initial missing-browser and interrupted runs also remain in the separate local logs.

For the successful execution, an ignored local adapter imported `playwright.config.ts` or `playwright.w5.config.ts`, retained their test selection, and overrode only `webServer: undefined`, Chromium channel, baseURL, and new output/report paths. Its own Vite API server bound an OS-selected loopback port (50932), with the existing W5 public profile environment, and supplied that URL to the test CLI. All three browser CLI processes exited 0, and `await server.close()` completed. No existing user's server or port was terminated. The helper and generated configurations remain in the ignored run directory and `frontend/test-results/w5-final-integration-20261024-01/`.

The successful browser reports are `owned-basic.json`, `owned-desktop.json`, and `owned-mobile.json`; lifecycle/exit proof is `owned-browser-exit.json`. New public/synthetic screenshots are in the separate ignored `private-data/w5-final-browser/w5-final-integration-20261024-01-owned/` directory. Owner Package bytes, original text, salt, and private database files are not published.

The Desktop/Mobile cases cover blocked RPCs/offline/recovery, Manifest NOT_CHECKED, six Synthetic lifecycle scenarios, local Package export/import/ID rejection/clear, and four W4 public negative cases. The six explicitly disabled live-RPC cases are not included in the 24 successes. Historical W4 browser evidence is not counted as a new W5 result.

## Preserved integration contracts and negative cases

- T's issuer_seq monotonicity, authenticated-hash direct links, and same-UUID/different-hash rejection are preserved. The integrated end-to-end UUID regression asserts Core VALID and Lifecycle FAILED independently.
- F's absent-Manifest-body NOT_CHECKED semantics, Private Package recomputation, explicit legacy backup/cleanup, Synthetic Timeline, and Core/Content/Lifecycle/RPC/source-mode separation remain intact. Existing F tests and the complete merged T verifier suite ran together.
- Negative tests include malformed/duplicate Package input, incorrect ID/hash/commitment, unavailable and malformed storage, forbidden lifecycle transitions, missing predecessors, RPC unavailability, pending anchors, and body/contract/chain tampering. Backend security, idempotency, Manifest boundary, durability, and trusted-confirmation negative regressions are included in the full 203-test execution.
- Compared with prior F `85a72a7`, `backend/**`, `shared/**`, `docs/handoffs/w4*`, and `docs/evidence/w4*` have no diff. The general T/F merge introduced no Windows SQLite direct-path patch.
- The original callback opener retains file-identity/header checks, the `mode=rw` no-create URI, schema checks, and durable-journaling checks. No direct-path workaround or security relaxation was applied. These tests do not resolve the separate requested Windows DB-deletion-race design concern.

## W4 and boundaries

[W4 SHA-256 inventory](w4-sha256.json) records 53 tracked W4 documents in the working tree. Final file hashes were checked against this inventory, and the relevant historical paths have an empty diff against prior F. Receipt/Manifest hashes, canonicalization, Merkle algorithms, and historical evidence were not changed.

No authoritative database was opened or changed. Backend tests used synthetic test databases and loopback RPC stubs. No signing, broadcast, actual Epoch submission, S1 approval, policy LOCK, sealed TEST access, or work beyond W5 was performed. Policy remains `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`.

PR #29 remains Draft. Independent T review of the final F SHA is required before deciding Draft release or main merge. Live-RPC browser and physical-device QA remain unexecuted. This evidence does not declare the whole team GATE-5 PASS. New F remote SHA, push reconciliation, and CI run/result are to be checked on the final pushed head, not inferred from historical CI #252.
