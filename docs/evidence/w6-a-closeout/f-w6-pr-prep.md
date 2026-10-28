# W6 F → main PR 준비 (A 통합 감사)

- 작성: A / 주진호 · 2026-10-28 KST(오전) · 작성 당시 상태: **PR 미생성, 병합 미실행** (A 별도 승인 대기)
- 후속: 같은 날 F가 [PR #31](https://github.com/jujinho03/verimod/pull/31)을 열었다(05:59Z). 이후 상태는 [merge ledger](w6-merge-ledger.md)를 따른다. 아래 본문은 작성 당시 기록이므로 고치지 않았다.
- 감사 방식: `git fetch` 후 원격 ref·GitHub 공개 API 읽기 전용 조회. 코드 실행·수정·commit·push 없음.

## 1. 실제 SHA (2026-10-28 fetch)

| ref | SHA | main 대비 |
|---|---|---|
| origin/main | `efce466df24c916fb2be1bf075176137fd4c4332` | — (PR #30 merge commit) |
| origin/nohyusin (F) | `1620f82c6cf523d7796273f7f816ed022e50953f` | 4 ahead / 0 behind, fast-forward 가능 |
| origin/jujinho (A) | `44842f78fdc8102507b9f3aeeed5d0eda8e9eeaf` | 3 ahead / 0 behind (W5 closeout 문서 3커밋, main 미반영) |
| origin/seolkyeongmin (T) | `cd5b1c536c3876446b0fd8e43d2faf1060785e61` | 0 ahead / 29 behind |

T 보고 HEAD `1620f82c…`와 실제 F HEAD는 **일치**한다.

## 2. 승인 근거의 출처 구분

| 항목 | 판정 | 근거 |
|---|---|---|
| T APPROVED (HEAD `1620f82c`) | **USER_REPORTED_APPROVAL** | 저장소 4개 ref, 로컬 작업트리, GitHub commit comment 어디에도 `1620f82c`를 지목한 T 승인 원본이 없다. 팀장 전달 내용만 있다. |
| F 리뷰 패킷 | 범위 불일치 주의 | `docs/handoffs/W6-F-independent-review-b72720d.md`는 첫 커밋 `50f2061b`만 대상으로 한다. `dc9cbae2`·`5bcfe0a2`·`1620f82c`는 패킷 밖이다. |
| GitHub Actions #40624104922 | **VERIFIED** | `VeriMod P0 checks`, event push, head_sha `1620f82c…`, branch nohyusin, attempt 1, conclusion success (02:59:33Z~03:00:17Z). 같은 SHA의 다른 실행은 없다. |

## 3. 커밋과 변경 파일

| 커밋 | 메시지 | 파일 |
|---|---|---|
| `50f2061b` | test(f): add W6 live RPC recovery evidence | 8 |
| `dc9cbae2` | test(f): instrument W6 RPC recovery on desktop and mobile | 7 |
| `5bcfe0a2` | docs(f): prepare W6 independent RPC review packet | 2 (CI #40562207299 **failure**: frontend `test:browser`) |
| `1620f82c` | fix(f): isolate manual W6 RPC recovery from CI | 1 (`playwright.config.ts` testIgnore에 `w6-rpc-recovery.spec.ts` 추가) |

작성자·커미터는 모두 `ysn-0215@users.noreply.github.com`이다.

누적 변경은 12개 파일, +676 / −3이다.

| 상태 | 파일 | 분류 |
|---|---|---|
| A | `docs/evidence/w6-f/20261027/README.md` | W6 evidence |
| A | `docs/evidence/w6-f/20261027/validation.json` | W6 evidence |
| A | `docs/evidence/w6-f/20261027/rpc-recovery-review.json` | W6 evidence |
| A | `docs/handoffs/W6-F-independent-review-b72720d.md` | 리뷰 패킷 |
| A | `docs/progress/W6-F.md` | 진행 기록 |
| A | `frontend/e2e/w6.spec.ts` | 수동 live RPC 테스트 |
| A | `frontend/e2e/w6-rpc-recovery.spec.ts` | 수동 live RPC 복구 계측 |
| A | `frontend/playwright.w6.config.ts` | 전용 config (port 4186) |
| A | `frontend/playwright.w6-recovery.config.ts` | 전용 config (port 4187, desktop + mobile-emulation) |
| M | `frontend/playwright.config.ts` | CI isolation (testIgnore 3개) |
| M | `frontend/package.json` | `w6:browser`, `w6:rpc-recovery` 스크립트 2줄 |
| M | `frontend/tsconfig.w5-tools.json` | 새 spec·config를 w5 tools typecheck에 포함 |

승인 범위는 W6 evidence, RPC recovery tests, CI isolation 세 가지이며, 12개 파일 전부가 이 범위 안에 있다.

## 4. 보안·무결성 감사

| 검사 | 결과 |
|---|---|
| W4 공개 증거 `docs/handoffs/w4-anchored-epoch-public/20261020-r01` | tree `1911f46c…` main=F, F 문서의 기록값과 일치 |
| W4 기타 tree (`w4-anchored-epoch-public`, `w4-frozen-epoch-public`, `docs/evidence/w4-f-*` 4개, `w4-mentor-docs-update`) | 전부 main=F |
| `ai/artifacts/manifests` (R01 Manifest 포함) | main=F |
| 제품 코드 `frontend/src`, `backend/src` | tree main=F, 변경 0 |
| RPC 최적화 혼입 | 없음. diff에 `rpcLedger`, session, cache, window 확대 관련 추가 줄이 0건이다. 최적화는 리뷰 패킷 §4에 분석 문장으로만 있다. 원격에도 최적화 브랜치가 없어 F 로컬 브랜치로 추정되며, 이 PR과 무관하다. |
| 비밀정보 스캔 (추가 줄 전체) | private key PEM, GitHub/AWS/HF token, Windows 사용자 절대경로, 개인 이메일, 사설 IP 모두 0건. `salt`·`secret`이 나오는 줄은 "포함하지 않는다"는 부정 서술뿐이다. |
| 공개 주소 | contract `0xd17ba590…`, publisher `0xd47675be…`는 main의 `approvedProfiles.ts`, `playwright.w5.config.ts`에 이미 있는 공개값이다. |
| 증거 원본 출력 경로 | `private-data/` 아래이며 `.gitignore:8`로 제외된다. |
| spec 동작 | W4 bundle은 `readFileSync`로 읽기만 한다. 변조는 `structuredClone` 사본에서만 한다. tx 송신 코드가 없다. 장애 주입은 Playwright `route.abort`이며 물리 네트워크 차단이 아니다(문서에도 명시). |
| 판정 과장 | 없음. INVALID_PROOF는 BLOCKED, Mobile 실기기는 NOT_EXECUTED, BASE 10회는 NOT_MET, 공동 재실측은 BLOCKED_ENVIRONMENT로 기록되어 있다. RPC가 계속 불가한 경우 `test.skip`으로 BLOCKED를 남기며 PASS로 처리하지 않는다. |
| A 자산과의 충돌 | `jujinho` × F merge-tree 충돌 0건, 겹치는 파일 0개. A 미커밋 파일과 겹치는 파일 0개. |

### 비차단 관찰

1. CI는 frontend `typecheck`를 실행하지 않는다(backend만 실행). 또 `tsconfig.w5-tools.json`(`npm run w5:typecheck`)도 CI에 없다. 새 spec 2개의 타입 검사는 F의 로컬 주장만 있다. 그래서 병합 전 조건 P-4로 둔다.
2. `w6.spec.ts`, `w6-rpc-recovery.spec.ts`는 CI에서 제외되며 수동으로만 실행한다. 이 PR의 CI SUCCESS는 W6 live RPC 테스트의 PASS를 뜻하지 않는다.
3. F 문서의 E4는 BLOCKED이고 A 매트릭스의 E4는 PARTIAL이다. A 판정 기준은 PARTIAL로 유지한다(§8).

## 5. PR 초안

- base: `main`
- head: `nohyusin` @ `1620f82c6cf523d7796273f7f816ed022e50953f`
- 제목: `[W6][F] Live RPC recovery evidence, manual recovery instrumentation and CI isolation`

본문(복사용):

```markdown
## 요약
W6 F의 실제 공개 RPC 장애·복구 증거와 수동 계측 도구를 추가하고, 기본 CI에서 live RPC spec을 분리합니다.
제품 코드(frontend/src, backend/src)와 W4 공개 증거는 변경하지 않습니다.

- head: `1620f82c6cf523d7796273f7f816ed022e50953f` (main `efce466d` 대비 4 ahead / 0 behind)
- 변경: 12 files, +676 / −3

## 포함
- W6 evidence: `docs/evidence/w6-f/20261027/` (README, validation.json, rpc-recovery-review.json), `docs/progress/W6-F.md`, 리뷰 패킷
- 수동 live RPC 테스트: `e2e/w6.spec.ts`, `e2e/w6-rpc-recovery.spec.ts` + 전용 config 2개, npm script `w6:browser`, `w6:rpc-recovery`
- CI isolation: `playwright.config.ts` testIgnore에 `w5.spec.ts`, `w6.spec.ts`, `w6-rpc-recovery.spec.ts`

## 제외
- RPC 조회량 최적화(eth_chainId 세션화, log window 확대, epoch 캐시): 별도 미승인 브랜치이며 이 PR에 코드가 없습니다.

## 관측 결과 (과장 금지 범위)
- Desktop Chromium 1회: 동일 W4 bundle(SHA-256 `0b73aa52…f52235`) `VALID → RPC_UNAVAILABLE → VALID`
- 장애 주입: Playwright route abort이며 물리 네트워크 차단이 아님
- body 변경 시 `HASH_MISMATCH` 관측
- 재해시 후 `INVALID_PROOF`: BLOCKED (공개 RPC 불가). PASS 아님
- 반복 안정성 PARTIAL, BASE 10회 NOT_MET, LOCAL 3회 NOT_EXECUTED
- Mobile: emulation 공동 재실측 BLOCKED_ENVIRONMENT, 실기기 NOT_EXECUTED

## 테스트 증빙
- GitHub Actions #40624104922 (`VeriMod P0 checks`, head `1620f82c`): frontend / backend / contracts SUCCESS
  - 직전 `5bcfe0a2`의 #40562207299는 frontend `test:browser` 실패 → 1620f82c에서 live spec을 CI에서 제외해 해결
- F 로컬 기록: Frontend unit 250 PASS, build/typecheck/lint PASS(기존 warning 2), Backend 153 PASS / 53 SKIP(Windows callback UNSUPPORTED) / 0 FAIL
- 주의: W6 live spec은 CI에서 실행되지 않습니다. CI SUCCESS ≠ W6 live RPC PASS

## 무결성
- W4 공개 증거 tree `20261020-r01` = `1911f46c…` (main과 동일), W4 경로 diff 0
- R01 Manifest 디렉터리, frontend/src, backend/src tree 불변
- 비밀정보·절대경로·개인 이메일 0건, 증거 원본은 gitignored `private-data/`
- tx 송신, LOCK, TEST 접근, 정책 로딩 없음

## 리뷰
- 독립 리뷰어: T / 설경민. **이 PR의 head SHA `1620f82c`에 대해** GitHub Review(Approve)를 기록해야 병합합니다.
- 병합 방식: merge commit (rebase/squash 금지 — 리뷰 SHA와 CI SHA가 이력에 남아야 함)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## 6. T 독립 리뷰 조건 (병합 차단 조건)

1. PR 생성 뒤 T가 GitHub PR Review로 **Approve**를 남긴다. 리뷰 대상 commit이 `1620f82c6cf523d7796273f7f816ed022e50953f`여야 한다. 메신저 승인이나 사용자 전달 승인(USER_REPORTED_APPROVAL)은 E4 증거로 쓰지 않는다.
2. 리뷰 범위에 F 패킷 밖 커밋 3개(`dc9cbae2`, `5bcfe0a2`, `1620f82c`)를 포함한다. 특히 `w6-rpc-recovery.spec.ts`와 testIgnore 변경을 본다.
3. 리뷰 뒤 head가 바뀌면(추가 push) 승인을 무효로 하고, 새 SHA로 CI와 T 리뷰를 다시 받는다.

## 7. 병합 전 필수 조건

| # | 조건 | 현재 |
|---|---|---|
| P-1 | A가 PR 생성 승인 | 대기 |
| P-2 | PR head = `1620f82c`, base = main `efce466d` (main이 움직였으면 재감사) | 충족 (2026-10-28 fetch) |
| P-3 | PR 화면의 CI check가 head `1620f82c`에서 SUCCESS | #40624104922로 충족, PR 생성 후 PR check로 재확인 |
| P-4 | `npm run w5:typecheck` PASS 증빙 (CI 미포함 항목). T 리뷰 또는 F 로그로 확보 | 미확보 |
| P-5 | T GitHub Review Approve on `1620f82c` | 미확보 |
| P-6 | 변경 파일이 12개 그대로이고 RPC 최적화 코드가 없음 | 충족 |
| P-7 | A가 병합 승인, 병합 방식은 merge commit | 대기 |

## 8. 병합 후 검증 체크리스트

새 main SHA를 `M2`라 한다.

1. `git fetch`를 하고 `M2`의 parent에 `efce466d`와 `1620f82c`가 모두 있는지 확인한다.
2. main push로 실행된 `VeriMod P0 checks`가 `M2`에서 frontend / backend / contracts 3개 job 모두 SUCCESS인지 확인한다. 실행 ID를 기록한다.
3. Core E2E는 CI 기본 `npm run test:browser`의 protocol browser 1/1(ReceiptBody matrix 20/20)이다. CI 로그에서 `w6*.spec.ts`가 실행되지 않았는지도 확인한다.
4. 회귀 수치가 F 기록과 같은지 대조한다: Frontend unit 250, Backend 153 PASS / 53 SKIP / 0 FAIL. SKIP을 PASS로 세지 않는다.
5. 무결성 재확인: `git rev-parse M2:docs/handoffs/w4-anchored-epoch-public/20261020-r01` = `1911f46c…`. `ai/artifacts/manifests`, `frontend/src`, `backend/src` tree가 병합 전과 같아야 한다.
6. 수동 live RPC(`npm run w6:rpc-recovery`)는 병합 게이트가 아니다. 실행한다면 공개 RPC 상태를 같이 기록하고, 결과는 E3 증거로만 쓴다.
7. A 브랜치 `jujinho`는 main보다 W5 3커밋 앞서고 F 병합 후에는 4커밋 뒤처진다. 이후 A 통합은 merge로만 하고 rebase나 force push는 하지 않는다. 충돌이 0건임은 사전 확인했다.

## 9. E4 상태

E4는 **PARTIAL을 유지**한다. PASS로 바꾸는 조건은 P-5(T의 SHA 고정 GitHub 리뷰), main 병합, §8의 2~5 완료를 모두 충족하는 것이다. 이 중 하나라도 미확보면 PARTIAL이다. 현재 유일하게 검증된 것은 F SHA의 CI SUCCESS다.
