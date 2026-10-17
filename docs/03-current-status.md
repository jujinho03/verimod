# 최신 구현·실행·승인 상태

기준일: **2026-10-17**. 팀 목표는 W4 실제 A/F/T 연결과 3회차 멘토링 준비입니다. **GATE-4는 PARTIAL이며 실제 Epoch 1 송신과 공개 체인 검증은 미완료입니다.**

## 코드와 문서의 위치

main 실행 코드는 W3 통합 `1401e03931f76ed8405454081adb9478339bae67` 기준입니다. 이번에는 한국어 문서와 공개 증빙을 반영하고 W4 전체 코드 병합은 하지 않습니다.

| 담당 | 고정 SHA | 범위 |
| --- | --- | --- |
| A | `3a8993bfaf36642d2a67d0a147da9086008bd912` | 실제 모델 추론/평가/E2E·공개 인계 |
| F | `c1f750ea3752037d749324f1535df051ce6b37f9` | Manifest·Freeze·ACK·신뢰 confirmation |
| T | `7534907fa3ad66cc6ed29cfbee2efd8c2c75369e` | Issuer·승인 프로필·ACK 후 송신·SUBMITTED 분리 |

## 상태표

| 항목 | 상태·근거 |
| --- | --- |
| AI-09 | PASS: 실제 selected R01 forward, I1·입력·실패 계약 |
| AI-21 | 기존 PASS 유지: VALIDATION 1,255건, W3 Macro-F1과 차이 0 |
| 정책 | PROVISIONAL: Validation 기반 후보. X/B·운영 승인 미확정 |
| Python/Node parity | PASS 21/21: threshold·hash·action/reason/rule 일치 |
| AI-10 | PASS: 정상 2건 + Fail Closed 17건. 과거 Manifest 실패는 수정 후 해소 |
| Issuer | MATCH: F/Receipt/T profile 모두 verimod-example-platform |
| 실제 Receipt·Epoch | 2건, Epoch 1/count 2/version 1, 독립 root·재개방 PASS |
| 최신 F 원본 DB status | PASS: FROZEN/tx_hash=null, identity·bytes·멤버 보존 |
| T 공개 JSON 독립 확인 | 팀 보고 PASS. 이번 문서 작업에서 T 환경 재실행 없음 |
| A/T 사전 ACK 채널 | BLOCKED: signer는 T, DB는 A. 사설 SSH 미구성 |
| 호스트 보안 | 승인 대기: Users Modify, 전용 계정·SSH·VPN·방화벽 필요 |
| A RPC EIP-1898 | 미검증: 승인 endpoint/config 없음 |
| 실제 Epoch 온체인·F CONFIRMED·외부 브라우저 | 미완료: 성공 결과를 새로 만들지 않음 |

## 다음 최소 작업

관리자 UAC 접근 확보 → 최소 ACL/전용 계정 → 사설 VPN/Windows OpenSSH → 무서명 status 왕복 → 승인 RPC hash-bound 검사 → 별도 Epoch 승인 → T 서명·F ACK·송신 → A submitted/confirmed → 외부 브라우저 검증 순서입니다.

[운영 절차와 복구](handoffs/W4-AFT-operations.md)에서 승인 범위를 확인합니다. 이번 문서 갱신에는 설치·권한·서명·송신이 없습니다.

## 과거 기록 보존

이전 P0/W1 현황은 [역사 사본](history/03-current-status-before-w4-update.md)에 바이트 그대로 보존했습니다. W3 frozen config/lock/Registry/Manifest/fixture와 실패 증거는 변경하지 않았습니다. [W3 통합](evidence/w3-team-integration.md)은 당시 결과이며 W4 GATE 판정과 구별합니다.
