# W6 AI-19 physical-offline runner (A / 주진호).
# Thin wrapper around ai19_probe.py. It does NOT change Wi-Fi, Ethernet, VPN,
# firewall, or execution policy. Disconnect all external networks yourself first.
# If your execution policy blocks .ps1 files, do not bypass it: run the single
# python command printed in README.md instead (identical behavior).
$ErrorActionPreference = 'Continue'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = (Resolve-Path (Join-Path $here '..\..\..')).Path
$python = Join-Path $root 'ai\.venv\Scripts\python.exe'
$probe = Join-Path $here 'ai19_probe.py'
$env:HF_HUB_OFFLINE = '1'
$env:TRANSFORMERS_OFFLINE = '1'
Set-Location $root
Write-Host "[AI-19] repo=$root"
Write-Host "[AI-19] running physical-offline probe (about 1 minute)..."
& $python -B $probe --mode physical-offline
$code = $LASTEXITCODE
Write-Host "[AI-19] exit=$code  (0 = all checks OK incl. verified isolation; 2 = see JSON)"
Write-Host "[AI-19] results are in $here (physical-offline-result*.json, server-physical-offline-*.log)"
exit $code
