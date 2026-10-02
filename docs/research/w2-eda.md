# AI-20 — BEEP! Primary EDA (TRAIN + VALIDATION)

상태: **W2 A-owner EDA evidence, 2026-10-01**. 집계 통계만 다룹니다. 모델 학습, inference, TEST 평가, 최종 threshold는 없습니다. Taxonomy 결론은 [AI-02 결정](w2-taxonomy-decision.md)에 있습니다.

## 재현성과 입력 범위

| 항목 | 값 |
|---|---|
| Dataset / revision | BEEP! Korean HateSpeech, `f8d05dce2b22007bb149e5139c0060c68ad8f94b` ([AI-04](w2-primary-dataset-decision.md)) |
| Split | seed `45126`, `group-greedy-class-aware-v1` ([AI-04/AI-15](w2-split-leakage.md)) |
| 읽은 입력 | 로컬 `train.jsonl`(5,857)과 `validation.jsonl`(1,255)만 사용. 통계를 내기 전에 건수와 class별 건수를 AI-04 evidence와 대조함 |
| Sealed TEST | **열지 않음**. AI-04의 seal 전 집계만 인용합니다. Script는 `test`로 시작하는 경로를 모두 거부합니다 |
| Script | [`ai/scripts/eda_w2.py`](../../ai/scripts/eda_w2.py), `w2-eda-v1`, Python standard library만 사용 |
| Python | 3.12.14 (기록된 실행); 3.10.21에서 재실행해도 그림과 통계가 동일 |
| 결정성 | sampling 없음; 두 번 실행하면 byte 단위로 같은 출력 |
| 출력 | [`summary.json`](../../ai/artifacts/reports/w2_eda/summary.json)과 [`ai/artifacts/reports/w2_eda/`](../../ai/artifacts/reports/w2_eda/)의 SVG 그림 여섯 개 |

길이는 저장된 댓글의 Unicode code point 수로 세며 정규화하지 않습니다. Percentile은 nearest-rank 방식을 씁니다. 어떤 출력에도 댓글이나 제목 텍스트는 나오지 않습니다. Script가 기록 전에 이를 확인하고, 테스트가 synthetic fixture로 다시 확인합니다.

명령(`ai/`에서 실행):

```sh
python scripts/eda_w2.py --splits-dir ../../verimod-local-data/w2/beep-splits --evidence ../../verimod-local-data/w2/beep-evidence.json
```

## A. 개요

| Split | 건수 | 수치 출처 |
|---|---:|---|
| train | 5,857 | 로컬 artifact |
| validation | 1,255 | 로컬 artifact |
| internal TEST | 1,255 | AI-04 seal 전 집계만 |

Native target: hate 축 `hate / offensive / none`, single-label. 보조 축: `bias`(`gender / others / none`)와 `contain_gender_bias`(True/False).

## B. Label 분포 — [fig1](../../ai/artifacts/reports/w2_eda/fig1_label_distribution.svg)

| Split | hate | offensive | none |
|---|---:|---:|---:|
| train | 1,423 (24.30%) | 1,882 (32.13%) | 2,552 (43.57%) |
| validation | 305 (24.30%) | 403 (32.11%) | 547 (43.59%) |
| TEST (seal 전 집계) | 305 | 403 | 547 |

## C. 길이 분포 — [fig2](../../ai/artifacts/reports/w2_eda/fig2_length_histogram.svg), [fig3](../../ai/artifacts/reports/w2_eda/fig3_length_percentiles.svg)

| Split | min | p50 | mean | p90 | p95 | p99 | max |
|---|---:|---:|---:|---:|---:|---:|---:|
| train | 4 | 31 | 38.79 | 81 | 97 | 120 | 135 |
| validation | 4 | 31 | 38.60 | 79 | 97 | 118 | 128 |

Label별 길이 중앙값(train / validation): hate 38 / 38, offensive 31 / 31, none 26 / 28.

## D. 500 code point 초과

| Split | 건수 | 비율 |
|---|---:|---:|
| train | 0 | 0.00% |
| validation | 0 | 0.00% |

500은 synthetic PoC에서 나온 현재 전처리 후보 경계이며, 최종 production 길이가 아닙니다.

## E. Bias 축 — [fig4](../../ai/artifacts/reports/w2_eda/fig4_bias_distribution.svg)

| Split | bias=gender | bias=others | bias=none | contain_gender_bias=True | False |
|---|---:|---:|---:|---:|---:|
| train | 887 (15.14%) | 1,102 (18.82%) | 3,868 (66.04%) | 887 (15.14%) | 4,970 (84.86%) |
| validation | 203 (16.18%) | 241 (19.20%) | 811 (64.62%) | 203 (16.18%) | 1,052 (83.82%) |

두 split 모두에서 `contain_gender_bias=True`는 `bias=gender`와 정확히 일치합니다(train 887/887, validation 203/203, 다른 조합 없음). Bias 축은 학습 target에 합치지 않습니다.

## F. Label × bias — [fig5](../../ai/artifacts/reports/w2_eda/fig5_label_bias_heatmap.svg)

건수와 각 native label 안에서의 비율입니다.

| train | gender | others | none |
|---|---:|---:|---:|
| hate | 561 (39.42%) | 454 (31.90%) | 408 (28.67%) |
| offensive | 272 (14.45%) | 549 (29.17%) | 1,061 (56.38%) |
| none | 54 (2.12%) | 99 (3.88%) | 2,399 (94.00%) |

| validation | gender | others | none |
|---|---:|---:|---:|
| hate | 134 (43.93%) | 91 (29.84%) | 80 (26.23%) |
| offensive | 51 (12.66%) | 123 (30.52%) | 229 (56.82%) |
| none | 18 (3.29%) | 27 (4.94%) | 502 (91.77%) |

이는 기술적인 동시 출현 집계입니다. 상관 강도나 인과관계를 입증하지 않습니다.

## G. 뉴스 제목 proxy group — [fig6](../../ai/artifacts/reports/w2_eda/fig6_title_group_sizes.svg)

| Split | 고유 제목 group | min | p50 | mean | p95 | max | 단일 원소 group |
|---|---:|---:|---:|---:|---:|---:|---:|
| train | 1,154 | 1 | 5 | 5.08 | 7 | 8 | 19 |
| validation | 162 | 2 | 8 | 7.75 | 10 | 12 | 0 |

두 artifact에서 다시 계산한 train ↔ validation 제목 proxy overlap: **0**. 제목은 group proxy이며 기사 ID나 작성자 ID가 아닙니다.

## H. 중복과 leakage (AI-15 요약, 재점검 아님)

[AI-15 evidence](w2-split-leakage.md) 기준: exact 및 normalized duplicate 초과분 0; label 충돌 격리 0; split 간 record, exact, normalized, 제목 group, near-cluster overlap 0. Near-duplicate 점검은 부분적입니다: 12+자 텍스트 대상 3-gram Jaccard ≥ 0.90, 일치 쌍 2개, 짧은 텍스트 857건 건너뜀. 여기서 TEST leakage를 다시 점검하지는 않았습니다.

## I. Class 불균형

Train 최대 / 최소 = none / hate = 2,552 / 1,423 = **1.793**.

## 시사점

각 항목은 관찰과 해석을 구분합니다. 해석은 W3 계획의 입력이며 결정이 아닙니다.

1. **길이 경계는 한 번도 작동하지 않습니다.**
   - 관찰: 최대 135 code point; 500 초과 record 0건.
   - 해석: Primary 데이터로는 `TRUNCATED` 경로를 검증할 수 없으므로 synthetic fixture로 테스트해야 합니다. 실제 모델 입력 한도는 code point에서 추론하지 말고 W3에서 tokenizer token 기준으로 정해야 합니다. 데이터가 짧은 연예 뉴스 댓글만 다루므로, 더 긴 콘텐츠에 대한 외적 타당성은 제한적입니다.
2. **불균형은 완만합니다.**
   - 관찰: 비율 1.79이며, train, validation, TEST 집계의 class 비율이 같습니다.
   - 해석: 공격적인 resampling은 필요해 보이지 않습니다. Macro-F1과 class별 지표를 함께 보고합니다. Class weighting은 선택 사항이며 validation에서만 판단해야 합니다.
3. **유해 label이 bias 축과 함께 나타납니다.**
   - 관찰: train `hate` 행의 71.3%가 `bias≠none`인 반면, `none` 행은 6.0%입니다.
   - 해석: 모델이 집단이나 성별 언급을 지름길(shortcut)로 학습할 수 있습니다. 평가 시 bias 값별로 오류를 나눠 봐야 합니다. 이는 확인해야 할 위험이지 인과적 발견이 아닙니다.
4. **Validation이 train보다 더 뭉쳐 있습니다.**
   - 관찰: validation은 제목 group 162개, 평균 크기 7.75이고, train은 group 1,154개, 평균 크기 5.08입니다. 크기 우선 group allocator의 결과입니다.
   - 해석: validation record는 서로 독립이 아닙니다. 유효 표본 크기가 1,255보다 작으므로, threshold 선정(D25)은 제목 group bootstrap 같은 group-aware 불확실성을 보고해야 합니다.
5. **Label별로 길이가 다릅니다.**
   - 관찰: train 중앙값은 38(hate), 31(offensive), 26(none)입니다.
   - 해석: 길이가 지름길 feature가 될 수 있습니다. 길이 구간별 오류 분석을 포함합니다.
6. **`hate`와 `offensive`는 인접한 native class입니다.**
   - 관찰: `offensive`가 가장 큰 유해 class(32.1%)입니다. [AI-01 조사](ai-01-02-dataset-taxonomy.md#annotation-신뢰도-release-관련-유의사항)는 논문의 hate 축 Krippendorff's alpha를 0.496으로 기록합니다.
   - 해석: `hate` ↔ `offensive` 혼동을 예상해야 합니다. 단일 점수보다 confusion matrix와 class별 F1이 더 중요합니다. 정책이 두 점수를 따로 쓸지 함께 쓸지는 policy 계층의 결정입니다.
7. **Bias flag 하나는 중복입니다.**
   - 관찰: `contain_gender_bias`는 `bias=gender`와 같습니다.
   - 해석: 하나의 보조 신호로 취급하고, slice에서 이중으로 세지 않습니다.

## 경계

TEST 열람: NO. TEST 평가: NO. 학습: NO. 출력에 원문 텍스트: NO. Secondary dataset: 채택하지 않음. FRZ-01 / Team GATE-2: 선언하지 않음.
