# Mentor 5 — 공개 RPC 기준 측정

상태: **PASS — 읽기 전용 기준 측정 1회**, 10회 연속 성공은 **NOT_VERIFIED**. 과거 2026-10-29 측정과 별도 실행이다. 원시 요청별 기록은 [JSON](mentor5-rpc-baseline.json)이다. 이 파일에는 공개 endpoint의 host와 RPC 메서드·시간·상태만 포함하며 인증 토큰이나 비밀 주소는 없다.

| 항목 | 관측 |
|---|---|
| 코드 기준 | `7a6aa2ad27ad58d0454b39f28a07d069ac4e93b1` (수정 전 RPC 구현) |
| 환경·시각 | Windows 11, Node.js, Base Sepolia 84532; 2026-11-02 01:39–01:40 UTC |
| 입력 | W4 원본 receipt-0; `npm run w6:rpc-audit`, `W6_RPC_AUDIT_ATTEMPTS=1` |
| 종료 시각 | 2026-11-02T01:40:11.843Z |
| 결과·전체 소요 | VALID 1/1, RPC_UNAVAILABLE 0/1; 28,528 ms |
| 검색 구간 | deployment 48,012,271 ~ 측정 head 53,308,587, 총 5,296,317 blocks |
| 요청 | 222: `eth_chainId` 111, `eth_call` 2, `eth_blockNumber` 2, `eth_getLogs` 106, `eth_getTransactionReceipt` 1 |
| endpoint | publicnode 222건 모두 HTTP 200, 오류 0; Base 공개 endpoint 0건 (fallback 불필요) |
| 오류 | HTTP 429 0, HTTP 413 0, timeout 0 |
| 개별 요청 지연 | 평균 124.48 ms, 중앙값 104 ms, p95 245 ms, 최대 1,679 ms |

개별 요청 p95는 222개 latency의 정렬값에서 nearest-rank 방식으로 산출했다. 전체 검증 평균·중앙값·p95·최대는 표본이 1개이므로 모두 관측값 28,528 ms일 뿐 분포를 추정할 수 없다. 감사 스크립트는 RPC method allowlist만 허용하고 체인 송신을 하지 않는다. 첫 실행은 의존성 설치 전 모듈 누락으로 RPC 요청 없이 종료했으며 위 측정에 합산하지 않았다.

부하 제한: 기존 reader의 단일 요청별 5초 timeout 및 50,000블록 범위, 순차 호출을 사용했다. 이미 1회에 222요청 및 24초 초과가 관측되어 반복을 중단했다. 자동 429 회로 차단기는 스크립트에 없으므로 추가 10회 실행을 하지 않았다. 이 측정은 향후 성공률이나 시간 보장을 뜻하지 않는다. `24초`는 개별 timeout도 성공 보장도 아닌 수동 대체 경로 판단 기준이며 본 구현의 전체 검증 deadline은 아니다.

## 블록 증가 관측

동일 publicnode에 별도의 `eth_blockNumber` 두 번을 요청한 결과 2026-11-02T01:38:45.626Z `0x32d6b80`, 01:38:49.718Z `0x32d6b90`, 16블록 증가(요청 시작 시각 기준 4.092초, 약 3.91 blocks/s)였다. 네트워크 지연과 단 2점 때문에 정밀 블록 시간 측정은 아니다. [Base 소스](https://github.com/base/base/blob/main/crates/common/genesis/src/rollup.rs)는 Denim 이후 200ms 간격을 기술한다. [BaseHub 전환 안내](https://basehub.org/flashblocks/migrate-to-200ms-blocks/)와 [명세 설명](https://basehub.org/specifications/denim-200ms-blocks/)은 Sepolia 2026-10-21 18:00 UTC 활성화와 200ms 정규 블록을 설명한다. BaseHub는 독립 유지 문서이며 Base 공식 사이트로 표시하지 않는다. [BaseHub RPC 안내](https://basehub.org/api-reference/rpc-overview/)는 공개 endpoint의 rate limit을 설명한다.

## 비교 상태

동등 보안의 최적화를 채택하지 않아 최적화 후 SHA·성능·개선율은 **NOT_VERIFIED / 해당 없음**이다. [후보 및 보안 분석](mentor5-rpc-optimization.md)과 [비교 데이터](mentor5-rpc-comparison.json)를 참조한다.
