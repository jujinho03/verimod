# W6 F / Service 실행 기록

기준일: 2026-10-27 KST

담당: 노유신(F)

실행 기준: `efce466df24c916fb2be1bf075176137fd4c4332` (`origin/main`)

로컬 브랜치: `nohyusin` (W5 F head에서 위 main까지 fast-forward, 원격 push 미실행)

## 범위와 금지선

W6의 F 범위만 수행했다. 기존 W5 UI를 재구현하지 않았고, 승인되지 않은 정책 로딩, LOCK, TEST 접근, 실제 체인 송신, 실제 운영 DB 변경, Windows writable callback 완화는 수행하지 않았다. W4 공개 증거 디렉터리의 Git tree는 실행 전후 모두 `1911f46c9e19000d25a7ffb5f86f1c2ba781a1ee`이며 변경 파일은 0개다.

## F 티켓 결과

| 작업 | 판정 | 실제 결과 |
|---|---|---|
| F0 / FE-03·FE-07·Manifest·권한·멱등 재검증 | PASS | Frontend 250/250 PASS. Backend 153 PASS, 53 SKIP. Windows callback SKIP을 PASS로 계산하지 않았다. |
| F1 / TEST-01·TEST-03 증거 계층 분리 | PARTIAL | W4 역사적 Base 증거와 W6 신규 실행을 분리했고 W4 tree 불변을 확인했다. 이번 F 호스트에서 새 AI inference·Receipt·Epoch·tx는 만들지 않았다. |
| F2 / FE-04 동일 W4 seed 공격 | PARTIAL | 실제 브라우저에서 `VALID`와 body 변경 `HASH_MISMATCH`를 관측했다. body 재해시 후 기존 proof의 `INVALID_PROOF` 실측은 공개 RPC 연속 불가로 BLOCKED. W4의 역사적 INVALID_PROOF를 신규 W6 PASS로 재분류하지 않는다. |
| F3 / FE-05·06 상태·모드 분리 | PASS | Base Sepolia, L2 confirmed/L1 finality 경계, `RPC_UNAVAILABLE`/변조 상태, 단계별 Core 상태가 화면에서 분리됨을 캡처로 확인했다. Manifest 원문 부재는 기존대로 NOT_CHECKED다. |
| F4 / 실제 RPC 장애·복구 | PARTIAL | `20261027-1740-efce466d` Desktop Chromium에서 동일 입력 SHA-256 `0b73aa52...f52235`로 `VALID → RPC_UNAVAILABLE → VALID` 1회 PASS(초기/복구 재시도 0). 두 승인 endpoint 모두 실제 route 차단됨을 확인했다. 이후 반복에서는 공개 endpoint rate-limit/불가로 복구가 3회 연속 막혀 안정적 10회 KPI는 미충족이다. |
| F5 / 실기기 Mobile QA | NOT_EXECUTED | 실기기 증거가 없다. W5의 Mobile emulation 12 PASS는 역사적 결과일 뿐 실기기 PASS가 아니다. |
| F6 / 신규 정책 로딩 | BLOCKED | X/B 팀장 승인, A/F 계약 확정, signed Manifest, parity, fail-closed 선행조건이 없다. W4 provisional 경계를 유지했다. |
| F7 / 데모·폴백 준비 | PARTIAL | W6 전용 Desktop 브라우저 회귀와 별도 증거 경로를 추가했다. Tier 1 Base 실측은 확보했지만 LOCAL 3회와 RECORDED 전환은 이번 실행에서 새로 검증하지 않았다. |
| F8 / 공동 SERVICE QA·DEMO-08 | BLOCKED | T 독립 검토와 A 공동 200초 시연, BASE 10회/LOCAL 3회 KPI는 아직 수행하지 않았다. |

## 실행 결과

- Frontend unit: 23 files, 250 tests PASS.
- Frontend build/typecheck/lint: PASS. lint는 기존 `no-unsafe-optional-chaining` warning 2건이며 error는 0건이다.
- 기본 Playwright protocol browser: 1/1 PASS(ReceiptBody regression matrix 20/20).
- Backend unit (localhost 허용 환경): 12 files, 153 PASS, 53 SKIP, 0 FAIL. 53 SKIP은 Windows writable callback UNSUPPORTED 경계다.
- Backend typecheck/build: PASS.
- W6 actual browser: 성공 run에서 장애·복구 1 PASS, 이후 rehash 케이스 1 FAIL 및 Mobile 2 NOT_RUN. 실패 원인은 제품이 RPC 장애를 `INVALID_PROOF`로 위장하지 않고 `RPC_UNAVAILABLE`로 닫은 것이다. 전용 W6 spec은 기본 browser config와 분리했다.
- 민감정보·원문·salt·키 공개: 0건. 실제 tx 송신: 0건.

로컬 원본 스크린샷·Playwright JSON은 Git 제외 경로 `private-data/w6-f-browser/20261027-1740-efce466d/`에 보존한다. 공개 가능한 요약은 `docs/evidence/w6-f/20261027/`에 있다.

## W6 Exit 기여 판정

- E1: PASS(역사적 W4 증거 불변), W6 새 AI→tx 실행은 NOT_EXECUTED.
- E2: PARTIAL(`VALID`, `HASH_MISMATCH` 신규 관측; rehash `INVALID_PROOF` 신규 실측 BLOCKED).
- E3: PARTIAL(장애·복구 1회 실제 PASS, 반복 안정성 실패).
- E4: BLOCKED(변경은 로컬이며 신규 remote SHA/CI 없음).
- E5: PARTIAL(privacy/no-create 경계와 회귀 보존, T 공동 리뷰 대기).
- E6: PARTIAL(Base만 신규 실측; LOCAL/RECORDED 신규 실행 없음).
- E8: BLOCKED(W7용 동결 후보와 3인 리허설 미실행).

W7에는 이 미완료 기술 작업을 자동 이월하지 않는다. 11/01 Exit에서 PARTIAL/BLOCKED와 fallback을 확정해야 한다.
