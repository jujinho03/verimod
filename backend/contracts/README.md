# VeriMod 계약·송신 — 한국어 안내

## main 코드와 W4 소스

main의 VeriModAnchor.sol은 epoch Merkle root/count/protocol version을 한 번 등록하는 최소 계약입니다. publisher 외 호출·중복 epoch·empty epoch·zero root를 거부합니다. protocol version 지원 판정은 verifier/TrustProfile의 책임입니다. ToolchainCheck.sol은 툴체인 회귀용이며 그 deploy/ping을 실제 VeriMod epoch 증거로 계산하지 않습니다.

이번 main 갱신은 문서와 공개 증빙입니다. W4 송신기·프로필·확인 경계의 최신 구현은 [T 7534907](https://github.com/jujinho03/verimod/tree/7534907fa3ad66cc6ed29cfbee2efd8c2c75369e/backend/contracts)을 확인합니다.

## 현재 W4 배포와 실제 Epoch

Base Sepolia chain 84532의 W4 계약은 0xd17ba590b23e984e3f3408bcdc3529be9868ec50입니다. [배포 tx/블록과 source](../../docs/deployments.md)를 확인하세요. W3 synthetic smoke와 현재 R01 Epoch는 별도입니다.

A에서 실제 R01 Receipt 2건을 Epoch 1로 Freeze했지만 실제 이 Epoch의 송신은 아직 없습니다. 최신 T는 F의 durable SUBMITTING ACK를 검증한 뒤 동일 signed bytes만 송신하고 자체 journal을 SUBMITTED로 기록합니다. F가 별도 RPC/canonical event/getter/12 confirmations를 검증해야 CONFIRMED와 public release가 가능합니다.

[T 인계](../../docs/handoffs/W4-T-epoch-handoff.md), [F 확인 계약](../../docs/handoffs/W4-F-trusted-confirmation.md), [최소 운영·승인](../../docs/handoffs/W4-AFT-operations.md)을 먼저 읽으세요.

## 명령과 승인 경계

main의 npm test/npm run build는 기존 계약 회귀입니다. npm run base:check는 RPC/잔액 읽기이며 endpoint와 자격은 비공개 설정으로 관리합니다. 실제 배포·epoch:register는 키 사용/송신을 포함하므로 해당 실행 승인이 필요합니다. 이 문서가 실행 승인을 부여하지 않습니다.

Publisher signer는 T 노트북에 유지하고 DB는 A에 둡니다. 키를 Git이나 브라우저에 전달하지 않습니다. 정상 mined receipt나 같은 root getter만으로 F 확인/GATE-4 완료를 선언하지 않습니다.
