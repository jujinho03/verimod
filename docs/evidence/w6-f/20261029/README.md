# W6 F RPC stability and E2/E3/E6 closure

기준일: 2026-10-29 KST

브랜치: `f-w6-rpc-stability-20261029`

기준 main: `f08b7208ec8dd82e57535523b256844858f5cd6a`

코드 커밋: `d241f79`

이 후보는 `main`에 병합하지 않았고 체인 송신·DB 변경·정책 승인·LOCK·TEST 접근을 수행하지 않았다. 원본 RPC/브라우저 로그, trace, 화면 및 영상은 `private-data/`에만 보존하며 Git에 올리지 않는다.

## 결론

- BASE Core RPC: 동일 W4 Receipt로 **10/10 연속 VALID**.
- Rehash: 본문만 변경하면 `HASH_MISMATCH`; 규격대로 hash를 다시 계산하고 기존 proof/root를 유지하면 실제 공개 원장에서 `INVALID_PROOF`.
- Recovery: Desktop과 Mobile emulation 모두 `VALID → RPC_UNAVAILABLE → VALID`.
- Physical Mobile: **NOT_EXECUTED**.
- 실제 Hardhat LOCAL: **NOT_VERIFIED**. `SYNTHETIC_LOCAL`은 브라우저 Mock 원장이다.
- RECORDED: Desktop recovery WebM을 로컬 생성했고 FFmpeg frame extraction으로 디코딩을 확인했다. 전체 발표 영상은 아직 없다.

기계 판독 요약은 [rpc-stability-validation.json](rpc-stability-validation.json)에 있다.

## 병목과 최소 변경

기존 reader는 모든 논리 RPC 앞에서 `eth_chainId`를 다시 호출하고, deployment block부터 head까지 10,000-block 창으로 `eth_getLogs`를 수행했다. 2026-10-29 관측 head에서 완주 시 코드상 약 740 HTTP 요청이 필요하다. A의 역사적 기준은 2/10 VALID였고 실패한 마지막 회차도 114 POST에서 끝났다.

후보는 다음만 변경한다.

1. 전체 Event 범위를 유지하면서 publicnode 허용 상한 내 50,000-block 창을 사용한다.
2. 한 verification reader 안에서 성공한 endpoint chain identity만 재사용한다.
3. chain 확인 실패는 즉시 캐시에서 제거한다.

승인 TrustProfile, publisher, `epochs()` getter, Event 단일성·중복 거부, Event/getter 교차 검증, transaction receipt, canonical block, root/count/version, confirmation, Merkle proof는 그대로다. 최근 블록만 조회하거나 receipt를 생략하지 않는다.

## 정량 결과

### BASE 10회

- 10 PASS / 0 FAIL / 0 SKIP
- 회당 79 RPC: chainId 1, call 2, blockNumber 2, getLogs 73, receipt 1
- 10회 전체 429: 0, timeout: 0
- 최소 17.542초 / 최대 30.173초 / 평균 21.150초
- 코드상 기존 완주 740회 대비 관측 79회: 89.3% 감소
- 전체 deployment→head 범위와 모든 50,000-block 창을 읽음

초기에는 두 승인 hostname의 DNS 해석 실패가 발생해 1회와 별도 10회가 `RPC_UNAVAILABLE`이었다. 이 실패는 삭제하거나 PASS로 바꾸지 않았고, 네트워크가 복구된 후 새 10회 묶음을 처음부터 실행했다.

### Rehash

| 입력 | 관측 | RPC |
|---|---|---:|
| 원본 | VALID | BASE 10/10 |
| body 변경, claimed hash 유지 | HASH_MISMATCH | 0 |
| body 변경 후 hash 재계산, 기존 proof/root 유지 | INVALID_PROOF | 79 |

### Recovery

| 환경 | 초기 | route abort | 복구 | 복구 시간 |
|---|---|---|---|---:|
| Desktop | VALID | RPC_UNAVAILABLE | VALID | 17.064초 |
| Mobile emulation | VALID | RPC_UNAVAILABLE | VALID | 18.088초 |

장애는 두 승인 RPC hostname에 대한 Playwright `route.abort('internetdisconnected')`이며 물리 네트워크 차단이 아니다. Mobile emulation을 실기기로 표시하지 않는다.

## 실행 명령

PowerShell:

```powershell
cd frontend
$env:W6_RPC_AUDIT_ATTEMPTS='10'
$env:W6_RPC_AUDIT_SCENARIO='VALID'
$env:W6_RPC_AUDIT_RUN_ID='20261029-optimized-base10-rerun'
npm run w6:rpc-audit

$env:W6_RECOVERY_RUN_ID='20261029-rpc-recovery-opt-retry'
npm run w6:rpc-recovery
```

회귀:

```powershell
npm test
npm run lint
npm run build
npm run w5:typecheck
npm run test:browser
```

Windows sandbox의 Vitest SSR temp cache `ENOENT`가 발생하면 저장소 내부의 무시되는 `node_modules/.tmp`를 TEMP/TMP로 지정해 같은 소스를 다시 실행한다. 이번 재실행은 23 files, 251/251 PASS였다.

## T 독립 리뷰 요청

1. 성공한 chain ID 확인의 reader-local 재사용이 TrustProfile을 약화하지 않는지 확인.
2. 실패한 chain check가 캐시되지 않는 7/7 회귀 확인.
3. 50,000-block 창이 deployment→head 전체 범위와 서로 다른 창의 중복 Event 거부를 유지하는지 확인.
4. publisher/getter/Event/receipt/canonical block/root-count-version/confirmation/Merkle 호출이 남아 있는지 확인.
5. 실제 원본 private 로그를 공개하지 않고 요약 수치가 원본과 일치하는지 확인.

T 승인과 후보 SHA의 CI 전에는 병합하지 않는다.

## 남은 Blocker

- T 독립 보안 리뷰와 GitHub `APPROVED`.
- 후보 SHA의 GitHub CI.
- Physical Mobile QA.
- 실제 Hardhat LOCAL.
- 전체 발표 녹화와 팀 수용.
