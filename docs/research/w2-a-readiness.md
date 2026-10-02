# W2 A-side Gate-2 Readiness

상태: **A-owner readiness/evidence packet, 2026-10-01.** 감사 기준: main `edbf446d834aa75078493337b617a379c1757509` (PR #20 merge).

이 문서는 Team Gate-2 PASS가 **아니며** FRZ-01 freeze도 **아닙니다**. A가 팀에 넘길 수 있는 것을 나열하고, 남은 dependency를 모두 명시합니다. 다른 담당의 W2 상태는 여기서 평가하지 않습니다.

감사는 repository evidence만 사용했습니다. Sealed internal TEST artifact는 열거나, 다시 hash를 계산하거나, 다시 세지 않았습니다. 건수와 SHA-256은 [AI-04/AI-15 evidence](w2-split-leakage.md)에서 인용했습니다.

## Ticket 감사

| Ticket | A-owner 상태 | Evidence |
|---|---|---|
| AI-04 | **COMPLETE** | [Primary 결정](w2-primary-dataset-decision.md), [split과 seal](w2-split-leakage.md), [`ai/configs/w2_dataset.json`](../../ai/configs/w2_dataset.json), [`ai/scripts/prepare_w2_dataset.py`](../../ai/scripts/prepare_w2_dataset.py) |
| AI-15 | **PARTIAL** — PRIMARY INTERNAL LEAKAGE COMPLETE; **BLOCKED — Secondary dataset not yet adopted**; Primary↔Secondary overlap NOT DONE | [split과 leakage](w2-split-leakage.md) |
| AI-20 | **COMPLETE** | [EDA](w2-eda.md), [`ai/scripts/eda_w2.py`](../../ai/scripts/eda_w2.py), [`ai/artifacts/reports/w2_eda/`](../../ai/artifacts/reports/w2_eda/) (6 SVG + `summary.json`) |
| AI-02 | **COMPLETE** — A-side 결정, PROPOSED FOR GATE-2 | [taxonomy 결정](w2-taxonomy-decision.md), [`taxonomy.py`](../../ai/src/verimod_ai/data/taxonomy.py), [`label_mapping.py`](../../ai/src/verimod_ai/data/label_mapping.py) |
| AI-05 | **COMPLETE** | [preprocessing v1](w2-preprocessing.md), [`preprocessing.py`](../../ai/src/verimod_ai/data/preprocessing.py) |
| AI-06 | **COMPLETE** — skeleton만 | [evaluation skeleton](w2-evaluation-skeleton.md), [`ai/src/verimod_ai/evaluation/`](../../ai/src/verimod_ai/evaluation/) |

감사한 값:

- **AI-04:**
  - BEEP! Korean HateSpeech, `f8d05dce2b22007bb149e5139c0060c68ad8f94b`, CC BY-SA 4.0
  - Pool = 공개 labeled train + dev (8,367); 공식 hidden-label TEST는 사용하지 않음
  - Internal split train 5,857 / validation 1,255 / TEST 1,255, seed `45126`, `group-greedy-class-aware-v1`
  - TEST는 SHA-256 `ba9b87bde42e5eba8b3c5ca5f2423553a2f913400fd202d30b9e4bd00eb8138e`로 sealed
  - 원본 데이터는 Git 밖에 보관
- **AI-15:**
  - Exact 및 normalized duplicate 초과분 0; label 충돌 격리 규칙 존재(영향받은 행 0)
  - 제목 proxy group 원자성; split 간 record, exact, normalized, 제목, near-cluster overlap 0
  - Near duplicate: 3-gram Jaccard ≥ 0.90 heuristic, 부분 점검 — 짧은 텍스트 857건 건너뜀

## Readiness matrix

| # | 항목 | A-owner 상태 | Evidence | 남은 dependency | Gate 관점 의미 |
|---:|---|---|---|---|---|
| 1 | Primary dataset | COMPLETE | [AI-04](w2-primary-dataset-decision.md) | — | 발표 가능 |
| 2 | Dataset revision / 라이선스 | COMPLETE | 고정 SHA, CC BY-SA 4.0, 파일 SHA-256 표 | 재배포 시 저작자 표시 / ShareAlike 의무 적용 | 발표 가능; 라이선스 의무는 계속 유지 |
| 3 | Deterministic split | COMPLETE | [split](w2-split-leakage.md), `w2_dataset.json` | — | 발표 가능 |
| 4 | TEST seal | COMPLETE | 건수 1,255 + SHA-256 기록 | TEST 방법론(Row-25) UNRESOLVED | W5까지 sealed; 사용 규칙은 팀 결정 필요 |
| 5 | Leakage — Primary 내부 | COMPLETE | [AI-15](w2-split-leakage.md) | Near-duplicate 점검은 부분적(짧은 텍스트) | 한계를 명시한 상태로 준비됨 |
| 6 | Leakage — Primary↔Secondary | BLOCKED | — | Secondary dataset 미채택 | Primary 학습은 막지 않음(D28 WA); 외부 평가 leakage 주장은 막음 |
| 7 | EDA | COMPLETE | [AI-20](w2-eda.md) | — | 발표 가능 |
| 8 | Supported taxonomy | PROPOSED FOR GATE-2 | [AI-02](w2-taxonomy-decision.md) | DEPENDENCY — downstream I1 consumer alignment required | GATE-2에서 팀 결정 |
| 9 | Taxonomy ID / version | PROPOSED FOR GATE-2 | `verimod-ko-beep-hate` / `1` | 8과 동일 | GATE-2에서 팀 결정 |
| 10 | Preprocessing 버전 | COMPLETE | `verimod-ko-text-v1` ([AI-05](w2-preprocessing.md)) | Tokenizer 한도는 W3 | Freeze 후보 |
| 11 | FULL / TRUNCATED 의미 | COMPLETE (synthetic test로 검증) | [AI-05](w2-preprocessing.md) | `TRUNCATED`의 policy 처리는 policy 계층 rule | Freeze 후보 |
| 12 | Model metrics | COMPLETE (구현) | [AI-06](w2-evaluation-skeleton.md) | 아직 모델 없음 | Freeze 후보 (지표 세트) |
| 13 | Policy metrics | COMPLETE (구현) | [AI-06](w2-evaluation-skeleton.md) | Action은 policy 계층에서 나옴 | Freeze 후보 (지표 세트) |
| 14 | Threshold 선택 규칙 | READY (D25 WORKING ASSUMPTION, 구현됨) | `selection.py` | 팀의 D25 채택 | Freeze 후보 (규칙만) |
| 15 | 실제 X / B | UNRESOLVED | — | 팀 결정 | 지금은 freeze 불가 |
| 16 | Bootstrap 구현 | COMPLETE (유틸리티만) | `bootstrap.py` | Resample 횟수, seed, 신뢰수준 미결정 | 유틸리티 준비됨; 설정은 freeze 안 됨 |
| 17 | HRR 하위 지표 의미 | UNRESOLVED | `review_submetric()` placeholder | 분모 / attribution 정의 | 지금은 freeze 불가 |
| 18 | I1 downstream consumer 정렬 | BLOCKED | [AI-02 dependencies](w2-taxonomy-decision.md#dependencies--a가-변경하지-않은-항목) | BLOCKED — T owner 산출물 필요; BLOCKED — F owner 산출물 필요 | A evidence만으로 GATE-2 / FRZ-01을 닫을 수 없음 |
| 19 | 모델 학습 | W3 | — | 모델과 tokenizer 선택 | W2 항목 아님 |
| 20 | TEST 평가 | W5 | — | Row-25 방법론; 학습된 모델 | W2 항목 아님 |

## A-side semantic freeze 후보

**NOT FROZEN BY A ALONE.** A가 FRZ-01을 위해 팀에 제출하는 항목입니다. Freeze하려면 팀 합의가 필요합니다.

| 후보 | 제안 값 |
|---|---|
| Primary dataset | BEEP! Korean HateSpeech, 고정 revision `f8d05dce2b22007bb149e5139c0060c68ad8f94b` |
| Native target | `hate / offensive / none`, single-label 3-class |
| Supported 유해 score key | `hate`, `offensive` |
| Reference class | `none` (score key 아님, ALLOW 아님) |
| Taxonomy ID / version | `verimod-ko-beep-hate` / `1` |
| Preprocessing | `verimod-ko-text-v1` |
| 입력 상태 | `FULL` / `TRUNCATED` |
| W2 code point 경계 | 500 (앞부분 truncation; tokenizer 한도 아님) |
| Model 지표 세트 | Macro-F1, Micro-F1, class별 precision / recall / F1 / support, confusion matrix |
| Policy 지표 세트 | FRR, RP, HAR, HRR_TOTAL |
| 선택 목적 함수 | `FRR <= X AND HRR_TOTAL <= B`, 그다음 HAR 최소; 동점 → RP 높은 것, 그다음 HRR_TOTAL 낮은 것; validation만 사용 |

**Freeze 후보가 아닌 것:** X, B, 실제 threshold, calibration, 최종 학습 모델, HRR_SCORE_BAND 정확한 의미, HRR_TRUNCATED 정확한 의미, Secondary dataset.

후보와 함께 전달하는 의미: model class ≠ policy action; dataset label ≠ reason_code; uncalibrated score는 확률이 아님.

## Downstream dependencies (A 범위 밖)

- **DEPENDENCY — downstream I1 consumer alignment required.** 현재 I1 consumer(`frontend/src/domain`의 type, schema, policy, manifest)는 synthetic 5-label taxonomy `verimod-example-ko / 0`을 사용합니다. A-side taxonomy로 옮기는 것은 A가 바꿀 사항이 아닙니다.
  - BLOCKED — T owner 산출물 필요 (I1 freeze의 protocol/schema 측)
  - BLOCKED — F owner 산출물 필요 (발급/consumer 구현)
- **Node 발급과의 policy parity:** BLOCKED — F owner 산출물 필요.
- **Content commitment:** AI 전처리 밖에서 처리합니다. A는 commitment나 hashing을 정의하지 않습니다.

이는 dependency의 존재만 기록하며, T/F 구현을 평가하지 않습니다.

## W3 준비 상태 (A 관점; W3 미착수)

| 진입 조건 | 상태 |
|---|---|
| Primary 고정 | YES |
| TRAIN / VALIDATION 사용 가능 | YES (Git 밖의 로컬 artifact) |
| TEST sealed | YES |
| Taxonomy 제안 | YES (PROPOSED FOR GATE-2) |
| Preprocessing v1 | YES |
| Evaluation skeleton | YES |
| 모델 아키텍처 | NOT YET EXECUTED — W3 (D01 방향: Korean encoder fine-tuning) |
| Tokenizer 최대 token 길이 | W3 |
| 학습 | NOT STARTED |
| Secondary overlap | BLOCKED. 단, Secondary는 기본적으로 Primary 학습에 포함되지 않음 (D28 WORKING ASSUMPTION) |
| 학습 runtime / accelerator 환경 | W3 |

## 경계

Secondary 채택: NO. Sealed TEST 열람: NO. 학습: NO. 실제 threshold: NO. Calibration: NO. T/F 수정: NO. FRZ-01 PASS: NO. Team GATE-2 PASS: NO. Team W2 COMPLETE: NO.
