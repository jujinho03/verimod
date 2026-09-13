# P1 integration backlog — PROPOSED / DEFERRED

2026-09-13. 이번에는 구현하지 않는다. P0 검증은 [07](07-validation-2026-09-13.md), 현재 trial 계약은 [04](04-interface-contract-draft.md), 결정은 [02](02-decision-register.md)에 기록한다. 아래는 팀의 채택 순서와 완료조건 제안이며 일정·벤더·체인 확정이 아니다.

## 1. C09 공통 protocol 경계 결정 (최우선)

Frontend domain을 backend에 복사하지 않는다. 동일 receipt/hash/Merkle 규칙과 fixtures를 공유한다.

| 후보 | 중복 방지·검증 | browser/Node·빌드 | 배포·부담 | 제안 |
|---|---|---|---|---|
| A packages/protocol | 한 package의 pure core/버전/fixtures | Web Crypto interface, Vite와 Node ESM exports/types 검증 | workspace/build 순서·dependency 관리 필요 | 실제 통합 전 우선 검토 |
| B shared/protocol | 단일 pure TS 소스 | Vite 외부 root import·backend rootDir/emit 경로 조정 | 설정 적지만 package 경계·배포 artifact 주의 | 짧은 MVP 대안 |
| C backend issuer + 별도 verifier library | issuer 권한과 verifier 분리 | browser는 standalone verifier, 서버도 같은 encoding 핵심 사용 | 두 라이브러리 간 drift 위험 | 발급 로직 분리는 필요, crypto 재구현 금지 |

A/B/C 모두 browser Web Crypto와 Node Web Crypto를 adapter 또는 동일 pure API로 처리한다. Node Buffer 전용 타입을 browser core로 가져오지 않는다. C를 골라도 canonical/hash/proof 바이트 코어는 공유하고 독립 reference는 테스트에만 둔다.

완료조건: C03/C04/C05와 C09 채택 기록, export/input/error matrix, Node/browser 동일 fixture, Vite production build·backend emitted import 성공, 기존 synthetic demo 유지, bytes/version migration 합의. 사용자 승인 없이 directory migration하지 않는다.

## 2. Authoritative backend MVP와 persistence

제안 API (frontend 현재는 store 직접 호출, 확정 API integration 없음):

| API 후보 | 책임 | 완료조건 |
|---|---|---|
| POST /api/moderate | 실제 adapter 결과·policy·DECISION 발급 | invalid/timeout에 가짜 ALLOW 금지, 서버 ID/time·권한·manifest 검증 |
| GET /api/receipts/:id | body/hash/proof/anchor 조회 | body immutable, private text 별도 권한 |
| POST /api/appeals | 후속 APPEAL·private text | subject 소유권·RESTRICT·중복/멱등성 transaction |
| GET /api/reviews | 허용된 review queue | authenticated reviewer·authorization |
| POST /api/reviews/:id | REVIEW append | 역할·action·time·policy version·한 번만 종료 |
| worker 또는 명시적 demo seal endpoint | pending→epoch 동결 | deterministic order·중복 방지·retry·crash recovery |

REST resource 식별자와 idempotency key, 오류 code/status, pagination, chain pending 상태는 [04 C02/C06](04-interface-contract-draft.md) 검토 후 확정한다. 실제 모드에서는 frontend가 임의 body를 authoritative receipt로 발급하지 않는다. verifier는 서버의 VALID 문자열에 의존하지 않고 재계산한다.

최소 entities: Receipt(body/hash/상태/참조), Epoch(root/count/version/publisher/status/locator), PrivateContent(raw/salt/owner/retention), AppealPrivateText(text/salt/access), ReviewMetadata(reviewer authorization/action/time/policy). 공개 record와 private fields 저장/조회 경계를 분리한다.

| DB 후보 | 적합 조건 | 남은 검토 |
|---|---|---|
| SQLite | 단일 프로세스·작은 로컬 demo, 영속 volume 가능 | 동시 write·backup·배포 volume·worker contention |
| PostgreSQL | 서버/worker 여러 프로세스·동시성 증가 | 운영 환경·연결/backup·비용 |
| 임의 cloud DB | 현재 미선택 | 배포환경/필요성·비용 승인 전 도입 안 함 |

기존 localStorage는 synthetic 전용으로 유지, migration은 사용자 안내와 원본 보존. 서버 transaction/unique constraints로 중복 발급 방지; 현재 단일 store guard는 대체 수단 아님. 완료조건: 재시작 복원·동시 요청·retry·권한 거부·원문 비노출·privacy 보존/삭제 테스트.

## 3. 실제 AI/ML baseline·평가·score 계약

순서: **공식 dataset 출처·license → label 정의 → train/validation/test split → baseline → error analysis → model selection → threshold → calibration → integration**.

K-MHaS, KoELECTRA, KLUE-RoBERTa, KR-BERT는 MASTER의 검토 후보다. 이번 다운로드·채택·훈련 없음. 데이터별 공식 출처·license 전문·상업/연구 제한·한국어 여부·multi-label 여부·class distribution·split leakage/중복을 먼저 기록한다.

현재 hate/profanity/sexual/spam/violence와 실제 label 의미를 항목별로 대응한다. 없는 라벨을 억지 mapping하거나 0점으로 정상 처리하지 않는다. misinformation은 별도 문제이므로 MVP 제외 가능성을 유지한다.

보고: Macro/Micro F1, per-class precision/recall/F1, false positive/negative rate와 분모 정의, split/seed/revision·실행 명령·결과 파일. 정상 콘텐츠가 RESTRICT되는 오탐을 우선 분석한다. Score가 확률이 아니면 probability라고 쓰지 않으며 calibration 전 UNCALIBRATED 유지. threshold는 실제 score semantics 및 오탐 비용을 보고 선택한다. 성능 수치는 실제 평가 전 README/PPT에 추가하지 않는다.

완료조건: 실행 가능한 baseline·재현 로그, label 계약, 오류 분석, 모델/threshold 채택 근거, timeout/truncation/모델 실패 동작, synthetic/real mode 명확한 분리.

## 4. Model manifest

제안 필드: model_id, model_version, base_model, weights artifact hash/revision, tokenizer revision, label taxonomy, preprocessing, max_length, inference parameters, code version, created_at. model name 하나의 hash로 대체하지 않는다. 외부 API면 확인 가능한 model/version/request metadata만 기록하고 불투명한 weights·추론 실행 증거를 만들어 쓰지 않는다.

완료조건: manifest schema·artifact/revision 증빙·canonical hash fixtures·version 정책. manifest hash 일치는 “이 모델이 실제 실행됐다”는 attestation이 아님을 유지.

## 5. 실제 epoch commitment contract

후보 인터페이스:
`registerEpoch(epochId, root, receiptCount, protocolVersion, issuerCommitment)`,
`getEpoch(epochId)`, `EpochRegistered(...)` event.

필수 규칙: zero root 거부, count>0, duplicate epoch 거부, immutable 등록, publisher authorization, supported version, event. raw content/user ID/appeal/evidence 원문/reviewer 개인정보 저장 금지. Solidity compiler와 pragma의 호환성을 유지하고 실제 계약·tests 준비 후 ToolchainCheck 제거.

필수 테스트: 정상 register/read/event, duplicate, unauthorized, zero count, zero root, unsupported version, 수정 불가. 실제 API/ABI·uint 폭·epoch allocation·publisher rotation은 C06에서 채택. Hash/leaf 동일 vectors로 contract record와 frontend 포함 검증 연결.

## 6. EVM testnet·독립 reader·신뢰 설정

Base Sepolia 등은 후보이며 이번 chain 선택 없음. 결정 후 RPC URL, publisher/deployer key, chain ID, contract address를 env/keystore로 관리한다. .env.example만 공개, 실제 secret commit 금지.

배포 완료 증빙: chain ID, contract address, deployment tx, example epoch tx, block number, explorer URL. **실제 explorer 대조 전 deployed라고 쓰지 않는다.**

Verifier는 bundle의 contract를 신뢰하지 않고 사전 trust config(chain ID, contract, issuer ID/commitment, publisher, protocol version)로 조회한다. 흐름: schema → receipt hash → trusted chain/contract → getEpoch → metadata/count → Merkle → canonical block/finality → lifecycle.

현재 locator의 tx_hash/block_hash/block_number는 형식만 검사한다. 실제 구현의 source of truth는 신뢰 chain/contract의 확정 epoch record 및 등록 event/transaction receipt와 canonical block이다. locator는 조회 힌트이며 RPC eth_chainId, event emitter/epoch ID/root/count/version/issuer/publisher, transaction receipt status, block hash와 confirmations를 대조하는 정책이 필요하다. read 사이 다른 head를 관찰하지 않도록 block tag/snapshot을 정의한다.

RPC 장애는 UNAVAILABLE/PENDING, 내용 불일치는 FAILED로 구분. reorg는 이전 ANCHORED를 철회·재확인한다. 12 confirmations/1초 block은 simulation 설정이며 실제 체인 정책으로 자동 승계하지 않는다. RPC provider 신뢰도 공개한다.

완료조건: 실제 deploy/explorer 증빙, 정상 등록/독립 재계산, wrong chain/contract/issuer·RPC 장애·미확정·reorg fixture, idempotent retry. 실제 network E2E를 synthetic 테스트로 대신하지 않음.

## 7. Privacy·review·운영 hardening

authenticated reviewer, authorization, review action/time/policy version을 backend에서 기록. HUMAN_REVIEWER 문자열만으로 human proof라고 주장하지 않는다. 직접 HUMAN_REVIEW 종료 RESOLVED는 D08 미승인 prototype.

Public chain에는 root/count/version/최소 issuer/publisher commitment, off-chain에는 detailed receipt/raw/salt/appeal/reviewer metadata. 보존·삭제·소유권·receipt export 접근 정책을 결정한다. 공개 bundle에 appeal text를 넣지 않고 필요 시 별도 private side check 채택.

P0 잔여: cross-tab lost update, mutable snapshot API, 원문 Unicode 프로파일·evidence 순서/범위·정책 재계산, appeal commitment side check, 큰 batch/root/proof 성능·fuzzing, lint UI 경고, contract tooling 취약점 재평가. 실제 key와 운영 데이터를 넣기 전에 이 위험을 재검토한다.

## 8. 이후 통합 완료 기준

실제 모델/정책 → authoritative receipt → 영속 저장 → epoch → 실제 testnet anchor → 브라우저 직접 검증 → 사본 변조 실패 → appeal/review append → 선행 포함·연결 확인. 실패/timeout/RPC/reorg/재시작/중복 요청도 포함한다. 완료되지 않은 단계는 SYNTHETIC_POC 또는 SCAFFOLD_ONLY/NOT_IMPLEMENTED로 남긴다.
