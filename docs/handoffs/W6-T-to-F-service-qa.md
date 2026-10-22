# W6 T→F 인계 — SERVICE QA 대기 항목

작성일: 2026-10-22. F 시험기간으로 W5 공동 SERVICE QA를 W6 대기열로 이월한다. 이 문서는 F 구현이나 QA 완료 승인이 아니다.

## T 제공물

- 현재 T 작업 기준: branch `seolkyeongmin`, base HEAD `54caa97ea1fa22eae2827aa24c189bcbe5e47c03` (이 인계 작성 뒤의 local commit은 closeout에서 별도 기록).
- frontend 회귀: 20 files / 202 tests PASS; production build PASS.
- RCPT-05: `frontend/src/domain/verify.ts`의 `transitionProblem`과 `verifyReceipt`.
- fixture: `frontend/src/domain/verify.test.ts`의 synthetic `DECISION → APPEAL → REVIEW`; W4 공개 frozen handoff의 receipt 두 건은 `docs/handoffs/w4-frozen-epoch-public/20261017-r01/`.
- 공개 anchor evidence: [W5 TEST-05](../evidence/w5-t-test-05-20261022.md).

## F가 소비할 상태 계약

| 조건 | Core | Lifecycle | UI/QA 기대 |
| --- | --- | --- | --- |
| trusted receipt + proof + confirmed anchor | VALID | 기록 종류에 따라 NOT_CHECKED 또는 PASSED | Core VALID와 lifecycle label을 별도 표시 |
| subject/previous bundle 누락 | core 결과 유지 | INCOMPLETE_HISTORY | 완전한 이력이라고 표시 금지 |
| 선행 anchor pending 또는 RPC unavailable | PENDING_ANCHOR/RPC_UNAVAILABLE | NOT_CHECKED | 무결성 FAIL/변조로 표시 금지 |
| hash/transition/issuer/content mismatch | 해당 core FAIL 또는 core 결과 유지 | FAILED | 실패 이유를 정확히 표시 |
| local/mock ledger | local 결과 | synthetic 검사 결과 | BASE_VALID 또는 공개 체인 증거로 표시 금지 |

`issuer_seq` 검사는 제공된 synthetic 연결에서 명백한 역순·중복만 거부한다. 그것은 전역 이력의 완전성, 가장 최신 REVIEW, 숨은 분기 부재를 보장하지 않는다.

## W6 F 및 공동 QA 대기 목록

| 항목 | 책임 | PASS 조건 |
| --- | --- | --- |
| FE-03 Synthetic timeline | F | DECISION→APPEAL→REVIEW, SYNTHETIC/LOCAL/BASE 출처가 명확하고 실제 사람 심사를 단정하지 않음 |
| FE-07 Private Receipt Package | F | package_version/receipt_id/original_text/content_salt/content_commitment을 검증하고 Core/Content 상태를 분리 |
| SEC-03 authorization/idempotency | F | 실제 존재하는 role/principal·403/409·Idempotency-Key·복구에 대한 구현 기반 회귀 |
| verifier UX | F | RPC_UNAVAILABLE/PENDING/무결성 실패 및 L2 confirmed/L1 finality 표현을 구별 |
| device QA | T/F | 모바일·데스크톱에서 위 상태가 재현되고 실제 공개 RPC와 stub을 분리 |

Private Package QA는 원문·salt·사설 token·운영 DB 경로·키를 bundle, browser log, screenshot, Git에 출력하지 않는다. 실제 Package가 준비되기 전에는 fixture/stub와 명확히 분리한다.

## 우선순위 충돌

W6의 기존 TEST-02/MKL-04/SEC-05·08/SEED-01이 먼저 확정된 MUST다. 이 공동 QA는 F 가용성과 실제 Package/UX 구현 뒤에만 수행하며, T가 F 구현을 선행 대행하지 않는다.
