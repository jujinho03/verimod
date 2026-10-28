# W6 Engineering Exit E1~E8 — Evidence Matrix

작성: A / 주진호 · **PRELIMINARY 판정 2026-10-28 17:48 KST (4차)** · **공식 W6 Exit 판정: 2026-11-01 21:00 KST 팀장 (미확정)**

판정 이력:
- 1차(10/27 오전): E1~E8 모두 PARTIAL, E6 BLOCKED
- 2차(10/27, 팀장 정정 지시): E3 → BLOCKED, E6 → PARTIAL
- 3차(10/27 18시 이후): T/F 10/27 보고 수령, A 독립 실행(BASE 10회, 변조 회귀, proof live) 반영
- 4차(10/28 17:48): T/F 증거가 원격에 올라옴(F PR #31 head `1620f82c`, T 브랜치 `t-w6-evidence-main` `6b53abe3`). 판정 값 변경 없음. E3·E5·E6 근거를 LOCAL_REPORTED에서 "원격 문서로 확인(원본 로그는 미확인)"으로 올리고 E4·E7 상태를 갱신했다. 이 판정은 **어떤 W6 PR도 병합되기 전**에 작성했다. 병합 기록은 [merge ledger](w6-merge-ledger.md)에 따로 적는다.

상태 정의: **PASS** 필수 조건과 증거 충족 / **PARTIAL** 일부 실증, 완료조건 잔여 / **BLOCKED** 선행조건 또는 실행 증거 부재 / **FAIL** 실제 수행했으나 기준 미달.
증거 분류(VERIFIED_REMOTE, VERIFIED_A_LOCAL, LOCAL_REPORTED / ORIGINAL_PENDING)는 [3인 통합 감사 §0](w6-three-owner-integration.md)을 따른다. LOCAL_REPORTED만으로는 PASS를 주지 않는다.

## 요약

| Gate | PRELIMINARY | 한 줄 사유 | 팀장 확정 |
|---|---|---|---|
| E1 | **PASS (권고)** | W4 증거 불변(원격 확인) + W6에 같은 W4 receipt를 공개 RPC로 다시 검증해 VALID(A 실측 2회) | 미확정 |
| E2 | **PARTIAL** | VALID·HASH_MISMATCH·INVALID_PROOF(proof sibling 변조)는 A 실측. rehash 변형 INVALID_PROOF 미재현 | 미확정 |
| E3 | **PARTIAL** | 동일 receipt VALID→RPC_UNAVAILABLE→VALID Desktop 1회 성공이 F 증거 JSON(PR #31)과 T 문서로 원격에 있다. 장애 주입은 route abort(물리 차단 아님). Mobile emulation 미완(T: 100초 초과, F 재실측: BLOCKED_ENVIRONMENT), 반복 불안정 | 미확정 |
| E4 | **PARTIAL** | PR #31(F) open·CI 성공·**GitHub 리뷰 0건**. T 브랜치 PR 없음. A W6 PR 없음. W6 merge 0건 | 미확정 |
| E5 | **PARTIAL** | fail-closed·UNSUPPORTED 유지. T 문서: SEC-W5-01 PASS(로컬 실행 보고). 8종 중 일부 테스트 부재, Windows 53 SKIP | 미확정 |
| E6 | **PARTIAL** | BASE seed(W4)·Offline(AI-19) 확보. 실제 Hardhat LOCAL은 T 문서도 NOT_VERIFIED, RECORDED_READY=false, BASE 반복 2/10(A), 10회 NOT_MET(T·F) | 미확정 |
| E7 | **PARTIAL** | Data/Model Card 완료·대조. A 문서는 `jujinho`에 커밋 예정이고 main 미병합. `ai/README.md` 미갱신. T 문서에 존재하지 않는 파일명 참조 1건 | 미확정 |
| E8 | **PARTIAL** | Beat 1~4 준비 근거 있음. Beat 5·녹화·리허설 없음 | 미확정 |

**PRELIMINARY 집계: PASS 1 / PARTIAL 7 / FAIL 0 / BLOCKED 0 → TEAM W6 ENGINEERING EXIT: PARTIAL**

E3를 2차의 BLOCKED에서 PARTIAL로 바꾼 이유: 2차 시점에는 실행 보고 자체가 없었다. 3차에는 T·F가 같은 시퀀스를 각각 실행해 1회 성공했다고 보고했다. 원본이 없어 PASS는 아니지만 "실행 증거 부재"도 아니다. 원본이 보고와 다르면 다시 내린다.

## 상세 (Gate별 12항목)

### E1 — W4 Core E2E 불변·재현

| # | 항목 | 내용 |
|---|---|---|
| 1 | Gate | E1 |
| 2 | 요구조건 | W4 Base Sepolia Epoch 1 증거가 바뀌지 않았고, W6에 같은 receipt를 다시 검증할 수 있음 |
| 3 | Owner | T(체인), F(검증 UI), A(감사) |
| 4 | source SHA | W4 `ba8b7bc` → main `efce466d` (W4 범위 diff 0). A 실행 `44842f78`(frontend는 main과 동일) |
| 5 | 실행 환경 | A: Windows 11, Node 24.10.0, Playwright msedge headless desktop, 공개 RPC 2곳 |
| 6 | 실행 명령 | `W5_LIVE_RPC=true npx playwright test -c playwright.w5.config.ts --project desktop --grep "live public RPC receipt-0" --repeat-each 10` |
| 7 | 증거 경로 | [W4 공개 Anchor](../../handoffs/w4-anchored-epoch-public/20261020-r01/README.md), [base-kpi-a-local-20261027.json](base-kpi-a-local-20261027.json). T 보고: chain 84532·contract code·`publisher()`·`epochs(1)` 일치(LOCAL_REPORTED) |
| 8 | 관측 결과 | receipt-0 VALID 2회(각 약 48초) |
| 9 | FAIL/SKIP/미실행 | 같은 실행에서 8회 RPC_UNAVAILABLE(SKIP). 안정성 문제는 E3·E6에서 다룸 |
| 10 | 남은 조건 | 없음(재현 요건). 반복 안정성은 별도 KPI |
| 11 | 권고 판정 | **PASS** |
| 12 | 팀장 확정 | 미확정 |

### E2 — VALID / HASH_MISMATCH / INVALID_PROOF

| # | 항목 | 내용 |
|---|---|---|
| 1 | Gate | E2 |
| 2 | 요구조건 | 같은 W4 public seed로 ① 원본 VALID ② body만 변경 → HASH_MISMATCH ③ body 변경 후 receipt hash 재계산, 기존 proof/anchor 유지 → INVALID_PROOF |
| 3 | Owner | F(주), T(리뷰) |
| 4 | source SHA | A 실행 `44842f78`(= main frontend). T·F는 각자 로컬 SHA(원격 미반영) |
| 5 | 실행 환경 | A: 위 E1과 동일 |
| 6 | 실행 명령 | ① E1 명령 ② `--grep "W4 public regression without RPC"` ③' `W5_LIVE_RPC=true ... --grep "live public RPC proof"` |
| 7 | 증거 경로 | [3인 통합 감사 §5](w6-three-owner-integration.md). 원본 보고서는 `private-data/`(gitignore) |
| 8 | 관측 결과 | ① VALID ✓ ② `policy.action` 변경 → HASH_MISMATCH ✓(RPC 없이 판정) ③' `proof.siblings[0]` 변경 → INVALID_PROOF ✓(1.6분) |
| 9 | FAIL/SKIP/미실행 | ③ rehash 변형은 F가 BLOCKED(공개 RPC 불안정)로 보고, A 미실행. ③'와 ③은 다른 입력이므로 합산하지 않음 |
| 10 | 남은 조건 | ③ rehash 변형 1회 실행 증거(입력 receipt_hash 재계산값 포함). 또는 팀장이 ③'로 대체 수용 |
| 11 | 권고 판정 | **PARTIAL** |
| 12 | 팀장 확정 | 미확정 |

참고(코드 확인): `verify.ts`는 hash 재계산을 RPC보다 먼저 하므로 HASH_MISMATCH는 오프라인으로 판정된다. INVALID_PROOF는 원장 root를 RPC로 읽은 뒤에만 판정되므로 공개 RPC가 필요하다.

### E3 — 실제 공개 RPC 장애·복구

| # | 항목 | 내용 |
|---|---|---|
| 1 | Gate | E3 |
| 2 | 요구조건 | 같은 W4 receipt·hash·trust profile로 VALID → 두 RPC 모두 실패 → RPC_UNAVAILABLE(HASH_MISMATCH 오분류 없음) → 차단 해제 → 같은 receipt VALID. 중간 대체 금지 |
| 3 | Owner | F(주), T(리뷰) |
| 4 | source SHA | (4차) F `1620f82c`(PR #31, 실행 기준 main `efce466d`, run `20261027-1740-efce466d`). T `6b53abe3`(브랜치 `t-w6-evidence-main`). 3차 당시 F `b72720d8`은 noreply 재작성 후 `50f2061b`가 됨 |
| 5 | 실행 환경 | F: Desktop Chromium. 장애 주입은 승인 RPC 2곳에 대한 Playwright `route.abort('internetdisconnected')`이며 물리 네트워크 차단이 아님(F 문서 명시). T: W5 config Desktop + Mobile emulation |
| 6 | 실행 명령 | F `frontend/e2e/w6.spec.ts`, 재실측 도구 `npm run w6:rpc-recovery`(둘 다 CI 제외, 수동 전용). T `W5_LIVE_RPC=true npx playwright test -c playwright.w5.config.ts` |
| 7 | 증거 경로 | (4차) 원격: `docs/evidence/w6-f/20261027/validation.json`, `rpc-recovery-review.json`(PR #31), `docs/evidence/w6-t-execution-receipt-20261027.md`(T 브랜치). 원본 Playwright JSON·trace는 각자 `private-data/`에만 있음(공개 제외) |
| 8 | 관측 결과 | 원격 문서 기준: F Desktop 1회 `VALID → RPC_UNAVAILABLE → VALID`(247,530 ms, 재시도 0/0, 입력 SHA-256 `0b73aa52…`). T Desktop 복구 통과·Mobile 100초 내 미표시. 원본 로그는 A가 직접 보지 않았다 |
| 9 | FAIL/SKIP/미실행 | T Mobile **timeout 100초(FAIL)**. F 반복 Recovery 불안정. 물리 네트워크 장애·실기기 NOT_EXECUTED. A의 BASE 실측 2/10 |
| 10 | 남은 조건 | 원본 로그로 receipt hash 동일성·순서·차단 방식·시각 확인. 반복 KPI는 별도 |
| 11 | 권고 판정 | **PARTIAL** |
| 12 | 팀장 확정 | 미확정 |

참고: 기존 `w5.spec.ts`의 RPC 차단 테스트는 `page.route(...).abort('internetdisconnected')`와 `setOffline`을 쓴다. 그 뒤의 "복구"는 같은 receipt VALID가 아니라 proof를 지운 PENDING_ANCHOR다. 따라서 T의 30/30 중 이 테스트는 E3 복구 근거가 아니다.

### E4 — A/T/F 통합·독립 리뷰·main CI

| # | 항목 | 내용 |
|---|---|---|
| 1 | Gate | E4 |
| 2 | 요구조건 | W6 변경이 PR·작성자 외 독립 리뷰·head SHA 고정 merge·main CI를 거침 |
| 3 | Owner | A(통합 관리), T, F |
| 4 | source SHA | (4차) main `efce466d`, F `1620f82c`, T `6b53abe3`, A `jujinho`(W5 3커밋 + 이번 W6 커밋) |
| 5 | 실행 환경 | GitHub Actions "VeriMod P0 checks" |
| 6 | 실행 명령 | — |
| 7 | 증거 경로 | [merge ledger](w6-merge-ledger.md), [GitHub 감사](w6-three-owner-github-audit.md). PR #31 CI #272(push)·#273(pull_request) SUCCESS. 최신 main CI #267 SUCCESS |
| 8 | 관측 결과 | W5까지 통합 완료. W6: PR #31만 존재, CI 성공, 충돌 없음 |
| 9 | FAIL/SKIP/미실행 | PR #31 GitHub 리뷰 0건(T의 APPROVED는 T 브랜치의 문서로만 존재). T·A PR 미생성. W6 merge 0, merge 후 main CI 0 |
| 10 | 남은 조건 | PR 3개 각각 head SHA 고정 GitHub APPROVED(작성자 외), CI SUCCESS, merge commit, merge 후 main CI SUCCESS |
| 11 | 권고 판정 | **PARTIAL** |
| 12 | 팀장 확정 | 미확정 |

### E5 — 보안·PII·No-create·Trust 경계

| # | 항목 | 내용 |
|---|---|---|
| 1 | Gate | E5 |
| 2 | 요구조건 | 비밀값·원문·salt 비노출, 미승인 DB 생성 금지, Trust profile 경계, SEC-W5-01 부정 검증 8종 |
| 3 | Owner | T(주), F |
| 4 | source SHA | main `efce466d`(기존 테스트). T·F W6 결과는 로컬 |
| 5 | 실행 환경 | T·F Windows(보고) |
| 6 | 실행 명령 | 원본 미제출 |
| 7 | 증거 경로 | main `backend/test/durability-callback.test.ts`, [SEC 보류 문서](../../security/sec-w5-windows-sqlite-reopen-hold.md) |
| 8 | 관측 결과 | Windows fail-closed 3개 테스트 존재. LOCAL_REPORTED: T Windows fail-closed PASS, F backend 153 PASS |
| 9 | FAIL/SKIP/미실행 | F backend **53 SKIP(유지)**. 8종 중 교체·symlink/reparse 테스트 main에 없음, identity·미승인 DB·durability 테스트는 Windows에서 skip |
| 10 | 남은 조건 | 8종 각각의 assertion 근거 또는 미구현 명시, Windows 실행 환경 결정 |
| 11 | 권고 판정 | **PARTIAL** |
| 12 | 팀장 확정 | 미확정 |

### E6 — BASE / LOCAL / Offline / RECORDED 준비

| # | 항목 | 내용 |
|---|---|---|
| 1 | Gate | E6 |
| 2 | 요구조건 | 3단 Fallback(BASE→LOCAL→RECORDED) 준비와 Offline 추론. 참고 KPI: BASE 연속 10회, LOCAL 연속 3회 |
| 3 | Owner | F(LOCAL·KPI), T(BASE·Fallback), 전원(녹화), A(Offline) |
| 4 | source SHA | A `44842f78` |
| 5 | 실행 환경 | A Windows 11, 공개 RPC / AI-19 물리 오프라인 |
| 6 | 실행 명령 | E1 명령, AI-19 `ai19_probe.py --mode physical-offline` |
| 7 | 증거 경로 | [base-kpi-a-local-20261027.json](base-kpi-a-local-20261027.json), [AI-19](../w6-a-ai19-offline/ai19-final-assessment.md), [W7 시연 준비](w7-demo-readiness.md) |
| 8 | 관측 결과 | BASE seed: W4 Epoch 1 receipt 2건. Offline: AI-19 PASS. BASE 연속 10회: **2/10 VALID** |
| 9 | FAIL/SKIP/미실행 | BASE KPI 미달. LOCAL: main의 `LOCAL_HARDHAT_FALLBACK`은 **브라우저 시뮬레이션 원장**이며 실제 Hardhat 31337 노드 검증 경로 없음 → 실제 LOCAL 3회 불가. RECORDED_READY=false |
| 10 | 남은 조건 | LOCAL tier 범위 결정(SYNTHETIC_LOCAL로 명시 사용 권고), 녹화본, BASE 반복 안정화 |
| 11 | 권고 판정 | **PARTIAL** |
| 12 | 팀장 확정 | 미확정 |

### E7 — Data Card / Model Card / README / Evidence 정합

| # | 항목 | 내용 |
|---|---|---|
| 1 | Gate | E7 |
| 2 | 요구조건 | 카드 수치가 원본과 같고 README·증거와 상태가 일치 |
| 3 | Owner | A |
| 4 | source SHA | (4차) `jujinho` W6 커밋(main 미병합) |
| 5 | 실행 환경 | 문서 대조, 링크 검사 |
| 6 | 실행 명령 | 링크·민감정보 스크립트(Closeout §5). 4차: 링크 대상이 main·A·T·F 원격 또는 A 커밋에 있는지까지 검사 |
| 7 | 증거 경로 | [data-card.md](../../data-card.md), [model-card.md](../../model-card.md), [Closeout §5](README.md) |
| 8 | 관측 결과 | 수치 대조 일치(main `metrics.json`·`epoch_log.json`·Manifest·`threshold-rationale.md`), 링크 깨짐 0 |
| 9 | FAIL/SKIP/미실행 | main 미병합. `ai/README.md`(10/18 기준) W6 미반영. T 문서 `w6-t-integration-evidence-20261028.md`가 없는 파일명 `w6-w7-t-execution-receipt-20261027.md`를 원본으로 표기 |
| 10 | 남은 조건 | A PR, T/F 증거 반영 후 상태 재정합 |
| 11 | 권고 판정 | **PARTIAL** |
| 12 | 팀장 확정 | 미확정 |

### E8 — 5-Beat 시연·Fallback·리허설

| # | 항목 | 내용 |
|---|---|---|
| 1 | Gate | E8 |
| 2 | 요구조건 | 5개 Beat가 신규 개발 없이 시연 가능하고 Fallback·8분 리허설이 확인됨 |
| 3 | Owner | 전원(A 주관) |
| 4 | source SHA | main `efce466d` + A AI-19 |
| 5 | 실행 환경 | — |
| 6 | 실행 명령 | — |
| 7 | 증거 경로 | [W7 시연 준비](w7-demo-readiness.md) |
| 8 | 관측 결과 | Beat 1(AI 추론)·2(VALID)·3(HASH_MISMATCH)·4'(proof 변조) 근거 있음 |
| 9 | FAIL/SKIP/미실행 | Beat 5 원본 없음, 녹화 없음, 리허설 0회 |
| 10 | 남은 조건 | 리허설 1회 이상(시간 기록), 녹화본, Beat 5 원본 |
| 11 | 권고 판정 | **PARTIAL** |
| 12 | 팀장 확정 | 미확정 |
