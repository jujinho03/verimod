# Backend Architecture — W1 초안

상태: **WORKING ASSUMPTION**. 소유: PROTOCOL 설계, SERVICE 구현. 현재 backend는 health endpoint 뼈대이며 아래 구조는 구현 완료가 아니다.

## 모듈 경계

| 모듈 | 책임 | 소유 |
|---|---|---|
| AI adapter / policy | inference 결과를 I1 형식으로 만들고 action을 결정 | AI |
| receipt service | I1 검증, canonical body/hash 생성, immutable receipt 발급 | SERVICE |
| persistence | receipts, content_store, epochs, members, appeals, reviews, idempotency records의 제약 강제 | SERVICE |
| epoch freezer | pending receipt를 결정적으로 정렬, root/proof를 산출하고 원자적으로 FROZEN 생성 | SERVICE |
| anchor sender / reader | 동결 epoch 송신, event/receipt 확인, reconcile, TrustProfile 기반 읽기 | PROTOCOL |
| browser verifier | body/hash/proof를 재계산하고 내장 TrustProfile로 직접 대조 | SERVICE + PROTOCOL |

## 원자성·멱등성

발급은 receipt, content store, idempotency 결과 참조를 하나의 DB transaction으로 기록한다. 같은 `(principal, operation, Idempotency-Key, request_hash)` 재시도는 동일 receipt ID와 salt를 반환하고, 같은 key에 다른 request hash는 `409 IDEMPOTENCY_CONFLICT`다.

freeze는 대상 receipt의 선택, 결정적 정렬, member 저장, root/count 계산, epoch 생성과 receipt의 frozen 연결을 하나의 transaction으로 처리한다. receipt는 최대 하나의 frozen epoch에만 속한다. 원 receipt body/hash는 UPDATE/DELETE로 변경하지 않는다.

## 앵커 상태기계와 복구

`FROZEN → SUBMITTING → SUBMITTED → CONFIRMED`, 또는 `FAILED`만 허용한다. 서명된 raw transaction, tx hash, nonce는 송신 전에 저장한다. 재시도 전과 서버 시작 시 `reconcile(epoch)`가 chain의 `epochs(epochId)`를 먼저 확인한다.

- 같은 root가 이미 온체인에 있으면 재송신 없이 상태를 갱신한다.
- 다른 non-zero root면 `FAILED(ROOT_CONFLICT)`로 만들고 덮어쓰지 않는다.
- 등록이 없고 tx가 유실/미송신이면 같은 signed raw transaction을 재송신한다.
- mined revert는 `FAILED(REVERTED)`다.

개인키는 DB·로그·signed transaction에 저장하지 않는다. signed transaction은 개인키가 아니다.

## 에러 처리

AI timeout/unavailable은 HTTP 503 `INFERENCE_UNAVAILABLE`이며 DECISION을 발급하지 않는다. RPC failure는 verifier에서 `RPC_UNAVAILABLE`/PENDING이지 hash tampering이 아니다. API 오류는 사용자에게 원문·salt·비밀키를 echo하지 않는다.

