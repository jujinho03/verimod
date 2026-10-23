# W5 A 마감 감사 — 티켓별 증거, GATE-5 예상, AI-12 승인 체크리스트

기준일: 2026-10-22 KST · Owner: A / 주진호 · 로컬 브랜치 `jujinho` · 감사 시작 HEAD `25241b1` · 원격 main `8d0580a`(모든 A 커밋은 아직 push 안 됨)

이 문서는 W5에서 A가 실제로 끝낸 것과 남은 것을 Git 증거로 정리한 것이다. **GATE-5 최종 판정은 10/25 21:00에 증거로 확정한다.** 아래 Gate 표는 예상과 위험이다.

## 1. A 티켓 최종 상태

| 티켓 | 산출물 | 테스트·결과 | 마지막 검증 SHA | 충족한 DoD | 승인 필요 | 타 담당 의존 |
|---|---|---|---|---|---|---|
| **AI-11** | [threshold-rationale](../eval/threshold-rationale.md), [정책 메모](../eval/w5-policy-decision-memo.md), [S1/S2/S3 승인 패키지](../eval/w5-research-policy-scenarios.md) | 25후보 원행 재계산 W4와 차이 0, 31,375회 조치 일치. 시나리오 테스트 9개 포함 181 passed | `aa85897`(원행), `1ba694d`(시나리오), `25241b1`(S1 초안) | 원행 검증, 25후보 비교, X/B 민감도, FRR trade-off, 결정 초안 | X/B·후보 승인, Manifest 확정, LOCK | F 정책 로딩 (W6 이월) |
| **AI-13** | [오류 분석](../eval/w5-validation-error-analysis.md), [Model Card 한계](../eval/w5-model-card-limitations.md) | 18개 테스트(181에 포함), 실제 비식별 사례 10건 | `aa85897`, 한계 문서 보강은 본 커밋 | 최대 10건 오제재 분석, offensive 한계, Epoch 2/3 한계 기록 | 없음 | 없음 |
| **AI-12 Guard** | [w5_execution_guard.py](../../ai/src/verimod_ai/evaluation/w5_execution_guard.py), [사전 등록](../eval/w5-evaluation-preregistration.md), [LOCK 사전점검](../eval/w5-lock-preflight-checklist.md), [binding 설계](../eval/w5-model-runtime-binding-design.md) | 43개 guard 테스트(181에 포함), `test-evaluate` 종료코드 3 | `8b711d6`, `1ba694d` | 합성 준비 범위 | LOCK, 최초 TEST | 정책 Manifest(F 의존) |
| **AI-12 TEST** | — | 미실행 | — | 없음 | 아래 §3 전부 | — |
| **DOC-09** | [멘토링 추적표](../mentoring/w5-mentoring-traceability.md) | 문서(링크 검사) | 본 커밋 | 1·3회차 원문 대조, 채택·미채택 구분 | 없음 | 2회차 원문 미확인, T/F 증거 |
| **DOC-08/13** | [발표안·Gate 근거](../eval/w5-gate5-presentation.md) | 문서 | 본 커밋 | 8분 480초 구조, 증거 7구분 갱신 | 최종 발표 승인 | 리허설(전원), F 화면(W6) |

테스트 숫자는 같은 테스트를 여러 번 센 결과이므로 합산하지 않는다(102/128/61/166/181). 최신 통합 결과는 [181 passed](../../ai/artifacts/reports/w5_research_scenarios/20261022T063640Z-841928ca/verification.json)이며, 이번 마감 커밋에서 다시 실행한 결과는 하단 §5에 기록한다.

## 2. GATE-5 예상 (10/22 기준, 최종 판정 아님)

| Gate | 담당 | 현재 증거 | 예상 | 근거·위험 |
|---|---|---|---|---|
| G5-01 | A | Validation 비교, S1 초안 | **PARTIAL** (승인이 오면) / **BLOCKED** (오지 않으면) | X/B·후보 승인이 와도 Manifest·LOCK은 F 정책 로딩에 의존하므로 W5 안에 끝나기 어렵다 |
| G5-02 | A | Guard 합성 PASS, TEST SEALED | **BLOCKED** | LOCK과 별도 TEST 승인이 없으면 PASS가 불가능하다. 마감을 이유로 TEST를 열지 않는다 |
| G5-03 | T/F | W4 14/14 역사 증거, A 측 4/4 해시 불변 대조 | **PASS 가능** | T의 TEST-05(공개 RPC 읽기 전용 재검증) 결과가 오면 보강된다. 신규 Anchor로 계산하지 않는다 |
| G5-04 | T/F | T가 RCPT-05 완료를 보고(원격 미반영) | **PARTIAL** | T 코드 PASS(SHA 확인 후)와 F UI 통합(W6 이월)을 따로 판정한다 |
| G5-05 | F | 없음 | **BLOCKED → W6** | FE-07·SEC-03은 이월됐다. 구현되지 않은 것은 PASS로 볼 수 없다 |
| G5-06 | T/F | `verify.ts`에 RPC_UNAVAILABLE 코드 존재, 실제 장애 실증 없음 | **PARTIAL** | T의 RPC 상태 검증과 F의 Browser UX를 분리한다. F 부분은 W6 |
| G5-07 | 전원 | A 로컬 181 passed, T 로컬 보고, main CI #237 = `8d0580a` | **PARTIAL** | A/T 신규 커밋은 원격 CI를 거치지 않았다. push 승인 전에는 CI PASS를 주장할 수 없다 |

**종합 예상: PARTIAL.** MUST가 미충족되므로 SHOULD=0, 신규 기능=0이다. W6 초반은 미완 MUST(F 이월분과 G5-01/02)부터 처리한다. Gate 규칙은 바꾸지 않는다.

## 3. AI-12 최초 TEST 평가 — 단일 승인 체크리스트

아래 항목이 **순서대로 모두** 충족돼야 TEST를 1회 열 수 있다. TEST 파일과 경로는 이 체크리스트 작성 중에도 조회하지 않았다.

| # | 조건 | 현재 | 증거 위치 |
|---|---|---|---|
| 1 | X/B와 후보의 팀장 승인 기록(승인자·시각·분수값·사유) | ☐ 미승인 (S1 PENDING) | [승인란](../eval/w5-research-policy-scenarios.md#5-팀장-승인란--research_demo-범위) |
| 2 | A/F 계약 합의(승인 범위 metadata, rule ID, 프로필) | ☐ F 회신 대기 (W6) | [A→F 요청](../handoffs/W5-A-to-F-contract-request.md) |
| 3 | F 정책 로딩·검증 구현과 회귀(SHA) | ☐ W6 이월 | — |
| 4 | 새 Policy Manifest·canonical·hash 확정 승인 | ☐ | — |
| 5 | Python/Node parity 21개 이상과 fail-closed 회귀 | ☐ | — |
| 6 | 모델 런타임 binding(tokenizer 파일 hash, 서비스 lock, Python 버전) | ☐ 설계만 | [설계](../eval/w5-model-runtime-binding-design.md) |
| 7 | 평가 코드 전체 의존 결합, 그룹·latency 규약 확정 | ☐ | [사전점검](../eval/w5-lock-preflight-checklist.md) |
| 8 | 실제 평가기 구현과 영속 1회 claim 위치 확정 | ☐ | — |
| 9 | **LOCK 승인** → LOCK 파일·commit → guard로 SHA·시각·bytes 검증 | ☐ | guard `inspect_git_lock` |
| 10 | 정확한 LOCK SHA를 명시한 **최초 TEST 평가 승인** (scope=`FIRST_TEST_EVALUATION`) | ☐ | — |
| 11 | 1회 실행 후 결과 보고. threshold 재조정·모델 재선정 금지 | ☐ | — |

다음 사유는 위 순서를 건너뛰는 근거가 되지 않는다: 연구 방향 승인, S1 추천, F 시험기간, GATE-5 마감.

## 4. 이번 마감 작업 범위

변경은 A 소유 문서만 했다: DOC-09, 발표안, Model Card 한계, 결정 기록부 W5 행, 이월 결정 보존본, W6 인계, 본 문서, W5.md. 다음은 하지 않았다: 새 학습, F/T 코드, Manifest, LOCK, TEST 접근, push.

## 5. 마감 검증

마감 커밋에서 A 테스트를 다시 실행한 결과는 [W5.md](W5.md) 최상단에 기록한다.

## 6. 원격 통합 감사 — 2026-10-22 (읽기 전용, merge 없음)

| Owner | 로컬 | 원격 | PR | CI |
|---|---|---|---|---|
| main | — | `8d0580a` | — | #235 SUCCESS (`8d0580a`) |
| T | — | `f8cec268` | **없음** (열린 PR 0개) | #239 SUCCESS (`f8cec268`, push 이벤트) |
| F | `bfcaf54` (보고) | `8d0580a` | 없음 | 해당 없음. 인증 오류로 push 불가 |
| A | `f199b35` 이후 | `8d0580a` | 없음 | 해당 없음. push 미승인 |

**T 브랜치 사전 감사 (`origin/main...f8cec268`):**
- 변경 파일 8개: 문서 5개, frontend 3개. W4 증거·Manifest·contracts·backend 설정 변경은 0개다.
- `verify.ts` +7줄: `transitionProblem` 안의 lifecycle `issuer_seq` 단조성 검사다. DECISION Core 검증 경로는 바뀌지 않는다(W4 7/7은 DECISION).
- 테스트: `verify.test.ts` 2건 추가(역순·중복 거부, RPC 장애 시 lifecycle NOT_CHECKED). `hardening.test.ts`는 timeout만 15초로 늘렸다.
- W5 문서 분리: `docs/progress/W5-T.md`, `W5-T-closeout.md`로 나눴다. 공용 `W5.md`는 건드리지 않았다.
- TEST-05: 공개 RPC `sepolia.base.org` 읽기 결과 9개 항목이 PASS다. 실제 네트워크 장애 시험은 하지 않았다고 명시했다.
- 과거 서명 커밋 `54caa97`(register-epoch.ts 로컬 Wallet 서명)은 main의 이력에는 없다. 그러나 파일 내용이 main과 **완전히 같으므로**, merge해도 운영 코드 diff는 0이다.
- 민감정보: 키, RPC 토큰, 사설 IP, 로컬 경로 없음(패턴 검색).
- A 브랜치와 겹치는 파일 0개, `git merge-tree` 충돌 없음.

**구분해서 기록할 증거:** F 로컬 구현 ≠ F 원격 CI ≠ T/F 실제 통합 ≠ 브라우저·모바일 QA ≠ A/T/F를 모두 포함한 main CI. 현재 확인된 것은 T 브랜치 CI 하나뿐이다.

## 7. 통합 게이트 갱신 — 2026-10-22 18:30 KST 이후 (읽기 전용 확인)

§6의 "T PR 없음 / F push 불가"는 아래와 같이 후속 진행됐다. 이월 결정(D-W5F-20261022-01)은 삭제하지 않는다. F의 W5 진행분은 후속 결과로 덧붙이며, W6에는 10/25까지 끝나지 않은 QA·승인·통합만 남긴다.

| Owner | 원격 SHA | PR | CI (해당 SHA) | 상태 |
|---|---|---|---|---|
| main | `8d0580a` | — | #235 | 변경 없음 |
| T | `f8cec268` | #28 open, clean, Draft 아님, 제목 "Seolkyeongmin" | #239 push, #241 PR SUCCESS | §6 감사 내용과 head가 같다. merge 승인 대기 |
| F | `4ae0a12b` | #29 **Draft**, clean | #243 push, #244 PR SUCCESS | Manifest·storage 수정 커밋 있음. T 재검증과 브라우저 QA는 미확인 |
| A | 로컬 `b1d572b` 이후, 원격 `8d0580a` | 없음 | 없음 | fast-forward push 가능, 승인 대기 |

**F 수정 확인 (`4ae0a12b`):**
- F1 Manifest: 원문 문서가 없으면 `NOT_CHECKED`, 모든 참조 문서의 계산 hash가 일치해야 `PASSED`. 과장 결함은 코드상 해소됐다.
- F2 legacy storage: 기존 비공개 키를 내용 표시 없이 감지하고, 소유자가 명시적으로 백업·정리하게 했다. 자동 삭제는 하지 않는다.
- F 자체 재검증: frontend 246/246, backend 203/203, build·lint·typecheck PASS. **브라우저 회귀는 BLOCKED**(Windows sandbox). browser/mobile PASS를 주장하지 않는다.
- T/F 통합: T와 F가 `verify.ts`·`verify.test.ts`를 함께 수정했지만 `git merge-tree` 충돌은 없다. 다만 실제 통합 회귀는 T merge 이후 F가 main을 merge한 뒤에 다시 실행해야 한다. 앞서 보고된 T/F 통합 245 PASS·desktop/mobile 24 PASS는 `bfcaf54` 기준이며 `4ae0a12b` 기준이 아니다.

**GATE-5 증거 — 분리 기록:**

| 근거 | 현재 |
|---|---|
| T 원격 CI | SUCCESS (`f8cec268`, #239/#241) |
| F 원격 CI | SUCCESS (`4ae0a12b`, #243/#244) |
| T/F 통합 단위 테스트 | 보고 245 PASS (`bfcaf54` 기준). 새 F SHA 기준 통합 결과 없음 |
| 브라우저·모바일 QA | 보고 desktop/mobile 24 PASS (`bfcaf54` 기준), LIVE RPC 6 SKIP. 새 SHA 기준 BLOCKED |
| LIVE 브라우저 | 6 SKIP → 실제 공개 RPC 브라우저 PASS가 아님 |
| Backend 임시 통합 환경 | BLOCKED (보고) |
| A Python 테스트 | 181 passed (로컬, 원격 CI 미경유) |
| TEST | SEALED |
| A/T/F 포함 main CI | 없음 (main merge 0건) |

## 8. Backend 보안 보류 — Windows SQLite 재열기 패치 (2026-10-23)

T가 제안한 Windows 대응 수정은 **BLOCKED / 별도 보안 작업**으로 관리한다(팀장 결정).

- 문제: `DatabaseSync(absolutePath)`로 다시 열면 열기 직전에 파일이 삭제되는 경쟁 상황에서 SQLite가 **빈 DB를 새로 만들 수 있다.** 그러면 원본 authoritative DB가 없는데도 서비스가 빈 상태로 계속 동작한다. 기존의 no-create/fail-closed 조건(DB가 없으면 만들지 않고 실패해야 함)을 지키지 못한다.
- 조치: 이 패치를 main, F PR #29, 어떤 통합에도 포함하지 않는다. 기존 Backend DB 열기 구현을 교체하지 않는다.
- 확인: PR #28의 변경 파일 8개에는 backend나 SQLite 관련 파일이 없다(2026-10-23 PR files API와 `git diff`로 확인).
- 표기: W5 CI 성공이나 F backend 203 PASS를 "Windows 재열기 문제 해결"로 표시하지 않는다.
- 후속(W6, T 담당 + A 리뷰): 존재하지 않는 경로를 생성하지 않는 열기 방식(예: SQLite URI `mode=rw`)과, 삭제 경쟁을 재현하는 부정 테스트를 함께 제출한다.

## 9. 2026-10-23 원격 통합 실행 결과

| 작업 | 결과 |
|---|---|
| T PR #28 merge | **미실행.** 7개 안전 조건은 모두 충족했다. 그러나 Claude Code 권한 분류기가 API merge 요청을 거부했다("Merge Without Review"). 제목 변경도 같은 요청에 포함돼 실행되지 않았다. 우회하지 않았다 |
| A `jujinho` push | **완료.** fast-forward `8d0580a..e1c973b`. force push 아님 |
| main | `8d0580a7` 그대로. 새 main CI 없음 |
| F 인계 | [T merge 이후 F 통합 인계](../handoffs/W5-F-integration-after-T-merge.md) |

## 10. GitHub 통합 상태 — 2026-10-23 (원격 조회 근거)

| 대상 | SHA | PR | CI | 리뷰 | 병합 |
|---|---|---|---|---|---|
| T | `f8cec268` | #28 open, 제목 변경 완료 | #239/#241 SUCCESS | `ysn-0215`에게 요청, 제출 0건 | 미병합 |
| F | `85a72a75` | #29 Draft | #248/#249 SUCCESS | 0건 | 미병합 |
| A | `f8061aa0` (원격), 로컬은 그 뒤 문서 커밋 | #30 Draft | #246/#247 SUCCESS | 0건 | 미병합 |
| main | `8d0580a7` | — | #235 SUCCESS | — | 새 main SHA 없음 |

- F CI SUCCESS는 F 브랜치 단독 결과다. T/F 통합 SHA의 결과가 아니며 브라우저 QA 결과도 아니다. 브라우저 QA는 F 자체 기록상 desktop/mobile BLOCKED, LIVE 6 SKIP이다.
- T merge 차단 사유: PR 작성자가 `jujinho03`라 본인 승인이 불가능하다. 또한 Claude Code 분류기가 리뷰 없는 merge를 거부했다. 독립 리뷰어 `ysn-0215`의 승인을 기다린다.
- SEC-W5-01(Windows SQLite 재열기)은 OPEN이다. 어떤 PR에도 포함되지 않았다.
