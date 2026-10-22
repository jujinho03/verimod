# W5 DOC-08 / DOC-13 — GATE-5 근거와 8분 발표안

기준일: 2026-10-21 KST (10/22 갱신) · Owner: A / 주진호 · 상태: **PARTIAL**

**Decide. Prove. Appeal.** VeriMod는 AI 판정 기록을 영수증으로 묶고, 이용자가 공개 commitment와 대조해 기록의 무결성을 확인하도록 한다. AI 판정이 옳다는 주장은 별도의 모델·정책 평가가 뒷받침해야 한다.

이 문서는 발표 **준비안**이다. 실물 슬라이드 제작, 8분 리허설, W5 T/F 기능 검증, 최종 정책·GATE-5 승인을 완료했다는 뜻이 아니다. 읽기 기준 SHA는 `8d0580a7ef6a7e88c2314e6f5f30ff5f08f693ab`이며, 최종 변경 SHA는 본 파일을 포함한 커밋으로 확인한다.

10/22 A 후속 결과: [AI-11 결정표](threshold-rationale.md), [AI-13 오류 분석](w5-validation-error-analysis.md), [AI-12 합성 준비](w5-evaluation-preregistration.md), [102개 로컬 통합 검사와 Gate 결정 메모](../progress/W5.md)를 연결했다. 정책·LOCK·실제 TEST 승인 상태는 계속 BLOCKED다. 아래 표의 T/F 조건과 실제 리허설은 이 A 결과로 충족되지 않는다.

## 10/22 갱신 — 발표에서 구분할 증거 상태 7가지

| # | 상태 | 발표 표현 |
|---|---|---|
| 1 | **W4 완료**: 실제 R01 → Receipt 2건 → Epoch 1 Base Sepolia 등록 (2026-10-20) | 완료형으로 말한다. 날짜를 함께 표시 |
| 2 | **검증 완료**: W4 브라우저 VALID 2 + 부정 사례 5 = 7/7, 플랫폼 API 0회 | 완료형. 당일 라이브 재실행이 아니면 "기록된 실행"이라고 말한다 |
| 3 | **A W5**: Validation 25후보와 S1/S2/S3의 FRR·검토량 trade-off 연구 | "연구 결과"로 말한다. 운영 정책이 아니다 |
| 4 | **T W5**: Synthetic Lifecycle 연결·전이 구현 **보고** | SHA 확인 전에는 "구현 보고됨"으로만 말한다 |
| 5 | **F W5→W6 이월**: Timeline UI, Private Package, 서비스 통합 | "W6 진행 중/예정"으로 말한다. 완성된 화면처럼 보이게 하지 않는다 |
| 6 | **미승인**: S1 정책, Model/Policy LOCK, TEST | "추천안·승인 대기"로 말한다 |
| 7 | **POST-MVP**: 운영형 Appeal/Review 접수와 사람 검토 백엔드 | 로드맵으로만 말한다 |

본선 시점에 4~6번의 상태가 바뀌면 이 표를 실제 SHA·증거로 갱신한다. 갱신 전 상태로 발표하지 않는다.

## 주장과 증거

| 발표할 주장 | 확인 가능한 증거 | 함께 말할 한계 |
| --- | --- | --- |
| 실제 R01 모델→Receipt 2건→Epoch 1→Base Sepolia→F CONFIRMED→브라우저 검증을 실행했다 | [W4 공개 증거](../handoffs/w4-anchored-epoch-public/20261020-r01/README.md), [W4 현황](../progress/W4.md) | 2026-10-20 W4 성과. W5 새 E2E나 Web 전체 라이브 연결 성과가 아님 |
| 이용자는 플랫폼 API 없이 공개 RPC로 받은 영수증을 검증했다 | 공개 증거의 실제 Chromium 7/7, 플랫폼 API 호출 0회 | 서버가 처음부터 진실한 기록을 만들었는지, 전체 기록을 빠짐없이 공개했는지 증명하지 않음 |
| 모델 성능과 정책 오류는 별도로 평가한다 | [Validation 후보](../evidence/w4-a-validation-policy.md), [Validation 집계](../../ai/artifacts/reports/w4_a_validation/20261016/validation.json) | Validation 1,255건의 proxy 지표. TEST·운영 성능이 아님 |
| 정상 proxy의 오제재가 정책 검토의 핵심 위험이다 | 시험용 H50-75_O50-75의 FRR 91/547 = 16.64% | 운영 정책 미승인. `none`은 플랫폼의 정상 판정이나 ALLOW와 같지 않음 |
| 이의제기는 원판정을 덮어쓰지 않는 연결 기록 방향이다 | [결정 D06/D08·B안](../02-decision-register.md), [멘토링 추적](../mentoring/w5-mentoring-traceability.md) | Synthetic Lifecycle은 설명·검증용. 실제 Appeal/Review backend는 POST-MVP |

## AI 정책 의사결정에서 보여 줄 수치

모델은 BEEP! Korean HateSpeech의 native `hate / offensive / none`을 사용한 `klue/roberta-base` R01이다. 외부 score keys는 `hate / offensive`, 의미는 **UNCALIBRATED**다. Validation Macro-F1은 `0.6524599868976999`, offensive F1은 약 `0.5420`이다. 실제 Validation TRUNCATED 사례는 0건이므로 TRUNCATED 정책의 데이터 성능을 주장하지 않는다.

| 후보 | FRR: 정상 proxy 자동 제한 | RP: 제한 중 유해 proxy | HAR: 유해 proxy 자동 허용 | HRR_TOTAL: 전체 검토량 |
| --- | ---: | ---: | ---: | ---: |
| H50-75_O50-75 — W4 시연용 | 91/547 · 16.64% | 505/596 · 84.73% | 90/708 · 12.71% | 198/1255 · 15.78% |
| H50-90_O50-90 — **S1 연구·시연 추천(미승인)** | 32/547 · 5.85% | 220/252 · 87.30% | 90/708 · 12.71% | 542/1255 · 43.19% |
| H50-75_O50-90 — S2 대안 | 53/547 · 9.69% | 387/440 · 87.95% | 90/708 · 12.71% | 354/1255 · 28.21% |
| H75-90_O75-90 — 비교용 | 32/547 · 5.85% | 220/252 · 87.30% | 203/708 · 28.67% | 344/1255 · 27.41% |

S1은 A의 연구·시연 추천이며 승인·채택·LOCK이 아니다([S1/S2/S3 비교](w5-research-policy-scenarios.md)). 핵심 메시지: "검토 188건을 더 써서 정상글 오제재 21건을 줄이고, 유해글 통과는 늘리지 않는다." 25개 전체는 기존 후보 보고서와 AI-11 산출물을 기준으로 판단한다. 선정 순서는 **FRR≤X·HRR_TOTAL≤B → HAR 최소 → RP 최대 → HRR_TOTAL 최소**다. X/B는 팀 승인 전이다.

HUMAN_REVIEW는 자동 제한과 자동 허용 사이의 검토 구간을 제공한다. 위 Validation 구성과 같은 입력이 하루 1,000건 들어온다는 가정이면 검토량은 각각 약 **158·432·274건/일**이다(`HRR_TOTAL × 1,000`, 반올림). 이는 처리 시간·대기열·인건비·검토자 정확도를 측정한 운영 예측이 아니다. 실제 업무량은 입력 분포와 검토 소요시간을 확인해야 한다. 검토 수를 줄이면서 FRR과 HAR까지 모두 낮출 수 있다고 약속하지 않는다.

## 8분 발표 흐름 — 총 480초

| 구간 | 시간 | 화면·증거 | 발표 핵심 문장 |
| --- | ---: | --- | --- |
| 00:00–00:45 | 45초 | 문제와 Decide. Prove. Appeal. | “게시물이 제한됐을 때, 이용자는 그 판정 기록이 나중에 바뀌었는지 직접 확인할 수 있어야 합니다.” |
| 00:45–01:35 | 50초 | Decide→Receipt→Merkle→Anchor→Verify 흐름 | “AI의 점수와 정책 적용 결과를 영수증으로 연결합니다. 원문·salt를 체인에 올리지 않습니다.” |
| 01:35–02:40 | 65초 | Validation 성능·위 정책 비교표 | “모델 정확성과 정책 안전성을 분리해 봤습니다. W4 시연 정책의 정상 proxy 오제재는 16.64%였습니다. FRR 우선 원칙으로 다시 고르면 5.85%까지 낮출 수 있지만, 검토량이 43%로 늘어납니다. 이것은 연구·시연 정책이며 운영 인력으로 검증한 수치가 아닙니다.” |
| 02:40–03:40 | 60초 | W4 Epoch 1·tx·Receipt 2건의 공개 증거 | “2026-10-20 실제 모델 영수증 두 건을 테스트넷에 등록했습니다. 지금 보여 드리는 것은 그 고정 증거입니다.” |
| 03:40–05:10 | 90초 | 독립 검증 화면: 정상 bundle→VALID, 복사본 변조→HASH_MISMATCH | “플랫폼의 설명을 그대로 믿는 대신, 받은 영수증을 브라우저가 다시 계산합니다.” 라이브 리허설 미완이면 날짜 표시된 W4 실행 기록으로 설명 |
| 05:10–06:00 | 50초 | INVALID_PROOF·UNTRUSTED_ANCHOR·PENDING_ANCHOR와 RPC 상태 구분 | “RPC를 읽을 수 없는 것은 변조가 아닙니다. 원문·salt가 없으면 Content는 NOT_CHECKED입니다.” 실제 RPC 장애 시연은 신규 증거 확보 후에만 표시 |
| 06:00–06:50 | 50초 | Synthetic Lifecycle 설명 또는 검증된 화면 | “원판정을 보존하면서 이의제기와 검토 기록을 연결하는 방향입니다. 현재 시연은 Synthetic이며 운영 이의신청 백엔드는 POST-MVP입니다.” T 구현 SHA 확인과 F Timeline(W6) 완성 전에는 설계 설명으로 제시. **Fallback**: F 화면이 없으면 연결·전이 검증 결과(T)를 표로 보여 주고 "UI는 W6 통합 중"이라고 말한다 |
| 06:50–08:00 | 70초 | 신뢰 범위·GATE-5 남은 관문 | “검증 가능한 기록이 AI의 정답을 보증하지는 않습니다. Validation으로 정책을 정하고, 승인·LOCK 뒤 별도 승인된 최초 TEST로 평가하겠습니다.” |

시연자는 새 게시물 입력→신규 Receipt→즉시 Base VALID를 약속하지 않는다. W4 실제 모델 발급은 A/F E2E 경로이고, Web UI→실제 FastAPI→새 Anchor까지 연결한 라이브 시연 증거는 아직 없다. 신규 Epoch는 Freeze·송신·최소 12회 확인이 필요하다. 기존 Epoch 1로 검증하면 새 송신 없이 기록된 성과를 설명할 수 있다.

## 시연 준비와 실패 시 전환

- 정상·변조 시연은 검증된 공개 bundle과 **복사본**을 사용한다. W4 원본 Receipt·hash·Manifest·증거는 수정하지 않는다. 발표안 작성은 실제 브라우저 재실행이나 체인 접근 승인이 아니다.
- 공개 RPC를 사용할 수 없으면 화면의 실제 상태를 그대로 설명하고, 날짜·출처가 표시된 W4 실행 기록으로 전환한다. 이를 당일 라이브 PASS로 기록하지 않는다.
- Core `VALID`, Lifecycle `PASSED`, Content `NOT_CHECKED`는 서로 다른 결과다. Synthetic Local/Mock의 성공을 Base Sepolia VALID로 표시하지 않는다.
- 12 confirmations는 MVP의 L2 확인 기준이며 Ethereum L1 finality가 아니다. W4 F 확정 당시 339회는 고정 이력이고 현재 확인 횟수가 아니다.
- W4 증거에는 보조 Manifest 실패 표시와 실제 체인 모드의 PROTOTYPE 배너 한계가 남아 있다. F의 수정 SHA·검증 결과 확인 전에는 해결 완료라고 말하지 않는다.
- Private Receipt Package·권한·프라이버시 QA·실제 RPC 장애는 담당자의 새 증거를 받은 뒤 시연 범위에 넣는다. 원문·salt·개인정보·키·raw transaction·운영 경로를 공개하지 않는다.

## GATE-5 통제표

마감: **2026-10-25(일) 21:00 KST**. 아래는 본 문서 작성 시 확인 가능한 상태이며, A의 후속 W5 실행 기록과 담당자 증거를 연결한 뒤 갱신한다.

| Gate | Owner | 현재 판단 | 충족에 필요한 증거 |
| --- | --- | --- | --- |
| G5-01 | A | **BLOCKED** — X/B·정책·LOCK 미승인 | AI-11 비교·feasible/infeasible 판정 근거, 사용자 X/B·정책 승인, 별도 승인된 실제 LOCK SHA·시각 |
| G5-02 | A | **BLOCKED / TEST SEALED** | G5-01 이후 별도 최초 TEST 승인, 고정 스크립트 1회 결과·1,000회 bootstrap·seed 20260923·2.5/97.5 percentile·그룹 가정·latency |
| G5-03 | T/F | **PARTIAL** — W4 실증 존재, W5 보존·재사용 확인은 실행 기록 필요 | W4 공개 증거 불변 대조와 재사용 출처. 신규 Anchor 실적으로 중복 계산하지 않음 |
| G5-04 | T/F | **PARTIAL 예상** — T 완료 보고(원격 미반영), F UI W6 이월 | Synthetic Lifecycle 연결·전이 코드 SHA·테스트·실행 증거. Core와 Lifecycle 개별 판정 |
| G5-05 | F | **BLOCKED → W6 이월** (D-W5F-20261022-01) | Private Package·권한·멱등·프라이버시 회귀와 실제 실행 범위 |
| G5-06 | T/F | **PARTIAL 예상** — T RPC 검증과 F UX(W6 이월)를 분리 | RPC 장애가 HASH_MISMATCH가 아닌 RPC_UNAVAILABLE인지 실제 검증, 모드·Manifest 상태 표시 결과 |
| G5-07 | 전체 | **PARTIAL** — 문서 준비, 신규 통합 CI·원문 일부 미확인 | A 변경 테스트·SHA, T/F 증거, 새 main CI, DOC-09 추적. 기존 CI #235로 신규 변경 PASS 대체 금지 |

종합 GATE-5 예상은 **PARTIAL**이며, 최종 판정은 10/25 21:00에 증거로 확정한다([A 마감 감사](../progress/W5-A-closeout.md)). A의 로컬 분석·테스트가 완료돼도 G5-01/02의 승인 순서와 T/F 필수 증거가 자동 충족되지는 않는다. GATE-5 미통과 시 SHOULD=0·신규 기능=0, 미완 MUST 우선이며 범위 축소·이월은 팀장 승인 대상으로 남긴다.

## 최종 발표 전 확인할 관문

1. A는 AI-11 실제 실행 결과와 승인 여부, AI-13 분석에서 확인된 한계를 이 발표안과 대조한다. X/B·채택 정책이 아직 없으면 “정책 검토 중”을 유지한다.
2. DOC-09의 1·2회차 답변 원문 미확인 상태를 숨기지 않는다. [추적표](../mentoring/w5-mentoring-traceability.md)의 팀 요약을 멘토 직접 인용으로 바꾸지 않는다.
3. T/F의 코드 SHA·테스트·실행 결과를 검토해 시연 가능 범위를 확정한다. 미확인 항목은 설계·계획으로만 설명한다.
4. 실제 480초 리허설을 수행하고 화면별 출처·모드·소요시간을 기록한다. 이번 문서의 시간 배분은 **PLANNED**, 리허설 완료는 아직 아니다.
5. 팀장이 최종 정책·LOCK·최초 TEST·GATE-5를 각각 해당 증거와 승인 순서에 따라 결정한다. 일반 문서 승인이나 “다음 단계” 지시로 대신하지 않는다.

이번 문서 작업은 보호 운영자료·TEST 데이터·DB·키·체인에 접근하지 않으며 T/F 구현을 수정하지 않는다. W6 Model Card 최종본이나 실제 Appeal backend를 완료했다고 주장하지 않는다.
