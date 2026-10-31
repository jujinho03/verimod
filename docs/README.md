# VeriMod 한국어 문서 안내

> **대상:** 멘토·팀원 · **목적:** 현재 안내와 날짜가 있는 역사적 근거를 구분해 찾아봅니다.
>
> **읽기 기준:** 아래 W4 안내는 2026-10-18~20 당시 기록입니다. W7 범위와 이후 통합 상태는 먼저 아래 자료를 확인하세요.

## W7부터 읽기

| 순서 | 자료 | 확인할 내용 |
| --- | --- | --- |
| 1 | [5회차 멘토링 한눈에 보기](mentoring/mentor-brief-20261031.md) | 프로젝트 설명·근거·제약·멘토 질문 |
| 2 | [멘토링 자료 안내](mentoring/README.md) | 1~4회차 권고와 원문·팀 결정·구현 추적 |
| 3 | [심사위원용 실행 안내](08-submission-guide.md) | 실제 R01, W4 공개 Receipt와 합성 모드 구분 |
| 4 | [승인된 W7 데모 인계](handoffs/W7-core-demo-approved-handoff-20261030.md) | Option B 범위 및 남은 작업 |
| 5 | [Data Card](data-card.md) · [Model Card](model-card.md) | 데이터 출처, 평가와 한계 |

## 문서 양식

새 안내 문서는 **제목 → 대상·목적 → 기준일과 SHA → 핵심 요약 → 근거와 한계 → 다음 행동** 순서를 권장합니다. 결정 상태와 실행 결과를 표로 정리할 때는 `APPROVED`, `PASS`, `PARTIAL`, `NOT_VERIFIED`의 적용 범위와 출처를 함께 씁니다. 날짜가 지난 기록에는 원문을 지우는 대신 날짜가 있는 이후 경과를 별도로 표시합니다. 코드 블록·해시·명령어와 공개 증거 원본은 형식을 맞추기 위해 변경하지 않습니다.

## W4 당시 자료 — 2026-10-18~20

다음은 해당 시점의 구현·실행 근거입니다. 표의 과거 상태를 현재 실행 결과로 바꾸지 않습니다.

| 순서·목적 | 자료 |
| --- | --- |
| 프로젝트·최신 상태 | [저장소 README](../README.md), [현재 상태](03-current-status.md) |
| 3회차 멘토링 | [**결과: 권고·팀 결정·W5 후속 항목 (2026-10-20 수신)**](mentoring/session-03-20261020-lee-jaewon.md), [사전자료와 질문](mentor-prep-session3.md), [회차별 멘토링 기록](mentoring/README.md) |
| W4 담당별 성과·남은 조건 | [W4 통합 현황](progress/W4.md) |
| 실제 모델·발급·Freeze 근거 | [A 실행 한국어 해설](evidence/w4-a-actual-frozen-epoch.md) |
| 공개 파일 직접 확인 | [실제 등록 증거·영수증·브라우저 검증](handoffs/w4-anchored-epoch-public/20261020-r01/README.md), [송신 전 Frozen Epoch JSON](handoffs/w4-frozen-epoch-public/20261017-r01/README.md) |
| 실제 연결과 승인 | [최소 운영](handoffs/W4-AFT-operations.md), [F Callback](handoffs/W4-F-durable-callback-runner.md), [F confirmation](handoffs/W4-F-trusted-confirmation.md), [T 인계](handoffs/W4-T-epoch-handoff.md) |
| 배포·검사 범위 | [W4 배포 해설](deployments.md), [F 192개 검사](evidence/w4-f-confirmation/20261017/README.md) |

## 읽는 기준

- 2026-10-18부터 main에 A/F/T W4 코드가 병합돼 있습니다. 병합한 고정 SHA는 [현재 상태](03-current-status.md)에 있습니다.
- 실제 호스트 실행, 정적 검토, 팀 보고, 합성 DB/RPC stub 검사를 구별합니다.
- GATE-4는 PASS(기술 조건 14/14, 2026-10-20)입니다. 실제 Epoch 등록·원본 DB CONFIRMED·브라우저 실제 검증 결과는 [공개 증거](handoffs/w4-anchored-epoch-public/20261020-r01/README.md)에 있습니다.
- TEST SEALED, 정책 provisional/team_approved=false, 원문·DB·키 비공개 조건을 유지합니다.
- 설명 문서는 한국어로 정리했습니다. 원본 JSON, 명령어, 코드 식별자, commit 메시지, 해시·수치는 검증을 위해 원문 그대로 둡니다. 이후 경과는 각 문서의 "이후 경과" 표시로 덧붙였습니다.

## 기존 명세와 역사

| 목적 | 자료 |
| --- | --- |
| 팀 의사결정 | [결정 기록](02-decision-register.md) |
| 도메인·초안 | [도메인](01-domain-and-interfaces.md), [계약 초안](04-interface-contract-draft.md) |
| 계산·신뢰 규격 | [canonical](spec/canonical-profile-v1.md), [Merkle](spec/merkle-spec.md), [TrustProfile](spec/trust-profile.md), [ABI](spec/i4-anchor-abi.md) |
| 주차별 기록 | [W1](progress/W1.md), [W2](progress/W2.md), [W3](progress/W3.md), [W4](progress/W4.md) |
| W3 동결·통합 원본 | [A 최종 증거](evidence/w3-a-final.md), [공동 통합](evidence/w3-team-integration.md) |
| 기존 합성 데모 | [실행 안내](08-submission-guide.md), [예제](examples/README.md) |
| 과거 현황 | [이번 갱신 전 원문](history/03-current-status-before-w4-update.md), [과거 감사](00-repository-audit.md) |

과거 문서의 CURRENT/미구현 표시는 작성 당시 기록입니다. 위 W4 해설은 2026-10-18 기준 자료와 고정 소스를 따르며 기술 채택·테스트 통과·팀 승인·실제 실행을 구별합니다. 이후 상태는 맨 위 W7 안내에서 확인합니다.
