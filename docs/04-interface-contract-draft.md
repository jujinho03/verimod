# I1~I4 계약 검토 초안

2026-09-12 · v0.1 · **PROPOSED — 팀 승인 전** · 제품 코드 기준 `908f64e`

다음 설계 단계의 산출물이다. 현재 시험 구현을 채택할 부분과 보완할 부분을 제시한다. 정식 JSON Schema·ABI 또는 실행된 테스트 벡터가 아니다. C01~C08의 승인 근거는 아직 없으며 [02 결정 기록](02-decision-register.md)에 추후 기록한다.

## 책임과 소유 경계

| 경계 | 생산자 → 소비자 | 주 담당 | 검토 산출물 |
|---|---|---|---|
| I1 | AI adapter → 정책·receipt 발급 | 주진호 → 노유신, 설경민 검토 | 라벨·출력·오류·전처리/evidence·manifest |
| I2 | receipt 발급 → 저장·hasher·UI | 설경민 규격, 노유신 서비스 | 사건별 필드·불변성·버전·권한 |
| I3 | serializer/hasher/batcher → verifier | 설경민, 노유신 연결 | bytes·root·proof·공통 벡터 |
| I4 | batch worker → contract → reader/verifier | 설경민, 노유신 운영 | ABI·재시도·신뢰 설정·finality |

현재 파일은 frontend/src/domain의 types/schema/scorer/manifests/policy/receipt/canonical/hash/merkle/epoch/verify, frontend/src/store, backend/src, backend/contracts다. 공통 코어의 새 패키지 위치는 미정이다. 백엔드는 기존 Node.js·TypeScript를 유지한다.

## C01. AI 출력·정책

**제안:** InferenceOutput/PolicyEvaluation 분리를 유지한다. 5개 시험 라벨을 실제 모델이 모두 지원한다고 가정하지 않는다. taxonomy별 필수 점수 집합을 정하고 수신 시 누락·추가 라벨을 거부한다.

| 필드 | 초안 규칙 | 남은 결정 |
|---|---|---|
| output_version | 출력 호환 버전 | 시험 inference/1의 실제 프로파일 대응 |
| inference_id | 소문자 UUID v4, 추론 시도 식별 | 서비스 멱등키와 구분 |
| content_commitment | 발급 계층이 전달한 원문 commitment를 반환 | 원문·salt 접근 경로 |
| model_manifest_hash | 모델·revision·전처리·추론 설정 manifest의 hash | 실제 필드·보존/조회 경로 |
| taxonomy_id/version | 라벨 의미·필수 scores 키 고정 | 실제 지원 라벨·데이터 대응 |
| scores_ppm | 라벨별 0~1,000,000 안전 정수, 합계 제한 없음 | 점수 의미·정수 변환 |
| score_semantics | CALIBRATED / UNCALIBRATED | calibration 주장에는 실제 평가 근거 필요 |
| input_status | FULL / TRUNCATED | 500 code point는 시험값. 운영 길이·token/전처리 규칙 미정 |
| evidence | 필수 필드, 없으면 빈 배열, 원문 code point [start,end) | method/version, 정렬·중복·범위 검사 |
| inferred_at | YYYY-MM-DDTHH:mm:ss.SSSZ | 발급자 주장 시각이며 블록 시각과 별개 |

확률 p를 채택하면 유한한 [0,1]인지 검사하고 생산자에서 floor(p×1,000,000+0.5)를 한 번 적용하는 안을 제안한다. rubric 점수는 별도 의미를 정의한다. 정책은 전달된 정수만 비교한다.

전처리·tokenizer index는 adapter가 원문 code point로 매핑한다. 매핑할 수 없는 evidence를 만들어 채우지 않는다. 원문 `😀 무료 쿠폰`에서 `무료`는 [2,4)다. UTF-16 index와 혼동하지 않는다. 생성기는 정렬하고 수신기는 비정상 순서·완전 중복을 거부한다는 안을 유지한다. 원문 substring은 receipt에 넣지 않는다.

정책 출력은 policy_manifest_hash, action, reason_codes, triggered_rule_ids다. 초안 우선순위는 TRUNCATED → HUMAN_REVIEW, 그 외 제한 임계값 충족 → RESTRICT, 검토 임계값 충족 → HUMAN_REVIEW, 나머지 ALLOW다. 400,000/800,000/850,000 등 시험 수치는 운영 임계값으로 승인하지 않는다.

오류는 성공 출력과 별도 구조를 제안한다. 아래 코드 이름은 신규 제안이다.

| 원인 | 코드 후보 | 처리 후보 |
|---|---|---|
| 빈 입력·잘못된 Unicode | EMPTY_INPUT / INVALID_INPUT | 입력 수정, DECISION 발급 안 함 |
| 미지원 taxonomy | UNSUPPORTED_TAXONOMY | 설정 오류, 임의 라벨 변환 없음 |
| 누락·NaN·범위 밖·소수 점수 | INVALID_MODEL_OUTPUT | 내부 원인 기록, 가짜 ALLOW 없음 |
| timeout·서비스 장애 | INFERENCE_TIMEOUT / INFERENCE_UNAVAILABLE | 동일 서비스 요청의 재시도 정책 적용 |

실패 envelope 후보는 `ok=false`, `request_id`, `error.code`, `error.retryable`이다. 성공은 `ok=true`, `request_id`, `inference`이고 정책 계층이 policy를 생성한다. 이 transport envelope·내부 오류 상세를 body에 넣지 않는다. 현재 backend에 이 API가 존재한다는 뜻은 아니다.

검토 예시: TRUNCATED이고 모든 점수가 1,000,000이어도 초안 정책은 HUMAN_REVIEW다. 필수 hate 점수가 빠지거나 1,000,001이면 INVALID_MODEL_OUTPUT이다. 확률 변환의 부동소수점 경계는 공통 벡터에서 별도 비교한다.

## C02. 상태·권한·멱등성

**제안:** 현행 단일 appeal/review 흐름을 MVP 후보로 유지하고 서버가 원자적으로 검사한다. DECISION body의 action을 덮어쓰지 않고 현재 유효 조치는 별도 조회 상태로 계산한다.

| 선행 상태 | 행동·주체 | 새 사건 | 참조 |
|---|---|---|---|
| 신규 정상 AI 출력 | 발급 서비스의 정책 평가 | DECISION, ALLOW/RESTRICT/HUMAN_REVIEW | subject/previous=null |
| RESTRICT, appeal/review 없음 | 소유자 appeal | APPEAL, reason + appeal commitment | subject=previous=DECISION hash |
| RESTRICT + 열린 APPEAL | reviewer 유지 | REVIEW, UPHOLD + RESTRICT | subject=DECISION, previous=APPEAL |
| RESTRICT + 열린 APPEAL | reviewer 번복 | REVIEW, OVERTURN + ALLOW | subject=DECISION, previous=APPEAL |
| HUMAN_REVIEW, review 없음 | reviewer 직접 검토 | REVIEW, RESOLVED + ALLOW/RESTRICT | subject=previous=DECISION |
| ALLOW | appeal 요청 | 전이 오류 후보, 새 사건 없음 | 해당 없음 |
| 최종 REVIEW 존재 | 재심·추가 review | 이 MVP 후보에서는 거부 | 재심은 별도 규격 |

RESOLVED, ALLOW appeal 제외, 판정당 appeal/review 1건은 채택 여부가 미정인 시험 정책이다.

| 행동 | 서버 권한 후보 |
|---|---|
| 원문·salt·receipt·appeal 조회 | 소유자 또는 승인된 업무 범위 reviewer |
| appeal 생성 | 해당 판정 소유자. 클라이언트 user/issuer 주장만으로 허용하지 않음 |
| review 생성 | 인증된 reviewer + 해당 플랫폼/업무 권한. 역할 문자열만으로 인정하지 않음 |
| epoch 등록 | 허용 publisher. 사용자 요청으로 키·issuer를 바꾸지 않음 |
| 확보한 bundle 계산 | 정당하게 확보한 자료와 사전 신뢰 설정을 가진 검증자 |

멱등키 범위 후보는 `(issuer, actor, operation, idempotency_key)`다. 같은 키·동일 요청은 기존 결과를 반환하고 다른 payload는 충돌이다. 동일 요청의 receipt ID/salt를 재생성하지 않는다. 다른 키의 동시 appeal/review도 최초 판정 단위 조건부 갱신·유일성 제약으로 1건만 성공시킨다. DB·정확한 HTTP 상태·오류명은 설경민 설계, 노유신 구현에서 결정한다.

완료 증거 후보: 비소유자 appeal·무권한 review 거부, 재시도 시 동일 receipt hash, 다른 키의 동시 요청 중 한 건만 생성. 현재 서버·테스트 통과 결과가 아니다.

## C03. ReceiptBody·Bundle·manifest

**제안:** 현행 body/bundle 분리를 유지한다. 공통 필드는 모두 명시적으로 존재하며 unknown field를 거부한다. null·누락·빈 배열을 동등하게 취급하지 않는다.

| 필드 | DECISION | APPEAL | REVIEW |
|---|---|---|---|
| protocol_version/receipt_id/issuer_id/recorded_at/content_commitment | 필수 | 필수 | 필수 |
| event_kind | DECISION | APPEAL | REVIEW |
| subject_receipt_hash | null | 최초 DECISION hash | 최초 DECISION hash |
| previous_receipt_hash | null | 최초 DECISION hash | APPEAL 또는 직접 검토 DECISION hash |
| payload | inference + policy | appeal_commitment + reason_code | outcome + resulting_action + reason_codes + review_policy_manifest_hash + reviewer_role |

inference와 최상위 content_commitment는 같아야 한다. 선행 기록의 issuer/content도 같아야 하고 참조된 실제 receipt를 가져와 검증한다. body에 자기 hash·epoch/tx/block/proof·앵커 상태·계정·원문·salt를 넣지 않는다.

Bundle은 receipt_body, receipt_hash, proof, anchor다. 시험판처럼 proof/anchor는 함께 null이거나 함께 존재하도록 제안한다. 필드 존재가 외부 앵커 확정을 뜻하지 않는다. bundle 갱신으로 body/hash가 바뀌면 안 된다.

model manifest는 artifact 또는 provider/model/revision, tokenizer·전처리·라벨·추론 파라미터·calibration 근거를 식별한다. 외부 API의 비공개 artifact를 꾸며 쓰지 않는다. policy/review manifest는 규칙·우선순위·reason/outcome을 보존한다. 내용 변경 시 새 hash를 만들고 과거 manifest를 조회할 수 있어야 한다. 저장·조회 경로와 정식 manifest schema는 미정이다.

시험 verimod/1 및 숫자 protocol 1의 정식 재사용은 C08에서 결정한다. 필드 의미·정렬·허용 값 변경이 기존 bytes나 수용 범위를 바꾸는지 기록한다.

## C04. 직렬화 선택

| 선택지 | 이점 | 채택 조건 |
|---|---|---|
| 현행 제한 값 프로파일 명세화 | 현재 receipt·시험 구현에 가까움 | 지원 값·키 순서·Unicode·중복 키·크기 상한 고정, 독립 비교 |
| 검증된 JCS 구현 채택 | 표준 호환 경계를 검토하기 쉬움 | 라이브러리/version 검토, 현행 bytes 비교, 기존 bundle 영향 분석 |

**초안 권고:** 현행 지원 값의 규칙·기대 bytes를 먼저 비교 기준으로 명세화한다. JCS 전체 호환 승인으로 부르지 않는다. 최종 선택은 설경민 주도 공동 검토다.

기준 후보는 UTF-8, UTF-16 code unit 객체 키 정렬, 배열 순서 보존, 공백 없는 JSON, 안전 정수, 임의 Unicode 정규화 없음, 잘못된 surrogate 거부다. 음수 0은 현행 구현에서 `0`으로 직렬화된다. 필드별 숫자 범위는 schema에서 제한한다.

문자열 JSON은 객체 변환 전에 중복 키를 거부한다는 안을 유지한다. JSON.parse 후 중복 키 복원은 불가능하다. evidence 정렬·중복은 수신 검증에서 거부하고 받은 body를 조용히 바꾸지 않는다. 재귀 깊이·문자열/배열/bundle 크기 상한은 미정이다.

## C05. Hash·Merkle·공통 벡터

**제안:** 기존 도메인 분리와 ordered tree를 보존하는 안부터 검토한다.

- receipt hash = SHA256(UTF8(verimod:receipt:v1) || 0x00 || canonical body bytes).
- content/appeal은 각 도메인 + 0x00 + CSPRNG salt32 + UTF8(원문). 원문 trim/정규화 없음.
- entry는 receipt hash raw 32 bytes, leaf = SHA256(0x00 || entry), node = SHA256(0x01 || left32 || right32).
- epoch는 receipt_id ASCII 오름차순으로 동결. 빈 epoch·중복 ID/hash 거부, 동결 후 목록·root·count 재작성 금지.
- ordered CT 분할 유지. pair 정렬·홀수 leaf 복제 금지, 단일 leaf proof는 빈 배열.
- proof는 merkle_spec, leaf_index, tree_size, siblings(leaf→root). index·경로 길이·남는/누락 sibling, 신뢰 원장의 count와 tree_size를 확인.

다음은 생성할 벡터 목록이며 계산된 기대 hash 파일은 아직 없다. 기존 테스트의 왕복 확인만으로 독립 구현 일치를 주장하지 않는다.

| 벡터 | 입력·변형 | 기대 결과 |
|---|---|---|
| V01 | 동일 body의 key 삽입 순서 변경 | 같은 canonical bytes/hash |
| V02 | null 누락·unknown field·중복 key·lone surrogate·비정수 | schema 또는 파싱 오류 |
| V03 | 한글·이모지·조합형/완성형 | 코드 단위 규칙 보존, 임의 정규화 없음 |
| V04 | n=1/2/3/5, 모든 index | 고정 root/proof와 일치, 포함 성공 |
| V05 | wrong root/count/index·누락/추가 sibling | INVALID_PROOF |
| V06 | body 변경, claimed hash 유지 | HASH_MISMATCH |
| V07 | body/hash 재계산, 원래 proof/root 유지 | INVALID_PROOF |
| V08 | 중복 receipt_id/hash, 빈 epoch | 동결 거부 |

벡터 파일에는 fixture ID·profile version·입력·canonical bytes hex·receipt/leaf/root hash·index/count/siblings·기대 결과·생성/비교 명령을 담는다. Node와 브라우저를 우선 비교하고 Python이 계산에 참여하면 추가한다. 같은 함수의 두 환경 실행과 독립 구현 교차 검증을 구분한다.

## C06. Epoch·contract·실제 reader

epoch 등록은 최신 기획 방향이다. 아래는 01 문서의 **논리 ABI 후보**이며 실제 contract나 승인된 ABI가 아니다.

- registerEpoch(epoch_id:uint64, root:bytes32, receipt_count:uint32, protocol_version:uint32).
- getEpoch는 존재 여부·root·count·version·publisher/issuer 연결·등록 block 정보를 제공.
- EpochRegistered event. 허용 publisher, 중복 epoch, zero count/root, 미지원 version 검사. 기존 값 수정·삭제 없음.
- 단조 증가 epoch ID, 배포 시 publisher/issuer 고정, non-upgradeable 구조의 채택 여부와 키 변경/손실 대응을 함께 결정.

재시도는 동결한 같은 epoch를 사용한다. 조회 결과가 같은 root/count/version/issuer면 기존 등록을 수용하고 다른 값이면 충돌로 중단한다. timeout·제출 응답 유실만으로 새 epoch를 만들지 않는다.

| 상태·사건 | 처리 후보 |
|---|---|
| 발급, 배치 전 | ISSUED, PENDING_ANCHOR |
| 동결·제출·미확정 | BATCHED/SUBMITTED/CONFIRMING, PENDING_ANCHOR |
| 체인별 확정 기준 충족 | ANCHORED, 다른 core 검사도 통과해야 VALID |
| RPC 장애 | RPC_UNAVAILABLE·재시도 상태 보존, 변조 표시 없음 |
| transaction revert | FAILED 운영 상태, 원인별 재시도·충돌 처리 |
| reorg | ANCHORED 철회, canonical chain 재확인 |

현행 LedgerReader.getEpoch/blockNumber와 TrustConfig를 출발점으로 쓴다. 실제 reader는 RPC chain ID, 신뢰 contract/issuer/publisher/protocol, 등록 block의 canonical 여부·확정을 확인해야 한다. locator의 tx/block hash를 어떤 결과 항목에서 검사할지 정하고 미검증 필드를 검증된 증거로 표시하지 않는다. 12회 확인은 운영 기본값으로 자동 승계하지 않는다.

체인·RPC·finality·ABI 상한·큰 정수 표현은 미정이다. 후속 검증에는 등록/조회/event, 권한·중복·0 count·version·수정 거부, 제출 재시도·reorg 시나리오를 포함한다.

## C07. 검증 결과·비공개 자료

**제안:** core 결과 코드 8개를 유지하며 보장 범위를 UI/API에 명시한다. VALID는 해당 신뢰 epoch에 대한 개별 receipt의 core 검증 성공이다.

| 계층 | 성공 의미 | 별도 처리 |
|---|---|---|
| core | schema/hash·신뢰 epoch·포함·확정 | RPC/미확정 보류, 실패 원인 구분 |
| manifest | 알려진 manifest hash 일치 | 실제 모델 실행·정책 적합성 증명 아님 |
| original content | 확보한 원문·salt의 commitment 일치 | 자료 없으면 NOT_CHECKED |
| appeal content | appeal 본문·salt의 commitment 일치 | 현행 구현 없음. 별도 side check 채택 여부 결정 |
| lifecycle | 확보한 선행 기록 포함·연결 규칙 | 누락 INCOMPLETE_HISTORY, 전이 오류 FAILED |

이력 검증은 제공된 체인의 범위를 명시하고 필요한 선행 기록까지 추적한다. 숨겨진 분기·미발급 사건의 부재는 증명하지 않는다. core VALID 옆에 side check 실패·미확인을 숨기지 않는다.

원문·salt·appeal 본문·계정 연결·reviewer 개인 식별은 접근 통제 저장소에서 관리한다. 조회·내보내기·공유·삭제·보존 기간의 책임자를 정한다. 온체인은 root와 최소 메타데이터, 공개 GitHub 예시는 합성 자료만 사용한다. salted commitment가 익명성·접근 통제·영구 보존을 보장하지 않는다.

## C08. 실제 모드와 호환성

**제안:** 합성 scorer/원장·manifest·저장 데이터를 실제 모드와 구분한다. 실제 chain/contract/issuer 신뢰 설정에 시뮬레이션 값을 섞지 않는다. 기존 UI·계산 코드는 검토해 재사용한다.

bytes 변경, schema 수용 범위, 신뢰 설정, 저장 구조의 영향을 각각 기록한다. 기존 시험 bundle을 새 규칙으로 조용히 재해싱하지 않는다. 버전별 reader 보존 또는 새 시험 receipt 재발급 중 선택한다. 재발급은 새 기록이며 과거 anchor 유지가 아니다. 기존 localStorage를 사용자 지시 없이 일괄 삭제하지 않는다.

진행 순서: 계약 합의 → 승인한 profile/schema/ABI와 fixture 명세화 → 공통 코어·서비스·실제 AI·contract 연결 → E2E → 변조·이의·장애 검증. 실제 E2E는 실제 텍스트·모델·receipt·testnet root·브라우저 대조·사본 변조 실패·appeal/review를 포함한다.

## 검토 완료 기준

- C01~C08에 채택/변경/보류, 담당 검토, 승인 근거, 영향받는 필드·버전을 기록한다.
- 생산자·소비자가 같은 정상·오류 예시를 해석한다. 미정 수치를 임의 기본값으로 숨기지 않는다.
- 합의 내용을 01 상세 명세와 02 결정 기록에 반영한다. 초안 작성과 승인 완료를 구분한다.
- 후속 실행은 계약 테스트·공통 벡터·API/contract 검증과 실행 기록을 포함한다. 이번 문서는 실행된 테스트·배포 결과가 아니다.
