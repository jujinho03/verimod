# W4 F Windows ESM 실행 수정 — 2026-10-16

범위: F runner, 공유 프로세스 launcher, 회귀 테스트, A 인계 문서. 정책은 계속 `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`이며 X/B 승인은 대기 중입니다. 추론/manifest/issuer/canonical hash/Merkle/sender 구현은 바꾸지 않았습니다.

## Windows에서 관측한 내용

호스트 런타임: `win32`, Node `v24.16.0`, tsx `4.23.13`. 기준 F revision: `c14fb914afa1d7c7f25fb5f6fb768e7b2ba7b628`. A pin: `9bcbec677d89d10364b327aae7e60955e2e4315d`. T pin: `fbcb3e9e99ae8dda2f9c70a32f35ec2c039b73de`.

기존처럼 Windows 절대 경로를 loader로 넘기면 `ERR_UNSUPPORTED_ESM_URL_SCHEME`과 exit 1이 재현됩니다. 공유 launcher는 이제 그 경로를 `pathToFileURL(...).href`로 변환합니다. 실제 설치된 tsx는 `--import`로 TypeScript 서버를 정상 로드하므로, 이 런타임에서는 CLI 대체 경로가 필요 없습니다.

`windows-smoke.jsonl`에는 별도 smoke 명령의 시각별 관측이 들어 있습니다. 테스트는 실제 서버 소스와 설치된 tsx를 공백이 포함된 소유 드라이브 경로로 복사하고, 나머지 설치 의존성은 실제 backend 상위 디렉터리에서 해석합니다. Windows junction 권한이 필요 없습니다. 모델이나 추론 fixture는 쓰지 않습니다. 각 테스트는 자기 임시 디렉터리만 삭제합니다.

| 검사 | 결과 |
|---|---|
| 기존 ESM 오류 재현 | 재현됨 |
| 첫 child 시작 / HTTP health | PASS / 200 |
| 모델 없는 판정 요청 | 503; receipt/content/epoch/member/idempotency 행 0 |
| Anchor 후보 | 0 (receipt가 없음) |
| 종료 / 포트 해제 | PASS |
| 같은 SQLite 재개방 / backend 재시작 | PASS / health 200 / decision 503 / 행 0 |
| 드라이브 경로·공백 / 인코딩된 file URL | PASS |
| 준비 timeout 정리 | PASS; child 종료, listening 포트 재바인딩 |
| 진입점 실패 정리 | PASS; child 종료, 포트 재바인딩 |

실제 runner의 두 호출(첫 시작과 `f-backend-reopened`)은 모두 `backend/scripts/backend-process.ts`의 같은 `launchBackend`를 부릅니다. smoke도 같은 함수를 import합니다. backend 준비가 실패하면 child를 멈추고, runner의 마지막 정리도 소유한 child를 모두 멈춥니다. 종료는 제한 시간 안의 정상 대기 후 강제 종료로 넘어갑니다.

## 검증

- `npm run w4:windows-smoke`: **4/4 PASS**, 테스트 파일 1개. 시작/재시작 테스트는 두 단계를 따로 관측합니다.
- `npm run typecheck`: PASS.
- `npm run w4:typecheck`: PASS.
- `npm run build`: PASS.
- `npm test`: **68/68 PASS**, 9개 파일: 기존 64개 + Windows 프로세스 테스트 4개. 기존 manifest 거부와 정책 parity 테스트도 그대로 있습니다.
- `validation.json`에 명령, 건수, 시험한 소스 SHA-256을 기록했습니다. Windows 로그에는 모델, 비공개 원문/salt, 서명된 트랜잭션, 비공개 DB 경로가 없습니다.
- `f-revision-preflight.json`에는 커밋된 수정의 `--expected-f-sha`와 커밋 도구 검사를 기록했습니다. 나머지 A 환경 검사는 이 F 호스트에 실제 R01 환경이 없어 BLOCKED입니다. 이 preflight에서 exit 2는 예상된 결과입니다.

## A 재실행과 남은 작업

`READY_FOR_A_HOST_RERUN=YES`는 검증한 런타임에서 Windows 실행 차단이 해소됐다는 뜻입니다. A의 실제 R01 재실행을 보증하지는 않습니다. `docs/handoffs/W4-F-actual-host-run-request.md`에 따라 새로 공개된 F 전체 SHA를 정확히 지정해 fetch하고, **새 detached worktree**와 고유 실행 디렉터리를 만든 뒤 먼저 그곳에서 Windows smoke를 다시 실행합니다. A는 추론 전에 고정 가중치, 오프라인 tokenizer, manifest, issuer, A/F/T revision을 검증해야 합니다.

A의 독립 E2E 증거, F의 `20261016-r01` 통합 준비, A의 실패한 `20261016-150318-a-r01` 실행을 보존합니다. A의 실패 설명은 사용자가 제공한 것이며, F는 A의 비공개 모델 산출물을 확인하거나 재실행하지 않았습니다.

실제 성공으로 인정하려면 다음이 모두 필요합니다. FULL/TRUNCATED R01 receipt 2건, 같은 F SQLite에서의 freeze, 정확한 root/count/member, 독립 Merkle 재계산, freeze replay, EMPTY_EPOCH, SQLite 재개방, `frozen-epoch-handoff.json`.

`ACTUAL_R01_ISSUANCE=NOT_RERUN_ON_F_HOST`; `EPOCH_FREEZE=PENDING_A_HOST`; `T_SENDER_DURABILITY=BLOCKED`; `PUBLIC_CHAIN_TX_SENT=NO`. 모델 재학습, TEST 데이터셋 접근, 정책 LOCK, W3 frozen 자료 변경, 체인 서명/송신, 실제 epoch 송신, 브랜치 병합, W5 작업은 하지 않았습니다.
