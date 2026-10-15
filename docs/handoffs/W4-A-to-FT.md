# W4 A → F/T handoff

Status: **BLOCKED for public integration**, with verified A validation, provisional policy,
parity and actual local issuance evidence. No actual chain transaction was sent by A.

Pinned sources: A AI-09 `dd1031ae042d384da8600d26310a671f398f68c4`,
F `a58230e897111eee8c981c4d734294201651b952`,
T `3054b112e9be09501c8f21c66a861212e7975db2`.
F was executed in an unchanged detached worktree. A did not merge, commit or push F/T.

## 1. F: enforce manifest identity before issuance

`backend/src/inference.ts:assertValidInference` checks model manifest hex32 shape,
but does not compare it to the configured R01 identity. `createThresholdPolicyEvaluator`
accepts a policy hash alongside thresholds without verifying their binding to a manifest.
`issuance.ts` then persists a decision after these format checks.

Reproduced in isolated SQLite through actual HTTP:

| Fault | Expected | Observed |
| --- | --- | --- |
| Valid hex32 model hash not equal to R01 | 503, 0 decisions, 0 candidates | 201, 1 decision, 1 candidate |
| Valid hex32 policy hash not bound to candidate manifest | 503, 0 decisions, 0 candidates | 201, 1 decision, 1 candidate |

These are FAIL, not ordinary successful issuance. The fault proxy changes only the
model hash in an actual Python response; the policy fault changes only the configured
hash alongside the same actual candidate thresholds. No fabricated scores are used.
All resulting rows are in private temporary test databases; they must never be anchored.

Minimum requested F changes, to be made by F:

1. Bind allowed model hash, taxonomy/version and expected score semantics to the
   configured actual R01 model manifest; enforce identity before persistence.
2. Load and canonical-hash the actual policy manifest, derive or compare the four
   thresholds and precedence/reason/rule behavior, and reject mismatched hashes/config.
   Honor the policy's provisional status; enabling a local technical test is not approval.
3. Missing/malformed/unapproved/mismatched manifest cases must yield 503
   INFERENCE_UNAVAILABLE, and leave decisions/content_store/anchor candidates unchanged.
4. Repeat A's exact happy path, commitment, 21-vector parity, restart persistence,
   idempotency and all eight failure scenarios after the fix. Include a threshold
   mutation with unchanged policy hash to test content/hash binding.

A has not patched F's validator or installed an A-side wrapper that conceals this defect.

## 2. F + T: agree one issuer identity

- Actual stored ReceiptBody issuer: `verimod-example-platform`.
- T approved `BASE_SEPOLIA_DEMO` issuer: `verimod-demo-issuer`.
- Actual compatibility test: **MISMATCH**.
- Source: F/T `shared/protocol/src/receipt.ts` versus T
  `frontend/src/domain/approvedProfiles.ts` at the pinned revisions.

F/T must agree which identity is authoritative, change the owning configuration/code,
and reissue fresh synthetic actual-model receipts after alignment. Do not edit a stored
canonical receipt in place: issuer identity is part of its hash. Do not silently change
T's approved profile or canonical encoding. Regression must cover receipt/body hash,
issuer commitment, approved-profile issuer check, bundle verification, and mismatch
rejection. Chain freeze/send and public verification remain F/T responsibilities.

## 3. Team: decide X/B and policy approval

The validation candidate is **W4_PROVISIONAL_E2E_ONLY**, not adopted or LOCK.
Its FRR is 91/547 (16.64%) and HRR_TOTAL is 198/1255 (15.78%).
X/B are unresolved. A supplied all 25 comparisons and the formal selection rule;
no operational feasibility or optimality claim is made.

Model hash: `0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1`.

Policy hash: `0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e`.

Technical thresholds: hate review/restrict `24495 / 216950`, offensive review/restrict
`180483 / 646501`. TRUNCATED overrides high scores to HUMAN_REVIEW. Otherwise any
RESTRICT takes precedence over any REVIEW, then ALLOW. Winning-band reasons/rules
match F exactly. Never load these values as an approved production default.

## Evidence delivery

- [A status and reproduction commands](../progress/W4-A.md)
- [25-candidate trade-off table](../evidence/w4-a-validation-policy.md)
- [Exact policy manifest](../../ai/artifacts/reports/w4_a_validation/20261016/policy_manifest.json)
- [Canonical manifest bytes](../../ai/artifacts/reports/w4_a_validation/20261016/policy_manifest.canonical.json)
- [Policy parity](../../ai/artifacts/reports/w4_a_validation/20261016/policy_parity.json)
- [Actual A/F E2E, including failure deltas](../../ai/artifacts/reports/w4_a_validation/20261016/af_e2e.json)

No salt, private package, corpus text, private row identifier, private weights, signing
key or token is included. TEST stays SEALED. No W5–W7 work was performed.
