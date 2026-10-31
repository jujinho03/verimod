# 3회차 멘토링 결과 — 이재원 멘토 (2026-10-20)

> **대상:** 멘토·팀원 · **목적:** 3회차 권고와 당시 팀 결정·구현 근거를 구분합니다. 이후 1~4회차 원문 대조는 [W7 증거 감사](w7-mentoring-evidence-audit-20261030.md)를 참조하세요.

작성일: 2026-10-21 · 작성: A / 주진호 · 상태: **기록 완료, 팀 결정 대기 항목 있음**

이 문서는 3회차 멘토 권고와 팀이 실제로 정한 것, 이미 구현·검증한 것을 나누어 적습니다.
멘토가 권고했다고 해서 팀이 채택했거나 구현을 끝낸 것은 아닙니다. 정책 수치, threshold,
Manifest, 테스트 결과는 이 문서에서 바꾸지 않습니다.

## A. 기본 정보

| 항목 | 내용 |
| --- | --- |
| 팀·프로젝트 | 8팀 HTTP 451 · VeriMod (User-Verifiable AI Moderation Protocol) · AI + Blockchain 융합 트랙 |
| 회차·멘토 | 3회차 · 이재원 멘토 |
| 진행 방식 | 이메일 서면 멘토링 |
| 피드백 수신일 | 2026-10-20 |
| 근거 | 이재원 멘토 회신 이메일과 첨부 PDF「8팀-HTTP 451 멘토링 주요 피드백」(3쪽). A가 원문을 직접 읽고 요약함 |
| 원문 보관 | PDF는 공개 저장소에 올리지 않았습니다. 이 문서는 요약과 출처만 기록합니다 |
| 보낸 질문 | 4가지(Q1 AI Triage 운영 타당성, Q2 Trust Model·주장 범위, Q3 최소 검증 범위, Q4 8분 본선 시연·Synthetic Appeal) |
| 사전자료 | [3회차 사전자료](../mentor-prep-session3.md). 그 안의 질문 6개는 2026-10-17 초안이고, 실제 메일은 위 4가지로 정리해 보냈습니다 |
| 피드백 시점 상태 | W4 GATE-4 PASS(기술 조건 14/14, 2026-10-20), 기준 커밋 `ba8b7bcc43892389e5d5d579b5b2a23270940775` |

## B. 이전 멘토링과의 연속성

멘토는 회신 서두에서 1·2회차 권고(Scope Diet, AI 정확성과 온체인 무결성 분리, Core E2E 우선)를
팀이 반영해 왔다고 평가했습니다.

| 회차 | 멘토 | 핵심 권고 | VeriMod에 반영된 위치 |
| --- | --- | --- | --- |
| 1회차 | 임명환 | Scope Diet, AI 정확성과 Blockchain 무결성 구분, Core E2E 우선 | [1회차 사전자료](../mentor-prep-w1.md), README의 "확인해 주는 것 / 주장하지 않는 것" 표 |
| 2회차 | 금창섭 | 실제 Core E2E 우선, AI Triage·HUMAN_REVIEW, Web 데모 우선, API/SDK는 장기 확장, **B안 채택** | [2회차 질문(W3 DOC-06)](../progress/W3.md#doc-06--2회차-금창섭-멘토링-질문), W4 실제 E2E |
| 3회차 | 이재원 | FRR 중심 AI 신뢰성, 최소 Trust Claim, 독립 검증과 오류 상태 구분, Web UI 중심 시연, Synthetic Appeal 한계 명시 | 이 문서 |

1·2회차 멘토 답변 원문은 저장소에 기록돼 있지 않습니다. 위 1·2회차 행은 A가 2026-10-21에
정리해 준 요약과 3회차 회신 서두를 근거로 적었습니다. 세 회차의 권고는 서로 충돌하지 않습니다.

## C. Q1~Q4 피드백 분석표

상태 표기는 [D절](#d-멘토-권고와-팀-결정-구분)의 정의를 따릅니다.

| 자문 주제 | 멘토 권고(요약) | 현재 구현·검증 근거 | 이미 충족한 부분 | 아직 충족하지 못한 부분 | 팀 결정 상태 | W5 후속 검토 | 담당 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Q1** AI Triage 운영 타당성 | FRR(정상글이 부당하게 제한되는 비율)을 최우선 관리 지표로 둔다. UNCALIBRATED 점수를 절대 신뢰도로 쓰지 않는다. 자동 제한은 보수적으로, 중간 구간은 HUMAN_REVIEW로 보내는 Fail-Safe Triage를 설명한다 | [Validation 정책 비교](../evidence/w4-a-validation-policy.md): 25개 후보의 FRR·HRR_TOTAL·HAR·RP. Policy Manifest에 `score_semantics=UNCALIBRATED`, `team_approved=false` | 3단계 조치(ALLOW/HUMAN_REVIEW/RESTRICT), TRUNCATED는 HUMAN_REVIEW, 점수를 확률로 부르지 않음, 선택 규칙에 FRR 상한 X가 이미 들어 있음(D25) | FRR 상한 X·HUMAN_REVIEW 예산 B 미정, 정책 미채택·미LOCK. 기술 검증용 후보 H50-75_O50-75의 FRR은 16.64%로, 보수적 자동 제한이 확인된 상태가 아님 | MENTOR_RECOMMENDATION / PENDING_TEAM_DECISION | Validation 기반 FRR·HRR_TOTAL trade-off 분석, X/B 근거 준비 | A |
| **Q2** Trust Model과 주장 범위 | 최소 Claim은 "받은 Receipt가 Base Sepolia 온체인 Merkle commitment와 일치하고, 판정 당시 점수·정책·모델 버전이 사후 변조되지 않았음을 이용자 브라우저가 직접 재계산해 확인할 수 있다". AI 정확성·발급자 진실성·L1 finality는 따로 설명한다. 12 confirmations는 L2 soft finality이며 L1 finality가 아니다. UI는 `L2 Confirmed (Base Sepolia)`로, RPC 장애는 `RPC_UNAVAILABLE`로 변조와 구분한다 | README 신뢰 범위 표, [공개 증거 README](../handoffs/w4-anchored-epoch-public/20261020-r01/README.md)(12회 확인은 L1 finality가 아님을 명시), 검증기 `RPC_UNAVAILABLE` 상태(`frontend/src/domain/verify.ts`)와 단위 테스트 | 무결성과 정확성의 분리, 12 confirmations ≠ L1 finality 문서화, `RPC_UNAVAILABLE`을 변조와 다른 상태(보류)로 처리하는 코드와 단위 테스트 | 화면에 `L2 Confirmed (Base Sepolia)` 표시 없음. 실제 체인 모드에서도 "PROTOTYPE MODE" 배너 표시. 보조 Manifest 확인이 FAILED로 표시 | 신뢰 범위 분리는 ALREADY_IMPLEMENTED. UI 문구는 PENDING_TEAM_DECISION | 검증 UI의 Trust Claim 문구·배너·Manifest 표시 점검 | T(설명), F(UI) |
| **Q3** 최소 검증 범위 | 발급 서버와 독립된 브라우저가 공개 Base Sepolia RPC로 VALID / HASH_MISMATCH / INVALID_PROOF를 판별하는 구성은 적절한 PoC다. 추가로 ① Receipt 점수·정책 문구를 고쳤을 때 즉시 HASH_MISMATCH가 뜨는 위변조 탐지 라이브 테스트, ② RPC 장애 시 HASH_MISMATCH가 아니라 RPC_UNAVAILABLE이 되는 가용성 분리 테스트를 권고 | W4 실제 Chromium 검증 7/7(2026-10-20): VALID 2, HASH_MISMATCH(정책 조치 변조), INVALID_PROOF, UNTRUSTED_ANCHOR 2, PENDING_ANCHOR | 멘토가 정의한 PoC 3종을 실제 체인·공개 RPC로 통과. 본문 변조 탐지는 실제 브라우저에서 확인 | **RPC 장애 상황의 실제 브라우저 테스트는 W4 7/7에 없음**(단위 테스트만 있음). 점수 필드 변조는 실제 브라우저 사례로 따로 돌리지 않음 | PoC 3종은 ALREADY_IMPLEMENTED. 추가 테스트 2종은 W5_CANDIDATE | 실제 네트워크 차단 시 `RPC_UNAVAILABLE` 확인, 점수 변조 라이브 시연 | F(주), T(검토) |
| **Q4** 8분 본선 시연과 Synthetic Appeal | 100% Web UI 시연: 한국어 게시물 입력 → 실제 FastAPI 추론과 Receipt 발급 → Base Sepolia Anchor 증거 → 독립 브라우저 VALID → Receipt 일부 변조 후 HASH_MISMATCH. Synthetic Appeal은 Core E2E를 우선하고 이의신청 백엔드는 Post-MVP로 분리했으며 데모는 전체 Lifecycle을 보여 주는 Synthetic Lifecycle이라고 설명. API/SDK는 B2B 확장 로드맵으로만 언급 | W4 실제 경로: A/F E2E 스크립트로 Receipt 2건 발급 → Epoch 1 등록 → 브라우저 검증. Web 기본 데모는 합성 점수·모의 원장 | 실제 Anchor 증거와 브라우저 VALID/HASH_MISMATCH 화면을 보여 줄 수 있음. B안(Core E2E 우선, Appeal Post-MVP, Synthetic Lifecycle 데모)은 이미 팀 결정 | Web UI에서 실제 FastAPI 추론까지 이어지는 라이브 시연은 W4 증거에 없음. 새로 발급한 Receipt는 Freeze·송신·12회 확인 전이라 그 자리에서 VALID가 될 수 없으므로, 시연 순서(기존 Epoch 1 사용 여부 등)를 정해야 함 | B안은 TEAM_ADOPTED. 실제 이의신청 백엔드는 POST_MVP. 본선 시연 시나리오는 PENDING_TEAM_DECISION | Web 독립 검증·Synthetic Lifecycle UX 점검, 8분 시나리오 초안 | A(PM), F(UI) |

### Q1 보충 — 멘토 예시와 현재 정책의 차이

멘토의 경계 설정 예시는 **개념 권고**이며 확정 threshold나 구현 계약이 아닙니다.

| 항목 | 멘토 예시 | 현재 VeriMod (`W4_PROVISIONAL_E2E_ONLY`) |
| --- | --- | --- |
| 자동 제한 조건 | hate/offensive 점수가 **모두** 높을 때(AND) | `ANY_RESTRICT`: hate 또는 offensive 중 **하나라도** restrict 기준 이상이면 RESTRICT(OR) |
| 사람 검토 구간 | 중위 점수대(예: 0.50~0.85) | 라벨별 review 기준 이상, restrict 기준 미만. 기준값은 Validation 분위수에서 가져온 시험값 |
| 자동 통과 | `none` 점수가 압도적으로 높을 때 | 어느 review 기준에도 걸리지 않으면 ALLOW. `none`은 외부로 내보내지 않으며 `reference_class_is_policy_allow=false` |
| 점수 의미 | 미보정 상태 지적 | `UNCALIBRATED`. 0.50~0.85 같은 숫자 구간은 Validation 분석 없이 옮겨 쓸 수 없음 |

AND 조건으로 바꾸면 FRR은 내려갈 수 있지만 유해 게시물이 HUMAN_REVIEW나 ALLOW로 더 많이 넘어갑니다.
어느 쪽을 택할지는 X/B와 함께 팀이 정할 일이며 지금은 바꾸지 않습니다.

EU AI Act의 Human-in-the-Loop 취지와 맞는다는 설명은 발표용 설명 방향입니다. VeriMod가 법률 준수를
인증받았다는 뜻이 아닙니다.

## D. 멘토 권고와 팀 결정 구분

| 상태 | 뜻 |
| --- | --- |
| MENTOR_RECOMMENDATION | 멘토가 권고했으나 팀이 아직 채택 여부를 정하지 않음 |
| ALREADY_IMPLEMENTED | 권고 이전에 이미 구현·검증돼 있고 근거 링크가 있음 |
| TEAM_ADOPTED | 팀(사용자)이 명시적으로 채택한 결정 |
| PENDING_TEAM_DECISION | 팀 승인 전. 승인되기 전에는 채택·구현 완료로 표시하지 않음 |
| W5_CANDIDATE | W5에서 검토할 후보. W5 실행 계획 확정이 아님 |
| POST_MVP | 본선 MVP 범위 밖 |

| ID | 항목 | 상태 | 근거·경계 |
| --- | --- | --- | --- |
| M3-01 | FRR을 최우선 관리 지표로 둔다 | MENTOR_RECOMMENDATION | 기존 선택 규칙(D25)은 이미 FRR ≤ X를 조건으로 둠. 우선순위 변경 여부는 팀 결정 |
| M3-02 | FRR 상한 X, HUMAN_REVIEW 예산 B | PENDING_TEAM_DECISION | 멘토 권고로 정해지지 않음 |
| M3-03 | 새 threshold·집계 규칙(AND/OR)·새 Policy Manifest·정책 LOCK | PENDING_TEAM_DECISION | 현재 Manifest·threshold·hash 유지 |
| M3-04 | UNCALIBRATED 점수를 확률·신뢰도로 표현하지 않음 | ALREADY_IMPLEMENTED | D07, Policy Manifest `score_semantics` |
| M3-05 | 무결성과 AI 정확성·발급자 진실성·L1 finality의 분리 | ALREADY_IMPLEMENTED | README, 공개 증거 README |
| M3-06 | 화면 문구 `L2 Confirmed (Base Sepolia)` | PENDING_TEAM_DECISION / W5_CANDIDATE | 이번 작업에서 UI 문구나 상태 체계를 바꾸지 않음 |
| M3-07 | `RPC_UNAVAILABLE` 상태로 RPC 장애와 변조 분리 | ALREADY_IMPLEMENTED(코드·단위 테스트) | 실제 브라우저 장애 시험은 M3-09 |
| M3-08 | VALID / HASH_MISMATCH / INVALID_PROOF 실제 브라우저 검증 | ALREADY_IMPLEMENTED | W4 실제 Chromium 7/7 |
| M3-09 | 실제 네트워크 차단 시 `RPC_UNAVAILABLE` 브라우저 테스트 | W5_CANDIDATE | W4 7/7에 포함되지 않음. 신규 PASS로 기록하지 않음 |
| M3-10 | 점수·정책 문구 변조 라이브 시연 | W5_CANDIDATE | W4에서는 정책 조치 변조로 HASH_MISMATCH 확인 |
| M3-11 | B안: Core E2E 우선, 이의신청 백엔드 Post-MVP, Synthetic Lifecycle 데모 | TEAM_ADOPTED | 2회차 이후 팀 결정. 2026-10-21 사용자 지시로 유지 확인 |
| M3-12 | 실제 Appeal/Review 운영 백엔드 | POST_MVP | Synthetic Lifecycle은 실제 운영 기능이 아님 |
| M3-13 | 본선 Web UI 100% 시연 시나리오 | PENDING_TEAM_DECISION | 실제 FastAPI 라이브 추론 연결과 Anchor 대기 시간 처리 방식 미정 |
| M3-14 | API/SDK는 B2B 확장 로드맵으로만 언급 | MENTOR_RECOMMENDATION | 2회차 "API/SDK는 장기 확장"과 같은 방향. 구현 계획 없음 |

## E. W5 후속 Action Item

아래는 **후속 검토 항목**입니다. W5 작업을 시작했거나 끝냈다는 뜻이 아니며, W5 실행 계획은
W5 Command Center에서 따로 확정합니다.

| 담당 | 항목 | 관련 ID |
| --- | --- | --- |
| A / 주진호 | Validation 기반 FRR·HRR_TOTAL 검토 | M3-01, M3-02 |
| A / 주진호 | 정책 후보의 오탐·미탐 trade-off 분석(ANY_RESTRICT와 AND 조건 비교 포함) | M3-03 |
| A / 주진호 | X/B 의사결정 근거 준비 | M3-02 |
| A / 주진호 | 모델 카드·오류 분석(Macro-F1 약 0.6525, offensive F1 약 0.5420) | M3-01 |
| A / 주진호 | 정책 LOCK 전까지 TEST 봉인 유지 | M3-03 |
| T / 설경민 | W4 실제 Anchor와 독립 검증 증거 보존 | M3-08 |
| T / 설경민 | 12 confirmations와 L1 finality의 차이 설명 | M3-05, M3-06 |
| T / 설경민 | 검증 UI의 Trust Claim 점검 지원 | M3-06 |
| T / 설경민 | 추가 온체인 송신 없이 기존 Epoch 1 증거 재활용 | M3-13 |
| F / 노유신 | RPC 장애 처리 검증 후보 정리 | M3-09 |
| F / 노유신 | 보조 Model/Policy Manifest 확인이 FAILED로 뜨는 문제 점검 | M3-06 |
| F / 노유신 | 실제 Base Sepolia 모드에서 PROTOTYPE 배너가 뜨는 문제 점검 | M3-06 |
| F / 노유신 | Web 독립 검증·Synthetic Lifecycle UX 점검 | M3-10, M3-13 |

## F. AI 정책 관련 사실 (변경 없음)

| 항목 | 값 |
| --- | --- |
| 데이터·모델 | BEEP! Korean HateSpeech, `klue/roberta-base`, 3-class(hate/offensive/none) |
| Validation | 1,255건, Macro-F1 약 0.6525, offensive F1 약 0.5420, 점수 `UNCALIBRATED` |
| 기술 검증용 정책 | `H50-75_O50-75` (`W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`) |
| FRR | 91/547 = 16.64% |
| HRR_TOTAL | 198/1255 = 15.78% |
| HAR | 90/708 = 12.71% |
| RP | 505/596 = 84.73% |

- 위 값은 Validation 데이터의 proxy 지표입니다. 실제 플랫폼의 오제재율이나 TEST 성능이 아닙니다.
- 25개 정책 후보를 비교했지만 X/B 기준은 승인되지 않았습니다.
- FRR 우선 권고는 현재 시험용 정책이 안전하다는 승인이 아닙니다.
- `none`은 정책상 ALLOW와 같은 뜻이 아닙니다.
- TEST는 SEALED 상태를 유지합니다.

근거: [Validation 정책 비교](../evidence/w4-a-validation-policy.md),
[A 실행 해설](../evidence/w4-a-actual-frozen-epoch.md).

## G. W4 완료 상태 (보존)

이 문서는 W4 결과를 바꾸지 않습니다.

- W4 GATE-4: **PASS (기술 조건 14/14, 2026-10-20)**. 이전 2026-10-18 PARTIAL 기록은 각 문서에 이력으로 남아 있습니다.
- 실제 Anchor tx: [`0x175b3c1ad237a087984b17b47c0343fedfd314a5eb1c34ba7a22511b5cc67286`](https://sepolia.basescan.org/tx/0x175b3c1ad237a087984b17b47c0343fedfd314a5eb1c34ba7a22511b5cc67286)
- 공개 증거: [w4-anchored-epoch-public/20261020-r01](../handoffs/w4-anchored-epoch-public/20261020-r01/README.md)
- 현황: [W4 통합 현황](../progress/W4.md), [현재 상태](../03-current-status.md)
- 유지되는 경계: 정책 `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`, X/B 미승인, 정책 LOCK 없음, TEST SEALED, 실제 Appeal/Review 운영 백엔드는 POST_MVP, Synthetic Lifecycle Demo는 실제 운영 기능이 아님.

## H. W5 Command Center 참조 안내

- 이 문서 경로: `docs/mentoring/session-03-20261020-lee-jaewon.md`
- 팀 결정이 필요한 항목: D절의 `PENDING_TEAM_DECISION`(M3-02, M3-03, M3-06, M3-13)
- 결정 기록부 연결: [결정 기록 — 3회차 멘토링 권고와 결정 상태](../02-decision-register.md#3회차-멘토링-권고와-결정-상태--2026-10-21)
- 팀이 채택하면 결정 기록부에 승인자·날짜·근거를 남긴 뒤에만 상태를 TEAM_ADOPTED로 바꿉니다.
