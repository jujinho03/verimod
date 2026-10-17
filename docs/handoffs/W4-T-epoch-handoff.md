# W4 T Epoch 인계 — 한국어 최신 경계

T `7534907fa3ad66cc6ed29cfbee2efd8c2c75369e`의 코드 기준입니다.
[원본 인계 문서](https://github.com/jujinho03/verimod/blob/7534907fa3ad66cc6ed29cfbee2efd8c2c75369e/docs/handoffs/W4-T-epoch-handoff.md)와
[실제 sender](https://github.com/jujinho03/verimod/blob/7534907fa3ad66cc6ed29cfbee2efd8c2c75369e/backend/contracts/scripts/register-epoch.ts)를
연결합니다. 이전 문서의 mined=CONFIRMED 표현 대신 최신 코드의 SUBMITTED/F 확인 분리를 따릅니다.

## 입력과 승인 대상

공개 입력은 [실제 Frozen Epoch JSON 4개](w4-frozen-epoch-public/20261017-r01/README.md)입니다.
epoch 1, root `0x32bf54ab91c8727e476bd4aaa13dacc6af4eaa8273656317ce7f331e29a29f82`,
count 2/version 1을 원본 F DB와 일치시켜야 합니다. W3 합성 root를 대체 입력으로 쓰지 않습니다.

chain 84532, contract `0xd17ba590b23e984e3f3408bcdc3529be9868ec50`,
publisher `0xd47675be41ec3476f541c1d8d8a9f622c90182ed`, issuer `verimod-example-platform`입니다.
[배포 기록](../deployments.md)은 기존 T 근거이며 이번 문서 갱신에서 RPC를 재조회하지 않았습니다.

## 송신 전후

T는 먼저 epochs(1)을 조회합니다. 동일 root/count/version이면 재송신하지 않고 확인을
재조정하며, 다른 nonzero 값이면 ROOT_CONFLICT로 중단합니다. 같은 값이라는 이유만으로
F CONFIRMED를 만들지 않습니다.

새 송신은 T의 비공개 journal에 signed raw bytes/hash/nonce를 저장하고, 인증 채널로
A의 실제 F DB durable ACK를 기다린 뒤 동일 bytes만 broadcast합니다. ACK 오류·timeout·
형식/값 불일치는 송신을 차단합니다. raw bytes는 stdin/비공개 journal에만 남깁니다.

T sender는 자체 journal을 SUBMITTED로 기록하고 receipt/event/getter를 대조합니다.
이 결과는 F의 12 confirmations/canonical/hash-bound 확인을 대신하지 않습니다.
F 확인 전 공개 proof/anchor는 null이고 새 Receipt는 PENDING입니다.

## 현재 운영 상태

T는 별도 개인 노트북의 승인 signer를 유지하고 원본 DB는 A에 둡니다. 공개 JSON 독립
검증 PASS는 팀 보고입니다. 실제 사전 ACK 채널·Epoch tx·F confirmation·외부 브라우저
검증은 아직 완료하지 않았습니다. 사설망·Windows OpenSSH·최소 ACL·승인 RPC와 해당
Epoch의 송신 승인이 필요합니다. [최소 운영 절차](W4-AFT-operations.md)를 따릅니다.

같은 root의 무응답/timeout을 새 nonce·epoch로 덮어쓰지 않고 기존 T/F/chain identity를
대조합니다. 정책은 provisional/team_approved=false, TEST SEALED, GATE-4 PARTIAL입니다.
