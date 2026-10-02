# AI-02 — A-side supported taxonomy 결정 (W2)

상태: **A-side 결정 evidence, 2026-10-01 — PROPOSED FOR GATE-2.** 이 문서는 팀 semantic freeze(FRZ-01)가 아니며 frontend, backend, protocol schema를 바꾸지 않습니다. [W1 매핑 가능성 검토](ai-01-02-dataset-taxonomy.md#mapping-가능성-검토), [AI-04 Primary 결정](w2-primary-dataset-decision.md), [AI-20 EDA](w2-eda.md)를 따릅니다. D02(native label → 가능성 검토 → supported taxonomy; synthetic 5-label taxonomy 강제 금지; misinformation 제외)와 [I1 C01 초안](../04-interface-contract-draft.md)을 준수합니다.

코드: [`ai/src/verimod_ai/data/taxonomy.py`](../../ai/src/verimod_ai/data/taxonomy.py), [`label_mapping.py`](../../ai/src/verimod_ai/data/label_mapping.py). 테스트: [`ai/tests/test_taxonomy.py`](../../ai/tests/test_taxonomy.py).

## 결정

| 계층 | 결정 | 근거 |
|---|---|---|
| 1. Dataset native target | BEEP! hate 축 `hate / offensive / none`, **single-label 3-class** | Primary dataset에 있는 유일한 native supervision. EDA: train, validation, TEST 집계 모두 비율 24.3 / 32.1 / 43.6%; 비율 1.79 |
| 2. 모델 출력 score key | **`hate`, `offensive`** — supported 유해 class | 둘 다 직접적인 native supervision이 있으며 train 행 수는 1,423 / 1,882 |
| 3. Negative / reference class | **`none`** — 학습 class이며, score key가 **아니고**, ALLOW도 **아님** | Native negative는 "BEEP! guideline 기준으로 hate/offensive가 아님"을 뜻합니다. 다른 위험을 측정하지 않습니다 |
| 4. 지원하지 않는 차원 | `profanity`, `sexual`, `spam`, `violence`: native supervision 없음. `misinformation`: 범위 밖 (D02) | key 없음, 점수 없음, 가짜 0 없음 |
| 5. Policy 경계 | 점수만 산출. Action, `reason_codes`, `triggered_rule_ids`는 policy 계층에서 나옴 | model class ≠ action; dataset label ≠ reason_code |

`bias` 축과 `contain_gender_bias`는 supported class가 아니라 **평가 slice용 보조 metadata**로 남습니다. EDA에서 이들이 유해 label과 함께 나타나며, flag가 `bias=gender`와 중복임이 확인됐습니다. 이를 class로 만들면 합의된 moderation 의미가 없는 집단 속성 출력이 추가됩니다.

## Synthetic 5-label 세트를 쓰지 않는 이유

- **hate:** 이름은 유지하지만, 의미는 demo의 keyword scorer가 아니라 BEEP!의 hate 정의입니다.
- **offensive:** 새로 추가했으며, demo 세트에는 대응 항목이 없습니다.
- **profanity:** 지원하지 않습니다. `offensive` ≠ `profanity`입니다. offensive는 비꼬기, 무례함, 간접 공격을 포함하며, 욕설 단어만으로 profanity를 분리할 수 없습니다([AI-02 가능성 검토](ai-01-02-dataset-taxonomy.md#native-label-검토)).
- **sexual / spam / violence:** 지원하지 않습니다. 후보 dataset 세 개 중 어느 것도 이에 대한 native supervision이 없습니다.

이는 데이터에 근거해 결정한 D02의 "5 → fewer" fallback입니다: supported 유해 class 2개 + reference class 1개.

## 점수의 의미

- `scores_ppm` key = `{hate, offensive}`; 각각 정수 0..1,000,000 (D07). 0..1 모델 점수에서의 변환은 Python 경계에서 한 번만 수행합니다.
- Calibration evidence가 생기기 전까지 점수는 **UNCALIBRATED**입니다. "probability"라고 쓰지 말고 "model score 0.82" 또는 "scores_ppm 820000"으로 씁니다.
- Native task가 single-label이므로, 3-class head를 쓰면 두 유해 점수는 서로 배타적인 비율이 됩니다. Consumer는 합이 특정 값이라고 가정하면 안 되며, I1은 합 제약을 두지 않습니다. 학습 head 선택은 W3에서 합니다.
- `none`은 노출하지 않습니다. 유해 점수가 낮다는 것은 "안전함"이 아니라 "이 모델의 유해 class 기준 미만"이라는 뜻입니다.
- Evidence span: BEEP!에는 span annotation이 없습니다. 이후의 attribution은 방법론의 출력(D03 SHOULD)일 뿐, supervised evidence나 인과적 설명이 아닙니다.
- `TRUNCATED`: Primary 데이터에는 500 code point 초과 record가 0건이므로, truncation 경로는 synthetic fixture로 테스트해야 합니다.

## Taxonomy 식별자 — PROPOSED FOR GATE-2

| Field | 제안 값 | 비고 |
|---|---|---|
| `taxonomy_id` | `verimod-ko-beep-hate` | 팀 합의 후에만 demo `verimod-example-ko`를 대체 |
| `taxonomy_version` | `1` | key나 의미가 바뀌면 올림 |
| 필수 score key | `hate`, `offensive` | 정확한 key 검증 의미는 I1 consumer 합의에 따름 |

## Dependencies — A가 변경하지 않은 항목

- **DEPENDENCY — downstream I1 consumer alignment required.** `frontend/src/domain/types.ts`(`LABEL_IDS`, `ScoresPpm`), `schema.ts`, `policy.ts`, `manifests.ts`는 여전히 synthetic 5-label taxonomy `verimod-example-ko / 0`을 사용합니다. 이들의 정렬과 backend 발급은 FRZ-01에서 T/F 담당이 맡습니다.
- Policy parity fixture(W2 항목 E)는 consumer가 동의하면 2-key score map을 사용합니다.
- Threshold(X, B), calibration, TEST 방법론(Row-25)은 UNRESOLVED로 남습니다.

## 경계

FRZ-01 PASS: NO. Team GATE-2 PASS: NO. TEST 열람: NO. 학습: NO. T/F 코드 변경: NO.
