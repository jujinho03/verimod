# W4 F — R01 manifest trust fix (2026-10-16)

Status: **F local regression PASS; actual Python R01 rerun and A independent verification pending. GATE-4 is not PASS.** Owner: 노유신 (F). Branch: `f-w4-service-verifier`.

## Cause and change

A's pinned actual E2E (`a-w4-ai09-actual-inference`, `b8c44dff`) showed a valid but unapproved model hash and an arbitrary policy hash each produced HTTP 201 and one new Decision. `backend/src/inference.ts` only checked model hash shape and accepted policy hash beside unrelated thresholds.

- `backend/src/inference.ts`: canonical-hash the configured R01 model manifest with T's `canonicalBytes` and `domainHash(DOMAINS.model, ...)`, require the pinned R01 hash, and match every inference response to it. The output must also have taxonomy/version `verimod-ko-beep-hate/1`, exactly `hate` and `offensive` scores, `UNCALIBRATED`, and the existing UUID, commitment, score range and timestamp checks. The hash is an identity binding; it does not prove which model actually ran.
- `backend/src/inference.ts`: canonical-hash the configured W4 policy manifest with `DOMAINS.policy`, require the pinned hash, compare all four active thresholds, and bind `>=`, precedence, TRUNCATED override, reason/rule mappings, and ALLOW output. Evaluation checks this on every request, so mutation after evaluator creation also fails closed.
- `backend/src/issuance.ts`, `app.ts`, `server.ts`: pass the trusted model manifest into issuance and validate before policy evaluation or persistence. The provisional policy requires `VERIMOD_W4_PROVISIONAL_E2E_ONLY=true`, two explicit manifest paths and a loopback inference URL. Server listens on loopback. Missing or invalid configuration yields HTTP 503 through the existing route.
- `backend/config/`: F-owned snapshots of the exact A model and policy manifests. A branch files are untouched. `backend/README.md` records the technical-only runtime configuration.

The policy remains `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`; X/B and team decision are pending. No W5 lock or chain send was attempted.

## Regression evidence

`backend`: `npm run typecheck` PASS; `npm test -- --reporter=dot` **51/51 PASS, 7/7 files**; `npm run build` PASS. On Windows the test command used `TEMP` and `TMP` set to a local workspace temp folder because Vitest's sandbox default temp path gave `ENOENT` during module loading.

A's 21 policy vectors were copied unchanged into `backend/test/fixtures/w4-a-policy-vectors.json`; the F evaluator matched all 21 exact expected outputs. This is a local rerun against recorded A/Python expected vectors, not a fresh Python execution.

`backend/test/w4-manifest-boundary.test.ts` exercises the HTTP route and SQLite for the following failures. **Every row returned 503 / `INFERENCE_UNAVAILABLE`, with Decision, anchor candidate, content_store, epoch and idempotency deltas all zero.** No policy action or fake score appeared in failure responses.

| Failure case | HTTP | DB delta |
| --- | ---: | --- |
| Model manifest missing | 503 | all 0 |
| Model manifest content changed with old hash | 503 | all 0 |
| Model hash malformed | 503 | all 0 |
| Valid but unapproved model hash (A FAIL-01) | 503 | all 0 |
| Wrong content commitment | 503 | all 0 |
| Score out of range | 503 | all 0 |
| Taxonomy version changed | 503 | all 0 |
| Score semantics changed | 503 | all 0 |
| Policy missing | 503 | all 0 |
| Valid but unbound policy hash (A FAIL-02) | 503 | all 0 |
| One threshold changed with pinned policy hash | 503 | all 0 |
| Policy manifest content changed with old hash | 503 | all 0 |
| Provisional local E2E gate disabled | 503 | all 0 |
| Provider stopped (simulated adapter failure) | 503 | all 0 |
| Provider timeout (simulated adapter failure) | 503 | all 0 |

Normal issuance tests passed with the pinned manifest identity. Two further receipts used score pairs from A's actual report (FULL `3364/12979`, TRUNCATED `31479/102538`) through a local fixture adapter. They verified ALLOW / HUMAN_REVIEW, commitment, canonical receipt hash, public/private separation, replay, changed-payload 409 and SQLite reopen with two durable Decisions. These are **recorded score fixture replays**, not fresh R01 Python inference.

## Remaining external checks

The actual R01 Python service could not be launched in this F checkout: the A branch tracks its server script and manifest, but this workspace has no R01 `safetensors` weights or A `.venv` runtime. Therefore the two actual-model receipt rerun, actual Python stopped/timeout faults, and A's independent rerun of the updated F commit remain **BLOCKED**. A's original `verify_w4_af_e2e.mts` pins the prior F SHA; A must update that pin in A-owned work and run it against this new F commit. Its prior failure evidence is preserved on A's branch.

Issuer alignment is **UNRESOLVED**: F receipts use `verimod-example-platform`, while T's approved `BASE_SEPOLIA_DEMO` TrustProfile uses `verimod-demo-issuer`. F did not alter either identity. F and T must agree the authoritative value, then issue fresh receipts and verify issuer commitment, receipt hash, profile match and bundle rejection on mismatch.

Final commit SHA and push URL are recorded in the Git commit / branch link after publication; this report intentionally makes no claim of external approval or GATE-4 completion.
