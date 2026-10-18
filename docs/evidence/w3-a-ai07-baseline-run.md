# W3 AI-07 공식 baseline 실행

## 상태

COMPLETED

## 실행 식별

- run_id: `AI07-BL-KLUE-RB-45126-R01`; 첫 공식 실제 baseline이며 FULL 실행 1회만 했습니다.
- 브랜치: `main`; HEAD: `09d72598dcd1d6744d4c80b99af0721d4c1efedc`; dirty: W3 spec/runner 변경, commit/push 없음.
- CLI 시작 UTC: `2026-10-06T14:54:38.176881+00:00`; 실제 학습 시작: `2026-10-06T14:54:39.651963+00:00`.
- 학습/최종 validation 종료 UTC: `2026-10-06T16:43:13.715752+00:00`; 경과 시간: 6515.54s.
- 엔지니어링 증거/latency 완료 UTC: `2026-10-06T16:44:33.511770+00:00`.

실제 명령, 저장소 루트 / PowerShell:

```powershell
$env:PYTHONHASHSEED = '45126'
& ai/.venv/Scripts/python.exe -B -u ai/scripts/train_w3_baseline.py --config ai/configs/w3_baseline.json --splits-dir ../verimod-local-data/w2/beep-splits --run-id AI07-BL-KLUE-RB-45126-R01 --offline 2>&1 | Tee-Object -FilePath ai/artifacts/results/AI07-BL-KLUE-RB-45126-R01/training.log
```

## 데이터셋

- Primary: BEEP! Korean HateSpeech; revision `f8d05dce2b22007bb149e5139c0060c68ad8f94b`.
- 내부 split seed `45126`, group-greedy-class-aware-v1.
- TRAIN N=5857; VALIDATION N=1255.
- TRAIN SHA-256: `fc9a70cdffc2dad297d37e1724d8011e070e17dd251f2d061ec40f7ea2d89a2b`.
- VALIDATION SHA-256: `a92f81ed8eadb9fdb1950be542f9edac4fe778f3e7bd2d630cd1494ef031a26a`.
- TEST 접근: **NO**. TEST resolve/stat/open/hash/추론/지표 없음. Secondary 접근: **NO**.
- TRAIN/VALIDATION 전용 loader와 프로세스 open 허용 목록; 실행 중 open: ['train', 'validation'], 거부: 0.
- Latency 준비는 VALIDATION만 따로 로드했으며, 공식 원시 source pool이나 TEST를 읽지 않았습니다.

## 모델

- 모델/tokenizer: `klue/roberta-base` / `klue/roberta-base`.
- 변경 불가능한 모델 revision: `02f94ba5e3fcb7e2a58a390b8639b0fac974a8da`; tokenizer revision: `02f94ba5e3fcb7e2a58a390b8639b0fac974a8da`.
- Native label: hate/offensive/none; id2label 0:hate, 1:offensive, 2:none.
- 외부 노출 harmful key: hate/offensive; 참조 클래스 none != ALLOW.
- 파라미터 수: 110620419; trust_remote_code=False.
- CPU Intel Core i5-1035G4, RAM 16,930,271,232 bytes; torch 2.14.1+cpu, transformers 4.57.6.
- Score semantics: **UNCALIBRATED**. 원시 logits와 정규화된 모델 점수는 서로 다른 필드입니다.

## 학습 설정

동결 설정: `ai/configs/w3_baseline.json`, SHA-256 `466254e11c8f9d7597aeb877fc1925d0e561dd9c120213377abcd4e52ec9587f`. 설정/hyperparameter 변경 없음.

| 파라미터 | 값 |
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
| effective batch | 명목 16; 마지막 부분 update는 더 작음 |
| seed / data_seed | 45126 / 45126 |
| mixed precision / class weighting | none / NONE |
| selection | VALIDATION Macro-F1, best checkpoint, greater_is_better=true |
| preprocessing | verimod-ko-text-v1, code point 500개 HEAD 후 token HEAD |
| padding | batch 내 최장 길이, 오른쪽 |
| threads / dataloader workers | intra-op 4, inter-op 1 / 0 |
| full_determinism | false; 하드웨어 간 bit 단위 보장 없음 |
| epoch save/eval / save_total_limit | epoch / epoch / 2 |

학습은 3 epoch 동안 optimizer update 1101회, 학습 예시 17571건을 처리했습니다. Smoke 가중치는 쓰지 않았습니다.

## Epoch 기록

| Epoch | Train Loss | Val Loss | Macro-F1 | Micro-F1 | Accuracy | 시간 | LR |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | 0.894858 | 0.802847 | 0.590255 | 0.624701 | 0.624701 | 2110.46s | 1.4828283e-05 |
| 2 | 0.643241 | 0.785001 | 0.649630 | 0.664542 | 0.664542 | 2132.86s | 7.4141414e-06 |
| 3 | 0.448644 | 0.871984 | 0.652460 | 0.662948 | 0.662948 | 2139.28s | 0 |

Train Loss는 detach된 logits에서 관측한, 표본 가중·비스케일 forward cross entropy입니다. backward에 쓰인 원래 Trainer loss는 바꾸지 않고 반환했습니다. Trainer의 구간 로그는 window/accumulation 집계 방식이 달라 training.log에 그대로 남기며, epoch 통계 대신 쓰지 않습니다. Epoch 시간은 epoch 시작부터 validation까지이며 이어지는 checkpoint 저장은 제외합니다. 전체 정밀도 값은 epoch_log.json에 있습니다.

## 최적 checkpoint

- 선정 epoch/step: 3.0 / 1101.
- Checkpoint: `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/checkpoint-1101`.
- 선정 기준 validation Macro-F1: 0.652459986898.
- 최종 저장 가중치: `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model/model.safetensors`; 442505820 bytes, 단일 파일, sharding 없음.
- SHA-256: `a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f`.
- 최종 전체 VALIDATION 예측 1회 전에 best checkpoint를 명시적으로 다시 로드했습니다. 저장된 선정 모델 가중치는 오프라인 latency와 label map 검증을 위해 따로 다시 로드했습니다.

## 최종 Validation 지표

- Macro-F1: 0.652459986898.
- Micro-F1: 0.662948207171.
- Accuracy: 0.662948207171.

| 클래스 | Precision | Recall | F1 | Support |
|---|---:|---:|---:|---:|
| hate | 0.779736 | 0.580328 | 0.665414 | 305 |
| offensive | 0.524362 | 0.560794 | 0.541966 | 403 |
| none | 0.718593 | 0.784278 | 0.750000 | 547 |

## 혼동 행렬

행=정답, 열=예측, canonical hate/offensive/none 순서.

| 정답 / 예측 | hate | offensive | none |
|---|---:|---:|---:|
| hate | 177 | 100 | 28 |
| offensive | 37 | 226 | 140 |
| none | 13 | 105 | 429 |

## One-vs-Rest 오류율

| 클래스 | TP | FP | TN | FN | FPR | FNR |
|---|---:|---:|---:|---:|---:|---:|
| hate | 177 | 50 | 900 | 128 | 0.052632 | 0.419672 |
| offensive | 226 | 205 | 647 | 177 | 0.240610 | 0.439206 |
| none | 429 | 168 | 540 | 118 | 0.237288 | 0.215722 |

FPR=FP/(FP+TN); FNR=FN/(FN+TP). 분모가 0이면 값 0.0과 defined=false를 함께 두어, 기존 골격의 명시적 undefined 표시를 유지합니다. NaN을 몰래 대체하지 않습니다. 실제 표시는 metrics.json에 보존합니다. sklearn으로 독립 재계산한 macro/micro/accuracy/클래스별/혼동 행렬과 OVR 건수가 1e-12 이내로 일치합니다.

## 오프라인 추론 latency

- CPU/모델: 선정 checkpoint / i5-1035G4 / 2.14.1+cpu, threads 4/1, model.eval(), torch.inference_mode().
- Batch size 8; warm-up 3 batch / 24건.
- 측정 32 full batch / 256건, 고정 순서의 VALIDATION 첫 256행.
- perf_counter는 forward만 감쌉니다. tokenization/collation/모델 로드는 timer 밖입니다. NumPy 선형 보간 백분위수.
- Batch p50/p95: 707.928 / 1041.447 ms.
- Batch 정규화 예시당 mean/p50/p95: 92.281 / 88.491 / 130.181 ms.
- 처리량: 10.837 examples/sec.
- 이 정규화 수치는 단일 요청 latency가 아닙니다. W4 API/infer 요청 latency는 측정하지 않았습니다. 이 timing 부분집합 실행은 최종 전체 VALIDATION 지표 실행 1회와 별개입니다.

## 산출물

| 산출물 | 경로 / 용도 |
|---|---|
| best/선정 가중치 | `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model/model.safetensors`; Git 제외 |
| 모델 config/tokenizer | selected_model 디렉터리; Git 제외 |
| trainer state | `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/trainer_state.json`; Git 제외 |
| 실행 config/환경 | `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/baseline_execution_config.json`, environment_reference.json; Git 제외 |
| 학습 로그 | `ai/artifacts/results/AI07-BL-KLUE-RB-45126-R01/training.log`; Git 제외 |
| 예측 | `ai/artifacts/results/AI07-BL-KLUE-RB-45126-R01/validation_predictions.jsonl`; JSONL, 1255행, Git 제외 |
| 지표 | `ai/artifacts/reports/w3_baseline_run/AI07-BL-KLUE-RB-45126-R01/metrics.json`; 작은 보고서 |
| latency | 같은 보고서 디렉터리 / latency.json; 작은 보고서 |
| epoch/출처/hash/무결성 | 같은 보고서 디렉터리; 작은 보고서 |
| 후처리 소스 | `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/postprocessing_r01.py`; Git 제외; SHA-256 `18b32ca2aa76793232ec4cadf28d52fec19be048de1c0f884202111435fa4197` |

예측 필드: example_id/index, y_true/y_pred, score_hate/score_offensive/score_none, is_correct, 원시 logits, native model_scores, score_semantics. example_id는 결정적인 validation split 행 번호입니다. 원문/제목은 넣지 않았습니다. ignore 정책은 바꾸지 않았으며 가중치, checkpoint, 학습 로그, 예측 산출물은 로컬에 남습니다.

## 검증 / 코드 변경

- N=1,255; score 형태 [1255,3]; NaN/Inf 없음; canonical label만 있음; 혼동/support 합계 1,255.
- 저장 가중치 hash 계산; 선정 checkpoint 재로드와 전체 최종 예측 성공.
- 작은 runner 수정: --run-id와 1회 실행 실패 표시; 정확한 epoch CE/진행 관측; 명시적 best 재로드; 행별 예측을 기존 Git 제외 results namespace로 이동; 평탄한 결정적 예측 필드 추가. 최적화 설정은 바꾸지 않았습니다.
- 학습 전 안전 테스트: 84 passed, 16 subtests passed, 17.73s. 단위 테스트의 실제 데이터셋 open 시도: 0.
- git status/diff/diff --check와 staged 경로는 final_review.json에서 따로 검토했습니다. 원시 데이터/TEST/가중치/checkpoint/token/비밀 staged 0. commit/push 0.

## 경계

- TEST NOT ACCESSED; PRIMARY ONLY; 3-CLASS ONLY.
- calibration 없음; threshold 조정 없음; 정책 선택 없음.
- 점수는 UNCALIBRATED이며 이 실행은 TEST 성능이 아닙니다.
- 두 번째 모델이나 FULL 학습 반복 없음. 운영/일반화/편향 적정성 결론 없음.
- 최종 실험 등록부, Model Manifest, 실제 모델 fixture, Model Card/Data Card, LOCK, FastAPI/infer 구현 없음.
- shared protocol/backend/frontend 변경 없음. 파일 SHA-256은 산출물 출처이며, 프로토콜 canonical/hash/Merkle 구현이나 모델 실행 증명이 아닙니다.
- 외부 앵커 없음; PENDING_ANCHOR 경계 유지.

다음 제안 단일 단계: Baseline 패키징 및 인계(AI-21 + AI-08 + AI-16), 주진호 승인 후에만.
