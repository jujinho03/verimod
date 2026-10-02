# AI-06 — Evaluation skeleton

상태: **W2 A-owner evidence, 2026-10-01.** 지표 구현과 선택 로직이며, synthetic fixture로만 확인했습니다. 모델은 없고, 예측도 하지 않았으며, threshold를 고르지 않았고, 실제 데이터로 계산한 것도 없습니다. Standard library만 사용하며 새 dependency는 없습니다.

코드: [`ai/src/verimod_ai/evaluation/`](../../ai/src/verimod_ai/evaluation/) (`metrics.py`, `policy_metrics.py`, `selection.py`, `bootstrap.py`). 테스트: `ai/tests/test_model_metrics.py`, `test_policy_metrics.py`, `test_selection.py`, `test_bootstrap.py`.

## 서로 분리된 세 계층

| 계층 | 값 | 사용처 |
|---|---|---|
| Native classifier class | `hate / offensive / none` (single-label, 3-class) | model metrics |
| Consumer에게 노출되는 유해 score key | `hate / offensive` (`scores_ppm`) | I1 출력 ([AI-02](w2-taxonomy-decision.md)) |
| Policy action | `ALLOW / HUMAN_REVIEW / RESTRICT` | policy metrics; 별도의 policy 계층이 생성 |

Evaluation 코드 안에서 이들 중 어느 것도 다른 것으로부터 유도하지 않습니다. `none`을 ALLOW로 취급하는 일은 없습니다.

## Model metrics (`metrics.py`)

- Confusion matrix `matrix[true][predicted]`와 class별 precision, recall, F1, support.
- Macro-F1은 support가 영인 class를 포함해 **선언된 모든 class**의 class별 F1 평균입니다.
- Single-label multiclass에서 Micro-F1은 accuracy와 같습니다.
- 영으로 나누기 규칙: 분모가 영이면 **0.0**을 반환하고 `*_defined = False`로 표시합니다. 결정적이며 warning이 없습니다.
- 입력 검증: 길이가 같아야 하고, 예시가 최소 하나 있어야 하며, class가 고유해야 하고, 선언된 class 밖의 label이 없어야 합니다.

## Policy metrics (`policy_metrics.py`)

입력: 주어진 `(native_label, action, eligible)` case. 모집단: eligible case만.

| 지표 | 정의 |
|---|---|
| FRR | clean(`none`) 중 RESTRICT / clean |
| RP | RESTRICT 중 harmful(`hate`, `offensive`) / RESTRICT |
| HAR | harmful 중 ALLOW / harmful |
| HRR_TOTAL | eligible 중 HUMAN_REVIEW / eligible |

- 분모가 영이면 0이 아니라 **`None`(undefined)**을 반환합니다.
- 지원하지 않는 label을 가진 eligible case는 거부되며 ineligible로 표시해야 합니다. 그래야 향후 지원하지 않는 차원을 가진 Secondary record를 명시적으로 제외할 수 있습니다.
- Label에서 action을 추론하지 않으며, 여기서 rule이나 threshold를 만들지 않습니다.
- **UNRESOLVED — exact HRR submetric denominator/attribution semantics.** `HRR_SCORE_BAND`와 `HRR_TRUNCATED`는 repository에 정의되어 있지 않으므로 `review_submetric()`은 `NotImplementedError`를 발생시킵니다. 공식을 추측하지 않습니다.

## Validation 전용 선택 (`selection.py`, D25 WORKING ASSUMPTION)

- **실행 가능(feasible):** `FRR <= X`이고 `HRR_TOTAL <= B`이며, FRR, HRR_TOTAL, HAR이 모두 정의되어 있어야 합니다.
- **목적 함수:** HAR 최소.
- **동점 처리:** RP가 높은 것 우선(정의되지 않은 RP는 마지막), 그다음 HRR_TOTAL이 낮은 것. `candidate_id` 오름차순은 결정성을 위한 최후 수단으로만 씁니다.
- **실행 가능한 후보가 없으면:** `None`을 반환합니다.
- `max_frr`(X)와 `max_hrr_total`(B)는 [0, 1] 범위의 필수 인자이며 **기본값이 없습니다**. 실제 값은 UNRESOLVED입니다.
- 후보는 `split == "validation"`이어야 하며, 다른 split은 거부합니다. 이 API로는 TEST 기반 선택이 불가능합니다.
- 실제 sweep은 실행하지 않았습니다. 테스트는 synthetic 경계값 0.10 / 0.20을 쓰며, 이는 제안값이 아닙니다.

## Bootstrap CI (`bootstrap.py`)

Repository에는 resample 횟수, seed, 구간 방식이 정해져 있지 않으므로 `n_resamples`, `seed`, `confidence_level`은 **필수이며 기본값이 없습니다**. 방식은 percentile 구간입니다.

- Resampling은 `random.Random(seed)`를 사용합니다.
- 구간은 정렬된 값의 `floor(α/2·k)`와 `ceil((1−α/2)·k)−1` 위치입니다.
- 정의되지 않은(`None`) resample 통계는 개수를 세고 건너뜁니다.
- 선택적 `groups`는 group 단위로 통째 resample합니다. validation이 제목 단위로 뭉쳐 있다는 [AI-20](w2-eda.md) 결과가 제안한 cluster bootstrap입니다.

재현성은 synthetic 값으로만 테스트했습니다. Dataset CI는 계산하지 않았습니다.

## Dependencies와 경계

- DEPENDENCY — downstream I1 consumer alignment required. Frontend/backend policy 구현은 import, 테스트, 수정하지 않았습니다. Node 발급과의 parity는 F-owner 구현을 기다립니다.
- Sealed TEST: 열거나 평가하지 않음. 학습: NO. Threshold: 선택하지 않음. Calibration: 주장하지 않음. Secondary: 채택하지 않음.
