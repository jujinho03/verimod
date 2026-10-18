# W4 A → F: R01 호스트에서 새 발급 + freeze 실행 요청

필요 환경 담당: A / 주진호. F에는 선정 R01 가중치나 A Python 환경이 없습니다. F 호스트에서 알려진 AI-09 loopback health endpoint는 연결이 거부됐습니다. 서로 다른 컴퓨터의 localhost 주소는 독립적입니다.

A의 비공개 가중치와 오프라인 tokenizer cache가 이미 있는 같은 호스트에서 F 도구를 실행해 주십시오. 가중치는 비공개로 두고 두 HTTP 서비스 모두 loopback에만 둡니다. 도구는 새 A/F 프로세스를 시작하고, Git에서 제외되는 새 F SQLite를 쓰며, 실제 모델 receipt 2건을 만들고 그 DB를 freeze합니다. T sender를 import하거나 호출하지 않고, 트랜잭션에 서명하지 않으며, TEST 데이터에 접근하거나 체인 트랜잭션을 보내지 않습니다.

## 검증된 소스 요구사항

- A checkout HEAD: `9bcbec677d89d10364b327aae7e60955e2e4315d`, 추적 파일 변경 없음.
- F checkout: `backend/scripts/w4-final-integration.mts`가 들어 있는 공개 `f-w4-service-verifier` commit. 정확한 SHA를 `--expected-f-sha`로 넘기며 추적 파일 변경 없음.
- T source pin: `fbcb3e9e99ae8dda2f9c70a32f35ec2c039b73de`; F 저장소에 이 Git object가 있어야 합니다. 도구는 T를 checkout하거나 수정하지 않고 `git show`로 T 파일을 읽습니다.
- 기존 A 인터프리터: `ai/.venv/Scripts/python.exe` (Windows). 기존 Linux 환경이면 `--python`으로 직접 지정할 수 있습니다.
- A 고정 `service.py`의 선정 모델 디렉터리: `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model`.
- `model.safetensors` SHA-256: `a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f`. A loader는 config, manifest, 오프라인 tokenizer도 검증합니다. 다른 기존 모델 디렉터리는 `--model-dir`로 지정할 수 있으나, 같은 고정 가중치 hash가 필수입니다.

## A 호스트의 PowerShell 명령

검증된 A 저장소에서 실행합니다. **F Windows ESM 수정 보고서에 있는 새 F 전체 SHA**를 씁니다. 실패한 `c14fb914afa1d7c7f25fb5f6fb768e7b2ba7b628` detached worktree를 고치거나 재사용하지 않습니다. 수정된 commit을 fetch하고 새 detached checkout과 고유한 공개/비공개 디렉터리를 만듭니다. 아래 경로는 A의 실제 checkout에서 도출합니다.

```powershell
$aRoot = (Get-Location).Path
if ((git rev-parse HEAD).Trim() -ne '9bcbec677d89d10364b327aae7e60955e2e4315d') { throw 'Wrong A HEAD' }
git fetch origin
$fSha = '<NEW_F_FULL_SHA_FROM_F_REPORT>'
if ($fSha -notmatch '^[0-9a-f]{40}$') { throw 'Supply the exact fixed F SHA' }
if ($fSha -eq 'c14fb914afa1d7c7f25fb5f6fb768e7b2ba7b628') { throw 'Old failing F revision' }
if ((git rev-parse "$fSha^{commit}").Trim() -ne $fSha) { throw 'F commit not fetched' }
$runId = (Get-Date -Format 'yyyyMMdd-HHmmss') + '-' + [guid]::NewGuid().ToString('N').Substring(0,8)
$fRoot = Join-Path (Split-Path $aRoot -Parent) ('verimod-f-w4-fixed-' + $fSha.Substring(0,8) + '-' + $runId)
git worktree add --detach $fRoot $fSha
npm --prefix (Join-Path $fRoot 'backend') ci --ignore-scripts --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw 'F dependency installation failed' }
if ((node -p 'process.platform').Trim() -ne 'win32') { throw 'Windows host required for this smoke acceptance' }
npm --prefix (Join-Path $fRoot 'backend') run w4:windows-smoke
if ($LASTEXITCODE -ne 0) { throw 'Windows backend smoke must pass before actual R01 execution' }
$python = Join-Path $aRoot 'ai/.venv/Scripts/python.exe'
$modelDir = Join-Path $aRoot 'ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model'
if (-not (Test-Path -LiteralPath $python)) { throw 'Existing A Python environment required' }
if (-not (Test-Path -LiteralPath (Join-Path $modelDir 'model.safetensors'))) { throw 'Existing private R01 weight required' }
$publicDir = Join-Path $fRoot ('docs/evidence/w4-f-final-integration/' + $runId)
$privateDir = Join-Path $fRoot ('private-data/w4-f-final-integration/' + $runId)
node (Join-Path $fRoot 'backend/node_modules/tsx/dist/cli.mjs') (Join-Path $fRoot 'backend/scripts/w4-final-integration.mts') --a-root $aRoot --expected-f-sha $fSha --python $python --model-dir $modelDir --public-dir $publicDir --private-dir $privateDir
```

Windows smoke는 실제 Windows 호스트가 필요합니다. 다른 플랫폼에서는 테스트가 건너뛰어지며, 이는 **BLOCKED**이지 WINDOWS_PASS가 아닙니다. F는 Node v24.16.0 / tsx 4.23.13을 검증했습니다. runner의 첫 backend 시작과 SQLite 재개방은 모두 `scripts/backend-process.ts`를 호출하며, loader 인수는 `pathToFileURL(...).href`입니다. smoke 테스트는 같은 함수로 실제 서버 소스를 띄우며, 공백이 있는 드라이브 경로, 추론 서비스 없이 안전한 503/행 0, 같은 DB 재시작, timeout 정리, 진입점 실패 정리를 포함합니다. 이 smoke에는 모델 가중치나 추론 fixture를 쓰지 않습니다.

실제 추론 전에 모든 source pin, 선정 가중치 SHA-256, canonical Model/Policy Manifest hash, T 승인 `verimod-example-platform` issuer, 새 F SHA, Windows backend smoke가 통과해야 합니다. 실제 runner는 A/F/T와 model/policy identity를 따로 다시 검증하므로, smoke 통과만으로는 충족되지 않습니다.

## 이전 증거 보존

- A SHA `9bcbec677d89d10364b327aae7e60955e2e4315d`의 기존 A 독립 실제 R01 E2E 증거.
- F의 `docs/evidence/w4-f-final-integration/20261016-r01/` 준비 증거.
- A 호스트에서 실패한 실행 `20261016-150318-a-r01`과 기존 공개/비공개 디렉터리·로그. A 보고에 따르면 모델/tokenizer/Python 준비는 성공했고, 이후 `/infer`·receipt·freeze 전에 Windows `--import` 드라이브 경로 ESM 파싱이 실패했습니다. 이는 A가 제공한 실패 설명이며, F는 A의 비공개 가중치로 독립 재실행하지 않았습니다.

시도할 때마다 새 디렉터리를 씁니다. 실패한 checkout과 로그는 보존하며, 그 자리에서 덮어쓰거나 삭제하거나 고치지 않습니다.

도구는 `VERIMOD_W4_PROVISIONAL_E2E_ONLY=true`, 검증된 loopback 추론 URL, F manifest 경로 2개, policy hash, threshold `24495/216950`와 `180483/646501`, 새 `VERIMOD_DB_PATH`를 설정합니다. 정책은 계속 `team_approved=false`이고 X/B는 대기 중입니다. 실제 서비스 health/가중치 identity를 검증하고 HTTP 추론 호출 2회를 관측하며, replay/409는 호출을 추가하면 안 됩니다.

## 공개 산출물만 반환

성공하면 새 공개 디렉터리에 `execution-status.json`, 앵커되지 않은 공개 bundle 파일 2개, `frozen-epoch-handoff.json`이 생깁니다. 여기에는 정확한 source SHA, 실제 epoch/root/count/member 순서, model/policy identity, health/forward 증거, hash/root 재계산, replay/EMPTY_EPOCH, SQLite 재시작 검사가 들어 있습니다. 비공개 디렉터리에는 DB, 원시 발급 응답, 프로세스 로그가 남습니다. 비공개 디렉터리는 업로드하거나 전달하지 않습니다.

preflight나 실행 중 실패는 BLOCKED 보고서를 만들며, 가짜 handoff를 채우지 않습니다. `--preflight-only`는 **다른 새** 공개 디렉터리와 함께 쓸 수 있으며, exit code 2는 실제 발급/freeze가 없었다는 뜻입니다. 이전 실행 디렉터리는 모두 보존합니다.

유효한 frozen handoff를 반환해도 송신 승인은 아닙니다. T는 `W4-F-prebroadcast-durability.md`에 설명된 F 송신 전 durability callback을 연결해야 하며, 이후 송신 전에 팀이 이 provisional 정책 epoch를 승인해야 합니다.
