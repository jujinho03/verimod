# W5 → W6 전환 인계 (10/26 킥오프용)

작성: A / 주진호(팀장) · 2026-10-22 · 대상: 설경민(T), 노유신(F) · 상태: **PROPOSED — W6 킥오프에서 확정**

이 문서는 W6 계획의 **변경 제안**이다.
- 원본 W6 계획(실행 프롬프트 p.19·p.34·p.45)이나 팀원 코드는 바꾸지 않았다.
- F의 실제 착수일은 시험 일정 확인 후 정한다.
- 11/04 코드 동결은 그대로다.

근거: [이월 결정 D-W5F-20261022-01](W5-to-W6-carryover-decision-20261022.md), [W5 A 마감 감사](../progress/W5-A-closeout.md)

## 1. W5에서 W6로 넘어가는 것

| 담당 | 이월 항목 | W5 상태 | W6 완료 기준 |
|---|---|---|---|
| F | FE-03 Synthetic Timeline UI | 미착수/미확인 | SYNTHETIC·LOCAL·BASE 출처 분리 표시, 실제 사람 심사처럼 보이는 표현 없음, 정상·전이 실패·이력 누락 화면 |
| F | FE-07 Private Receipt Package | 미착수/미확인 | 5개 필드 검증, 원문·salt 비공개 회귀, Content 상태(PASSED/FAILED/NOT_CHECKED)와 Core 상태 분리 |
| F | SEC-03 권한·멱등·동시성 QA | 미착수/미확인 | 실제 존재하는 API만 검사, 미구현은 NOT_IMPLEMENTED 표시, 403/409·Idempotency-Key 결과와 SHA |
| F | Verifier UX 회귀 | 미착수/미확인 | PROTOTYPE MODE 정확화, Manifest 부재와 mismatch 구분, `L2 Confirmed (Base Sepolia)`, RPC_UNAVAILABLE 실제 장애 실증 |
| T+F | 공동 SERVICE QA | F 대기 | verified Receipt·Package·Synthetic UI·RPC 장애와 회복의 통합 실행 기록 |
| F (+A) | 연구 정책 로딩·parity | 조건부 | S1(또는 S2) 승인과 A/F 계약 합의 **이후에만** 시작 |
| A | G5-01/02 잔여 | 승인 대기 | X/B 승인 → Manifest → LOCK → 별도 TEST 승인 → 1회 평가 |

## 2. W6 우선순위 제안

원본 W6 범위와 겹치는 부분이 많다. 원본 W6 F 범위는 TEST-01/03(Core E2E·CI)와 FE-04/05/06(변조 패널·상태 표기)이고, 원본 W6 T 범위는 TEST-02·MKL-04·SEC-05/08·SEED-01이다. 그래서 이월분은 **원본 W6 작업에 합쳐서** 처리하고 별도 트랙을 만들지 않는다.

**P0 — Core E2E 보존과 보안 (W6 초반, F 복귀 직후)**
1. FE-07 Private Package의 민감정보 경계(원문·salt 비공개) — F
2. 기존 Verification 회귀를 유지하면서 FE-05/06 상태 표기 작업에 RPC_UNAVAILABLE·Manifest·Mode 표시를 합침 — F, T 리뷰
3. TEST-01 Core E2E: W4 증거를 깨지 않는지 확인 — F
4. SEED-01 사전 앵커 seed 준비 — T. F와 독립적이므로 **T가 W6 초에 먼저 착수 가능**

**P1 — 서비스 통합**
1. FE-03 Synthetic Lifecycle UI. T의 RCPT-05 결과를 소비한다 — F
2. A/F 정책 계약과 로딩 — 승인이 있을 때만. 없으면 W4 provisional 정책으로 시연하고 "연구 정책 미적용"으로 표기
3. T/F 공동 QA와 SEC-03

**P2 — 안정화와 발표**
1. 모바일·데스크톱 QA, DEMO-08 KPI(BASE seed 10회, LOCAL 3회)
2. 최종 증거, fallback, 리허설

**용량 위험:** F에게 원본 W6 작업과 이월분이 겹친다. F가 W6 중반에 복귀하면 P1-2(정책 로딩)와 SEC-03 일부를 W7 동결 전까지 끝내지 못할 수 있다. 그때 scope cut은 팀장이 승인한다. 후보는 다음과 같다:
- 정책 로딩을 포기하고 S1은 문서·발표 수치로만 제시
- SEC-03을 실제 존재하는 API로 축소

## 3. 팀원별 전달 사항

**설경민(T) — W5 완료 보고에 대해**
- RCPT-05·CHAIN-09 완료 보고를 받았다. 원격 `seolkyeongmin`은 아직 `8d0580a`(main과 동일)라서 A가 SHA를 확인할 수 없다. **push 또는 커밋 SHA와 테스트 로그를 공유해 달라.** 그래야 G5-04의 T 부분을 PASS로 기록할 수 있다.
- TEST-05(공개 RPC 읽기 전용 재검증) 결과와 실패 상태 기록을 10/25 21:00 전에 공유해 달라.
- 5-fold 재학습 제안은 [연구 백로그 RB-01](../eval/w5-model-card-limitations.md#후속-연구-백로그-w5-미실행)로 등록했다. W5·W6에서 모델은 R01을 유지한다.
- 리뷰 요청 1건: A/F 계약안의 `approval_scope` 필드 추가 여부(Manifest schema) — [계약 제안 §2](W5-A-F-policy-contract-proposal.md)
- 리뷰 요청 1건: [런타임 binding 설계](../eval/w5-model-runtime-binding-design.md)의 schema 이름

**노유신(F) — 시험 끝난 뒤**
- 위 §1 F 항목은 W5 미완료로 기록됐으며, 다른 사람에게 넘기지 않았다.
- 복귀 가능 날짜를 알려 주면 W6 착수일을 확정한다.
- 정책 계약 질문 4개: [A→F 요청](W5-A-to-F-contract-request.md). 시험 중에는 회신하지 않아도 된다. 복귀 첫날 15분이면 정할 수 있는 수준이다.

**A(주진호) — W6에서 할 일**
- X/B·후보 승인 기록, AI-17 Data Card, AI-18 Model Card(Epoch 2/3 한계 반영), 오탐 사례 중 발표용 1~2건 선정
- F 합의 후: Manifest 생성기와 parity harness, binding 구현 → LOCK 요청 → 별도 TEST 승인 요청

## 4. 바꾸지 않는 것

W4 Epoch 1, Receipt 2건, Contract/Publisher, F CONFIRMED, 브라우저 7/7, W4 Manifest/hash는 그대로 유지한다. TEST SEALED도 그대로다. GATE-5 판정 규칙과 11/04 코드 동결도 바꾸지 않는다.
