# W5 DOC-09 — 멘토링 권고·결정·실행 추적

기준일: 2026-10-21 KST · Owner: A / 주진호 · 상태: **PARTIAL**

3회차 원문을 확인한 초기화 결과와 저장소 기록을 연결했다. 1·2회차 답변 원문은 현재 접근 가능한 자료에서 확인하지 못했으므로, 해당 회차의 권고는 **팀 요약에 근거한 간접 기록**으로 남긴다. 원문 확인, 팀 승인, 코드 존재, 테스트 실행, 실제 외부 E2E는 각각 별도 증거다.

## 출처와 기준

| ID | 출처 | 증거 수준·경계 |
| --- | --- | --- |
| S1 | [3회차 멘토링 결과](session-03-20261020-lee-jaewon.md) | 2026-10-20 이재원 멘토 회신 요약. 첨부 피드백 PDF 3쪽은 W5 초기화에서 확인. PDF를 이 문서 작성 중 다시 읽지는 않았다 |
| S2 | [결정 기록부](../02-decision-register.md) | D07, D25, D27, M3-02/03/06/11/13의 승인·잠정 상태. 결정 기록이 구현 완료를 뜻하지 않음 |
| S3 | [README](../../README.md), [W4 통합 현황](../progress/W4.md), [현황](../03-current-status.md) | W4 구현·실행에 대한 저장소 설명. 과거 상태와 후속 완료가 함께 남아 있으므로 날짜를 구분 |
| S4 | [W4 공개 Anchor 증거](../handoffs/w4-anchored-epoch-public/20261020-r01/README.md) | 2026-10-20 고정 실증. W5 신규 시험이 아님 |
| S5 | [W4 Validation 정책 비교](../evidence/w4-a-validation-policy.md) | Validation 1,255건·25개 후보의 집계. 운영 정책 승인·TEST 성능이 아님 |
| S6 | [브라우저 검증 코드](../../frontend/src/domain/verify.ts) | 이번 작성에서 `RPC_UNAVAILABLE`, Content `NOT_CHECKED`, Core/보조 검증 분리 코드를 정적으로 확인. T/F 테스트를 새로 실행하지 않음 |
| S7 | 2026-10-21 사용자 W5 마스터·자율 실행 지시 | A 구현·로컬 검증·문서화·로컬 커밋 허용. X/B·정책·LOCK·최초 TEST·T/F 수정·push는 포괄 승인 밖 |

읽기 기준 Git SHA: `8d0580a7ef6a7e88c2314e6f5f30ff5f08f693ab`. 이는 본 문서의 출발점이며 이후 HEAD나 CI의 최신값을 보증하지 않는다. W5 초기화에서 확인한 main CI Run #235 SUCCESS도 W5 신규 변경의 테스트 결과가 아니다. 이 문서의 최종 Git SHA는 이 파일을 포함한 커밋에서 확인한다.

## 1·2회차 — 원문과 팀 기록을 구분

| 추적 ID | 회차·멘토 | 권고에 대한 현재 기록 | 팀 결정·채택 | 현재 코드·실행 근거 | 검증 상태 | Owner | 남은 조건 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M1-SCOPE | 1회차·임명환 | Scope Diet, Core E2E 우선이라는 팀 요약(S1). 답변 원문 미확인 | S1/S3에서 범위 축소 방향 기록 | W4 실제 Receipt→Epoch→Anchor→브라우저 경로(S4) | **PARTIAL**: W4 실증은 있음. 멘토 원문과 정확한 채택 시점 대조는 미완 | A(PM), T/F(구현) | 원문 또는 승인 가능한 1차 기록 확보. 원문의 문장·수치·발언 재구성 금지 |
| M1-TRUST | 1회차·임명환 | AI 정확성과 Blockchain 무결성 구분이라는 팀 요약(S1) | README에서 주장 범위를 분리(S3) | S4의 해시·포함 증명·Anchor 검증과 AI 한계 설명 | **PARTIAL**: 현재 문서 반영 확인, 원문 출처는 미확인 | A/T | 정확성·실제 모델 실행·발급자 진실성을 체인이 증명한다고 발표하지 않음 |
| M2-TRIAGE | 2회차·금창섭 | AI Triage·HUMAN_REVIEW, 실제 Core E2E·Web 데모 우선이라는 팀 요약(S1) | 3단계 조치와 실제 E2E가 기록됨. X/B 승인과는 별개 | S5의 ALLOW/REVIEW/RESTRICT 집계, S4의 실제 E2E | **PARTIAL**: 기존 구현 증거 있음. 운영 정책과 본선 Web 전체 경로는 미승인·미검증 | A/F | 점수는 UNCALIBRATED. HUMAN_REVIEW 효능의 실제 운영평가 없음 |
| M2-SCOPE-B | 2회차·금창섭 | B안 및 API/SDK 장기 확장이라는 팀 요약(S1) | M3-11: **TEAM_ADOPTED**, Core E2E 우선·실제 Appeal/Review Backend는 POST-MVP·Synthetic Lifecycle 데모(S2) | 범위 결정의 증거이지 W5 Lifecycle 구현 완료 증거가 아님 | **PARTIAL**: B안 결정 확인, W5 T/F 실행 증거 별도 필요 | A(PM), T/F | 실제 Appeal 처리 완료나 API/SDK 제품 완료로 표현 금지 |

## 3회차 — 권고별 반영과 검증

| ID | 원문 권고의 요약(S1) | 팀 결정 상태 | 실제 반영·근거 | 테스트·실증 수준 | Owner | W5 남은 작업·위험 |
| --- | --- | --- | --- | --- | --- | --- |
| M3-01 | FRR 최우선, 자동 제한은 보수적으로 | 사용자 최신 지시로 FRR 우선 분석 수행. 공식 선정 순서는 유지 | S5에서 FRR·RP·HAR·HRR_TOTAL 25후보 비교 가능. 시험용 FRR 91/547 | W4 집계 있음. 보수적 운영 정책이 검증됐다는 뜻은 아님 | A | AI-11. X/B와 정책 미승인. **PARTIAL** |
| M3-02 | X/B는 실제 팀이 정할 값 | **PENDING_TEAM_DECISION** | D25와 사용자 지시: FRR≤X·HRR_TOTAL≤B를 통과한 후보 중 HAR 최소, RP 최대, HRR_TOTAL 최소 | 승인 없는 공식 선택·LOCK 불가 | A/팀장 | 결정표·업무량·오류비용 제시 후 별도 승인. **BLOCKED**(최종 결정) |
| M3-03 | BOTH-high·none-high·0.50~0.85 경계 예시 | 개념 제안이며 **채택된 사양 아님** | 현재 ANY_RESTRICT 유지. native none≠ALLOW, 분위수 이름≠점수 threshold(S1/S5) | 대체 로직 실증이나 승인 없음 | A/F | 변경 시 별도 Manifest/hash·Python/Node parity·fail-closed·A/F 합의. **BLOCKED**(변경 승인) |
| M3-04 | 미보정 점수를 확률·절대 신뢰도로 쓰지 않음 | D07 반영 | S1/S5에 UNCALIBRATED 명시 | 점수 의미에 대한 문서 확인. calibration 성능 검증은 아님 | A | AI-13 limitations에 유지. **PASS**(표현 경계 확인) |
| M3-05 | 무결성·AI 정확성·발급자 진실성·L1 finality 분리 | 기존 문서 반영 | README와 공개 증거의 보장/비보장 구분(S3/S4) | W4 Anchor·브라우저 증거로 무결성 검증. AI 정확성 인증은 아님 | A/T | 12 confirmations를 Ethereum L1 finality로 부르지 않음. **PASS**(문서 경계 확인) |
| M3-06 | L2 Confirmed 문구, 모드·Manifest UX 개선 | **PENDING_TEAM_DECISION** | W4 증거에 PROTOTYPE 배너·보조 Manifest 실패 표시의 한계 기록 | 수정 완료 코드·새 브라우저 결과 미확인 | F, T 검토 | G5-06에 인계. A가 T/F UI 수정하지 않음. **BLOCKED**(담당자 증거) |
| M3-07 | RPC 장애를 변조와 구분 | 기존 코드 반영 | `verify.ts`는 원장 조회 실패를 `RPC_UNAVAILABLE`로 반환(S6) | S1에 기존 단위 테스트 기록. 이번에 테스트 재실행하지 않음 | F/T | 코드 존재와 실제 브라우저 장애 실증 분리. **PARTIAL** |
| M3-08 | 독립 브라우저 VALID/HASH_MISMATCH/INVALID_PROOF | W4 기존 실증 | S4의 Chromium·공개 RPC 검증 7/7 | 2026-10-20 **PASS**. 이번 W5 재실행 아님 | T/F | W4 증거 보존·재사용. 신규 성과로 중복 합산 금지 |
| M3-09 | 실제 RPC 장애에서 RPC_UNAVAILABLE 확인 | W5 검증 대상 | W4 7건에 해당 사례 없음 | 실제 브라우저 장애 신규 증거 미확인 | F 주도, T 검토 | TEST-05/SERVICE QA. **BLOCKED**(담당자 증거) |
| M3-10 | 점수·정책 변조를 라이브로 탐지 | 시연 검토 대상 | W4 정책 action 변조→HASH_MISMATCH 증거 있음(S4) | 점수 필드 변조의 별도 실제 브라우저 사례는 미확인 | F/T | 두 사례를 혼동하지 않음. **PARTIAL** |
| M3-11 | Core E2E 우선·Synthetic Lifecycle 범위 설명 | **TEAM_ADOPTED**(B안, S2) | 정책 결정 반영. W5 연결·전이 구현 완료와 별개 | 새 RCPT-05/FE-03 실행 결과 미확인 | A/T/F | Core VALID≠Lifecycle PASSED. Synthetic Local/Mock≠Base VALID. **PARTIAL** |
| M3-12 | 실제 이의신청 백엔드는 POST-MVP | 팀 범위에 반영 | 실제 Appeal/Review 운영 기능을 W5 완료조건으로 가장하지 않음 | 운영 Appeal backend 완료 증거 없음 | A/F | **NOT_IMPLEMENTED**(본 범위의 운영 기능 완료로 인정하지 않음), POST-MVP 유지 |
| M3-13 | 8분 Web 중심 시연 | 최종 시연 승인 전 | [W5 발표안](../eval/w5-gate5-presentation.md) 작성. 현재 증거에 맞춰 기존 Epoch 1과 W5 계획 구분 | Web→실제 FastAPI→신규 Anchor→VALID 전체 라이브 경로 미실증 | A(PM), F(UI), T(Anchor) | 신규 Receipt 즉시 VALID를 약속하지 않음. 리허설은 별도. **PLANNED** |
| M3-14 | API/SDK는 B2B 확장 로드맵 | 권고·장기 방향 | 현재 발표안에서 로드맵으로만 취급 | W5 API/SDK 제품 완료 주장 없음 | A/F | GATE-5 MUST 이전 확대 없음. **PLANNED**(장기 범위) |

## 최신 지시로 해소한 기록 충돌

1. 과거 D27의 TEST 선택·재실행 문구는 현재 실행 허가가 아니다. **Validation 선택→X/B·모델/정책 승인→실제 LOCK 및 SHA/시각 검증→별도 최초 TEST 승인→승인된 1회 평가**를 적용한다. TEST 이후 threshold 재조정·모델 재선정·반복 튜닝을 금지한다.
2. D25는 과거 WORKING ASSUMPTION으로 남아 있으나, 최신 사용자 지시는 같은 공식 선정 순서를 유지하도록 명시했다. X/B 숫자까지 승인된 것으로 확대하지 않는다.
3. W4.md의 `proof/anchor null`, `FROZEN`은 송신 전 이력이다. 2026-10-20 완료 주장은 S4의 CONFIRMED 공개 bundle을 기준으로 한다. 과거 증거를 소급 수정하지 않았다.
4. 3회차 요약의 ANY_RESTRICT 대 AND 비교 검토는 변경 승인과 다르다. 현재 A 작업은 기존 ANY_RESTRICT의 Validation 후보 분석을 우선하며, 새 규칙을 승인 없이 채택하지 않는다.

## 인계와 완료조건

| 대상 | 요청 증거 | 완료 판정에 필요한 것 |
| --- | --- | --- |
| A / AI-11·AI-13 | W5 실행 명령·출처 해시·새 산출물·테스트 결과·Git SHA | 승인 전 분석과 공식 선정 구분, 행 자료가 없으면 사례 분석만 BLOCKED |
| A / DOC-09 | 1·2회차 답변 원문 또는 검증 가능한 1차 결정 자료 | 원문 권고와 팀 요약을 대조한 뒤 출처 상태 갱신. 미확인 원문은 추정하지 않음 |
| T / RCPT-05·TEST-05·CHAIN-09 | 담당 코드 SHA, 연결·전이 테스트, W4 재사용/RPC 실증 구분, Gas 산정 근거 | A가 자료를 검토한 뒤에만 G5 상태 갱신 |
| F / FE-03·FE-07·SEC-03·UX | 담당 코드 SHA, private package/권한·멱등·프라이버시 회귀, 브라우저 실행 기록 | Core·Content·Lifecycle·RPC·Manifest 상태를 각각 확인 |
| A / DOC-08·DOC-13 | 8분 리허설 결과, 사용 화면의 버전·모드·출처 | 실제로 시연한 범위만 완료 표시 |

이 문서의 표 작성·출처 연결은 완료했지만, **DOC-09 전체는 PARTIAL**이다. 1·2회차 원문 확인과 미완 구현의 실행 증거가 남아 있다. 기존 W4 PASS나 문서 존재만으로 그 조건을 대체하지 않는다.

10/22 A 후속 연결: [AI-11 정책 결정표](../eval/threshold-rationale.md), [AI-13 Validation 분석](../eval/w5-validation-error-analysis.md), [AI-12 합성 사전 준비](../eval/w5-evaluation-preregistration.md), [W5 실행 기록](../progress/W5.md). 신규 A 회귀102개 성공은 승인·원문·T/F 실증을 대신하지 않는다.
