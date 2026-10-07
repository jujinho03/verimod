# W3 AI-07 Training Runner Smoke Evidence

## Source

- Branch: `main`; HEAD: `09d72598dcd1d6744d4c80b99af0721d4c1efedc`.
- Dirty state: 직전 단계 baseline-spec 변경 + 이번 runner 변경. commit/push 없음. 기존 `output/` 변경 없음.
- 착수 전에 git status/diff/untracked, config, lock, baseline spec을 다시 읽었다. 기존 verification의 config/lock/analyzer SHA-256 세 개 모두 현재 파일과 일치했다.
- Frozen spec: [w3-a-baseline-spec.md](w3-a-baseline-spec.md). baseline config와 lock은 이번 단계에서 변경하지 않았다.

## Runner

- Entry: [`ai/scripts/train_w3_baseline.py`](../../ai/scripts/train_w3_baseline.py).
- Package: [`ai/src/verimod_ai/training/`](../../ai/src/verimod_ai/training/).
- Config: [`ai/configs/w3_baseline.json`](../../ai/configs/w3_baseline.json), SHA-256 `466254e11c8f9d7597aeb877fc1925d0e561dd9c120213377abcd4e52ec9587f`.
- Model/tokenizer: `klue/roberta-base`, 동일 immutable revision `02f94ba5e3fcb7e2a58a390b8639b0fac974a8da`, `trust_remote_code=False`.
- 시작 시 config의 approved hash, runtime dependency pin, w2 dataset provenance를 검증한다. 사전학습 safetensors의 hash도 이전 source evidence와 일치하는지 확인했다.
- 기존 taxonomy의 `NATIVE_TARGET` 순서를 enumerate하고 기존 `map_native_labels`를 재사용한다. `id2label={0:hate,1:offensive,2:none}`, `label2id={hate:0,offensive:1,none:2}`.
- Model config는 `single_label_classification`, 3 labels를 명시한다. 저장/재로드에서도 동일 mapping을 확인한다.
- 기존 preprocessing → pinned tokenizer → max_length 128, right truncation → `DataCollatorWithPadding`의 batch-longest right padding.
- 정식 runner 설정은 config에서 읽는다. epoch 평가/저장, VALIDATION Macro-F1 best checkpoint 선택, selected model 저장, 상세 validation report 및 logits/native model scores export 경로를 구현했다. 정식 모드는 실행하지 않았다.

실제 실행한 smoke 명령 (repository root, PowerShell):

```powershell
$env:PYTHONHASHSEED = '45126'
& ai/.venv/Scripts/python.exe -B -u ai/scripts/train_w3_baseline.py --config ai/configs/w3_baseline.json --splits-dir ../verimod-local-data/w2/beep-splits --smoke --offline 2>&1 | Tee-Object -FilePath ai/.venv/w3-runner-smoke.log
```

로그는 ignored `.venv`에 보관한다. Loader 경로는 CLI/환경변수 `VERIMOD_BEEP_SPLITS`로 전달하며 source/config에 로컬 절대 data path를 넣지 않는다.

## Runtime

- Python 3.12.14 / Windows 11 x64.
- Intel Core i5-1035G4, physical 4 / logical 8, RAM 약 15.77 GiB.
- Device: CPU; NVIDIA/CUDA 없음. torch `2.14.1+cpu`, transformers `4.57.6`, mixed precision none.
- Intra-op threads 4, inter-op threads 1; single CPU process.
- 설치된 Trainer/TrainingArguments signature와 `Trainer._get_dataloader`, `set_initial_training_values` 소스를 실제 확인했다. API는 `processing_class`, `eval_strategy`, `optim=adamw_torch`를 사용한다.
- Trainer의 installed source가 `data_seed`를 Accelerate dataloader config에 전달하고, worker init에 `seed_worker`를 사용하는 것도 확인했다.

Seed 45126은 Python random, NumPy, torch CPU, Transformers set_seed, Trainer seed/data_seed에 적용한다. `PYTHONHASHSEED=45126`은 프로세스 시작 전에 설정했다. CUDA seed는 CUDA available일 때만 적용하며 현재 CUDA 실행은 없다. Frozen `full_determinism=False`를 유지했고 deterministic algorithms를 강제로 켜지 않았다. Hardware/driver/library 변경 시 bitwise 동일 결과를 보장하지 않는다.

## Dataset Boundary

- Primary only: BEEP revision `f8d05dce2b22007bb149e5139c0060c68ad8f94b`, split seed 45126.
- `load_split`은 기존 internal JSONL을 읽고 approved hash/행 수/클래스 수/schema를 검증한다. BEEP raw 원본을 재가공하거나 읽지 않는다.
- TRAIN은 training 전용, VALIDATION은 evaluation 전용이다. TEST/unknown/alias 요청은 resolve/stat/open 전에 `PermissionError`로 거부한다.
- 실제 dataset directory에는 process-level open allowlist도 설치했다. 실제 smoke의 open은 TRAIN 1회, VALIDATION 1회뿐이며 deny 요청은 0건이었다.
- TEST accessed: **NO**. TEST file을 open/stat/hash/read하지 않았다.
- Subset은 각 native class에서 최소 1건을 포함하고 나머지를 seeded random으로 뽑은 뒤 shuffle한다. 동일 seed에 대해 동일 selection을 unit test로 확인했다.

| Smoke split | N | hate | offensive | none |
|---|---:|---:|---:|---:|
| TRAIN | 32 | 12 | 5 | 15 |
| VALIDATION | 32 | 8 | 6 | 18 |

Provenance 검증을 위해 TRAIN/VALIDATION 전체 artifact를 읽지만 preprocessing/tokenization/forward/backward는 선정한 각 32건에만 적용했다. 원문·title·record ID·token ID 배열을 report에 dump하지 않았다.

## Execution

실제 smoke 완료 UTC: `2026-10-06T14:31:23.551259+00:00`.

| 경로 | 실제 확인 |
|---|---|
| TRAIN forward | 8 micro-batches, 총 32 examples |
| backward | classification-head gradient hook 8회, finite gradient |
| optimizer | AdamW update callback 2회 |
| scheduler | last_epoch 2 |
| loss | finite; NaN/Inf loss는 explicit exception |
| evaluation | 32건 × step 평가 2회 + selected-model prediction 1회, 총 12 eval forward batches |
| selection metric | `eval_macro_f1` 생성 확인 |
| best checkpoint | 선택 및 재로드 확인 |
| result write | ignored validation metric report + run_summary 저장 |
| saved model mapping | checkpoint 1/2 및 selected_model의 label maps 확인 |

Smoke override는 `max_steps=2`, eval/save strategy steps, eval/save interval 1, save_only_model true다. Config의 정식 epochs=3, batch=4/8, accumulation=4, LR=2e-5, warmup_ratio=0.10 등은 변경하지 않았다. `max_steps`가 종료 상한을 정하므로 smoke subset 1 pass에서 끝났으며 전체 TRAIN 3 epochs를 실행하지 않았다.

Smoke scheduler는 2 update에 warmup_ratio를 적용하므로 첫 update의 LR이 0인 것은 예상된 동작이다. 이 짧은 실행으로 convergence나 성능을 평가하지 않는다.

Artifacts: `ai/artifacts/smoke/w3_runner/20261006T143104675080Z/`.

- checkpoint 1/2와 selected_model의 weight는 모두 기존 ignore rule로 보호한다. Smoke는 model-only checkpoint이며 optimizer state를 저장하지 않아 resume용 결과가 아니다.
- Namespace/run summary는 `SMOKE_ONLY`; saved model config에도 `verimod_artifact_scope=SMOKE_ONLY`를 명시한다. 최초 smoke 뒤 config metadata marker를 추가하고 3개 config를 재로드해 확인했다. Weight와 label semantics는 바꾸지 않았다.
- Smoke metric 숫자는 ignored `results/validation_metrics.json` 및 ignored 실행 로그에만 남겼다. Git 추적 가능한 engineering summary에는 성능 metric 숫자를 포함하지 않았다.
- Summary: [`smoke_summary.json`](../../ai/artifacts/reports/w3_runner_smoke/smoke_summary.json).

## Metrics / Score Contract

[`training/metrics.py`](../../ai/src/verimod_ai/training/metrics.py)는 integer labels/logits를 기존 [`evaluation/metrics.py`](../../ai/src/verimod_ai/evaluation/metrics.py)의 native single-label `model_report`에 연결한다. Macro-F1은 zero-support class도 포함하며 기존 zero-division 정의를 유지한다. Accuracy는 이 3-class single-label 전체 평가에서 Micro-F1과 같다.

One-vs-rest는 `FPR=FP/(FP+TN)`, `FNR=FN/(FN+TP)`로 추가했다. 분모가 0이면 0.0 및 defined=false를 기록한다. 실제 full baseline에서는 per-class precision/recall/F1/support, confusion matrix와 함께 export하도록 구현했다.

Raw logits와 normalized softmax model scores는 구분하며 **UNCALIBRATED**로 표시한다. 내부 native score에는 reference class가 포함될 수 있지만 external harmful score keys는 hate/offensive다. `none != ALLOW`. 이번 단계는 scores_ppm I1 연결·calibration·threshold/policy tuning을 구현하지 않는다.

## Throughput

| 실측 항목 | 값 |
|---|---:|
| model load incl. source hash sec | 0.7555 |
| dataset provenance load sec | 0.0792 |
| tokenizer load + preprocessing/tokenization sec | 0.1051 |
| smoke train wall sec | 15.0055 |
| optimizer updates | 2 |
| train examples/sec, wall 기준 | 2.1326 |
| optimizer steps/sec, wall 기준 | 0.1333 |
| optimizer update compute durations sec | 3.5565, 4.7853 |
| optimizer update mean / p50 sec | 4.1709 / 4.1709 |
| train compute total sec | 8.3418 |
| final validation prediction wall sec | 2.3677 |
| validation examples/sec | 13.5152 |
| checkpoint save sec | 0.7383, 0.5447 |
| peak process memory bytes | 2,468,663,296 |
| peak process memory GiB | 약 2.30 |

Train wall time에는 smoke의 매-update evaluation/checkpoint 및 best reload overhead가 포함된다. Callback의 optimizer update duration은 accumulation 4 micro-batches의 forward/backward/optimizer/scheduler 구간을 측정하며 step-end 이후 evaluation/save를 제외한다. Memory는 100ms RSS polling과 Windows peak_wset을 함께 사용한 process resident-memory peak다. System 전체 peak나 장시간 full-training peak를 측정한 값은 아니다. Torch 등 library import는 phase timing 시작 전에 수행되므로 model load time에 포함하지 않는다.

## Full Training Estimate

**ESTIMATE — 실측 full-training 시간이 아니다.**

- TRAIN 5,857 / epochs 3 / micro batch 4 / gradient accumulation 4 유지.
- Per-epoch micro-batches: `ceil(5857/4)=1465`.
- Total micro-batches: `1465*3=4395`.
- Per-epoch optimizer updates: `ceil(1465/4)=367` (installed Trainer의 remainder 처리와 일치).
- Total optimizer updates: **1,101**.
- Full validation passes: epoch selection 3회 + 최종 selected-model prediction export 1회 = 4회.
- Estimated total runtime: **4,978.59 sec = 82.98 min = 1.383 h**.
- Classification: **FEASIBLE_LOCAL_CPU** (point estimate ≤ 8h).

계산: `1101 * measured mean update time` + `4 * (1255/32) * measured final validation time` + model load + tokenization의 example 비율 extrapolation + epoch checkpoint 3회/selected-model save 1회 overhead. 최초 smoke 출력의 estimate는 epoch 평가만 포함했으므로, 저장된 최종 summary는 최종 prediction/export도 포함하는 함수로 smoke 이후 다시 계산했다. 이 재계산은 forward/backward 없이 수행했다.

2개 update만으로 extrapolate한 값이며 statistical confidence interval은 없다. Dynamic padding의 subset shape, CPU thermal throttling/전원/다른 process 부하, process startup을 충분히 대표하지 않는다. 정식 checkpoint는 optimizer state도 저장하므로 model-only smoke로 측정하지 않은 추가 I/O가 있다. Scheduling 판단으로 사용하며 완료 시간이나 full-memory 안전을 보장하지 않는다.

## Tests / Git

최종 결과: **82 passed, 16 subtests passed in 17.11s**.

- 신규 runner tests 13개, 기존 안전한 AI tests 69개 (직전 spec tests 포함).
- Split purpose/TEST alias rejection, canonical mapping, approved config, dynamic token boundary, seed subset limit, config→TrainingArguments, smoke isolation, saved config mapping/scope, toy metrics/FPR/FNR, estimate scheduling boundary를 검증했다.
- 기존 source를 검토하고 synthetic/temp fixture만 사용하는 전체 AI tests를 실행했다. Guard는 실제 external dataset directory의 open을 전부 거부하며 실제 접근 요청은 0건이었다.
- Windows sandbox의 기존 temp cleanup 권한 문제 때문에 승인된 sandbox 밖 test 실행을 사용했다. Actual TEST를 읽기 위한 권한 요청은 하지 않았다.
- Test stdout: [`test_results.json`](../../ai/artifacts/reports/w3_runner_smoke/test_results.json).
- 최종 file/source hashes, checkpoint weight hashes, ignore/staging 검증: [`review.json`](../../ai/artifacts/reports/w3_runner_smoke/review.json). Checkpoint 1/2의 serialized weight hash가 달라 실제 update 이후 weight artifact 변경도 확인했다. 이 hash는 SMOKE_ONLY provenance이며 정식 모델 artifact나 protocol commitment가 아니다.
- Smoke 이후 바뀐 부분은 estimate 산식, model config scope metadata 및 문서이며 최종 unit tests를 재실행했다. Tiny training은 한 번만 실행했다.
- `git status`, `git diff`, `git diff --stat`, `git diff --check`, staged paths 및 ignored smoke artifact를 확인한다. Config/lock/analyzer의 기존 approved hashes는 유지한다.
- BEEP raw text / TEST artifact / model weight / checkpoint / HF token / secret staged 0건. source/config의 local absolute path 0건. commit/push 없음.

## Important Boundary

**SMOKE METRICS ARE NOT MODEL PERFORMANCE RESULTS.**

전체 TRAIN fine-tuning, 전체 3 epochs, 정식 validation 성능 발표, TEST 접근, 모델 비교, second model, official Experiment Registry run, final Model Manifest, final F handoff fixture는 실행/생성하지 않았다. Shared protocol, backend, frontend 변경 없음. Canonical/hash/Merkle 구현 없음; source/artifact SHA-256은 파일 provenance만 기록한다.

이번 검증은 local CPU training/evaluation 실행 경로의 smoke다. Receipt/anchor integration은 수행하지 않았으며 actual external anchor 전 상태는 PENDING_ANCHOR다. Blockchain은 model execution 자체나 AI correctness를 증명하지 않는다.

## Status

**RUNNER_READY**

다음 단일 제안: **AI-07 FULL baseline fine-tuning 실행**. 주진호의 별도 승인 전에는 실행하지 않는다.
