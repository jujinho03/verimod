# DOC-14 — Cross-Document Conflict Audit

## 1. Scope

2026-09-24 · **W1 DOC-14 audit / DRAFT**. source synchronization 전 conflict identification 단계다. Cross-LLM 원문 자체는 아직 수정하지 않았으며 각 담당 확인도 완료로 간주하지 않는다. 이 문서는 새 기술 결정·계약·MUST를 만들지 않는다.

Preflight: `main`, HEAD = fetch 후 `origin/main` = `f807585dae3930e8c249c5975d0d4cb88b060cb4`, ahead/behind `0/0`, clean. 기존 DOC-14 conflict 문서는 없었다. 작업 브랜치는 `docs/w1-doc-14-conflict-audit`이며 감사 파일 하나만 추가한다.

최신 main의 [VeriMod P0 checks #30](https://github.com/jujinho03/verimod/actions/runs/35959643298)은 해당 SHA에서 completed/success, frontend/backend/contracts 모두 success로 조회했다. 이번 감사에서 제품 테스트를 실행한 것은 아니다. CI 성공은 실제 AI·업무 API·epoch contract 배포 완료를 뜻하지 않는다.

판정 단위는 표의 각 행이다. ALIGNED / STALE / CONFLICT / AMBIGUOUS / MISSING / NOT APPLICABLE만 사용한다. MISSING은 지정 문서의 핵심 planning 설명 누락이지 저장소 전체에 근거가 없다는 뜻이 아니다. 과거 snapshot은 날짜가 오래됐다는 이유만으로 오류로 분류하지 않는다. superseded PROPOSED 초안의 잔존과 승인된 결정의 충돌도 구분한다.

## 2. Authority Order

1. 최신 사용자 지시
2. 실제 최신 GitHub main / code / tests / CI
3. VeriMod 3인 7주 실행 프롬프트 VERIFIED FINAL
4. VeriMod 7주 Master Plan v1.2.1
5. 최신 repository decision register
6. Cross-LLM Master Prompt
7. 과거 문서 / 대화

CURRENT code는 구현 사실의 근거이며 TARGET 설계의 자동 승인 근거가 아니다. ADOPTED는 결정 승인, WORKING ASSUMPTION은 FRZ-01 전 잠정 기준, PROPOSED는 미승인 초안, UNRESOLVED는 미확정이다. NEXT/TARGET을 구현 완료로 읽지 않는다.

## 3. Source Inventory

아래 repo 경로·행 번호는 감사 base SHA 기준이다. FINAL/MP 페이지 번호는 PDF의 1-based 페이지다. Cross 행 번호는 직접 읽은 원본 Markdown 기준이다. PDF는 텍스트를 읽었으며 원본을 수정·복제하지 않았다.

| Source | Version / Date | Role | Editable in this task |
|---|---|---|---|
| latest GitHub main | f807585dae3930e8c249c5975d0d4cb88b060cb4; 2026-09-24 조회; CI #30 | CURRENT 기준 | NO |
| VERIFIED FINAL (FINAL) | 첨부 49쪽; 표지 2026-09-23 / v1.2.1 synchronized 표기 | 실행 planning; p.4~10,18,40,49 직접 대조 | NO |
| Master Plan (MP) | `VeriMod_7주_마스터플랜.pdf`; 56쪽; p.1 **1.2.1 · 2026-09-23 · Final consistency patch** | planning; p.16~17,22~23,33 등 관련 조항 대조 | NO |
| decision register | [02](02-decision-register.md), 2026-09-23 Command Center 승인 기록 | D01~D28 상태·supersedes | NO |
| Cross-LLM Master Prompt (Cross) | 원문 1,955행; §6의 마지막 직접 확인일 2026-09-22; 별도 content version 미기재 | 하위 handoff context | NO |
| README / docs index | [README](../README.md), [docs/README](README.md) | 현재 구현·탐색·역할 | NO |
| domain / I1 contract | [01](01-domain-and-interfaces.md), [04](04-interface-contract-draft.md); 04 C01에 2026-09-24 AI-03 | PROPOSED/DRAFT + 개별 승인 제약 | NO |
| status / backlog | [03](03-current-status.md), [06](06-p1-backlog.md) | CURRENT 표기와 과거 계획 대조 | NO |
| audit / validation / submission | [05](05-protocol-audit.md), [07](07-validation-2026-09-13.md), [08](08-submission-guide.md) | 날짜 있는 실행 증거와 현 안내 구분 | NO |
| mentor prep | [mentor-prep-w1](mentor-prep-w1.md), 2026-09-24 | W1 DOC-04 DRAFT; 희망과 실제 배정 구분 | NO |
| code / tests / CI config | frontend/src/domain/{types,schema,policy,manifests,canonical,hash}.ts; hardening.test.ts / policy.test.ts; backend/src/app.ts / test/health.test.ts; backend/contracts/contracts/ToolchainCheck.sol / test/ToolchainCheck.ts; .github/workflows/ci.yml | CURRENT 제약·기존 회귀 검사·CI 범위 | NO |
| MASTER_CONTEXT.md | main에 없음; 07 L148~159에 제출 main에서 제거한 이력 | 최신 main 문서로 간주하지 않음 | NO |

외부 원문 위치(사용자가 지정한 '주진호' 폴더에서 확보):

- Cross: `C:/Users/user/Desktop/주진호/02.공모전/4.BLOCK AI/자료/계획·학습/BLOCK AI - VeriMod Cross-LLM Master Prompt.md`
- MP: `C:/Users/user/Desktop/주진호/02.공모전/4.BLOCK AI/자료/계획·학습/VeriMod_7주_마스터플랜.pdf`
- FINAL: 사용자 첨부 `1-TalkFile_VeriMod_3인_7주_실행_프롬프트_VERIFIED_FINAL.pdf` (codex-remote-attachments의 원본; 파일명 한글은 분해형).
- Cross SHA-256: `95a6b7004e0279e545b1164181dd5dadf834cbe1798e8b1f30332c6ecee2ab41`
- MP SHA-256: `7f59ae235701ebd4bac5bec031332f9528e0f70eb23e19582485b299bbf3e19d`

### Decision baseline 직접 확인

02 L25~41의 17행은 모두 ADOPTED, L49~59의 11행은 모두 WORKING ASSUMPTION이다. 아래는 원문 상태를 보존한 요약이며 재승인하지 않는다.

| IDs | Repository status | 직접 확인한 결정 내용 | Location |
|---|---|---|---|
| D01 / D02 / D03 | ADOPTED | 한국어 encoder·I1 유지 fallback / native labels 우선·misinformation 제외·GATE-2 taxonomy / reason_codes·triggered_rule_ids MUST, span SHOULD | 02 L25~27 |
| D04 / D05 / D06 | ADOPTED | SQLite / epoch Merkle batching / 새 APPEAL·REVIEW receipt | 02 L28~30 |
| D07 / D08 / D09 | ADOPTED | ppm 정수·Python 반올림 1회·UNCALIBRATED / outcome와 action 분리·terminal / 명칭·메시지 | 02 L31~33 |
| D10 / D11 / D12 | ADOPTED | v1.2.1 일정 / Canonical Profile v1·기존 bytes 보존 / Base Sepolia 84532 | 02 L34~36 |
| D13 / D14 / D15 | ADOPTED | 승인 TrustProfile·locator 비신뢰 / version 저장·판정은 verifier / 등록시각 필드 없음·tx/event 증거 | 02 L37~39 |
| D16 / D17 | ADOPTED | demo principal·identity proof 아님 / FINAL 범위 분류·W1 신규 확장 없음 | 02 L40~41 |
| D18 / D19 / D20 | WORKING ASSUMPTION | W2 말 semantic freeze / 소유자 material+브라우저 원문의 Package / 제공받은 이력만·freshness/completeness 미보증 | 02 L49~51 |
| D21 / D22 / D23 | WORKING ASSUMPTION | 쓰기 3 API 멱등키 / 5상태·signed tx 선기록·reconcile / uint64 sequence와 decimal string | 02 L52~54 |
| D24 / D25 / D26 | WORKING ASSUMPTION | 503·미발급·fake ALLOW 금지 / FRR≤X·HRR_TOTAL≤B에서 HAR 최소 / Gate fallback | 02 L55~57 |
| D27 / D28 | WORKING ASSUMPTION | TEST 사용·재실행 제한(문구 모순은 Row-25) / Primary 하나·Secondary 외부 평가 SHOULD | 02 L58~59 |

## 4. Conflict Matrix

Owner는 02 L70 및 FINAL p.4의 담당 영역에 따른 **확인 책임**이며 실제 확인 완료나 새 업무 배정을 뜻하지 않는다. Row 번호는 이 문서 내부 식별자일 뿐 project ticket이 아니다.

| ID | Topic | Source / Location | Current Text or Meaning | Latest Authority | Status | Required Action | Owner |
|---|---|---|---|---|---|---|---|
| Row-01 | A · Identity | Cross L61~84; README L3~4; 02 D09 | HTTP 451 / VeriMod / User-Verifiable AI Moderation Protocol / Decide. Prove. Appeal. | D09 ADOPTED; FINAL p.7 | ALIGNED | 유지 | A / 주진호 |
| Row-02 | B · AI correctness / 실행 진실성 | Cross L197~217; README L118; mentor L57~58 | AI 정답성·실제 모델 실행·거짓 score·완전성을 증명하지 않음 | FINAL p.7,10; D20 WA | ALIGNED | 목표와 CURRENT 검증 범위 구분 유지 | JOINT |
| Row-03 | B · Freshness | Cross §4 L187~205 | 사건 누락은 미보증이나 최신 REVIEW 숨김/freshness와 '제공받은 lifecycle' 범위가 명시적이지 않음 | FINAL p.10; MP p.4 교정표; D20 WA | MISSING | Cross에 최신성·제공받은 이력 한계를 연결; 기존 문장이 완전성을 보증한다고 과장하지 않음 | T / 설경민 |
| Row-04 | C · 현재 main 안내 | 03 L7; 08 L21 | '현재 제출 기준' main = f1e4384... | fetch main=f807585...; CI #30 | STALE | 현행 기준점과 역사 snapshot을 구분해 후속 문서 수정 | A / 주진호 |
| Row-05 | C · 역사 SHA | Cross L329~349; FINAL p.6; 02 L11; 05 L16; 07 §역사 기록 | 5f030f6 등은 날짜 있는 baseline이며 최신 재조회 지시 또는 역사 표시 존재 | 이번 fetch/CI로 CURRENT 확인 | ALIGNED | 역사 증거 보존; 과거 CI를 현재 CI로 재사용하지 않음 | A / 주진호 |
| Row-06 | C · 승인 상태 | 03 L80 | 'C01~C08은 모두 PROPOSED이고 팀 승인 기록은 없다' | 02 L17,25~41; 04 C01 AI-03: 전체 계약 미승인과 개별 ADOPTED 제약 구분 | STALE | 일괄 미승인 문구를 개별 제약 승인과 분리; C01 전체를 ADOPTED로 바꾸지 않음 | JOINT |
| Row-07 | C · 실제 구현 | README L75~79; 03 L35~46; Cross §7~9; app.ts / ToolchainCheck.sol | browser synthetic PoC, health/ping scaffold; 업무 API·실 AI·실 체인 미구현 | 최신 code/tests/CI; FINAL p.6 | ALIGNED | TARGET 계획을 구현 증거로 승격하지 않음 | JOINT |
| Row-08 | D · Taxonomy | Cross L571~597; 04 C01 L24~114; types.ts L17; schema.ts L113~114 | 5개 key는 demo 제약; native labels 우선, Primary·final taxonomy 미정 | D02 ADOPTED; 사용자 AI-01/02 PASS 및 AI-03 범위 | ALIGNED | 시험 key를 최종 taxonomy로 승계하지 않음; violence/sexual/spam을 우선 후보의 독립 supervision으로 주장하지 않음 | A / 주진호 |
| Row-09 | D · Misinformation | 06 §실제 AI; 'MVP 제외 가능성' | 제외가 여전히 선택지처럼 남음 | D02: misinformation 제외 | STALE | 제외 방향을 최신 승인과 맞추고 이전 후보 기록은 구분 | A / 주진호 |
| Row-10 | E · Score / policy / evidence | 04 C01 Adopted constraints·Proposed fields·Unresolved decisions | D07 정수 0..1,000,000·Python floor 1회; D03 policy reason/rule MUST, span SHOULD; negative label≠ALLOW | D03/D07 ADOPTED; 최신 AI-03 지시 | ALIGNED | calibration·threshold·exact requiredness 미확정 유지 | A / 주진호 |
| Row-11 | E · Cross I1 completeness | Cross §15~17; 전체 키워드 검색 | uncalibrated≠probability와 model/action 구분은 있으나 rounding once, reason_codes/triggered_rule_ids 요구 누락 | D03/D07; 04 C01 | MISSING | 기존 I1 근거를 Cross에 연결; 새 field/MUST 발명 금지 | A / 주진호 |
| Row-12 | E · Inference unavailable | Cross §9,15~17 및 전체 검색; 04 C01 Working assumptions | Cross에 실패→503 INFERENCE_UNAVAILABLE·DECISION 미발급 경계 없음; 04는 WA로 명시 | D24 WORKING ASSUMPTION; FINAL p.8 | MISSING | Cross에 잠정 실패 경계를 명시; 구현된 HTTP API로 쓰지 않음 | JOINT |
| Row-13 | F · Receipt / bytes | 01 L104,123; Cross §10~11; canonical.ts / hash.ts; hardening.test.ts L118 | body와 proof/anchor 분리, 도메인 분리·ordered Merkle·기존 hash 회귀; full JCS 주장 안 함 | D05/D11; FINAL p.8 | ALIGNED | 기존 byte semantics 보존 | T / 설경민 |
| Row-14 | F · Canonical 채택 상태 | Cross L522~528 '필요하면'; 04 C04 L168~171 profile/JCS 대안 | Canonical Profile 선택이 아직 열려 있는 표현 | D11 ADOPTED; FINAL p.10 full JCS migration BACKLOG | STALE | 승인된 방향과 미확정 세부 규칙 분리; JCS 전환을 이번 범위로 승격하지 않음 | T / 설경민 |
| Row-15 | F · Shared ownership | Cross §11,31; 전체 shared/ 검색 없음 | 수식·벡터는 있으나 server/browser 공통 구현과 운영 Python 역할 경계 없음 | FINAL p.4: T shared/, A는 score→ppm; 06 §공통 프로토콜 | MISSING | Cross에 소유·공통 import 방향 연결; CURRENT shared 구현 완료로 쓰지 않음 | T / 설경민 |
| Row-16 | G · Locator trust root | Cross L758~778; 01 L171; 06 L96 | 번들 주소는 lookup metadata, trust root 아님 | D13 ADOPTED | ALIGNED | chain/contract/publisher authority 분리 유지 | T / 설경민 |
| Row-17 | G · TARGET TrustProfile | Cross §19 및 L1188,1316 | TARGET에도 TrustConfig 명칭; 승인 2개 profile·profile별 confirmations 설명 없음 | D13; FINAL p.7,9; MP p.4 | STALE | CURRENT TrustConfig는 보존하고 TARGET TrustProfile·2 profiles 기준 연결 | T / 설경민 |
| Row-18 | H · Testnet | 03 L29 '체인 미정'; 04 L225; 06 L90 'Base Sepolia 등은 후보' | target chain 선택 전 상태 | D12: Base Sepolia 84532 ADOPTED | STALE | chain 방향 갱신; RPC vendor·Base min_confirmations·가스 수치 미정 유지 | T / 설경민 |
| Row-19 | H · protocolVersion | 01 L161; 04 L209; 06 L84,86 | contract가 supported version 검사 / unsupported-version 거부 테스트 | D14 및 02 L63: version 저장, 지원 판단 verifier | CONFLICT | **이미 superseded된 PROPOSED 초안** 표시·연결 필요; 실제 contract 코드 결함으로 보고하지 않음 | T / 설경민 |
| Row-20 | H · Registration time | 01 L163 | 'contract가 block.timestamp / block.number로 기록' | D15 및 02 L64: 별도 timestamp field 없음; tx receipt/event evidence | CONFLICT | **이미 superseded된 PROPOSED 저장안** 표시; 새로운 ABI/storage 설계 금지 | T / 설경민 |
| Row-21 | H · Cross contract completeness | Cross §22; protocolVersion/registration 관련 전체 검색 | 최소 contract 원칙만 있고 version 책임·등록 증거 경로 미기재 | D14/D15; MP p.16 | MISSING | 채택 범위를 연결; Cross에 옛 ABI가 있다고 추정하지 않음 | T / 설경민 |
| Row-22 | I · Anchor states | 01 L173; 04 L216~221 | PENDING→SUBMITTED→CONFIRMING→ANCHORED; BATCHED 등 옛 planning | D22 WA 및 02 L65; MP p.23: FROZEN→SUBMITTING→SUBMITTED→CONFIRMED/FAILED | CONFLICT | 최신 **잠정 epoch planning**과 옛 초안 구분; core verifier PENDING/UI 상태를 임의 개명하지 않음 | T / 설경민 |
| Row-23 | I · Crash recovery | Cross §24 L902~922 | atomic freeze·동일 epoch retry만 있고 signed tx 선기록·5상태·reconcile 누락 | D22 WA; FINAL p.9; MP p.23 | MISSING | Cross planning 보완 대상; DB 구현 완료 주장 금지 | T / 설경민 |
| Row-24 | J · DB / Idempotency / Package | 06 L50~55; Cross §24; 04 C02,C08 | DB는 SQLite/PostgreSQL 병렬 후보. Cross는 idempotency 일반론만; docs04는 키 후보·private 전달 일반론 | D04 SQLite ADOPTED; D19/D21 WA; FINAL p.40·MP p.22: 3 write key, 발급 응답 no original_text echo, salt 소유자 한정·GET/bundle/log/error 제외 | STALE | repo DB 선택 상태 갱신 필요; 정확한 API/Package 누락은 다음 행에서 분리 | F / 노유신 |
| Row-25 | K · TEST '선택' 모순 | 02 D27 L58; FINAL p.8 D27; MP p.33 D27 문단 | 'TEST는 model/threshold/policy 선택에 1회 사용' / '선택에 한 번' | D27은 최신 사용자 승인 planning 기준으로 우선 적용하는 WORKING ASSUMPTION이며 ADOPTED가 아니다. FRZ-01 전까지 최종 채택 아님. VERIFIED FINAL p.18의 validation 선택→LOCK→TEST 표현과 직접 충돌한다(MP p.33 상세 순서·Cross L562~565도 validation→LOCK→TEST). | CONFLICT | source 간 직접 충돌을 기록한다. 이 audit에서 methodology를 새로 결정하지 않으며 D27 상태/내용도 변경하지 않는다. 최종 채택·문구 정합성은 FRZ-01 전 검토 대상으로 유지한다. | A / 주진호 |
| Row-26 | K · Primary / Secondary | Cross §12,18; Secondary 전체 검색 없음 | split·카드는 있으나 Primary 하나와 Secondary 외부 평가 경계 없음 | D28 WORKING ASSUMPTION; FINAL p.8,18 | MISSING | 잠정 사용 전략 연결; Primary 선택·dataset 병합 수행 금지 | A / 주진호 |
| Row-27 | K · Policy objective | Cross §14,16 | 일반 FPR/FNR·threshold 설명; HRR_TOTAL 제약과 HAR 목적함수 없음 | D25 WA; FINAL p.8,18; 02 L56 | MISSING | FRR≤X·HRR_TOTAL≤B와 tie 규칙을 잠정 planning으로 연결; X/B 미정 유지 | A / 주진호 |
| Row-28 | L · W1/W2 freeze | Cross L1179~1196 | W1 공동: 'I1~I4 interface freeze' | D18 WA; FINAL p.5,8,49; MP p.11: W1 draft→W2 말 semantic freeze | CONFLICT | Cross W1 완료 기준과 W2 동결 일정 동기화 대상 | JOINT |
| Row-29 | L · Gates / fallback | Cross §31,35 | 주차·demo fallback은 있으나 GATE-2/4/5 날짜·발동 조건 없음 | 02 L76~78; FINAL p.5,49: 10/04·10/18·10/25 각 21:00 | MISSING | Gate-2 축소·Gate-4 AI/chain/verifier 경로·Gate-5 scope-cut 연결; 실제 Gate PASS 생성 금지 | JOINT |
| Row-30 | L · 현재 W1 evidence | mentor L14; 02 L70~78; 04 C01 | AI-01/02 PASS, AI-03 main 반영; Primary/taxonomy/threshold 미정; W1 계약·조사 | 최신 사용자 지시; FINAL p.5; 실제 main | ALIGNED | 연구·문서 완료와 구현 완료 분리 유지 | A / 주진호 |
| Row-31 | Authority / decision status | Cross L1703~1710,1733~1737; FINAL p.1,7 | Cross 우선순위에 FINAL/v1.2.1/최신 register 없음; WA 정의 없음. FINAL p.1은 충돌 시 MP 우선이라고 씀 | 이번 사용자 authority order: FINAL→MP→register→Cross; 02 17 ADOPTED / 11 WA | CONFLICT | 최신 사용자 authority order를 현재 감사 기준으로 사용한다. VERIFIED FINAL / Cross-LLM의 authority 문구는 후속 동기화 대상이며 이 audit에서 source 문서를 직접 수정하지 않는다. 이 충돌을 해당 문서의 나머지 내용까지 무효라는 뜻으로 확대 해석하지 않는다. | JOINT |
| Row-32 | Sync claim provenance | FINAL 표지 'Cross-LLM Master Prompt ... synchronized'; 실제 Cross §31,41 | PDF 동기화 표기가 실제 로컬 Cross 최신화를 증명하는지 불명확 | 직접 확보한 Cross에 Row-28,31 차이 존재 | AMBIGUOUS | 어떤 원본/버전을 동기화했다는 뜻인지 확인; 로컬 Cross 동기화 완료 주장 금지 | A / 주진호 |
| Row-33 | Historical reports | 05 STATUS AUDIT SNAPSHOT·L16; 07 §2026-09-13 역사 기록 | 과거 lint/test/SHA를 날짜별 보존 | 최신 CI #30과 역사 증거의 용도가 다름 | NOT APPLICABLE | 과거 실행 기록을 최신값으로 덮어쓰지 않음 | A / 주진호 |
| Row-34 | J · API privacy planning 누락 | Cross §10,24 및 salt/Private Receipt/Idempotency-Key 검색 없음; 04 C02/C08 | 공개 체인 원문 금지는 있으나 소유자 응답·브라우저 Package·원문 echo 금지·3 write 키 규칙을 구체 연결하지 않음 | D19/D21 WA; FINAL p.40; MP p.22 | MISSING | Cross와 repo contract의 후속 연결 필요; 실제 salt 유출이나 API 구현 결함이 발견된 것은 아님 | F / 노유신 |
| Row-35 | Lifecycle approval | 01 L53; 04 L130; 06 L104 | RESOLVED 정식 채택 검토/미승인 prototype | D08 ADOPTED; 02 L32,66 | STALE | 승인된 outcome/terminal 방향과 상세 미승인 API를 분리 | T / 설경민 |
| Row-36 | Mentoring scope | mentor L18~28,44~53; MP p.17 M6 | APPEAL/REVIEW SHOULD 선택지를 멘토 질문으로 제시 | 최신 사용자 DOC-04가 정확히 요구한 질문·잠정 판단; FINAL M6는 현 execution 목표 | ALIGNED | 질문을 이미 확정된 scope-cut으로 읽지 않음; 희망 배정 미확정 유지 | A / 주진호 |
| Row-37 | P0 잔여 lint | 06 L108 'lint UI 경고'; 05 L7 | backlog에 기존 lint warning 해소 전 표현 잔존 | 05 09/14 재점검: '기존 8개 lint 경고 ... 해소'; 최신 CI success | STALE | 해소 이력과 진짜 잔여 위험 분리; CI success만으로 모든 위험 해소 주장 금지 | F / 노유신 |

## 5. High-Risk Conflicts

- **Row-19 / protocolVersion / CONFLICT / T:** contract-side 지원 검사 초안은 D14에 의해 superseded. 현재 실제 Solidity는 ToolchainCheck이므로 잘못된 epoch contract가 배포됐다는 뜻이 아니다.
- **Row-20 / registration-time / CONFLICT / T:** block.timestamp/block.number 저장 초안은 D15에 의해 superseded. 등록 증거는 tx receipt/event 경로다.
- **Row-22 / anchoring / CONFLICT / T:** 옛 epoch 상태와 D22 잠정 상태가 다르다. signed tx prerecord/reconcile도 Cross에 없다(Row-23). WA를 ADOPTED로 올리지 않는다.
- **Row-28 / W1-W2 / CONFLICT / JOINT:** Cross의 W1 freeze는 W1 초안·W2 말 FRZ-01 기준과 다르다.
- **Row-25 / TEST / CONFLICT / A:** D27의 TEST 선택 문구는 VERIFIED FINAL의 validation 선택→LOCK→TEST와 직접 충돌한다. 최신 사용자 승인 planning 기준인 D27 WORKING ASSUMPTION을 우선 적용하되 ADOPTED로 승격하지 않으며 FRZ-01 전 최종 채택이 아니다. 이 audit에서 methodology를 새로 결정하지 않는다.
- **Row-17,34 / TrustProfile·Package / STALE·MISSING / T,F:** 옛 TrustConfig 중심 TARGET 및 소유자 salt 전달·no echo·3 write 멱등키 설명의 누락. locator를 trust root로 삼는 문장이나 실제 공개 salt 노출은 이번 조사에서 발견하지 않았다.
- 검토한 범위에서 **synthetic 5-label을 final로 확정하는 주장, AI correctness 보장 주장, Primary 최종 선택 주장은 NONE FOUND**. CURRENT 5-key schema 자체는 TARGET 승인 근거가 아니다.

## 6. Cross-LLM Status

- Cross-LLM 원문 수정 여부: **NO**
- synchronization status: **AUDIT ONLY / NOT YET SYNCHRONIZED**
- 로컬 원문을 직접 읽어 대조했다. VERIFIED FINAL 표지의 synchronized 표기만으로 이 원문이 최신이라고 간주하지 않는다.
- 이 감사 파일은 synchronization patch도, A/T/F 확인 완료 증거도 아니다.

## 7. Owner Confirmation Required

| Role | Owner | Areas to Confirm | Status |
|---|---|---|---|
| A | 주진호 | AI / planning / docs; 특히 TEST 선택 문구·authority·W1/W2·Gate | PENDING |
| T | 설경민 | protocol / chain / security; D14·D15·D22·TrustProfile·shared 경계 | PENDING |
| F | 노유신 | service / API / DB / frontend; SQLite·Idempotency-Key·Package privacy | PENDING |

## 8. Proposed Next Step

- **Repository docs 수정 필요:** Row-04,06,09,14,18~20,22,24,35,37의 stale 또는 superseded 표현. 역사 기록은 보존하고 최신 결정으로 연결하는 후속 patch 범위를 검토한다.
- **Cross-LLM source 수정 필요:** Row-03,11~12,15,17,21,23,26~29,31의 누락·일정·상태 표현. 현재 파일을 수정하지 않는다.
- **둘 다 연결 필요:** Row-14,17,24,34의 canonical/trust/API-private 경계는 Cross와 repo 계약 설명이 같은 승인·잠정 상태를 가리키게 할 필요가 있다. 새로운 contract 설계가 아니다.
- **Human decision/확인 필요:** Row-25의 'TEST 선택' 의도, Row-32의 동기화 대상 원본, Row-31의 외부 문서 authority 문구 정리. 판단 전 임의로 decision register·PDF를 고치지 않는다.
- final taxonomy·Primary·X/B·threshold·model·calibration·exact Base min_confirmations·epoch size/cadence·RPC vendor는 계속 UNRESOLVED. D18~D28은 WORKING ASSUMPTION 유지.

이번 산출물은 conflict identification 초안 한 파일이다. 기존 문서·code 변경, owner confirmation 완료 처리, OPS-02, W1 progress 문서, W2 작업, commit/push/PR은 수행하지 않는다.

## 9. Synchronization Scope

2026-09-24 · DOC-14 Stage 2 / SCOPE ONLY. Preflight branch `docs/w1-doc-14-conflict-audit`, HEAD = fetch 후 origin/main = `f807585dae3930e8c249c5975d0d4cb88b060cb4`, ahead/behind 0/0, 감사 파일만 untracked. §1~8 및 기존 matrix는 그대로 보존한다. 아래는 Stage 1의 수정 후보를 최소 범위로 구체화한 계획이며 source patch 실행·승인 완료가 아니다. §8의 포괄적 후보보다 다음 Stage의 구체적 범위는 이 절을 따른다.

### 9.1 Disposition Legend

| Disposition | Meaning |
|---|---|
| PATCH_REPO_DOC | repository 현재 설명 문서의 최소 수정 필요 |
| PATCH_CROSS_LLM | 재사용되는 Cross-LLM Master Prompt 원문 수정 필요 |
| PATCH_BOTH | repository docs와 Cross-LLM 모두 최소 수정 필요 |
| CORRECTION_NOTE_ONLY | source 원문은 보존하고 별도 note/evidence에서 최신 기준 명시 |
| HUMAN_DECISION_REQUIRED | 현재 근거만으로 최종 문구를 정할 수 없어 인간 판단 전 patch 보류 |
| OWNER_CONFIRMATION_ONLY | 내용은 정렬되어 있어 변경 없이 담당 확인만 필요 |
| NO_CHANGE | 수정 불필요 |
| HISTORICAL_PRESERVE | 날짜 있는 과거 snapshot/evidence를 수정 없이 보존 |

행마다 disposition은 하나다. PATCH 계열은 후속 Stage의 대상 지정일 뿐 이번 수정 허가가 아니다. Human Decision Needed의 NO는 owner 확인 완료를 뜻하지 않는다. 모든 owner 확인은 PENDING이다. Row-31은 변경 가능한 Cross를 기준으로 PATCH_CROSS_LLM 하나를 부여하며 PDF 충돌은 기존 Row-31 correction evidence로만 남긴다. PDF를 추가 patch 대상으로 세지 않는다.

### 9.2 Row-by-Row Sync Plan

| Row | Topic | Current Status | Disposition | Target Source | Exact Scope | Owner | Human Decision Needed |
|---|---|---|---|---|---|---|---|
| Row-01 | Identity | ALIGNED | NO_CHANGE | NONE | 명칭·영문 정의·메시지 이미 일치; 중복 수정 없음 | A / 주진호 | NO |
| Row-02 | AI correctness / 실행 진실성 | ALIGNED | OWNER_CONFIRMATION_ONLY | NONE | 보장 한계가 유지되는지 확인만; 재서술 없음 | JOINT | NO |
| Row-03 | Freshness | MISSING | PATCH_CROSS_LLM | Cross-LLM Master Prompt | §4에 제공받은 lifecycle만 검증·freshness 미보증을 짧게 연결; D20 WA 표기 | T / 설경민 | NO |
| Row-04 | 현재 main 안내 | STALE | PATCH_REPO_DOC | docs/03-current-status.md; docs/08-submission-guide.md | '현재 제출 기준'의 옛 SHA를 날짜 있는 과거 기준으로 구분하고 현행 확인 경로 연결; 과거 CI 기록 보존 | A / 주진호 | NO |
| Row-05 | 역사 SHA | ALIGNED | HISTORICAL_PRESERVE | NONE | Cross §6·FINAL p.6·02 L11·05/07의 날짜 있는 baseline 유지; 새 SHA로 덮어쓰지 않음 | A / 주진호 | NO |
| Row-06 | 승인 상태 | STALE | PATCH_REPO_DOC | docs/03-current-status.md | L80의 일괄 '승인 기록 없음'만 개별 승인 제약과 전체 계약 DRAFT의 구분으로 정정하고 02/04 참조 | JOINT | NO |
| Row-07 | 실제 구현 | ALIGNED | NO_CHANGE | NONE | synthetic PoC·health/ping scaffold 설명 유지; code/tests/CI 수정 없음 | JOINT | NO |
| Row-08 | Taxonomy | ALIGNED | OWNER_CONFIRMATION_ONLY | NONE | CURRENT 5-key와 UNRESOLVED taxonomy/Primary 경계 확인만; AI-03 중복 수정 없음 | A / 주진호 | NO |
| Row-09 | Misinformation | STALE | PATCH_REPO_DOC | docs/06-p1-backlog.md | '제외 가능성'을 D02의 제외 결정 참조로 한정해 정정; 새 taxonomy 결정 없음 | A / 주진호 | NO |
| Row-10 | Score / policy / evidence | ALIGNED | OWNER_CONFIRMATION_ONLY | NONE | 04 C01의 D03/D07·SHOULD·negative label 경계 확인만 | A / 주진호 | NO |
| Row-11 | Cross I1 completeness | MISSING | PATCH_CROSS_LLM | Cross-LLM Master Prompt | §15~17에 D07 변환 1회와 D03 policy reason/rule 경계를 요약하고 04 C01 참조; 필드 신설 없음 | A / 주진호 | NO |
| Row-12 | Inference unavailable | MISSING | PATCH_CROSS_LLM | Cross-LLM Master Prompt | §15~17 인접 I1 설명에 D24 WA의 503·DECISION 미발급·fake ALLOW 금지 연결; 구현 완료 주장 없음 | JOINT | NO |
| Row-13 | Receipt / bytes | ALIGNED | OWNER_CONFIRMATION_ONLY | NONE | 기존 body/bundle·bytes·hash 회귀 경계 확인만; code와 수식 불변 | T / 설경민 | NO |
| Row-14 | Canonical 채택 상태 | STALE | PATCH_BOTH | docs/04-interface-contract-draft.md; Cross-LLM Master Prompt | 04 C04 및 Cross §11의 profile 선택 미정 표현을 D11 채택 방향과 미정 세부사항으로 분리; full JCS는 BACKLOG | T / 설경민 | NO |
| Row-15 | Shared ownership | MISSING | PATCH_CROSS_LLM | Cross-LLM Master Prompt | §11/31에 T shared 공통 구현 방향·운영 Python score→ppm 경계와 근거 연결; 실제 shared 구현 주장 금지 | T / 설경민 | NO |
| Row-16 | Locator trust root | ALIGNED | OWNER_CONFIRMATION_ONLY | NONE | locator 비신뢰와 사전 승인 authority 경계 유지 확인 | T / 설경민 | NO |
| Row-17 | TARGET TrustProfile | STALE | PATCH_CROSS_LLM | Cross-LLM Master Prompt | §19와 §31/32의 TARGET 참조를 D13 TrustProfile·승인 2 profiles로 연결; CURRENT TrustConfig 명칭은 보존. repo는 02 D13 참조로 충분하여 추가 수정 제외 | T / 설경민 | NO |
| Row-18 | Testnet | STALE | PATCH_REPO_DOC | docs/03-current-status.md; docs/04-interface-contract-draft.md; docs/06-p1-backlog.md | chain 전체 미정 표현만 D12 Base Sepolia 84532 승인과 운영값 미정으로 분리; 배포·확정 수치 추가 금지 | T / 설경민 | NO |
| Row-19 | protocolVersion | CONFLICT | PATCH_REPO_DOC | docs/01-domain-and-interfaces.md; docs/04-interface-contract-draft.md; docs/06-p1-backlog.md | 옛 contract-side supported-version 제안/테스트 요구에 D14 superseded 표시와 02 참조; 코드 결함 주장·ABI 변경 없음. Cross 누락은 Row-21에서 처리 | T / 설경민 | NO |
| Row-20 | Registration time | CONFLICT | PATCH_REPO_DOC | docs/01-domain-and-interfaces.md | I4 anchored_at/anchored_block 저장 제안에 D15 superseded 및 tx receipt/event 경로 명시; storage/ABI 설계 없음. Cross는 Row-21 | T / 설경민 | NO |
| Row-21 | Cross contract completeness | MISSING | PATCH_CROSS_LLM | Cross-LLM Master Prompt | §22에 D14 version 책임·D15 등록 증거 경로를 짧게 연결; 새 ABI나 이전 오류 존재를 추정하지 않음 | T / 설경민 | NO |
| Row-22 | Anchor states | CONFLICT | PATCH_REPO_DOC | docs/01-domain-and-interfaces.md; docs/04-interface-contract-draft.md | 옛 planning 상태를 이력으로 구분하고 D22의 최신 WA 5상태·선기록/reconcile 참조; 삭제보다 superseded planning 주석 우선. CURRENT UI/verifier 상태 불변 | T / 설경민 | NO |
| Row-23 | Crash recovery | MISSING | PATCH_CROSS_LLM | Cross-LLM Master Prompt | §24에 D22 WA 5상태·signed tx 선기록·reconcile 방향 연결; DB 구현 상세 추가 없음 | T / 설경민 | NO |
| Row-24 | DB / Idempotency / Package | STALE | PATCH_REPO_DOC | docs/06-p1-backlog.md | DB 후보 표를 역사 제안으로 구분하고 본선 기본 경로 D04 SQLite 승인 참조; API/Package 누락은 Row-34로 통합 | F / 노유신 | NO |
| Row-25 | TEST 선택 모순 | CONFLICT | HUMAN_DECISION_REQUIRED | NONE (판단 전 patch 보류; 기존 Row-25 evidence 유지) | D27 WA의 사용자 승인 planning 우선 적용·FRZ-01 전 미채택 경계 유지. FINAL/MP/Cross의 validation→LOCK→TEST와 충돌하는 최종 methodology·정합 문구는 정하지 않음; 02/PDF/Cross 평가 절차 재작성 금지 | A / 주진호 | YES — methodology·정합 문구 |
| Row-26 | Primary / Secondary | MISSING | PATCH_CROSS_LLM | Cross-LLM Master Prompt | §12의 dataset workflow에 D28 WA 참조: Primary 하나·Secondary 외부 평가 SHOULD; 데이터셋 선택/병합 없음 | A / 주진호 | NO |
| Row-27 | Policy objective | MISSING | PATCH_CROSS_LLM | Cross-LLM Master Prompt | §14/16에 D25 WA 목적·제약·tie 규칙을 한 곳에서 연결; X/B 미정 유지. TEST 적용 방식은 Row-25 해소 전 단정하지 않음 | A / 주진호 | NO |
| Row-28 | W1/W2 freeze | CONFLICT | PATCH_CROSS_LLM | Cross-LLM Master Prompt | §31 W1 freeze를 W1 draft→W2 말 semantic freeze(D18 WA)로 정정; FRZ-01 수행 완료 주장 없음 | JOINT | NO |
| Row-29 | Gates / fallback | MISSING | PATCH_CROSS_LLM | Cross-LLM Master Prompt | §31/35에 02 Gate 표 연결과 D10 일정·D26 WA fallback 경계; 반복 일정표 생성 최소화, 실제 Gate 판정 없음 | JOINT | NO |
| Row-30 | 현재 W1 evidence | ALIGNED | OWNER_CONFIRMATION_ONLY | NONE | 연구/문서 완료와 구현 미완료 구분 확인; mentor/AI-03 재작성 없음 | A / 주진호 | NO |
| Row-31 | Authority / decision status | CONFLICT | PATCH_CROSS_LLM | Cross-LLM Master Prompt; correction note only (VERIFIED FINAL은 기존 audit Row-31) | §41~42를 최신 사용자 7단계 authority·ADOPTED/WA/CURRENT 경계로 정렬. FINAL PDF는 보존하고 기존 감사 note로 예외 설명; 나머지 내용 무효화 금지 | JOINT | NO |
| Row-32 | Sync provenance | AMBIGUOUS | HUMAN_DECISION_REQUIRED | NONE (판단 전 patch 보류; 기존 Row-32 evidence 유지) | synchronized 표기의 대상 원본·버전·시점 확인 전 과거 완료 주장을 만들거나 삭제하지 않음; 확인된 Cross 사본의 현재 내용 patch와 역사 provenance 확정은 분리 | A / 주진호 | YES — 원본/버전/시점 |
| Row-33 | Historical reports | NOT APPLICABLE | HISTORICAL_PRESERVE | NONE | docs/05·07의 날짜별 실행 evidence 보존; 최신값으로 덮어쓰기 금지 | A / 주진호 | NO |
| Row-34 | API privacy planning 누락 | MISSING | PATCH_BOTH | docs/04-interface-contract-draft.md; Cross-LLM Master Prompt | 04 C02/C08과 Cross §10/24에 D19/D21 WA 및 FINAL p.40 참조: 3 write 멱등키·소유자 salt 응답·브라우저 Package·원문 echo 금지·GET/bundle/log/error salt 제외. endpoint/field 새 설계 없이 짧은 경계 note로 통합 | F / 노유신 | NO |
| Row-35 | Lifecycle approval | STALE | PATCH_REPO_DOC | docs/01-domain-and-interfaces.md; docs/04-interface-contract-draft.md; docs/06-p1-backlog.md | RESOLVED 미승인 표현만 D08 승인 방향·상세 계약 DRAFT로 구분; 새 transition/API 없음 | T / 설경민 | NO |
| Row-36 | Mentoring scope | ALIGNED | NO_CHANGE | NONE | 사용자 승인 멘토 질문은 질문으로 유지; 최종 scope-cut·배정 확정으로 바꾸지 않음 | A / 주진호 | NO |
| Row-37 | P0 잔여 lint | STALE | PATCH_REPO_DOC | docs/06-p1-backlog.md | lint 경고 항목만 05의 09/14 해소 evidence 참조로 정정; 다른 보안·운영 잔여 위험 유지 | F / 노유신 | NO |

Disposition 집계: PATCH_REPO_DOC 10 / PATCH_CROSS_LLM 12 / PATCH_BOTH 2 / CORRECTION_NOTE_ONLY 0 / HUMAN_DECISION_REQUIRED 2 / OWNER_CONFIRMATION_ONLY 6 / NO_CHANGE 3 / HISTORICAL_PRESERVE 2 = **37**. Stage 1 classification은 ALIGNED 10 / STALE 9 / CONFLICT 6 / AMBIGUOUS 1 / MISSING 10 / NOT APPLICABLE 1로 유지한다.

### 9.3 Proposed Patch Set

**Repository — 다음 Stage의 후보는 아래 5개뿐이다.** 같은 문서의 관련 행을 하나의 최소 patch로 묶고 02의 결정 내용 전체를 복제하지 않는다. 변경 시점의 코드·Git 기준은 다시 확인한다.

| File | Related rows | Exact meaning to correct |
|---|---|---|
| docs/01-domain-and-interfaces.md | 19,20,22,35 | 옛 I4 version·등록시간·앵커 planning과 RESOLVED 승인 상태를 최신 결정 참조로 구분; 기존 제안 이력 보존 |
| docs/03-current-status.md | 04,06,18 | 현재 SHA 안내·일괄 승인 없음·chain 미정 표현만 교정; 역사 구간 보존 |
| docs/04-interface-contract-draft.md | 14,18,19,22,34,35 | C02/C04/C06/C08의 개별 결정 경계·supersedes·privacy note; 문서 DRAFT 및 C01 AI-03 유지 |
| docs/06-p1-backlog.md | 09,18,19,24,35,37 | misinformation 제외·Base/SQLite 승인·version 책임·RESOLVED·lint 해소만 반영; 전체 backlog 재설계 없음 |
| docs/08-submission-guide.md | 04 | 옛 '현재 제출 기준'을 역사 기준과 현행 Git 확인으로 구분; demo 설명 불변 |

**Cross-LLM — §3에 식별된 Markdown 원문 한 개.** 관련 rows: 03,11,12,14,15,17,21,23,26,27,28,29,31,34.

- §4: 제공받은 기록·freshness 한계.
- §10~11: Package/privacy 참조, D11 Canonical Profile, 공통 구현 소유 경계.
- §12,14~17: D28 데이터 전략, D25 정책 목적, D03/D07 I1, D24 실패 경계. taxonomy/Primary/threshold/모델은 미정 유지. Row-25 관련 TEST methodology 문구는 보류.
- §19,22,24: TARGET TrustProfile과 CURRENT TrustConfig 구분, D14/D15, D22 WA 복구, D19/D21 WA private/멱등성.
- §31~32,35: W1 draft/W2 freeze, TARGET profile 참조, Gate 일정·fallback 연결.
- §41~42: 사용자 authority order, decision 상태·CURRENT/NEXT/TARGET 경계. approved register/계약 초안 참조로 중복을 줄인다.
- 이 원문은 master context이므로 위 누락은 재사용 LLM의 잘못된 계약·일정 가정을 막는 데 필요하다. 새 source 파일이나 프로젝트 ticket은 만들지 않는다. Row-32가 미해결이어도 현재 확인한 사본의 차이는 식별 가능하지만, 과거 synchronized 완료 사실을 새로 주장할 수는 없다.

**Reference-only / 보존 대상:** VERIFIED FINAL PDF, Master Plan v1.2.1 PDF는 직접 수정 대상이 아니다. Row-25/31/32의 차이는 이 audit evidence에 남기며 source PDF나 plan을 재작성하지 않는다. docs/02-decision-register.md는 baseline으로 보존한다. docs/05·07 및 Cross §6/FINAL p.6/02 L11의 역사 snapshot도 보존한다. README.md, docs/README.md, mentor-prep-w1.md, code/tests/CI는 patch set에 넣지 않는다. 새 correction-note 파일은 제안하지 않으며 기존 audit의 Row-25/31/32를 참조한다.

### 9.4 Human Decisions Required

| Row | Issue | Required human input | Why not decided here | Until resolved |
|---|---|---|---|---|
| Row-25 | TEST 선택 문구와 validation→LOCK→TEST 직접 충돌 | A/사용자가 D27 WA의 의도와 최종 정합 문구·methodology를 명시하고 FRZ-01에서 수정/채택 여부 확인 | authority 우선순위는 알지만 WA를 최종 평가 방법으로 재설계할 권한은 이번 scope task에 없음 | 최신 사용자 승인 planning 우선 적용이라는 상태만 보존; ADOPTED 승격·평가 실행·원문 재작성 없음 |
| Row-32 | FINAL 표지 synchronized의 원본 이력 | A/사용자가 당시 Cross 원본 식별자·버전·시점 또는 확인 가능한 이력 제공 | 현재 로컬 사본의 차이만으로 과거 동기화 대상을 추정할 수 없음 | AUDIT ONLY / NOT YET SYNCHRONIZED 유지; 과거 완료 기록 창작 없음 |

Row-31의 현재 감사 authority는 최신 사용자 지시로 명확하므로 별도 기술 결정은 요구하지 않는다. PDF는 correction evidence로 보존하고 Cross만 후속 동기화한다. 위 두 보류 항목은 scope 표의 완성을 막지 않지만, 해당 내용의 최종 source patch를 허가하는 것도 아니다.

### 9.5 Owner Confirmation Map

확인 책임은 Stage 1 소유 경계를 유지한다. 아래는 최종 patch 후 확인할 범위이며 지금은 전부 PENDING이다. NO_CHANGE/HISTORICAL_PRESERVE 행도 담당 범위의 보존 여부를 확인할 수 있지만 새 내용 결정을 요구하지 않는다.

| Role | Owner | Rows / Areas to Confirm | Status |
|---|---|---|---|
| A | 주진호 | 01,04,05,08~11,25~27,30,32,33,36: AI/I1·평가·planning·docs, 역사 SHA 보존, TEST·provenance 보류 유지 | PENDING |
| T | 설경민 | 03,13~23,35: protocol·shared·trust·chain·옛 ABI 제안의 supersedes, D22 WA와 CURRENT 상태 구분 | PENDING |
| F | 노유신 | 24,34,37: DB·멱등성·Package privacy·service 문구, 실제 API 미구현 경계, lint 이력 | PENDING |
| JOINT | A / 주진호 + T / 설경민 + F / 노유신 | 02,06,07,12,28,29,31: 보장·개별 승인/전체 DRAFT·실제 구현·I1 실패 경계·freeze/Gate·authority; lifecycle 문구는 T의 Row-35와 F 소비 경계 함께 확인 | PENDING |

실제 source synchronization patch 0건. D18~D28은 WORKING ASSUMPTION, 모든 미확정 값은 미확정 유지. owner confirmation 완료 처리, OPS-02, W1 progress 작성, W2, commit/push/PR은 수행하지 않는다.
