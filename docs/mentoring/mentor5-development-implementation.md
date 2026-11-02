# Mentor 5 기술 개발 및 검증 기록

## 2026-11-02 후속 실행 및 구현

- **실제 R01 발급:** 기준 HEAD `e540c7a1e26e445f64cda9f676059479b2c4830f`에서 별도 검증기 변경이 존재하는 worktree로 실행했다. 발급 관련 소스는 기준 HEAD와 같았다. 격리 DB에서 브라우저→Node→고정 artifact 검증을 거친 R01의 최초 발급은 HTTP 201 / `PENDING_ANCHOR`, 모델 중단은 HTTP 503 / `INFERENCE_UNAVAILABLE` 및 receipts `1→1`, 재기동 후 발급은 HTTP 201 및 `1→2`였다. 두 GET endpoint는 각 발급에 대해 200이었다. 두 신규 영수증과 W4 원본 두 건, manifest 재계산 및 backend 상수의 모델·정책 해시는 각각 MATCH. [실행·ID·hash](../evidence/mentor5-w7-live-receipt-verification.md). 새 실행이며 PR #42의 과거 영수증을 소급 확인한 것은 아니다.
- **24초 안내와 취소:** 코드 커밋 `ee64cee`. 24초는 강제 종료가 아닌 안내다. 실행별 AbortController를 사용해 사용자 중단, 입력·profile 변경, 페이지 이탈 시 이전 RPC fetch와 후속 endpoint 재시도를 중단한다. 늦은 결과는 표시하지 않으며 중단 자체는 검증 결과가 아니다. 개별 RPC 5초 timeout은 유지한다. 계속 기다리면 24초 이후에도 정상 결과를 받을 수 있고, 공개 증거는 사용자가 명시적으로 선택한다. 제어된 Chromium native fetch와 loopback 서버에서 연결 종료를 검증했으며 공개 RPC 네트워크 중단 실측은 아니다.
- **실제 공개 RPC:** 후속 reader에서 원본 `VALID` 1회, 22,910ms / 224요청. [별도 실측](../evidence/mentor5-followup-rpc-valid.md). W4 변조 `INVALID_PROOF`는 아래 최초 측정, 장애·복구 및 취소 경로는 통제된 테스트로 구분한다. 단일 표본으로 최적화 달성이나 24초 보장을 주장하지 않는다.
- **보호 경계:** W4 공개 증거 tree `1911f46c9e19000d25a7ffb5f86f1c2ba781a1ee`를 유지한다. 전역 로그 검색·chain ID·TrustProfile을 완화하지 않았고, 새 온체인 송신·배포·기존 DB 변경·TEST 개봉·PPT/대본 수정은 하지 않았다.

| 후속 검증 | 결과 |
| --- | --- |
| 실제 신규 Receipt verifier | PASS: 두 신규 bundle을 재구성해 `PENDING_ANCHOR`, 원장 호출 0. 발급 API의 상태와 별도 확인. |
| Frontend `npm test -- --maxWorkers=2` | PASS: 264 passed, SKIP 0. |
| Frontend `npm run test:browser` | PASS: 14 passed, SKIP 0. 공개 RPC 응답은 mock이며 native fetch 중단은 loopback 연결에서 관측. |
| Frontend `npm run lint`, `npm run build` | PASS: 기존 lint 경고 2건. |
| Backend `npm test`, `npm run typecheck`, `npm run build` | PASS: 테스트 160 passed, 53 skipped; SKIP 별도. |
| Contracts `npm test`, `npm run build` | PASS: 격리 Hardhat 테스트 18 passed. |
| 공개 RPC 실제 장애 복구·BASE 10회 연속 | NOT_VERIFIED: 통제된 장애 복구 테스트와 구분한다. |

신규 의존성을 설치하거나 취약점 일괄 업그레이드를 수행하지 않았다. 아래 npm audit 수치는 이전 설치 당시 기록이다. Git의 기존 CRLF blob을 보존했으므로 변경 공백 검사는 `git -c core.whitespace=cr-at-eol diff --check`로 실시한다. CI 및 최종 커밋은 PR에서 확인한다.

아래는 **후속 작업 전 PR #45의 역사적 실행 기록**이며 당시의 W7 미확보·취소 미구현 및 테스트 결과를 소급 변경하지 않는다. 현재 후속 검증 결과는 위와 최신 PR CI를 따른다.

기록일 2026-11-02. 개발 책임·의사결정: 주진호(A), 이번 작업 단독 수행. 과거 A/F/T 분담은 이력으로만 유지한다. 기준 `origin/main`은 `7a6aa2ad27ad58d0454b39f28a07d069ac4e93b1`, 당시 [CI 41189057863](https://github.com/jujinho03/verimod/actions/runs/41189057863)은 성공이다. 이 CI는 이 브랜치의 변경을 검증하지 않는다. 코드·회귀 커밋은 `b8a0168`; 문서 커밋과 새 CI는 브랜치의 `git log`와 PR에서 확인한다. 교수님의 회신 원문은 첨부에서 독립 확인되지 않아 사용자 지시를 요구사항으로 취급했다. [입력 검토](../evidence/mentor5-input-review.md).

## 구현과 보류

- 검증 화면의 단계를 실제 순서에 맞추고 RPC 실패 뒤 포함 증명은 미실행으로 표시했다. 프로필 전환 직후의 비동기 입력이 이전 effect에 취소되는 경합도 수정했다. 테스트는 로컬 해시 불일치, rehash 후 proof 불일치, RPC 장애, 복구 및 잘못된 체인을 구분한다. [검증 순서](../evidence/mentor5-verification-order-regression.md), [장애·복구](../evidence/mentor5-failure-recovery-verification.md).
- W4 두 원본 및 저장소 manifest 해시를 재계산했고 백엔드 회귀를 추가했다. 실제 W7 발급 영수증은 확보되지 않아 W4와 동적 비교는 **NOT_VERIFIED**다. [해시 검토](../evidence/mentor5-model-policy-hash-verification.md).
- 공개 RPC 기준 실행은 VALID 1/1, 28,528 ms, 222회 요청이다. 단일 거래로의 변경은 전체 구간 중복 검사의 의미가 달라져 적용하지 않았다. 최적화 후 측정 및 개선율은 **NOT_VERIFIED**다. [기준](../evidence/mentor5-rpc-baseline.md), [보안 분석](../evidence/mentor5-rpc-optimization.md).
- 24초 전체 deadline과 네트워크 요청 취소는 구현하지 않았다. 기존 sequence 가드는 늦은 결과의 표시를 억제하지만 요청 자체를 중단하지 않는다. 24초는 수동 대체 경로 판단 기준이며 성공 보장이 아니다.
- [모듈 검토](../architecture/mentor5-modularization-review.md), [신뢰 한계](../security/mentor5-trust-limitations.md), [시각·Merkle 검토](../evidence/mentor5-timestamp-and-merkle-review.md)는 후속 설계이며 신규 프로토콜이나 SDK의 구현·승인이 아니다.

## 실행 상태

| 검증 | 상태와 범위 |
| --- | --- |
| GitHub main 및 기존 CI | PASS: fetch, SHA 및 공개 API 조회. 기존 worktree의 미커밋 변경은 보존. |
| W4 원본·manifest | PASS: 두 공개 receipt body hash 및 파일 digest, manifest 재계산. W4 원본 변경 없음. |
| W7 실제 receipt 대조 | NOT_VERIFIED: 실제 bundle 미확보. 과거 201/PENDING_ANCHOR 보고를 새 실행으로 취급하지 않음. |
| 실제 공개 RPC | PASS: 기준 W4 VALID 1회 및 [변조 사본 INVALID_PROOF 1회](../evidence/mentor5-rpc-invalid-proof.md). 10회 연속과 실제 장애 복구는 별도 확인 필요. |
| 24초 전체 취소 | NOT_VERIFIED: 미구현. 개별 RPC timeout 5초와 구분. |
| Backend `npm test` | PASS: 160 passed, 53 skipped. SKIP은 PASS에 합산하지 않음. `npm run typecheck`, `npm run build` PASS. |
| Contracts `npm test` | PASS: Hardhat 프로세스 내부 네트워크 18 passing. 별도 실제 Hardhat LOCAL 운영 환경은 기존대로 NOT_VERIFIED. `npm run build` PASS. |
| Frontend lint/build | PASS: `npm run lint`는 oxlint, 기존 경고 2건; `npm run build`는 TypeScript와 Vite 성공. |
| Frontend unit | PASS: `npm test -- --maxWorkers=2` 259 passed. 최초 동시 실행 `npm test`는 257 passed, 2 timeout FAIL이었다. |
| Frontend browser | PASS: 수정 후 `npm run test:browser` 7 passed / 0 skipped. 최초 실행에서 W4 프로필 전환 경합 1건이 실패했으며 수정 후 해당 회귀 5회 반복 통과. Playwright 차단은 물리 회선 단절이 아님. |
| 기존 W6 / BASE 10 / 물리 모바일 | 역사적 W6 Engineering Exit PARTIAL, BASE 연속 10회 NOT_MET, 물리 모바일 NOT_EXECUTED. |
| 정책 및 봉인 | S1 PENDING_APPROVAL, Model/Policy LOCK NOT_EXECUTED, TEST SEALED. |

새 검증은 과거 W4 GATE-4 14/14 PASS, Epoch 1의 2 receipt 또는 과거 W6 상태를 소급 변경하지 않는다. 합성 원장 성공을 공개 체인 성공으로 사용하지 않는다. 실제 온체인 송신·Epoch 재등록·배포·DB 수정·TEST 개봉·발표 PPT/대본 수정은 하지 않았다.

`node scripts/check-all.mjs`는 패키지마다 `npm ci`를 다시 실행하므로 별도 실행하지 않았다. 해당 스크립트의 테스트·lint·browser·typecheck·build 명령을 위와 같이 개별 실행했다. 의존성 설치 `npm ci --ignore-scripts`의 npm audit은 frontend/backend 각각 moderate 2, high 2, contracts low 8·moderate 5·high 16을 보고했다. 취약점의 실제 악용 가능성과 수정은 별도 조사 대상이며 이번에 자동 업그레이드하지 않았다.
