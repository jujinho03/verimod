# W4 A — validation, policy parity and actual A/F handoff

최신 독립 재검증: [F/T 수정 반영 결과](../evidence/w4-a-final-revalidation.md).
정상 2건, Fail Closed 17건, parity 21건 PASS 및 issuer MATCH. 아래는 보존된 이전 실행 기록이다.

Date: 2026-10-16 KST. Work branch: `a-w4-ai09-actual-inference`.
**Overall PARTIAL.** The actual success path passes; two required manifest rejection
cases fail in unchanged F code, and F/T issuer identities differ. No GATE/public-chain
completion claim is made.

| Area | Status | Evidence |
| --- | --- | --- |
| AI-21 | PASS | Actual R01 VALIDATION 1,255 predictions; W3 metrics exactly reproduced |
| Validation policy | PROVISIONAL | 25 actual-score candidates; X/B and approval unresolved |
| Python/Node parity | PASS | 21 fixed vectors with actual candidate thresholds and hash |
| AI-10 Actual A/F E2E | FAIL | Happy path passes; unapproved valid model/policy hashes wrongly issue receipts |
| Issuer ID compatibility | MISMATCH | Receipt example-platform vs approved demo-issuer |
| 503 / Receipt 0 / anchor candidate 0 | FAIL | 6/8 cases pass; both manifest-identity faults create 1 decision/candidate |
| F/T handoff | BLOCKED | F manifest binding + F/T issuer agreement + team policy approval needed |
| W4 A overall | PARTIAL | Verified artifacts delivered; external-owner blockers preserved |

## Git and protected scope

Fresh fetch verified A AI-09 `dd1031ae042d384da8600d26310a671f398f68c4`,
main `1401e03931f76ed8405454081adb9478339bae67`,
F `a58230e897111eee8c981c4d734294201651b952`,
T `3054b112e9be09501c8f21c66a861212e7975db2`.
The final A delivery commit is the commit containing this report; it is reported in
the handoff response without a self-referential SHA or execution-time commit claim.
W4 validation source was a working-tree addition based on AI-09; exact execution
source hashes are in the separate [W4 experiment registry](../../ai/experiments/w4_validation_runs.jsonl).

Only A is committed/pushed. F is a detached test worktree at the pinned SHA, with no
tracked edits. T canonical/hash/profile sources were read from Git into an ignored
local test directory. No broad merge, no F/T branch mutation, no main push, no Base
RPC/signing/broadcast, no training or W5–W7 activity occurred.

W3 registry, frozen config/lock, model manifest and fixtures remain byte-equivalent
under Git newline normalization. The selected local weight remains SHA-256
`a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f`.
Pre-existing untracked W3 reports and output files were preserved.

## AI-21 actual VALIDATION

Only the known `validation.jsonl` was opened from the W2 internal split location;
there was no dataset directory enumeration or TEST path/stat/open/prediction.
Approved dataset revision: `f8d05dce2b22007bb149e5139c0060c68ad8f94b`.
VALIDATION SHA-256: `a92f81ed8eadb9fdb1950be542f9edac4fe778f3e7bd2d630cd1494ef031a26a`.
Class counts: hate 305, offensive 403, none 547, total 1,255.

AI-09 `SelectedModel.predict` ran on every row: CPU float32, batch 1, threads 4/1,
`verimod-ko-text-v1`, 500-codepoint HEAD, pinned tokenizer revision
`02f94ba5e3fcb7e2a58a390b8639b0fac974a8da`, right truncation 128 including special
tokens, native softmax and once-only exposed PPM rounding. A read-only forward hook
captured native logits for truth/prediction metrics. All 1,255 statuses were FULL.

| True / predicted | hate | offensive | none |
| --- | ---: | ---: | ---: |
| hate | 177 | 100 | 28 |
| offensive | 37 | 226 | 140 |
| none | 13 | 105 | 429 |

- Macro-F1: **0.6524599868976999**; W3 delta exactly 0.
- Accuracy: **0.6629482071713148**; W3 delta exactly 0.
- Class F1: hate 0.6654135338345865; offensive 0.5419664268585132; none 0.75.
- Confusion matrix matches W3 batch-8 evidence exactly despite API batch 1. A batch-8
  diagnostic was not needed and was not run; raw float score equivalence across batches
  is not claimed.
- Elapsed: **148.216s**, including model initialization and output preparation.
- Private predictions SHA-256:
  `74fcac005741574422edcd597dc1f78d8234b20e24e50f35d722d01fd927a400`.

Private predictions contain local row number, native truth/prediction, native scores,
logits, exposed PPM and status. They contain no original text or dataset record ID;
the entire row file remains ignored/private nevertheless.
[Safe aggregate and provenance](../../ai/artifacts/reports/w4_a_validation/20261016/validation.json).

## Candidate policy and parity

[All 25 comparisons with metric fractions](../evidence/w4-a-validation-policy.md).
`none` is only the operational NORMAL proxy for FRR; it never directly determines ALLOW.
Formal selection remains FRR <= X and HRR_TOTAL <= B, minimum HAR, maximum RP,
minimum HRR_TOTAL. X/B have no confirmed approval, so formal selection was not run.

The predeclared technical candidate H50-75_O50-75 uses median review / upper-quartile
restrict from actual FULL validation scores and exercises all three actions. Its
thresholds are hate `24495/216950`, offensive `180483/646501` PPM.
Actions: ALLOW 461, HUMAN_REVIEW 198, RESTRICT 596. FRR 91/547, RP 505/596,
HAR 90/708, HRR_TOTAL 198/1255. This is **W4_PROVISIONAL_E2E_ONLY**, not operating approval.

Model manifest hash:
`0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1`.

Computed policy manifest hash:
`0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e`.

The exact JSON and canonical bytes are committed with newline conversion disabled
for those two artifacts. T's existing canonicalBytes/domainHash(DOMAINS.policy, ...)
computed the hash. T and F canonical/hash source blobs were verified identical.
The manifest explicitly includes precedence, TRUNCATED override, inclusive comparisons,
reason/rule definitions and pending approval status.

**21/21 parity vectors PASS**: four threshold -1/equal/+1 boundaries, review/restrict
overlaps, zero ALLOW, max scores, TRUNCATED zero/max/restrict-boundary, exact sorted
reasons/rules and manifest hash. Existing F mock tests are not counted as new evidence.

## AI-10 actual HTTP / SQLite

Unchanged F `createApp`, HTTP adapter, threshold evaluator and `IssuanceService` were
connected to real R01 Python `/infer` using loopback HTTP and dedicated SQLite files.
Two authored Korean synthetic requests (FULL and TRUNCATED) produced real receipts.
Both passed receipt canonical/hash, caller-generated commitment, model/policy references,
policy result, SQLite storage and public/private data separation checks. Reopening the
database retained two receipts. Identical key/request reused the same data without
another model call; changed request with the same key returned 409.

The API private package is F's three-field salt/receipt/commitment metadata. The original
text remains caller-held and in private SQLite; assembling the frontend's five-field
download package is not claimed as an executed browser test. Public bundle has only
receipt_body, receipt_hash, proof and anchor; proof/anchor are null before anchoring.

| Failure scenario | HTTP | New decisions | New candidates | Status |
| --- | ---: | ---: | ---: | --- |
| Policy not configured | 503 | 0 | 0 | PASS |
| Invalid score output | 503 | 0 | 0 | PASS |
| Malformed model manifest hash | 503 | 0 | 0 | PASS |
| Wrong content commitment | 503 | 0 | 0 | PASS |
| Valid but unapproved model hash | 201 | 1 | 1 | FAIL |
| Valid but unbound policy hash | 201 | 1 | 1 | FAIL |
| AI service stopped | 503 | 0 | 0 | PASS |
| Actual Python forward deadline | 503 | 0 | 0 | PASS |

All six 503 bodies carry INFERENCE_UNAVAILABLE and contain no decision/scores/automatic
ALLOW. The two unexpected 201s contain HUMAN_REVIEW, but still violate mandatory
non-issuance. Candidate counts use F's exact pending-receipt LEFT JOIN condition;
all databases have zero epochs, and no freeze or chain send ran.

Actual issuer `verimod-example-platform` mismatches T's approved
`BASE_SEPOLIA_DEMO` issuer `verimod-demo-issuer`. A did not change either identity.
[F/T minimum changes and regression requirements](../handoffs/W4-A-to-FT.md).

Final E2E: **34.238s**, happy path PASS, failure gate FAIL, command exit 1 deliberately.
An initial run completed HTTP cases but failed during harness process cleanup due to
waiting twice on an already exited child; it is not final report evidence. Only the
harness exit-state check was repaired, and a fresh SQLite directory was used for the
recorded rerun. F/T code was not changed to turn failures into PASS.

## Executed commands and REC-01 reproduction

Commands were executed from the A repository root unless a workdir is shown.

```powershell
git fetch origin
git worktree add --detach ../verimod-w4-af-validation a58230e897111eee8c981c4d734294201651b952
# Workdir: ../verimod-w4-af-validation/backend
npm ci --ignore-scripts --no-audit --no-fund
# Workdir: A repository root
& ai/.venv/Scripts/python.exe -B -u ai/scripts/run_w4_validation.py --splits-dir ../verimod-local-data/w2/beep-splits --private-dir ai/.venv/w4-private-20261016 --public-dir ai/artifacts/reports/w4_a_validation/20261016
& ai/.venv/Scripts/python.exe -B ai/scripts/prepare_w4_policy.py --public-dir ai/artifacts/reports/w4_a_validation/20261016 --private-dir ai/.venv/w4-private-20261016 --f-worktree ../verimod-w4-af-validation
node ../verimod-w4-af-validation/backend/node_modules/tsx/dist/cli.mjs ai/scripts/verify_w4_af_e2e.mts . ../verimod-w4-af-validation ai/.venv/w4-private-20261016/e2e-r02 ai/artifacts/reports/w4_a_validation/20261016 ai/.venv/w4-private-20261016/t-protocol
& ai/.venv/Scripts/python.exe -B ai/scripts/check_w4_a_release.py --private-dir ai/.venv/w4-private-20261016 --public-dir ai/artifacts/reports/w4_a_validation/20261016
```

For REC-01, use fresh ignored private and new public output directories; scripts refuse
to overwrite prediction/E2E evidence. Run validation, prepare/hash/parity, then E2E.
Show only aggregate reports and the final E2E summary, never private responses, salts,
corpus text, file explorer paths or private SQLite contents. Expected current E2E exit
is 1 with the two named defects; a recording must not present this as GATE completion.
No recording, browser public verification or Base transaction is claimed to have run.

Actual private logs: `ai/.venv/w4-private-20261016/e2e-r02/actual-python.log`,
`timeout-python.log` in the same directory, and `ai/.venv/w4-private-20261016/w4-a-regression.xml`.
Private predictions: `ai/.venv/w4-private-20261016/predictions.jsonl`.
Private SQLite and fault response files remain under the ignored `e2e-r02` directory.

Public evidence root: `ai/artifacts/reports/w4_a_validation/20261016/`:
validation, candidate metrics, policy manifest/canonical bytes/hash, source provenance,
21 parity vectors/results, actual E2E, regression, and metadata-redaction records.

## Regression, privacy and remaining warnings

Full guarded AI regression: **152 tests + 27 subtests passed**, pytest duration 18.08s.
This includes the previous 141 tests and 11 new W4 policy/evidence tests. W3 frozen
file comparison passed. Tests used synthetic fixtures, not the sealed TEST corpus.
No model training or TEST access ran during any stage.

Two earlier AI-09 public reports contained local executable paths/hostname. Those
metadata fields were redacted in the current tree; original bytes and checksums are
preserved privately. No scores, timestamps, test results or W3 frozen artifacts were
altered. Historical AI-09 commits still contain their original metadata; Git history
was not rewritten or force-pushed. New W4 reports contain no hostnames/absolute paths.

Non-failing environment warnings: Starlette HTTPX TestClient deprecation and Node 24
experimental SQLite. Initial sandbox npm install failed on Windows symlink permissions;
the isolated dependency install and loopback tests succeeded with approved permissions.

**Stopping boundary:** F must enforce manifest identity, F/T must agree issuer identity,
and the team must approve X/B/policy before operational/public integration. A delivers
the verified positive and negative evidence without modifying F/T-owned contracts.
