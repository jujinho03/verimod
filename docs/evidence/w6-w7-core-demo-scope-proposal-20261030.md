# W6 → W7 Core Demo 범위 결정 및 조건부 종료 기록

> **이후 경과 — 2026-10-31 확인:** 아래의 저장소 반영 대기 표기는 작성 당시 기록입니다. 이 결정 문서는 [PR #39](https://github.com/jujinho03/verimod/pull/39)로 병합됐고 병합 후 CI가 성공했습니다. W6의 조건부 종료와 원래 Engineering Exit `PARTIAL`을 구분하며, 정책·LOCK·TEST 상태를 바꾸지 않습니다. 현재 읽기 순서는 [멘토링 안내](../mentoring/README.md)를 참조하세요.

**결정 ID:** `D-W6A-20261030-01` (별칭 `W6-TO-W7-CORE-DEMO-SCOPE-DECISION`)

**결정:** `OPTION_B_CORE_DEMO_SCOPE_CUT` · **승인:** `APPROVED_BY_TEAM_LEAD` (사용자 메시지의 주진호(A) 자기 식별에 근거) · **저장소 반영:** 독립 리뷰·CI·병합 대기

**기준:** 2026-10-30 확인 main `fd1fe1b50671f88b89ff1412cd702b59f46d0c18`, [main CI 40998309008](https://github.com/jujinho03/verimod/actions/runs/40998309008) frontend/backend/contracts SUCCESS. W4 tree `1911f46c9e19000d25a7ffb5f86f1c2ba781a1ee`. 작성 시 열린 PR 0개. 제안 ID는 이 기준의 저장소 검색에서 중복이 없었다. 기존 결정 기록부는 [D01~D28 및 W5 개별 결정](../02-decision-register.md)의 ID·상태·근거·경계를 사용한다. 등록 전 중복을 다시 확인한다.

**승인 근거·시각의 한계:** 사용자 메시지 `[BLOCK AI✳26 / HTTP 451] OPTION B — TEAM LEAD APPROVAL & W6 CONDITIONAL CLOSEOUT`(대화 메시지 ID `01a18aee-dbf0-7813-bb80-45f903c0de2e`)에서 작성자가 자신을 팀장 주진호(A)로 명시하고 이 결정과 PoC 위험 수용을 승인했다. 대화 턴 시작은 2026-10-30 12:51:11 KST, 승인 메시지를 확인한 관측 시각은 12:51:30 KST다. **실제 메시지 발송·승인 시각은 제공되지 않아 미확인**이며 위 두 시각을 대신 사용하지 않는다. 이 환경에서 대화 작성자의 실명과 GitHub 계정 소유 관계는 독립 인증할 수 없다. GitHub 작업 로그인 `jujinho03`은 별도 확인했으며 대화 계정과의 동일성을 증명하지 않는다.

**현재 상태:** `W6_CODE_INTEGRATION=COMPLETE`, `W6_DOCUMENTATION_INTEGRATION=COMPLETE`, `SCOPE_CUT=APPROVED_OPTION_B`(사용자 승인; 저장소 반영 대기), `W6_WORKSTREAM=CONDITIONAL_CLOSEOUT_PENDING_INTEGRATION`, `ORIGINAL_W6_ENGINEERING_EXIT=PARTIAL`, `OPTION_B_CORE_DEMO_RELEASE_READINESS=IN_PROGRESS`. `W6_WORKSTREAM=CLOSED_WITH_ACCEPTED_RISKS`는 이 기록이 독립 승인·CI를 거쳐 main에 병합되고 병합 후 CI와 W4 불변이 확인된 뒤에만 최종 확정한다.

## 결정 배경과 출처

[W6 MUST 원본](../handoffs/W6-MUST-plan.md)은 GATE-5 미달을 이월하고 11/04 코드 동결을 유지한다. [W5 GATE-5 결정](../progress/W5-GATE5-decision-record.md)은 W5 종합 PARTIAL과 이월을 기록한다. [S1 제안](../eval/w5-research-policy-scenarios.md)은 승인된 운영 정책이 아니다. [기존 E1~E8](w6-a-closeout/e1-e8-matrix.md)은 병합 전 예비 스냅샷이고 [후속 감사](w6-a-security-closure-20261029/README.md)는 작성 시점을 보존한다. [W6 전환 인계](../handoffs/W6-transition-handoff.md), [W6 갭 감사](w6-a-gap-closure-20261029.md), [F 수정 후보 보고](w6-f/20261029/README.md), [F 기계 판독 요약](w6-f/20261029/rpc-stability-validation.json), [AI-19](w6-a-ai19-offline/ai19-final-assessment.md), [시연 원본 시트](../handoffs/W6-W7-five-beat-rehearsal-20261029.md)를 함께 읽는다. 이후 발생한 사실은 해당 역사적 기록을 소급 수정하지 않는다.

PR #31~#38은 모두 병합됐다. #31~#33은 A/F/T 최초 통합, #34·#35는 F 승인 후 A 문서, #36은 T 보안 보강, #37은 RPC 수정, #38은 F 승인 후 A 감사 문서다. #36의 병합 전 독립 승인 부재와 사후 감사는 별도 역사적 예외다. #37의 A 승인에는 A의 패치 기여가 있고 T 전문 보안 리뷰는 미완료다. Git 통합 및 CI 성공을 다른 Gate의 PASS로 전파하지 않는다.

## 원래 W6 MUST 대비 상태 — 승인된 데모 범위와 이월

`IMPLEMENTED`는 코드 존재, `VERIFIED`는 표시된 범위의 근거 확인, `PARTIAL`은 조건 일부 충족이다. 아래 제외·이월은 승인된 데모 범위이며 원래 MUST의 미완료 상태를 바꾸지 않는다.

| 담당·항목 | 현재 상태와 실제 근거 | Option B의 승인된 처리 / 선행조건 |
|---|---|---|
| A1 S1/S2 X/B·후보 | `NOT_APPROVED`, 선정 미완료. [S1 시나리오](../eval/w5-research-policy-scenarios.md)는 제안이며 team_approved가 아니다 | `OUT_OF_DEMO_SCOPE` / `CARRIED_TO_BACKLOG`; X/B·후보·권한자·사유·시각 별도 결정 |
| A2 A/F 정책 계약 | `PARTIAL`, 계약은 PROPOSED; identity·metadata·X/B 인코딩 합의 미완료 | 범위 제외·이월; A1 후 A/F 합의 |
| A3 새 연구 정책 Manifest·Python/Node parity | `PARTIAL / NOT_VERIFIED`: 기존 W4 Manifest/parity와 새 정책 준비물은 존재. 새 승인 정책 생성·21개 이상 경계의 Python/Node parity 및 fail-closed는 완료 근거 없음 | 새 연구 정책 경로 제외·이월; A2/F2 및 리뷰 필요. 기존 W4 산출물은 보존 |
| A4 Runtime Binding | `PARTIAL / NOT_VERIFIED`: 기존 weight/config/Manifest 검증과 tokenizer revision/local loading은 있으나 tokenizer 파일 hash 강제·서비스 lock 전체 binding 미완료. hash 수집은 binding이 아니다 | 신규 완성 제외·이월; guard 및 합성 검증과 독립 리뷰 필요 |
| A5 Model/Policy LOCK·TEST | `NOT_APPROVED / NOT_EXECUTED`; TEST `SEALED` | 제외·이월. LOCK와 최초 TEST는 각각 별도 명시 승인 필요 |
| A6 Data/Model Card | `IMPLEMENTED / VERIFIED`(기존 평가 자료와 대조 기록 범위); TEST 성능·모델 정확성의 새 검증은 아님 | 포함. [Data Card](../data-card.md), [Model Card](../model-card.md), 날짜·평가 한계 표시 |
| A7 DOC-09·리허설 | `PARTIAL`: 2·4회차 원문 미확인, OPS-04 NOT_VERIFIED; 3인 480초 리허설 NOT_EXECUTED | 원문 대조·실제 리허설은 W7 필수 준비. 증거 없으면 미확인 |
| T1 SEC-W5-01 8종 | `PARTIAL`: Windows platform gate의 fail-closed/no-create 관측, 53 SKIP, writable callback UNSUPPORTED; symlink/reparse·비 Windows 검증 공백 | T 복귀 후 환경별 8종 assertion·SHA·원본 증거. 운영 writable 지원 주장 금지 |
| T2 SEED-01 새 Epoch | `NOT_VERIFIED / NOT_APPROVED`: 신규 seed·거래 별도 승인 필요 | 실제 신규 송신 제외·이월. 기존 W4 anchor 사용 |
| T3 TEST-02/MKL-04, SEC-05/08 | `PARTIAL`: 관련 음성 테스트와 T 실행 요약은 존재하나 SEC-05/08 위협 모델 산출물의 완전성과 모든 assertion·입력의 1:1 원본 로그 독립 확인은 미완료 | T가 해당 ID별 입력·assertion·SHA·PASS/SKIP 원본 대조. 결측은 PASS 금지 |
| T4 신규 Manifest schema/parity 리뷰 | `NOT_VERIFIED`, A2 의존 | A2/A3와 이월; T 독립 리뷰 |
| T 신뢰 경계 / 실제 LOCAL | `PARTIAL`: A의 chain 전환 합성 검증과 F 회귀 보고 존재, T 전문 리뷰 미완료; Hardhat LOCAL NOT_VERIFIED | T 복귀 후 TrustProfile·Event·Getter·Receipt·Merkle·TOCTOU 전문 감사와 LOCAL 실측 가능성 평가 |
| F FE-03/07 | `IMPLEMENTED / PARTIAL`: F 당시 로컬 frontend 250 PASS, backend 153 PASS/53 SKIP 보고. 해당 수치는 당시 환경의 실행이며 전체 시연 증명 아님 | 데모 화면과 현재 SHA 검증 유지 |
| F FE-04/05/06 | `PARTIAL`: FE-05/06 상태·모드 구분은 F 화면 보고; 당시 FE-04 rehash는 BLOCKED, 이후 수정 후보 rehash INVALID_PROOF는 F 보고(원본 미독립검증) | 재실행 결과·변조 종류·SHA·모드 표시. 구현/브라우저 실행/원본 검증을 분리 |
| F TEST-01/03 Core E2E | `PARTIAL`: W4 기존 anchor와 W6 증거 분리. 새 AI→Receipt→Epoch→거래 전체 경로 수행 근거 없음 | 독립 AI 추론과 과거 W4 Receipt를 별개로 제시; 새 앵커 주장은 금지 |
| F 연구 정책 로딩 F2 | `NOT_VERIFIED`, 승인 정책·A/F 계약 의존 | 신규 로딩 제외·이월. W4 provisional와 미승인 연구 정책 분리 |
| F LIVE·BASE 10회 | `PARTIAL`: 수정 후보 `d90335b484ab9491f046434ac604d79426c4e648` F 보고 8 VALID/2 RPC_UNAVAILABLE, 연속 10회 NOT_MET. private 원본 및 최종 원격 HEAD 대응 미독립검증 | LIVE 읽기 전용 검증·실패 표시 유지. 새 10회 개별 결과·환경·SHA 확보 |
| F Desktop/Mobile recovery | `PARTIAL`: F가 동일 receipt와 Playwright route abort의 복구를 보고, 모바일은 emulation. 물리 장애·실기기·backup 전체 검증 성공이 아님 | A/F 실연 및 민감정보 없는 증거, 물리 모바일 별도 |
| F Physical Mobile / LOCAL / 녹화 | `NOT_EXECUTED / NOT_VERIFIED`: 실기기, 실제 Hardhat LOCAL 및 전체 영상 미완료; 일부 복구 클립 보고는 전체 녹화가 아님 | 기기 검증, 실제 LOCAL 가능성, 전체 영상 생성·재생/비밀정보 검사 후 각각 상태 갱신 |

T의 [실행 영수증](w6-t-execution-receipt-20261027.md)은 TEST-02/MKL-04 관련 62 PASS와 SEC-05/08 관련 111 PASS를 T 로컬 실행 요약으로 기록한다. 관련 테스트 파일은 실제 존재하지만 위협 모델의 모든 요구사항을 입력·assertion·원본 로그에 1:1 대응해 독립 확인한 것은 아니다. T의 30/30 browser 보고는 동일 Receipt 복구나 실기기 성공으로 합산하지 않는다. [SEC-W5-01 사후 감사](../security/sec-w5-01-negative-test-audit-20261029.md)의 Windows 결과는 platform gate 범위와 SKIP을 함께 읽는다.

AI-19는 실행 코드 `44842f78fdc8102507b9f3aeeed5d0eda8e9eeaf`의 2026-10-27 물리 오프라인 R01 `/healthz`·`/infer` 200 **1회 JSON 기록**이다. 서버 원본 HTTP·격리 로그는 독립 확인하지 않았고, 당시 tracked changes 1건과 판정문 clean 기술 사이 불일치는 미해결이다. 전체 작업 트리 clean이나 새 AI→Receipt→anchor를 입증하지 않는다.

## 선택지 및 권고

| 비교 | Option A — FULL W6 MUST | Option B — CORE DEMO SCOPE CUT **승인** |
|---|---|---|
| 구현·의존 | S1/S2 결정 → A/F 계약 → 새 Manifest·parity와 F2 → A4 binding → 별도 LOCK·TEST 승인 및 검증; T1/T2/T3/T4와 F 실기기·KPI도 원본대로 | 별도 R01 실연과 W4 Epoch 1 공개 Receipt 검증, body/rehash 변조, route-abort 장애·복구, 카드·근거 설명. 아래 제외 범위는 backlog로 이월 |
| 검토·승인 | 각 정책·LOCK·TEST·신규 송신의 별도 승인, 코드 PR 독립 리뷰/CI, T 보안 검토가 필요 | 팀장 Scope Cut 및 명시된 위험 수용 결정, 기존 보안·PR 규칙 유지. 승인 자체가 각 미완료 기술 완료를 뜻하지 않음 |
| 11/04 동결 전 | 미완료 의존성이 연쇄하고 T 즉시 부재. 완료 가능성 **미확인**, 낙관적 확정 불가 | 새 연구 정책 구현 부담은 줄지만 RPC·실기기·리허설·녹화 불확실성은 남음. 동결 일정 변경 없음 |
| 발표 효과·위험 | 구현·승인·실측이 모두 충족되면 연구 정책 적용을 설명할 수 있으나 변경·검토 폭이 큼 | 현재 근거의 무결성·실제 추론에 집중. 신규 AI 결과가 기존 W4 거래와 연결됐다는 주장이나 TEST 성능 주장 불가 |

**결정: Option B 승인.** 아래 포함·제외 범위와 열거된 위험은 데모 PoC에 한해 수용됐다. 기존 `W6-RPC-RELEASE-ACCEPTANCE`는 보안 수정 RPC 코드 통합에 관한 별도 결정이다. 어느 결정도 E6 PASS나 공개 서비스·운영 환경의 안전성을 보증하지 않는다.

### 승인된 포함 범위

1. R01 실제 추론: 무해한 새 입력과 모델 범위, 서비스 상태·응답·실행 SHA·시간을 표시. 과거 AI-19 오프라인 1회와 새 실행을 분리한다.
2. Base Sepolia `84532`의 기존 W4 Epoch 1 공개 Decision Receipt를 승인된 RPC로 **읽기 전용** 검증. `VALID`는 선택된 TrustProfile과 검증 범위 내 기록·proof 일치이지 AI 정답이나 L1 finality의 보장이 아니다.
3. body만 변경·claimed hash 유지 → `HASH_MISMATCH`; body 변경 후 hash 재계산·기존 proof/root 유지 → `INVALID_PROOF`. sibling 변경은 다른 입력이며 대체 사용은 명시적 발표 범위 결정이 필요하다.
4. 동일 Receipt `VALID → RPC_UNAVAILABLE → VALID`와 Playwright route abort 주입. 실패는 그대로 제시하고 모드 전환을 표시한다.
5. W4 기존 onchain 근거와 공개 가능한 요약, Data/Model Card, 구현·실측 범위 설명. AI 추론과 W4 Receipt는 **별개 사례**이며 신규 receipt가 미앵커면 PENDING이다.

### 승인된 제외 및 backlog

신규 연구 정책 운영 적용·S1/S2 승인 처리, 신규 A/F 계약 완성, 새 연구 정책의 A3 Manifest/parity·A4 runtime binding 완성, A5 LOCK·TEST, F2 연구 정책 로딩, 신규 Epoch와 SEED-01 신규 송신을 이번 데모 필수 범위에서 제외하고 backlog에 이월한다. 이는 프로젝트 삭제나 미완료의 PASS 승격이 아니다. 실제 Hardhat LOCAL과 물리 모바일도 필수 시연·Go/No-Go에서 제외하되 각각 `NOT_VERIFIED`와 `NOT_EXECUTED`로 유지하며 W7에서 선택적으로 검증할 수 있다. 원래 E5의 비 Windows·symlink 검증, E6의 BASE 10회/LOCAL 3회와 DOC-09/OPS-04는 원래 미달 기준으로 보존한다. E8 실제 리허설과 가능한 전체 녹화·재생 검증은 W7 필수 준비다. 보안 검증 완화나 기존 파일·테스트 삭제는 허용하지 않는다.

### 생략 불가 경계 및 Go/No-Go

W4 tree 보존, Receipt 독립 무결성 검증, `RPC_UNAVAILABLE` fail-closed, `HASH_MISMATCH`/`INVALID_PROOF` 구분, 새 AI 추론과 기존 anchor의 독립성, 원문·salt·키·민감정보 비공개, LIVE/SYNTHETIC_LOCAL/LOCAL_HARDHAT/RECORDED 출처 표시, 미실행·SKIP의 정직한 기록, 기존 provisional과 미승인 정책 분리, 기존 승인·독립 리뷰·CI는 면제되지 않는다. 실제 LIVE 불가면 해당 Beat를 실패/차단으로 보존하고 mock 또는 검증된 과거 자료로 분리해 전환한다. fallback을 BASE 성공으로 합산하지 않는다. 녹화가 없으면 `RECORDED_READY=false`이고 미검증 녹화는 사용하지 않는다. 무결성 또는 fail-closed 확인이 실패하거나 출처를 밝힐 수 없으면 해당 시연은 NO-GO다.

## 잔여 위험과 PoC 수용 경계

아래 표 중 사용자 승인문이 열거한 RPC·T 전문 리뷰·F 원본 로그·Windows UNSUPPORTED/53 SKIP·실제 LOCAL/물리 모바일 위험만 데모 PoC에 한해 수용됐다. symlink/reparse·비 Windows 공백과 DOC-09/OPS-04·AI-19 문서 불일치는 미확인 사항으로 계속 추적한다. 리허설·전체 녹화·fallback은 위험 면제가 아닌 W7 필수 준비다.

| Residual Risk | Owner | Impact on Demo | Mitigation | Acceptance Boundary | W7 Action | Evidence Required |
|---|---|---|---|---|---|---|
| Primary 429, 수정 후보 8/10, 10회 NOT_MET; F 원본 및 실행 SHA→최종 HEAD 대응 미독립검증 | F / A 감사 | LIVE 지연·RPC_UNAVAILABLE | 미리 LIVE 확인, 실패 fail-closed·모드 표시 | 10/10 달성·원본 직접 검증으로 말하지 않음 | 개별 회차 및 환경/SHA 재현 | 민감정보 없는 원본 대응 hash·10회 상태·시각 |
| Backup 413·관측 200-block 제한; 현재 50,000 창 경로에서 전체 Event 대체 불가 | F, T 복귀 후 | primary 장애시 LIVE 복구 불확실 | 실패 상태 유지, 검증된 fallback 준비 | backup 가용성이나 모든 공급자 한도 보장 안 함 | F 원인·fallback, T 제한 검토 | 응답 범위/상태·동일 입력·SHA |
| chainId 요청과 데이터 요청 사이 TOCTOU, endpoint 혼합 | T 복귀 후 / A | 잘못된 chain 응답 가능성 | 매 논리 호출 chainId 확인, fail-closed; 취약 가정 설명 | 모든 체인 전환 방지 주장 금지 | T 위협 모델·필요 시 별도 보강 | 합성 재현, 코드 SHA·독립 리뷰 |
| 독립 canonical block 조회 부재, env 기반 profile 승인값 강제 일치 미완성 | T 복귀 후 / F | reorg·설정 신뢰 범위 제한 | 실행 전 승인된 chain ID·contract·publisher·RPC·확인 수의 출처와 실제 설정값을 수동 대조하고 기존 event/receipt 비교 범위와 한계를 공개 | 독립 canonical 조회나 자동 강제 일치 주장 금지 | T 검토·후속 개선안 | 코드 경로, profile provenance 및 실제 값 대조, 리뷰 SHA |
| T 전문 RPC 리뷰 미완료; A 패치 기여 | T 복귀 후 / A | 독립성·전문성 잔여 위험 | A 합성 결과와 F 회귀를 구분 | T가 승인한 것처럼 표현 금지 | T 사후 리뷰 | 정확한 HEAD·범위·결과 |
| Windows writable callback UNSUPPORTED, 53 SKIP, symlink/reparse 및 비 Windows 미검증 | T 복귀 후 | writable/OS 보안 주장의 제한 | Windows fail-closed 유지, 미실행 명시 | 53 SKIP을 PASS로 세지 않음; 운영 DB 미접근 | 비 Windows 합성 fixture와 8종 매핑 | OS·assertion·원본 PASS/FAIL/SKIP·SHA |
| 실제 Hardhat LOCAL NOT_VERIFIED, Physical Mobile NOT_EXECUTED | T/F | 실기기·실제 LOCAL fallback 없음 | SYNTHETIC_LOCAL은 mock으로 명시, 실기기는 미실행 표시 | mock을 실제 Hardhat 또는 실기기로 주장 금지 | F 실기기 QA, T LOCAL 가능성 검토 | 기기·노드·코드 SHA·실행 로그 |
| 3인 480초 리허설 NOT_EXECUTED; 전체 녹화 NOT_PRODUCED | A/F, T 복귀 후 | 시간 초과·복구 실패·녹화 대체 부재 | A/F 또는 A/F/T 실제 리허설을 참석자대로 기록하고 가능한 전체 녹화 준비 | 계획 시간과 일부 클립을 실측/전체 영상으로 세지 않음; A/F 실행을 3인 실행으로 표현하지 않음 | 실제 리허설·녹화·재생·노출 검사 | 참석자·각 Beat 시간·모드·SHA·파일 재생 확인 |
| DOC-09 2·4차 원문 및 OPS-04 미확인; AI-19 tracked-changes 불일치 | A | 멘토링 근거·이력 신뢰 범위 | 원문 없는 항목 명시, JSON과 판정문 원본 보존 | 확인하지 않은 제출·원문·clean 상태 주장 금지 | 원문/CNU MATE 기록 확인, AI 기록 대조 | 출처·일시·공개 가능 hash·대조 결과 |

## E1~E8 — 원래 Exit와 Option B 준비도를 분리

| Gate | ORIGINAL_W6_ENGINEERING_EXIT 현재 근거별 권고 | OPTION_B_CORE_DEMO_RELEASE_READINESS — 현재 |
|---|---|---|
| E1 | PASS 권고: W4 tree 불변과 과거 동일 Receipt VALID 증거; 반복 KPI는 E6 | 과거 근거 확보, 시연 직전 LIVE 재확인 필요 |
| E2 | PARTIAL: rehash INVALID_PROOF F 보고·A 수정 후보 1회, F 원본/최종 HEAD 대응 미확인 | HASH_MISMATCH/rehash 실연 조건부; sibling은 별도 범위 결정 |
| E3 | PARTIAL: Desktop·mobile emulation route-abort 복구 보고; 실기기·backup 범위 미입증 | 동일 Receipt·주입 및 모드 표기 후 실제 복구 확인 필요 |
| E4 | 코드·문서 통합 COMPLETE; #36 사전 승인 예외, #37 A 패치 기여·T 부재는 별도 | 승인/CI·W4 확인됨. 추가 문서 PR은 별도 독립 리뷰와 CI 필요 |
| E5 | PARTIAL: Windows fail-closed·no-create 일부, 53 SKIP 및 OS/8종 공백 | 민감정보 검사와 신뢰 경계 필수; 미검증 범위 표시 |
| E6 | PARTIAL: BASE 8/10 NOT_MET, 실제 LOCAL NOT_VERIFIED, 전체 RECORDED 미완료 | LIVE 우선, mock 명시, 녹화 준비 전 false. 발표 허용은 승인된 위험 통제와 현장 Go/No-Go에 의존 |
| E7 | PARTIAL: 카드와 README 보강; DOC-09·OPS-04 원문 잔여, AI-19 기록 차이 | 카드·출처·시각 표시, 미확인 내용 공개 주장 금지 |
| E8 | PARTIAL: 공동 리허설·전체 녹화 미실행 | 480초 실측과 안전한 전체 녹화 전 IN_PROGRESS |

## 480초 시연 인계 — 시간은 목표, 새 실행 SHA·결과는 미기록

기준 main은 위 SHA이고, 각 행의 **실제 실행 SHA는 아직 미기록**이다. 발표 직전 입력·환경·코드 SHA·시각과 실제 결과를 기록한다. 목표 합계는 480초다. T 부재 중 A/F 준비는 진행할 수 있으나 T가 참여하지 않은 실행을 3인 공동 리허설로 기록하지 않는다.

| 구간·예산 | Operator | Input / 예상 결과 | 현재 증거 상태 | 실패 fallback 및 Go/No-Go |
|---|---|---|---|---|
| 도입 40초 | A | AI와 W4 자료가 별개임을 설명 | 계획 | 출처·모드 불명확하면 해당 주장 NO-GO |
| Beat 1 추론 80초 | A, F 보조 | R01 서비스·무해한 새 입력, `/healthz`→`/infer`, 실제 응답 | AI-19 과거 1회 JSON, 당시 `44842f78`; 이번 실행 SHA 미기록, NOT_EXECUTED | 실패 시 과거 결과를 과거로 설명; 새 성공으로 세지 않음 |
| Beat 2 W4 VALID 75초 | F, A 확인 | [receipt-0.bundle.json](../handoffs/w4-anchored-epoch-public/20261020-r01/receipt-0.bundle.json), 승인 BASE profile; 기대 VALID | 과거 W4 및 F 후보 `d90335b4` 보고; 이번 실행 SHA·결과 미기록 | RPC_UNAVAILABLE 유지 후 mock 또는 과거 증거 명시. LIVE 성공으로 합산 금지 |
| Beat 3 HASH_MISMATCH 55초 | F, A 확인 | 사본의 body 변경, 기존 claimed hash 유지 | F 후보 `d90335b4` 보고; 이번 실행 SHA·결과 미기록 | 다른 결과면 관측 기록·해당 주장 NO-GO |
| Beat 4 INVALID_PROOF 90초 | F, A 확인 | 별도 사본 body 변경·rehash·기존 proof/root 유지 | F 후보 `d90335b4` 및 A 수정 후보 보고; F 원본 미독립검증, 이번 실행 SHA 미기록 | RPC 실패면 BLOCKED, sibling 대체는 명시적 별도 결정과 별도 라벨 |
| Beat 5 RPC Recovery 100초 | F, A 확인 | 동일 bundle/hash/profile, 두 승인 host Playwright route abort→복구 | F 후보 `d90335b4` Desktop/mobile emulation 보고; 이번 실행 SHA·결과 미기록 | 초기/복구 실패는 PARTIAL·실제 오류 표시, 물리 장애·backup 복구로 말하지 않음 |
| 마무리 40초 | A | 각 모드·시각·SHA·실패·미승인 정책 설명 | 계획 | 허위 출처나 미승인 기능은 발표 NO-GO |

SYNTHETIC_LOCAL은 브라우저 mock이고 실제 Hardhat LOCAL이 아니다. RECORDED는 존재·촬영일·모드·SHA·재생 및 민감정보 검사가 완료된 사전 녹화만 사용한다. 새 AI와 기존 W4 anchor를 하나의 새 거래로 연결하지 않는다.

## W7 역할과 일정 제안

| 시점(계획, 확정 일정 아님) | A / 주진호 | F / 노유신 | T / 설경민 복귀 후 |
|---|---|---|---|
| 승인 후 및 10/31 목표 | 결정 근거·E1~E8·Beat 1·멘토링 구조·DOC-09/CNU MATE 확인 | LIVE UI·변조·recovery·모드·입력/로그·안정성 준비 | 즉시 참여 불가; 완료했다고 대리 선언하지 않음 |
| 11/01 W6 판정 시점 목표 | 승인 기록·PR 검증 및 실제 리허설 주관 | 실제 시연 및 독립 문서 리뷰 | 복귀하면 전문 보안 검토·참석, 불가하면 미완료 명시 |
| 11/04 코드 동결 전 목표 | 480초 실측·안전한 전체 녹화 검수 | 녹화·재생·노출 검사, fallback 정리 | 비 Windows SEC-W5-01, Hardhat LOCAL 및 trust 경계 검토. 불가능한 작업은 이월 |

일정은 계획상 목표이지 참석·승인·완료 약속이 아니다. Option B 승인 자체로 새로운 정책·LOCK·TEST·체인 송신은 승인되지 않는다.

## 승인 후 조건부 종료와 GitHub 절차

1. 주진호(A)로 자신을 식별한 사용자가 위 범위와 열거된 PoC 위험을 승인했다. 정확한 승인 시각과 외부 신원 검증은 위 한계에 따라 미확인으로 남긴다.
2. 이 기록이 F 독립 승인·CI를 거쳐 main에 병합되고 병합 후 CI·W4가 확인된 뒤에만 `W6_WORKSTREAM=CLOSED_WITH_ACCEPTED_RISKS`를 최종 확정한다. 그 전에는 `CONDITIONAL_CLOSEOUT_PENDING_INTEGRATION`이다. `ORIGINAL_W6_ENGINEERING_EXIT=PARTIAL`, `W7_CORE_DEMO_READINESS=IN_PROGRESS`, `E6=PARTIAL`, `BASE_CONSECUTIVE_10=NOT_MET`을 유지한다.
3. 현재 main·Decision ID 중복·승인 기록을 다시 확인하고, 별도 documentation 브랜치/PR에 실제 승인 사실과 근거만 기록한다. F 독립 APPROVED와 최신 HEAD CI가 성공하고 W4 tree가 불변일 때 일반 Merge Commit으로 병합한다. 병합 후 main CI와 W4 tree를 확인한다. 승인된 PR HEAD는 임의로 변경하지 않는다.
4. A/F는 W7 준비를 계속하고 T 복귀 후 전문 감사 및 backlog를 인계한다. 실제 리허설·녹화·실기기·LOCAL의 결과는 수행 후에만 별도 근거로 갱신한다.

## 승인 기록

- 선택: `OPTION_B_CORE_DEMO_SCOPE_CUT` / `APPROVED_BY_TEAM_LEAD`(사용자 메시지의 자기 식별에 근거)
- 승인자: 사용자 메시지에서 주진호(A)로 자기 식별; 외부 신원·GitHub 계정 동일성 독립 검증은 불가
- 실제 승인 시각: **미확인**. 턴 시작 2026-10-30 12:51:11 KST, 관측 12:51:30 KST는 승인 시각이 아니다.
- 범위와 PoC 위험: 위 승인된 포함·제외·위험표. 공개 서비스·운영 안전성 보장은 아니다.
- W7 필수 준비: 실제 480초 리허설(참석자 정확히 기록), 각 Beat 결과·소요시간, 가능한 전체 녹화·재생/무결성 검사, LIVE 실패 fallback 실행 검증, AI/W4 분리, 민감정보 검사, 발표 PC 점검 및 최종 Go/No-Go. 전체 녹화가 실제 존재하고 재생 검증되기 전 `RECORDED_READY=false`.
- 별도 정책·LOCK·TEST·신규 송신 승인: 이 결정에 포함하지 않음
