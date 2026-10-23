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

T의 Windows 대응 수정(`DatabaseSync(absolutePath)` 방식)은 **보안 보류** 상태다. 이 패치를 PR #29나 어떤 main 통합에도 포함하지 않는다. 기존 Backend DB 열기 구현을 이 방식으로 바꾸지 않는다. 사유는 [W5 A 마감 감사 §8](../progress/W5-A-closeout.md)에 있다.

## 그대로 유지하는 것

이월 결정 D-W5F-20261022-01을 유지한다. W4 증거와 TEST SEALED도 그대로다. S1은 PENDING_APPROVAL이며 이번 통합에 정책 변경은 없다.
