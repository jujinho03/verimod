# W6 Merge Ledger

- 기록자: A / 주진호 (통합 관리)
- 이 판의 작성 시점: **2026-10-28 17:48 KST**. 이때 W6 PR은 하나도 병합되지 않았다.
- 원칙: 이 문서는 확인한 사실만 적는다. 병합이 일어나면 그 시각과 SHA를 **새 줄로 추가**하고, 이미 적힌 줄을 소급해 고치지 않는다. 확인하지 않은 값은 `—`로 둔다.
- 조회 방법: `git fetch origin`, GitHub 공개 REST API(`/pulls/31`, `/pulls/31/reviews`, `/commits/<sha>/check-runs`, `/actions/runs`). 이 PC에는 `gh` CLI가 없다.

## 1. PR별 상태 (2026-10-28 17:48 KST 기준)

| 항목 | F | T | A |
|---|---|---|---|
| PR | [#31](https://github.com/jujinho03/verimod/pull/31) open, mergeable `clean` | **없음** | **없음** (이 문서가 포함된 커밋을 push한 뒤 생성 예정) |
| head 브랜치 | `nohyusin` | `t-w6-evidence-main` | `jujinho` |
| HEAD SHA | `1620f82c6cf523d7796273f7f816ed022e50953f` | `6b53abe37897e71893b08159eb752a931f0b2724` | 이 문서를 포함한 `jujinho` 커밋(PR 화면의 head로 확인) |
| base | main `efce466d` | main `efce466d`(merge-base) | main `efce466d`(merge-base) |
| 범위 | 4커밋, 12파일, +676/−3 | 1커밋, 4파일(T 문서), +140 | W5 마감 3커밋 + W6 1커밋(A 문서) |
| 요청 리뷰어 | 지정 없음 | — | T 또는 F |
| GitHub 리뷰 | **0건** | — | — |
| 승인 SHA | — (T의 APPROVED는 T 브랜치 문서 `w6-t-review-nohyusin-1620f82-20261028.md`에만 있다) | — | — |
| CI Run | push #272 (`40624104922`) SUCCESS, pull_request #273 (`40641167359`) SUCCESS. frontend·backend·contracts 모두 success | 해당 SHA의 실행 없음 | — |
| 추가 조건 | `w5:typecheck`: F 결과는 전달되지 않음(PR 본문은 "Typecheck: PASS"만 있고 명령이 없다). A가 직접 실행한 결과는 PASS(§3) | — | — |
| Merge SHA | — | — | — |
| merge 후 main CI | — | — | — |
| 차단 사유 | **head SHA에 대한 GitHub APPROVED 없음** | PR 미생성, 독립 리뷰 없음, F 병합 이후 새 main 기준 CI 필요 | PR 미생성, 독립 리뷰 없음, 앞선 두 PR 병합 이후 진행 |

## 2. 병합 순서와 중단 규칙

1. F #31 → 2. T → 3. A 순서로 병합한다. 각 PR은 merge commit 방식으로 병합하고, rebase나 squash는 쓰지 않는다.
2. 각 PR은 세 조건을 모두 충족해야 병합한다. ① 현재 head SHA에 대해 작성자가 아닌 담당자의 GitHub APPROVED가 있을 것 ② 그 head의 CI가 SUCCESS일 것 ③ 충돌이 없을 것.
3. 병합 뒤 main CI가 실패하면 다음 PR 병합을 중단한다.
4. 앞 PR이 병합되어 main이 움직이면, 뒤 PR은 새 main 기준으로 mergeability와 CI를 다시 확인한다. T와 A 브랜치는 F와 겹치는 파일이 0개이고 `git merge-tree` 결과도 충돌 0건이다.

## 3. A가 독립적으로 확인한 사실 (병합 조건을 대신하지 않음)

| 확인 | 결과 |
|---|---|
| PR #31 head가 T 문서의 리뷰 SHA와 같은가 | 같다 (`1620f82c`) |
| 승인 범위 밖 코드가 섞였는가 | 아니다. `frontend/src`, `backend/src` tree가 main과 같다. RPC 최적화 코드가 없다 |
| W4 공개 증거 | `docs/handoffs/w4-anchored-epoch-public/20261020-r01` tree `1911f46c`가 main·F·T에서 같다 |
| `npm run w5:typecheck` @ `1620f82c` | A가 별도 worktree에서 실행해 **PASS**(exit 0). app `tsc -b` PASS, lint PASS(기존 경고 2건). F 본인 결과를 대신하지 않는다. worktree는 실행 후 삭제했다 |

## 3-1. 추가 기록 (2026-10-28 17:54 KST, push 이후)

- A W6 커밋 `b2f0d9e5b4f802be7630cdf90abd56988fa1095a`를 `jujinho`에 일반 push했다(`44842f7..b2f0d9e`, fast-forward, force 없음).
- push CI #275(`40660013846`)가 frontend·backend·contracts 모두 SUCCESS였다.
- 이 기록을 담은 후속 커밋이 A PR의 최종 head가 된다. PR 화면의 head SHA를 기준으로 리뷰한다.
- 같은 시각 PR #31 GitHub 리뷰는 여전히 0건이고, T PR은 여전히 없다.

## 4. 병합 기록 (병합이 일어날 때 추가)

| 시각 (KST) | PR | 승인자 / 승인 SHA | 병합자 | Merge SHA | main CI Run | 결과 |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | 2026-10-28 17:48 KST 현재 병합 0건 |
