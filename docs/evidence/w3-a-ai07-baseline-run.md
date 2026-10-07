# W3 AI-07 Official Baseline Run

## Status

COMPLETED

## Run Identity

- run_id: `AI07-BL-KLUE-RB-45126-R01`; first official actual baseline, one FULL run only.
- Branch: `main`; HEAD: `09d72598dcd1d6744d4c80b99af0721d4c1efedc`; dirty: W3 spec/runner changes, no commit/push.
- CLI start UTC: `2026-10-06T14:54:38.176881+00:00`; actual training begin: `2026-10-06T14:54:39.651963+00:00`.
- Training/final-validation end UTC: `2026-10-06T16:43:13.715752+00:00`; wall interval: 6515.54s.
- Engineering evidence/latency completed UTC: `2026-10-06T16:44:33.511770+00:00`.

Actual command, repository root / PowerShell:

```powershell
$env:PYTHONHASHSEED = '45126'
& ai/.venv/Scripts/python.exe -B -u ai/scripts/train_w3_baseline.py --config ai/configs/w3_baseline.json --splits-dir ../verimod-local-data/w2/beep-splits --run-id AI07-BL-KLUE-RB-45126-R01 --offline 2>&1 | Tee-Object -FilePath ai/artifacts/results/AI07-BL-KLUE-RB-45126-R01/training.log
```

## Dataset

- Primary: BEEP! Korean HateSpeech; revision `f8d05dce2b22007bb149e5139c0060c68ad8f94b`.
- Internal split seed `45126`, group-greedy-class-aware-v1.
- TRAIN N=5857; VALIDATION N=1255.
- TRAIN SHA-256: `fc9a70cdffc2dad297d37e1724d8011e070e17dd251f2d061ec40f7ea2d89a2b`.
- VALIDATION SHA-256: `a92f81ed8eadb9fdb1950be542f9edac4fe778f3e7bd2d630cd1494ef031a26a`.
- TEST accessed: **NO**. No TEST resolve/stat/open/hash/inference/metrics. Secondary accessed: **NO**.
- TRAIN/VALIDATION only loader and process open allowlist; runtime opens: ['train', 'validation'], denied: 0.
- Latency preparation separately loaded VALIDATION only; it never read official raw source pools or TEST.

## Model

- Model/tokenizer: `klue/roberta-base` / `klue/roberta-base`.
- Immutable model revision: `02f94ba5e3fcb7e2a58a390b8639b0fac974a8da`; tokenizer revision: `02f94ba5e3fcb7e2a58a390b8639b0fac974a8da`.
- Native labels: hate/offensive/none; id2label 0:hate, 1:offensive, 2:none.
- Harmful exposed keys: hate/offensive; reference none != ALLOW.
- Parameter count: 110620419; trust_remote_code=False.
- CPU Intel Core i5-1035G4, RAM 16,930,271,232 bytes; torch 2.14.1+cpu, transformers 4.57.6.
- Score semantics: **UNCALIBRATED**. Raw logits and normalized model scores are distinct fields.

## Training Config

Frozen config: `ai/configs/w3_baseline.json`, SHA-256 `466254e11c8f9d7597aeb877fc1925d0e561dd9c120213377abcd4e52ec9587f`. No config/hyperparameter change.

| Parameter | Value |
|---|---|
| epochs | 3 |
| learning_rate | 2e-05 |
| weight_decay | 0.01 |
| warmup_ratio | 0.1 |
| scheduler / optimizer | linear / adamw_torch |
| max_grad_norm | 1.0 |
| max_length | 128 |
| train / eval batch | 4 / 8 |
| gradient accumulation | 4 |
| effective batch | 16 nominal; final partial update is smaller |
| seed / data_seed | 45126 / 45126 |
| mixed precision / class weighting | none / NONE |
| selection | VALIDATION Macro-F1, best checkpoint, greater_is_better=true |
| preprocessing | verimod-ko-text-v1, 500 code point HEAD then token HEAD |
| padding | longest in batch, right |
| threads / dataloader workers | 4 intra-op, 1 inter-op / 0 |
| full_determinism | false; no cross-hardware bitwise guarantee |
| epoch save/eval / save_total_limit | epoch / epoch / 2 |

Training executed 1101 optimizer updates and 17571 train examples across 3 epochs. Smoke weights were not used.

## Epoch Log

| Epoch | Train Loss | Val Loss | Macro-F1 | Micro-F1 | Accuracy | Time | LR |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | 0.894858 | 0.802847 | 0.590255 | 0.624701 | 0.624701 | 2110.46s | 1.4828283e-05 |
| 2 | 0.643241 | 0.785001 | 0.649630 | 0.664542 | 0.664542 | 2132.86s | 7.4141414e-06 |
| 3 | 0.448644 | 0.871984 | 0.652460 | 0.662948 | 0.662948 | 2139.28s | 0 |

Train Loss is the sample-weighted unscaled forward cross entropy observed from detached logits. The original Trainer loss used for backward was returned unchanged. Trainer's interval logging uses a different window/accumulation aggregation and is retained in training.log; those values are not substituted for the epoch statistic. Epoch Time runs from epoch begin through validation, excluding the subsequent checkpoint write. Full precision machine values are in epoch_log.json.

## Best Checkpoint

- Selected epoch/step: 3.0 / 1101.
- Checkpoint: `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/checkpoint-1101`.
- Selection validation Macro-F1: 0.652459986898.
- Final saved weight: `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model/model.safetensors`; 442505820 bytes, single file, no sharding.
- SHA-256: `a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f`.
- Explicit best-checkpoint reload preceded the single final full VALIDATION prediction pass. Saved selected-model weights were separately reloaded for offline latency and label-map verification.

## Final Validation Metrics

- Macro-F1: 0.652459986898.
- Micro-F1: 0.662948207171.
- Accuracy: 0.662948207171.

| Class | Precision | Recall | F1 | Support |
|---|---:|---:|---:|---:|
| hate | 0.779736 | 0.580328 | 0.665414 | 305 |
| offensive | 0.524362 | 0.560794 | 0.541966 | 403 |
| none | 0.718593 | 0.784278 | 0.750000 | 547 |

## Confusion Matrix

Rows=true, columns=pred, canonical hate/offensive/none order.

| True / Pred | hate | offensive | none |
|---|---:|---:|---:|
| hate | 177 | 100 | 28 |
| offensive | 37 | 226 | 140 |
| none | 13 | 105 | 429 |

## One-vs-Rest Error Rates

| Class | TP | FP | TN | FN | FPR | FNR |
|---|---:|---:|---:|---:|---:|---:|
| hate | 177 | 50 | 900 | 128 | 0.052632 | 0.419672 |
| offensive | 226 | 205 | 647 | 177 | 0.240610 | 0.439206 |
| none | 429 | 168 | 540 | 118 | 0.237288 | 0.215722 |

FPR=FP/(FP+TN); FNR=FN/(FN+TP). A zero denominator has value 0.0 plus defined=false, preserving the existing skeleton's explicit undefined flag. No silent NaN replacement. Actual flags are preserved in metrics.json. Independently recomputed sklearn macro/micro/accuracy/per-class/confusion and OVR counts agree within 1e-12.

## Offline Inference Latency

- CPU/model: selected checkpoint / i5-1035G4 / 2.14.1+cpu, threads 4/1, model.eval(), torch.inference_mode().
- Batch size 8; warm-up 3 batches / 24 examples.
- Measurement 32 full batches / 256 examples, first 256 VALIDATION rows in pinned order.
- perf_counter around forward only; tokenization/collation/model load outside timer. NumPy linear-interpolated percentiles.
- Batch p50/p95: 707.928 / 1041.447 ms.
- Batch-normalized per-example mean/p50/p95: 92.281 / 88.491 / 130.181 ms.
- Throughput: 10.837 examples/sec.
- These normalized figures are not single-example request latency. No W4 API/infer request latency was measured. These timing subset passes are separate from the single final full VALIDATION metric pass.

## Artifacts

| Artifact | Path / purpose |
|---|---|
| best/selected weights | `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model/model.safetensors`; ignored |
| model config/tokenizer | selected_model directory; ignored |
| trainer state | `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/trainer_state.json`; ignored |
| execution config/environment | `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/baseline_execution_config.json`, environment_reference.json; ignored |
| training log | `ai/artifacts/results/AI07-BL-KLUE-RB-45126-R01/training.log`; ignored |
| predictions | `ai/artifacts/results/AI07-BL-KLUE-RB-45126-R01/validation_predictions.jsonl`; JSONL, 1255 rows, ignored |
| metrics | `ai/artifacts/reports/w3_baseline_run/AI07-BL-KLUE-RB-45126-R01/metrics.json`; small report |
| latency | same report directory / latency.json; small report |
| epoch/provenance/hash/integrity | same report directory; small reports |
| postprocessing source | `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/postprocessing_r01.py`; ignored; SHA-256 `18b32ca2aa76793232ec4cadf28d52fec19be048de1c0f884202111435fa4197` |

Prediction fields: example_id/index, y_true/y_pred, score_hate/score_offensive/score_none, is_correct, raw logits, native model_scores, score_semantics. example_id is deterministic validation split row index. No raw text/title is included. Ignore policy was not changed; weights, checkpoints, training log and prediction artifact remain local.

## Validation / Code Changes

- N=1,255; score shape [1255,3]; no NaN/Inf; canonical labels only; confusion/support sums 1,255.
- Saved weight hash computed; selected checkpoint reload and full final prediction succeeded.
- Small runner fixes: --run-id and one-run failure marker; exact epoch CE/progress observation; explicit best reload; move per-row predictions to existing ignored results namespace; add flat deterministic prediction fields. No optimization setting changed.
- Safe tests before training: 84 passed, 16 subtests passed in 17.73s. Actual dataset open attempts in unit tests: 0.
- git status/diff/diff --check and staged paths reviewed separately in final_review.json; raw data/TEST/weights/checkpoints/tokens/secrets staged 0. commit/push 0.

## Boundary

- TEST NOT ACCESSED; PRIMARY ONLY; 3-CLASS ONLY.
- NO CALIBRATION; NO THRESHOLD TUNING; NO POLICY SELECTION.
- SCORES ARE UNCALIBRATED; THIS RUN IS NOT TEST PERFORMANCE.
- No second model or repeat FULL training. No production/generalization/bias adequacy conclusion.
- No final Experiment Registry, Model Manifest, real-model fixture, Model Card/Data Card, LOCK or FastAPI/infer implementation.
- No shared protocol/backend/frontend changes. File SHA-256 is artifact provenance, not protocol canonical/hash/Merkle implementation or proof of model execution.
- No external anchor; PENDING_ANCHOR boundary remains.

Next proposed single step: Baseline Packaging & Handoff (AI-21 + AI-08 + AI-16), only after 주진호 approval.
