# VeriMod 한국어 문서 안내

갱신: 2026-10-18. 멘토님은 다음 순서로 현재 상태와 근거를 확인할 수 있습니다.

| 순서·목적 | 자료 |
| --- | --- |
| 프로젝트·최신 상태 | [저장소 README](../README.md), [현재 상태](03-current-status.md) |
| 3회차 멘토링 | [사전자료와 질문](mentor-prep-session3.md) |
| W4 담당별 성과·남은 조건 | [W4 통합 현황](progress/W4.md) |
| 실제 모델·발급·Freeze 근거 | [A 실행 한국어 해설](evidence/w4-a-actual-frozen-epoch.md) |
| 공개 파일 직접 확인 | [Frozen Epoch JSON 4개·SHA-256](handoffs/w4-frozen-epoch-public/20261017-r01/README.md) |
| 실제 연결과 승인 | [최소 운영](handoffs/W4-AFT-operations.md), [F Callback](handoffs/W4-F-durable-callback-runner.md), [F confirmation](handoffs/W4-F-trusted-confirmation.md), [T 인계](handoffs/W4-T-epoch-handoff.md) |
| 배포·검사 범위 | [W4 배포 해설](deployments.md), [F 192개 검사](evidence/w4-f-confirmation/20261017/README.md) |

## 읽는 기준

- 2026-10-18부터 main에 A/F/T W4 코드가 병합돼 있습니다. 병합한 고정 SHA는 [현재 상태](03-current-status.md)에 있습니다.
- 실제 호스트 실행, 정적 검토, 팀 보고, 합성 DB/RPC stub 검사를 구별합니다.
- GATE-4는 PARTIAL입니다. 실제 T → A status 왕복은 PASS했지만, 실제 Epoch 송신·F confirmation·외부 브라우저 결과는 아직 없습니다.
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

과거 문서의 CURRENT/미구현 표시는 작성 당시 기록입니다. 현재 해설은 2026-10-18 기준 자료와 고정 소스를 우선하고 기술 채택·테스트 통과·팀 승인·실제 실행을 구별합니다.
