# VeriMod protocol correctness audit

STATUS: AUDIT SNAPSHOT

## 2026-09-14 재점검

`6971363`에서 시작한 quality pass는 hash/encoding/Merkle 규칙을 바꾸지 않았다. 기존 8개 lint 경고는 suppression 없이 해소했다. SearchDialog focus 순환·검색 label, ticker/marquee 정지, Tabs Home/End, accordion 이름 연결을 개선했다. 검증 보고서는 계산 완료 결과를 즉시 표시하며 hash 장식의 무작위 문자 교체를 제거했다. 실제 재실행과 위험별 테스트 표는 [07](07-validation-2026-09-13.md)에 통합했다.

새 점검에서 남긴 경계:

- **MEDIUM — canonical.ts/json.ts:** 직접 전달한 JavaScript getter/Proxy의 실행을 격리하지 않는다. 외부 파일은 native JSON.parse가 syntax를 판정한 뒤 중복 키를 검사하며 1 MiB/64 depth로 제한한다. JSON에는 getter/Proxy가 없으므로 이 경계를 임의의 JavaScript 객체에 대한 sandbox로 해석하지 않는다. 제한형 canonical profile을 유지하며 JCS 전환은 bytes 호환성 검토가 필요한 별도 결정이다.
- **MEDIUM — store:** localStorage 평문·동일 origin 접근·여러 탭 사이 원자성은 해결되지 않았다. private content와 commitment의 실제 일치는 별도 verifier side check에서 확인한다. storage 검사는 production persistence가 아니다.
- **LOW — UI/error:** 예기치 않은 Web Crypto 실패의 사용자 안내, 빠르게 연속 선택한 파일의 async load 순서, 모바일 메뉴 전체 keyboard/보조기술 검증은 후속 과제다. 정상 검증 실패와 RPC_UNAVAILABLE 경로는 재실행했다.
- **LOW — performance:** 작은 batch의 proof 재귀 계산과 약 2 MB 폰트는 측정 후 개선한다. 이번에는 hash 알고리즘 최적화나 package 이동을 하지 않았다.

아래는 9월 13일 당시 감사 기록이며 당시 경고 수·기준 SHA를 최신 결과로 읽지 않는다.

확인일: 2026-09-13. 시작 HEAD와 origin/main: `908f64eec5933dce2371ca48d35893fa01d0a8e8`. 브랜치: `docs/current-context-and-interface-draft`. 전체 실행 결과는 [검증 기록](07-validation-2026-09-13.md).

수정 전 repository 상태·구현 matrix·documentation drift·severity·수정 파일 목록을 사용자에게 보고한 뒤 P0를 수정했다. 기존 문서 7개 변경과 새 문서·기획서 3개는 같은 작업의 선행 변경이며 별도 백업했다. 제품 코드의 외부 사용자 변경은 없었다. 이번 감사는 독립 보안 인증이 아니다.

## 1. 구현 상태와 변경 경계

| 영역 | 분류 | 근거 | 이번 조치 |
|---|---|---|---|
| canonical·SHA-256·Merkle·proof | REAL_IMPLEMENTED | domain 소스, 실행 테스트 | 잘못된 입력 거부·회귀 검사 |
| UI·발급·appeal/review | SYNTHETIC_POC | pages/features/store | 연결·동시성·저장 복구 |
| 점수·정책 예시 | SYNTHETIC_POC | scorer/manifests/policy | 의미 유지, 잘못된 점수 거부 |
| 원장·앵커 | SYNTHETIC_POC | ledger.ts | simulation 표시 유지·보강 |
| backend·contract 도구 | SCAFFOLD_ONLY | health, ToolchainCheck | 코드 변경 없음·재실행 |
| 실제 AI·DB·epoch 계약·testnet | NOT_IMPLEMENTED | 구현·배포 증빙 없음 | [P1 backlog](06-p1-backlog.md) |

Hash domain, 정상 body 필드, protocol version, leaf/tree 규칙을 변경하지 않았다. 수정 전 확보한 seed receipt hash 5개와 root 3개를 고정한 회귀 테스트가 있다. 무효 입력 수용 범위는 좁아졌으며 이는 명시적인 validation hardening이다. 기존 비정상 저장값은 자동 migration하지 않는다.

## 2. 발견 사항

| ID | Severity | 원인·영향 | P0 처리 | 정상 바이트 변경 |
|---|---|---|---|---|
| F01 | HIGH | schema 통과한 lone surrogate가 canonical 단계에서 예외 | canonical preflight, INVALID_SCHEMA 보고 | 없음 |
| F02 | HIGH | 저장 배열 내부 무검증, 손상 시 seed로 원본 덮어쓰기 | 구조·hash·root·proof·참조 검사; 원본 보존·복구 안내·저장 중단 | 없음 |
| F03 | HIGH | NaN block이 finality 비교 우회; 일반 reader 오류가 예외 | block/epoch 숫자·root·ID 검사, RPC_UNAVAILABLE | 없음 |
| F04 | HIGH | 다른 DECISION을 previous로 쓰는 직접 검토, 불가능한 APPEAL 뒤 REVIEW | 동일 subject 검사·선행 APPEAL 전이 확인 | 없음 |
| F05 | MEDIUM | 비동기 중복 appeal/review, reset과 seal/issue 경합 | await 후 재확인, reset/reload 세대 검사 | 없음 |
| F06 | MEDIUM | epoch member·발급 draft 참조가 await 동안 변경 가능 | 계산 전 복사 | 없음 |
| F07 | MEDIUM | sparse array, cycle, 잘못된 hex가 명시적으로 거부되지 않음 | cycle/hole·Hex32 길이/문자·proof hash 폭 검사 | 없음 |
| F08 | MEDIUM | 외부 JSON 중복 키를 JSON.parse가 소실 | 원본 텍스트 토큰에서 중복 키 검사; 1 MiB/64단계 제한 | 없음 |
| F09 | LOW | 무작위 filler 수로 batch 크기 시연 차이 | 새 batch filler 3개 고정; 고정 seed 회귀 검사 | 새 합성 batch 구성만 |
| F10 | MEDIUM | 잘못된 점수가 정책 비교를 통과해 ALLOW 가능 | 모든 5라벨·safe integer·범위 확인 | 없음 |
| F11 | MEDIUM | JSON 편집 후 이전 검증 결과 또는 늦은 async 결과 표시 가능 | 입력 변경 시 결과 해제, 요청 sequence 검사 | 없음 |
| F12 | LOW | 첫 화면 disclosure 부재·접근 통제 문구 과장 | 모든 route Prototype mode, 평문 저장·무인증 검토 명시 | 없음 |

CRITICAL로 확정한 발견 없음. LOW/MEDIUM 잔여 항목은 아래 파일별 한계와 P1 항목을 따른다. “심각한 발견 없음”을 production 안전성으로 해석하지 않는다.

## 3. 파일별 보장·validation·재현성·mutation·coverage·전환 위험

### canonical.ts

- 역할/현재 보장: null, boolean, well-formed string, safe integer, dense array, plain object를 공백 없는 JSON으로 직렬화. object key는 UTF-16 code unit 순, 배열 순서 유지, Unicode 정규화 없음, -0은 0.
- validation/edge: undefined, Date, bigint, NaN, Infinity, unsafe/fractional number, lone surrogate, sparse array, cycle 거부. nested object 허용. 동일 객체를 여러 번 참조하되 순환하지 않으면 허용.
- deterministic/mutation: 정상 값이 동일하면 동일 bytes; 원본을 변경하지 않음. getter/proxy처럼 실행 가능한 JS 객체와 무제한 메모리 공격을 격리하는 sandbox는 아님. 외부 입력은 JSON 경계를 사용.
- coverage: canonical.test, hardening.test의 키 순서·한글/emoji·정수 경계·lone surrogate·null/bool·희소/순환·반복 참조.
- 보장하지 않음/전환 위험: RFC 8785 전체 구현 아님. 소수·큰 수를 허용하는 JCS library로 바로 교체하면 수용 규칙과 해시 호환성을 검토해야 함.

### hash.ts

- 역할/보장: Web Crypto SHA-256, 명시적 domain separator, CSPRNG 32byte salt; Hex32는 소문자 hex64.
- validation: hexToBytes는 prefix/문자/길이, bytesToHex는 32bytes 거부 규칙 보강. UTF8는 TextEncoder를 사용하므로 raw JS lone surrogate는 대체 문자로 인코딩됨. canonical body는 이를 거부하며 raw content Unicode 프로파일은 P1에서 고정할 항목이다.
- deterministic/mutation: hash는 같은 bytes에 동일 결과. randomHex32는 의도적으로 비결정적. caller가 전달한 byte array는 crypto 호출 이전까지 caller 소유이며 격리된 불변 타입 아님.
- coverage: 표준 abc SHA-256, domain+0 separator 대조, hex roundtrip·잘못된 폭, 독립 Node crypto Merkle 계산.
- 전환 위험: Node Web Crypto도 사용 가능하도록 공통 pure module 설계. hash는 발급자 정직성·privacy·실제 모델 실행을 증명하지 않음.

### merkle.ts

- 역할/보장: ordered CT 형태 tree, split은 n 미만 최대 2의 거듭제곱, leaf 0x00·node 0x01 prefix. 빈 tree 거부, 모든 index의 proof 생성·검증.
- validation/edge: safe index/size, index<size, 부족/추가 sibling 거부, sibling/root 32bytes. 일반 Merkle entry는 임의 bytes이고 epoch adapter가 receipt hash 32bytes를 사용.
- deterministic/mutation: 같은 순서 bytes면 동일 root, 입력 배열 변경 없음. raw byte buffer의 외부 동시 변경을 격리하는 API는 아님.
- coverage: n=1/2/3/4/5/7/8/9 모든 leaf, sibling/leaf/root/index/count·누락/추가 변조. 별도의 iterative CT frontier와 Node createHash로 n=1..32, 모든 index 대조.
- 한계: proof만으로 모든 tree_size 변경을 구분하지 못함. n=5 index2에서 count6도 같은 경로로 통과할 수 있어 verifyCore의 trusted count 대조가 필수.
- 전환: 모든 proof를 각각 재귀 생성하여 중복 계산이 많음. 작은 해커톤 batch에는 유지하고 P1에서 캐시/벤치마크 후 최적화. 새 property-testing dependency 없이 유한 exhaustive 검사를 사용; 향후 random bytes·큰 n·shrinking 고려.

### epoch.ts

- 역할/보장: receipt_id lexical 순서로 membership 고정, root/proof map 생성. UUID v4 소문자 입력은 ASCII 순서와 UTF-16 code unit 순서가 일치. localeCompare 사용 안 함.
- validation/edge: empty, duplicate receipt_id/hash, 잘못된 Hex32 거부. UUID 형식은 schema 및 저장 validation에서 검사; freezeEpoch 자체는 ID 문자열 형식을 별도로 검사하지 않는 typed 내부 helper.
- deterministic/mutation: member 객체를 await 전 복사하여 caller mutation 방어. 반환값 자체는 mutable TS 객체이며 영구 immutable storage 아님.
- coverage: 중복 ID/hash·empty·정렬 입력 permutation·await mutation·seed roots.
- 전환 위험: shared protocol에 동일 ordering을 규범으로 채택해야 함; backend 독자 구현 금지.

### receipt.ts

- 역할/보장: DECISION/APPEAL/REVIEW body builder, salted content/appeal·issuer commitment, body hash.
- validation: builders는 typed 내부 함수. schema enforcement는 발급 store.add 및 외부 verifier에서 수행. 시간·UUID 생성 주체는 caller. hash는 claim의 정직성을 검증하지 않음.
- deterministic/mutation: 같은 body/bytes면 동일 hash. builder는 nested inference/policy 참조를 공유하므로 store.issueDecision이 await 전 draft를 복사함. 외부 직접 builder 사용에는 snapshot 책임이 남음.
- coverage: verify/store 통합, seed 고정 hash, draft mutation.
- 전환 위험: authoritative backend가 timestamp·ID·권한·정책 일관성·동시성을 검증해야 함. 현재 schema 적합성이 실제 추론·정책 적정성까지 확인하지는 않음.

### schema.ts / json.ts

- 역할/보장: body/bundle unknown field 거부, required own field, 사건별 null/enum, full label map, score 0..1,000,000 정수, lower hex32, UTC millisecond timestamp roundtrip, UUID v4, 이유 코드 정렬 및 REVIEW/APPEAL catalog.
- evidence: start/end safe integer, end>start, label/method 형식. 정렬/중복/원문 길이 내 span인지까지 검사하지 않음. 원문 없는 verifier에서는 evidence 의미를 입증할 수 없음.
- proof: spec/count/index/hash 형식; index<count와 수학적 경로는 verifyInclusion. anchor: decimal string·address·tx/block hex 형식, proof/anchor 둘 다 null 또는 존재.
- deterministic/mutation: 입력의 값을 고치지 않으며 외부 JSON duplicate-key를 원본 토큰으로 검사. 동일 key가 서로 다른 객체에 있으면 허용, escaped key 중복도 거부. JSON.parse를 이미 거친 object에서는 소실된 중복 키를 복원할 수 없음.
- edge/coverage: missing/unknown/null/date/score range/label/evidence/proof/anchor, malformed JSON·중복·깊이·크기·surrogate, 정상 bundle 문자열. 실패는 INVALID_SCHEMA 또는 UNSUPPORTED_VERSION.
- 전환 위험: 정식 JSON Schema, manifest schema, 수치 lexical profile, evidence semantics·크기 제한은 팀 합의 필요. 1 MiB/64단계는 현재 UI 입력 제한이며 final protocol 결정 아님.

### verify.ts

- 역할/보장: schema → recomputed receipt hash → preconfigured chain/contract/issuer → ledger epoch → publisher/issuer/version/count → proof → confirmations. 별도 manifest/content/lifecycle 확인.
- validation: malformed input은 report, reader failure/invalid root·숫자·wrong epoch 응답은 RPC_UNAVAILABLE. missing epoch 및 12회 미만 확인은 PENDING_ANCHOR. RPC 실패와 tamper를 구분.
- lifecycle: 참조한 body의 hash와 inclusion 각각 확인, issuer/content 일치, APPEAL은 RESTRICT, 직접 REVIEW는 같은 HUMAN_REVIEW 판정/RESOLVED, APPEAL REVIEW는 UPHOLD/OVERTURN과 원래 조치 관계 검사. 선행 APPEAL의 허용 전이도 검사.
- deterministic/mutation: 고정 body·trust·ledger snapshot이면 deterministic. 시간이 움직이는 reader·자료 가용성에 따라 결과 변함. input snapshot은 호출자 소유; 브라우저 JSON 경로는 자체 객체를 제공.
- coverage: 정상·pending·RPC·tamper·rehash·wrong trust/count·missing history, malformed bundle/epoch/block, 잘못된 review 연결. helper 전이 부정 검사는 전체 악성 history on-chain E2E를 대체하지 않음.
- 한계: core VALID는 side checks 성공 아님. locator.tx_hash/block_hash/block_number는 형식만 검사하고 ledger 응답과 일치 확인하지 않음. 실제 RPC eth_chainId·transaction receipt·reorg·blockhash 대조 없음. appeal text commitment side check 없음. hidden branch·사건 완전성·human authenticity 미보장.

### state.ts

- 역할/보장: localStorage snapshot 로드/저장. 구조·receipt hash·epoch root·proof·member 순서/참조·local lifecycle 검사 후 load.
- validation/edge: old schema·corrupt JSON·malformed receipt/epoch·invalid proof·중복·impossible lifecycle 거부. missing contents/appeals는 원문 가용성 없음으로 허용. 원문 내용과 commitment 일치는 verifier side check에서 확인.
- mutation/복구: 손상 시 원본 STORAGE_KEY를 보존, 임시 seed 사용·경고 표시, 사용자가 명시적으로 초기화할 때까지 새 저장 중지. cross-tab 손상 reload도 현재 메모리 보존. quota 실패는 console 경고.
- coverage: state.test의 정상 reload·missing private maps·손상/구버전 원본 보존·reset·bad proof/root·cross-tab.
- 한계/전환: 같은 origin의 사용자가 root와 body를 모두 다시 만들면 이를 외부 진실성과 구별할 수 없음. 동기화 트랜잭션·암호화·인증·복잡한 migration 없음. 반복 proof 재계산 비용은 큰 local snapshot에 부적합하므로 P1에서 검토.

### store.ts / StoreProvider.tsx

- 역할/보장: 발급·append lifecycle·batch tick·UI subscription. 같은 store 인스턴스의 중복 appeal/review를 저장 직전 재확인. reset/reload 세대로 진행 중 구작업 취소.
- validation/edge: draft snapshot·body schema 확인, empty appeal 거부, review reason 요구, task eligibility. 외부 caller가 임의 draft의 policy와 원문을 조작하는 것을 인증으로 막지는 않음.
- deterministic: seed는 고정, live 발급은 CSPRNG ID/salt·clock; filler 개수만 3개 고정. Math.random은 홈 애니메이션에 남아 최종 해시에 영향 없음.
- mutation: 이전 receipt를 덮어쓰지 않는 정상 UI 흐름. getState()/receipt() 반환 객체는 개발자 코드에서 mutable; 보안 경계 아님.
- coverage: seed 5건 검증·batch 시간·appeal/review, concurrent requests·reset during seal/issue·draft mutation.
- 전환 위험: 여러 탭/프로세스 last-writer-wins와 authoritative transaction 없음. 현재 단일 store race fix는 DB unique constraint·서버 idempotency 대체 불가.

### ledger.ts

- 역할/보장: browser array에서 epoch 읽기, clock→block, 합성 locator·12회 confirmation 상태. trust 값은 hardcoded simulation 전용.
- validation: epoch 입력은 freezeEpoch·store 경계 사용; 자체 network/RPC validation 없음. load와 verifier가 외부 모양의 malformed response를 방어.
- deterministic/mutation: 고정 epoch/clock이면 동일 root·tx·block. array accessor가 최신 store를 읽으며 record 반환은 mutable.
- coverage: store/verify 통합 seed·batch·PENDING/VALID·RPC simulation, state integrity.
- 전환: 실제 contract read adapter로 교체하고 chain ID·신뢰 contract·등록 event·canonical block·reorg 확인. 합성 tx를 실제 chain으로 이관하지 않음.

## 4. Exact byte rules (현재 PROTOTYPED)

기호: H = SHA-256, U = UTF-8, C = 위 제한 canonical JSON의 UTF-8, Z = **단일 byte 0x00**, salt32/root32/hash32 = hex 텍스트가 아닌 decode한 **32bytes**.

| 계산 | exact bytes before H |
|---|---|
| receipt | U("verimod:receipt:v1") ∥ Z ∥ C(body) |
| model manifest | U("verimod:model:v1") ∥ Z ∥ C(MODEL_MANIFEST) |
| policy manifest | U("verimod:policy:v1") ∥ Z ∥ C(POLICY_MANIFEST) |
| review policy manifest | U("verimod:policy:v1") ∥ Z ∥ C(REVIEW_POLICY_MANIFEST) |
| content | U("verimod:content:v1") ∥ Z ∥ salt32 ∥ U(raw text) |
| appeal text | U("verimod:appeal:v1") ∥ Z ∥ salt32 ∥ U(appeal text) |
| issuer | U("verimod:issuer:v1") ∥ Z ∥ U(issuer ID) |
| simulated tx | U("verimod:simulated-tx:v1") ∥ Z ∥ U(decimal epoch ID) ∥ root32 |
| simulated block | U("verimod:simulated-block:v1") ∥ Z ∥ U(decimal block number) |
| Merkle leaf | 0x00 ∥ receipt_hash32 |
| Merkle node | 0x01 ∥ left_hash32 ∥ right_hash32 |

고정 domain 간 중복 없음. Review manifest는 정책 범주의 같은 domain을 쓰되 manifest_version/policy_id가 다르다. 별도 review domain을 새로 만드는 것은 호환성 변경이므로 하지 않았다. content/appeal은 고정 32byte salt 경계, simulated tx는 끝의 고정 32byte root 경계가 있다. domainHash의 가변 인자 사이에 별도 구분자를 삽입하지 않으므로 새 필드를 추가할 때 길이/encoding을 반드시 정의해야 한다.

Scorer noise는 U(label + U+0000 + text)의 SHA-256 일부이며 receipt domainHash와 별도다. 소스의 실제 NUL 문자를 `\u0000` escape로 바꿨지만 runtime byte는 같다. Seed/filler hash와 고정 salt는 공개 합성 예시이며 보안 난수 생성 증거가 아니다.

## 5. Canonicalization 선택과 compatibility

[RFC 8785 §3](https://www.rfc-editor.org/info/rfc8785/)은 중복 property와 invalid Unicode를 허용하지 않고 ECMAScript primitive serialization과 deterministic key sorting을 사용한다. 현재 구현은 safe integer만 받는 더 좁은 시험 프로파일이다. [RFC 9162 §2](https://www.rfc-editor.org/info/rfc9162/)는 현재 ordered tree/포함 경로 검토의 원문이다. CT 프로토콜 전체·signed tree head·consistency proof를 구현했다는 의미는 아니다.

| 선택 | 장점 | 부담/호환 영향 | 현재 판단 |
|---|---|---|---|
| A 제한형 VeriMod canonical profile | 현재 정수 receipt와 단순한 browser/Node 구현 유지 | 자체 규범·Unicode/수치·parser 정책·벡터 유지보수 | PROTOTYPED 유지, ADOPTED 아님 |
| B 검증된 JCS library | 표준 primitive 범위와 기존 구현 검토 활용 | library 품질/라이선스·browser build·input adaptation·float 허용 차이 검증 | 후보 조사 후 C04 승인; 이번 교체 안 함 |

정상 안전 정수/문자열 데이터는 같은 바이트가 기대되지만 기대만으로 호환 선언하지 않는다. C04 채택 전에 기존 body의 canonical bytes, receipt hash, manifest hash, root/proof를 양쪽으로 비교한다. 하나라도 달라지면 버전 변경·구버전 verifier/fixtures 보존·migration 계획이 필요하다.

중복 JSON 키 문제는 해시 충돌보다는 UI/다른 parser의 값 해석 불일치다. 외부 bundle paste/file가 있으므로 관련성이 있다. 원본 텍스트로 검사할 수 있게 verifyCore가 string을 직접 받아 검사한다. 이미 다른 도구가 JSON.parse한 객체에서는 원래 중복 여부를 증명할 수 없다.

## 6. Security/privacy와 repository hygiene

- 실제 blockchain 송신 코드 없음. 합성 epoch record에는 root/count/version/issuer/publisher/block metadata, 상세 body·원문·salt·appeal 본문 없음.
- public bundle에는 body·hash·proof·anchor만 포함. content/appeal salt와 원문은 localStorage private maps에 평문 저장. 인증과 reviewer 접근 통제 없음.
- XSS/같은 origin script는 private maps를 읽을 수 있다. production hardening 필요. 새 암호화 시스템은 도입하지 않음.
- 소스 검색에서 dangerouslySetInnerHTML/innerHTML/eval 또는 실제 API fetch를 발견하지 못했다. React text rendering 사용. 이는 전체 dependency/XSS 안전성 증명이 아님.
- 추적 및 ignore 제외 파일에서 private key header/GitHub token/AWS key 형태 검색 결과 0건. 전체 Git history·모든 secret 형식을 탐지한 것은 아님. .env/key/node_modules/dist/artifacts는 ignore 설정.
- LICENSE 없음: 사용자 선택 필요, MIT/Apache 임의 채택 안 함. 기존 proposal PDF·master PDF 보존. PPTX는 제공 원본과 동일 hash.
- 빌드 결과/node_modules 추적 없음. 1 MB 초과 공개 파일 없음(점검 시점). TODO/FIXME source 검색 결과 없음; 미구현 업무는 문서 backlog로 존재.
- Contracts npm audit: 15개 package entry(12 low/2 moderate/1 high). High는 serialize-javascript(개발 Mocha 경로), 그 밖에 adm-zip/diff/elliptic 및 전이 의존성. frontend/browser bundle dependency는 아님. 신뢰하지 않는 test/config 입력·archive 처리와 도구 실행 환경 위험이 남음. 강제 major upgrade 하지 않았고 real deploy/key 투입 전 재평가해야 함.
- Repo metadata: public/main, 연결 계정 push/admin 가능 확인. About description은 VeriMod·HTTP 451·BLOCK AI 2026를 표시. topics·라이선스 선택은 별도 제출 체크 사항이며 자동 변경하지 않았다.

## 7. 남은 기술부채

실제 external anchor, authenticated reviewer, authoritative issuance·DB transaction, migration/보존/삭제, raw Unicode·evidence 규범, appeal-private side check, chain read consistency/reorg, 전체 byte 상호운용 vectors, property fuzzing, Merkle/state load 성능. UI 애니메이션과 관련된 기존 lint 경고 8개는 제출 직전 큰 refactor 대신 기록한다.
