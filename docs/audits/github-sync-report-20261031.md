# GitHub 문서 동기화 기록 — 2026-10-31

> **상태:** 리뷰와 main 병합 전 · **기준 main:** `f6ad522513dcb198d520c70f98c1cc5e98748f51`

문서 전용 브랜치 `a/mentoring-docs-format-20261031`에서 작업합니다. [main과 브랜치 비교](https://github.com/jujinho03/verimod/compare/main...a/mentoring-docs-format-20261031?expand=1)를 통해 현재 파일과 커밋을 확인할 수 있습니다. 이 기록 작성 시점에 PR 생성과 main 병합은 완료되지 않았습니다. 팀장의 별도 승인 전에는 병합하지 않습니다.

기준 main CI는 [41178415036](https://github.com/jujinho03/verimod/actions/runs/41178415036)의 Frontend·Backend·Contracts 성공입니다. 기준 W4 tree는 `1911f46c9e19000d25a7ffb5f86f1c2ba781a1ee`입니다. 기준 main CI는 문서 브랜치 CI나 병합 후 CI가 아닙니다.

최종 문서 브랜치 commit SHA, 파일 목록 및 변경 수는 위 비교 화면과 `git diff --name-status origin/main...HEAD`가 기준입니다. Git commit은 자신의 SHA를 내용에 포함할 수 없으므로, 이 파일이 포함된 최종 SHA를 미리 단정하지 않습니다. 실제 PR URL과 최신 브랜치 CI는 생성 후 GitHub에서 확인해야 합니다.

| 검증 항목 | 기록 작성 시점 |
| --- | --- |
| 원본 작업 트리 및 개인 자료 | 기존 작업 트리와 분리된 문서 worktree에서 작업; 원본을 재작성하지 않음 |
| Markdown 전수 인벤토리 | [문서 감사표](repository-doc-audit-20261031.md); 구조 검사는 의미 검증과 별도 |
| 상대 링크·외부 링크 | 자동 검사와 잔여 확인은 감사표 참조; 외부 403·429는 미확인 |
| 역사적 증거·W4 | 원본 증거 보존; 문서 안내 변경과 구분 |
| main 동기화 | PR 병합 전이므로 **미완료** |
| 독립 리뷰 및 main 병합 | **대기**; 팀장의 별도 병합 승인 필요 |

## 로컬 회귀 결과

`node scripts/check-all.mjs`가 격리 worktree에서 종료 코드 0으로 완료됐습니다. Frontend 단위 257개 통과, 브라우저 6개 통과, lint·build 통과; Backend 158개 통과·53개 SKIP, typecheck·build 통과; Contracts Hardhat 테스트 18개 통과·build 통과입니다. lint 경고 2개와 개발 의존성 audit 경고가 있었고, SKIP을 PASS에 포함하지 않았습니다. 이 Hardhat 단위 테스트는 W7 발표용 실제 LOCAL fallback 경로의 검증 완료를 뜻하지 않습니다.

이 결과는 문서 변경을 준비한 로컬 worktree에서 실행한 회귀이며 GitHub의 문서 브랜치 CI와 다릅니다. 현재 세션에서 다시 실행하지 않은 LIVE 데모를 성공으로 표시하지 않습니다. 원본 로컬 로그는 공개 문서에 포함하지 않았습니다.
