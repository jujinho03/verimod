# VeriMod Model Card — R01 (`AI07-BL-KLUE-RB-45126-R01`)

| 항목 | 값 |
|---|---|
| 문서 | AI-18 Model Card, 버전 1.0 |
| 작성 | A / 주진호 · 2026-10-27 KST |
| 기준 커밋 | `jujinho` `44842f78` (main `efce466d`) + 이 문서 |
| 상태 | **FINAL (W6 범위)**. 모델 성능은 VALIDATION 기준이다. **TEST SEALED, TEST 성능 없음.** 정책 수치는 미승인 연구·시연 proxy다 |
| 데이터 | [Data Card](data-card.md) |

이 문서는 모델 성능(§C)과 정책 위험(§D)을 분리해 보고한다. 금융권 모델 위험관리 문서 양식(식별·개발·검증·한계·운영 통제)에 맞춰 정리했지만, **R01은 금융 데이터로 학습·검증되지 않았다.**

## A. Model Identity

**표 A1. 식별 정보**

| 항목 | 값 | 근거 |
|---|---|---|
| run ID | `AI07-BL-KLUE-RB-45126-R01` | [Model Manifest](../ai/artifacts/manifests/AI07-BL-KLUE-RB-45126-R01.model_manifest.json) |
| base model | `klue/roberta-base`, revision `02f94ba5e3fcb7e2a58a390b8639b0fac974a8da` | Manifest |
| architecture | `RobertaForSequenceClassification`, 파라미터 110,620,419 | Manifest |
| tokenizer | `klue/roberta-base` 같은 revision, `use_fast=True`(BertTokenizerFast) | Manifest, [W3 사양](evidence/w3-a-baseline-spec.md) |
| 가중치 | `model.safetensors`, 442,505,820 bytes, SHA-256 `a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f` | Manifest, [AI-19 실측](evidence/w6-a-ai19-offline/physical-offline-result.json) |
| Model Manifest hash | `0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1` (Manifest 파일 LF SHA-256 `0163a8bc…6a2`) | W4 Receipt·Epoch 1이 참조하는 역사적 identity. 수정하지 않는다 |
| 출력 | native 3-class softmax → `scores_ppm {hate, offensive}`, `floor(score×1,000,000+0.5)`, **UNCALIBRATED** | Manifest |
| taxonomy | `verimod-ko-beep-hate` v1, reference class `none`(`reference_class_is_policy_allow=false`) | Manifest |

**표 A2. 런타임 무결성 결합 — 구현 상태**

| 대상 | 런타임 검사 | 상태 |
|---|---|---|
| 가중치 SHA-256 | 서비스 시작 시 `verify_artifacts`가 고정값과 대조, 불일치 시 기동 안 함 | **구현됨** ([service.py](../ai/src/verimod_ai/inference/service.py)) |
| `config.json` SHA-256 (LF) | 동일 | **구현됨** |
| Model Manifest 파일 SHA-256 (LF) | 동일 | **구현됨** |
| tokenizer revision | revision 고정 + `local_files_only=True` | **구현됨** |
| tokenizer 파일 bytes hash | 검사 없음. 캐시 손상·교체를 감지하지 못함 | **PROPOSED / NOT_IMPLEMENTED / CONDITIONAL** (W5 [binding 설계안](eval/w5-model-runtime-binding-design.md), 승인 시 A4) |
| 서비스 dependency lock | 런타임 결합 없음. Manifest의 lock hash `8b61fa68…`는 학습용 W3 lock | **PROPOSED / NOT_IMPLEMENTED / CONDITIONAL** (같은 설계안) |

이 Model Card는 현재 구현 상태를 기술할 뿐이다. Runtime Binding은 W5 설계안의 제안이며 구현되지 않았고, 승인 조건부다. AI-19에서 tokenizer 파일 4개의 SHA-256을 증거로 수집했지만 binding이나 LOCK이 아니다.

## B. Training & Reproducibility

**표 B1. 학습 설정 (W3 frozen spec)**

| 항목 | 값 |
|---|---|
| 목적함수 | single-label cross entropy, 3 class, class weighting 없음 |
| epoch / lr / weight decay / warmup | 3 / 2e-5 / 0.01 / 0.10, linear scheduler, AdamW(`adamw_torch`) |
| batch | train 4 × gradient accumulation 4 (명목 16), eval 8 |
| gradient clipping | max_grad_norm 1.0 |
| seed | 45126 (`random`, `numpy`, `torch_cpu`, `Trainer.seed`, `data_seed`, `PYTHONHASHSEED`) |
| 결정성 | `deterministic_algorithms=false`. **bitwise 재현을 주장하지 않는다** |
| 환경 | Windows x64, CPU, Python 3.12.14, torch 2.14.1+cpu, transformers 4.57.6. 2026-10-06 실행(UTC 16:43 종료) |
| 데이터 | TRAIN 5,857 학습, VALIDATION 1,255 평가. TEST 미사용 |
| 전처리 | `verimod-ko-text-v1`: 500 Unicode code point HEAD → tokenizer right truncation, special token 포함 **max_length 128**, longest padding |
| dependency lock | `ai/requirements-w3.lock.txt` SHA-256 `8b61fa68…dde` (Manifest) |
| 근거 | [W3 사양](evidence/w3-a-baseline-spec.md), [run_summary.json](../ai/artifacts/reports/w3_baseline_run/AI07-BL-KLUE-RB-45126-R01/run_summary.json) |

**표 B2. Checkpoint 선택 — epoch별 VALIDATION**

| Epoch | step | train loss | val loss | Macro-F1 | Accuracy |
|---:|---:|---:|---:|---:|---:|
| 1 | 367 | 0.8949 | 0.8028 | 0.5903 | 0.6247 |
| 2 | 734 | 0.6432 | **0.7850** | 0.6496 | **0.6645** |
| 3 (R01) | 1101 | 0.4486 | 0.8720 | **0.6525** | 0.6629 |

- 사전 등록 규칙(VALIDATION Macro-F1 최대, `load_best_model_at_end`)으로 Epoch 3을 선정했다. 근거: [epoch_log.json](../ai/artifacts/reports/w3_baseline_run/AI07-BL-KLUE-RB-45126-R01/epoch_log.json).
- Epoch 3은 Macro-F1에서 +0.0028 앞서지만 val loss는 0.087 나쁘다. 과신(over-confidence) 시작 가능성이 있다. 단일 seed·단일 split에서 이 차이를 통계적으로 결론 내리지 않는다. 사후에 Epoch 2로 바꾸지 않는다.
- **같은 VALIDATION을 checkpoint 선택과 성능 보고에 모두 썼다.** 보고 지표는 낙관적으로 치우쳤을 수 있다.

**Provenance 한계 (Manifest 기록):** R01은 dirty worktree에서 실행돼 실행 시점 source commit이 없다(`source_commit_at_execution=null`). 실행 source 12개 hash와 snapshot commit `f6b39d3b`를 보존했다. 실행 당시 `ai/pyproject.toml` hash는 기록되지 않았다. 상태 `PASS_WITH_DOCUMENTED_LIMITATION`.

## C. Native Model Evaluation (VALIDATION n = 1,255)

근거: [metrics.json](../ai/artifacts/reports/w3_baseline_run/AI07-BL-KLUE-RB-45126-R01/metrics.json) (W3). W4 AI-21과 W5 원행 재검증에서 차이 0건으로 재현됐다([오류 분석](eval/w5-validation-error-analysis.md)).

**표 C1. 전체 지표**

| 지표 | 값 | 분자/분모 |
|---|---|---|
| Macro-F1 | **0.6524599868976999** | class별 F1 평균 |
| Accuracy (= micro-F1) | **0.6629482071713148** | 832 / 1,255 |

**표 C2. 클래스별 지표**

| class | precision | recall | F1 | support | FP | FN |
|---|---|---|---|---:|---:|---:|
| hate | 0.7797 (177/227) | 0.5803 (177/305) | 0.6654 | 305 | 50 | 128 |
| offensive | 0.5244 (226/431) | 0.5608 (226/403) | **0.5419664268585132** | 403 | 205 | 177 |
| none | 0.7186 (429/597) | 0.7843 (429/547) | 0.7500 | 547 | 168 | 118 |

**표 C3. Confusion matrix (행 = 정답, 열 = 예측)**

| 정답 \ 예측 | hate | offensive | none |
|---|---:|---:|---:|
| hate | 177 | 100 | 28 |
| offensive | 37 | 226 | 140 |
| none | 13 | 105 | 429 |

**해석:**
- offensive가 가장 약하다. 정답 offensive의 140건이 none으로, 37건이 hate로 갔다. offensive 예측 431건 중 100건은 정답 hate, 105건은 정답 none이다. 유해 class 간 경계와 none 경계 양쪽에서 오류가 난다. 주석 일치도(hate 축 alpha 0.496)가 낮다는 사실과 일관되지만 인과는 검증하지 않았다.
- hate는 precision 0.78에 비해 recall 0.58로 놓치는 쪽이 크다(FN 128).
- 정상 proxy(none) 547건 중 118건(21.57%)이 hate/offensive로 분류됐다. 이는 **모델 분류 오류율**이며 정책 오제재율(FRR)과 다르다(§D).

## D. Policy Risk — 모델 성능과 별도

정책은 모델 밖(Node/Python 정책 계층)에서 점수와 threshold로 ALLOW / HUMAN_REVIEW / RESTRICT를 정한다. 아래 지표는 VALIDATION 1,255건(정상 proxy none 547, 유해 proxy hate+offensive 708)에서의 **proxy**다.

**표 D1. 정책 지표 정의**

| 지표 | 정의 | 운영상 의미 |
|---|---|---|
| FRR | none 중 RESTRICT / 547 | 정상 글 자동 제한(오제재) 비율 |
| HAR | 유해 중 ALLOW / 708 | 유해 글 자동 통과 비율 |
| RP | RESTRICT 중 유해 / 전체 RESTRICT | 자동 제한의 정밀도 |
| HRR_TOTAL | HUMAN_REVIEW / 1,255 | 사람 검토로 보낸 비율(업무량 proxy) |

선정 규칙: **FRR ≤ X AND HRR_TOTAL ≤ B → HAR 최소 → RP 최대 → HRR_TOTAL 최소**, 25개 기존 후보에서.

**표 D2. 연구·시연 시나리오 (W5, 미승인)**

| 시나리오 | X / B (가정) | 선정 후보 | FRR | HAR | RP | HRR_TOTAL |
|---|---|---|---|---|---|---|
| **S1 FRR 보호 우선 (A 추천)** | 3/50 / 9/20 | H50-90_O50-90 | 32/547 (5.85%) | 90/708 (12.71%) | 220/252 (87.30%) | 542/1255 (43.19%) |
| S2 균형형 (대안) | 1/10 / 3/10 | H50-75_O50-90 | 53/547 (9.69%) | 90/708 (12.71%) | 387/440 (87.95%) | 354/1255 (28.21%) |
| S3 검토량 제한 (비추천) | 1/10 / 1/5 | H50-75_O75-90 | 53/547 (9.69%) | 158/708 (22.32%) | 387/440 (87.95%) | 229/1255 (18.25%) |
| 참고: W4 시연 후보 | — | H50-75_O50-75 | 91/547 (16.64%) | 90/708 (12.71%) | 505/596 | 198/1255 (15.78%) |

근거: [S1/S2/S3 패키지](eval/w5-research-policy-scenarios.md), [scenarios.json](../ai/artifacts/reports/w5_research_scenarios/20261022T063640Z-841928ca/scenarios.json), [오류 분석](eval/w5-validation-error-analysis.md).

**해석:**
- S2→S1: 정상 오제재 21건을 줄이는 대가로 검토가 188건 늘어난다(오제재 1건당 검토 약 9건). HAR는 같다.
- S2→S3: 검토 125건을 줄이는 대가로 유해 글 68건이 자동 통과한다.
- S1의 FRR은 X 경계에 여유 0건으로 붙어 있다. 정상 오제재가 1건만 늘어도 6%를 넘으므로, 다른 데이터에서 FRR 6% 이하를 보장한다고 말할 수 없다.

**반드시 지켜야 할 해석 경계:**

| 경계 | 설명 |
|---|---|
| S1은 미승인 추천안 | `PENDING_APPROVAL`, `team_approved=false`. 연구·시연(RESEARCH_DEMO) 범위의 A 추천일 뿐 운영 정책이 아니다 |
| X/B는 용량 측정값이 아님 | 검토 인력·처리시간·트래픽을 근거로 정하지 않았다. "45%를 검토할 수 있다"는 뜻이 아니다 |
| native label ≠ 정책 위반 | BEEP! 주석은 플랫폼 정책 판정이 아니다. FRR 등은 이 proxy 위의 수치다 |
| none ≠ ALLOW | none 예측도 hate 점수가 threshold를 넘으면 RESTRICT될 수 있다(사례 VFP-02) |
| UNCALIBRATED ≠ 확률 | `hate 900000`은 "유해 확률 90%"가 아니다 |
| Macro-F1 ≠ 정책 안전성 | 같은 모델에서도 후보에 따라 FRR이 달라진다(S1 5.85%, W4 시연 후보 16.64%) |
| Validation proxy | 25개 후보를 같은 VALIDATION에서 비교·선정했으므로 선택 편향이 있다. 신뢰구간 없음 |
| 단일 seed·split | seed 45126, split 1개. 변동 범위 미추정(백로그 RB-01/02) |
| Epoch 2/3 | §B 표 B2. 정책 분석은 Epoch 3 점수에만 해당한다 |
| TEST SEALED | 어떤 수치도 TEST 성능이 아니다 |
| 도메인 외 | 연예 뉴스 댓글 외 성능 미검증 |
| HUMAN_REVIEW 효능 | 검토로 "보낸" 건수일 뿐, 검토자가 올바르게 판정했다는 근거가 없다 |

## E. AI-19 Evidence — 물리 오프라인 추론 (W6 신규 실측)

판정: **AI-19 PASS — VERIFIED PHYSICAL OFFLINE INFERENCE** (2026-10-27 15:44:24~15:44:59 KST, A 독립 감사). 근거: [AI-19 판정](evidence/w6-a-ai19-offline/ai19-final-assessment.md).

**표 E1. 실측 결과**

| 항목 | 결과 |
|---|---|
| 네트워크 격리 | `PHYSICAL_OFFLINE_VERIFIED` (외부 DNS·TCP 5건 실패, Internet 프로필 0, 물리 어댑터 Up 0, 기본 경로 0, 조회 성공). 서버 종료 후 재확인 동일 |
| 오프라인 설정 | `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1` |
| 무결성 | 가중치·config·Manifest hash 일치, lock 2종(18·32 패키지) 불일치 0, `pip check` 정상 |
| `/healthz` | 200, ready, 기동 20.5초 |
| `/infer` | 200, `hate 3401 / offensive 10902`, `FULL`, UNCALIBRATED. W4 AI-09(2026-10-14)와 같은 입력·같은 점수 |
| 출력 계약 | 10개 항목 + `validate_i1` 통과 |
| fail-closed | 공백 입력 → 400 `EMPTY_INPUT`, inference 객체 없음 |
| 지연 (참고) | 첫 호출 884ms, warm 74~80ms (이 PC, CPU, batch 1, 6건. 성능 주장 아님) |

**입력·출력 계약 (service.py 확인):** 입력은 `text`, `content_commitment`, `request_id`(1~128자). 출력은 `inference/1` 형식으로 `model_manifest_hash`, `taxonomy_id/version`, `scores_ppm`, `score_semantics=UNCALIBRATED`, `input_status`, `evidence=[]`, 호출자 commitment echo를 반환한다. 실패는 `EMPTY_INPUT`/`INVALID_INPUT` 400, `INFERENCE_UNAVAILABLE` 503, `INFERENCE_TIMEOUT` 504(기본 10초)이며 실패 시 inference 객체를 반환하지 않는다. 모델은 action을 만들지 않는다.

**AI-19가 보증하지 않는 것:** tokenizer 파일 무결성(§A2 미구현), 다른 PC에서의 동작, 정책 승인·LOCK·TEST, E6 전체(LOCAL·RECORDING Fallback 미실증).

## F. 사용 범위

**의도된 사용:** VeriMod 연구·시연에서 한국어 짧은 댓글의 hate/offensive 점수를 산출하고, 정책 계층이 그 점수로 조치를 정하는 흐름을 Receipt로 검증 가능하게 보여 주는 것.

**사용하면 안 되는 경우:** 실제 플랫폼의 자동 제재 단독 근거, 개인·집단 속성 판정, 점수를 확률로 표시, 다른 도메인·장문·다른 언어, 금융·신용·채용 등 법적 영향이 있는 결정.

## G. 남은 검증 (승인 의존)

| 항목 | 상태 | 조건 |
|---|---|---|
| X/B·후보 승인 (AI-11) | PENDING_APPROVAL | 팀장 승인란 기록 |
| Policy Manifest·parity·LOCK (A3, A5) | BLOCKED | AI-11 승인 + A/F 계약 합의 + F 로딩 구현 |
| TEST 1회 평가 (AI-12) | BLOCKED, TEST SEALED | LOCK 후 별도 TEST 승인 |
| tokenizer·lock runtime binding (A4) | PROPOSED / NOT_IMPLEMENTED / CONDITIONAL | 팀장 승인 시에만 구현 |
| calibration, seed 반복, group-aware CV | BACKLOG (RB-01~03) | 모델 identity가 바뀌므로 재승인 필요 |

## 측정 이력 구분

| 시점 | 내용 |
|---|---|
| W3 2026-10-06 | R01 학습, VALIDATION 지표 (원본) |
| W4 2026-10-14~16 | AI-09 실제 `/infer`, AI-21 VALIDATION 재현, 25후보 정책 비교 |
| W5 2026-10-21~22 | 원행 재검증(차이 0), 오제재 10건, S1/S2/S3 |
| **W6 2026-10-27** | **AI-19 물리 오프라인 추론 (유일한 신규 실측)** |
