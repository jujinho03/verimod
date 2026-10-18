# W4 F — R01 manifest 신뢰 수정 (2026-10-16)

상태: **F 로컬 회귀 PASS. 실제 Python R01 재실행과 A 독립 검증은 대기 중이며 GATE-4는 PASS가 아닙니다.** 담당: 노유신 (F). 브랜치: `f-w4-service-verifier`.

## 원인과 변경

A의 고정 실제 E2E(`a-w4-ai09-actual-inference`, `b8c44dff`)에서 형식은 맞지만 승인되지 않은 model hash와 임의의 policy hash가 각각 HTTP 201과 새 Decision 1건을 만들었습니다. `backend/src/inference.ts`는 model hash의 형태만 검사했고, 관련 없는 threshold 옆에 놓인 policy hash를 그대로 받았습니다.

- `backend/src/inference.ts`: 설정된 R01 Model Manifest를 T의 `canonicalBytes`와 `domainHash(DOMAINS.model, ...)`로 canonical hash하고, 고정 R01 hash를 요구하며, 모든 추론 응답을 이 hash와 대조합니다. 출력은 taxonomy/version `verimod-ko-beep-hate/1`, 정확히 `hate`와 `offensive` 점수, `UNCALIBRATED`여야 하며, 기존 UUID·commitment·점수 범위·timestamp 검사도 유지합니다. 이 hash는 identity 결합이며, 실제로 어떤 모델이 실행됐는지 증명하지는 않습니다.
- `backend/src/inference.ts`: 설정된 W4 Policy Manifest를 `DOMAINS.policy`로 canonical hash하고, 고정 hash를 요구하며, 활성 threshold 4개를 모두 비교하고, `>=`·우선순위·TRUNCATED override·reason/rule 매핑·ALLOW 출력을 묶습니다. 평가할 때마다 매번 검사하므로 평가기 생성 후의 변조도 fail-closed됩니다.
- `backend/src/issuance.ts`, `app.ts`, `server.ts`: 신뢰된 Model Manifest를 발급 경로로 넘겨 정책 평가나 저장 전에 검증합니다. provisional 정책은 `VERIMOD_W4_PROVISIONAL_E2E_ONLY=true`, 명시적인 manifest 경로 2개, loopback 추론 URL을 요구합니다. 서버는 loopback에서만 listen합니다. 설정이 없거나 틀리면 기존 route를 통해 HTTP 503을 반환합니다.
- `backend/config/`: A의 model/policy manifest를 그대로 복사한 F 소유 snapshot입니다. A 브랜치 파일은 건드리지 않았습니다. `backend/README.md`에 기술 시험 전용 런타임 설정을 기록했습니다.

정책은 계속 `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`이며 X/B와 팀 결정은 대기 중입니다. W5 LOCK이나 체인 송신은 시도하지 않았습니다.

## 회귀 증거

`backend`: `npm run typecheck` PASS; `npm test -- --reporter=dot` **51/51 PASS, 7/7 파일**; `npm run build` PASS. Windows에서는 Vitest sandbox의 기본 임시 경로가 모듈 로딩 중 `ENOENT`를 내서, 테스트 명령의 `TEMP`와 `TMP`를 로컬 작업 공간 임시 폴더로 지정했습니다.

A의 정책 벡터 21개를 그대로 `backend/test/fixtures/w4-a-policy-vectors.json`에 복사했고, F 평가기가 21개 기대 출력과 모두 정확히 일치했습니다. 이는 기록된 A/Python 기대 벡터에 대한 로컬 재실행이며, Python을 새로 실행한 것이 아닙니다.

`backend/test/w4-manifest-boundary.test.ts`는 아래 실패 사례에 대해 HTTP route와 SQLite를 실제로 거칩니다. **모든 행이 503 / `INFERENCE_UNAVAILABLE`을 반환했고 Decision, anchor 후보, content_store, epoch, idempotency 변화량이 모두 0이었습니다.** 실패 응답에 정책 조치나 가짜 점수는 나타나지 않았습니다.

| 실패 사례 | HTTP | DB 변화량 |
| --- | ---: | --- |
| Model manifest 없음 | 503 | 모두 0 |
| 기존 hash로 Model manifest 내용 변경 | 503 | 모두 0 |
| Model hash 형식 오류 | 503 | 모두 0 |
| 형식은 맞지만 미승인 model hash (A FAIL-01) | 503 | 모두 0 |
| 잘못된 content commitment | 503 | 모두 0 |
| 점수 범위 초과 | 503 | 모두 0 |
| Taxonomy version 변경 | 503 | 모두 0 |
| Score semantics 변경 | 503 | 모두 0 |
| 정책 없음 | 503 | 모두 0 |
| 형식은 맞지만 결합되지 않은 policy hash (A FAIL-02) | 503 | 모두 0 |
| 고정 policy hash 상태에서 threshold 하나 변경 | 503 | 모두 0 |
| 기존 hash로 Policy manifest 내용 변경 | 503 | 모두 0 |
| Provisional 로컬 E2E gate 비활성 | 503 | 모두 0 |
| Provider 중단 (모의 adapter 실패) | 503 | 모두 0 |
| Provider timeout (모의 adapter 실패) | 503 | 모두 0 |

정상 발급 테스트는 고정 manifest identity로 통과했습니다. 추가 receipt 2건은 A 실제 보고서의 점수 쌍(FULL `3364/12979`, TRUNCATED `31479/102538`)을 로컬 fixture adapter로 넣어 만들었습니다. ALLOW / HUMAN_REVIEW, commitment, canonical receipt hash, 공개/비공개 분리, replay, payload 변경 시 409, durable Decision 2건이 있는 SQLite 재개방을 확인했습니다. 이는 **기록된 점수 fixture 재생**이며 R01 Python 추론을 새로 한 것이 아닙니다.

## 남은 외부 확인

이 F checkout에서는 실제 R01 Python 서비스를 띄울 수 없었습니다. A 브랜치가 서버 스크립트와 manifest를 추적하지만, 이 작업 공간에는 R01 `safetensors` 가중치나 A `.venv` 런타임이 없습니다. 따라서 실제 모델 receipt 2건 재실행, 실제 Python 중단/timeout 결함, 갱신된 F commit에 대한 A의 독립 재실행은 **BLOCKED**입니다. A의 기존 `verify_w4_af_e2e.mts`는 이전 F SHA를 고정하므로, A가 A 소유 작업에서 그 pin을 바꾸고 새 F commit으로 실행해야 합니다. 이전 실패 증거는 A 브랜치에 보존돼 있습니다.

Issuer 정렬은 **UNRESOLVED**입니다. F receipt는 `verimod-example-platform`을 쓰고, T의 승인 `BASE_SEPOLIA_DEMO` TrustProfile은 `verimod-demo-issuer`를 씁니다. F는 어느 identity도 바꾸지 않았습니다. F와 T가 authoritative 값을 합의한 뒤 receipt를 새로 발급하고, issuer commitment·receipt hash·profile 일치·불일치 시 bundle 거부를 검증해야 합니다.

최종 commit SHA와 push URL은 공개 후 Git commit / 브랜치 링크에 기록합니다. 이 보고서는 외부 승인이나 GATE-4 완료를 주장하지 않습니다.
