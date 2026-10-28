# W6 A Closeout — Evidence Index (주진호)

작성: A / 주진호 · 2026-10-27 KST · 기준 `jujinho` `44842f78` (main `efce466d`, CI #267 SUCCESS) · 모든 신규 파일 **미커밋**

이 폴더는 A의 W6 결과와 남은 승인 의존성을 정리한다. 함께 보는 파일:
- [3인 통합 감사](w6-three-owner-integration.md) — A/T/F 결과, 원격·로컬 증거 구분, RPC 원인 분석
- [E1~E8 Evidence Matrix](e1-e8-matrix.md) — Gate별 12항목, PRELIMINARY 판정
- [최종 Blocker](w6-final-blockers.md) — 중요도·해결 경로, Option A/B(Scope Cut) 비교
- [T/F 최종 실행 요청](tf-final-execution-requests.md) — 팀장 전달용 메시지
- [W7 5-Beat 준비도](w7-demo-readiness.md) — Beat별 라벨, 3단 Fallback, 시간 예산
- [GitHub 통합 계획](github-integration-plan.md) — 소유자별 파일, PR 순서, 승인 단계
- [BASE KPI A-local 실측](base-kpi-a-local-20261027.json) — 연속 10회 중 VALID 2

2026-10-28 추가 (T/F 증거 원격 반영 이후, 병합 전 작성):
- [최종 통합 보고](w6-final-integration-report.md) — 단계별 결과, 미완료 조건, A PR 초안, 수동 실행 방법
- [3인 GitHub 감사](w6-three-owner-github-audit.md) — PR #31(F), `t-w6-evidence-main`(T), A 산출물 감사
- [Merge Ledger](w6-merge-ledger.md) — PR별 head·리뷰·CI·merge 기록(병합 시 추가)
- [담당자별 최종 피드백](w6-owner-feedback-final.md)
- [F PR 준비(10/28 오전)](f-w6-pr-prep.md) — PR #31 생성 전 감사. 이후 상태는 ledger를 따른다

이 README 본문(§1~§8)은 2026-10-27 기준이다. 최신 판정은 [매트릭스 4차](e1-e8-matrix.md)를 따른다.

## 1. 두 판정의 분리

| 구분 | 판정 (2026-10-27 사전) | 의미 |
|---|---|---|
| **A OWNER CLOSEOUT** | **PARTIAL** | 승인 없이 할 수 있는 A 문서·검증 업무(AI-19, AI-17, AI-18, AI-13 사례 선정, DOC-09 정리)는 완료했다. A4 runtime binding은 PROPOSED / NOT_IMPLEMENTED / CONDITIONAL(승인 시에만 구현), A7 리허설 미실시, A1~A3·A5는 팀장 승인 대기다 |
| **TEAM W6 ENGINEERING EXIT** | **PARTIAL (PRELIMINARY 3차)** — PASS 1(E1) / PARTIAL 7 / BLOCKED 0 | T/F의 10/27 결과는 보고됐으나 원본이 원격에 없다(LOCAL_REPORTED). 최종 판정은 2026-11-01 21:00 KST에 팀장이 한다 |

A 문서가 완료돼도 TEAM EXIT는 T/F 실증 없이는 PASS가 될 수 없다.

## 2. A 티켓 Evidence Index

| Ticket | 상태 | 근거 | 남은 사항 |
|---|---|---|---|
| **AI-19** 오프라인 추론 | **PASS — VERIFIED PHYSICAL OFFLINE INFERENCE** | [판정](../w6-a-ai19-offline/ai19-final-assessment.md), [결과 JSON](../w6-a-ai19-offline/physical-offline-result.json) | 없음. tokenizer hash binding은 A4 |
| **AI-17** Data Card | **COMPLETE** | [data-card.md](../../data-card.md). 수치 원본 대조 완료(§5) | 커밋·리뷰 |
| **AI-18** Model Card | **COMPLETE** | [model-card.md](../../model-card.md). metrics 원본 대조 완료(§5) | 커밋·리뷰. 승인 후 §G 갱신 |
| **AI-13** 오제재 분석 | **PASS (W5)** + W6 발표 사례 2건 선정 | [W5 분석](../../eval/w5-validation-error-analysis.md), 본 문서 §4 | 재실험 없음 |
| **AI-11** X/B·후보 (A1) | **PENDING_APPROVAL** | [S1/S2/S3 패키지 §5 승인란](../../eval/w5-research-policy-scenarios.md) 공란 | 팀장 승인 |
| A/F 계약 (A2) | **PROPOSED** | [계약 제안](../../handoffs/W5-A-F-policy-contract-proposal.md) | A1 이후 F 합의 |
| Manifest·parity (A3) | **BLOCKED** | — | A1, A2, F2 |
| runtime binding (A4) | **PROPOSED / NOT_IMPLEMENTED / CONDITIONAL** | W5 [설계안](../../eval/w5-model-runtime-binding-design.md)만 있음. AI-18 Model Card와 별개 산출물 | 팀장 승인 시에만 구현(서비스 동작 변경). 승인 없이 구현하지 않음 |
| **AI-12** LOCK·TEST (A5) | **BLOCKED / TEST SEALED** | [LOCK 사전점검](../../eval/w5-lock-preflight-checklist.md) PARTIAL, guard `execution_allowed=false` | A1~A4 + LOCK 승인 + 별도 TEST 승인 |
| **DOC-09** 멘토링 추적 | **PARTIAL** | [추적표](../../mentoring/w5-mentoring-traceability.md), 본 문서 §6 | 2회차·4회차 원문 SOURCE_AVAILABLE_BUT_NOT_LOCALLY_VERIFIED. 사용자 제공 시 대조 |
| **OPS-04** 멘토링 반영·CNU MATE 기록 확인 | **NOT_VERIFIED** | 정의: 최종 30쪽 실행계획 §12(사용자 확인). CNU MATE 제출·수신 증거가 로컬에 없음 | 제출·수신 확인 자료 |
| A7 8분 리허설 | **NOT_STARTED** | — | 전원. T/F 시연 경로 확정 후 |

## 3. 정책·LOCK·TEST 승인 경계 감사 (PHASE 4)

조회 범위: 로컬 `jujinho`, 원격 main·jujinho·seolkyeongmin·nohyusin, PR 목록(최신 #30, 2026-10-25 merge), 2026-10-25 21:00 이후 전 브랜치 커밋(0건), 저장소 내 `team_approved: true` 기록(0건).

| 검증 항목 | 기록 | 결과 |
|---|---|---|
| 정확한 X/B | 승인란 공란. 추천값 3/50·9/20만 존재 | **없음** |
| 후보 ID | H50-90_O50-90 추천(RECOMMENDED) | **승인 없음** |
| 적용 범위 | RESEARCH_DEMO 제안 | **승인 없음** |
| 승인자·승인 시각 | 공란 | **없음** |
| 선택·기각 사유 | A 의견(S1 추천, S2 대안, S3 기각)만 존재 | 팀 결정 아님 |
| A/F 계약 수용 | PROPOSED | **없음** |
| Policy Manifest | W4 provisional만 존재. W5 신규 미생성 | **없음** |
| Python/Node parity | W4 21/21(역사). 신규 정책 parity 없음 | **없음** |
| fail-closed | guard 합성 PASS, 신규 정책 로딩 fail-closed 없음 | 부분 |
| LOCK | 미실행 | **없음** |
| 별도 TEST 승인 | 없음 | **없음** |

2026-10-22 팀장의 "판단 위임" 기록([정책 메모](../../eval/w5-policy-decision-memo.md))은 A 작업 방향에 대한 위임이며 X/B·후보 승인으로 해석하지 않는다.

**결론:** AI-11 `PENDING_APPROVAL`, AI-12 `BLOCKED`, TEST `SEALED`, S1 `team_approved=false` 유지. A는 승인을 대신하지 않았고 건너뛴 승인 단계가 없다.

**팀장 결정 요청(복사용):** "S1(또는 S2) 연구·시연 정책을 승인하시겠습니까? 승인 시 [승인란](../../eval/w5-research-policy-scenarios.md)에 범위 RESEARCH_DEMO, X·B 정확한 분수, 후보 ID, 사유, 승인자·시각을 기록해 주세요. 승인 전에는 Manifest·LOCK·TEST를 진행하지 않습니다. 11/04 동결까지 F 로딩 구현이 어렵다면, 정책 수치는 문서·발표로만 제시하는 scope cut도 선택지입니다."

## 4. 발표용 오제재 사례 (AI-13, 기존 W5 결과 재사용)

10건 모두 정답 native none, W4 시연 후보 H50-75_O50-75에서 RESTRICT된 실제 Validation 행이다. 원문은 공개하지 않는다. 출처: [오류 분석](../../eval/w5-validation-error-analysis.md), [후보별 비교](../../../ai/artifacts/reports/w5_validation_rows/20261021T231440Z-aa90617c/case-policy-comparison.json).

| 사례 | 관측 사실 | 원인 가설 (미검증) | 정책 연결 |
|---|---|---|---|
| **VFP-02** (선정 1) | 모델 argmax는 **none**인데 hate 289,002 PPM이 W4 hate 제한 기준 216,950을 넘어 RESTRICT | 정책 threshold와 native argmax가 다르게 움직인다. 내용 정상성은 사람이 재판정하지 않았다 | **"none ≠ ALLOW"**를 보여 준다. S1(H50-90_O50-90)에서는 HUMAN_REVIEW로 이동 → FRR을 낮추는 대가가 검토량(HRR_TOTAL 542/1255)이라는 연결 |
| **VFP-05** (선정 2) | argmax offensive, offensive 921,085 PPM. 4개 비교 후보 **모두**에서 RESTRICT 유지 | 고점수 분류 오류, 또는 offensive 주석 경계(alpha 0.496) 모호성 | offensive F1 0.542의 한계를 보여 준다. threshold 선택만으로 해결되지 않으며 S1에서도 남는 FRR 32/547의 예시. 이의제기(Appeal) 경로가 필요한 이유 |

주의: 목적 표본(10건)이므로 비율을 일반화하지 않는다. 점수는 UNCALIBRATED다. 실제 검토·이의제기 결과는 관측하지 않았다.

## 5. 수치 원본 대조 결과 (PHASE 9)

| 문서 | 대조 원본 | 결과 |
|---|---|---|
| Data Card 표 4·9·10·11 | [summary.json](../../../ai/artifacts/reports/w2_eda/summary.json), [split·leakage](../../research/w2-split-leakage.md) | 일치. split 합계 8,367 = 7,896 + 471, class 합계 2,033/2,688/3,646 = W2 중복 제거 전 분포와 일치 |
| Data Card 표 6~8 | summary.json `ai15_leakage` | 일치 (0/0/0/0, 2쌍, 857, 4,909,653, 1,480/1,479) |
| Model Card 표 C1~C3 | [metrics.json](../../../ai/artifacts/reports/w3_baseline_run/AI07-BL-KLUE-RB-45126-R01/metrics.json) | 일치. 177+226+429 = 832 → 832/1255 = 0.66295 |
| Model Card 표 B2 | [epoch_log.json](../../../ai/artifacts/reports/w3_baseline_run/AI07-BL-KLUE-RB-45126-R01/epoch_log.json) | 일치 |
| Model Card 표 D2 | [scenarios.json 기반 패키지](../../eval/w5-research-policy-scenarios.md), [오류 분석](../../eval/w5-validation-error-analysis.md) | 일치 |
| Model Card §E | [physical-offline-result.json](../w6-a-ai19-offline/physical-offline-result.json) | 일치 |

## 6. 멘토링 추적 (DOC-09) — W6 확인

| 회차 | 원문 | 상태 |
|---|---|---|
| 1회차 임명환 | 로컬 `멘토링/1회차/` 회신 PDF 존재, W5에 대조 완료 | VERIFIED (W5) |
| 2회차 금창섭 | 사용자 보유 원문 있음(사용자 확인). 로컬 폴더·파일은 없고, 저장소에는 팀 요약(S9)만 있음 | **SOURCE_AVAILABLE_BUT_NOT_LOCALLY_VERIFIED** |
| 3회차 이재원 | 로컬 `멘토링/3회차/` 피드백·수행일지 PDF 존재, W5에 대조 완료 | VERIFIED (W5) |
| 4회차 이재원 (M4-01~06) | 사용자 보유 원문 있음(사용자 확인). 저장소·로컬 폴더에는 없음 | **SOURCE_AVAILABLE_BUT_NOT_LOCALLY_VERIFIED**. M4-01~06 대조는 원문 제공 후 수행. 추정으로 작성하지 않았다 |
| CNU MATE 제출·수신 (OPS-04) | 로컬에는 사용 매뉴얼과 3회차 수행일지 PDF만 있음. 제출·수신 확인 기록 없음 | **NOT_VERIFIED** |

원문을 받으면 1~4회차 추적표와 M4-01~M4-06을 대조한다. 이메일 주소 등 개인정보가 있는 원문 PDF는 공개 GitHub에 추가하지 않고, 비식별 요약만 기록한다.

권고 채택과 구현 완료의 구분은 [추적표](../../mentoring/w5-mentoring-traceability.md)를 그대로 유지한다. W6 신규 구현 증거가 없으므로 M3-06·09·10·11(F UI)은 상태 변화 없음.

## 7. 발표용 AI 평가 팩트시트

말해도 되는 것 (근거 있음):
- "R01은 `klue/roberta-base`를 BEEP! 한국어 혐오표현 데이터 5,857건으로 미세조정한 3-class 모델입니다."
- "Validation 1,255건에서 Macro-F1 0.652, Accuracy 66.3%입니다. offensive F1이 0.542로 가장 약합니다."
- "인터넷을 끊은 상태에서 로컬 R01 모델로 실제 추론했습니다(2026-10-27, 이 PC 1회 실측)."
- "가중치·config·Manifest hash가 맞지 않으면 서버가 기동하지 않습니다."
- "점수는 보정되지 않은 모델 점수이며 확률이 아닙니다."
- "같은 모델이라도 정책에 따라 정상 글 오제재율이 달라집니다. 예를 들어 S1 후보는 5.85%, W4 시연 후보는 16.64%입니다. 그래서 모델과 정책을 분리하고 둘 다 Receipt에 기록합니다."
- "S1은 정상 글 오제재를 가장 적게 만드는 연구·시연 추천안이며, 대가로 43%를 사람 검토로 보냅니다." (승인 전에는 "추천안"이라고만 말한다)

말하면 안 되는 것:
- TEST 성능, "운영 정책", "검토 45% 처리 가능", "유해 확률 90%", "AI 판정이 블록체인으로 증명됨", "어떤 환경에서도 오프라인 보장", W4 결과를 W6 신규 성과로 표현, 원문 사례 낭독.

## 8. W7 인계

| 구분 | 내용 |
|---|---|
| 즉시 넘길 수 있는 것 | AI-19 PASS 증거와 시연 명령, Data Card, Model Card, 팩트시트(§7), 발표 사례 2건(§4), E1~E8 사전 매트릭스 |
| 11/01 21:00까지 필요 | 팀장: S1 승인 또는 scope cut 결정, 2·4회차 멘토링 원문 제공(로컬 대조용), A4 구현 승인 여부. T/F: [최종 실행 요청](tf-final-execution-requests.md)의 증거. A: 위 문서 커밋·PR(팀장 승인 후), 8분 리허설 1회 |
| 미완료 시 Fallback | 정책: W4 provisional 정책으로 시연하고 "연구 정책 미적용" 표기, S1은 문서 수치로만. AI: 라이브 추론이 실패하면 AI-19 결과 JSON을 RECORDED로 제시(화면 녹화본은 아직 없음 — W7 리허설에서 녹화 필요). RPC: W4 Epoch 1 공개 증거(RECORDED)와 "실시간 장애 실증 없음" 명시 |
