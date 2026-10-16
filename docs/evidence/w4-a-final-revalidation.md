# W4 A 독립 actual-model E2E 재검증

2026-10-16 실행. **A 독립 재검증 PASS, F/T 기술 인계 READY. GATE-4 전체 완료는 미선언.**
기존 실패 증거는 보존했다. 이 결과는 아래 고정 SHA와 실제 R01 모델을 사용한 신규 실행이다.

| 항목 | 결과 |
| --- | --- |
| AI-09 | PASS: 기존 실제 모델 서비스 재사용, 가중치 검증 및 실제 forward |
| AI-21 | 기존 PASS 유지: predictions SHA 동일, 1,255건 재추론 없음 |
| AI-10 actual-model happy path | PASS: FULL/TRUNCATED 2건 |
| Manifest 및 추가 Fail Closed | PASS: 17/17, 모든 DB 증가 0 |
| Python/F Node policy parity | PASS: 21/21 |
| Issuer alignment | MATCH: 4개 실제 소스/결과 값 일치 |
| AI 회귀 | 152 tests + 27 subtests PASS |
| F backend 회귀 | 7개 파일, 51 tests PASS |
| F/T 인계 | READY: A 측 manifest/issuer 차단 해소 |
| W4 전체 GATE | 별도 미검증: 실제 epoch anchoring, 외부 브라우저 RPC, 팀 승인 |

## 소스와 보존

- A branch: `a-w4-ai09-actual-inference`
- A 실행 기반: `b8c44dff37ce20dfdae6c74fb96e6062d8b72553`
- F detached HEAD: `2c99260c0eb6229d34b3f94191c2dab3238c1727`
- T detached HEAD: `fbcb3e9e99ae8dda2f9c70a32f35ec2c039b73de`
- T issuer 정렬 `60600d50174749f24f54b87b5f9d4a7b79775304`의 포함 관계 확인.
- fetch 당시 원격 A/F/T는 위 SHA와 일치. main은 `1401e03931f76ed8405454081adb9478339bae67`.

A의 실행 시점 하네스 수정은 당시 미커밋 상태였으며 정확한 파일 SHA는
[preflight.json](../../ai/artifacts/reports/w4_a_revalidation/20261016-final-r02/preflight.json)에 있다.
최종 전달 commit은 이 문서와 실행 소스를 포함하는 A commit이며 최종 응답에 기록한다.
F/T tracked/untracked 상태는 실행 후 clean이다. F/T 코드 또는 검증 규칙을 수정하지 않았다.
기존 W3 미추적 보고서와 `output/`, 준비 문서는 삭제하지 않았다.

W3 frozen config/lock/registry/fixture/Model Manifest는 기존 Git 자료와 newline 정규화 후
동일함을 확인하고 현재 파일 SHA를 기록했다. 기존 AI-09/21 결과는 수정하지 않았다.
기존 공개 증거와 최종 실패 SQLite 9개 등을 포함한 **33/33 파일 SHA 동일**을 실행 전후 확인했다.
AI-21 비공개 predictions SHA도 기존
`74fcac005741574422edcd597dc1f78d8234b20e24e50f35d722d01fd927a400`와 같다.

R01 weight SHA-256:
`a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f`.
Model Manifest Hash:
`0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1`.
Policy Manifest Hash:
`0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e`.

정책 JSON/canonical bytes를 그대로 복사했다. 기존 Manifest 안의 과거 evaluator_source는
정책 생성 provenance이며, 이번 실행 F SHA와 구분한다. 새 F에 맞춰 Manifest를 재작성하지 않았다.
F 설정 파일의 Model/Policy JSON과 A의 실제 Manifest 내용 일치를 assertion으로 확인했다.
정책은 **W4_PROVISIONAL_E2E_ONLY, team_approved=false**, X/B 및 운영 승인 미확정이다.
threshold는 hate `24495/216950`, offensive `180483/646501`로 유지했다.

## 실제 HTTP / SQLite 결과

AI-09 `SelectedModel`은 로컬 selected_model의 safetensors/config/manifest를 검증하고,
pinned tokenizer, CPU float32, batch 1, threads 4/1로 실제 forward를 실행했다.
모델 로더나 점수를 mock/fixture로 교체하지 않았다. 데이터 접근 차단 guard를 유지했다.
정상 발급은 실제 Python adapter 호출 2회이며 replay/409에서 추가 호출이 없음을 확인했다.

| 입력 | 실제 hate PPM | 실제 offensive PPM | 조치 | reason / rule |
| --- | ---: | ---: | --- | --- |
| FULL | 3364 | 12979 | ALLOW | 빈 배열 / 빈 배열 |
| TRUNCATED | 31479 | 102538 | HUMAN_REVIEW | INPUT_TRUNCATED / W4-TRUNCATED |

두 응답 모두 UNCALIBRATED이며 정확한 모델/정책 hash를 참조한다. caller commitment,
canonical Receipt Hash, SQLite 본문·원문·salt 저장 일치, 재개방 후 2건 보존,
public bundle의 원문/salt/private package 미포함, 동일 key replay 및 다른 요청 409를 확인했다.
public bundle의 proof/anchor는 null이다. 비공개 응답은 Git ignored 경로에만 보관했다.

실패마다 새 DB를 사용하고 정상 경로와 같은 신뢰 설정에서 이름에 명시한 항목만 변경했다.
응답 변조 proxy도 실제 Python 응답을 받아 해당 필드만 변경한다.
서비스 중단과 timeout은 별도 실제 프로세스 상태/1µs deadline으로 실행했다.

| 시나리오 | 결과 |
| --- | --- |
| 기존: 정책 설정 없음 | PASS |
| 기존: invalid score output | PASS |
| 기존: malformed model hash | PASS |
| 기존: wrong content commitment | PASS |
| 기존 실패: valid but unapproved model hash | **PASS: 201/1/1 → 503/0/0** |
| 기존 실패: unbound policy hash | **PASS: 201/1/1 → 503/0/0** |
| 기존: AI service stopped | PASS |
| 기존: actual Python timeout | PASS |
| 추가: taxonomy_version mismatch | PASS |
| 추가: score_semantics mismatch | PASS |
| 추가: hate review / restrict 각각 +1 | PASS 2건 |
| 추가: offensive review / restrict 각각 +1 | PASS 2건 |
| 추가: Model Manifest run_id 변조 | PASS |
| 추가: Policy Manifest comparison 변조 | PASS |
| 추가: provisional localW4E2E gate false | PASS |

**17건 모두 HTTP 503 / INFERENCE_UNAVAILABLE**. Decision, Anchor Candidate, content_store,
epoch, COMPLETED idempotency의 before/after/delta가 모두 0이다. 응답 최상위가
error/ok/request_id뿐이고 data/action/scores가 없음을 확인했다. 시작 실패를 503 성공으로
대체하지 않았다. 같은 baseline의 실제 정상 2건 발급이 먼저 통과했다.
[시나리오별 결과](../../ai/artifacts/reports/w4_a_revalidation/20261016-final-r02/af_e2e.json).

## Issuer 계약

F shared ISSUER_ID, 두 신규 ReceiptBody issuer_id, T APPROVED_PROFILES.BASE_SEPOLIA_DEMO,
T baseSepoliaProfileFromEnv() 결과가 모두 **verimod-example-platform**이다.
T detached worktree의 실제 모듈과 protocol 의존성을 로드했다. 기대 문자열로 MATCH를 대신하지 않았다.

환경 프로필 생성은 승인 profile의 contract/publisher와 inert HTTPS URL, deployment block 0을
주입한 순수 생성자 검사다. 배포 환경이나 RPC 검증을 의미하지 않는다.
동일 실제 Receipt의 issuer만 verimod-demo-issuer로 변경하면 Receipt Hash와
issuer commitment가 모두 달라짐을 확인했다. T verifier는 올바른 형식의 합성 locator를
붙인 해당 변경본에 **UNTRUSTED_ANCHOR**를 반환했고 ledger 호출은 0회였다.
실제 미앵커 Receipt는 **PENDING_ANCHOR**다. 합성 locator는 DB에 저장하거나 송신하지 않았다.

## 시간·회귀·실행 문제

- 실제 E2E: **55.004초**, 정상 2건 + 실패 17건.
- 정책 parity: **39.732ms**, Python reference 21개를 다시 계산한 뒤 새 F와 전부 일치.
- AI 회귀: **152 tests + 27 subtests**, pytest **29.94초**. 원본 AI-21 재추론 없음.
- F 회귀: **51/51**, 파일 7개. 실행 시각 기반 경과시간 및 파일별 수는
  [F regression](../../ai/artifacts/reports/w4_a_revalidation/20261016-final-r02/f_regression.json)에 기록.
  F 회귀의 mock 점수는 실제 모델 E2E 실적으로 계산하지 않았다.

첫 r01 시도에서는 sandbox Python 시작이 정체됐고 F 회귀 일부는 sandbox 임시 모듈 ENOENT로
실패했다. 중단한 로그/부분 parity와 결과는 보존했고 PASS로 세지 않았다. 승인된 호스트 실행에서
동일 하네스로 새 r02 E2E DB/로그를 만들어 완료했다. F 회귀 재시도 로그는 r01 하위 별도 r02 파일이다.
환경 경고는 Node experimental SQLite와 Starlette HTTPX deprecation이다.

## 실제 실행 명령과 로그

아래는 실행 기록이며 출력 디렉터리를 재사용하는 재실행 명령이 아니다.
재현 시 고유한 새 디렉터리와 같은 pinned SHA/실행 소스를 사용한다.
준비 스크립트는 실행 기반 A HEAD를 검사하므로 최종 전달 commit에서 재현할 때는
그 commit과 기록된 source SHA를 확인하고 A 기준 검사를 명시적으로 갱신해야 한다.

```powershell
git fetch origin
git worktree add --detach ../verimod-w4-af-final 2c99260c0eb6229d34b3f94191c2dab3238c1727
git worktree add --detach ../verimod-w4-t-final fbcb3e9e99ae8dda2f9c70a32f35ec2c039b73de
git merge-base --is-ancestor 60600d50174749f24f54b87b5f9d4a7b79775304 fbcb3e9e99ae8dda2f9c70a32f35ec2c039b73de
# F backend 및 T frontend 각각에서
npm ci --ignore-scripts --no-audit --no-fund
# A root에서
& ai/.venv/Scripts/python.exe -B ai/scripts/prepare_w4_revalidation.py --public-dir ai/artifacts/reports/w4_a_revalidation/20261016-final-r02 --private-dir ai/.venv/w4-final-20261016-r02 --f-worktree ../verimod-w4-af-final --t-worktree ../verimod-w4-t-final
node ../verimod-w4-af-final/backend/node_modules/tsx/dist/cli.mjs ai/scripts/w4_policy_parity.mts ../verimod-w4-af-final ../verimod-w4-t-final/shared/protocol/src ai/artifacts/reports/w4_a_revalidation/20261016-final-r02 parity
node ../verimod-w4-af-final/backend/node_modules/tsx/dist/cli.mjs ai/scripts/verify_w4_af_e2e.mts . ../verimod-w4-af-final ai/.venv/w4-final-20261016-r02/e2e ai/artifacts/reports/w4_a_revalidation/20261016-final-r02 ../verimod-w4-t-final
& ai/.venv/Scripts/python.exe -B ai/scripts/check_w4_a_release.py --private-dir ai/.venv/w4-final-20261016-r02 --public-dir ai/artifacts/reports/w4_a_revalidation/20261016-final-r02 *> ai/.venv/w4-final-20261016-r02/ai-regression.log
# F backend에서
npm test -- --reporter=json --outputFile=../../verimod/ai/.venv/w4-final-20261016-r01/f-regression-r02.json *> ../../verimod/ai/.venv/w4-final-20261016-r01/f-regression-r02.log
```

비공개 로그: `ai/.venv/w4-final-20261016-r02/e2e/actual-python.log`,
`timeout-python.log`, `ai/.venv/w4-final-20261016-r02/ai-regression.log`,
`w4-a-regression.xml` 및 위 F 로그. SQLite 18개(정상 1 + 실패 17)는 r02/e2e에 보존한다.
기존 20261016 실패 SQLite와 새 DB는 별개다. private artifact_inventory.json은 로컬에만 보관한다.
REC-01은 공개 집계 파일만 표시하고 private DB·원문·salt·로그 화면은 노출하지 않는다.

## 남은 외부 확인

A의 manifest/issuer 차단은 해소됐다. F/T는 이 pinned 결과와 신규 영수증을 기준으로
실제 Base Sepolia epoch anchoring 및 외부 브라우저 RPC 검증을 별도 수행해야 한다.
X/B와 정책 운영 승인은 여전히 팀 결정 사항이다. 이번 실행은 chain 송신 0,
TEST 접근 0, 학습 0이며 W5 이후 작업을 수행하지 않았다.
