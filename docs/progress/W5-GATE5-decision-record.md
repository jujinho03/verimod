# W5 GATE-5 판정 기록

판정 기준 시각: **2026-10-25 21:00 KST** · 판정자: 팀장 주진호(A) · 근거 문서: [마감 영수증](W5-GATE5-closeout-receipt.md) (커밋 `a432d645`, main `efce466d` 기준)

## 1. 사전 결정 기록 — 2026-10-25 19:27 KST (최종 판정 아님)

팀장이 21:00 전에 아래 방향을 전달했다. **기준 시각 이전이므로 최종 판정으로 기록하지 않는다.** 21:00 이후 §3에 최종 판정을 별도로 기록할 때 이 내용을 그대로 적용할 예정이다.

| 사전 결정 | 내용 | 확대 해석 금지 |
|---|---|---|
| GATE-5 종합 | PARTIAL 채택 예정 | Gate 규칙이나 개별 Gate 기준을 바꾸지 않는다 |
| S1 정책 | 채택과 X/B 확정을 W6로 유예 | S1은 PENDING_APPROVAL, `team_approved=false`를 유지한다. 유예는 승인이 아니다 |
| LOCK·최초 TEST | 승인 없음 | LOCK 미실행, TEST SEALED |
| Windows callback 실행 환경 | W6에서 결정 | SEC-W5-01 Windows writable callback은 UNSUPPORTED 상태를 유지한다 |

**대조 확인 (19:27 KST):**
- main `efce466d`, CI #267 (push) SUCCESS
- 마감 영수증 `a432d645` = main에 문서 1개 추가. 그 외 변경 없음
- 원격 `jujinho` = `a432d645`

## 2. Gate별 판정안 (원래 요구사항 기준)

판정 원칙: 증거가 원래 요구사항을 **모두** 충족할 때만 PASS로 본다. 일부만 충족하면 PARTIAL, 선행 승인이 없으면 BLOCKED다.

| Gate | 원래 요구사항 (실행 프롬프트 p.33) | 증거 | 판정안 | 사유 |
|---|---|---|---|---|
| G5-01 (A) | Validation 정책 선택·기각 근거, X/B 승인, LOCK SHA·시각 | 25후보 비교, S1/S2/S3, 결정 초안 | **BLOCKED** | X/B 승인과 LOCK이 없다(W6 유예) |
| G5-02 (A) | 별도 승인 후 LOCK 이후 최초 TEST, 지표·CI·오제재 한계 | Guard 합성 PASS, `test-evaluate` EXPECTED_BLOCK | **BLOCKED** | LOCK과 TEST 승인이 없다 |
| G5-03 (T/F) | 변경되지 않은 W4 Base tx·F CONFIRMED·브라우저 7/7의 재현 가능한 공개 증거 | W4 증거 불변(A 45 / F 53, 범위 별도), T TEST-05 공개 RPC 9항목 재확인 | **PASS** | 요구사항이 모두 증거로 확인됐다 |
| G5-04 (T/F) | Synthetic lifecycle 정상·변조·누락 전이, SYNTHETIC UI | T `transitionProblem`(issuer_seq·UUID/hash) 테스트, F Synthetic UI 테스트·emulation, 독립 리뷰 APPROVED, main CI SUCCESS | **PASS** | 정상·변조·누락 전이 테스트와 SYNTHETIC 표시가 main에 있고 리뷰를 통과했다 |
| G5-05 (F) | Private Receipt Package·권한/멱등/프라이버시 | F Package 5필드 검증, legacy storage 명시적 정리, backend 회귀(Linux 199 PASS / 7 SKIP, Windows 153 PASS / 53 SKIP), SEC fail-closed | **PARTIAL** | Package와 프라이버시는 충족했다. 그러나 Windows에서는 승인된 writable callback이 UNSUPPORTED이고, 이 때문에 53개 경로가 SKIP으로 남아 권한·멱등 경로 일부를 Windows에서 검증하지 못했다 |
| G5-06 (T/F) | RPC_UNAVAILABLE 분리, L2 Confirmed UI, Manifest 부가상태, 실제·합성 모드 | 코드와 단위 테스트, Desktop/Mobile emulation 12+12 PASS | **PARTIAL** | LIVE-RPC 0 PASS / 6 SKIP, 실제 RPC 장애 실측과 실기기 QA를 하지 않았다 |
| G5-07 (전원) | 테스트 로그·코드 SHA·DOC-09·CI/개별 DoD | A/T/F main CI #267, A Python 307 + 27 subtests, 영수증 | **PARTIAL** | DOC-09 2회차 원문 미확인, 리허설 미실시 |

**종합 판정안: PARTIAL** (PASS 2 / PARTIAL 3 / BLOCKED 2)

영수증 초안과 달라진 점이 하나 있다. G5-05를 "PASS 후보"에서 **PARTIAL**로 낮췄다. 원래 요구사항에 "권한/멱등"이 포함돼 있는데, Windows 53 SKIP으로 그 일부가 검증되지 않았기 때문이다. 팀장이 21:00에 이 판정안을 바꿀 수 있다.

## 3. 최종 판정 — 21:00 KST 이후 기록

> **미기록.** 2026-10-25 21:00 KST 이후에 팀장 확인을 받아 아래를 채운다. 그 전까지 이 칸은 비워 둔다.

| 항목 | 값 |
|---|---|
| 확정 시각 (KST) | |
| 판정자 | |
| 종합 판정 | |
| G5-01 ~ G5-07 | |
| §2 판정안과 다른 점 | |
| 기준 main SHA / CI | |

미통과 시 자동 조치: SHOULD=0, 신규 기능=0. W6 초반에는 남은 MUST부터 처리한다([W6 MUST 계획](../handoffs/W6-MUST-plan.md)).
