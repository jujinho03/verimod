# W6 T 독립 RPC 안정화 리뷰 - 2026-10-27 KST

## 상태

| 항목 | 상태 |
| --- | --- |
| 요청된 F 최적화 commit/artifact | 별도 로컬 브랜치 대상; 이 통합 증빙에는 포함하지 않음 |
| 기준 SHA | `efce466df24c916fb2be1bf075176137fd4c4332` |
| baseline | `rpcLedger`/`verify`/`merkle`/`approvedProfiles`: 4 files, 44 tests PASS |

따라서 RPC 최적화 자체의 승인이나 병합 리뷰는 **BLOCKED**다.

## 보존해야 하는 검증 경계

1. endpoint마다 Base Sepolia `84532` 및 승인 publisher를 검증한다.
2. `epochs(uint64)` getter root/count/protocol version을 검증한다.
3. deployment block부터 head까지 epoch Event 전체를 읽어 duplicate Event를 거부한다.
4. Event와 getter를 교차 검증하고 transaction receipt의 성공 status, `to`, block number/hash를 확인한다.
5. Merkle inclusion과 confirmation을 별도로 확인한다.

endpoint error/timeout은 fail-closed `RPC_UNAVAILABLE`이어야 하며 `VALID` 또는 tamper 상태로 바뀌면 안 된다. body mutation은 `HASH_MISMATCH`, rehash + 기존 proof는 `INVALID_PROOF`를 유지해야 한다.

## 경로 구분

| 경로 | 상태 |
| --- | --- |
| BASE_SEPOLIA_DEMO | CONDITIONAL: W4 공개 증거는 있으나 연속 안정성은 미달 |
| 실제 LOCAL_HARDHAT_FALLBACK | NOT_VERIFIED |
| 브라우저 SYNTHETIC_LOCAL | AVAILABLE, 설명용 전이 증거에 한정 |
| RECORDED | AVAILABLE, 실행 시각·seed·mode를 LIVE와 구분 |
