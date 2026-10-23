# [A → F] PR #29 통합 인계 — T PR #28 merge 이후

작성: A / 주진호(팀장) · 2026-10-23 · 수신: 노유신(F) · 참조: 설경민(T)

## 현재 상태 (2026-10-23 확인)

- main: `8d0580a7`. **T PR #28은 아직 main에 merge되지 않았다.** PR은 open·clean이고 head는 `f8cec268`, CI #241 SUCCESS다. 팀장 merge가 남아 있다.
- F PR #29: head `4ae0a12b`, CI #244 SUCCESS, **Draft 유지**. main merge는 승인되지 않았다.
- A: `jujinho` 브랜치를 push했다. A Draft PR은 main에 merge하지 않는다.

## T merge 이후 F가 할 일

1. **새 main SHA 반영:** T merge로 생긴 새 main SHA를 `nohyusin`에 **일반 merge**로 가져온다. rebase나 force push는 하지 않는다. 새 main SHA는 merge 직후 이 문서와 PR #29 코멘트로 공유한다.
2. **T의 `issuer_seq` 검사 보존:** `frontend/src/domain/verify.ts`의 `transitionProblem`에 T가 추가한 단조 증가 검사와 `verify.test.ts`의 W5 테스트 2건(역순·중복 거부, RPC 장애 시 lifecycle `NOT_CHECKED`)을 유지해야 한다. F도 같은 두 파일을 수정했다. 사전 계산(`git merge-tree`)에서는 충돌이 없었지만, 실제 merge 결과에서 두 변경이 **모두 남아 있는지** 확인한다.
3. **브라우저 assertion 수정:** `4ae0a12b`에서 Manifest 의미가 바뀌었다. 원문 문서가 없으면 이제 PASSED가 아니라 `NOT_CHECKED`다. 이전 문구·상태를 기대하는 브라우저 assertion을 새 의미에 맞게 수정한다. 테스트를 통과시키려고 PASSED를 되살리지 않는다.
4. **통합 테스트 재실행 (새 merge SHA 기준):**
   - frontend 단위 테스트, build, lint, typecheck
   - backend 테스트
   - 브라우저 desktop/mobile 회귀
   - 이전 245 PASS·24 PASS는 `bfcaf54` 기준이므로 새 SHA 결과로 대체할 수 없다
   - LIVE RPC 항목은 실제로 실행했는지 SKIP인지 구분해서 기록한다
5. **결과 공유:** 위 결과와 SHA, GitHub CI 링크를 PR #29에 남긴다. 그 다음 T 리뷰를 받는다. Draft 해제와 main merge는 팀장이 별도로 결정한다.

## 포함하면 안 되는 것 — Windows Backend SQLite 패치

T의 Windows 대응 수정(`DatabaseSync(absolutePath)` 방식)은 **보안 보류** 상태다. 이 패치를 PR #29나 어떤 main 통합에도 포함하지 않는다. 기존 Backend DB 열기 구현을 이 방식으로 바꾸지 않는다. 사유와 필수 부정 검증은 [SEC-W5-01](../security/sec-w5-windows-sqlite-reopen-hold.md)에 있다.

## 그대로 유지하는 것

이월 결정 D-W5F-20261022-01을 유지한다. W4 증거와 TEST SEALED도 그대로다. S1은 PENDING_APPROVAL이며 이번 통합에 정책 변경은 없다.

## 2026-10-23 후속 진행 (F `85a72a75`)

- F가 브라우저 assertion을 Manifest `NOT_CHECKED` 의미에 맞게 고쳤다(`frontend/e2e/w5.spec.ts`). 새 실행 결과는 Git 제외 경로 `private-data/w5-final-browser/`에 저장한다.
- F 자체 기록: frontend 246/246, backend 203/203, build·lint·typecheck PASS.
- **Desktop/Mobile 브라우저는 BLOCKED**(실행 환경에서 브라우저가 실행되지 않음). 수정된 assertion은 아직 한 번도 통과한 적이 없다. LIVE RPC는 6 SKIP이다.
- T PR #28은 여전히 main에 merge되지 않았다. 독립 리뷰어로 `ysn-0215`에게 리뷰를 요청했다(2026-10-23). 위 1~5단계는 T merge 이후에 진행한다.
- Windows SQLite 보류 내용은 [SEC-W5-01](../security/sec-w5-windows-sqlite-reopen-hold.md)로 옮겼다.

## 2026-10-24 — T PR #28 merge 완료: F가 반영할 main

- **새 main SHA: `639030b349e66a92c453e2e6936ba43ad165e8d7`** (Merge commit. 부모 `8d0580a7` + T `cd5b1c53`). merge 전에 `ysn-0215`가 `cd5b1c53`에 APPROVED했고, CI #250/#251이 SUCCESS였다.
- T의 마지막 수정 `cd5b1c53`: `transitionProblem`에 선택 인자 `hashes`가 추가됐다. receipt UUID가 같은데 hash가 다르면 거부하고, 직접 연결 여부는 검증된 hash로 판정한다. F가 main을 merge할 때 **이 hash 기반 검사와 W5 테스트를 모두 유지해야 한다.**
- 사전 계산 결과 `nohyusin`(`85a72a75`)과 새 main 사이에 충돌은 없다(`git merge-tree`). 실제 merge 결과와 테스트로 다시 확인한다.

**F 실행 순서 (위 1~5단계 구체화):**
1. `git fetch origin` → `nohyusin`에서 `git merge origin/main`(일반 merge. rebase·force 금지) → push
2. 유지 확인: T `issuer_seq`·UUID/hash 검사, F Manifest `NOT_CHECKED` 의미, Private Package 계약, legacy storage의 명시적 정리 방식
3. frontend 전체(unit·build·lint·typecheck), backend 전체 회귀
4. W5 desktop/mobile 브라우저 회귀를 실제 실행한다. 실행 환경 문제로 BLOCKED이면 그대로 기록한다. **LIVE RPC SKIP은 PASS가 아니다.**
5. 새 F SHA의 GitHub CI SUCCESS를 확인하고, 결과를 PR #29에 남긴다
6. Draft를 해제하고 독립 리뷰를 요청한다(T `k0ng-min`, 필요하면 A). main merge는 팀장이 따로 승인한다
