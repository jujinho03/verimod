# W6 T 실행 영수증 - 2026-10-27 KST

## 식별

| 항목 | 값 |
| --- | --- |
| 담당 | T / 설경민 |
| 코드 기준 | `efce466df24c916fb2be1bf075176137fd4c4332` |
| 실행 환경 | Windows, Node.js 22.14.0, local frontend/backend |
| 보안 경계 | 운영 DB, 키, raw text, salt, 신규 transaction, TEST 데이터에 접근하지 않음 |

이 문서는 로컬 실행 영수증이다. 팀 전체 W6 Exit, W7 release, 체인 송신, 제출, 타인의 완료를 증명하거나 승인하지 않는다.

## W6 실행 결과

| 작업 | 결과 |
| --- | --- |
| T0 / TEST-02 / MKL-04 | frontend canonical/hash/merkle/rpcLedger/verify/approvedProfiles: 6 files, 62 tests PASS |
| T1 / SEC-05, SEC-08 | backend protocol/epochs/trusted-confirmation/W4 freeze/manifest/Windows: 6 files, 111 tests PASS |
| T3 / SEC-W5-01 | PASS. Windows writable callback 자체는 `UNSUPPORTED` |
| T5 / DEMO-03 | BASE -> LOCAL -> RECORDED 전환 규칙·고지 문구: T 단독 준비 완료 |
| T6 / DEMO-07 | `npm ci`, backend typecheck, frontend production build: 완료 |
| 공개 Base 조회 | chain 84532, contract code, `publisher()`, `epochs(1)`: TrustProfile 및 W4 Epoch 1 값과 일치 |
| RPC baseline review | `rpcLedger`/`verify`/`merkle`/`approvedProfiles`: 4 files, 44 tests PASS |

## 브라우저 실행 결과

명령: `W5_LIVE_RPC=true npx playwright test -c playwright.w5.config.ts`

| 범위 | 결과 |
| --- | --- |
| desktop + mobile | 30/30 PASS |
| 두 공개 RPC 차단 | `RPC_UNAVAILABLE` 표시 확인 |
| public RPC receipt 2건 | `VALID` 확인 |
| Merkle proof 변조 | `INVALID_PROOF` 확인 |
| body mutation | `HASH_MISMATCH` 확인 |
| private package | 브라우저 로컬 처리 및 Core/Content 분리 확인 |

같은 receipt의 차단-해제 recovery는 desktop에서 통과했으나 mobile은 100초 안에 결과 화면을 표시하지 못했다. 이 항목은 PASS가 아니라 **T+F 공동 실측 대기**다.

## 미완료와 외부 의존성

- BASE 10회 연속 성공: NOT_MET.
- physical mobile 및 실제 Hardhat LOCAL: NOT_EXECUTED.
- 새 Base seed에는 비 Windows 환경, 서명/송신/DB 별도 승인이 필요하다. 없으면 W4 seed와 LOCAL/RECORDED fallback을 사용한다.
- F RPC 최적화 diff와 validation artifact는 별도 브랜치 독립 리뷰 대상이다.
