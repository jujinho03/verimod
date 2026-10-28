# W6 최종 Blocker 목록

작성: A / 주진호 · 2026-10-27 KST · PRELIMINARY · 기준: [E1~E8 매트릭스](e1-e8-matrix.md), [3인 통합 감사](w6-three-owner-integration.md)

중요도: **P0** = 11/01 Exit 또는 W7 시연에 직접 영향 / **P1** = Exit 판정 근거 보강 / **P2** = 범위 결정에 따라 제외 가능

| ID | 중요도 | Blocker | 영향 Gate | 담당 | 해결 경로 | 승인 의존 |
|---|---|---|---|---|---|---|
| B-01 | **P0** | T/F W6 결과의 원본(로그·JSON·커밋)이 원격에 없다. `b72720d`는 GitHub에 없음 | E2·E3·E4·E5 | T, F | 각자 브랜치에 push → A가 대조 | push 승인(팀장) |
| B-02 | **P0** | 공개 RPC 반복 검증 불안정. A 실측 BASE 10회 중 VALID 2. 검증 1회 약 48초, 체인 성장에 따라 호출 수 증가 | E3·E6·E8 (Beat 2·5) | F(코드), T(리뷰) | 단기: 시연 운영 절차(사전 검증, 간격, 재시도 1회 후 전환). 근본: 로그 조회 범위 축소 수정 + 보안 리뷰 | 코드 수정 시 팀장 승인·T 리뷰, 11/04 동결 전 |
| B-03 | **P0** | E2 rehash 변형(본문 변경 + hash 재계산 → INVALID_PROOF) 미재현. proof sibling 변형은 A가 1회 PASS(1.6분) | E2 (Beat 4) | F | RPC가 안정적인 시간에 1회 재실행, 결과·입력 hash 기록. 안 되면 Beat 4를 proof sibling 변형으로 시연하고 "proof 경로 변조"라고 정확히 표기 | 팀장(Beat 4 대체 수용 여부) |
| B-04 | **P0** | RECORDED 녹화본 없음(RECORDED_READY=false) | E6·E8 | 전원 | 리허설 때 BASE 성공 화면 전체 녹화 | 없음 |
| B-05 | **P0** | 8분 리허설 0회 | E8 | 전원 (A 주관) | 11/01 전 1회 이상, 시간·화면 출처 기록 | 없음 |
| B-06 | P1 | Mobile 동일 Receipt 복구 100초 timeout. 실기기 QA NOT_EXECUTED | E3 | T, F | B-02 해결 후 재측정. 실기기는 수행 시에만 기록, emulation과 분리 | 없음 |
| B-07 | P1 | LOCAL tier는 브라우저 내 **시뮬레이션 원장**(`SYNTHETIC_LOCAL · Mock 원장`)뿐. 실제 Hardhat 31337 노드를 읽는 검증 경로가 main에 없음 | E6 (DEMO-08 LOCAL) | F | 범위 결정: (a) LOCAL tier를 "SYNTHETIC_LOCAL"로 명시해 사용 — 신규 개발 없음, (b) 실제 Hardhat 경로 추가 — 신규 기능이라 비권장 | 팀장 범위 결정 |
| B-08 | P1 | SEC-W5-01 부정 검증 8종 중 교체·symlink/reparse 테스트가 main에 없음. 나머지 일부는 Windows에서 skip | E5 | T | 8종 각각 assertion 근거 제출(별도 PR) 또는 미구현 항목 명시 | Windows 실행 환경 결정(팀장) |
| B-09 | P1 | W6 변경분 PR·독립 리뷰·main CI 0건 | E4 | A/T/F | [통합 계획](github-integration-plan.md) 순서대로 | commit·push·PR·merge 각각 팀장 승인 |
| B-10 | P1 | A4 Runtime Binding이 W6 MUST인데 미구현 | A OWNER CLOSEOUT | A | Option A: 승인 후 구현 / Option B: Scope Cut 기록 | 팀장 결정 |
| B-11 | P2 | AI-11 S1 미승인 → A2·A3·F2·A5 연쇄 BLOCKED | (정책 경로) | 팀장 → A/F | Option A: 승인 후 진행 / Option B: Scope Cut | 팀장 승인 |
| B-12 | P2 | DOC-09 2·4회차 원문, OPS-04 CNU MATE 기록 로컬 미확인 | E7 | 팀장(자료 제공) → A | 원문 제공 시 대조 | 없음 |

## Option A / B 비교 (Scope Cut 결정용)

| 기준 | OPTION A — FULL W6 MUST | OPTION B — CORE DEMO SCOPE CUT |
|---|---|---|
| 범위 | A1 S1 승인 → A2 계약 → A3 Manifest·parity → A4 Binding → A5 LOCK·TEST 승인 → F2 정책 로딩, T1 8종, T2 조건부 Seed | 기존 W4 승인 seed·W4 provisional 정책·AI-19 실추론·기존 E2E로 Core 시연 완결. 신규 S1 운영 정책, 신규 LOCK/TEST, 신규 Epoch, Runtime Binding은 이번 릴리스에서 제외 |
| 11/01 종료 가능성 | **낮음.** 승인 4건 이상이 순서대로 필요하고 F2는 F 구현량이 크다. 4일 안에 A3 parity·F2·리뷰·CI를 끝내기 어렵다 | **높음.** 남은 일은 B-01~B-05(증거 제출, RPC 운영 대응, 녹화, 리허설) 중심 |
| 기술 리스크 | 새 Manifest·hash가 W4 증거와의 연결을 깨뜨릴 위험, 동결 직전 신규 코드 | 공개 RPC 불안정(B-02)은 두 경로 공통으로 남음 |
| 승인 의존성 | S1, Manifest 확정, LOCK, TEST, 각 PR | Scope Cut 결정 1건 + 각 PR |
| T/F 작업량 | F2 정책 로딩·회귀, T parity 리뷰·8종 | 증거 push, B-02 대응, 리허설 |
| W7 발표 영향 | 성공 시 "연구 정책 적용·TEST 1회 성능"까지 주장 가능. 실패 시 미완 기능이 시연에 섞일 위험 | "정책 수치는 Validation 연구 결과, 시연은 W4 provisional 정책"으로 명확히 구분해 발표 |
| 주장 가능 범위 | 정책 LOCK, TEST 성능(실행 시) | 실제 AI 추론, Receipt 무결성, 공개 체인 검증, 변조 탐지, RPC 장애 구분. TEST 성능·운영 정책은 주장 불가 |
| 남는 미충족 | 일정 미달 시 A3~A5 부분 완료 상태로 남음 | A1~A5·F2 미달 사실을 **Scope Cut 결정으로 기록**하고 보존(삭제·PASS 전환 없음) |

**A 권고: OPTION B.** 남은 4일 동안 Exit에 직접 필요한 것은 B-01~B-05이며, 정책 경로는 승인·구현·리뷰가 순차로 걸려 동결 전 완료 가능성이 낮다. 단 이것은 권고이며 팀장이 선택한다. 선택 전까지 A1~A5는 현재 상태(PENDING/BLOCKED)를 유지한다.

**OPTION B를 승인할 경우 기록할 내용(초안, 승인 아님):**

> 결정 ID: D-W6-SCOPE-01 · 결정자: 팀장 주진호 · 시각: (기록) · 범위: v1.0-demo 릴리스에서 A1~A5(S1 운영 승인, A/F 계약, 신규 Manifest·parity, Runtime Binding, LOCK·TEST)와 F2, 조건부 T2를 제외한다. · 사유: (기록) · 유지: S1 PENDING_APPROVAL, team_approved=false, TEST SEALED, W6 MUST 미달 사실. · 발표 표현: "정책은 Validation 연구 결과이며 운영 승인·TEST 평가 전".
