# 실제 Base Sepolia에 등록된 Epoch 1 — 공개 증거

2026-10-20 실행. 실제 R01 모델 판정 영수증 2건을 묶은 Epoch 1이 Base Sepolia에 등록됐고, F의 원본 DB가 12회 이상 확인 후 CONFIRMED로 확정됐으며, 실제 브라우저에서 독립 검증했습니다.

정책은 `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`인 **테스트넷 시연**입니다. 운영 정책 승인이나 AI 판정의 정확성 인증이 아닙니다.

## 핵심 값

| 항목 | 값 |
| --- | --- |
| Chain | Base Sepolia `84532` |
| Contract | `0xd17ba590b23e984e3f3408bcdc3529be9868ec50` |
| Publisher | `0xd47675be41ec3476f541c1d8d8a9f622c90182ed` |
| Epoch | id `1`, receipt `2`건, protocol version `1` |
| Merkle root | `0x32bf54ab91c8727e476bd4aaa13dacc6af4eaa8273656317ce7f331e29a29f82` |
| Transaction | [`0x175b3c1ad237a087984b17b47c0343fedfd314a5eb1c34ba7a22511b5cc67286`](https://sepolia.basescan.org/tx/0x175b3c1ad237a087984b17b47c0343fedfd314a5eb1c34ba7a22511b5cc67286) |
| Block | `48358039` / `0xacd2061e6e25f7e76e42361c6bb9aa0b15a367b511a18db5b9d083f40a2a43cf` |
| 결과 | status 1(성공), `EpochRegistered` 1건, `epochs(1)` getter 일치 |
| 확인 횟수 | F 확정 시 339회, 브라우저 검증 시 431회 (기준 12회) |

## 실행 순서와 확인

1. **송신 전 원본 DB 기록.** T 노트북이 서명한 tx를 사설망 SSH의 제한된 강제 명령으로 A의 F에 보내, 원본 SQLite에 SUBMITTING으로 먼저 기록하고 ACK를 받은 뒤에만 같은 bytes를 송신했습니다. tx는 1건이며 publisher nonce가 3에서 4로 늘었습니다.
2. **체인 독립 확인.** 공개 RPC 두 곳(`base-sepolia-rpc.publicnode.com`, `sepolia.base.org`)에서 tx, receipt, canonical 블록 포함, 이벤트, EIP-1898(`blockHash`+`requireCanonical`) getter를 대조했습니다.
3. **F 신뢰 확인.** F의 `submitted` → `confirmed` 절차가 RPC로 tx·receipt·이벤트·getter·12회 이상 확인·재조회 일관성을 검증한 뒤, CONFIRMED와 확인 증거를 원본 DB에 한 트랜잭션으로 기록했습니다.
4. **공개 bundle.** F의 bundle 함수가 확인 증거가 있을 때만 proof/anchor를 채웁니다. 아래 두 파일이 그 결과입니다.
5. **브라우저 독립 검증.** 실제 Chromium에서 `/verify?profile=BASE_SEPOLIA_DEMO`로 공개 RPC만 읽어 검증했습니다. 플랫폼 API 호출은 0회입니다.

## 브라우저 검증 결과 (7/7)

| 사례 | 기대 | 결과 |
| --- | --- | --- |
| 실제 영수증 0 | VALID | VALID |
| 실제 영수증 1 | VALID | VALID |
| 영수증 본문 변조(정책 조치) | HASH_MISMATCH | HASH_MISMATCH |
| Merkle proof 변조 | INVALID_PROOF | INVALID_PROOF |
| anchor를 미승인 컨트랙트로 변경 | UNTRUSTED_ANCHOR | UNTRUSTED_ANCHOR |
| anchor를 미승인 체인으로 변경 | UNTRUSTED_ANCHOR | UNTRUSTED_ANCHOR |
| proof·anchor 제거 | PENDING_ANCHOR (VALID 아님) | PENDING_ANCHOR |

화면과 실행 환경은 [`browser/`](browser/browser-verification.json)에 있습니다.

알려진 표시 한계: 검증 화면의 보조 확인 "모델·정책 manifest"는 프런트엔드 공개 목록에 W4 실제 manifest가 없어 "실패"로 표시되고, 상단 배너가 실제 체인 모드에서도 "PROTOTYPE MODE"로 표시됩니다. 두 가지 모두 판정(VALID) 단계와는 별개입니다.

## 파일과 SHA-256

| 파일 | SHA-256 |
| --- | --- |
| `receipt-0.bundle.json` | `a389ec1547f76124b136e5648e9d906e5a22eb3099deff8b4a733f2c03282f72` |
| `receipt-1.bundle.json` | `826a0af4030a9c525c015fd719ea117ecb2c4eb5467976ac88b0b921dee0cbb0` |
| `chain-evidence.json` | `09f5a0e7b34cf6a327ec810fe447a21673bc537b82f5dd78deb1941a3c4dd47c` |
| `browser/browser-verification.json` | `e49c4b2dcc0cb68eb26799b783f0da7a232fb7619c724b65b97460ef01ac2be2` |

## 공개하지 않은 것

서명된 raw transaction, salt, 게시물 원문, private package, RPC 인증 정보, 원본 DB 경로와 identity, 호스트 운영 정보는 공개하지 않습니다.

## 보장하지 않는 것

이 증거는 영수증이 블록체인에 고정된 기록과 일치하고 변조되지 않았음을 보여 줍니다. AI 판정의 객관적 정확성, 실제 모델 실행, 발급자의 최초 진실성, 전체 기록의 완전성은 증명하지 않습니다. Base Sepolia 12회 확인은 MVP 검증 기준이며 Ethereum L1 finality가 아닙니다.

동결 시점(송신 전) 자료는 [w4-frozen-epoch-public/20261017-r01](../../w4-frozen-epoch-public/20261017-r01/README.md)에 그대로 보존합니다.
