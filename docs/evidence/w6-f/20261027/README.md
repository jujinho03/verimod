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

## 회귀

- Frontend: 250 PASS; build/typecheck/lint PASS(기존 warning 2)
- 기본 Playwright protocol browser: 1 PASS
- Backend: 153 PASS, 53 SKIP, 0 FAIL; typecheck/build PASS
- W4 public evidence Git tree: `1911f46c9e19000d25a7ffb5f86f1c2ba781a1ee` (origin/main과 동일)
- 실제 체인 송신, LOCK, TEST 접근, 정책 변경: 없음

기계 판독 요약은 [validation.json](validation.json), 담당자 판정은 [W6-F 진행 기록](../../../progress/W6-F.md)을 따른다.
