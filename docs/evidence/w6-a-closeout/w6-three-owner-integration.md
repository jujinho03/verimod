# W6 3인 통합 감사 (A/T/F)

작성: A / 주진호 · 2026-10-27 KST (18시 이후) · **PRELIMINARY**. 공식 W6 Exit 판정은 2026-11-01 21:00 KST 팀장.

## 0. 증거 분류 기준

| 분류 | 뜻 |
|---|---|
| VERIFIED_REMOTE | GitHub 원격(main 또는 팀원 브랜치)에서 파일·SHA를 확인함 |
| VERIFIED_A_LOCAL | A PC에서 A가 직접 실행·확인함. 원격 미반영 |
| LOCAL_REPORTED / ORIGINAL_PENDING | 팀원이 보고했으나 원본(로그·JSON·커밋)을 A가 볼 수 없음. 사실 여부를 부정하지 않으며, 완료로도 집계하지 않음 |
| NOT_EXECUTED | 실행하지 않았다고 보고되었거나 증거가 전혀 없음 |

서로 다른 PC·SHA의 결과는 같은 빌드의 결과로 합산하지 않는다.

## 1. 저장소 기준선 (2026-10-27 재조회)

| 대상 | 값 | 비고 |
|---|---|---|
| main | `efce466d` (10/25 18:23) | 마지막 CI #267 SUCCESS. 이후 PR·CI 없음(최신 CI #270은 jujinho 10/25) |
| jujinho (A) | `44842f78` | main보다 3커밋 앞섬(W5 GATE-5 마감 문서). frontend·backend는 main과 diff 0 |
| seolkyeongmin (T) | `cd5b1c53` (10/23) | main에 모두 포함, 신규 커밋 0 |
| nohyusin (F) | `19be2b79` (10/25) | main에 모두 포함, 신규 커밋 0 |
| 기타 원격 브랜치 | `fix/sec-w5-01-windows-no-create` `baf8b36b`, `a-w4-ai09-actual-inference` `3a8993bf` | 둘 다 main에 병합됨 |
| F 보고 로컬 커밋 `b72720d8…` | GitHub API 422 (No commit found) | **원격 커밋 아님.** F PC 로컬 커밋으로 취급, diff 미확인 |
| T/F 보고 파일 6개 | `W6-T.md`, `W7-T.md`, `W6-F.md`, `w6-f/20261027/validation.json`, `w6-f/20261027/README.md`, `frontend/e2e/w6.spec.ts` | 원격 4개 브랜치·A 로컬 **모두 없음** |
| W4 보호 범위 | `ba8b7bc`→main diff 0, 작업 트리 변경 0 | VERIFIED_REMOTE |

## 2. A (주진호)

| 항목 | 결과 | 분류 | 증거 |
|---|---|---|---|
| AI-19 물리 오프라인 추론 | PASS (12항목 감사) | VERIFIED_A_LOCAL | [ai19-final-assessment.md](../w6-a-ai19-offline/ai19-final-assessment.md) |
| AI-17 Data Card / AI-18 Model Card | COMPLETE, 원본 수치 대조 | VERIFIED_A_LOCAL (미커밋) | [data-card.md](../../data-card.md), [model-card.md](../../model-card.md) |
| AI-13 발표 사례 | COMPLETE (VFP-02, VFP-05) | VERIFIED_A_LOCAL | [Closeout §4](README.md) |
| **BASE 반복 KPI (참고 실측)** | 연속 10회 중 **VALID 2 / RPC_UNAVAILABLE 8** | VERIFIED_A_LOCAL | [base-kpi-a-local-20261027.json](base-kpi-a-local-20261027.json) |
| **proof 변조 live (INVALID_PROOF)** | 1회 PASS, 1.6분 | VERIFIED_A_LOCAL | 아래 §5-1 |
| **body 변조 회귀 (RPC 없음)** | body→HASH_MISMATCH, contract·chain→UNTRUSTED_ANCHOR, proof 제거→PENDING_ANCHOR, 4/4 PASS | VERIFIED_A_LOCAL | 아래 §5, 원본은 `private-data/`(gitignore) |
| AI-11 / A2 / A3 / A5 | PENDING_APPROVAL / PROPOSED / BLOCKED / BLOCKED·TEST SEALED | VERIFIED_REMOTE(승인 기록 0건) | [W6.md](../../progress/W6.md) |
| A4 Runtime Binding | PROPOSED / NOT_IMPLEMENTED / CONDITIONAL. **W6 MUST 미달** | — | [W6 MUST 계획](../../handoffs/W6-MUST-plan.md) A4 |
| DOC-09 / OPS-04 | PARTIAL / NOT_VERIFIED | — | [Closeout §6](README.md) |

A의 BASE·회귀 실행은 기존 테스트 코드를 수정 없이 실행했다. 공개 RPC 읽기만 했고 transaction은 보내지 않았다. 원본 Playwright 보고서와 스크린샷은 저장소 밖 규칙(`private-data/`, gitignore)에 있다.

## 3. T (설경민) — 2026-10-27 보고

전 항목 **LOCAL_REPORTED / ORIGINAL_PENDING**. `W6-T.md`·`W7-T.md`가 원격에 없다.

| 보고 내용 | A 대조 결과 (main 코드 기준) | 판정 영향 |
|---|---|---|
| Frontend 6 files / 62 tests PASS | main frontend는 테스트 파일 19개(정적 계수 기준 `it/test` 120+, 루프 제외). 62개는 **부분 집합**이며 어떤 파일인지 원본 필요 | TEST-02/MKL-04 대응 여부 판단 불가 → EVIDENCE_PENDING |
| Backend 6 files / 111 tests PASS | main backend 테스트 파일 14개. 부분 집합 | SEC-05/08 포함 여부 판단 불가 → EVIDENCE_PENDING |
| Windows fail-closed regression PASS, writable callback UNSUPPORTED 유지 | main `durability-callback.test.ts`의 Windows 전용 3개 테스트와 일치하는 설명. UNSUPPORTED 표기 정확 | W5 기존 테스트의 재실행으로 보임. W6 신규 아님 |
| SEC-W5-01 부정 검증 8종 | main에 대응 테스트가 있는 것: 삭제 후 재생성 거부(Windows), 미생성(no-create), memory·relative·copied identity 거부, 합성 승인·위조 대상·비SQLite 거부, durable journaling 거부(이 4개는 **Windows에서 skip**). **교체(replacement)·symlink/reparse 테스트는 main에 없음** | 8종 전부의 assertion 근거 미제출 → T1 미완 |
| 공개 Base 읽기: chain 84532, contract code, `publisher()`, `epochs(1)` 일치 | W4 공개 handoff 값과 같은 항목. A의 BASE 실측(VALID 2회)과 정합 | E1 보강 |
| `W5_LIVE_RPC=true` Desktop+Mobile **30/30 PASS** | `w5.spec.ts`의 live 테스트는 `RPC_UNAVAILABLE`이면 **테스트 안에서 `test.skip`** 한다. 30/30이 "30 passed, 0 skipped"인지 JSON 보고서 확인 필요. A의 같은 날 실측은 10회 중 8회 skip | 원본 보고서 전까지 0 SKIP 미확인 |
| 두 RPC 차단 시 RPC_UNAVAILABLE | 이 테스트는 Playwright `page.route(...).abort('internetdisconnected')`와 `setOffline` **브라우저 요청 차단**이다. 물리 네트워크 장애가 아니다. 이후 "복구"는 같은 Receipt VALID가 아니라 proof를 지운 **PENDING_ANCHOR**다 | E3 동일 Receipt 복구 근거 아님 |
| proof 변조 INVALID_PROOF | `proof.siblings[0]`를 바꾸는 시나리오. body 재계산(rehash) 시나리오와 **다른 입력** | E2 INVALID_PROOF 1변형만 해당 |
| 별도 Recovery: Desktop PASS / Mobile 100초 timeout | 테스트 코드 원격 없음. Mobile은 config상 **viewport 390×844 + isMobile/hasTouch emulation(msedge)** 이다. 실기기 아님 | Desktop 1회 LOCAL_REPORTED, Mobile FAIL(timeout) |

## 4. F (노유신) — 2026-10-27 보고

전 항목 **LOCAL_REPORTED / ORIGINAL_PENDING**. 커밋 `b72720d8`과 산출물 4개가 원격에 없다.

| 보고 내용 | A 대조 결과 | 판정 영향 |
|---|---|---|
| Frontend 250/250, build, typecheck, lint PASS | 원본 없음. T의 62개와 다른 범위·다른 SHA | 합산하지 않음 |
| Backend 153 PASS / **53 SKIP** / 0 FAIL | W5 Windows 결과(153/53)와 같은 수치. 53 SKIP은 Windows writable callback 경계 | **SKIP 53 유지, PASS 승격 없음** |
| Chromium 기본 회귀 1/1 | 원본 없음 | — |
| 동일 W4 receipt VALID → 두 RPC 차단 → RPC_UNAVAILABLE → 해제 → 같은 receipt VALID, **1회 성공** | `w6.spec.ts` 원본 없음. 차단 방식(브라우저 interception 추정)과 receipt hash 동일성 확인 필요 | E3 1회 LOCAL_REPORTED. 반복 안정성과 분리 |
| body 변조 HASH_MISMATCH PASS | A도 같은 시나리오를 독립 실행해 PASS(§5) | E2 HASH_MISMATCH 충족(A 검증) |
| rehash 후 INVALID_PROOF **BLOCKED**(공개 RPC 불안정) | 코드상 INVALID_PROOF는 원장 root를 RPC로 읽은 **뒤에만** 판정된다(`verify.ts`). RPC 불안정이면 판정 자체가 불가능하다는 설명은 코드와 일치 | E2 rehash 변형 미충족 |
| 반복 Recovery 불안정 | A의 BASE 실측(2/10)과 같은 경향 | E3·DEMO-08 위험 |
| 물리 모바일 QA NOT_EXECUTED, 정책 로딩 BLOCKED, LOCK/TEST/송신/DB 변경 없음 | 보고 그대로 기록 | — |

## 5. A 독립 실행 기록 (2026-10-27)

| 실행 | 명령 (frontend/) | 결과 |
|---|---|---|
| BASE 반복 | `W5_LIVE_RPC=true npx playwright test -c playwright.w5.config.ts --project desktop --grep "live public RPC receipt-0" --repeat-each 10` | 2 passed / 8 skipped (RPC_UNAVAILABLE), 09:02~09:06 UTC, VALID 1회 약 48초 |
| 변조 회귀 (RPC 없음) | `npx playwright test -c playwright.w5.config.ts --project desktop --grep "W4 public regression without RPC"` | 4 passed (body·contract·chain·pending) |
| proof 변조 live 1회 | `W5_LIVE_RPC=true ... --grep "live public RPC proof"` | 1 passed, INVALID_PROOF, 1.6분, 호출 578회 |

### 5-1. proof 변조 live 1회

- 실행 2026-10-27 09:07:50~09:09:31 UTC, desktop, 기존 테스트 수정 없음.
- 입력: W4 receipt-0에서 `proof.siblings[0]`만 `0xff…ff`로 변경(body·receipt_hash 그대로).
- 결과: **INVALID_PROOF (기대값과 일치), 1 passed, 소요 1.6분, HTTPS POST 578회.** tx 송신 없음.
- 의미: INVALID_PROOF 판정 경로가 실제 공개 RPC에서 동작함을 A가 확인했다. **rehash 변형(본문 변경 + hash 재계산)은 실행하지 않았으며 이 결과로 대체하지 않는다.** 578회 호출은 RPC 실패·재시도가 많았다는 신호이며 §6의 호출량 문제를 뒷받침한다.

## 6. 원인 분석 — 반복 RPC 실패

코드 확인 사실(`frontend/src/domain/rpcLedger.ts`):
- 검증 1회마다 `deployment_block`(48,012,271)부터 현재 head까지 **10,000블록 단위**로 `eth_getLogs`를 순차 호출한다. 각 호출 전에 `eth_chainId`를 다시 확인한다.
- 각 호출 timeout은 5초다. 첫 RPC가 실패하면 두 번째 RPC로 넘어간다. 한 구간이라도 둘 다 실패하면 검증 전체가 `RPC_UNAVAILABLE`이다.
- Base Sepolia는 블록이 계속 쌓이므로 검증당 호출 수가 **매일 늘어난다.** A 실측에서 실패한 1회의 HTTPS POST가 114회, 성공한 proof 검증 1회가 578회였다.

추정(미확정): 짧은 시간에 반복하면 공개 RPC가 요청을 제한하거나 느려져 실패율이 오른다. T의 Mobile 100초 timeout, F의 반복 Recovery 불안정, A의 2/10이 같은 원인일 가능성이 높다. 원인 확정은 T/F의 네트워크 로그(HTTP 상태코드)로만 가능하다.

해결 경로(결정은 T/F·팀장, A는 구현하지 않음):
1. **운영 대응(코드 변경 없음):** 시연 직전 1회 사전 검증, 시도 간격 두기, 실패 시 "다시 검증" 1회 후 LOCAL/RECORDED로 전환.
2. **코드 수정(F 소유, T 리뷰, 11/04 동결 전):** epoch 이벤트 조회 범위를 줄이는 방식. 신뢰 조건(중복 이벤트 탐지)에 영향을 주므로 보안 리뷰가 필요하다.
