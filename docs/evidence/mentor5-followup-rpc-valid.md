# Mentor 5 후속 — 공개 RPC 정상 원본 검증

**PASS: W4 receipt-0, 공개 RPC 읽기 전용 VALID 1회.** 이 결과는 한 번의 실행이며 향후 가용성, 24초 이내 완료 또는 10회 연속 성공을 보장하지 않는다. [요청별 정리 JSON](mentor5-followup-rpc-valid.json). 사용한 W4 원본 파일 SHA-256은 `a389ec1547f76124b136e5648e9d906e5a22eb3099deff8b4a733f2c03282f72`이다.

| 항목 | 관측 |
| --- | --- |
| 시각·환경 | 2026-11-02 02:33:40.857–02:34:03.755 UTC; Windows 11, Node v24.10.0, Base Sepolia chain ID 84532 |
| 코드 | 기준 HEAD `e540c7a1e26e445f64cda9f676059479b2c4830f`와 아직 커밋하지 않은 `rpcLedger.ts` 취소 변경. 해당 작업 파일 SHA-256 `2465db3d5798198ce3cfcdd3de3404a649ce2fe0c1af974409f522d2a5eadb8e`; `verifyCore`는 기준 HEAD와 같음 |
| 결과 | `VALID`, 22,910ms; 1회 시도 |
| 로그 검색 | 배포 블록 48,012,271부터 관측 head 53,324,763까지 총 5,312,493블록; 50,000블록 이하 107구간 |
| 요청 | 총 224회: `eth_chainId` 112, `eth_call` 2, `eth_blockNumber` 2, `eth_getLogs` 107, `eth_getTransactionReceipt` 1 |
| 오류 | publicnode HTTP 200 224회; 보조 endpoint 호출 0회. 429·413·timeout 각각 0회 |
| 개별 요청 지연 | 평균 101.50ms, 중앙값 88ms, p95 nearest-rank 199ms, 최대 314ms |

## 실행 방법과 중단 조건

기존 `frontend/scripts/w6-rpc-audit.mts`의 사본 `frontend/scripts/mentor5-followup-audit-temporary.mts`를 만들고 다음 두 가지 안전 장치만 추가했다. 첫째, `measuredFetch` 시작 전 stop 플래그가 설정됐으면 네트워크 호출 전에 오류를 던진다. 둘째, 첫 HTTP 429 또는 413, 또는 `TimeoutError`/`timed out`을 관측하면 플래그를 설정한다. 기존 JSON-RPC 메서드 allowlist는 그대로다. 본 실행에는 해당 오류가 없어 guard가 발동하지 않았다. 사본은 실행 후 삭제했다.

PowerShell에서 frontend를 현재 디렉터리로 두고 환경 변수와 명령을 사용했다. 출력은 private-data에만 두고 정리된 JSON을 위 파일에 보존했다.

```powershell
$env:W6_RPC_AUDIT_ATTEMPTS = '1'
$env:W6_RPC_AUDIT_SCENARIO = 'VALID'
$env:W6_RPC_AUDIT_RUN_ID = 'mentor5-followup-valid-20261102'
$env:W6_SOURCE_HEAD = 'e540c7a1e26e445f64cda9f676059479b2c4830f plus uncommitted rpcLedger change'
node ../backend/node_modules/tsx/dist/cli.mjs scripts/mentor5-followup-audit-temporary.mts
```

사용된 메서드는 `eth_chainId`, `eth_call`, `eth_blockNumber`, `eth_getLogs`, `eth_getTransactionReceipt`뿐이며 신규 거래를 송신하지 않았다. 결과 JSON에는 공개 endpoint의 host, 메서드, 시각, 상태, 지연, 크기, 조회 블록 구간과 공개 receipt 식별 해시만 담았다. 에러 문자열은 종류만 남기도록 정리했으며 인증정보·원문·salt·로컬 비공개 경로 문자열 패턴 검사는 0건이었다. 패턴 검사는 민감정보 부재의 절대적 증명이 아니다.

과거 28,528ms 기준 실행과 이 실행은 시간·head·구간이 다른 각 1회다. RPC 요청 수와 지연 변동을 최적화에 따른 개선율로 해석하지 않는다. 이 실행은 실제 공개 RPC 정상 원본 검증이며 취소 버튼의 브라우저 네트워크 중단 검증을 대신하지 않는다.
