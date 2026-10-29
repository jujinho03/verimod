# W6 F RPC stability and E2/E3/E6 closure

기준일: 2026-10-29 KST

브랜치: `f-w6-rpc-stability-20261029`

기준 main: `f08b7208ec8dd82e57535523b256844858f5cd6a`

기존 후보 코드 커밋: `d241f79` (`OLD_CANDIDATE_MEASUREMENT`)

chain ID 수정 코드 커밋: `d90335b484ab9491f046434ac604d79426c4e648` (`FIXED_CANDIDATE_MEASUREMENT`)

이 후보는 `main`에 병합하지 않았고 체인 송신·DB 변경·정책 승인·LOCK·TEST 접근을 수행하지 않았다. 원본 RPC/브라우저 로그, trace, 화면 및 영상은 `private-data/`에만 보존하며 Git에 올리지 않는다.

## 결론

- 기존 후보: 동일 W4 Receipt **10/10 연속 VALID**, 회당 79 RPC. 원본 private 로그는 GitHub에 공개하지 않았고 A가 독립 재실행하지 않았으므로 `ORIGINAL_NOT_INDEPENDENTLY_VERIFIED`다.
- 수정 후보: 동일 W4 Receipt **8/10 VALID, 2/10 RPC_UNAVAILABLE**. 연속 10회 기준은 **NOT_MET**다.
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
2. A 보안 감사에서 성공한 chain ID를 reader 수명 동안 재사용하면 같은 endpoint의 chain 전환을 놓치는 회귀가 확인됐다.
3. 수정 후보는 성공 캐시를 제거하고 모든 논리 RPC 직전에 `eth_chainId`를 다시 확인한다.

승인 TrustProfile, publisher, `epochs()` getter, Event 단일성·중복 거부, Event/getter 교차 검증, transaction receipt의 status/to/blockNumber/blockHash, Event와 Receipt의 block number/hash 일치, root/count/version, confirmation, Merkle proof는 그대로다. 별도의 독립 canonical block 조회를 수행한다고 주장하지 않는다. 최근 블록만 조회하거나 receipt를 생략하지 않는다.

## 정량 결과

### OLD_CANDIDATE_MEASUREMENT — BASE 10회

- 10 PASS / 0 FAIL / 0 SKIP
- 회당 79 RPC: chainId 1, call 2, blockNumber 2, getLogs 73, receipt 1
- 10회 전체 429: 0, timeout: 0
- 최소 17.542초 / 최대 30.173초 / 평균 21.150초
- 코드상 기존 완주 740회 대비 관측 79회: 89.3% 감소
- 전체 deployment→head 범위와 모든 50,000-block 창을 읽음

초기에는 두 승인 hostname의 DNS 해석 실패가 발생해 1회와 별도 10회가 `RPC_UNAVAILABLE`이었다. 이 실패는 삭제하거나 PASS로 바꾸지 않았고, 네트워크가 복구된 후 새 10회 묶음을 처음부터 실행했다.

이 79-call 결과는 chain ID 성공 캐시가 있던 이전 코드의 역사적 측정이다. 수정 후보의 결과로 재사용하지 않는다.

### FIXED_CANDIDATE_MEASUREMENT — BASE 10회

실행 SHA `d90335b484ab9491f046434ac604d79426c4e648`에서 새로 10회를 실행했다.

- **8 VALID / 2 RPC_UNAVAILABLE / 0 SKIP** — 연속 10회 기준 `NOT_MET`
- 성공 회차: 회당 160 RPC (`eth_chainId` 80, `eth_call` 2, `eth_blockNumber` 2, `eth_getLogs` 75, receipt 1)
- 성공 회차 최소 11.367초 / 최대 12.886초 / 평균 12.148초
- 9·10회차에서 primary publicnode가 HTTP 429를 반환했다.
- backup `sepolia.base.org`는 같은 50,000-block `eth_getLogs`를 HTTP 413 (`-32614`, 200-block 제한)으로 거부했다.
- 전체 endpoint가 실패한 두 회차는 `RPC_UNAVAILABLE`로 닫혔다. Event window나 검증 단계를 생략하지 않았다.

### FIXED_CANDIDATE_MEASUREMENT — Rehash

| 입력 | 관측 | RPC |
|---|---|---:|
| 원본 | VALID 8/10, RPC_UNAVAILABLE 2/10 | 성공 시 160 |
| body 변경, claimed hash 유지 | HASH_MISMATCH | 0 |
| body 변경 후 hash 재계산, 기존 proof/root 유지 | INVALID_PROOF | 160 |

### FIXED_CANDIDATE_MEASUREMENT — Recovery

| 환경 | 초기 | route abort | 복구 | 복구 시간 |
|---|---|---|---|---:|
| Desktop | VALID | RPC_UNAVAILABLE | VALID | 14.634초 |
| Mobile emulation | VALID | RPC_UNAVAILABLE | VALID | 14.669초 |

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

이번 수정 실행에서 표준 `npm test`는 Windows sandbox의 Vitest SSR temp cache `ENOENT`로 `BLOCKED_ENVIRONMENT`였다. 같은 소스를 파일별로 격리 실행해 23 files, 255/255 PASS를 확인했으며 RPC reader는 11/11 PASS였다. lint는 기존 경고 2개와 함께 PASS, build와 `w5:typecheck`도 PASS였다. 기본 Playwright는 브라우저를 시작했으나 sandbox PTY가 완료 결과를 반환하지 않아 `BLOCKED_ENVIRONMENT`이며 PASS로 집계하지 않는다.

## T 독립 리뷰 요청

1. 성공 캐시 제거와 매 논리 RPC chain ID 재확인이 chain 전환을 fail-closed로 거부하는지 확인.
2. 정상, wrong-chain, 성공 후 전환, 일반 RPC 오류 후 전환, backup 전환, Event window 중 전환, 동시 호출, timeout/error 회귀 확인.
3. 50,000-block 창이 deployment→head 전체 범위와 서로 다른 창의 중복 Event 거부를 유지하는지 확인.
4. publisher/getter/Event/receipt/canonical block/root-count-version/confirmation/Merkle 호출이 남아 있는지 확인.
5. 실제 원본 private 로그를 공개하지 않고 요약 수치가 원본과 일치하는지 확인.

T 승인과 후보 SHA의 CI 전에는 병합하지 않는다.

## 남은 Blocker

- 주진호의 `CHANGES_REQUESTED` 해결 재검토와 독립 보안 리뷰.
- 후보 SHA의 GitHub CI.
- BASE 연속 10회는 수정 후보에서 8/10으로 **NOT_MET**.
- backup RPC는 50,000-block 전체 Event 조회 대체 경로가 아니다.
- Physical Mobile QA.
- 실제 Hardhat LOCAL.
- 전체 발표 녹화와 팀 수용.
