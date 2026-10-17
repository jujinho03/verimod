# W4 F confirmation 검사 — 한국어 범위 해설

F `c1f750ea3752037d749324f1535df051ce6b37f9`의 기존 보고서를 설명합니다.
[영문 실행 원본](https://github.com/jujinho03/verimod/blob/c1f750ea3752037d749324f1535df051ce6b37f9/docs/evidence/w4-f-confirmation/20261017/README.md)을
보존하며 [regression-summary.json](regression-summary.json)은 해당 커밋에서 원본 바이트로 가져왔습니다.
이번 문서 작업에서 192개 테스트를 재실행한 것은 아닙니다.

## 기록된 결과

| 항목 | 결과·범위 |
| --- | --- |
| 전체 회귀 | 11개 파일, **192/192 PASS**, skipped/failed 0. 기존 121+신규 71 |
| 환경 | Windows, Node v24.16.0, tsx 4.23.13 |
| typecheck·w4:typecheck·build | PASS 보고 |
| 승인 tx/receipt/event/getter/12 confirmations | 합성 DB·inert signature·주입/loopback RPC로 PASS |
| reorg/timeout/재개방·evidence atomicity | 로컬 실패·복구 시나리오 PASS |
| public Bundle release | 실제 HTTP API 자동 검사 PASS |
| 외부 브라우저 UI | loopback timeout으로 BLOCKED. API PASS와 구별 |
| 실제 A DB CONFIRMED | NO |
| 실제 체인 요청/서명/송신 | 0 |
| GATE-4 | PARTIAL |

기존 Bundle 테스트 한 개는 단순 markConfirmed로 공개 proof를 내보내지 못하도록 강화됐습니다.
과거 T ACK 결함 회귀는 옛 소스에 고정되어 있고 최신 ACK 정렬 검토와 구별합니다.

## 무엇을 확인했는가

정확한 stored tx/hash/nonce/calldata/대상, 성공 receipt와 canonical inclusion,
EpochRegistered의 ABI와 모든 값, hash-bound publisher()/epochs(), 12 이상 depth,
재조회 reorg/모순, DB snapshot/member 변경, evidence 저장 실패 rollback,
재개방/동일 재시도, timeout 후 늦은 승격 차단, 공개 자료의 private 필드 제외를 확인했습니다.
재검증 실패는 이전 confirmed 블록을 보존하면서 공개 release를 차단합니다.

실제 A DB와 신뢰 RPC에서의 confirmation은 별도 승인·실행이 필요합니다.
[운영·신뢰 계약](../../../handoffs/W4-F-trusted-confirmation.md)을 따릅니다.
