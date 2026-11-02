# Mentor 5 — 변조 사본 공개 RPC 검증

**PASS — 실제 공개 RPC `INVALID_PROOF` 1/1.** 이는 정상 입력의 VALID 기준 측정과 별개의 실행이며, 10회 연속 성공 근거가 아니다. [요청별 원시 기록](mentor5-rpc-invalid-proof.json).

- 시각: 2026-11-02T01:47:18.575Z, Windows 11 / Node.js v24.10.0, Base Sepolia chain ID 84532. RPC·도메인 검증 구현은 `7a6aa2ad27ad58d0454b39f28a07d069ac4e93b1`과 동일하다.
- 기존 `frontend/scripts/w6-rpc-audit.mts`의 `INVALID_PROOF` 시나리오는 W4 receipt-0 번들을 메모리에서 복제하고 본문 `policy.action`을 변경한 뒤 `receipt_hash`를 재계산한다. 기존 proof와 anchor는 그대로 사용한다. 공개 원본은 쓰지 않는다.
- 단 1회, 메서드 allowlist(`eth_chainId`, `eth_call`, `eth_blockNumber`, `eth_getLogs`, `eth_getTransactionReceipt`)만 사용했다. 429/413 이후 추가 네트워크 요청을 막는 임시 guard를 감사 스크립트 사본의 `measuredFetch`에 추가했다. 429/413이 없었으므로 guard는 발동하지 않았다. fallback 정책은 기존 구현과 같다. 추가 시도나 온체인 송신은 없다.
- 실행 명령: frontend 디렉터리에서 `W6_RPC_AUDIT_SCENARIO=INVALID_PROOF`, `W6_RPC_AUDIT_ATTEMPTS=1`, `W6_SOURCE_HEAD=7a6aa2ad27ad58d0454b39f28a07d069ac4e93b1`, `W6_RPC_AUDIT_RUN_ID=mentor5-invalid-proof-20261102` 환경 변수와 함께 `node ../backend/node_modules/tsx/dist/cli.mjs scripts/mentor5-rpc-invalid-proof-temporary.mts`를 실행했다. 사본에는 응답 상태가 429 또는 413이면 `stoppedForRateOrSize = true`로 설정하고, 다음 `measuredFetch` 호출 시작 시 해당 플래그를 검사해 네트워크 요청 전에 예외를 던지는 guard를 추가했다. 실행 후 임시 스크립트는 삭제했다.
- 원시 JSON에는 공개 endpoint host, 메서드, 요청 시각·응답 상태·크기·지연 및 범위, 공개 receipt hash만 보존한다. 비밀 RPC URL·인증 토큰·비공개 데이터는 포함하지 않는다.
- 결과: `INVALID_PROOF`, 전체 28,353ms, 요청 222건(`eth_chainId` 111, `eth_call` 2, `eth_blockNumber` 2, `eth_getLogs` 106, `eth_getTransactionReceipt` 1). publicnode HTTP 200 222건, backup 호출 0건, HTTP 429·413·timeout 각각 0건. 요청 지연 평균 126.88ms, 중앙값 88ms, p95 nearest-rank 378ms, 최대 647ms.
- 원본 W4 파일 SHA-256은 읽을 때와 실행 후 모두 `a389ec1547f76124b136e5648e9d906e5a22eb3099deff8b4a733f2c03282f72`이다. 원본 receipt hash `0x96684f068edaaec7b2ae8abafdaae40c90c118f2d7bede9e4b0dec2278eed3b6`, 변경 사본 hash `0xe61eb203e0c3b9392668526c4fa80d019e2cb178fec8683fbfc464cd45ad0bf0`이다.

이 실행은 정상 공개 RPC 응답을 얻은 뒤 기존 proof가 변경된 receipt hash에 맞지 않음을 확인한다. RPC 장애 조건에서 같은 입력은 원장 조회 전에 proof 판정을 할 수 없으므로 `RPC_UNAVAILABLE`이어야 한다. 실행 소요는 24초를 초과했으며 다음 실행에 대한 시간 보장은 없다. 본 실행은 성능 최적화 전후 비교가 아니다.
