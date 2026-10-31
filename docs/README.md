# VeriMod 문서 안내

> **대상:** 멘토·심사위원·개발자 · **목적:** 현재 안내, 승인된 결정과 역사적 실행 근거를 구분해 찾습니다.
>
> **기준:** 2026-10-31 확인 main `f6ad522513dcb198d520c70f98c1cc5e98748f51`. 각 문서의 기준일·SHA와 실행 주체를 함께 확인하세요.

## 목적별 탐색

| 목적 | 자료 | 읽는 기준 |
| --- | --- | --- |
| 프로젝트 전체 소개 | [저장소 README](../README.md) · [현재 상태](03-current-status.md) | W7 범위와 W4 역사적 실증을 구분 |
| 시스템 구성 | [도메인과 인터페이스](01-domain-and-interfaces.md) · [백엔드 구조](spec/backend-architecture-w1.md) · [프런트엔드](../frontend/README.md) | 초안과 구현 현황을 구분 |
| AI·데이터 | [Data Card](data-card.md) · [Model Card](model-card.md) · [AI 작업 공간](../ai/README.md) | VALIDATION과 봉인된 TEST, 모델과 정책을 구분 |
| Protocol·Blockchain | [명세 안내](spec/README.md) · [canonical](spec/canonical-profile-v1.md) · [Merkle](spec/merkle-spec.md) · [TrustProfile](spec/trust-profile.md) · [ABI](spec/i4-anchor-abi.md) | 규격과 실제 구현·실행 범위를 각 근거에서 확인 |
| 실제 실행·테스트 | [증거 안내](evidence/README.md) · [W4 공개 앵커](handoffs/w4-anchored-epoch-public/20261020-r01/README.md) | 과거 실제 실행·합성 테스트·담당자 보고 구분 |
| 주차별 진행 | [진행 기록 안내](progress/README.md) · [W5 GATE-5](progress/W5-GATE5-decision-record.md) · [W6](progress/W6.md) | 작성 시점의 Gate와 이후 이월을 구분 |
| 멘토링 | [멘토링 자료 안내](mentoring/README.md) · [5회차 기술 요약](mentoring/mentor-brief-20261031.md) | 원문 권고·팀 결정·구현·제출 증거 구분 |
| 보안·감사 | [Windows SEC-W5-01](security/sec-w5-01-negative-test-audit-20261029.md) · [W6 보안 감사](evidence/w6-a-security-closure-20261029/README.md) | 실제 검증·SKIP·보고·잔여 위험 구분 |
| 본선 데모 | [심사위원용 실행 안내](08-submission-guide.md) · [W7 인계](handoffs/W7-core-demo-approved-handoff-20261030.md) · [5-Beat 계획](handoffs/W6-W7-five-beat-rehearsal-20261029.md) | LIVE·SYNTHETIC·과거 증거·실제 리허설 구분 |
| 결정·이력 | [Decision Register](02-decision-register.md) · [과거 상태](history/03-current-status-before-w4-update.md) · [초기 감사](00-repository-audit.md) | 승인된 범위와 당시 관찰을 소급 변경하지 않음 |

## 문서 작성과 상태 표기

[문서 스타일 가이드](documentation-style-guide.md)는 제목, 기준일·SHA, 상태·근거, 표·링크 및 개인정보 경계를 정의합니다. 상태는 해당 증거 범위에 한정하며, 날짜가 지난 기록에는 원문을 지우는 대신 날짜가 있는 이후 경과를 별도로 표시합니다.

## 문서 감사

| 자료 | 용도 |
| --- | --- |
| [저장소 문서 감사](audits/repository-doc-audit-20261031.md) | 추적 Markdown 목록, 분류 및 확인 범위 |
| [정합성 보고](audits/documentation-consistency-report-20261031.md) | 실제 불일치, 시점 차이, 미확인 항목 |
| [GitHub 동기화 기록](audits/github-sync-report-20261031.md) | 브랜치·PR·CI의 확인 시점과 남은 조건 |

코드 블록·해시·명령어와 공개 증거 원본은 형식을 맞추기 위해 변경하지 않습니다.
