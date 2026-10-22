# W5 DOC-09 — 멘토링 권고·결정·실행 추적

기준일: 2026-10-21 KST (10/22 갱신) · Owner: A / 주진호 · 상태: **PARTIAL**

3회차 원문을 확인한 초기화 결과와 저장소 기록을 연결했다. **10/22 갱신:** 1회차 임명환 멘토 회신 원문(2026-10-05, 13쪽, S8)을 확인해 아래 별도 표로 대조했다. 2회차 금창섭 멘토 답변 원문은 여전히 접근 가능한 자료에 없다. 따라서 2회차 권고는 **팀 요약에 근거한 간접 기록**(S9)으로 남긴다. 원문 확인, 팀 승인, 코드 존재, 테스트 실행, 실제 외부 E2E는 각각 별도 증거다.

## 출처와 기준

| ID | 출처 | 증거 수준·경계 |
| --- | --- | --- |
| S1 | [3회차 멘토링 결과](session-03-20261020-lee-jaewon.md) | 2026-10-20 이재원 멘토 회신 요약. 첨부 피드백 PDF 3쪽은 W5 초기화에서 확인. PDF를 이 문서 작성 중 다시 읽지는 않았다 |
| S2 | [결정 기록부](../02-decision-register.md) | D07, D25, D27, M3-02/03/06/11/13의 승인·잠정 상태. 결정 기록이 구현 완료를 뜻하지 않음 |
| S3 | [README](../../README.md), [W4 통합 현황](../progress/W4.md), [현황](../03-current-status.md) | W4 구현·실행에 대한 저장소 설명. 과거 상태와 후속 완료가 함께 남아 있으므로 날짜를 구분 |
| S4 | [W4 공개 Anchor 증거](../handoffs/w4-anchored-epoch-public/20261020-r01/README.md) | 2026-10-20 고정 실증. W5 신규 시험이 아님 |
| S5 | [W4 Validation 정책 비교](../evidence/w4-a-validation-policy.md) | Validation 1,255건·25개 후보의 집계. 운영 정책 승인·TEST 성능이 아님 |
| S6 | [브라우저 검증 코드](../../frontend/src/domain/verify.ts) | 이번 작성에서 `RPC_UNAVAILABLE`, Content `NOT_CHECKED`, Core/보조 검증 분리 코드를 정적으로 확인. T/F 테스트를 새로 실행하지 않음 |
| S8 | 1회차 원문: 저장소 밖 `멘토링/1회차/HTTP 451 1회차 멘토링 회신(임명환).pdf` | 2026-10-22에 직접 읽음. 저장소에는 커밋하지 않음(외부 자료). 멘토 본인이 "일부 답변은 AI 코멘트를 참조"했다고 명시함 |
| S9 | 2회차 간접 기록: [W3 DOC-06 질문](../progress/W3.md), 7주 실행 프롬프트 W4 갱신본 p.17·p.30(팀 작성), [결정 기록부 M3-11](../02-decision-register.md) | 팀이 요약한 권고다. "F1 하나로 RESTRICT하지 말고 혼동행렬과 검토자 업무량을 함께 제시", safe/finalized 태그 실험, 10/11 B안. 멘토 원문 인용이 아니다 |
| S7 | 2026-10-21 사용자 W5 마스터·자율 실행 지시 | A 구현·로컬 검증·문서화·로컬 커밋 허용. X/B·정책·LOCK·최초 TEST·T/F 수정·push는 포괄 승인 밖 |

읽기 기준 Git SHA: `8d0580a7ef6a7e88c2314e6f5f30ff5f08f693ab`. 이는 본 문서의 출발점이며 이후 HEAD나 CI의 최신값을 보증하지 않는다. W5 초기화에서 확인한 main CI Run #235 SUCCESS도 W5 신규 변경의 테스트 결과가 아니다. 이 문서의 최종 Git SHA는 이 파일을 포함한 커밋에서 확인한다.

## 1·2회차 — 원문과 팀 기록을 구분

| 추적 ID | 회차·멘토 | 권고에 대한 현재 기록 | 팀 결정·채택 | 현재 코드·실행 근거 | 검증 상태 | Owner | 남은 조건 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M1-SCOPE | 1회차·임명환 | Scope Diet, Core E2E 우선. **S8 원문 확인** | S1/S3에서 범위 축소 방향 기록 | W4 실제 Receipt→Epoch→Anchor→브라우저 경로(S4) | **PASS(추적)**: 원문 권고와 W4 실증 연결 확인 | A(PM), T/F(구현) | 아래 1회차 원문 대조표 참조 |
| M1-TRUST | 1회차·임명환 | 무결성(Integrity)과 진실성(Truthfulness) 분리. **S8 원문 확인** | README에서 주장 범위를 분리(S3) | S4의 해시·포함 증명·Anchor 검증과 AI 한계 설명 | **PASS(추적)**: 원문·문서 반영 확인 | A/T | 정확성·실제 모델 실행·발급자 진실성을 체인이 증명한다고 발표하지 않음 |
| M2-TRIAGE | 2회차·금창섭 | AI Triage·HUMAN_REVIEW, 실제 Core E2E·Web 데모 우선이라는 팀 요약(S1) | 3단계 조치와 실제 E2E가 기록됨. X/B 승인과는 별개 | S5의 ALLOW/REVIEW/RESTRICT 집계, S4의 실제 E2E | **PARTIAL**: 기존 구현 증거 있음. 운영 정책과 본선 Web 전체 경로는 미승인·미검증 | A/F | 점수는 UNCALIBRATED. HUMAN_REVIEW 효능의 실제 운영평가 없음 |
| M2-SCOPE-B | 2회차·금창섭 | B안 및 API/SDK 장기 확장이라는 팀 요약(S1) | M3-11: **TEAM_ADOPTED**, Core E2E 우선·실제 Appeal/Review Backend는 POST-MVP·Synthetic Lifecycle 데모(S2) | 범위 결정의 증거이지 W5 Lifecycle 구현 완료 증거가 아님 | **PARTIAL**: B안 결정 확인, W5 T/F 실행 증거 별도 필요 | A(PM), T/F | 실제 Appeal 처리 완료나 API/SDK 제품 완료로 표현 금지 |

## 1회차 원문 대조 (S8) — 채택·미채택 구분

| 원문 권고 | 팀 결정 | 실제 구현·근거 | 테스트·실증 | 남은 의존성 / W6 |
| --- | --- | --- | --- | --- |
| 포지셔닝: 정답성 증명이 아니라 이용자가 판정 기록을 독립 검증하는 시스템. Decide. Prove. Appeal. | **채택** | README·발표안의 주장 범위 | W4 브라우저 7/7(S4) | 없음 |
| MVP: 실제 AI → Receipt → Merkle → Base Sepolia → 브라우저 검증 → 변조 탐지 | **채택** | W4 E2E 전 구간 | GATE-4 14/14(S4, 역사 증거) | W6 Core E2E 안정화(F TEST-01/03) |
| APPEAL/REVIEW는 백엔드 대신 Synthetic Demo | **채택**(B안 M3-11) | T RCPT-05 로컬 완료 보고(원격 미확인) | T SHA·테스트 확인 필요 | F FE-03 UI W6 이월 |
| 한계를 오라클 문제로 설명. 단 원문의 "100% 잡아낼 수 있다" 표현 | **부분 채택**: 오라클 문제 설명은 채택, "100%" 표현은 **미채택**(실행 프롬프트 금지 주장) | 발표안 신뢰 범위 | — | 발표 문구 최종 점검 |
| AI 모델 직접 학습 배제, Foundation Model API/RAG 사용 | **미채택**: 같은 회신의 후속 의견("실제 BEEP! 기반 한국어 AI 모델 학습")과 D01에 따라 R01 fine-tuning | R01 Model Manifest | W3 Validation 지표 | 없음 |
| MetaMask 등 지갑 연동·서명 | **미채택**: Publisher EOA + server relayer, 이용자 검증은 읽기 전용 RPC(Q11) | W4 contract·publisher | W4 tx | 없음 |
| 토큰 보상·DAO·소각 구조·ZKP | **미채택**(BACKLOG) | — | — | 발표 로드맵으로만 언급 |
| 단일 EOA는 임시. 아키텍처에 Phase 2 Multisig 점선 표기 | **채택**(ROADMAP) | 발표안·Q24 | — | 슬라이드 점선 표기는 W7 확인 |
| 3-label 백엔드와 5-label UI 분리(Future Work 표시) | **채택**: 5-label은 LEGACY/SYNTHETIC로 격리 | 실행 프롬프트 Scope Diet | — | 화면 표기는 F W6 회귀에서 확인 |
| Secondary dataset 교차 검증 1장 | **보류**(DEFERRED, AI-22 SHOULD) | — | 미실행 | MUST 완료 전 착수 금지 |
| 503 INFERENCE_UNAVAILABLE·Receipt 미발급, 실패 시연을 기능으로 | **채택** | F W3 safe failure | W3/W4 테스트(역사 증거) | 시연 포함 여부는 W7 대본 |
| RPC 지연 대비 비동기 PENDING UX, 안정적 RPC | **채택**(PENDING_ANCHOR) | `verify.ts`(S6) | W4 PENDING_ANCHOR 1건 | 실제 RPC 장애 실증은 F W6 |

## 3회차 — 권고별 반영과 검증

| ID | 원문 권고의 요약(S1) | 팀 결정 상태 | 실제 반영·근거 | 테스트·실증 수준 | Owner | W5 남은 작업·위험 |
| --- | --- | --- | --- | --- | --- | --- |
| M3-01 | FRR 최우선, 자동 제한은 보수적으로 | 사용자 최신 지시로 FRR 우선 분석 수행. 공식 선정 순서는 유지. 10/22 연구 방향 승인: S1/S2/S3 연구·시연 시나리오 비교 | S5에서 25후보 비교. [S1/S2/S3 승인 패키지](../eval/w5-research-policy-scenarios.md): S1 FRR 32/547, S2·S3 53/547. A는 FRR 우선 원칙에 따라 S1을 추천하고 S2를 대안으로 제시. 원문의 "0.50~0.85 중위 점수대"는 예시 값이다. 점수가 UNCALIBRATED이므로 25후보의 분위수 threshold로 대체 비교했고, BOTH-high RESTRICT는 채택하지 않음 | Validation 비교·테스트 PASS. 보수적 운영 정책이 검증됐다는 뜻은 아님 | A | AI-11. X/B·후보 승인 대기. **PARTIAL** |
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

10/22 추가 연결: [S1/S2/S3 연구·시연 정책 승인 패키지](../eval/w5-research-policy-scenarios.md), [A/F 계약 제안](../handoffs/W5-A-F-policy-contract-proposal.md), [LOCK 사전점검표](../eval/w5-lock-preflight-checklist.md). 3회차 피드백 PDF 원문은 10/22 작업 중 다시 대조했다(Q1 FRR 우선·중위 점수대 예시, Q2 L2 Confirmed·RPC_UNAVAILABLE, Q3 변조·장애 테스트, Q4 시연 구성). 1·2회차 원문은 여전히 미확인이다.

## 10/22 W5 마감 반영

- **W6 이월:** F 시험기간에 따른 [이월 결정](../handoffs/W5-to-W6-carryover-decision-20261022.md)으로 아래 항목은 **W6 이월, W5 PASS 아님**으로 표시한다. 담당자 증거가 오기 전까지 상태를 바꾸지 않는다.
  - M3-06: L2 Confirmed·모드·Manifest UX
  - M3-09: 실제 RPC 장애 표시
  - M3-10: 점수 변조 라이브 화면
  - M3-11의 F UI 부분
- **T 보고:** T의 W5 완료 보고(RCPT-05 등)는 원격 `seolkyeongmin` 브랜치에 아직 없다(10/22 `git ls-remote` 결과 main과 같은 `8d0580a`). 소스·SHA를 확인하기 전까지 G5-04의 T 부분은 "보고됨·미확인"이다.
- **DOC-09 상태:** **PARTIAL**. 1회차와 3회차 원문 대조는 완료했다. 남은 조건은 두 가지다: 2회차 원문(없으면 "미확인" 유지)과 T/F 실행 증거.
