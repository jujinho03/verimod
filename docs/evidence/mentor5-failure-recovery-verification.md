# Mentor 5 — 장애와 복구 검토

`frontend/e2e/w7-w4-shortcut.spec.ts`는 W4 공개 사본에 대해 승인된 두 RPC 요청을 Playwright `route.abort('internetdisconnected')`로 차단한다. 이는 브라우저 요청의 통제된 차단이며 PC의 물리적 인터넷 단절이 아니다. 본문만 변경하면 RPC 요청 없이 `HASH_MISMATCH`, 본문과 해시를 함께 변경하면 `RPC_UNAVAILABLE`이어야 한다. 원본 복원, 입력 및 프로필 변경은 이전 결과를 지운다. 추가 회귀는 장애 시 포함 증명이 미실행으로 표시되고, 지연된 RPC 실패가 입력과 프로필 변경 후 화면을 덮어쓰지 않는지 검사한다.

`useVerify`의 sequence 번호는 새 실행 또는 clear 뒤 늦은 결과의 표시를 억제한다. 이는 기존 네트워크 요청을 취소한다는 뜻이 아니다. 24초 전체 검증 시간 예산과 모든 비동기 요청의 중단은 이 변경으로 구현되지 않았다. 24초를 성공 보장으로 해석하지 않는다.

`frontend/e2e/w6-rpc-recovery.spec.ts`는 실제 공개 RPC 검증 → 두 endpoint의 통제된 차단 → 공개 RPC 재시도를 수행하는 별도 테스트다. 이 테스트가 실제 실행되어 성공한 경우에만 현재 공개 RPC 복구 성공이라고 말할 수 있다. 합성 원장은 공개 RPC 검증의 자동 대체가 아니며 역사적 W4 사본을 보여주는 것은 현재 검증 성공이 아니다. 테스트 명령과 실행 상태는 개발 결과 요약을 따른다.

2026-11-02 `npx playwright test --config=playwright.w7-w4-shortcut.config.ts`: **PASS**, 5개 테스트, SKIP 0. 이는 통제된 차단 회귀다. 실제 공개 RPC 복구 테스트는 이 결과로 증명되지 않으며 실행 상태는 개발 결과 요약을 따른다. 네트워크 취소·24초 제한은 **SKIP**이며 기능이 존재한다고 주장하지 않는다.

전체 브라우저 최초 실행 중 W4 프로필 전환 직후의 비동기 변조 입력이 이전 프로필의 늦은 effect에 의해 무효화되어 기대한 `HASH_MISMATCH` 대신 원본의 `RPC_UNAVAILABLE`이 나온 사례가 1회 **FAIL**이었다. `VerifyPage`의 프로필 변경 무효화를 사용자 상호작용 전에 실행되는 layout effect로 옮긴 후 해당 기존 회귀 5회 반복 **PASS**. 이후 `npm run test:browser` 재실행은 프로토콜 1건, mocked LIVE 1건, W4 차단 회귀 5건으로 **7 PASS / 0 FAIL / 0 SKIP**이다. `w7-check-live`는 통제된 API 응답을 사용하는 브라우저 테스트이며 실제 모델 호출이나 공개 RPC 복구 실측이 아니다.
