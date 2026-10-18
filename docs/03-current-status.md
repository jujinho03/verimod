# 최신 구현·실행·승인 상태

기준일: **2026-10-18**. 팀 목표는 W4 실제 A/F/T 연결과 3회차 멘토링 준비입니다. **GATE-4는 PARTIAL이며 실제 Epoch 1 송신과 공개 체인 검증은 미완료입니다.**

## 코드와 문서의 위치

2026-10-18에 아래 A/F/T W4 브랜치를 main에 병합했습니다. main에서 W4 코드와 문서를 함께 확인할 수 있습니다.

| 담당 | 병합한 고정 SHA | 범위 |
| --- | --- | --- |
| A | `3a8993bfaf36642d2a67d0a147da9086008bd912` | 실제 모델 추론/평가/E2E·공개 인계 |
| F | `c1f750ea3752037d749324f1535df051ce6b37f9` | Manifest·Freeze·ACK·신뢰 confirmation |
| T | `7534907fa3ad66cc6ed29cfbee2efd8c2c75369e` | Issuer·승인 프로필·ACK 후 송신·SUBMITTED 분리 |

병합 후 회귀: frontend 200/200, browser 1/1, backend 197/197·typecheck, contracts 18/18, 각 build PASS.

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
| F 원본 DB status | PASS: FROZEN/tx_hash=null, identity·bytes·멤버 보존 |
| T 공개 JSON 독립 확인 | 팀 보고 PASS |
| 호스트 보안 구성 | 완료: DB 최소 ACL, 비관리자 F 전용 계정, Windows OpenSSH 공개키·강제 명령, 사설망·방화벽 T 한정 |
| A/T status 채널 | **PASS (2026-10-18)**: T → A SSH 공개키 인증, 고정 status 왕복, 원격 명령·PTY·포워딩·SFTP·다른 계정 차단, DB 불변 |
| A RPC 읽기 검증 | A 운영 기록 PASS: chain/contract/publisher, EIP-1898 canonical `eth_call`. F 설정에는 RPC를 아직 넣지 않음 |
| 송신 전 prepare ACK | 미실행: status는 durable ACK가 아님. APPROVAL_5 필요 |
| 실제 Epoch 온체인·F CONFIRMED·외부 브라우저 | 미완료: 성공 결과를 새로 만들지 않음 |

시험 후 SSH 서비스, F 전용 계정, 신규 방화벽 규칙은 다시 비활성 상태로 두었습니다.

## 다음 최소 작업

APPROVAL_5(실제 Epoch prepare·서명·송신) 결정 → 제한된 prepare 경로 계약 확인 → T 서명·F ACK·송신 → A submitted/confirmed → 외부 브라우저 검증 → 팀 GATE 판정 순서입니다.

[운영 절차와 복구](handoffs/W4-AFT-operations.md)에서 승인 범위를 확인합니다.

## 과거 기록 보존

이전 P0/W1 현황은 [역사 사본](history/03-current-status-before-w4-update.md)에 보존했습니다. W3 frozen config/lock/Registry/Manifest/fixture와 실패 증거는 변경하지 않았습니다. [W3 통합](evidence/w3-team-integration.md)은 당시 결과이며 W4 GATE 판정과 구별합니다.
