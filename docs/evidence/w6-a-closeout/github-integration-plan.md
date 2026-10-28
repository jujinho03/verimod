# W6 GitHub 통합 계획

작성: A / 주진호 · 2026-10-27 KST · **계획 문서. commit·push·PR·merge는 실행하지 않았다.** 각 단계는 팀장의 별도 명시 승인 후에만 실행한다.

## 1. 브랜치 현황 (2026-10-27 원격 조회)

| 브랜치 | SHA | main 대비 | 로컬 미반영 |
|---|---|---|---|
| main | `efce466d` | — | CI #267 SUCCESS |
| jujinho (A) | `44842f78` | +3 (W5 GATE-5 마감 문서: `a432d645`, `fc101b7e`, `44842f78`, 각 CI SUCCESS) | 아래 §2 A 파일 전부 미커밋 |
| seolkyeongmin (T) | `cd5b1c53` | +0 | T W6 결과 전부(T PC) |
| nohyusin (F) | `19be2b79` | +0 | F 로컬 커밋 `b72720d8`(GitHub 미존재)과 산출물 4개(F PC) |

## 2. 소유자별 변경 파일

### A (A PC에서 확인)

| 경로 | 상태 | 커밋 권고 |
|---|---|---|
| `docs/data-card.md`, `docs/model-card.md` | 신규 | 포함 |
| `docs/progress/W6.md` | 신규 | 포함 |
| `docs/evidence/w6-a-ai19-offline/` (`README.md`, `ai19-final-assessment.md`, `ai19_probe.py`, `run-offline-ai19.ps1`, JSON 6개) | 신규 | 포함 |
| `docs/evidence/w6-a-ai19-offline/server-*.log` 3개 | 신규, **`.gitignore`의 `*.log`로 제외됨** | 팀장 결정: (a) `git add -f`로 이 3개만 명시 추가(내용은 uvicorn 기동 4줄, 민감정보 없음) 또는 (b) 커밋하지 않고 SHA-256만 문서에 기록 |
| `docs/evidence/w6-a-closeout/` 7개 파일 | 신규 | 포함 |
| `docs/eval/w5-model-card-limitations.md` | 추적 파일 수정, **끝에 6줄 추가만**(기존 줄 변경 0) | **제외 권고**(`git restore`). 같은 내용이 `model-card.md` §A2에 있고, W5 문서(기준일 10/22)를 W5 시점으로 보존하는 편이 낫다. 자동 삭제하지 않았다 |

**절대 stage 금지(A 작업 트리의 미추적 보호·로컬 자료):** `docs/evidence/w4-a-acl-handoff/`, `w4-a-callback-status/`, `w4-a-host-preflight/`, `w4-a-operator-approvals/`, `w4-local-ops/`, `ai/artifacts/reports/w3_baseline/…`, `w3_baseline_run/…/progress.json`, `w4_a_revalidation/20261016-final-r01/`, `output/`, `private-data/`.

**stage 명령(승인 후, 실행 안 함):**

```sh
git add docs/data-card.md docs/model-card.md docs/progress/W6.md \
  docs/evidence/w6-a-ai19-offline/README.md docs/evidence/w6-a-ai19-offline/ai19-final-assessment.md \
  docs/evidence/w6-a-ai19-offline/ai19_probe.py docs/evidence/w6-a-ai19-offline/run-offline-ai19.ps1 \
  docs/evidence/w6-a-ai19-offline/*.json docs/evidence/w6-a-closeout/
git diff --cached --name-only   # 위 목록 외 파일이 없는지 확인
```

`git add -A`, `git add .`, `git reset --hard`, `git clean -fd`는 쓰지 않는다.

### T, F

원본이 A PC에 없으므로 파일 목록은 [최종 실행 요청](tf-final-execution-requests.md)에 따라 각자 제출한다. A는 push된 뒤에만 diff를 검토한다. `b72720d`의 내용은 보지 못했으므로 평가하지 않았다.

## 3. 사전 검사 (A 파일, 2026-10-27 실행)

| 검사 | 결과 |
|---|---|
| 상대경로 링크 | 깨짐 0 (스크립트 실행) |
| 민감정보 패턴(개인 경로, 이메일, 사설 IP, 키 문자열) | 검출 0 |
| W4 보호 범위 diff (`ba8b7bc`→HEAD, 작업 트리) | 0 |
| frontend·backend 코드 변경 | 0 (main과 diff 0) |
| AI-19 결과 JSON·로그·검증기 해시 | 실행 이후 불변 |
| CI 영향 | A 변경은 문서·증거·독립 스크립트뿐. CI(`ci.yml`)는 frontend/backend 등 npm 패키지를 검사하므로 A PR로 결과가 바뀔 코드가 없다. **CI PASS는 실제 실행 결과로만 기록한다** |

## 4. 권장 PR 순서

| 순서 | PR | 내용 | 독립 리뷰어 | merge 조건 |
|---|---|---|---|---|
| 1 | F → main | `w6.spec.ts`, W6 F 증거, (있다면) RPC 조회 수정 | **T** | T APPROVED, head SHA 고정, PR CI SUCCESS |
| 2 | T → main | W6-T 증거, SEC-W5-01 테스트(있다면) | **F** 또는 A | 리뷰 APPROVED, CI SUCCESS |
| 3 | A → main | §2 A 파일 + 기존 +3 커밋. T/F 결과 반영 후 상태 갱신 | **T** 또는 F | 리뷰 APPROVED, CI SUCCESS |

A를 마지막에 두는 이유: A 문서가 T/F의 최종 결과를 인용하므로, T/F merge 후 상태를 맞춰서 한 번만 올리면 된다. 일정이 급하면 A PR을 먼저 올리고 마지막에 상태만 고치는 작은 PR을 추가할 수 있다.

## 5. merge 후 main 검증 조건

1. main 최신 SHA에서 GitHub Actions SUCCESS
2. 통합 SHA에서 핵심 E2E 재확인: body 변조 회귀(RPC 없음) 4/4, live receipt VALID 1회 이상, F 복구 시퀀스 1회
3. W4 보호 범위 diff 0 재확인
4. 결과를 `docs/progress/W6.md`에 SHA와 함께 기록

## 6. 필요한 팀장 승인 (각각 별도)

1. A 로컬 commit (파일 목록 확인 후)
2. `server-*.log` 3개 처리 방식, `w5-model-card-limitations.md` 6줄 제외 여부
3. A/T/F 각 브랜치 push
4. PR 3개 생성
5. 각 PR merge (리뷰 APPROVED 후)
