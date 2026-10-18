# W4 A — validation, 정책 parity, 실제 A/F 인계

최신 독립 재검증: [F/T 수정 반영 결과](../evidence/w4-a-final-revalidation.md).
정상 2건, Fail Closed 17건, parity 21건 PASS 및 issuer MATCH. 아래는 보존된 이전 실행 기록이다.

날짜: 2026-10-16 KST. 작업 브랜치: `a-w4-ai09-actual-inference`.
**전체 PARTIAL.** 실제 성공 경로는 통과했다. 변경하지 않은 F 코드에서 필수 manifest 거부 사례
2개가 실패했고, F/T issuer identity가 다르다. GATE/공개 체인 완료는 주장하지 않는다.

| 영역 | 상태 | 근거 |
| --- | --- | --- |
| AI-21 | PASS | 실제 R01 VALIDATION 예측 1,255건; W3 지표 정확히 재현 |
| Validation 정책 | PROVISIONAL | 실제 점수 후보 25개; X/B와 승인 미정 |
| Python/Node parity | PASS | 실제 후보 threshold와 hash로 고정 벡터 21개 |
| AI-10 실제 A/F E2E | FAIL | 정상 경로 통과; 형식은 맞지만 미승인 model/policy hash가 잘못 receipt를 발급 |
| Issuer ID 호환성 | MISMATCH | Receipt example-platform 대 승인 demo-issuer |
| 503 / Receipt 0 / anchor 후보 0 | FAIL | 8개 중 6개 통과; manifest identity 결함 2개가 판정/후보 1건씩 생성 |
| F/T 인계 | BLOCKED | F manifest 결합 + F/T issuer 합의 + 팀 정책 승인 필요 |
| W4 A 전체 | PARTIAL | 검증된 산출물 전달; 외부 담당 차단사항 보존 |

## Git과 보호 범위

새 fetch로 A AI-09 `dd1031ae042d384da8600d26310a671f398f68c4`,
main `1401e03931f76ed8405454081adb9478339bae67`,
F `a58230e897111eee8c981c4d734294201651b952`,
T `3054b112e9be09501c8f21c66a861212e7975db2`를 확인했다.
최종 A 전달 commit은 이 보고서를 담은 commit이며, 자기 참조 SHA나 실행 시점 commit 주장 없이
인계 응답에서 보고한다. W4 validation 소스는 AI-09 기준 작업 트리 추가분이며, 정확한 실행 소스
hash는 별도의 [W4 실험 등록부](../../ai/experiments/w4_validation_runs.jsonl)에 있다.

A만 commit/push했다. F는 고정 SHA의 detached 테스트 worktree이며 추적 파일 수정이 없다.
T canonical/hash/profile 소스는 Git에서 읽어 Git 제외 로컬 테스트 디렉터리에 두었다. 대규모 병합,
F/T 브랜치 변경, main push, Base RPC/서명/송신, 학습, W5–W7 작업은 없었다.

W3 등록부, 동결 config/lock, Model Manifest, fixture는 Git 줄바꿈 정규화 기준으로 byte 단위 동일하다.
선정 로컬 가중치는 여전히 SHA-256 `a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f`이다.
기존 미추적 W3 보고서와 output 파일은 보존했다.

## AI-21 실제 VALIDATION

W2 내부 split 위치에서 이미 알려진 `validation.jsonl`만 열었다. 데이터셋 디렉터리 나열이나
TEST 경로/stat/open/예측은 없었다.
승인된 데이터셋 revision: `f8d05dce2b22007bb149e5139c0060c68ad8f94b`.
VALIDATION SHA-256: `a92f81ed8eadb9fdb1950be542f9edac4fe778f3e7bd2d630cd1494ef031a26a`.
클래스 건수: hate 305, offensive 403, none 547, 합계 1,255.

AI-09 `SelectedModel.predict`를 모든 행에 실행했다. CPU float32, batch 1, threads 4/1,
`verimod-ko-text-v1`, codepoint 500개 HEAD, 고정 tokenizer revision
`02f94ba5e3fcb7e2a58a390b8639b0fac974a8da`, special token 포함 128 오른쪽 자르기,
native softmax, 노출 PPM 1회 반올림. 읽기 전용 forward hook으로 정답/예측 지표용 native logits를
받았다. 1,255건 모두 FULL이었다.

| 정답 / 예측 | hate | offensive | none |
| --- | ---: | ---: | ---: |
| hate | 177 | 100 | 28 |
| offensive | 37 | 226 | 140 |
| none | 13 | 105 | 429 |

- Macro-F1: **0.6524599868976999**; W3와 차이 정확히 0.
- Accuracy: **0.6629482071713148**; W3와 차이 정확히 0.
- 클래스 F1: hate 0.6654135338345865; offensive 0.5419664268585132; none 0.75.
- API batch 1인데도 혼동 행렬이 W3 batch-8 증거와 정확히 일치한다. batch-8 진단은 필요 없어
  실행하지 않았으며, batch 간 원시 float 점수 동일성은 주장하지 않는다.
- 경과: **148.216s**, 모델 초기화와 출력 준비 포함.
- 비공개 예측 SHA-256:
  `74fcac005741574422edcd597dc1f78d8234b20e24e50f35d722d01fd927a400`.

비공개 예측에는 로컬 행 번호, native 정답/예측, native 점수, logits, 노출 PPM, 상태가 있다.
원문이나 데이터셋 record ID는 없지만, 행 파일 전체를 Git 제외/비공개로 둔다.
[안전한 집계와 출처](../../ai/artifacts/reports/w4_a_validation/20261016/validation.json).

## 후보 정책과 parity

[지표 분수를 포함한 25개 비교 전체](../evidence/w4-a-validation-policy.md).
`none`은 FRR용 운영 NORMAL proxy일 뿐이며 ALLOW를 직접 결정하지 않는다.
정식 선택은 FRR <= X, HRR_TOTAL <= B를 만족하는 후보 중 HAR 최소, RP 최대, HRR_TOTAL 최소다.
X/B는 승인이 확정되지 않았으므로 정식 선택을 실행하지 않았다.

미리 정한 기술 후보 H50-75_O50-75는 실제 FULL validation 점수의 중앙값을 review로, 상위 사분위수를
restrict로 쓰며 세 조치를 모두 거친다. threshold는 hate `24495/216950`, offensive `180483/646501` PPM이다.
조치: ALLOW 461, HUMAN_REVIEW 198, RESTRICT 596. FRR 91/547, RP 505/596,
HAR 90/708, HRR_TOTAL 198/1255. 이는 **W4_PROVISIONAL_E2E_ONLY**이며 운영 승인이 아니다.

Model manifest hash:
`0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1`.

계산한 policy manifest hash:
`0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e`.

정확한 JSON과 canonical bytes는 두 산출물에 대해 줄바꿈 변환을 끈 채 커밋했다.
T의 기존 canonicalBytes/domainHash(DOMAINS.policy, ...)로 hash를 계산했다. T와 F의 canonical/hash
소스 blob이 동일함을 확인했다. manifest는 우선순위, TRUNCATED override, 포함 비교,
reason/rule 정의, 승인 대기 상태를 명시한다.

**21/21 parity 벡터 PASS**: threshold 4개의 -1/같음/+1 경계, review/restrict 겹침, 0점 ALLOW,
최대 점수, TRUNCATED 0/최대/restrict 경계, 정확히 정렬된 reason/rule, manifest hash.
기존 F mock 테스트는 새 증거로 세지 않았다.

## AI-10 실제 HTTP / SQLite

변경하지 않은 F `createApp`, HTTP adapter, threshold 평가기, `IssuanceService`를 loopback HTTP와
전용 SQLite 파일로 실제 R01 Python `/infer`에 연결했다.
직접 작성한 한국어 합성 요청 2건(FULL, TRUNCATED)이 실제 receipt를 만들었다.
둘 다 receipt canonical/hash, 호출자 생성 commitment, model/policy 참조, 정책 결과, SQLite 저장,
공개/비공개 데이터 분리 검사를 통과했다. DB를 다시 열어도 receipt 2건이 남았다. 같은 key/요청은
모델을 다시 호출하지 않고 같은 데이터를 재사용했고, 같은 key로 요청을 바꾸면 409를 반환했다.

API private package는 F의 salt/receipt/commitment 3개 필드 metadata다. 원문은 호출자가 보관하고
비공개 SQLite에 있다. frontend의 5개 필드 다운로드 패키지 조립은 브라우저 테스트로 실행했다고 주장하지
않는다. 공개 bundle에는 receipt_body, receipt_hash, proof, anchor만 있으며, 앵커 전 proof/anchor는 null이다.

| 실패 시나리오 | HTTP | 새 판정 | 새 후보 | 상태 |
| --- | ---: | ---: | ---: | --- |
| 정책 미설정 | 503 | 0 | 0 | PASS |
| 잘못된 점수 출력 | 503 | 0 | 0 | PASS |
| 형식 오류 model manifest hash | 503 | 0 | 0 | PASS |
| 잘못된 content commitment | 503 | 0 | 0 | PASS |
| 형식은 맞지만 미승인 model hash | 201 | 1 | 1 | FAIL |
| 형식은 맞지만 결합되지 않은 policy hash | 201 | 1 | 1 | FAIL |
| AI 서비스 중단 | 503 | 0 | 0 | PASS |
| 실제 Python forward 제한 시간 | 503 | 0 | 0 | PASS |

503 본문 6개는 모두 INFERENCE_UNAVAILABLE이며 판정/점수/자동 ALLOW가 없다. 예상 밖 201 2건은
HUMAN_REVIEW를 담고 있지만, 필수 미발급 조건을 여전히 위반한다. 후보 건수는 F의 정확한 pending-receipt
LEFT JOIN 조건을 쓴다. 모든 DB의 epoch는 0이며 freeze나 체인 송신은 없었다.

실제 issuer `verimod-example-platform`은 T 승인 `BASE_SEPOLIA_DEMO` issuer `verimod-demo-issuer`와
다르다. A는 어느 identity도 바꾸지 않았다.
[F/T 최소 변경과 회귀 요구사항](../handoffs/W4-A-to-FT.md).

최종 E2E: **34.238s**, 정상 경로 PASS, 실패 gate FAIL, 명령은 의도적으로 exit 1.
처음 실행은 HTTP 사례를 마쳤지만, 이미 종료된 child를 두 번 기다리다 harness 프로세스 정리에서 실패했다.
최종 보고 증거가 아니다. harness 종료 상태 검사만 고쳤고, 기록된 재실행에는 새 SQLite 디렉터리를 썼다.
실패를 PASS로 바꾸려고 F/T 코드를 고치지 않았다.

## 실행 명령과 REC-01 재현

workdir 표시가 없으면 A 저장소 루트에서 실행했다.

```powershell
git fetch origin
git worktree add --detach ../verimod-w4-af-validation a58230e897111eee8c981c4d734294201651b952
# Workdir: ../verimod-w4-af-validation/backend
npm ci --ignore-scripts --no-audit --no-fund
# Workdir: A repository root
& ai/.venv/Scripts/python.exe -B -u ai/scripts/run_w4_validation.py --splits-dir ../verimod-local-data/w2/beep-splits --private-dir ai/.venv/w4-private-20261016 --public-dir ai/artifacts/reports/w4_a_validation/20261016
& ai/.venv/Scripts/python.exe -B ai/scripts/prepare_w4_policy.py --public-dir ai/artifacts/reports/w4_a_validation/20261016 --private-dir ai/.venv/w4-private-20261016 --f-worktree ../verimod-w4-af-validation
node ../verimod-w4-af-validation/backend/node_modules/tsx/dist/cli.mjs ai/scripts/verify_w4_af_e2e.mts . ../verimod-w4-af-validation ai/.venv/w4-private-20261016/e2e-r02 ai/artifacts/reports/w4_a_validation/20261016 ai/.venv/w4-private-20261016/t-protocol
& ai/.venv/Scripts/python.exe -B ai/scripts/check_w4_a_release.py --private-dir ai/.venv/w4-private-20261016 --public-dir ai/artifacts/reports/w4_a_validation/20261016
```

REC-01에서는 Git 제외 비공개 디렉터리와 새 공개 출력 디렉터리를 쓴다. 스크립트는 예측/E2E 증거를
덮어쓰지 않는다. validation, prepare/hash/parity, E2E 순서로 실행한다.
집계 보고서와 최종 E2E 요약만 보여주고, 비공개 응답, salt, 말뭉치 원문, 파일 탐색기 경로, 비공개
SQLite 내용은 보여주지 않는다. 현재 기대 E2E 종료 코드는 위 두 결함 때문에 1이며, 녹화에서 이를 GATE
완료처럼 보여주면 안 된다. 녹화, 브라우저 공개 검증, Base 트랜잭션은 실행했다고 주장하지 않는다.

실제 비공개 로그: `ai/.venv/w4-private-20261016/e2e-r02/actual-python.log`,
같은 디렉터리의 `timeout-python.log`, `ai/.venv/w4-private-20261016/w4-a-regression.xml`.
비공개 예측: `ai/.venv/w4-private-20261016/predictions.jsonl`.
비공개 SQLite와 결함 응답 파일은 Git 제외 `e2e-r02` 디렉터리에 남는다.

공개 증거 루트: `ai/artifacts/reports/w4_a_validation/20261016/`:
validation, 후보 지표, policy manifest/canonical bytes/hash, 소스 출처,
parity 벡터 21개/결과, 실제 E2E, 회귀, metadata 가림 기록.

## 회귀, 개인정보, 남은 경고

보호된 전체 AI 회귀: **152 tests + 27 subtests passed**, pytest 소요 18.08s.
이전 141개와 새 W4 정책/증거 테스트 11개를 포함한다. W3 frozen 파일 비교도 통과했다.
테스트는 봉인된 TEST 말뭉치가 아니라 합성 fixture를 썼다.
어느 단계에서도 모델 학습이나 TEST 접근은 없었다.

이전 AI-09 공개 보고서 2개에 로컬 실행 파일 경로/hostname이 있었다. 현재 트리에서 해당 metadata 필드를
가렸고, 원래 bytes와 checksum은 비공개로 보존했다. 점수, timestamp, 테스트 결과, W3 frozen 산출물은
바꾸지 않았다. 과거 AI-09 commit에는 원래 metadata가 남아 있으며, Git history를 다시 쓰거나 force-push하지
않았다. 새 W4 보고서에는 hostname/절대 경로가 없다.

실패가 아닌 환경 경고: Starlette HTTPX TestClient deprecation, Node 24 experimental SQLite.
처음 sandbox npm 설치는 Windows symlink 권한으로 실패했고, 격리된 의존성 설치와 loopback 테스트는
승인된 권한으로 성공했다.

**중단 경계:** 운영/공개 통합 전에 F가 manifest identity를 강제하고, F/T가 issuer identity에 합의하고,
팀이 X/B/정책을 승인해야 한다. A는 F/T 소유 계약을 바꾸지 않고 검증된 양성·음성 증거를 전달한다.
