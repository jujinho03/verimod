# W5 모델 학습·과대적합 점검

기준일: 2026-10-22. 이 점검은 저장소에 보관된 고정 설정과 W3 실제 실행의 공개 report를 대조한 것이다. 원시 데이터, TEST split, 모델 가중치, 재학습은 수행하지 않았다.

## 확인한 실행

| 항목 | 확인 결과 |
| --- | --- |
| 실행 | `AI07-BL-KLUE-RB-45126-R01`, 실제 full baseline 1회 |
| 데이터 | BEEP! Korean HateSpeech, revision `f8d05dce2b22007bb149e5139c0060c68ad8f94b` |
| 모델 | `klue/roberta-base`, revision `02f94ba5e3fcb7e2a58a390b8639b0fac974a8da`, 110,620,419 parameters |
| split | group-greedy-class-aware-v1, seed 45126, 70/15/15 설계 |
| 실제 학습 입력 | train 5,857건 (hate 1,423 / offensive 1,882 / none 2,552) |
| 실제 선택 평가 | validation 1,255건 (hate 305 / offensive 403 / none 547) |
| TEST | SEALED; resolve/stat/open/hash/inference/metric 모두 수행하지 않음 |

## 학습 설정

3 epoch, AdamW (`adamw_torch`), learning rate `2e-5`, weight decay `0.01`, warmup ratio `0.1`, linear scheduler, max gradient norm `1.0`으로 CPU에서 실행했다. train micro-batch는 4, gradient accumulation은 4여서 명목 effective batch는 16이다. eval batch는 8, max token length는 128이다. optimizer update는 epoch당 367회, 총 1,101회였고 train example은 총 17,571회(5,857 × 3)를 보았다. seed와 data seed는 모두 45126이다.

## Epoch별 검토

| Epoch | Train loss | Validation loss | Validation Macro-F1 | Accuracy |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0.894858 | 0.802847 | 0.590255 | 0.624701 |
| 2 | 0.643241 | **0.785001** | 0.649630 | **0.664542** |
| 3 | **0.448644** | 0.871984 | **0.652460** | 0.662948 |

현재 runner는 validation Macro-F1 최대화를 정식 선택 기준으로 하므로 epoch 3/checkpoint 1101을 선택했다. 이는 설정과 실행 report에 일치한다.

## 과대적합·robust-fit 판정

**과대적합 경고: 있음.** Epoch 2에서 3으로 갈 때 train loss는 0.194597 감소했지만 validation loss는 0.086983 증가했다. validation accuracy도 0.001594 감소했다. 반면 Macro-F1 상승은 0.002830뿐이다. 따라서 validation loss 관점에서는 epoch 2 이후 일반화 악화 신호가 보인다.

**robust fit 지점을 찾고 적용했다: 아니오.** 단일 seed, 단일 split, 단 3 epoch의 baseline만 있고 early stopping, multiple seeds, cross-validation, confidence interval, calibration, threshold selection, 또는 sealed TEST 1회 평가는 실행하지 않았다. Macro-F1만의 사전 선언된 선택 규칙으로 epoch 3을 선택했을 뿐, robust-fit 탐색·확정 근거는 아니다. 현 점수도 `UNCALIBRATED`다.

## 안전한 다음 실험안

모델 또는 운영 정책을 지금 바꾸지 않는다. 팀 승인을 받은 뒤에만 동일하게 고정된 split에서 최소 seed 3개와 후보 epoch 1~3을 비교하고, validation Macro-F1뿐 아니라 validation loss·클래스별 F1·분산을 함께 기록한다. 선택 규칙은 실행 전에 정하고, 선택 후 sealed TEST는 1회만 평가한다. 이 과정을 끝내기 전에는 epoch 2 또는 3이 robust-fit이라고 발표하거나 TEST 성능으로 부르면 안 된다.

## 근거 파일

- `ai/configs/w3_baseline.json`
- `ai/configs/w2_dataset.json`
- `ai/artifacts/reports/w3_baseline_run/AI07-BL-KLUE-RB-45126-R01/epoch_log.json`
- `ai/artifacts/reports/w3_baseline_run/AI07-BL-KLUE-RB-45126-R01/run_summary.json`
- `ai/artifacts/reports/w3_baseline_run/AI07-BL-KLUE-RB-45126-R01/metrics.json`
