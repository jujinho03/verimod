# W6 3인 GitHub 통합 감사

- 감사자: A / 주진호
- 감사 시점: 2026-10-28 17:48 KST. 어떤 W6 PR도 병합되기 전이다.
- 방법: `git fetch origin` 후 원격 ref 조회, GitHub 공개 REST API, A가 별도 worktree에서 직접 실행한 검사. 제품 코드는 수정하지 않았다.
- 이전 판: [3인 통합 감사(10/27)](w6-three-owner-integration.md). 그때는 T/F 증거가 원격에 없었다(LOCAL_REPORTED). 이 문서는 그 이후 원격에 올라온 내용을 감사한다.

## 1. 원격 SHA

| ref | SHA | main 대비 (ahead / behind) | 비고 |
|---|---|---|---|
| main | `efce466df24c916fb2be1bf075176137fd4c4332` | — | PR #30 merge, CI #267 SUCCESS |
| nohyusin (F) | `1620f82c6cf523d7796273f7f816ed022e50953f` | 4 / 0 | PR #31 |
| t-w6-evidence-main (T) | `6b53abe37897e71893b08159eb752a931f0b2724` | 1 / 0 | PR 없음 |
| jujinho (A) | `44842f78fdc8102507b9f3aeeed5d0eda8e9eeaf` → 이번 W6 커밋 push 예정 | 3 / 0 (push 전) | W5 마감 문서 3커밋이 main에 없음 |
| seolkyeongmin (T, W5) | `cd5b1c53` | 0 / 29 | W5까지 main에 포함 |

세 브랜치는 서로 겹치는 파일이 0개다. `git merge-tree`로 F×T, F×A, T×A를 확인한 결과도 모두 충돌 0건이다.

## 2. F — PR #31

| 검사 | 결과 | 분류 |
|---|---|---|
| head | `1620f82c`. T 리뷰 문서의 SHA와 같다 | VERIFIED_REMOTE |
| 범위 | 12파일. W6 evidence 3, 진행 기록 1, 리뷰 패킷 1, 수동 live spec 2, 전용 config 2, `playwright.config.ts` testIgnore, `package.json` script 2줄, `tsconfig.w5-tools.json` | VERIFIED_REMOTE |
| 제품 코드 | `frontend/src`, `backend/src` tree가 main과 같다 | VERIFIED_REMOTE |
| RPC 최적화 | 코드가 없다. 리뷰 패킷 §4에 분석 문장으로만 있다 | VERIFIED_REMOTE |
| W4 증거 | `20261020-r01` tree `1911f46c` 불변. W4 경로 diff 0 | VERIFIED_REMOTE |
| 비밀정보 | 키, 토큰, 절대경로, 개인 이메일 0건. 작성자는 noreply 주소. contract·publisher 주소는 main에 이미 있는 공개값 | VERIFIED_REMOTE |
| CI | push #272, pull_request #273 모두 SUCCESS(3 job). 직전 `5bcfe0a2`는 #271(`40562207299`) frontend `test:browser` 실패 → `1620f82c`에서 live spec을 CI에서 제외해 해결 | VERIFIED_REMOTE |
| CI가 검증하지 않는 것 | frontend typecheck, `w5:typecheck`, `w6*.spec.ts`(live RPC). CI SUCCESS ≠ W6 live RPC PASS | VERIFIED_REMOTE |
| `w5:typecheck` | F 결과는 전달되지 않았다. A가 직접 실행하니 PASS | VERIFIED_A_LOCAL |
| GitHub 리뷰 | **0건** | VERIFIED_REMOTE |
| 판정 과장 | 없다. INVALID_PROOF(rehash)는 BLOCKED, Mobile 실기기는 NOT_EXECUTED, BASE 10회는 NOT_MET, 공동 재실측은 BLOCKED_ENVIRONMENT로 적혀 있다 | VERIFIED_REMOTE |

**결론: 병합 불가(BLOCKED).** 사유는 head SHA에 대한 GitHub APPROVED가 없다는 것이다. 다른 조건은 모두 충족했다.

## 3. T — `t-w6-evidence-main` `6b53abe3`

| 검사 | 결과 |
|---|---|
| 범위 | 1커밋, `docs/evidence/w6-t-*` 4파일만 있다. 다른 경로 변경 0 |
| 제품 코드·W4 | `frontend/src`, `backend/src`, W4 `1911f46c` 모두 main과 같다 |
| 작성자 | `k0ng-min` noreply 주소 |
| 실행 수치 | 62 / 111 / 44 tests PASS, W5 live Playwright 30/30. 모두 **T 로컬 실행 보고**이며 저장소에 원본 로그가 없다. A는 원본을 직접 검증하지 않았다 |
| 미완료 표기 | SEC-W5-01은 PASS이고 Windows writable callback은 `UNSUPPORTED`. Mobile 복구 PARTIAL, physical mobile·실제 Hardhat LOCAL NOT_EXECUTED, BASE 10회 NOT_MET, rehash INVALID_PROOF live BLOCKED, RPC 최적화 리뷰 BLOCKED. 과장 없음 |
| 문서 결함 | `w6-t-integration-evidence-20261028.md`의 원본 문서 열이 `w6-w7-t-execution-receipt-20261027.md`를 가리킨다. 실제 파일명은 `w6-t-execution-receipt-20261027.md`다. 병합 전 수정을 권고한다 |
| F 리뷰 | `w6-t-review-nohyusin-1620f82-20261028.md`: APPROVED, 리뷰 SHA `1620f82c`, 비교 기준 `5bcfe0a2`. 이것은 저장소 문서이고 **GitHub PR 리뷰가 아니다** |
| PR | 없다. 병합에는 F 또는 A(작성자 외)의 GitHub 리뷰가 필요하다 |

## 4. A — W6 산출물

| 검사 | 결과 |
|---|---|
| 대상 | `docs/data-card.md`, `docs/model-card.md`, `docs/progress/W6.md`, `docs/evidence/w6-a-ai19-offline/`(9), `docs/evidence/w6-a-closeout/`(이 문서 포함) |
| 제외 | AI-19 서버 로그 3개(`*.log`, gitignore. 공개 승인 없음), `docs/eval/w5-model-card-limitations.md`의 6줄 추가(W5 역사 문서이므로 커밋도 복원도 하지 않음. diff는 해당 6줄뿐임을 확인), `docs/evidence/w4-a-*`·`w4-local-ops/`(보호 대상), `output/`, `ai/artifacts/reports/` 미추적 디렉터리, `private-data/`, 모델 가중치 |
| 민감정보 | 절대경로, 이메일, 토큰, 사설 IP 0건. 네트워크 어댑터는 일반 이름뿐이고 게이트웨이는 `REDACTED_GATEWAY`. probe 문장은 합성 문장이며 데이터셋 원문이 아니다 |
| 링크 | 상대 링크 대상이 main·A·T·F 원격 또는 A 커밋에 있는지 검사했다. 깨진 링크 0 |
| 수치 | Data Card·Model Card 값이 main의 `metrics.json`, `epoch_log.json`, R01 Manifest, `threshold-rationale.md`와 일치 |
| 상태 경계 | S1 PENDING_APPROVAL, A4 PROPOSED/NOT_IMPLEMENTED/CONDITIONAL, LOCK/TEST BLOCKED·SEALED, DOC-09 PARTIAL, OPS-04 NOT_VERIFIED, 리허설 NOT_STARTED를 그대로 둔다 |
| W5 이력 | `jujinho`의 W5 마감 3커밋(`a432d64`, `fc101b7`, `44842f7`, 문서 3개)은 main에 없다. 이력을 다시 쓰지 않고 A PR에 포함하며, 그 사실을 PR 본문에 밝힌다 |

## 5. 보호 대상

| 대상 | 상태 |
|---|---|
| W4 공개 Anchor `20261020-r01` | `1911f46c` (main·F·T 동일) |
| `docs/evidence/w4-a-acl-handoff/`, `w4-a-callback-status/`, `w4-a-host-preflight/`, `w4-a-operator-approvals/`, `w4-local-ops/` | 미추적 상태 유지. 열람·stage하지 않음 |
| `output/`, `private-data/`, `ai/artifacts/reports/` 미추적 디렉터리, 모델 checkpoint | stage하지 않음 |
| `verimod-f-w4-*` worktree 4개 | 건드리지 않음 |
| `verimod-local-data/` (TEST 봉인) | 접근하지 않음 |
