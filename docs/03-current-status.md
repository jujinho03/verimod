# 최신 구현·실행·승인 상태

> **대상:** 멘토·팀원 · **목적:** W4 당시 구현·실행·승인 근거를 확인합니다. W7 안내는 [멘토링 한눈에 보기](mentoring/mentor-brief-20261031.md)와 [실행 안내](08-submission-guide.md)를 참조하세요.

> **2026-10-30 업데이트:** 아래 본문은 2026-10-20 W4 기준의 역사 스냅샷입니다. 현재 승인된 W7 범위, 실행 경로와 미완료 상태는 [W7 심사위원용 실행 안내](08-submission-guide.md) 및 [Option B 결정 기록](evidence/w6-w7-core-demo-scope-proposal-20261030.md)을 확인하세요. 과거 W4 실행은 새 W7 실행을 보증하지 않습니다.

기준일: **2026-10-20**. **W4 GATE-4 = PASS (기술 조건 14/14).** 실제 Epoch 1을 Base Sepolia에 등록하고, 원본 F DB를 CONFIRMED로 확정했으며, 실제 브라우저에서 독립 검증했습니다. 정책은 `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`인 테스트넷 시연입니다.

> 이력: 2026-10-18 기준 판정은 PARTIAL(실제 송신 전)이었습니다.

## 코드와 문서의 위치

2026-10-18에 A/F/T W4 브랜치를 main에 병합했고, 2026-10-20에 실제 등록 과정에서 나온 수정 2건(브라우저 검증기 조회 범위, T sender 서명 방식)을 반영했습니다.

| 담당 | 병합한 고정 SHA | 범위 |
| --- | --- | --- |
| A | `3a8993bfaf36642d2a67d0a147da9086008bd912` | 실제 모델 추론/평가/E2E·공개 인계 |
| F | `c1f750ea3752037d749324f1535df051ce6b37f9` | Manifest·Freeze·ACK·신뢰 confirmation (실제 확정에 쓴 런타임) |
| T | `7534907fa3ad66cc6ed29cfbee2efd8c2c75369e` | Issuer·승인 프로필·ACK 후 송신·SUBMITTED 분리 |

## GATE-4 조건

| 조건 | 결과 | 근거 |
| --- | --- | --- |
| 실제 AI 영수증 2건 | PASS | FULL·TRUNCATED, hash 재계산 2/2 |
| Merkle root 일치 | PASS | `0x32bf…9f82` 독립 재계산, 포함 증명 2/2 |
| 송신 전 원본 DB 기록 | PASS | prepare 1회 → SUBMITTING, 저장 서명 = 체인 tx |
| Base Sepolia 등록 성공 | PASS | tx `0x175b…7286`, 블록 48,358,039, status 1, tx 1건 |
| 이벤트·getter 일치 | PASS | 공개 RPC 2곳, EIP-1898 |
| 12회 이상 확인 | PASS | F 확정 시 339회 |
| 원본 F DB CONFIRMED | PASS | submitted → confirmed |
| 확인 증거 영속 저장 | PASS | `epoch_confirmation_evidence`, binding·서명 해시 일치 |
| 공개 bundle proof/anchor | PASS | [공개 증거](handoffs/w4-anchored-epoch-public/20261020-r01/README.md) |
| 브라우저 실제 VALID | PASS | 영수증 2건 |
| 브라우저 HASH_MISMATCH | PASS | 본문 변조 |
| 브라우저 INVALID_PROOF | PASS | proof 변조 |
| fail-closed | PASS | 미승인 컨트랙트·체인 → UNTRUSTED_ANCHOR, 불완전 bundle → PENDING_ANCHOR |
| 개인정보 경계 | PASS | 원문·salt·raw tx·키·RPC·DB 경로 비공개 |

## 그 밖의 상태

| 항목 | 상태 |
| --- | --- |
| AI-09·AI-21 | PASS. VALIDATION 1,255건, Macro-F1 0.6525 |
| 정책 | PROVISIONAL. X/B·운영 승인·LOCK은 W4 범위 밖 |
| TEST | SEALED (접근 없음) |
| 운영 연결 | 사용 후 닫음: sshd·F 전용 계정·신규 방화벽 규칙 비활성, 강제 명령은 status 전용으로 복귀 |
| 알려진 표시 한계 | 검증 화면의 보조 manifest 확인이 실패로 표시(공개 목록에 W4 실제 manifest 없음), 상단 "PROTOTYPE MODE" 배너 |
| 3회차 멘토링 | 2026-10-20 피드백 수신. 권고는 팀 결정과 구분해 [결과 문서](mentoring/session-03-20261020-lee-jaewon.md)에 기록(2026-10-21). X/B·threshold·LOCK은 PENDING_TEAM_DECISION |

[운영 절차와 승인 구분](handoffs/W4-AFT-operations.md)을 참고합니다.

## 과거 기록 보존

이전 P0/W1 현황은 [역사 사본](history/03-current-status-before-w4-update.md)에 보존했습니다. W3 frozen config/lock/Registry/Manifest/fixture와 실패 증거는 변경하지 않았습니다. 송신 전 동결 자료는 [w4-frozen-epoch-public/20261017-r01](handoffs/w4-frozen-epoch-public/20261017-r01/README.md)에 그대로 있습니다.
