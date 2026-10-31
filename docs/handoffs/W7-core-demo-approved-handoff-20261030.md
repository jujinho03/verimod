# W7 Core Demo 인계 — 팀장 결정과 실행 준비

> **이후 경과 — 2026-10-31 확인:** 아래의 문서 PR 대기 표기는 작성 당시 기록입니다. 결정 기록은 [PR #39](https://github.com/jujinho03/verimod/pull/39)로 main에 반영됐고, W6은 수용된 위험을 동반해 조건부 종료됐습니다. 원래 W6 Engineering Exit와 E6은 계속 `PARTIAL`입니다. 현재 읽기 순서와 근거는 [멘토링 한눈에 보기](../mentoring/mentor-brief-20261031.md)를 참조하세요.

결정 `D-W6A-20261030-01`: 대화에서 팀장 주진호(A)를 밝힌 사용자의 승인 메시지에 Option B의 포함·제외 범위와 데모 PoC 위험 수용이 명시됐다. 승인 메시지의 계정 신원 및 정확한 발신 시각은 이 문서에서 독립 검증하지 않았다. 승인 근거와 시각은 별도 결정 기록을 따른다. **저장소의 정식 결정 반영과 W6 조건부 종료 확정은 문서 PR의 F 독립 승인, 병합 및 병합 후 CI 검증을 기다린다.** 이 인계는 리허설이나 시연이 실행됐다는 기록이 아니다.

기준 main `fd1fe1b50671f88b89ff1412cd702b59f46d0c18`; 이 SHA는 작성 기준이며 이번 W7 실행 SHA가 아니다. [결정 기록](../evidence/w6-w7-core-demo-scope-proposal-20261030.md), [기존 5-Beat 시트](W6-W7-five-beat-rehearsal-20261029.md), [W6 MUST](W6-MUST-plan.md), [F 공개 실측 요약](../evidence/w6-f/20261029/README.md), [보안 감사](../evidence/w6-a-security-closure-20261029/README.md)를 함께 읽는다. 과거 시점의 문서는 소급 수정하지 않는다.

## 승인된 Core Demo와 이월 범위

1. **AI 추론:** R01의 실제 무해한 입력과 추론 결과를 표시하고, [과거 AI-19 오프라인 기록](../evidence/w6-a-ai19-offline/ai19-final-assessment.md)과 새 실행을 구분한다.
2. **W4 검증:** Base Sepolia chain ID `84532`의 기존 Epoch 1 공개 Decision Receipt를 승인된 RPC로 읽기 전용 검증한다. 기록 무결성은 AI 판정의 정확성을 증명하지 않는다.
3. **변조:** body 수정 후 기존 claimed hash 유지 시 `HASH_MISMATCH`, body 수정·hash 재계산 후 기존 proof/root 유지 시 `INVALID_PROOF`를 각각 관측한다. proof sibling 변경은 별도 사례다.
4. **장애·복구:** 같은 Receipt에서 승인된 RPC를 대상으로 브라우저 Playwright route abort를 주입하고, `RPC_UNAVAILABLE`과 복구를 실제 관측한 범위만 표시한다.
5. **설명·증거:** 기존 W4 공개 증거, [Data Card](../data-card.md), [Model Card](../model-card.md), 실행 SHA·모드·시각, 구현과 미완료 범위를 표시한다.

새 R01 추론과 과거 W4 Receipt는 별개 사례다. 신규 AI→Receipt→Epoch→anchor 전체 경로가 완료됐다고 주장하지 않는다. 신규 연구 정책 운영·A/F 계약·새 Manifest/parity·신규 Runtime Binding·F2·LOCK·TEST·SEED-01 신규 송신·새 Epoch는 데모 필수 범위에서 제외하고 원래 미완료 상태와 backlog를 유지한다. 실제 Hardhat LOCAL은 `NOT_VERIFIED`, 물리 모바일은 `NOT_EXECUTED`이며 필수 시연에서 제외하되 향후 선택 검증할 수 있다. S1은 `PENDING_APPROVAL`, A3/A4는 `INCOMPLETE`, LOCK은 `NOT_EXECUTED`, TEST는 `SEALED`다. 어떤 파일이나 보안 검증도 삭제·완화하지 않는다.

## 원래 W6 Exit와 Option B 준비도

| Gate | 원래 W6 기준 | Option B 준비와 남은 증거 |
|---|---|---|
| E1 | PASS 권고: 기존 W4 VALID 및 evidence tree 보존 | 발표 직전 해당 입력·승인 profile의 LIVE 결과 확인 |
| E2 | PARTIAL: rehash INVALID_PROOF는 F 보고, private 원본 및 실행 SHA의 최종 HEAD 대응 독립 확인 한계 | 실제 변조 유형·SHA·결과를 새로 기록 |
| E3 | PARTIAL: Desktop·mobile emulation의 route-abort 복구 보고; 물리 모바일과 백업 전체 경로 미입증 | 동일 Receipt·주입 방식·실제 결과 기록 |
| E4 | 코드·문서 통합 완료; #36 사전 독립 승인 부재 및 #37 A 패치 기여와 T 전문 리뷰 부재를 별도 보존 | 이 결정 문서 PR에도 독립 승인·CI·일반 병합 필요 |
| E5 | PARTIAL: Windows fail-closed 일부, 53 SKIP, writable callback UNSUPPORTED, 비 Windows·symlink/reparse 공백 | 검증하지 않은 보안 범위를 표시; T 복귀 후 검토 |
| E6 | PARTIAL: F 수정 후보 8 VALID / 2 RPC_UNAVAILABLE, 연속 10회 NOT_MET; 실제 Hardhat LOCAL 및 전체 녹화 미완료 | LIVE를 확인하고 실패 시 다른 모드로 명시적 전환 |
| E7 | PARTIAL: 카드·README 근거 확보, DOC-09·OPS-04 미확인 | 자료 출처·검증 한계를 표시하고 원문 확인 |
| E8 | PARTIAL: 실제 480초 공동 리허설과 전체 녹화 미완료 | 실제 참석자, Beat별 시간·상태, 녹화 재생 검증 |

`ORIGINAL_W6_ENGINEERING_EXIT=PARTIAL`, `W7_CORE_DEMO_READINESS=IN_PROGRESS`, `E6=PARTIAL`, `BASE_CONSECUTIVE_10=NOT_MET`을 유지한다. Scope Cut에 따른 PoC 위험 수용은 운영 안전성 보장이 아니다. 별도 `W6-RPC-RELEASE-ACCEPTANCE`는 RPC 코드 통합 결정이다.

## 담당과 필수 준비

| 담당 | 실행 및 이월 책임 |
|---|---|
| A / 주진호 | 결정·E1~E8·Beat 1·발표 진행, 발표 PC 사전 점검, 민감정보 점검과 녹화 검수, 멘토링·CNU MATE 원문 확인, 최종 Go/No-Go |
| F / 노유신 | LIVE UI·변조·복구·모드 표시, 입력과 공개 가능한 SHA·로그, 브라우저 안정성, 전체 녹화와 재생 검증, 문서 PR 독립 리뷰 |
| T / 설경민 복귀 후 | 전문 보안 리뷰, SEC-W5-01 비 Windows, 실제 Hardhat LOCAL 가능성, TrustProfile·RPC 위협과 프로토콜 검증 범위 감사 |

A/F는 T 부재 중에도 준비와 리허설을 진행할 수 있다. 그 경우 참석자를 A/F로 기록하고 A/F/T 공동 리허설로 표현하지 않는다. T 전문 검토를 대리 완료했다고 기록하지 않는다.

## 480초 5-Beat 실행표 — 계획 / NOT_EXECUTED

시간은 목표치이며 실제 측정이 아니다. 매 행의 새 실행 SHA·환경·시각·관측 상태·소요 시간은 실행 후에만 기입한다.

| 구간 | 담당 | 입력·기대 결과 | 현재 증거 / 실행 SHA | 실패 시 전환 및 Go/No-Go |
|---|---|---|---|---|
| 도입 40초 | A | AI와 기존 W4 anchor가 별개임을 설명 | 이번 실행 SHA 미기록 | 출처와 경계를 설명하지 못하면 해당 주장 NO-GO |
| Beat 1 — AI 80초 | A, F 보조 | R01 서비스·공개 가능한 무해한 새 입력·실제 응답 | 과거 AI-19 1회 JSON, 코드 `44842f78fdc8102507b9f3aeeed5d0eda8e9eeaf`; 이번 SHA 미기록 | 실패하면 과거 자료임을 명시해 설명. 새 추론 성공으로 기록 금지 |
| Beat 2 — W4 VALID 75초 | F, A 확인 | [W4 receipt-0 bundle](w4-anchored-epoch-public/20261020-r01/receipt-0.bundle.json), 승인 BASE profile, LIVE VALID | 과거 W4 및 F 후보 보고; 이번 SHA 미기록 | `RPC_UNAVAILABLE`을 유지하고 mock 또는 검증된 녹화/과거 증거로 라벨 전환. LIVE 성공으로 세지 않음 |
| Beat 3 — HASH_MISMATCH 55초 | F, A 확인 | 별도 사본 body 변경, 기존 claimed hash 유지 | F 수정 후보 보고; 이번 SHA 미기록 | 실제 결과 기록; 기대 판정이 없으면 해당 주장 NO-GO |
| Beat 4 — INVALID_PROOF 90초 | F, A 확인 | 별도 사본 body 변경 후 rehash, 기존 proof/root 유지 | F 수정 후보 보고, 원본 독립 확인 한계; 이번 SHA 미기록 | RPC 실패는 BLOCKED 또는 RPC_UNAVAILABLE. sibling 변형은 별도 명시적 결정·별도 라벨이며 rehash 성공이 아님 |
| Beat 5 — Recovery 100초 | F, A 확인 | 같은 bundle/hash/profile, 승인 RPC의 route abort 후 해제; VALID → RPC_UNAVAILABLE → VALID | Desktop 및 mobile emulation F 보고; 이번 SHA 미기록 | 초기 또는 복구 실패는 실제 상태·시각 기록 후 fallback. 물리 장애나 백업 전체 검증으로 표현 금지 |
| 마무리 40초 | A | 실제 모드, 관측 결과와 정책·기술 한계 설명 | 이번 실행 미기록 | 근거 없는 성공·미승인 기능은 발표 NO-GO |

F가 보고한 수정 후보 실행 SHA `d90335b484ab9491f046434ac604d79426c4e648`의 원본 private 로그 및 최종 원격 HEAD 대응은 독립 확인하지 못했다. F의 8/10과 HTTP 429/413은 당시 보고다. 이번 실행에서 새로 측정된 결과로 표시하지 않는다.

## 모드, fallback 및 녹화

- **LIVE:** Base Sepolia 승인 profile과 실제 RPC의 읽기 전용 검증. Primary HTTP 429 또는 backup HTTP 413/관측된 getLogs 200-block 제한 시 실패를 그대로 표시한다. Backup 전체 Event 검증 성공은 미입증이다.
- **SYNTHETIC_LOCAL:** 브라우저 mock이다. W4 LIVE 성공, BASE 반복 성공 또는 실제 Hardhat 결과에 합산하지 않는다.
- **LOCAL_HARDHAT:** 실제 노드 기반 별도 경로이며 현재 `NOT_VERIFIED`. 선택적 후속 검증 전에는 fallback 준비 완료로 표시하지 않는다.
- **RECORDED:** 실제 파일의 존재, 재생 및 무결성, 촬영일·실행 모드·코드/증거 SHA, 공개 가능성과 원문·salt·키·로컬 DB·비밀 경로 노출 여부가 확인된 경우에만 사용한다. 현재 전체 발표 녹화는 미완료이므로 `RECORDED_READY=false`다.

W7 필수 작업은 실제 480초 리허설, Beat별 실제 시간·상태 기록, 가능한 공개 가능한 전체 시연 녹화와 재생·무결성 확인, LIVE 실패 fallback 실행 검증, 별도 사례 표시, 민감정보 검사, 발표 PC 환경 점검과 최종 Go/No-Go다. RPC 오류를 `VALID`로 바꾸거나 원본 W4 증거를 수정하지 않는다.

## 기록란 — 실행 전 빈칸

- 리허설 참석자(A/F 또는 A/F/T), 일시·시작·종료·총 시간: 미기록
- 실행 SHA·실행 환경·각 Beat 입력·모드·결과·시간·fallback: 미기록
- 화면 녹화 파일·SHA·촬영 시각·재생 및 민감정보 검사: 미기록; `RECORDED_READY=false`
- 발표 PC 확인 및 최종 Go/No-Go·결정자: 미기록

## 5회차 멘토링 기술 질문

1. Primary 429와 backup 413/200-block 제한에서 전체 Event 검증과 정직한 fallback을 어떻게 구성할 것인가?
2. chain ID 확인과 데이터 호출 사이 TOCTOU, 독립 canonical block 조회 부재 및 환경 변수 기반 승인값 강제 한계의 후속 완화·독립 검토 범위는 무엇인가?
3. Windows 53 SKIP, writable callback UNSUPPORTED와 비 Windows·symlink/reparse 공백을 어떤 환경별 증거로 닫을 것인가?
4. F 실측 원본과 실행 SHA를 민감정보 노출 없이 최종 코드와 연결해 검증할 수 있는가?
5. 실제 Hardhat LOCAL·물리 모바일은 선택 이월로 유지하면서 AI 정확성과 Receipt 무결성의 한계를 어떻게 설명할 것인가?
