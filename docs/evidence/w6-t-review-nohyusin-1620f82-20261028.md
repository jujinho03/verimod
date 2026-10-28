# W6 T 최종 독립 리뷰 - nohyusin `1620f82`

리뷰일: 2026-10-28 KST  
리뷰 SHA: `1620f82c6cf523d7796273f7f816ed022e50953f`  
비교 기준: `5bcfe0a23eb5769507a7306930a0d2f14333ad30`

## 최종 판정: APPROVED

이전 CHANGES_REQUESTED 사유가 해소됐다. 기본 Playwright 설정은 `w5.spec.ts`, `w6.spec.ts`, `w6-rpc-recovery.spec.ts`를 모두 제외한다. public RPC, route-abort, 장시간 recovery를 요구하는 수동 W6 실측은 전용 config/script로만 실행되고 기본 CI의 deterministic 범위에 포함되지 않는다.

## 확인한 diff와 테스트

- `5bcfe0a..1620f82` 제품 diff는 `frontend/playwright.config.ts` 한 파일이다.
- `testIgnore: ['w5.spec.ts', 'w6.spec.ts', 'w6-rpc-recovery.spec.ts']`가 추가됐다.
- `rpcLedger.ts`, TrustProfile, verifier, Event/Getter/transaction receipt 검증, Merkle 구현과 W4 evidence tree는 이 수정에서 바뀌지 않았다.
- GitHub Actions #40624104922: completed/success, workflow SHA는 `1620f82`와 일치. frontend/backend/contracts job 모두 success.
- T baseline: `rpcLedger`/`verify`/`merkle`/`approvedProfiles` 4 files, 44 tests PASS.

## 보존한 경계와 미완료 조건

- W4 receipt digest/receipt hash 보존, 두 승인 RPC route abort는 `RPC_UNAVAILABLE`, body mutation은 `HASH_MISMATCH`로 분리한다.
- `INVALID_PROOF` live RPC 미관측은 BLOCKED/SKIP으로 유지한다.
- TrustProfile, chain ID, publisher, `epochs()` getter, full-range duplicate Event, transaction receipt, canonical block, confirmation, Merkle inclusion 경계는 약화하지 않는다.
- BASE 10회 연속 성공은 NOT_MET; recovery 반복 안정성은 PARTIAL; mobile emulation recovery와 physical mobile은 PASS가 아니다.
- 실제 Hardhat LOCAL은 NOT_VERIFIED. RPC 최적화 브랜치는 별도 리뷰 대상이며 이번 승인에 포함하지 않는다.

이 APPROVED는 `nohyusin` W6 evidence/CI-isolation 변경분에 한정하며, 새 chain 송신, 정책/LOCK/TEST, release tag/submission을 승인하지 않는다.
