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

## 3. 최종 판정 — 팀장 조기 마감 (2026-10-25 20:23 KST)

> 이 절의 원래 제목은 "21:00 KST 이후 기록"이었다. 21:00은 팀 실행 계획(p.33·p.49)에서 정한 **팀 내부 Gate 시각**이며, 대회 운영 측의 공식 마감이 아니다. 팀장이 3회차 멘토링 진행을 위해 조기 마감을 지시했다. 그래서 확정 시각은 **실제 기록 시각**으로 적고, 21:00로 소급하지 않는다.

| 항목 | 값 |
|---|---|
| 확정 시각 (KST) | **2026-10-25 20:23** (Windows 시스템 시계, Korea Standard Time 변환. UTC 11:23) |
| 판정자 | 팀장 주진호(A). 대화 지시 "GATE-5 FINAL CLOSEOUT ONE-SHOT" |
| 종합 판정 | **PARTIAL** |
| G5-01 ~ G5-07 | G5-01 **BLOCKED** · G5-02 **BLOCKED** · G5-03 **PASS** · G5-04 **PASS** · G5-05 **PARTIAL** · G5-06 **PARTIAL** · G5-07 **PARTIAL** (PASS 2 / PARTIAL 3 / BLOCKED 2) |
| §2 판정안과 다른 점 | 없음. §2 판정안을 그대로 채택 |
| 기준 main SHA / CI | `efce466df24c916fb2be1bf075176137fd4c4332` / #267 push SUCCESS (frontend·backend·contracts) |
| 기록 근거 커밋 | 영수증 `a432d645`, 판정안·W6 계획 `fc101b7e`(CI #269 SUCCESS) |

**G5-05 PARTIAL 사유:** 원래 요구사항은 "Private Receipt Package·권한/멱등/프라이버시"다. Package 검증, 프라이버시, legacy storage 처리는 충족했다. 그러나 Windows에서 승인된 writable callback이 UNSUPPORTED(SEC-W5-01 fail-closed)여서, 해당 경로를 포함한 backend 53개 테스트가 Windows에서 SKIP됐다. Windows의 권한·멱등 경로 일부가 검증되지 않았으므로 PASS로 보지 않는다. 위험한 동작(빈 DB 생성)이 막혔다는 사실과 정상 기능이 지원된다는 것은 구별한다.

**미통과 Gate의 W6 이월 (확정):**
- G5-01·02 → W6 A1~A5 (S1 결정, 계약, Manifest·parity, LOCK, 최초 TEST — 각각 별도 승인)
- G5-05 → W6 T1 (SEC-W5-01 실행 방안과 부정 검증 8종)
- G5-06 → W6 F1·F3 (LIVE-RPC 실측, 실기기 QA)
- G5-07 → W6 A7 (DOC-09 2회차, 리허설)

**판정이 바꾸지 않는 것:** S1 PENDING_APPROVAL, `team_approved=false`, A/F 정책 계약 PROPOSED, LOCK 미실행, TEST SEALED, Windows callback UNSUPPORTED, LIVE-RPC 6 SKIP, 실제 체인 송신 미승인, W4 역사적 증거 불변. W5 종료는 위 과제의 완료나 승인을 뜻하지 않는다.

## 4. W5 종료 상태

**W5: CLOSED — GATE-5 PARTIAL / W6 MUST CARRYOVER** (2026-10-25 20:23 KST)

- W5 구현과 A/T/F 통합 완료: main `efce466d`, CI #267 SUCCESS
- GATE-5 최종 판정 완료(§3)
- 남은 MUST의 W6 이월 확정([W6 MUST 계획](../handoffs/W6-MUST-plan.md))
- 추가 W5 개발 작업 없음
- 미통과 자동 조치를 W6에 적용: SHOULD=0, 신규 기능=0, 남은 MUST 우선

미통과 시 자동 조치: SHOULD=0, 신규 기능=0. W6 초반에는 남은 MUST부터 처리한다([W6 MUST 계획](../handoffs/W6-MUST-plan.md)).
