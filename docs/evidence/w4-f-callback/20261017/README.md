# W4 F durable callback — Windows 검증, 2026-10-17 KST

## 결과

| 상태 | 결과 |
|---|---|
| F_CALLBACK_RUNNER_IMPLEMENTED | PASS |
| T_F_PROTOCOL_COMPATIBILITY | 고정 T 전체 조합 기준 **FAIL**; F wire ACK → T 요청 parser는 PASS |
| CALLBACK_FAILURE_ZERO_BROADCAST | PASS (broadcast stub만 사용) |
| LOCAL_SQLITE_DURABILITY | PASS (합성 파일 DB, commit/재개방/동일 재시도) |
| WINDOWS_RUNNER | PASS (실제 Windows child process, Node v24.16.0 / tsx 4.23.13) |
| ACTUAL_A_HOST_DB_CONNECTED | BLOCKED |
| POST_SUBMISSION_F_STATE_PATH | 운영 end-to-end/confirmation은 BLOCKED; 로컬 검증 SUBMITTED 코드는 시험함 |
| ACTUAL_CHAIN_TX_SENT | NO |
| GATE_4 | PARTIAL |

정책은 계속 `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`입니다. A가 실제 frozen epoch를 보고했지만, 여기서는 authoritative A DB 경로/접근을 받지 않았습니다. 새 테스트는 모두 새 합성 DB, 서명하지 않은 고정 비활성 signed envelope, 로컬 stub을 씁니다. 실제 A DB, R01 산출물, TEST 데이터셋, 공개 RPC, signer, 체인 트랜잭션, W3 frozen 자료, W5 작업에는 접근하거나 바꾸지 않았습니다.

## 검증

`npm run typecheck`, `npm run w4:typecheck`, `npm run build`: PASS.

`npm test -- --reporter=json --outputFile=../private-data/callback-final-regression.json`: **121/121 PASS, 10개 파일, skip/fail 0**. 기존 68개를 보존했고 `durability-callback.test.ts`에 새 테스트 53개를 추가했습니다. 집중 실행도 53/53 통과했습니다. 공개 `regression-summary.json`에는 정리된 건수와 source digest만 있고, 전체 로컬 reporter JSON은 Git에서 제외됩니다. `windows-cli.jsonl`은 처음 전체 검증 로그를, `windows-cli-final.jsonl`은 shallow CI를 위해 T snapshot을 자체 포함하게 만든 뒤의 마지막 전체 실행을 기록합니다. 둘 다 실제 child의 종료/출력 관측과 정확한 T assertion에서 허용 목록 projection으로 만든 것이며, 원시 비공개 기록이 아닙니다.

검사 범위: stdin 크기/JSON/필드/타입/범위 거부; 같은 요청 replay; DB 생성 없음; 없음/메모리/상대 경로/복사본/비SQLite DB 거부; authoritative 모드에서 합성 승인 거부; 승인된 inode/device/경로/header/schema/epoch 결합; 실제 member root/count/순서/issuer 검사; 잘못된 metadata/hash/nonce/publisher/chain/수신자/value/calldata; 형식 오류/미서명 envelope; 부적절하거나 없는 epoch; SQLite durability/query-only/lock 오류; 충돌하는 요청; 안전한 status와 차단된 CONFIRMED/FAILED 문자열; 정확한 고정 T 요청과 ACK parser; 없음/잘못됨/오류/timeout ACK 시 stub 송신 0; loopback 읽기 전용 JSON-RPC와 음성 identity 증거를 쓰는 로컬 SUBMITTED CLI. 기존 Windows 첫 시작/재시작/503/정리 테스트도 통과합니다.

runner는 SQLite가 없는 DB를 새로 만들지 않도록 Windows 드라이브/공백 인코딩을 포함한 `file:` URI `mode=rw`를 씁니다. 근거는 [Node v24.16.0 SQLite open 구현](https://github.com/nodejs/node/blob/v24.16.0/src/node_sqlite.cc#L868)과 [SQLite URI mode 규칙](https://www.sqlite.org/uri.html)입니다. 열기 전후로 파일 identity를 확인하며 migration은 실행하지 않습니다. 호스트에서 보호된 설정이 승인의 신뢰 기준이며, 암호학적 출처 인증서가 아니므로 A 운영자가 독립적으로 구성해야 합니다. 예시 DB는 authoritative로 취급하지 않습니다.

## 구체적인 T 실패

T pin `34447502f8843f1be585b56fb31c51b41c0f2fc7`은 Git object에서 읽었으며 수정하거나 병합하지 않았습니다. `backend/test/fixtures/w4-t-3444750/` 아래의 hash 검증 사본으로 shallow CI에서도 이 읽기 전용 참조를 쓸 수 있습니다. gate SHA-256 `267c6826767d4d37bddcb1c0bad70ba309237e2162938cfff50b2439c67b192d`, sender SHA-256 `500d003ed992645e74450faa231a5ed030102ec283ab3d99123e24c3eb136d11` (UTF-8, LF). 실제 `requestDurableSubmissionAck()`는 F의 snake_case stdout을 검증한 뒤 camelCase로 반환합니다. 실제 `broadcastAfterDurableAck()`는 다시 snake_case를 검사합니다. 그래서 T `register-epoch.ts`가 쓰는 정확한 조합은 F가 SUBMITTING을 durable하게 저장한 뒤에도 유효한 실제 F CLI 응답을 `epoch_id`에서 거부하며, **broadcast stub 호출은 0회**입니다. ACK stdout을 우회 수정해도 T가 이미 제거한 필드는 되살릴 수 없습니다.

별도 테스트는 실제 T 요청 함수 뒤에 문서화된 명시적 wire 형태 bridge를 넣습니다. 그러면 SQLite 재개방에서 commit된 bytes를 본 뒤에만 gate가 stub을 한 번 호출합니다. **이는 제안한 T 수정을 보여줄 뿐이며, 고정 운영 T 경로는 여전히 깨져 있습니다.** 테스트 통과를 T_F_PROTOCOL_COMPATIBILITY=PASS로 읽으면 안 됩니다. T가 수정된 SHA를 공개하고 실제 sender 조합을 다시 실행해야 합니다.

> 이후 경과: 현재 main의 T `backend/contracts/scripts/register-epoch.ts`(T `7534907` 기준)는 ACK를
> `durableAckWireShape()`로 변환한 뒤 `broadcastAfterDurableAck()`에 넘깁니다. 위에서 제안한 bridge가
> 반영된 형태입니다. 실제 sender 조합의 실환경 재실행은 송신 승인(APPROVAL_5) 전이라 하지 않았습니다.
> 최신 상태는 [W4 현황](../../../progress/W4.md)을 봅니다.

## 송신 후 상태와 호스트 경계

새 `submitted` 동작은 호스트가 승인한 읽기 전용 RPC reader와, `markSubmitted` 전의 정확한 durable 트랜잭션 대조만 씁니다. 테스트는 주입된 reader와 loopback RPC stub만 씁니다. 운영 endpoint/transport는 설정하지 않았고 T는 아직 이 반환 경로를 호출하지 않습니다. CONFIRMED/FAILED CLI 전환은 거부합니다. confirmation 경로 전에 receipt/event/getter/canonical block/12 confirmations 성공과 인증된 반환 증거가 여전히 필요합니다. journal 문자열이나 ACK로 CONFIRMED를 표시할 수 없습니다.

source pin, config/request/ACK 스키마, 정확한 T 설정, 같은 호스트 대 제한된 인증 SSH 배치, 복구, 제안한 T callback 수정, 승인 금지사항은 [A/T 실행·배치 계약](../../../handoffs/W4-F-durable-callback-runner.md)을 봅니다. 기본적으로 키나 비공개 DB를 복사하지 않으며, 인증 없는 HTTP endpoint를 만들지 않습니다. 기존 실제/실패 실행 증거는 보존합니다.
