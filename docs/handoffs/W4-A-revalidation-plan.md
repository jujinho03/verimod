# W4 A — F/T 수정 수령 후 재검증 절차

작성일: 2026-10-16. 현재 단계는 **PREPARATION ONLY / 수정 SHA 대기**다.
이 문서는 새 실행 결과가 아니다. 서버 시작, 추론, 정책 테스트 및 회귀 테스트를
실행하지 않았다. 기존 상태는 정상 경로 PASS, Fail Closed 6/8 PASS 및 2/8 FAIL,
issuer MISMATCH, W4 전체 PARTIAL로 유지한다.

## 현재 기준과 보존

- A 브랜치: `a-w4-ai09-actual-inference`
- 점검한 A HEAD: `b8c44dff37ce20dfdae6c74fb96e6062d8b72553`
- 기존 실행 F: `a58230e897111eee8c981c4d734294201651b952`
- 기존 실행 T: `3054b112e9be09501c8f21c66a861212e7975db2`
- 수정 F/T SHA: **미수령**. 원격 최신 여부를 이번 준비 단계에서 조회하지 않았다.
- 시작 시 tracked/staged 변경 없음. 기존 untracked W3 보고서 디렉터리,
  W3 `progress.json`, `output/`는 그대로 보존한다.
- 기존 detached 통합 worktree `../verimod-w4-af-validation`을 재사용하거나 변경하지 않는다.

[기존 결과](../progress/W4-A.md), [F/T 인계](W4-A-to-FT.md),
`ai/scripts/verify_w4_af_e2e.mts`와 관련 정책 준비·parity·회귀 스크립트를 검토했다.
기존 공개 결과 디렉터리 `ai/artifacts/reports/w4_a_validation/20261016/` 및
비공개 최종 실행 디렉터리 `ai/.venv/w4-private-20261016/e2e-r02/`의 33개 파일에
SHA-256 보존 스냅샷을 만들었다. 여기에는 SQLite 9개와 Python 로그, 실패 응답,
정책 Manifest 및 기존 결과가 포함된다. DB 연결이나 SQL 실행은 하지 않았다.

보존 목록은 Git ignored인
`ai/.venv/w4-revalidation-prep-20261016/preservation.json`에만 저장한다.
이는 이번 점검 시점의 기준이며 과거 실행 시점부터의 비공개 파일 무변경을
독립적으로 증명하는 자료는 아니다. 기존 원문·salt 포함 응답과 DB를 공개하지 않는다.
이 목록 밖의 기존 초기 실행 자료와 private predictions도 삭제하거나 변경하지 않는다.

정책 JSON 파일 SHA-256:
`aba4d3358f1519e8e02985c66d155f293776ac0e0e7c8036a2eb3f6e6b836840`.
Canonical bytes 파일 SHA-256:
`aa76f1b35f7097c2ef031089b4813d4771e4cd80da77f085cb5528d46dc02714`.
파일 SHA-256은 protocol domain hash와 서로 다른 값이다.

기존 Model Manifest Hash:
`0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1`.
기존 Policy Manifest Hash:
`0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e`.
정책은 계속 **W4_PROVISIONAL_E2E_ONLY**이며 X/B와 운영 승인은 미확정이다.

## 시작 조건

1. F와 T의 수정 커밋을 각각 전체 40자리 SHA로 수령한다. 변경 인터페이스와
   issuer 합의 내용을 확인한다. 움직이는 브랜치 이름만으로 실행하지 않는다.
2. `git fetch origin` 후 실제 커밋 객체, diff, worktree 상태를 확인한다.
   A의 새 변경/타인 파일과 충돌하면 멈춘다. F/T 브랜치에 commit/push/merge하지 않는다.
3. 새로운 고유 run ID와 detached F worktree, 비공개 출력 디렉터리, 공개 증빙
   디렉터리를 확보한다. 어느 경로라도 기존 실행 결과가 있으면 재사용하지 않는다.
4. R01 가중치의 기존 SHA-256과 Model Manifest를 다시 확인한다. 모델 부재/불일치면
   BLOCKED. base pretrained 가중치로 대체하지 않는다. TEST 경로 조회/stat/open 금지.
5. T의 canonical/hash 소스와 승인 TrustProfile은 수령한 T SHA에서 정확히 읽는다.
   프로토콜 차이가 있으면 분석·인계하고 A가 canonical bytes/issuer를 임의 수정하지 않는다.

## 실행 전 A 하네스 준비 항목 — 새 SHA 수령 후 수행

현재 스크립트를 새 SHA에 대해 그대로 실행하면 안 된다. 다음 수정은 이번에는
실행하지 않았으며, 새 F 인터페이스를 확인한 뒤 A 소유 하네스에서만 수행한다.

- `verify_w4_af_e2e.mts`의 고정 F SHA와 보고서 T SHA,
  `prepare_w4_policy.py`의 F_REF/T_REF를 명시적인 실행 provenance로 받도록 한다.
  실제 worktree HEAD 및 추출한 T 소스와의 일치를 검사하고 기록한다.
- 정책 준비 스크립트는 Manifest의 `evaluator_source.git_commit`까지 재생성한다.
  새 F SHA를 넣으면 정책 bytes/hash도 바뀐다. 기존 정책 bytes/hash를 우선 보존하고
  새 실행 provenance를 별도로 기록한다. 변경이 필요한 경우 별도 Manifest revision과
  실제 계산된 새 hash, 변경 사유를 남긴다. 임의 hash 또는 운영 승인 표시는 금지한다.
- hash/parity 및 회귀 출력에는 덮어쓰기 경로가 있다. 모든 출력에 새 경로 및
  파일 부재 검사를 적용한다. E2E DB만 새로 만드는 것으로 충분하지 않다.
- 현재 E2E 최종 status는 fail_closed만 반영한다. 새 판정은 정상 2건, 전체 실패
  시나리오, issuer MATCH 및 필수 정합성 검사를 모두 요구해야 한다.
- 기존 8건은 응답 hash 교체 등을 검사하지만 Manifest 문서 내용 변조와
  threshold 단독 변경을 별도로 검증하지 않는다. 아래 추가 검사를 구현한다.
- `ai/tests/test_w4_policy.py`는 기존 `20261016` 증빙을 참조한다. 해당 테스트는
  과거 증빙 회귀로 유지하되, 새 F에 대한 21개 벡터 실행 결과를 별도 기록한다.
- F의 실제 설정 API로 검증한다. A 검증 wrapper로 F 결함을 가리거나,
  알려진 실패를 제외/xfail 처리하지 않는다.

## 실행 순서 및 합격 조건

1. 기존 Validation 정책 및 21개 고정 벡터를 새 실행 디렉터리로 복사해 bytes를
   대조한다. F/T 수정 검증을 위해 1,255건 추론이나 학습을 반복할 필요는 없다.
2. pinned T canonicalBytes/domainHash로 정책 hash를 계산하고 F와 비교한다.
   Python reference와 새 F evaluator의 action/reason_codes/triggered_rule_ids 및
   정렬, hash를 21개 벡터 전체에서 비교한다. threshold ±1/동일, overlap,
   TRUNCATED 고점수 우선 처리까지 기존 범위를 유지한다.
3. 실제 R01 Python `/infer`와 새 F HTTP adapter/issuance를 연결한다.
   FULL/TRUNCATED 정상 발급 2건, receipt hash/commitment/manifest 참조,
   SQLite reopen, private/public 경계, 동일 key 재사용, 다른 요청 409를 검증한다.
4. 기존 실패 8건을 모두 독립 DB에서 실행한다:
   policy_not_configured, invalid_model_output, malformed_model_manifest,
   wrong_commitment, unapproved_model_manifest, unapproved_policy_manifest,
   ai_service_stopped, python_timeout.
5. 추가 실패를 최소 3종 검사한다. 정상 manifest/hash를 기준으로 Model Manifest
   내용만 변조, Policy Manifest 내용만 변조, 네 threshold 각각의 단독 +1 변경을
   독립 검사한다. 기대 hash는 유지해 내용/설정 binding을 검증하고, 실제 변경 필드와
   새 F 설정 경로를 기록한다. 기존 유효한 다른 hash 검사도 그대로 남긴다.
6. 모든 실패에서 HTTP **503 INFERENCE_UNAVAILABLE**, 신규 Decision **0**,
   신규 Anchor Candidate **0**을 각각 before/after/delta로 확인한다.
   content_store 증가 없음, 가짜 scores/action/자동 ALLOW 없음도 확인한다.
   시작 시 설정 거부로 서버가 실행되지 않는 경우 연결 오류를 HTTP 503 PASS로
   기록하지 않는다. 실제 결과와 계약 차이를 보고한다.
7. 새 ReceiptBody issuer와 pinned T 승인 BASE_SEPOLIA_DEMO issuer가 일치하는지
   검사한다. F/T 제공 회귀의 issuer mismatch 거부 및 receipt/body hash,
   issuer commitment, bundle 검증 결과를 확인한다. 저장된 기존 Receipt를 수정하지 않는다.
8. 새 parity, 기존 AI 회귀 및 해당 F 회귀를 실행한다. 명령/exit code/테스트 수/
   경과시간/로그/의존성·소스 SHA를 기록한다. F/T 테스트는 실행 내용을 먼저 검토해
   TEST나 외부 chain 전송을 수행하는 명령을 제외하고 제외 범위를 명시한다.
9. 보존 목록의 기존 파일 SHA가 그대로인지 다시 확인한다. 신규 공개 증빙에서
   원문/row identifier/salt/비밀키/토큰/개인 호스트명·절대경로를 검사한다.
   A 변경만 검토·commit/push하고 `git ls-remote`로 A 원격 SHA를 확인한다.

## 수령 후 사용할 명령 골격 — 이번에는 실행하지 않음

아래 환경변수는 실제 수령 SHA 및 신규 run ID로 채워야 한다. 하네스 보완 전 실행 금지.

```powershell
git fetch origin
git show --stat $fFixSha
git show --stat $tFixSha
git worktree add --detach $newFWorktree $fFixSha
git -C $newFWorktree rev-parse HEAD
git -C $newFWorktree status --porcelain
# 새 F backend 작업 디렉터리에서, 의존성 검토 후
npm ci --ignore-scripts --no-audit --no-fund
# A root에서: 새 경로, 정확한 소스 추출 및 하네스 보완 완료 후
node "$newFWorktree/backend/node_modules/tsx/dist/cli.mjs" ai/scripts/w4_policy_parity.mts $newFWorktree $newTProtocol $newPublicDir parity
node "$newFWorktree/backend/node_modules/tsx/dist/cli.mjs" ai/scripts/verify_w4_af_e2e.mts . $newFWorktree $newPrivateE2E $newPublicDir $newTProtocol
& ai/.venv/Scripts/python.exe -B ai/scripts/check_w4_a_release.py --private-dir $newPrivateDir --public-dir $newPublicDir
```

새 하네스의 SHA 입력 방법 및 F 설정 API가 확정되면 최종 실행 명령을 증빙에 기록한다.
기존 `prepare_w4_policy.py`를 과거 디렉터리에 재실행하지 않는다.
REC-01은 신규 집계 결과만 보여주며 private 응답/DB/로그를 화면에 노출하지 않는다.

## 이번 준비 단계에서 실행한 점검

`git status --short --branch`, `git rev-parse HEAD`, `git worktree list`,
`git diff --stat`, `git diff --cached --stat`, 지정 문서/코드/공개 결과 읽기,
`rg -n`으로 하네스 고정 SHA·쓰기·상태 판정 확인, 지정 증거 파일 `Get-FileHash`,
`git check-ignore`를 수행했다. 테스트 실행 수 **0**, 서비스 시작 **0**,
chain 송신 **0**. 기존 실행의 테스트 수/시간을 이번 실행으로 재사용하지 않는다.

다음 입력은 F 수정 SHA와 T 수정 SHA 및 issuer 합의 내용이다. 수령 전 대기하며
AI-10 전체 PASS를 선언하지 않는다. 정책 운영 승인과 W5 LOCK은 별개이며 이번 범위 밖이다.
