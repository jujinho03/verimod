# W4 Frozen Epoch 공개 인계 — 설경민(T)

실제 R01 모델로 발급한 Receipt 2건과 Frozen Epoch 1의 공개 JSON 원본이다.
2026-10-17 A 운영자가 이 네 파일의 GitHub 공개 게시를 명시적으로 승인했다.
원본 바이트를 복사했으며 원문, salt, private package, DB 경로/identity, 승인 설정,
모델 가중치, 개인키는 포함하지 않는다. 이 폴더는 임시 인계용이지만 Git 이력에는
게시 기록이 남으므로 비밀 자료를 추가하면 안 된다.

## 검증할 파일

| 파일 | SHA-256 |
| --- | --- |
| execution-status.json | ad0bf44da950ad320c54c0f572ea612526b5cd7113b88a95bdfc6b3c707512c5 |
| receipt-0.bundle.json | b0d071d94fa0aaa976258bd25b22079ad68569d8ff37cfb99f898267a72db1c4 |
| receipt-1.bundle.json | 299d9e9a8bf4fc81f552b506874e010799bae217711038269ece86e422ad1b8f |
| frozen-epoch-handoff.json | 77cc18e1a1f76848a8189a5a262a39140ddb9b3ab9332a38650c57488d728e2f |

`.gitattributes`는 JSON 줄바꿈 변환을 방지한다. JSON을 편집하거나 다시 직렬화하면
파일 해시가 바뀐다. 다운로드한 원본에 먼저 SHA-256 검사를 수행한다.

## Epoch와 실행 당시 provenance

- epoch ID: `1`, count: `2`, protocol version: `1`, 상태: `FROZEN`
- Merkle root: `0x32bf54ab91c8727e476bd4aaa13dacc6af4eaa8273656317ce7f331e29a29f82`
- issuer: `verimod-example-platform`
- FULL/TRUNCATED Receipt 각각 1건, public proof/anchor는 `null`
- policy: `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`
- Model Manifest: `0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1`
- Policy Manifest: `0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e`
- 원본 A: `9bcbec677d89d10364b327aae7e60955e2e4315d`
- 원본 Freeze F: `f157b9aa7506093207e6695cc4b0ff7b83b69088`
- 원본 T: `fbcb3e9e99ae8dda2f9c70a32f35ec2c039b73de`

JSON의 과거 blocker/source pin은 실행 당시 기록이며 그대로 보존했다. 이후 A의
status 검증은 F `4605ec0553a27b0b1a57856856b903e608ff5845`, T 계약 참조는
`ecc4edc9ea89e739845a362c956b66b6f9613cf9`에서 수행됐다. 최신 F/T 구현 상태는
별도로 확인해야 한다. 이번 게시에서는 모델 추론·Freeze·DB 상태 변경을 재실행하지 않았다.

## T의 검증 및 작업 범위

1. 이 커밋을 고정하여 네 파일 SHA-256을 위 표와 대조한다.
2. 두 Receipt의 canonical hash/content commitment/manifest reference를 확인한다.
3. `receipt_id` ASCII 오름차순으로 정렬한 member hashes와 leaf 순서를 확인하고
   protocol version 1 규칙으로 Merkle root를 독립 계산한다.
4. 정책 provisional 상태와 proof/anchor `null`을 유지한다.

공개 JSON을 읽는 것은 authoritative SQLite 연결이나 durable callback ACK를 대체하지
않는다. T의 승인된 서명 호스트는 UNKNOWN, 실제 Callback 실행 채널은 BLOCKED다.
기존 DB ACL 정비도 승인 대기 상태다. 이 공개 인계는 서명/prepare/submitted/confirmed/
broadcast 승인이나 정책 승인/LOCK을 뜻하지 않는다. GATE-4는 PARTIAL이다.

Windows에서 파일 해시 확인:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath execution-status.json,receipt-0.bundle.json,receipt-1.bundle.json,frozen-epoch-handoff.json
```

Linux/macOS에서 파일 해시 확인:

```sh
shasum -a 256 execution-status.json receipt-0.bundle.json receipt-1.bundle.json frozen-epoch-handoff.json
```

GitHub 게시 완료와 T의 실제 다운로드·수령 확인은 별개다.
