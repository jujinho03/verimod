# W4 A → F: run new issuance + freeze on the R01 host

Owner of required environment: A / 주진호. F has no local selected R01 weights or A Python environment. The known AI-09 loopback health endpoint on the F host refused connection. Localhost addresses on different computers are independent.

Please execute the F tool on the same host that already holds A's private weights and offline tokenizer cache. Keep weights private and both HTTP services on loopback. The tool starts fresh A/F processes, uses a fresh ignored F SQLite, creates two actual-model receipts and freezes that database. It never imports or invokes the T sender, signs transactions, accesses TEST data or sends chain transactions.

## Verified source requirements

- A checkout HEAD: `9bcbec677d89d10364b327aae7e60955e2e4315d` with no tracked changes.
- F checkout: the published `f-w4-service-verifier` commit containing `backend/scripts/w4-final-integration.mts`, with its exact SHA supplied as `--expected-f-sha` and no tracked changes.
- T source pin: `fbcb3e9e99ae8dda2f9c70a32f35ec2c039b73de`; the F repository must contain this Git object. The tool reads T files with `git show`, without checking out or editing T.
- Existing A interpreter: `ai/.venv/Scripts/python.exe` (Windows). The existing Linux environment may instead supply `--python` explicitly.
- The selected model directory from A's pinned `service.py`: `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model`.
- `model.safetensors` SHA-256: `a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f`. A's loader also validates config, manifest and offline tokenizer. An existing alternate model directory may be supplied with `--model-dir`; the same pinned weight hash is mandatory.

## PowerShell commands on A's host

Run from the verified A repository. Use the **new full F SHA in F's Windows ESM fix report**. Do not patch or reuse the failed `c14fb914afa1d7c7f25fb5f6fb768e7b2ba7b628` detached worktree. Fetch the fixed commit and create a new detached checkout and unique public/private directories. The paths below are derived from A's actual checkout.

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

The Windows smoke requires an actual Windows host (on other platforms its tests are skipped, which is **BLOCKED**, never WINDOWS_PASS). F verified Node v24.16.0 / tsx 4.23.13. The runner's first backend start and SQLite reopen both call `scripts/backend-process.ts`: the loader argument is `pathToFileURL(...).href`. Smoke tests launch the actual server source using this same function, including a drive path with spaces, safe 503/zero rows without an inference service, same-DB restart, timeout cleanup and entry-point failure cleanup. No model weights or inference fixtures are used for this smoke.

Before actual inference, all source pins, selected weight SHA-256, canonical Model/Policy Manifest hashes, T-approved `verimod-example-platform` issuer, new F SHA and Windows backend smoke must pass. The actual runner still verifies A/F/T and model/policy identity independently; passing smoke alone does not satisfy them.

## Preserve earlier evidence

- A's existing independent actual R01 E2E evidence at A SHA `9bcbec677d89d10364b327aae7e60955e2e4315d`.
- F's `docs/evidence/w4-f-final-integration/20261016-r01/` preparation evidence.
- A-host failed run `20261016-150318-a-r01`, including its existing public/private directories and logs. A reported model/tokenizer/Python readiness succeeded, then Windows `--import` drive-path ESM parsing failed before any `/infer`, receipt or freeze. This report comes from A's supplied failure description; F has not independently rerun A's private weights.

Use new directories for every attempt. Preserve the failed checkout and logs; do not overwrite, delete or repair that checkout in place.

The tool sets `VERIMOD_W4_PROVISIONAL_E2E_ONLY=true`, the verified loopback inference URL, both F manifest paths, policy hash, thresholds `24495/216950` and `180483/646501`, and the fresh `VERIMOD_DB_PATH`. The policy remains `team_approved=false`, X/B pending. It validates actual service health/weight identity and observes two HTTP inference calls; replay/409 must add no calls.

## Return only the public artifacts

On success the new public directory contains `execution-status.json`, two unanchored public bundle files, and `frozen-epoch-handoff.json`. They include exact source SHAs, actual epoch/root/count/member order, model/policy identity, health/forward evidence, hash/root recomputation, replay/EMPTY_EPOCH and SQLite restart checks. The private directory retains the database, raw issuance responses and process logs. Do not upload or forward that private directory.

A preflight or runtime failure produces a BLOCKED report and never fills a fake handoff. `--preflight-only` may be used with a **different new** public directory; exit code 2 means no actual issuance/freeze occurred. Preserve every previous run directory.

Returning a valid frozen handoff does not authorize sending. T must connect the F pre-broadcast durability callback described in `W4-F-prebroadcast-durability.md`, and the team must authorize this provisional-policy epoch before any later transmission.
