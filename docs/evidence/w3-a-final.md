# VeriMod W3 A Final

## Status

**W3_A_COMPLETE_WITH_INTEGRATION_BLOCKER** — A deliverables and local checks complete.

Publication closure is conditional on the final commit and verified fast-forward push. The committed
document cannot self-reference its final SHA. Actual post-push local/remote equality is recorded separately
in ignored `ai/artifacts/results/AI07-BL-KLUE-RB-45126-R01/w3_closure_post_push.json` and the final execution report.
Until that verification exists, publication remains PENDING rather than presumed successful.

## AI-07

- Official run `AI07-BL-KLUE-RB-45126-R01`: klue/roberta-base, pinned revision
  `02f94ba5e3fcb7e2a58a390b8639b0fac974a8da`, 3 epochs, native hate/offensive/none.
- TRAIN 5857; VALIDATION 1255; best step 1101.
- Macro-F1 0.6524599868976999; Micro-F1/Accuracy 0.6629482071713148.
- Selected artifact SHA-256: `a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f`.
- [Official evidence](w3-a-ai07-baseline-run.md) is preserved unchanged; no training or full-dataset inference rerun.

## AI-21

**COMPLETE** — `ai/experiments/registry.jsonl`, one official R01 entry.
Decision KEEP_AS_W3_BASELINE; no FINAL_MODEL / PRODUCTION_READY / LOCKED_FOR_TEST claim.

## AI-08

**COMPLETE** — `ai/artifacts/manifests/AI07-BL-KLUE-RB-45126-R01.model_manifest.json`.
Version `model-manifest/1`; shared canonical model hash
`0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1`.
Shared canonical/hash implementation reused; metric decimals explicitly encoded as strings.

## AI-16

**COMPLETE (A package scope)** — [reproducibility/handoff](w3-a-reproducibility-handoff.md),
`ai/fixtures/w3_real_model_i1_fixture.json`, generator and single verifier.
Three synthetic inputs inferred by the selected actual model; two CPU process runs matched exactly.
**CROSS_MACHINE_VERIFICATION = NOT_EXECUTED.** No other-PC verification is claimed.

## Provenance

- execution_base_head: `09d72598dcd1d6744d4c80b99af0721d4c1efedc`.
- source_commit_at_execution: null.
- source_snapshot_commit: `f6b39d3b7c5637b68e18c2b1b59ee91890c059f0`.
- PASS_WITH_DOCUMENTED_LIMITATION: pyproject historical SHA was not recorded and is not backfilled.
  Execution lock/config hashes and runtime inventory are retained; all 12 recorded execution files match.

## Handoff

A Python and F branch validator accept all 3 actual fixture envelopes. Shared Receipt schema still
requires the legacy taxonomy/5-label shape. Status **A_OUTPUT_READY_CONSUMER_ALIGNMENT_REQUIRED**;
integration issue **HANDOFF_CONTRACT_MISMATCH**. F/T W3 branches were not yet merged into origin/main at sync.

F's validator was executed from its immutable Git blob; the actual backend service was not started or
issued a Receipt. No shared/backend/frontend contract change, fake labels, authoritative Receipt,
Merkle root, local registerEpoch or external anchor is claimed. **PENDING_ANCHOR**.

## Tests

- AI: 95 passed, 27 subtests passed; actual dataset access attempts 0.
- Existing repository `node scripts/check-all.mjs`: exit 0.
- Frontend/shared tests: 172 passed; browser regression 1 passed (matrix 20/20); lint/build passed.
- Main backend: 3 passed; typecheck/build passed.
- Main Hardhat toolchain: 1 passed; build passed. This is the main ToolchainCheck, not T-branch W3 registry integration.
- F immutable-branch inference validator: 3/3 fixture envelopes passed.
- Shared actual-fixture schema probes: 3/3 rejected with INVALID_SCHEMA, recorded as expected integration blocker.
- Evidence: `ai/artifacts/reports/w3_handoff/`.

Sandbox npm installation failed; the same full check passed with approved normal permissions. Existing
npm dependency audit warnings remain: frontend 1 high; backend 1 high + 1 critical; contracts 9 low +
1 moderate + 2 high. No dependency autofix or lock update was performed in this A scope.

## TEST

**SEALED / NOT ACCESSED**. No TEST resolve/stat/open/hash/inference, no Secondary access.

## Deferred

- T/F branch integration and shared actual-taxonomy Receipt schema alignment.
- Cross-machine verification; Secondary; model race; calibration; threshold tuning.
- TEST evaluation; Model Card; policy lock; production runtime inference and external anchoring.
- Existing JS dependency audit findings require owner review.

## Security Boundary

VeriMod verifies whether the presented Decision Receipt matches the approved anchored commitment
and detects post-issuance modification.

It does NOT prove:

- AI judgment is objectively correct.
- Actual model execution occurred.
- Initial record was truthful.
- Platform logs are globally complete/fresh.
