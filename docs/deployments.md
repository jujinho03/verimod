# W4 Base Sepolia 배포 기록 — 한국어 해설

T `7534907fa3ad66cc6ed29cfbee2efd8c2c75369e`의
[기존 배포 원본](https://github.com/jujinho03/verimod/blob/7534907fa3ad66cc6ed29cfbee2efd8c2c75369e/docs/deployments.md)을
정리했습니다. 이번 문서 작업에서는 chain RPC 조회·배포·서명·송신을 하지 않았습니다.

| 항목 | 기존 T 기록 |
| --- | --- |
| chain | Base Sepolia 84532 |
| 계약 | [0xd17ba590b23e984e3f3408bcdc3529be9868ec50](https://sepolia.basescan.org/address/0xd17ba590b23e984e3f3408bcdc3529be9868ec50) |
| 배포 tx | [0xd80cdfe4f726b7902f11c35cb0565e19296dc4f012c3cdab3dcbaa15f08b6d1b](https://sepolia.basescan.org/tx/0xd80cdfe4f726b7902f11c35cb0565e19296dc4f012c3cdab3dcbaa15f08b6d1b) |
| 배포 블록 | 48012271 |
| publisher | 0xd47675be41ec3476f541c1d8d8a9f622c90182ed |
| 승인 profile/issuer | BASE_SEPOLIA_DEMO / verimod-example-platform |
| confirmation 정책 | 12 이상 |

계약 배포와 실제 R01 Epoch 등록은 다른 결과입니다. 현재 실제 R01 Receipt 2건은
A DB에서 Epoch 1로 Freeze됐지만 이 Epoch의 tx/온체인 확인은 아직 없습니다.
T의 이전 문서에 남은 freeze 입력 대기는 [공개 인계](handoffs/w4-frozen-epoch-public/20261017-r01/README.md)로
진전됐으며 현재는 실제 사전 ACK 채널과 운영 승인이 차단사항입니다.

최신 T sender는 mined receipt를 F CONFIRMED로 표시하지 않고 SUBMITTED로 구분합니다.
[T 인계](handoffs/W4-T-epoch-handoff.md)와 [F 확인 경계](handoffs/W4-F-trusted-confirmation.md)를 따릅니다.

W3의 `0xcf689273a16965320aa7d8a23c14e1236287fed8` 계약과 당시 synthetic smoke는
역사 증거이며 위 W4 배포/실제 R01 Epoch와 혼용하지 않습니다. LOCAL_HARDHAT_FALLBACK도
공개 체인 증거가 아닙니다. Bundle locator는 TrustProfile의 issuer/chain/대상을 바꿀 수 없습니다.
