# W6 T 통합 증빙 색인 - 2026-10-28 KST

## 대상 및 기준

| 항목 | 값 |
| --- | --- |
| T 담당 | 설경민 |
| 증빙 기준 main | `efce466df24c916fb2be1bf075176137fd4c4332` |
| F 독립 승인 SHA | `1620f82c6cf523d7796273f7f816ed022e50953f` |
| 범위 | W6 T 실행 영수증, SEC-W5-01 회귀, RPC 독립 리뷰 |

이 브랜치는 제품 코드, W4 원본 증거, TrustProfile, 정책, LOCK, TEST, 체인 상태를 바꾸지 않는다. 신규 chain transaction이나 RPC 최적화 코드는 포함하지 않는다.

## 제출 증빙

| 증빙 | 결과 | 원본 문서 |
| --- | --- | --- |
| W6 T 실행 영수증 | PARTIAL: T 단독 범위 완료, 팀 Exit 아님 | `w6-t-execution-receipt-20261027.md` |
| SEC-W5-01 Windows no-create 회귀 | PASS: writable callback은 `UNSUPPORTED` | `w6-t-execution-receipt-20261027.md` |
| F W6 CI-isolation 독립 리뷰 | APPROVED: `1620f82` 한정 | `w6-t-review-nohyusin-1620f82-20261028.md` |
| RPC 안정화/최적화 독립 리뷰 | BLOCKED: 최적화 원본은 별도 브랜치 | `w6-t-rpc-independent-review-20261027.md` |

## 완료와 미완료를 구분한 상태

- PASS: frontend 핵심 6 files/62 tests, backend 6 files/111 tests, RPC 관련 baseline 4 files/44 tests, W5 live Playwright desktop/mobile 30/30.
- PASS: W4 receipt 2건 `VALID`, proof mutation `INVALID_PROOF`, body mutation `HASH_MISMATCH`, 두 공개 RPC 차단 시 `RPC_UNAVAILABLE` 관측.
- PARTIAL: 동일 receipt 차단-해제 recovery는 desktop에서만 통과했으며 mobile은 100초 안에 결과 화면을 표시하지 못했다.
- NOT_MET: BASE 공개 RPC 10회 연속 성공.
- NOT_EXECUTED: physical mobile, 실제 Hardhat LOCAL, 신규 Base seed/transaction, 정책·LOCK·TEST 승인 접근.
- BLOCKED: `INVALID_PROOF`의 live RPC 재실측 및 별도 RPC 최적화 브랜치 독립 리뷰.

## 불변 경계

- W4 Epoch 1 evidence는 수정하지 않는다.
- TrustProfile, Event 중복 거부, Getter/transaction receipt 교차 검증, Merkle inclusion과 confirmation은 약화하지 않는다.
- BASE, SYNTHETIC_LOCAL, RECORDED는 같은 성공 증거로 합산하지 않는다.
- `PASS`, `PARTIAL`, `NOT_EXECUTED`, `BLOCKED`는 서로 대체하지 않는다.
