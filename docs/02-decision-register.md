# 확정 우선순위와 구현 진입 조건

STATUS: CURRENT (decision evidence; 개별 결정 상태는 아래 표 기준)

## W1 kickoff decision evidence — 2026-09-23

### 승인 출처와 authority

DOC-01 / DOC-02: **사용자가 이 Command Center에서 D01~D17을 승인하고 D18~D28을 W1~W2 WORKING ASSUMPTION으로 승인한 것**을 기록한다. 승인 근거는 2026-09-23 사용자 `[ATOMIC TASK]`의 `DECISIONS TO RECORD`와 `Authority` 명시다. 오프라인 회의 개최·참석자·발언·팀원별 투표를 증명하는 기록은 아니다. 21:00 kickoff는 외부 계획의 예정 시각이며 실제 회의 시각으로 기록하지 않는다.

수정 전 검증 baseline: `main` / HEAD / fetch 후 `origin/main` = `5f030f6af97889062a58a2d571160ba8e89122fc`, ahead 0 / behind 0, working tree clean. 이 SHA는 이번 기록의 출발점이며 영구 최신값이 아니다. 제품 테스트·CI run을 이번 기록 작업에서 재실행하거나 새로 성공 확인한 것으로 주장하지 않는다.

Authority: **사용자 최신 결정 → 실제 최신 main/code/tests/CI → VeriMod 3인 7주 실행 프롬프트 VERIFIED FINAL → Master Plan v1.2.1 → 기존 repository 문서**. Master Plan v1.2.1을 현재 W1 execution planning 기준으로 채택한다. 이는 구현이 계획과 같다는 증거가 아니다.

외부 근거: 사용자가 제공한 `TalkFile_VeriMod_3인_7주_실행_프롬프트_VERIFIED_FINAL.pdf` p.4~8(역할·상태·결정·Gate), p.12~13(DOC-01/DOC-02·W1 evidence), p.24~25(T W1), p.32(D08 전이 행렬), p.40(F W1), p.49(날짜). PDF는 저장소에 새로 복사하지 않았다. Master Plan 원문 전체를 별도 재검증했다는 의미는 아니다.

CURRENT는 실제 구현/검증 사실, NEXT/TARGET은 앞으로 수행할 작업이다. **ADOPTED는 결정 승인 상태이며 구현·테스트·배포 완료가 아니다. WORKING ASSUMPTION은 ADOPTED가 아니며 FRZ-01에서 수정 또는 채택한다.** 기존 C01~C09 전체 schema/API/ABI가 일괄 승인된 것도 아니다. 아래와 충돌하는 과거 PROPOSED 문구에는 이 기록을 적용하고, 충돌하지 않는 미승인 세부사항은 계속 검토 대상으로 둔다.

### D01~D17 — ADOPTED

각 행의 승인일은 2026-09-23이며 승인 주체·근거는 위 사용자 명시다. 이유는 별도 회의 발언을 재구성하지 않고 승인된 문구의 목적·경계만 요약한다.

| ID | Date | Status | Decision | Reason / boundary | Superseded proposal / conflict | Impact |
|---|---|---|---|---|---|---|
| D01 | 2026-09-23 | ADOPTED | 한국어 encoder fine-tuning을 AI 주 경로로 한다. GATE-4 실패 시 guard model/API fallback을 허용하되 I1 contract는 유지한다. | AI 경로를 정하되 소비 계약 유지 | 기존 AI 방식 미선택 상태를 이 범위에서 갱신 | A의 연구·평가 방향. 특정 model 채택·학습 완료 아님 |
| D02 | 2026-09-23 | ADOPTED | Primary dataset native labels → mapping feasibility → supported taxonomy 순서. synthetic 5-label 강제·억지 mapping 금지, 필요 시 5→3, misinformation 제외. 최종 taxonomy는 GATE-2에서 확정한다. | 실제 데이터의 라벨 의미 존중 | 시험 5라벨을 최종값으로 승계하지 않음 | A의 조사·I1 초안 기준. 최종 taxonomy 미정 |
| D03 | 2026-09-23 | ADOPTED | reason_codes·triggered_rule_ids는 MUST. evidence span / attribution은 SHOULD. attribution을 causal explanation으로 표현하지 않는다. | 설명 범위와 필수 계약 구분 | 기존 evidence 논의를 이 우선순위로 한정 | 기존 evidence 필드의 제거·schema 변경 승인이 아님 |
| D04 | 2026-09-23 | ADOPTED | 본선 MVP persistence는 SQLite 단일 파일. PostgreSQL은 본선 전 기본 경로에서 제외한다. | MVP persistence 경로 결정 | 06의 SQLite/PostgreSQL 병렬 후보 중 기본 경로 결정 | F의 API/DB 계약 기준. DB 구현 완료 아님 |
| D05 | 2026-09-23 | ADOPTED | receipt hash를 epoch 단위 Merkle batching하고 epoch root를 on-chain commitment로 사용한다. 개별 receipt는 inclusion proof로 검증한다. | 등록 단위와 검증 단위 분리 | 기존 epoch 기획 방향을 이 범위에서 채택 | epoch size/cadence는 미정 |
| D06 | 2026-09-23 | ADOPTED | APPEAL은 DECISION을 수정하지 않고 새 receipt로 생성한다. REVIEW도 새 receipt이며 DECISION → APPEAL → REVIEW 연결을 유지한다. | 원 판정 보존과 후속 기록 연결 | 기존 append 방식 제안을 이 범위에서 채택 | 상세 권한·API 구현의 완료 아님 |
| D07 | 2026-09-23 | ADOPTED | scores_ppm은 integer 0..1,000,000. Python inference boundary에서 floor(p*1,000,000+0.5)를 한 번 적용한다. 미보정 score는 UNCALIBRATED이며 calibration 근거 없이 probability라 부르지 않는다. | 변환 위치와 점수 의미 고정 | 기존 ppm 변환 제안을 이 범위에서 채택 | I1 생산자 경계. threshold·calibration 결과 미정 |
| D08 | 2026-09-23 | ADOPTED | REVIEW outcome(UPHOLD / OVERTURN / RESOLVED)과 resulting_action을 분리한다. REVIEW는 lifecycle terminal이며 구체 transition matrix는 FINAL p.32를 따른다. | 검토 결과와 유효 조치 구분 | 기존 RESOLVED 미채택 문구를 이 범위에서 대체 | 새로운 전이/API를 이 문서에서 설계하지 않음 |
| D09 | 2026-09-23 | ADOPTED | 팀 HTTP 451, 프로젝트/제품 VeriMod, 영문 User-Verifiable AI Moderation Protocol, 메시지 Decide. Prove. Appeal. | 명칭·메시지 일관성 | 기존 명칭 유지 | 문서·발표 기준 |
| D10 | 2026-09-23 | ADOPTED | Master Plan v1.2.1의 7주 일정과 Gate를 단일 execution schedule로 사용한다. 구버전 일정 충돌은 위 authority order로 처리한다. | 실행 일정 기준 통일 | 기존 일정 미확정/구버전 일정 대신 최신 planning 기준 | 아래 Gate planning 적용. 실제 완료 증거와 구분 |
| D11 | 2026-09-23 | ADOPTED | VeriMod Canonical Profile v1, UTF-8 / SHA-256 / domain separation / ordered Merkle. 기존 PoC hash byte semantics를 명시적 migration 없이 깨지 않는다. | 기존 바이트 의미 보존 | 기존 profile/JCS 선택 초안을 이 방향에서 갱신 | 프로파일·fixture 문서화 기준. 코드·schema 변경 없음 |
| D12 | 2026-09-23 | ADOPTED | target testnet Base Sepolia, chain ID 84532. demo 전용 test wallet, primary/backup RPC 방향. | target network 경계 결정 | 06의 Base Sepolia 후보/체인 미선택 상태 갱신 | block time·gas·confirmation·RPC vendor 미정. 배포 완료 아님 |
| D13 | 2026-09-23 | ADOPTED | verifier는 승인된 TrustProfile을 authority로 사용한다. bundle locator는 trust root가 아니다. 승인 profile 2개 내장 방향을 채택한다. | 검증 신뢰 기준 분리 | 기존 TrustConfig 초안에 대한 목표 방향 | 실제 profile 값·reader 구현 완료 아님 |
| D14 | 2026-09-23 | ADOPTED | contract는 protocolVersion을 저장하고 지원 여부는 verifier가 판단한다. | version 지원 판정 책임 분리 | 기존 contract-side unsupported-version 검사 PROPOSED 초안을 supersede. 아래 충돌 기록 참조 | 코드·ABI 변경 없음 |
| D15 | 2026-09-23 | ADOPTED | contract에 별도 registration timestamp field를 두지 않는다. 등록 block/time evidence는 tx receipt/event를 통해 확인한다. | 등록 증거의 확인 경로 결정 | 기존 block.timestamp / block.number 저장 PROPOSED 초안을 supersede. 아래 참조 | 코드·storage layout 변경 없음 |
| D16 | 2026-09-23 | ADOPTED | DEMO_USER / DEMO_REVIEWER / DEMO_OPERATOR로 PoC authorization boundary만 표현한다. production identity proof라고 주장하지 않는다. | demo 권한과 실제 신원 증명 구분 | 기존 미정 권한 논의를 PoC 범위에서 한정 | 인증/API 구현 완료 아님 |
| D17 | 2026-09-23 | ADOPTED | 구버전 확장은 FINAL의 SHOULD / WON'T / BACKLOG 분류를 따른다. W1에서 새로운 확장 feature를 추가하지 않는다. | W1 범위 유지 | 기존 확장 backlog를 새 MUST로 승격하지 않음 | 새 feature·ticket 없음 |

### D18~D28 — WORKING ASSUMPTION

각 행은 2026-09-23 사용자가 승인한 **W1~W2 잠정 planning 기준**이다. FRZ-01에서 수정 또는 채택하기 전까지 ADOPTED로 표시하지 않는다.

| ID | Date | Status | Decision / working assumption | Reason / boundary | Superseded proposal / conflict | Impact |
|---|---|---|---|---|---|---|
| D18 | 2026-09-23 | WORKING ASSUMPTION | I1~I4 semantic freeze는 W2 말(10/03~04)에 수행하며 W1은 초안만 만든다. | 초안과 동결 구분 | 기존 동결 일정 대신 잠정 기준 | W2 구현·freeze 완료 아님 |
| D19 | 2026-09-23 | WORKING ASSUMPTION | 소유자 발급 material의 salt/receipt material + 브라우저 입력 원문으로 Private Receipt Package 구성 방향. 원문/salt는 ReceiptBody/on-chain에 넣지 않는다. | private 자료와 공개 기록 분리 | 기존 전달 방식 미정 사항의 잠정 방향 | Package/schema/API 구현 아님 |
| D20 | 2026-09-23 | WORKING ASSUMPTION | 제공받은 lifecycle record의 무결성·연결성을 검증하며 freshness/completeness는 보증하지 않는다. | 보장 범위 한정 | 기존 보장 한계와 일치 | 검증·설명 planning 기준 |
| D21 | 2026-09-23 | WORKING ASSUMPTION | 쓰기 API 3개에 Idempotency-Key 요구. 동일 payload retry는 동일 결과, 충돌 payload는 구분하는 방향. | retry 의미 유지 | 기존 멱등키 후보의 잠정 방향 | 새 endpoint/schema 구현 없음 |
| D22 | 2026-09-23 | WORKING ASSUMPTION | FROZEN → SUBMITTING → SUBMITTED → CONFIRMED 또는 FAILED. signed tx 선기록 / reconcile 방향. | 제출·복구 상태 구분 | 기존 PENDING → SUBMITTED → CONFIRMING → ANCHORED 초안과 충돌. 아래 최신 planning 우선 규칙 참조 | 코드 변경·ADOPTED 처리 금지 |
| D23 | 2026-09-23 | WORKING ASSUMPTION | epochId는 uint64 단조 증가 sequence, 1부터 시작. bundle epoch_id는 동일 값의 decimal string 방향. | 계층 간 ID 대응 | 기존 ID 후보에 대한 잠정 기준 | 실제 ABI/schema 변경 없음 |
| D24 | 2026-09-23 | WORKING ASSUMPTION | inference 실패는 503 INFERENCE_UNAVAILABLE, DECISION 미발급. ALLOW fallback 금지. | 실패를 정상 판정으로 위장하지 않음 | 기존 오류 후보의 잠정 mapping | API 구현 완료 아님 |
| D25 | 2026-09-23 | WORKING ASSUMPTION | FRR <= X AND HRR_TOTAL <= B 조건에서 HAR 최소화. 동률은 Restriction Precision 높은 쪽 → HRR_TOTAL 낮은 쪽. | validation 선택 목적 명시 | 수치 미확정 유지 | X/B 값·threshold·평가 결과를 생성하지 않음 |
| D26 | 2026-09-23 | WORKING ASSUMPTION | GATE-2 / GATE-4 / GATE-5 및 FINAL의 fallback/scope-cut 경로 사용. | 실패 시 planning 경로 명시 | 구버전 Gate 계획 대신 아래 잠정 경로 | Gate 실제 판정·fallback 실행 아님 |
| D27 | 2026-09-23 | WORKING ASSUMPTION | TEST는 model/threshold/policy 선택에 1회 사용. 버그 수정 또는 동일 LOCK 재현은 사유와 commit 기록이 있는 경우에만 재실행 가능. | TEST 재사용 경계 | 기존 평가 계획에 잠정 제약 명시 | TEST 열람·실행 없음 |
| D28 | 2026-09-23 | WORKING ASSUMPTION | Primary dataset 1개로 train/validation/test. Secondary는 기본적으로 train에 합치지 않고 외부 평가 SHOULD 용도로 사용. | 학습/외부 평가 경계 | 기존 dataset 후보를 선정한 것은 아님 | dataset 다운로드·선택·학습 없음 |

### Explicit supersedes and planning conflicts

- **D14 / ADOPTED:** [01의 I4](01-domain-and-interfaces.md) `protocol_version: MVP는 지원하는 1만 허용`, [04의 C06](04-interface-contract-draft.md) `미지원 version 검사`, [06의 실제 epoch commitment contract](06-p1-backlog.md) `unsupported version`, 이 문서 아래 과거 Contract 검증 행의 지원 안 되는 version 거부는 contract-side 지원 판정에 한해 superseded다. version 지원 여부는 verifier 책임으로 읽는다. 나머지 미승인 ABI를 일괄 채택하지 않으며 코드는 변경하지 않는다.
- **D15 / ADOPTED:** 01의 I4 `anchored_at / anchored_block` 행의 `contract가 block.timestamp / block.number로 기록` 제안을 supersede한다. 별도 registration timestamp field를 두지 않고 등록 block/time evidence는 tx receipt/event를 통해 확인한다. 기존 코드를 수정하거나 새 storage layout을 만들지 않는다.
- **D22 / WORKING ASSUMPTION:** 01의 I4 `PENDING → SUBMITTED → CONFIRMING → ANCHORED` 및 04 C06의 `BATCHED/SUBMITTED/CONFIRMING`, `ANCHORED` planning과 충돌한다. 새 계획에는 D22의 잠정 상태를 우선 적용하되 FRZ-01 전 ADOPTED로 취급하지 않는다. 현재 코드/UI 상태명을 바꾸거나 core verification의 PENDING 의미를 재정의하지 않는다.
- D04·D12는 06의 DB/testnet 후보 상태를 명시된 범위에서 갱신한다. D08·D11 등 채택된 방향은 과거 '미채택' 문구보다 우선하되, 세부 계약 전체·정상 bytes 변경·새 schema/API/ABI의 승인을 뜻하지 않는다. 이전 문서는 변경 경위를 추적할 수 있도록 보존한다.

### W1 ownership and Gate planning

W1은 2026-09-21~09-27이며 계약·데이터·신뢰 경계·API/DB 정리가 목적이다. 기존 2026-09-19 역할 기록과 FINAL의 A/T/F를 연결한다: A 주진호는 dataset research → taxonomy → I1, T 설경민은 Canonical Profile → TrustProfile → I4 ABI 초안 및 backend 설계·리뷰, F 노유신은 existing UI audit → API/DB 계약 및 backend API·frontend 구현 담당이다. 이 기록은 해당 작업의 착수·완료 evidence가 아니다.

다음은 D10의 execution schedule 및 D26의 **WORKING ASSUMPTION** 실패 경로다. 날짜는 2026년 계획이며 Gate PASS/FAIL 판정은 아직 기록하지 않는다.

| Gate | Planning date | 실패 시 FINAL planning 경로 |
|---|---|---|
| GATE-2 | 10/04(일) 21:00; FRZ-01 semantic freeze 10/03~04 | 5→3 labels, span 제거, 추가 UI 중지, protocol vectors 우선 |
| GATE-4 | 10/18(일) 21:00 | AI: guard model/API fallback(I1 유지), 정상 model/provider fallback의 마지막 주요 분기. Chain: LOCAL 개발 + T testnet 복구. Verifier: T reader 지원 |
| GATE-5 | 10/25(일) 21:00 | SHOULD=0, 신규 feature=0, 미완 MUST는 W6 첫 3일 마감, 필요 시 scope-cut. LOCK 이후 model 교체는 demo continuity fallback으로만 표시 |

### Unresolved values — do not invent

X, B, final supported taxonomy, exact Base min_confirmations, epoch size, epoch freeze cadence, exact RPC vendor, dataset selection, final threshold, model choice, block time/gas 세부값은 **미확정**이다. 이미 승인되지 않은 실제 schema/API/ABI 구현 세부사항도 확정하지 않는다. D04 SQLite·D12 Base Sepolia의 방향 승인과 이 미확정 값들을 구분한다.

### W1 evidence location and recording scope

기존 `docs/progress/`, `docs/progress/W1.md`, `docs/spec/` 또는 동등한 W1 전용 문서는 preflight에서 없었다. 기존 decision register의 이 섹션이 이번 kickoff/decision recording evidence를 함께 수용하므로 새 파일은 만들지 않는다. [문서 안내](README.md)에서 연결한다. 향후 W1 progress 문서를 만들 경우 이 기록을 연결하며, 계약 초안·Gate 결과·실행 로그가 이미 존재한다고 표시하지 않는다.

이번 변경은 documentation/evidence only다. production code·schema/API/ABI·DB·model·dataset·TEST는 변경/실행하지 않는다. 제품 테스트 미실행 — documentation-only task. 이 문서는 아직 commit/push된 evidence가 아니라 검토할 working-tree 기록이다.

## 이전 설계·결정 기록 (2026-09-11~19)

아래는 기존 시점의 기록이다. '이번', '미정', '승인 근거 없음', 'PROPOSED' 등의 표현은 당시 범위이며, 위 2026-09-23 결정과 겹치는 내용은 위 기록이 우선한다. C01~C09의 남은 세부사항은 일괄 승인되지 않았다.

전체 맥락은 [README](../README.md), 기획서 대비 최신 쟁점은 [현재 상태](03-current-status.md)를 함께 확인한다. 2026-09-12 최신 기획서·제품 코드 908f64e를 반영했다. 다음 산출물은 [I1~I4 계약 검토 초안](04-interface-contract-draft.md)이다. 상태 갱신이나 코드 존재로 기술 제안이 자동 채택되지 않는다.

아래 인터페이스 검토 항목은 PROPOSED 상태다. 이미 선택되거나 골격에 적용된 기술은 하단 결정 기록을 구분해 읽는다. 사용자의 검토 없이 제안을 확정 사양으로 변경하지 않는다.

## 우선순위

| 순서 | 먼저 확정할 항목 | 제안 / 결정해야 하는 것 | 담당 제안 | 완료조건 |
|---|---|---|---|---|
| P0-1 | 판정 범위와 언어 | 한국어 텍스트, 실제 dataset label과 정책 범위 대응 | 주진호 + 공동 | 지원/미지원 라벨과 dataset 조사 조건 명시 |
| P0-2 | event/state 모델 | DECISION → APPEAL → REVIEW, ALLOW/RESTRICT/HUMAN_REVIEW | 공동 | 정상·직접 review·중복 appeal·오류 전이 표 합의 |
| P0-3 | AI → receipt | 정수 scores_ppm, model/policy manifest, typed inference errors | 주진호 주도 | 라벨 누락·truncation·threshold 경계 처리 합의 |
| P0-4 | receipt bytes | body/bundle 분리, timestamp/null/Unicode/정수/JCS 규칙 | 공동 | 완전한 필드 목록과 사건별 required/null 규칙 합의 |
| P0-5 | hash → Merkle | SHA-256 domain, ordered CT tree, entry bytes, proof 방향 | 설경민 주도 | 빈/단일/홀수 트리와 변조 처리 규칙 합의 |
| P0-6 | Merkle → contract | epoch_id/root/count/version, publisher, immutable 등록 | 설경민 주도 | 논리적 register/get/event와 오류 목록 합의 |
| P0-7 | 독립 검증 | 신뢰 chain/contract/issuer, finality, RPC 오류, lifecycle | 공동 | VALID와 부분 검증/보류/실패 UI 의미 합의 |
| P1 | 구현 선택 | 실제 데이터·모델·threshold, Python/JS library, framework, chain | 각 담당 | P0 경계를 유지하고 선택 근거 기록 |
| P2 | 운영 선택 | 배치 시간/수, DB, 배포 환경, 키 보관, 재시도, 접근 통제 | 설경민·노유신 + 공동 | 실제 demo 환경에서 구현 전 필요한 설정 확정 |

P0-1에서는 서비스가 지원할 라벨의 의미를 정한다. 최종 모델 선정과 실제 threshold 수치 평가까지 이번 단계에서 끝내는 것은 아니다. 인증·원문 접근 통제는 기록 저장 및 appeal 구현 전 필수이며 선택적인 보안 부가기능이 아니다.

## 이번 설계 단계의 완료조건

- 네 인터페이스 생산자/소비자와 책임을 세 팀원이 설명할 수 있다.
- model output과 policy action, receipt hash와 Merkle leaf, body와 anchor bundle을 구분한다.
- 제안서에 무결성과 정확성을 혼동하는 문구가 없다.
- 라벨·manifest·schema의 아직 미정인 세부 내용을 명시하고 합의할 순서를 정했다.
- 구현 시작은 사용자 요청 후 별도 단계로 진행한다.

## 다음 구현 단계에 들어갈 때 필요한 산출물

합의한 내용을 정식 JSON Schema와 manifest schema, 버전별 protocol 명세로 고정한다. 현재는 합의 전 Markdown 계약 초안이며 정식 schema/ABI로 승인되지 않았다.
이어 합성 입력임을 명시한 공통 테스트 벡터를 실제로 생성하여 Node 백엔드와 브라우저에서 비교한다. Python이 receipt 직렬화/hash에도 참여하면 Python 비교를 추가한다. 아래는 수행 계획이며 이미 통과한 결과가 아니다.

| 영역 | 필수 검증 |
|---|---|
| Receipt | 같은 body/key 순서 변경의 동일 hash, 필드 변경의 다른 hash, timestamp와 null 규칙, 중복 key/Unicode 오류 거부 |
| AI 계약 | 누락/범위 밖 점수 거부, 정수 threshold 바로 아래/같음/바로 위, TRUNCATED 우선순위, 모델 실패의 가짜 ALLOW 금지 |
| Merkle | n=1/2/3/5, 모든 index, 변경 leaf, wrong root, 누락/추가 proof, 잘못된 count/index, duplicate receipt, empty epoch |
| 상호운용 | Node와 브라우저의 canonical bytes/receipt hash/root/proof 일치. Python도 계산에 참여할 때 비교 추가 |
| Contract | 정상 등록/조회/event, 중복·권한 없는 호출·지원 안 되는 version·0 count·수정 시도 거부 |
| Verification | 다른 chain/contract/issuer, RPC 오류, 미확정 tx, reorg, 독립 조회 root 비교 |
| Appeal | 각 선행 receipt hash와 inclusion, 누락 기록, issuer/content 불일치, 허용 안 되는 상태 전이 |
| Integration | 실제 AI → receipt → batch → testnet anchor → 독립 검증 → 복사본 변조 실패 → appeal/review 연결 |

공통 벡터가 통과하기 전에는 “상호운용 가능한 protocol이 구현됐다”고 주장하지 않는다. 실제 testnet transaction이 없으면 “온체인 검증 완료”라고 쓰지 않는다.

## 결정 기록

| 날짜 | 결정 | 이유 | 대안 | 상태 |
|---|---|---|---|---|
| 2026-09-11 | 저장소를 `frontend/`와 `backend/`로 나누고 컨트랙트는 `backend/contracts/`에 둔다 | 사용자 요청. 기획제안서의 역할 분담(AI·프론트엔드 / 블록체인·백엔드)과 일치 | 기획제안서 8장의 contracts·ai·web·docs 네 폴더 구조 | 사용자 선택 |
| 2026-09-11 | 백엔드는 Node.js + TypeScript (Express 5) | 프론트엔드(React·Web Crypto·ethers.js)와 같은 언어로 레코드 직렬화·hash 코드를 공유해 교차 언어 불일치 위험을 줄인다 | Python + FastAPI (로컬 모델·XAI 라이브러리 활용에 유리) | 사용자 선택 |
| 2026-09-11 | 프론트엔드는 Vite + React + TypeScript, 컨트랙트 도구는 Hardhat 3 (Mocha + ethers) | 기획제안서 5장의 검증 계층(React·ethers.js)과 Solidity·EVM 테스트넷 방향 | Next.js, Foundry | 제안 (뼈대에 적용) |

Node와 브라우저의 공통 벡터가 우선이다. Python이 추론 출력만 전달하면 I1을 검증하고, 직렬화/hash에도 참여하면 바이트 상호운용을 추가한다.

## 유지할 미확정 사항

데이터셋 라이선스·split·라벨, base model과 LLM 제공자, 모델 성능, calibration 방식과 threshold 수치, 정확한 manifest schema, 접근 통제 오프체인 DB/스토리지(원문 공개 IPFS 미채택), testnet(최신 기획서는 체인 미정), finality 정책, batch 설정, 저장/배포 방식, 사용자 인증 및 reviewer 권한 설계, 재심 확장. 새로운 선택은 기존 문서를 수정하고 변경 이유를 기록한다.

최신 PPTX 8장의 등록 단위는 epoch다. 이전 기획서와의 등록 단위 충돌은 최신 기획 방향으로 정리한다. 정확한 ABI·타입 폭·권한·재시도·finality는 P0-6과 계약 초안 C06에서 결정한다.

## 최신 자료에 따른 상태 갱신 (기술 승인과 구분)

| 날짜 | 항목 | 근거 | 상태 |
|---|---|---|---|
| 2026-09-12 | HTTP 451, 주진호·노유신·설경민 3인 역할 | 최신 PPTX 10장 본문 | 최신 기획 반영 |
| 2026-09-12 | epoch 단위 등록, 연결된 appeal/review를 후속 batch에 포함 | 최신 PPTX 6·8장 | 최신 기획 방향. ABI 승인 아님 |
| 2026-09-12 | 프론트엔드 계산·시뮬레이션 존재, 실제 AI·testnet 미연결 | 제품 소스 908f64e | 구현 관찰 |
| 2026-09-12 | 공통 문서 현행화와 다음 계약 초안 작성 | 현재 사용자 요청 | 작업 범위. 신규 프로토콜 승인 아님 |
| 2026-09-19 | 역할 재배치: 주진호 AI 판정·평가·기획, 설경민 프로토콜·블록체인·기술 리드(backend 설계 포함), 노유신 서비스 개발(backend API 구현·frontend 검증 화면) | 전공 적합도 기준 팀 합의. 9/19 OT 발표자료 7장에 반영 | 팀 합의. 기획서 10장 분담을 대체 |

## 다음 계약 검토 상태

모두 **PROPOSED / 승인 근거 없음**이다. [04 계약 초안](04-interface-contract-draft.md)의 같은 ID를 사용한다. ‘초안 작성’과 ‘합의 완료’를 구분하고, 채택 시 승인자·날짜·근거 링크·영향받는 버전·검증 결과를 기록한다.

| ID | 검토 항목 | 담당 |
|---|---|---|
| C01 | 라벨·score·입력/evidence·오류 계약 | 주진호, 설경민·노유신 검토 |
| C02 | 사건 상태 전이·권한·중복·멱등성 | 설경민 설계·노유신 구현, 공동 검토 |
| C03 | ReceiptBody/Bundle·manifest·버전 규칙 | 설경민(manifest 내용은 주진호), 공동 검토 |
| C04 | 제한 직렬화 프로파일 또는 JCS 채택 | 설경민, 공동 검토 |
| C05 | hash/Merkle·공통 테스트 벡터 | 설경민, 노유신 검토 |
| C06 | epoch ABI·reader·chain/finality·키 운영 | 설경민·노유신, 공동 검토 |
| C07 | 검증 결과·side check·개인정보·자료 가용성 | 설경민·노유신, 공동 검토 |
| C08 | 시험 데이터와 실제 모드·마이그레이션 경계 | 공동 |

## P0 안정화와 prototype 상태 (2026-09-13)

위 P0-1~7은 과거 프로토콜 합의 순서다. 이번 제출 전 P0는 문서·PoC 정확성·재현성·검증이며 실제 통합은 P1로 보류한다.

PROPOSED: 제안 / PROTOTYPED: 코드에 시험 적용, 승인 전 / ADOPTED: 명시적 선택 근거 있음 / DEFERRED: 이번 실행 보류.

| 항목 | 상태 | 채택 전 조건 |
|---|---|---|
| frontend/backend 분리·Node TS backend | ADOPTED | 위 2026-09-11 사용자 선택 기록 |
| receipt body/bundle·event kinds·verimod/1 | PROTOTYPED | C02/C03 schema·버전 합의 |
| 제한형 canonical JSON | PROTOTYPED | C04 프로파일/JCS 비교·기존 바이트 호환 |
| hash domains·CT Merkle·UUID lexical order | PROTOTYPED | C05 독립 벡터·런타임 상호운용 |
| scores_ppm·5라벨·합성 threshold | PROTOTYPED | 실제 모델 score 의미·평가 |
| RESOLVED·판정당 appeal/review 1건 | PROTOTYPED | D08/C02 최종 상태·권한·멱등성 |
| C09 공통 protocol 구조 | PROPOSED | packages/protocol, shared/protocol, issuer+verifier 대안 비교 후 승인 |
| 실제 AI·DB·epoch 계약·testnet | DEFERRED | [P1 backlog](06-p1-backlog.md)의 완료조건 |

위 C01~C08 계약 전체는 여전히 PROPOSED다. 그 일부를 구현한 prototype과 정식 채택을 구분한다. 이번 사용자 prompt는 P0 수정을 허용한 작업 요청이며 신규 protocol 결정의 승인 근거가 아니다.
