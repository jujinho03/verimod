# API-00: API·DB 계약 초안

담당 F 노유신 · 리뷰 T 설경민 · 상태 TARGET / PROPOSED · 2026-09-27

근거: PDF pp.8, 25, 29, 31–33, 39–44, 46. 코드 대조 기준은 no_usin/main 공통 commit f807585dae3930e8c249c5975d0d4cb88b060cb4다. 기존 docs/04-interface-contract-draft.md 및 docs/02-decision-register.md를 확인했다. D01~D17은 기존 등록부의 ADOPTED, D18~D28은 WORKING ASSUMPTION을 유지한다. 아래 계약은 구현 완료/팀 승인 주장이 아니다. 경로·역할·불변식은 PDF TARGET을 옮겼고, PDF에 없는 transport 세부값은 PROPOSED로 표시했다. ReceiptBody를 새로 정의하지 않고 T 소유 schema를 참조한다.

## 1. API 표면: 업무 8개

| 경로 | 권한 | 입력 의미 | 성공 응답 의미 | 주요 오류 |
|---|---|---|---|---|
| POST /api/decisions | DEMO_USER | 원문, 동결 I1이 요구하는 입력; Idempotency-Key 필수 | 새 DECISION bundle + private_package material; proof/anchor=null | key 없음 400; 입력 4xx; 역할 403; 충돌 409; 추론 불가 503 |
| GET /api/receipts/:id | 공개 | receipt_id | body/hash와 현재 표시 상태; 원문/salt 제외 | 없음 404(제안) |
| GET /api/receipts/:id/bundle | 공개 | receipt_id | receipt_body/receipt_hash/proof/anchor | 없음 404(제안) |
| POST /api/appeals | 소유 DEMO_USER | 대상 DECISION 참조·이의 본문; 키 필수 | 새 APPEAL 영수증; 원 DECISION 불변 | 400/403/409, 허용 전이 밖 409 TRANSITION_NOT_ALLOWED |
| POST /api/reviews | DEMO_REVIEWER | 대상 참조·outcome·resulting_action·reason; 키 필수 | 새 REVIEW 영수증; terminal | 400/403/409 TRANSITION_NOT_ALLOWED 또는 IDEMPOTENCY_CONFLICT |
| POST /api/epochs/freeze | DEMO_OPERATOR | pending receipts를 원자적으로 선택/동결 | 동일 재시도는 동일 epoch id/root; anchor 요청 상태 | 403; 대기 0건 409 |
| GET /api/epochs/:id | 공개 | uint64에 해당하는 양의 10진 epoch id | id/root/count/5상태·있는 tx 정보·안전한 실패 사유 | 잘못된 id 400/없음 404(제안) |
| GET /api/manifests | 공개 | 없음 | model/policy/review manifest 원문·hash·표시용 profile | 실패 envelope; salt/비밀 설정 제외 |

기존 GET /api/health는 업무 8개에 포함하지 않는다. 새 Package endpoint, DSA export, 원문 조회 endpoint는 만들지 않는다. 공개 조회는 content_store를 join하지 않는다. signed raw tx·nonce 내부 운영 데이터는 공개 epoch 응답에 자동 노출하지 않는다.

### transport 제안: FRZ-01 전 확인

- 성공 envelope: `{ok:true, request_id, data:...}`. 오류: `{ok:false, request_id, error:{code,retryable}}`. I1의 envelope와 public Node 응답은 서로 다른 계층이다.
- 신규 발급 HTTP 201, 조회 200, freeze 접수 202를 제안한다. 멱등 재생은 최초 저장된 status/body를 그대로 반환한다. 확정 전 UI에 status code를 하드코딩하지 않는다.
- 구체 request JSON key, request size 제한, principal 전달 수단, request_hash 계산 규칙은 A/T 계약 및 기존 코드 대조 후 확정한다. 위 표의 '입력 의미'는 새 body 필드명이 아니다.
- 잘못된 JSON/필수 입력/key는 400, 역할/소유권 위반 403, 미존재 404를 제안한다. `IDEMPOTENCY_CONFLICT`, `TRANSITION_NOT_ALLOWED`, `INFERENCE_UNAVAILABLE` 외 오류 code 이름은 이 문서에서 신설하지 않는다.
- HTTP 503의 retryable과 내부 진단 코드 매핑은 실패 종류별로 검토한다. 추론 timeout/unavailable은 public `INFERENCE_UNAVAILABLE`, DECISION 0건을 보장한다. 잘못된 모델 출력도 임의 점수로 대체하지 않는다.
- 요청별 추적 로그는 request_id/operation/안전한 code 중심. 요청/응답 전체 및 raw headers를 기록하지 않는다.

## 2. 발급 응답과 Private Receipt Package

DECISION 발급 응답의 의미 구조:

```text
data
  bundle
    receipt_body: T의 동결 ReceiptBody
    receipt_hash: shared/ 계산값
    proof: null
    anchor: null
  private_package
    receipt_id
    content_commitment
    content_salt
```

위 data/bundle wrapper는 PROPOSED다. private_package의 3개 material 필드는 PDF p.40 기준이다. 서버는 original_text를 echo하지 않는다. salt/material은 인증된 발급 principal과 동일 principal의 멱등 재전송에만 제공한다. APPEAL/REVIEW에서 어떤 content material을 누구에게 제공하는지는 기존 I2 및 소유권 모델을 T와 확인해야 한다. reviewer 역할만으로 원 DECISION 소유자의 salt를 제공하지 않는다.

브라우저 저장 파일은 정확히 다음 5필드다: package_version, receipt_id, original_text, content_salt, content_commitment. package_version 실제 값은 동결 계약에서 확정한다. 브라우저는 보유 입력 원문과 발급 material을 조립하며 서버에 새 원문 echo/Package endpoint를 요구하지 않는다.

salt는 CSPRNG 32 raw bytes, lowercase hex 64자(0x 없음)로 표현하고 decode 후 길이를 검사한다. receipt별 신규 생성, 같은 멱등 결과는 같은 salt. 원문은 trim/NFC 등 정규화하지 않는다. commitment 계산은 shared/를 사용한다.

content 검증 순서: core 성공 → Package.receipt_id와 verified body 일치 → 원문+salt 재계산값과 verified body.content_commitment 일치 → Package의 commitment copy도 authority와 일치. 성공 PASSED, 불일치 FAILED, core 미성공/자료 없음 NOT_CHECKED. 세 값을 함께 조작해도 verified body를 기준으로 실패해야 한다.

## 3. bundle과 신뢰 경계

bundle fields: receipt_body, receipt_hash, proof, anchor. proof는 merkle_spec/leaf_index/tree_size/siblings, anchor는 chain_id/contract_address/epoch_id/tx_hash/block_number/block_hash를 사용한다. proof와 anchor는 둘 다 null이거나 함께 존재한다. 앵커 전에는 둘 다 null이며, 언제 공개 가능한 anchor를 조립하는지 T와 동결한다. body에 receipt_hash/proof/epoch/tx/확인 수/verified/workflow/원문/salt를 넣지 않는다.

승인된 빌드 내장 BASE_SEPOLIA_DEMO 또는 LOCAL_HARDHAT_FALLBACK이 authority다. bundle locator와 GET manifests의 프로필은 표시·조회 힌트다. chain id는 정수 의미로, address는 검증 후 소문자로 비교한다. Base min_confirmations는 미확정이며 과거 12를 자동 채택하지 않는다. LOCAL은 1이다.

## 4. SQLite 7테이블: 논리 계약

아래는 migration 전 논리 요구다. 신규 컬럼의 정확한 이름/타입은 T 리뷰 후 W2에서 확정한다.

| 테이블 | 저장 의미 | 제약·접근 |
|---|---|---|
| receipts | receipt_id, canonical body, hash, event, link, owner principal | hash UNIQUE; 원 body/hash 수정·삭제 API 없음; body와 조회 상태 분리 |
| content_store | 원문, salt, commitment, 접근 소유권 관계 | commitment UNIQUE; 비공개; 공개 read model과 분리 |
| epochs | id, root, count, status, signed tx, tx_hash, nonce, block, fail_reason | id 중복/0/재사용 금지; 미종결 tx 1개; 서명값 durable 선기록 |
| epoch_members | epoch와 receipt_hash 관계, leaf_index | receipt_hash UNIQUE; epoch 내 leaf_index도 유일하게 설계(제안) |
| appeals | original_receipt_hash, 이의 본문·commitment·상태 | original_receipt_hash UNIQUE; 비공개 이의 본문 |
| reviews | 대상, outcome, resulting_action, reason, reviewer, status | 대상당 UNIQUE; terminal 후 추가 발급 금지 |
| idempotency_records | principal, operation, idempotency_key, request_hash, 상태·저장 응답·실행 소유권 | UNIQUE(principal,operation,idempotency_key); request_hash는 별도 컬럼 |

appeals.original_receipt_hash는 DB 전용 이름이다. ReceiptBody link에는 subject_receipt_hash/previous_receipt_hash만 사용한다. reviews.status는 workflow이며 outcome과 혼동하지 않는다.

uint64 전체 범위를 JS Number/SQLite signed INTEGER로 무심코 변환하면 안 된다. bundle epoch_id는 10진 문자열이며 1부터 증가한다. 전체 uint64를 다룰 DB 표현·증가 방법은 T 검토 항목으로 남긴다. 비교·할당은 정수 의미로 하고 문자열 사전순을 사용하지 않는다.

## 5. V1~V12 불변식과 확인 방법

| ID | 계약 | 후속 검증 |
|---|---|---|
| V1 | 원 body/hash 변경·삭제 경로 없음; 새 receipt로 변화 | lifecycle 전후 원 row byte 동일 |
| V2 | receipt는 frozen epoch 최대 1개 | 병렬 freeze에서도 receipt_hash UNIQUE |
| V3 | freeze 한 DB transaction | 중간 오류 주입 시 멤버/root/count/id rollback |
| V4 | 동일 epoch 재시도는 동일 id/root | 반복 freeze 비교 |
| V5 | 재송신 전 epochs→receipt→tx 조회 | 같은 root 송신 0, 다른 root FAILED |
| V6 | 원 판정당 APPEAL 1건 | UNIQUE+다른 키 병렬 호출 1건 생성 |
| V7 | 대상당 REVIEW 1건, terminal | 병렬 review 및 terminal 이후 거절 |
| V8 | 원문/salt 접근 제한, 공개 join 금지 | 공개 GET·bundle·epoch·manifest·log·error 누출 0 |
| V9 | 병렬에서도 V2/V6/V7/V10 | N요청 경쟁·rollback 시험 |
| V10 | principal/operation/key 유일; 동일 결과 재사용 | 동일 재시도·충돌·키 없음·응답 유실·동시·추론 crash·stale 회수 |
| V11 | signed tx 송신 전 durable 기록, epoch당 미종결 tx 1개 | sign 후/broadcast 후 crash에서 정확히 1건 복구 |
| V12 | material은 발급 principal/동일 principal 재생만; 원문 echo 없음 | 타 principal salt 0, 동일 요청 salt/hash/id 재생성 0 |

## 6. 트랜잭션·멱등 발급

1. role/소유권·key·입력 검증 후 principal+operation+key로 레코드를 원자 획득한다.
2. request_hash가 다르면 409. 완료된 같은 요청이면 저장된 응답을 그대로 재생한다.
3. IN_PROGRESS의 소유 실행만 추론한다. 나머지는 결과를 기다린다. 대기 timeout은 503 후 같은 키 재시도다.
4. 추론은 긴 SQLite write transaction 밖에서 수행하는 방안을 제안한다. commit 직전 실행 소유권을 재검사한다.
5. receipts/content_store와 성공 idempotency response를 같은 발급 transaction으로 commit한다. UUID/salt/hash 재생성을 막는다.
6. 추론 실패는 receipt 0건·503. 동일 키 재시도 가능 상태로 정리한다. stale 실행은 종료/만료 확인 후 단일 소유자가 원자 회수한다. 옛 실행은 commit할 수 없다.

lease/timeout·회수 token·request_hash의 canonical 입력 범위·보관기간은 FRZ-01 전 결정한다. salt가 있는 stored response는 비공개 데이터이므로 idempotency_records도 접근을 제한한다.

## 7. freeze와 anchor 인계

F는 pending 선택, receipt_id 결정적 정렬, epoch id 할당, 멤버/root/count 확정을 한 transaction으로 처리한다. 새 첫 id=1, 다음=2. 동일 비종결 retry는 같은 id/root를 반환한다. 병렬 동결 중복 0, 빈 epoch 409, 사용 id 재사용 금지. 여러 freeze의 '동일 비종결' 범위는 T와 확정한다.

상태: FROZEN → SUBMITTING → SUBMITTED → CONFIRMED 또는 FAILED. T의 sender가 만든 signed tx/hash/nonce를 송신 전에 저장한다. 재시작/retry에서는 epochs(id)→receipt→tx 순서로 reconcile한다. matching root면 재송신 없이 finality 확인, 다른 root면 ROOT_CONFLICT. MAX_RETRY는 운영 중단 상태이며 체인 변조 증거가 아니다. F는 route/SQLite integration, T는 signer/sender/reader를 소유한다.

## 8. lifecycle 전이

| 기존 | 새 receipt | link / outcome |
|---|---|---|
| RESTRICT, 이의 없음 | 소유 USER의 APPEAL | subject=previous=DECISION |
| RESTRICT+APPEAL | REVIEW | subject=DECISION, previous=APPEAL; UPHOLD→RESTRICT 또는 OVERTURN→ALLOW |
| HUMAN_REVIEW | direct REVIEW | subject=previous=DECISION; RESOLVED→ALLOW 또는 RESTRICT |
| ALLOW | APPEAL 거절 | 409 TRANSITION_NOT_ALLOWED |
| REVIEW 존재 | 추가 appeal/review 거절 | terminal, 409 |

새 receipt는 자체 epoch proof를 받는다. 링크 누락은 lifecycle INCOMPLETE_HISTORY이며 현재 core 결과를 임의로 실패로 바꾸지 않는다.

## 9. 동결 전 남은 결정

T/A와 wrapper·입력 필드·principal 방식·HTTP 상세값·uint64 저장·멱등 lease·APPEAL/REVIEW material·bundle 생성 시점·freeze 재시도 범위를 확정한다. 이 문서 초안 작성은 해당 합의나 구현 테스트 통과를 의미하지 않는다.

## 10. 기존 코드·계약 대조

현재 backend/src/app.ts:7은 GET /api/health만 제공한다. 업무 API 8개와 SQLite는 TARGET이다. frontend/src/domain/types.ts:16의 고정 5-label과 store/store.ts:38의 합성 추론은 실제 supported taxonomy/서버 발급이 아니다. 현재 JSON bundle 타입은 types.ts:117 이하와 대조했다. 기존 I1의 exact required-key/evidence schema 미확정은 docs/04-interface-contract-draft.md C01을 따른다. 본 초안은 이를 승인하거나 현재 schema를 변경하지 않는다.

API-00 계약 초안 작성은 완료했으나 T/A 검토와 FRZ-01 동결은 남아 있다. [기존 결정 등록부](../02-decision-register.md)와 [I1~I4 초안](../04-interface-contract-draft.md)이 승인 상태의 기준이다.
