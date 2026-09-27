# ARCH-01: F → T 아키텍처 검토 자료

작성 노유신 / 검토 요청 대상 설경민. 전달용 초안이며 실제 전송·리뷰는 하지 않았다.

## 책임 경계

- F: Express routes, demo principal 검사, SQLite transaction/persistence, idempotency orchestration, API response, frontend, E2E.
- T: shared canonical/hash/Merkle/schema, TrustProfile, signer/sender/reconcile, LedgerReader, architecture/protocol review.
- A: I1·실제 추론·score semantics·taxonomy·policy/manifest 내용. 정책 parity는 A/F 공동 검증.

## 흐름과 원자성

principal+key 검증 → 멱등 소유권 확보 → A inference → 정책 → shared receipt 계산 → receipts/content_store/저장 응답 원자 commit → 응답.

같은 key를 받은 다른 실행은 기다린다. 소유 실행 종료/만료 시 단일 실행만 회수하고 옛 실행의 commit을 막는다. API 실패 후 DB에 receipt만 남거나 응답만 성공하는 부분 저장을 허용하지 않는다. 네트워크 추론을 긴 write transaction 밖에서 처리하는 방안을 검토한다.

freeze는 선택/정렬/id 할당/membership/root/count를 한 transaction으로 확정한다. T sender의 signed tx/hash/nonce를 먼저 저장하고 송신한다. restart/retry에서 chain epochs→receipt→tx 확인이 선행한다.

## 설경민 검토 항목

| 질문 | F 제안 / 필요한 결정 | 기한 |
|---|---|---|
| 현 I2/I3와 public wrapper가 맞는가 | receipt schema는 재정의하지 않음; wrapper만 검토 | FRZ-01 전 |
| uint64 epoch 저장 | 전체 범위·원자 증가 보장 표현 확정; JS Number 피함 | W2 migration 전 |
| freeze 재시도 대상 | 어떤 nonterminal epoch를 재사용하는지, 신규 batch 생성 조건 명시 | FRZ-01 전 |
| idempotency request hash | 검증된 입력 의미·원문 exact bytes·operation·버전 범위 결정 | FRZ-01 전 |
| 실행 소유권 | lease/timeout 수치, 회수 token, commit 재검사 확정 | FRZ-01 전 |
| APPEAL/REVIEW material | 누가 어떤 content material을 받는지; 원 소유자 salt reviewer 노출 금지 | FRZ-01 전 |
| 공개 bundle 시점 | proof/anchor 둘 다 null 또는 함께 존재; tx 미확정 표현 | FRZ-01 전 |
| public errors | HTTP/envelope, input vs model-output 오류 mapping | A+T, FRZ-01 전 |
| signer DB interface | signed tx durable commit 완료 후 broadcast, 복구 소유 경계 | W4 전 |
| TrustProfile | Base confirmation 미확정; 내장 승인과 표시 목록 분리 | T 결정 |

## 리뷰 통과 증거

리뷰어·날짜·관련 commit/PR·결정·수정사항을 기록한다. 현재 모두 미확인. 팀 리뷰 완료로 간주하지 않는다. 주요 의존성이 막히면 즉시 공유하고 48시간 기다리지 않는다.
