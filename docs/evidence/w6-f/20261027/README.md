# W6 F evidence — 2026-10-27

이 디렉터리는 W6 F 실행의 공개 가능한 요약만 담는다. 브라우저 trace와 screenshot 원본은 `private-data/`에 두며 원문, salt, 키, DB를 포함하지 않는다.

## 핵심 관측

- 기준 SHA: `efce466df24c916fb2be1bf075176137fd4c4332`
- 실제 공개 profile: `BASE_SEPOLIA_DEMO`
- 동일 W4 bundle SHA-256: `0b73aa5285934b097c8d4aa564021c64ff5173ac555a3b4c1e61c92085f52235`
- 실제 성공 순서: `VALID → RPC_UNAVAILABLE → VALID`
- 실제 차단 endpoint: `base-sepolia-rpc.publicnode.com`, `sepolia.base.org`
- 초기/복구 RPC 재시도: 0/0
- body action 변경: `HASH_MISMATCH`
- body 재해시 후 기존 proof: 이번 반복 환경에서는 공개 RPC 불가로 `INVALID_PROOF`까지 도달하지 못함(BLOCKED)

성공 1회 뒤의 반복 실행에서 공개 RPC가 복구되지 않은 사례도 보존한다. 따라서 E3와 F4는 PASS가 아니라 PARTIAL이며 BASE 10회 KPI도 미충족이다.

## T+F 공동 재실측 준비 및 환경 진단

공동 실측을 기존 W5 30/30 회귀와 섞지 않도록 `npm run w6:rpc-recovery` 전용 명령과 `private-data/w6-f-rpc-recovery/<run-id>/` 증거 경로를 추가했다. 이 도구는 Desktop과 Mobile emulation을 별도 project로 실행하고, 동일 W4 Receipt의 `VALID → RPC_UNAVAILABLE → VALID` 상태, 두 승인 RPC host의 request/response/failure, 100초 시점 UI 상태, 스크린샷 및 Playwright trace를 기록한다. 장애 주입은 두 URL에 대한 Playwright route abort이며 물리 네트워크 차단이 아니다. Mobile project도 실기기가 아닌 emulation으로 명시한다.

이번 재실행에서는 제품 판정에 도달하기 전에 실행 환경이 차단됐다.

- shell Playwright: 브라우저에서 localhost 접근 거부/종료
- 인앱 브라우저: `http://127.0.0.1:4187/verify`에 `ERR_CONNECTION_TIMED_OUT`
- 격리 브라우저: HTTPS 가상 origin에서 UI는 구동됐으나 두 공개 RPC host 모두 `ERR_NAME_NOT_RESOLVED`; 장애 주입 단계는 `ERR_INTERNET_DISCONNECTED`로 구별됨

따라서 새 Desktop/Mobile 결과는 `BLOCKED_ENVIRONMENT`이며, 기존 Desktop 1회 PASS를 새 공동 재실측 PASS로 재분류하지 않는다. Mobile 100초 초과의 제품 원인은 이 환경에서 확정할 수 없다. 관측상 이번 차단은 UI 상태·재시도 이전의 localhost/DNS 계층이다. BASE 10회와 LOCAL 3회 연속 시연은 실행하지 않았다.

재실행 명령:

```powershell
$env:W6_RECOVERY_RUN_ID = '<unique-run-id>'
$env:W6_BROWSER_CHANNEL = 'msedge'
npm run w6:rpc-recovery
```

## 회귀

- Frontend: 250 PASS; build/typecheck/lint PASS(기존 warning 2)
- 기본 Playwright protocol browser: 1 PASS
- Backend: 153 PASS, 53 SKIP, 0 FAIL; typecheck/build PASS
- W4 public evidence Git tree: `1911f46c9e19000d25a7ffb5f86f1c2ba781a1ee` (origin/main과 동일)
- 실제 체인 송신, LOCK, TEST 접근, 정책 변경: 없음

기계 판독 요약은 [validation.json](validation.json), 담당자 판정은 [W6-F 진행 기록](../../../progress/W6-F.md)을 따른다.
