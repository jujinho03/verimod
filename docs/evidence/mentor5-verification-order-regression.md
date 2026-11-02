# Mentor 5 — 검증 순서와 변조 회귀

기준: 2026-11-02, main `7a6aa2ad27ad58d0454b39f28a07d069ac4e93b1`에서 시작한 개발 worktree. 이 문서의 단위 테스트는 합성 fixture와 mock 원장을 사용하며 공개 RPC 실측을 뜻하지 않는다.

`frontend/src/domain/verify.ts`의 순서는 형식 → receipt 본문 해시 → 신뢰 앵커 → 원장 epoch 조회 및 head 조회 → Merkle 포함 증명 → L2 확인 수다. 본문 해시는 `SHA-256(ASCII("verimod:receipt:v1") || 0x00 || JCS(body))`다. 이전 화면은 실제 계산 전에 leaf를 통과로 표시하고 proof를 RPC보다 먼저 배치했다. 변경된 단계 패널은 `verifyCore`의 여섯 상태를 순서대로 표시하며 RPC 조회 실패 시 inclusion은 `SKIPPED`다. 원장은 선택한 모드에 따라 합성 원장일 수도 있다.

`frontend/src/domain/verify.test.ts`의 mock 원장 테스트 및 기존 테스트는 다음을 확인한다. 표에서 정상 원장과 장애는 모두 통제된 테스트 상태다.

| 사례 | 기대 코드 | 근거 |
| --- | --- | --- |
| 정상 | VALID | 정상 fixture |
| 본문만 변경, 원장 정상·장애 | HASH_MISMATCH | 장애 조건에서도 원장 호출 0회 확인 |
| 본문과 해시 변경, 원장 정상 | INVALID_PROOF | 기존 proof와 root 사용 |
| 본문과 해시 변경, 원장 장애 | RPC_UNAVAILABLE | inclusion 단계 SKIPPED |
| 정상, 원장 장애 | RPC_UNAVAILABLE | 변조 여부 판단 아님 |
| proof와 anchor 없음 | PENDING_ANCHOR | 기존 회귀 |
| 승인되지 않은 체인 또는 컨트랙트 | UNTRUSTED_ANCHOR | 체인은 원장 호출 전 거부 확인 |
| 장애 복구 후 정상 재실행 | VALID | mock 복구 |

실제 W4 공개 체인 VALID·INVALID_PROOF·복구 VALID는 공개 RPC 상태에 의존한다. 별도의 실제 실행 증거 없이는 위 mock 결과를 실측 성공으로 해석하지 않는다. 상세 명령과 실행 결과는 개발 결과 요약을 따른다.

2026-11-02 작업 중 최초 타깃 실행 `npm test -- --run src/features/VerificationStagePanel.test.tsx src/domain/verify.test.ts`: **BLOCKED** (`vitest` 미설치, 의존성 설치 진행 중). 이 기록은 후속 실행이 성공하더라도 최초 시도의 사실이다.

의존성 설치 이후 같은 명령 재실행: **PASS**, 2개 파일 23개 테스트, SKIP 0. 이 테스트들은 공개 RPC 성공 측정이 아니다.
