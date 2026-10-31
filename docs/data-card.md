# VeriMod Data Card — BEEP! Korean HateSpeech (R01 학습·검증 데이터)

> **대상:** 멘토·연구·개발 담당자 · **목적:** 데이터 출처, 분할, 사용 조건과 평가 한계를 확인합니다. [Model Card](model-card.md) · [멘토링 한눈에 보기](mentoring/mentor-brief-20261031.md)

| 항목 | 값 |
|---|---|
| 문서 | AI-17 Data Card, 버전 1.0 |
| 작성 | A / 주진호 · 2026-10-27 KST |
| 기준 커밋 | `jujinho` `44842f78` (main `efce466d`) + 이 문서 |
| 상태 | **FINAL (W6 범위)**. 모든 수치는 W2(2026-09-30~10-01)에 측정해 커밋된 기존 집계를 옮긴 것이다. **W6에서 새로 측정한 데이터 수치는 없다.** |
| TEST | **SEALED**. 이 문서 작성 중 TEST 파일·경로를 조회하지 않았다. TEST 수치는 W2 seal 전 집계만 인용한다 |

## 0. 용어

| 용어 | 뜻 |
|---|---|
| native label | BEEP! 주석자가 붙인 원래 라벨(`hate`/`offensive`/`none`). 플랫폼 정책 위반 판정이 아니다 |
| internal split | VeriMod가 공식 train+dev를 다시 나눈 TRAIN/VALIDATION/TEST. 공식 benchmark test와 다르다 |
| TEST (internal holdout) | VeriMod internal split의 TEST 1,255건. 봉인되어 있으며 LOCK과 별도 승인 후 1회만 평가한다 |
| title proxy group | 정규화한 뉴스 제목으로 묶은 group. 기사 ID·작성자 ID가 아니다 |
| atomic group | 같은 제목 proxy 또는 near-duplicate로 연결되어 한 split에 통째로 배정되는 단위 |
| exact / normalized duplicate | 원본 문자열 동일 / leakage key(NFC+공백 압축) 동일 |
| near duplicate | 정규화 댓글의 문자 3-gram 집합 Jaccard ≥ 0.90 (12자 이상 대상) |
| code point | Python `str` 길이 단위. UTF-16 단위나 byte가 아니다 |

## 1. 목적과 출처

- **목적:** VeriMod의 한국어 혐오·공격 표현 분류 모델 R01(`klue/roberta-base` fine-tuning)을 학습·검증하고, Validation에서 연구·시연 정책 후보를 비교하기 위한 데이터.
- **데이터셋:** BEEP! Korean HateSpeech. 공식 저장소 [`kocohub/korean-hate-speech`](https://github.com/kocohub/korean-hate-speech). 논문 Moon, Cho, Lee, SocialNLP 2020.
- **선정 근거:** [AI-04 Primary 결정](research/w2-primary-dataset-decision.md), 후보 비교는 [AI-01/02 조사](research/ai-01-02-dataset-taxonomy.md).

## 2. 데이터셋 소개

한국 연예 뉴스 기사에 달린 댓글에 대해 주석자가 hate 축과 bias 축을 각각 single-label로 붙인 데이터다. 뉴스 제목은 제공되지만 기사 본문은 없다.

**표 1. 공식 release 구성과 VeriMod 사용 범위**

| 구분 | 공식 건수 | VeriMod 사용 |
|---|---:|---|
| labeled train | 7,896 | 사용 |
| labeled dev | 471 | 사용 |
| hidden-label test | 974 | **사용 안 함** (정답 비공개, 공식 benchmark 평가 안 함) |
| unlabeled corpus | — | 사용 안 함 |
| VeriMod pool | **8,367** (= 7,896 + 471) | internal split 입력 |

근거: [AI-04](research/w2-primary-dataset-decision.md), [w2_dataset.json](../ai/configs/w2_dataset.json).

## 3. 라이선스와 사용 제한

- 라이선스: **CC BY-SA 4.0**. 고정 revision의 `LICENSE.md`를 SHA-256 `87a81696…2edb`로 확인했다(W2).
- 의무: 저작자 표시, 라이선스 링크, 변경 고지. 변형한 자료를 배포하면 ShareAlike가 적용된다.
- VeriMod 저장소는 원본 댓글·기사 제목을 재배포하지 않는다. 원본과 split 파일은 저장소 밖 로컬에만 둔다([ai/data/README.md](../ai/data/README.md)).
- 라이선스가 개인정보·퍼블리시티권 등 다른 권리를 해소하지는 않는다. 원문 공개 권한은 확인하지 않았으므로 발표·문서에 원문을 쓰지 않는다.

## 4. Revision과 annotation guideline

**표 2. 고정 원본 파일 (W2 확보 시 검증)**

| 경로 (revision `f8d05dce2b22007bb149e5139c0060c68ad8f94b`) | SHA-256 | 행 수 |
|---|---|---:|
| `labeled/train.tsv` | `ebebacdcd023af2c4acc8c0a37695fb6433ac04fc009feff8f222724e303a5a9` | 7,896 |
| `labeled/dev.tsv` | `232b615d6e359a9d31dfb8370f32e1733dc5bb3f9c5430d34d7fcc7ba4b7e8ef` | 471 |
| `news_title/train.news_title.txt` | `80fcb349633ddf38062c17363f18e62b3e533640c2a31ba50468963ff5db1492` | 7,896 |
| `news_title/dev.news_title.txt` | `5332b771458697677396a6bae8de0f590be9b4b8718592d6e1a92b6592b5d47f` | 471 |

필수 값 누락·형식 오류, 미인식 라벨, 빈 제목 줄, 행 수 불일치는 모두 0건이었다(W2).

- Annotation guideline: 공식 [annotation_guideline_en.md](https://github.com/kocohub/korean-hate-speech/blob/f8d05dce2b22007bb149e5139c0060c68ad8f94b/guideline/annotation_guideline_en.md)와 논문 Appendix A.
- 주석 절차(논문 §4, AI-01 조사 기록): 작업자 32명 중 댓글마다 3명 배정, 다수결. Krippendorff's alpha는 hate 축 **0.496**, bias 축 0.492.

## 5. 수집 도메인

- 한국어 **연예 뉴스 댓글**. 원천 기사 발행 범위 2018-01-01~2020-02-29(논문 §3). 개별 댓글의 수집일 범위는 **미확인**.
- 논문 §3은 downvote 기반 표집을 기술한다. 이는 유해 댓글이 실제 분포보다 많이 포함됐을 수 있다는 domain 편향 위험이다.
- 길이: TRAIN 최대 135 code point, 중앙값 31(표 6). 짧은 댓글 위주다.

## 6. Native taxonomy

**표 3. 라벨 체계와 VeriMod 해석**

| 계층 | 값 | VeriMod 해석 |
|---|---|---|
| native target (hate 축) | `hate` / `offensive` / `none`, single-label 3-class | 모델 학습 target |
| 노출 score key | `hate`, `offensive` | `scores_ppm` 키. UNCALIBRATED |
| reference class | `none` | 학습 class이지만 score key가 아니며 **ALLOW가 아니다**. "BEEP! 기준 hate/offensive가 아님"이라는 뜻일 뿐이다 |
| 보조 축 | `bias` (`gender`/`others`/`none`), `contain_gender_bias` | 학습 target에 넣지 않음. 평가 slice용 metadata. `contain_gender_bias=True`는 `bias=gender`와 정확히 같다(TRAIN 887/887, VALIDATION 203/203) |
| 지원하지 않음 | profanity, sexual, spam, violence, misinformation | native supervision이 없어 key·점수를 만들지 않는다 |

`taxonomy_id = verimod-ko-beep-hate`, `taxonomy_version = 1`. 근거: [AI-02 taxonomy 결정](research/w2-taxonomy-decision.md).

## 7. Internal split 결과

**표 4. TRAIN / VALIDATION / TEST (W2 seal 전 집계)**

| Split | 건수 | 비율 | hate | offensive | none | atomic group |
|---|---:|---:|---:|---:|---:|---:|
| TRAIN | 5,857 | 0.700012 | 1,423 | 1,882 | 2,552 | 1,154 |
| VALIDATION | 1,255 | 0.149994 | 305 | 403 | 547 | 162 |
| TEST (SEALED) | 1,255 | 0.149994 | 305 | 403 | 547 | 163 |
| 합계 | 8,367 | 1.0 | 2,033 | 2,688 | 3,646 | 1,479 |

TEST 행은 봉인 전 생성 스크립트가 남긴 집계다. TEST 성능이나 행 단위 확인이 아니다. 근거: [AI-04/AI-15 split·leakage](research/w2-split-leakage.md).

## 8. 분할 절차와 seed

- 알고리즘 `group-greedy-class-aware-v1`, seed **45126**, 목표 비율 0.70 / 0.15 / 0.15. Python 표준 라이브러리로 구현했다(외부 split 라이브러리 없음).
- Stable source ID는 `train` 다음 `dev` 순서의 1부터 시작하는 행 번호다.
- Group은 크기 내림차순으로 정렬한다. 각 group은 class 분포 제곱오차 증가분이 가장 작은 split에 통째로 들어가고, 동점이면 전체 크기 제곱오차, 그다음 seed 기반 SHA-256 tie key로 결정한다.
- Group 원자성과 leakage 차단이 정확한 비율보다 우선한다. seed는 여러 값을 시도해 고른 것이 아니다.
- TEST는 overlap assertion을 모두 통과한 뒤에만 기록됐고, 생성 시 1회 raw byte로 seal hash를 계산했다. Raw-file SHA-256 `ba9b87bde42e5eba8b3c5ca5f2423553a2f913400fd202d30b9e4bd00eb8138e`, seal 시각 2026-09-30 23:18:41 KST. hash는 변경을 탐지할 뿐 아무도 읽지 않았음을 증명하지 않는다.
- 코드: [prepare_w2_dataset.py](../ai/scripts/prepare_w2_dataset.py) (`w2-dataset-prep-v1`), 설정 [w2_dataset.json](../ai/configs/w2_dataset.json).

## 9. 전처리와 truncation

**표 5. 모델 입력까지의 처리 단계**

| 단계 | 규칙 | 관측 (TRAIN / VALIDATION) |
|---|---|---|
| 전처리 `verimod-ko-text-v1` | 500 Unicode code point 초과 시 앞 500개 유지(HEAD). 그 외 변환 없음(소문자화·정규화·이모지 제거·맞춤법 교정 모두 안 함) | 500 초과 0 / 0건 → 전부 `FULL` |
| tokenizer | `klue/roberta-base` revision `02f94ba5…`, special token 포함 max_length **128**, right truncation, 배치 내 longest padding | 최대 token 길이 81 / 82, 128 초과 0 / 0건 |
| leakage key `w2-leakage-nfc-whitespace-v1` | NFC, 줄바꿈 LF화, 연속 공백 1칸, 양끝 공백 제거 | **중복 비교 전용.** 모델 입력에 쓰지 않는다 |

`TRUNCATED` 경로는 실제 데이터에서 한 번도 발생하지 않아 synthetic 테스트로만 검증했다. 근거: [AI-05 전처리](research/w2-preprocessing.md), [W3 baseline 사양](evidence/w3-a-baseline-spec.md).

## 10~13. 중복·leakage 검사 (W2 AI-15)

**표 6. split 전 중복 검사**

| 검사 | 결과 |
|---|---:|
| exact duplicate 초과분 | 0 |
| normalized duplicate 초과분 | 0 |
| 제거한 동일 라벨 중복 | 0 |
| 격리한 라벨 충돌 | 0 |

**표 7. near duplicate 검사**

| 항목 | 값 |
|---|---|
| 방법 | 정규화 댓글 문자 3-gram Jaccard, threshold ≥ 0.90 (W2 heuristic) |
| 대상 | 12자 이상. **짧은 텍스트 857건은 검사하지 않음** |
| posting 방문 | 4,909,653회 (상한 15,000,000 이내) |
| 일치 쌍 | 2쌍 → 같은 atomic group으로 묶음, 삭제 없음 |
| 한계 | 부분 검사다. 짧은 유사 댓글을 모두 찾았다고 주장하지 않는다 |

**표 8. title-group leakage 검사**

| 항목 | 값 |
|---|---|
| 고유 title proxy | 1,480개 (그중 1,460개가 2회 이상 등장) |
| near-duplicate 연결 후 atomic group | 1,479개, 크기 중앙값 6 / p95 9 / 최대 13 |
| split 간 overlap | stable record 0, exact 0, normalized 0, title proxy 0, atomic group 0 |
| TRAIN ↔ VALIDATION 재계산 (W2 EDA) | title overlap 0 |
| 한계 | 서로 다른 제목이 같은 기사를 가리킬 수 있다. **작성자·기사 ID가 없어 작성자 leakage는 배제할 수 없다.** 이 metadata는 원천에 없으며 만들지 않았다 |

근거: [split·leakage](research/w2-split-leakage.md), [summary.json](../ai/artifacts/reports/w2_eda/summary.json) `ai15_leakage`.

## 14. 클래스 불균형

**표 9. TRAIN·VALIDATION 라벨 분포 (W2 EDA)**

| Split | hate | offensive | none |
|---|---:|---:|---:|
| TRAIN | 1,423 (24.30%) | 1,882 (32.13%) | 2,552 (43.57%) |
| VALIDATION | 305 (24.30%) | 403 (32.11%) | 547 (43.59%) |

TRAIN 최대/최소 = none/hate = 2,552/1,423 = **1.793**. 완만한 불균형이며 학습에 class weighting을 쓰지 않았다. 성능 보고는 Macro-F1과 class별 지표를 함께 쓴다.

**표 10. 길이 분포 (code point, nearest-rank)**

| Split | min | p50 | mean | p90 | p95 | p99 | max |
|---|---:|---:|---:|---:|---:|---:|---:|
| TRAIN | 4 | 31 | 38.79 | 81 | 97 | 120 | 135 |
| VALIDATION | 4 | 31 | 38.60 | 79 | 97 | 118 | 128 |

라벨별 길이 중앙값(TRAIN / VALIDATION): hate 38 / 38, offensive 31 / 31, none 26 / 28. 근거: [AI-20 EDA](research/w2-eda.md).

## 15. 대표성·편향·주석 한계

**표 11. 라벨 × bias 동시 출현 (TRAIN, 라벨 내 비율)**

| native label | bias=gender | bias=others | bias=none |
|---|---:|---:|---:|
| hate | 561 (39.42%) | 454 (31.90%) | 408 (28.67%) |
| offensive | 272 (14.45%) | 549 (29.17%) | 1,061 (56.38%) |
| none | 54 (2.12%) | 99 (3.88%) | 2,399 (94.00%) |

- **집단 언급 지름길 위험:** TRAIN hate의 71.3%가 bias≠none이지만 none은 6.0%다. 모델이 집단·성별 언급 자체를 유해 단서로 배울 수 있다. 동시 출현 집계이며 인과 근거가 아니다.
- **길이 지름길 위험:** 라벨별 길이 중앙값이 다르다(표 10).
- **주석 일치도:** hate 축 alpha 0.496은 중간 수준이다. `hate`↔`offensive`와 `offensive`↔`none` 경계가 모호하다는 것과 일관된다(Model Card의 offensive F1 0.542 참조).
- **표본 독립성:** VALIDATION은 162개 group, 평균 7.75건으로 뭉쳐 있다(TRAIN 평균 5.08). 유효 표본 크기는 1,255보다 작다.
- **하위집단:** 작성자·피해자 demographic metadata가 없어 집단별 성능·공정성은 평가할 수 없다.

## 16. 도메인 외 일반화 한계

- 연예 뉴스 댓글, 2018~2020년 기사, 최대 135자. 정치·커뮤니티·메신저·장문 게시물, 신조어, 다른 시기에는 성능을 검증하지 않았다.
- 실제 Validation에 `TRUNCATED` 입력이 0건이므로 긴 입력의 분류 품질은 알 수 없다.
- 금융 서비스 등 다른 산업 도메인 데이터로 학습하거나 검증하지 않았다.

## 17. Provenance와 재현성

**표 12. 재현에 필요한 고정 요소**

| 요소 | 값 / 위치 |
|---|---|
| 원천 revision | `f8d05dce2b22007bb149e5139c0060c68ad8f94b` + 표 2 SHA-256 |
| split | seed 45126, `group-greedy-class-aware-v1`, ratios 0.70/0.15/0.15 |
| 정규화 | `w2-leakage-nfc-whitespace-v1` (leakage), `verimod-ko-text-v1` (모델 입력) |
| near-duplicate 설정 | min 12자, Jaccard 0.90, 방문 상한 15,000,000 |
| TEST seal | SHA-256 `ba9b87bd…138e`, 2026-09-30 23:18:41 KST |
| VALIDATION split 바이트 SHA-256 (W5 재검증) | `a92f81ed8eadb9fdb1950be542f9edac4fe778f3e7bd2d630cd1494ef031a26a` ([오류 분석](eval/w5-validation-error-analysis.md)) |
| EDA 산출물 | [summary.json](../ai/artifacts/reports/w2_eda/summary.json), `w2-eda-v1`, Python 3.12.14 (3.10.21 재실행 동일) |
| 저장 위치 | 원본·split은 저장소 밖 로컬(`verimod-local-data/`). 저장소에는 집계와 hash만 있다 |

다른 PC에서의 split 재생성은 이번 W6 작업에서 수행하지 않았다.

## 18. 지원 범위와 금지 사용

**지원:**
- R01 모델의 학습(TRAIN)과 checkpoint 선택·지표 보고(VALIDATION)
- VALIDATION 기반 연구·시연 정책 후보 비교(proxy 지표)
- LOCK과 별도 승인 이후 TEST 1회 평가(현재 미실행)

**금지:**
- native label을 플랫폼 정책 위반 판정이나 ALLOW/RESTRICT 결정으로 그대로 쓰는 것
- 개인·집단 속성 추론, bias 축을 집단 분류 출력으로 쓰는 것
- 원문·제목 재배포, 비식별 사례를 원문과 연결하는 것
- 봉인된 TEST를 모델·정책 선택이나 튜닝에 쓰는 것
- 이 데이터 결과를 다른 도메인·플랫폼·언어의 성능으로 일반화하는 것

## 측정 이력 구분

| 시점 | 내용 | 이 문서에서의 지위 |
|---|---|---|
| W2 2026-09-30 | 확보, 중복·leakage, split, TEST seal | 원본 측정 (재측정 안 함) |
| W2 2026-10-01 | EDA, 전처리 v1, taxonomy | 원본 측정 (재측정 안 함) |
| W3 | tokenizer 길이 분포, max_length 128 결정 | 원본 측정 (재측정 안 함) |
| W5 2026-10-21 | VALIDATION predictions·split hash 대조 | 원본 측정 (재측정 안 함) |
| W6 2026-10-27 | 이 문서 작성 | **새 데이터 측정 없음** |
