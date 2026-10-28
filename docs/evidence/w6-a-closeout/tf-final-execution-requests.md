# W6 T/F 최종 실행 요청 (팀장 전달용)

작성: A / 주진호 · 2026-10-27 KST · **자동 발송하지 않음.** 팀장이 복사해 전달한다.
(이 문서는 같은 날 작성한 `tf-dependency-requests.md`를 대체한다. 그 내용의 ticket 표는 [3인 통합 감사](w6-three-owner-integration.md)로 옮겼다.)

이미 끝낸 실행을 다시 시키지 않는다. 미제출 원본과 미완료 조건만 요청한다. 기한은 **11/01(토) 18:00 KST**를 제안한다(21:00 Exit 판정 전 A 대조 시간 확보).

## T(설경민)에게

> 경민님, 10/27 W6 결과 보고 감사합니다. 지금 원격 `seolkyeongmin`은 `cd5b1c53`(10/23)이라서 보고하신 결과를 A가 원본으로 확인하지 못했고, 현재 Exit 표에는 LOCAL_REPORTED로만 올라가 있습니다. 11/01 18:00까지 아래를 `seolkyeongmin`에 push해 주세요(push 승인은 제가 따로 드립니다).
>
> 1. **W6-T 원본:** `docs/progress/W6-T.md`, `W7-T.md`와 실행 로그. 각 결과마다 커밋 SHA, OS, 실행 명령, 시작·종료 시각을 적어 주세요. Frontend 62개·Backend 111개가 **어느 파일**인지 목록이 필요합니다(TEST-02/MKL-04, SEC-05/08 대응 판단용).
> 2. **브라우저 30/30 보고서:** Playwright JSON(`stats`의 expected/skipped 포함). live 테스트는 RPC가 안 되면 테스트 안에서 skip되므로 0 SKIP을 보고서로 확인해야 합니다. 오늘 제 PC에서 같은 live 테스트를 10회 돌렸을 때 8회가 skip이었습니다.
> 3. **SEC-W5-01 부정 검증 8종:** 삭제 경쟁·교체·identity·symlink/reparse·미승인 DB·header/schema·no-create·durability 각각에 대응하는 테스트 이름과 assertion 위치. main에는 교체와 symlink/reparse 테스트가 보이지 않고, identity·미승인 DB·durability는 Windows에서 skip됩니다. 없는 항목은 "미구현"이라고 적어 주시면 됩니다.
> 4. **Mobile 복구 100초 timeout 원인:** 실패한 실행의 네트워크 로그(RPC별 HTTP 상태코드·응답시간). 참고로 검증 1회가 배포 블록부터 현재까지 10,000블록 단위로 `eth_getLogs`를 순차 호출해서, 오늘 제 실측에서 1회에 114~578건 호출, 성공 1회 약 48초가 걸렸습니다. 같은 원인인지 확인 부탁드립니다. Mobile은 viewport emulation이므로 실기기라고 쓰지 않습니다.
> 5. **LOCAL 실행 3회:** main의 `LOCAL_HARDHAT_FALLBACK`은 브라우저 시뮬레이션 원장이라 실제 Hardhat 31337 노드를 읽지 않습니다. 시뮬레이션 원장으로 3회 실행한 결과를 "SYNTHETIC_LOCAL"로 기록해 주시거나, 실제 Hardhat 경로가 따로 있다면 명령과 결과를 주세요. 새 기능 개발은 하지 않습니다.
> 6. **3단 Fallback(DEMO-03):** BASE→LOCAL→RECORDED 전환 조건과 순서, 녹화본 존재 여부(없으면 없다고).
> 7. **F `frontend/e2e/w6.spec.ts` 독립 리뷰:** F가 push하면 RPC 차단 방식(브라우저 interception인지), 같은 receipt hash 유지 여부, 계약 변경 여부를 리뷰 코멘트로 남겨 주세요.
>
> SEED-01 실제 송신, 새 Epoch, Windows writable callback 활성화는 별도 승인 전에는 하지 말아 주세요.

## F(노유신)에게

> 유신님, 10/27 W6 결과 보고 감사합니다. 보고하신 로컬 커밋 `b72720d8`은 GitHub에서 조회되지 않아(No commit found) 아직 원본을 확인하지 못했고, 현재 Exit 표에는 LOCAL_REPORTED로만 올라가 있습니다. 11/01 18:00까지 아래를 준비해 `nohyusin`에 push해 주세요(push 승인은 제가 따로 드립니다).
>
> 1. **`b72720d` 실제 diff와 민감정보 검사 결과:** 변경 파일 목록, 원문 입력·salt·private package·키·사설 IP·개인 경로가 없는지 확인한 결과.
> 2. **`docs/evidence/w6-f/20261027/validation.json`·`README.md`, `docs/progress/W6-F.md`, `frontend/e2e/w6.spec.ts`.**
> 3. **LIVE RPC 동일 Receipt 복구 1회 성공 원본:** receipt_hash, 시각순 판정(VALID → RPC_UNAVAILABLE → VALID), 차단 방식(page.route 등), 실행 명령, 시작·종료 시각, 브라우저. 중간에 fixture나 새 receipt로 바꾸지 않았다는 근거가 필요합니다.
> 4. **반복 Recovery 실패 원인:** 실패 회차의 RPC별 HTTP 상태코드·응답시간. `rpcLedger.ts`가 10,000블록 단위로 순차 조회해 호출 수가 많은 점(제 실측 114~578건)이 원인인지 확인 부탁드립니다. 코드 수정이 필요하면 범위·보안 영향을 먼저 공유해 주세요(T 리뷰, 11/04 동결 전).
> 5. **rehash INVALID_PROOF:** body 변경 후 receipt_hash를 재계산하고 기존 proof/anchor를 유지한 입력으로 1회 실행한 결과, 또는 RPC_UNAVAILABLE로 막힌 회차 로그(BLOCKED 증거). 참고로 proof sibling 변조 INVALID_PROOF는 제 PC에서 1회 PASS했지만 다른 시나리오라 대체하지 않았습니다.
> 6. **BASE 10회 KPI:** 같은 W4 receipt로 연속 10회, 회차별 결과·소요·시각. 오늘 제 PC 결과는 2/10이었습니다([요약](base-kpi-a-local-20261027.json)). 성공 횟수만 세지 말고 연속 여부를 그대로 적어 주세요.
> 7. **Mobile:** emulation 결과와 물리 기기 실행 여부를 분리해 주세요(물리 기기를 안 했으면 NOT_EXECUTED 유지).
> 8. **W6 E2E·빌드 증거:** frontend 250/250·build·typecheck·lint, backend 153 PASS / 53 SKIP의 실행 로그와 SHA. 53 SKIP은 그대로 SKIP으로 둡니다.
>
> 연구 정책 로딩(F2)은 S1 승인 전 착수하지 않습니다. LOCK/TEST/송신/운영 DB 변경도 하지 않습니다.
