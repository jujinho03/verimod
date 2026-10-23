# W5 F independent browser assertion correction

Date: 2026-10-23 KST. Source base: `4ae0a12bad15f815710a846981d3ec6a181ef6d0`, branch `nohyusin`, Draft PR #29.

## Scope and integration boundary

At the final pre-commit fetch, `origin/main` is still `8d0580a7ef6a7e88c2314e6f5f30ff5f08f693ab`. `git merge-base --is-ancestor f8cec268d1baccc65035336a5cc232d22f9f5546 origin/main` exits 1, and GitHub PR #28 reports open / merged=false. Per the integration instruction, this is an F independent candidate; T/F integration is pending. No merge of another owner branch was performed.

Only `frontend/e2e/w5.spec.ts` and this record are changed. The worktree initially has no tracked modifications, including no uncommitted Backend/SQLite changes. Backend/shared production source, canonicalization, Manifest hashes, W4 historical evidence, Private Package, Synthetic Timeline and RPC Mode UX are unchanged.

## Browser correction

The missing-manifest assertion is scoped to the `모델·정책 manifest` side-check row and requires both:

- the `확인 안 함` badge (the displayed label for `NOT_CHECKED`);
- `신뢰할 수 있는 manifest 원문을 확보하지 못했습니다`.

The production Manifest rule remains unchanged. New browser screenshots/public-RPC reports use a separate ignored `private-data/w5-final-browser/<run-id>` directory, rather than writing into historical evidence. Disabled live RPC cases are skipped at test declaration, before allocating a browser/page.

## Fresh local validation

| Check | Result |
| --- | --- |
| Frontend whole unit run | PASS: 246/246, 23 files, 0 failed, 0 skipped |
| Frontend `npm run build` | PASS (includes app TypeScript build) |
| Frontend `npm run lint` | PASS; 2 existing client test warnings, 0 errors |
| Frontend `npm run w5:typecheck` | PASS after final E2E edits |
| Backend `npm ls --depth=0` | PASS; dependencies present, no dependency installation/change needed |
| Backend whole unit run | PASS: 203/203, 12 files, 0 failed, 0 skipped, one full execution with default timeout/worker settings |
| Backend `npm run typecheck` / `npm run build` | PASS / PASS |
| Default browser regression | BLOCKED before test body: Chromium headless-shell executable absent in sandbox cache |
| W5 Desktop | BLOCKED before test body: installed Edge exits during launch; `TransactNamedPipe` 0x6D |
| W5 Mobile viewport | BLOCKED before test body: same Edge launch failure |
| Live RPC Browser | 6 SKIP, 0 PASS; explicit manual live mode not enabled |
| Windows SQLite security | No current security block reproduced. Whole Backend run, callback rejection checks and Windows launch/restart tests passed. No security check was relaxed. |

Unit commands use `npm test -- --reporter=json --outputFile=...` (Backend also enables the default reporter). These flags only add reports; no timeout or worker override is used. Raw local results and logs are in ignored `private-data/w5-final-20261023/`.

Browser commands use the repository's `test:browser` and `w5:browser` scripts, a new output directory and `--max-failures=1`. Desktop/mobile launch failures are environment blockers; the corrected page assertion has not been executed successfully here. Browser wrappers that remained in teardown after reporting launch failure were stopped. The six disabled live cases were separately reported using a local ignored config that keeps the same test file and projects but omits the unused dev server. They sent no RPC requests.

Raw report SHA-256:

- `frontend-tests.json`: `2231858aa799cbdac25b1ca90d7697dec563f6dfae3316fb4eb497d0931d2855`
- `backend-tests.json`: `11792dd7f11e48adcf04708b39cbc4f0f27ed72980104c6dd904f85acb0c217e`
- `live-skip.json`: `f8f61e022f93a320e41d4c4de9076fc03136ca97fc84f904e7d2c608ece35e92`

## Remaining delivery gates

PR #29 remains Draft. The previous source SHA `4ae0a12...` has GitHub Actions #244 SUCCESS; this is not CI evidence for this new correction. Delivery must record the new remote HEAD and its own CI result after ordinary fast-forward push.

Before ready-for-review/main merge: merge T PR #28 into main through the team review process; merge that updated main normally into nohyusin; retain T issuer_seq monotonic checks together with F Core/Content/Lifecycle semantics; rerun integrated whole-unit/build and Desktop/Mobile browser regressions; verify CI for that integrated SHA. Live RPC remains SKIP until an explicit readonly live execution is selected.

No actual authoritative DB, chain signing/broadcast, TEST dataset, W3/W4 frozen evidence or policy LOCK operation is part of this change.
