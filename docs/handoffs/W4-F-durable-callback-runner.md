# W4 F durable Callback — 한국어 연결 안내

F `c1f750ea3752037d749324f1535df051ce6b37f9`의 구현/원문을 설명합니다.
[F 원문](https://github.com/jujinho03/verimod/blob/c1f750ea3752037d749324f1535df051ce6b37f9/docs/handoffs/W4-F-durable-callback-runner.md)을
보존하며 개인 설정 예제의 실제 값은 공개하지 않습니다. main에 해당 실행 코드를 병합한 것은 아닙니다.

## 역할과 제한

실행 파일은 F의 `backend/scripts/f-durability-callback.mts`입니다. signer나 송신 기능이
없고, T의 서명 transaction을 검증하여 **원본 SQLite에 저장한 후** ACK를 반환합니다.
기본 operation이 prepare이므로 읽기 확인에는 반드시 `--operation status`를 명시합니다.
현재 실제 status만 PASS이고 실제 prepare ACK는 아직 실행하지 않았습니다.

호스트 전용 `w4-f-callback-approval/1` config에는 AUTHORITATIVE mode, 승인 범위 ID,
실제 canonical DB 경로/dev/ino, epoch/target, provisional 정책이 고정됩니다.
이 승인 범위 ID는 정책 승인이나 온체인 송신 승인이 아닙니다. T stdin으로 DB·대상·operation을
선택하지 않습니다. raw bytes·config·DB·개인 경로는 공개 증빙에 포함하지 않습니다.

DB header/identity, mode=rw(no create), schema v2, 지속 journal 및 연결 synchronous FULL을
확인합니다. status는 원래 epoch/member 순서를 재검증하고 FROZEN/tx_hash=null을 반환합니다.
기존 DB 초기화·migration·idempotency 정리는 하지 않습니다.

## wire 계약

prepare stdin은 UTF-8 JSON 한 개/EOF, 최대 32768 bytes입니다. 필수 필드는 epochId,
root,count,protocolVersion,chainId,contractAddress,rawTransaction,txHash,nonce이며 추가
필드는 허용하지 않습니다. 수치는 canonical decimal string, hash/주소/raw bytes는
정해진 lowercase hex 형식입니다. rawTransaction은 비공개 stdin에서만 전달합니다.

성공 ACK는 epoch_id,merkle_root,receipt_count,protocol_version,status=SUBMITTING,
tx_hash,nonce,chain_id,contract_address입니다. 원문·raw bytes·DB 경로는 없습니다.
T는 모든 값과 exit 0을 검증한 뒤 동일 signed bytes만 송신해야 합니다.
오류는 nonzero exit/빈 stdout/정제된 stderr code이며 성공 ACK로 처리하지 않습니다.

F stdin 5초/SQLite busy 1초, T callback 15초입니다. timeout 이후에도 commit 여부를
임의 추측하지 말고 같은 epoch/hash/nonce를 대조합니다. 다른 bytes나 nonce로 새 작업을
만들지 않습니다.

## 최신 T와 실제 연결

옛 T pin의 camelCase/snake_case composition 실패는 역사 기록입니다. 최신 T
`7534907fa3ad66cc6ed29cfbee2efd8c2c75369e`는 durableAckWireShape로 정렬합니다.
소스 수정 완료와 실제 호스트 연결 성공은 구별합니다. 승인 signer는 T에 있고 DB는 A에
있으므로 인증 사설 SSH/고정 명령/보호된 config가 필요합니다.

[최소 운영·승인](W4-AFT-operations.md)을 먼저 완료합니다. 현재 SSH는 미구성이며 최초
채널은 status 전용입니다. 승인 5 전 prepare나 epoch:register를 실행하지 않습니다.
submitted/confirmed는 [별도 신뢰 경로](W4-F-trusted-confirmation.md)입니다.
