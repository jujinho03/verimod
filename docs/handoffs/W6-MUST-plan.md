# W6 MUST 계획 — 담당별 (2026-10-26 ~ 11-01)

작성: A / 주진호(팀장) · 2026-10-25 · 기준 main `efce466d` · 근거: [GATE-5 판정 기록](../progress/W5-GATE5-decision-record.md), [마감 영수증](../progress/W5-GATE5-closeout-receipt.md)

이 계획은 GATE-5 미통과 항목을 처리하는 W6 MUST다. 원래 W6 계획(실행 프롬프트 p.19·p.34·p.45)과 겹치는 항목은 거기에 합쳐서 처리한다. SHOULD=0, 신규 기능=0이다. 11/04 코드 동결은 바뀌지 않는다.

## A — 주진호

| # | MUST | 의존성 | 완료 검증 조건 |
|---|---|---|---|
| A1 | S1(또는 S2) X/B·후보 결정. 유예를 끝낼지 W6 초에 결정 | 팀장 결정 | 승인란에 분수값, 승인자, 시각, 사유 기록. 25후보 공식 선정 재현 |
| A2 | A/F 정책 계약 합의(PROPOSED → 합의) | A1, F 시간 | 4개 질문의 답이 결정 기록부에 남음 |
| A3 | Manifest 생성기와 Python/Node parity harness | A2, F 로딩 구현(F2) | 새 hash, 21개 이상 경계 parity, fail-closed 결과와 SHA. W4 hash 불변 |
| A4 | 모델 런타임 binding(tokenizer 파일 hash, 서비스 lock) | 없음 | 합성 테스트, binding 기록, guard의 `model_manifest` 역할 검사 통과 |
| A5 | LOCK 패키지 → **LOCK 승인 요청** → **최초 TEST 승인 요청** | A1~A4, F2 | 11단계 체크리스트 순서대로. 승인 없으면 BLOCKED 유지 |
| A6 | AI-17 Data Card, AI-18 Model Card(Epoch 2/3 한계 포함) | 없음 | 카드 수치가 실제 평가표와 같음 |
| A7 | DOC-09 2회차 원문 확보 또는 "미확인" 확정, 8분 리허설 1회 이상 | 전원 | 리허설 시간과 화면 출처 기록 |

## T — 설경민

| # | MUST | 의존성 | 완료 검증 조건 |
|---|---|---|---|
| T1 | SEC-W5-01: Windows callback 실행 방안 또는 비 Windows 실행 환경 제안 | 팀장 결정(아래) | 8개 부정 검증(삭제 경쟁·교체·identity·symlink/reparse·미승인 DB·header/schema·no-create·durability) 테스트와 SHA. 별도 PR + 독립 리뷰 |
| T2 | SEED-01 사전 앵커 seed(DECISION→APPEAL→REVIEW) | **T1 실행 환경 결정**, 실제 송신은 별도 승인 | 각 core VALID, link/transition PASS. 새 tx는 승인 후에만 |
| T3 | TEST-02·MKL-04 부정 테스트, SEC-05/08 위협 모델 | 없음 | assertion과 입력이 1:1로 대응하는 로그 |
| T4 | A3 parity와 Manifest schema(`approval_scope`) 리뷰 | A2 | 리뷰 기록 |

## F — 노유신

| # | MUST | 의존성 | 완료 검증 조건 |
|---|---|---|---|
| F1 | LIVE-RPC 브라우저 실측(읽기 전용, `W5_LIVE_RPC=true`) 6건 | 없음 | 0 SKIP. 실제 RPC 장애 시 RPC_UNAVAILABLE 실측 |
| F2 | 연구 정책 로딩·검증(명시적 프로필, fail-closed, W4/W5 혼합 거부) | A1, A2 | F 회귀 SHA. 미승인 hash와 혼합 identity 거부 테스트 |
| F3 | 실기기 Mobile QA(emulation 외), DEMO-08 KPI(BASE seed 10회, LOCAL 3회) | T2(seed) | 기기·브라우저·결과 기록 |
| F4 | TEST-01/03 Core E2E와 FE-04/05/06(원래 W6 범위) | 없음 | CI와 E2E 기록 |

## 공통 검증 규칙

- PR마다 독립 리뷰 APPROVED(작성자 본인 제외)를 받고, head SHA를 고정한 일반 Merge Commit으로 병합한다. 병합 후 main CI를 확인한다.
- SKIP은 PASS가 아니다. emulation은 실기기가 아니다. 로컬 결과는 CI가 아니다.
- S1 승인, LOCK, TEST, 실제 체인 송신, 운영 DB 작업은 각각 별도의 명시적 승인이 필요하다.

## 추가 팀장 승인이 필요한 사항

1. **21:00 이후 GATE-5 최종 판정 확정.** [판정 기록 §3](../progress/W5-GATE5-decision-record.md)에 기록. G5-05를 PARTIAL로 할지(판정안) PASS로 할지 포함
2. **S1 유예 종료 시점과 X/B·후보**(A1)
3. **SEC-W5-01 실행 환경**(T1). SEED-01과 새 Epoch의 전제다
4. **SEED-01 실제 체인 송신 승인**(T2). 별도 승인
5. **LOCK 승인, 최초 TEST 승인**(A5). 각각 별도 승인
