# R01 Source Provenance

## Run

`AI07-BL-KLUE-RB-45126-R01`

## Execution Base

- Branch: `main`.
- execution_base_head: `09d72598dcd1d6744d4c80b99af0721d4c1efedc`.
- execution_worktree_state: `DIRTY`.
- source_commit_at_execution: **null**.
- source_snapshot_commit: **null in this pre-commit document**; the post-commit record stores the new SHA without self-reference.

R01 was executed from an uncommitted working tree based on HEAD 09d72598dcd1d6744d4c80b99af0721d4c1efedc.

The snapshot commit is created after R01 and must never be called its execution-time commit.

## Exact Execution Source

| File | R01 recorded SHA-256 | Current SHA-256 | Match |
|---|---|---|---|
| `ai/scripts/train_w3_baseline.py` | `afdd8289c1684cd96a5ee0dc2c64df84cbaa4a43983d2aa10c8bff1738097bab` | `afdd8289c1684cd96a5ee0dc2c64df84cbaa4a43983d2aa10c8bff1738097bab` | YES |
| `ai/src/verimod_ai/training/runner.py` | `a48a78d8ab235e20c179f62181df47655604a3a16629dd2794a78e8206e9ae26` | `a48a78d8ab235e20c179f62181df47655604a3a16629dd2794a78e8206e9ae26` | YES |
| `ai/src/verimod_ai/training/dataset.py` | `70c2a59ff388e27baae0d038ffd9ab2b63571329d2d8df1a727e334a7f391414` | `70c2a59ff388e27baae0d038ffd9ab2b63571329d2d8df1a727e334a7f391414` | YES |
| `ai/src/verimod_ai/training/reproducibility.py` | `e5e084d2dedc2b21685c9f87044dd7b819bc1b9d84cfcb9a0426b2ed035362b5` | `e5e084d2dedc2b21685c9f87044dd7b819bc1b9d84cfcb9a0426b2ed035362b5` | YES |
| `ai/src/verimod_ai/training/metrics.py` | `ab4cf10b83e5d0c719b17632ce76e72820748c74143c5f977344a4e8ac45330a` | `ab4cf10b83e5d0c719b17632ce76e72820748c74143c5f977344a4e8ac45330a` | YES |
| `ai/src/verimod_ai/data/taxonomy.py` | `595e2c26403b32291722c03152d688924948f08d297aca23b004efc5f13c0077` | `595e2c26403b32291722c03152d688924948f08d297aca23b004efc5f13c0077` | YES |
| `ai/src/verimod_ai/data/label_mapping.py` | `edb914efec8a4312fa8ce79c5f6565552778fff28ac7b159976a8ca06d3d5a75` | `edb914efec8a4312fa8ce79c5f6565552778fff28ac7b159976a8ca06d3d5a75` | YES |
| `ai/src/verimod_ai/data/preprocessing.py` | `888db925ca63ae8abeb4ce47f29a8dc99d662d287e68325fbc4416289bbc9f77` | `888db925ca63ae8abeb4ce47f29a8dc99d662d287e68325fbc4416289bbc9f77` | YES |
| `ai/src/verimod_ai/evaluation/metrics.py` | `5d7c45108d4b9a900f3433d2d884d7e592ded9ae647c2eface6567f3a159ab13` | `5d7c45108d4b9a900f3433d2d884d7e592ded9ae647c2eface6567f3a159ab13` | YES |
| `ai/configs/w3_baseline.json` | `466254e11c8f9d7597aeb877fc1925d0e561dd9c120213377abcd4e52ec9587f` | `466254e11c8f9d7597aeb877fc1925d0e561dd9c120213377abcd4e52ec9587f` | YES |
| `ai/configs/w2_dataset.json` | `41b110959e83f734b5ba5f0e9f7754528286882d517fa1df1cb09e99dd20aa27` | `41b110959e83f734b5ba5f0e9f7754528286882d517fa1df1cb09e99dd20aa27` | YES |
| `ai/requirements-w3.lock.txt` | `8b61fa68c369af1d447f3d7458fccffb2cebf361b382198c2e35bc91ad12bdde` | `8b61fa68c369af1d447f3d7458fccffb2cebf361b382198c2e35bc91ad12bdde` | YES |
| `ai/pyproject.toml` | NOT RECORDED | `474bab5cb469a3b86166ebeeedd4add7cc5f38d6d6a1de0650a0efd1d6bf2c97` | NOT RECORDED; accepted limitation |

## Current Snapshot Verification

- Decision recorded at UTC: `2026-10-07T00:43:17.678964+00:00`.
- Historical hashes matched: **12/12**; mismatches: **0**.
- No training/config/hyperparameter/source change; only provenance metadata and README state updated in this step.
- Existing unrelated `output/` is excluded and untouched.

## Documented Provenance Limitation

- ai/pyproject.toml historical SHA-256 was not recorded at R01 execution time.
- The current pyproject SHA MUST NOT be represented as the historical execution SHA.
- Effective runtime dependency provenance is separately preserved by the execution-time requirements lock hash and recorded runtime package/environment evidence.
- No evidence of source divergence was found among the 12 execution-critical files whose historical hashes were recorded.
- R01 is NOT being rerun.

Command Center superseded `BLOCKED_MISSING_EXECUTION_REFERENCE` with **PASS_WITH_DOCUMENTED_LIMITATION**. The missing historical byte hash cannot be recovered. It is retained as `DOCUMENTED_PROVENANCE_LIMITATION`, not backfilled using the current hash. This decision does not invalidate, alter, or rerun approved R01 results.

## Artifact Link

- Selected weights: `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model/model.safetensors`; ignored local artifact.
- Selected model SHA-256: `a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f`.
- Best step: **1101**; epoch **3**.
- Macro-F1: **0.6524599868976999**; Micro-F1/Accuracy: **0.6629482071713148**.
- Metrics / latency / epoch log / execution hashes / integrity: `ai/artifacts/reports/w3_baseline_run/AI07-BL-KLUE-RB-45126-R01/`.
- Predictions: `ai/artifacts/results/AI07-BL-KLUE-RB-45126-R01/validation_predictions.jsonl`; **1,255** records established by prior audit; excluded from Git.
- No metric recomputation or prediction inference in this source snapshot step.

## Environment Provenance

- Python **3.12.14**; PyTorch **2.14.1+cpu**; Transformers **4.57.6**; CPU **Intel Core i5-1035G4**.
- `ai/artifacts/reports/w3_baseline/environment.json` preserves the runtime package inventory.
- `ai/requirements-w3.lock.txt` has an execution-time SHA-256 and current exact match.

## Git Byte Preservation

- Actual `core.autocrlf=true` may normalize CRLF to LF in stored Git blobs.
- `source_snapshot.json` records execution SHA-256, original line endings, expected normalized-blob SHA-256, and a per-file restoration rule for all 12 recorded files.
- Before commit, staged/HEAD blob bytes are checked against the normalized-byte hash. After commit, restore each file to its recorded LF/CRLF bytes and verify its original execution hash in memory.
- Working source bytes and historical hashes are not rewritten. Git object IDs, normalized-byte SHA-256 and execution raw-byte SHA-256 remain distinct.

## Commit Scope and Privacy

- Includes approved W3 source/config/lock/tests, README updates, small metadata and human-readable evidence.
- Original execution reports remain unchanged. The previous audit and its blocked decision are explicitly retained as historical observations in `source_provenance_audit.json`.
- Actual personal path and credential patterns were absent from the previous 44-file audit; current candidates and staged contents are checked again before commit.
- Public GitHub owner identifiers and synthetic fixtures are not raw dataset exports or secret credentials.
- Excludes `output/`, `.venv/`, raw data, TEST artifacts, weights/checkpoints, predictions, local training logs and credentials.
- Excludes duplicate original runner result reports and intermediate `progress.json`; local files are retained.

## Tests

- New safe AI test report: `ai/artifacts/reports/w3_baseline_run/AI07-BL-KLUE-RB-45126-R01/source_snapshot_tests.json`.
- **84 passed, 16 subtests passed; failures 0**.
- Actual dataset filesystem access is blocked by the test harness; attempts **0**.
- Tests use temporary synthetic fixtures/config/toy arrays. No trained model inference or training rerun occurred.

## Post-Commit Provenance Rule

1. `execution_base_head` identifies the base Git HEAD at execution.
2. Execution source hashes identify the recorded raw bytes used for R01.
3. `source_snapshot_commit` identifies the later verified source snapshot.

The new commit SHA is recorded after commit in `ai/artifacts/results/AI07-BL-KLUE-RB-45126-R01/source_snapshot_post_commit.json` (ignored local record), and can be incorporated into the next AI-21 registry. No self-SHA insertion, amend loop, or execution-time commit claim is used.

## Boundary

- TEST NOT ACCESSED; SECONDARY NOT ACCESSED.
- R01 NOT RERUN; NO MODEL INFERENCE; NO MODEL/CONFIG/HYPERPARAMETER/METRIC CHANGE.
- No threshold/policy/calibration/new-model work.
- AI-21, AI-08 and AI-16 are not marked complete.
- This source snapshot commit is authorized; push is not authorized.

## Status

**PASS_WITH_DOCUMENTED_LIMITATION**

`SOURCE_PROVENANCE_VERIFIED_WITH_LIMITATION` — 12 recorded execution-critical hashes match; pyproject historical byte hash remains NOT_RECORDED.

Next single stage after source snapshot commit: Baseline Packaging & Handoff (AI-21 Experiment Registry + AI-08 Actual Model Manifest + AI-16 Reproducibility / Real-model Fixture).
