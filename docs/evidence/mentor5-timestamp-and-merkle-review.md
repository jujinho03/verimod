# Mentor 5 — 시간 및 Merkle 근거

기준 코드 `7a6aa2ad27ad58d0454b39f28a07d069ac4e93b1`; 2026-11-02 읽기 전용 확인. 공개 자료: [`receipt-0`](../handoffs/w4-anchored-epoch-public/20261020-r01/receipt-0.bundle.json), [`receipt-1`](../handoffs/w4-anchored-epoch-public/20261020-r01/receipt-1.bundle.json), [`chain-evidence`](../handoffs/w4-anchored-epoch-public/20261020-r01/chain-evidence.json).

| 사건 / 필드 | UTC | 의미 |
| --- | --- | --- |
| Receipt 0 `inferred_at` | 2026-10-16T07:22:42.834Z | 추론 서비스가 기입한 시각 |
| Receipt 0 `recorded_at` | 2026-10-16T07:22:42.849Z | 영수증 본문에 발급 계층이 기입한 시각 |
| Receipt 1 `inferred_at` | 2026-10-16T07:22:43.072Z | 추론 서비스가 기입한 시각 |
| Receipt 1 `recorded_at` | 2026-10-16T07:22:43.077Z | 영수증 본문에 발급 계층이 기입한 시각 |
| W4 등록 transaction 포함 블록 | 2026-10-20T08:19:26Z | Base Sepolia 블록 `48358039`의 timestamp |

`backend/src/issuance.ts`는 추론·정책 검사 뒤 `now()`를 `recorded_at`에 넣고 영수증을 저장한다. 이는 발급자가 기록한 시각이지 독립 타임스탬프 증명은 아니다. 2026-11-02T01:37:03Z에 `https://sepolia.base.org`에 `eth_getBlockByNumber`를 읽기 전용으로 요청했을 때 block hash `0xacd2061e6e25f7e76e42361c6bb9aa0b15a367b511a18db5b9d083f40a2a43cf`와 W4 tx `0x175b3c1ad237a087984b17b47c0343fedfd314a5eb1c34ba7a22511b5cc67286`의 포함을 확인했다. 체인 시각은 해당 RPC가 반환한 블록의 시간이며 영수증의 실제 추론 시간이나 L1 finality를 증명하지 않는다. W4의 기존 12 L2 confirmations는 L1 finality와 다르다.

## RFC 9162와의 관계

[`merkle-spec.md`](../spec/merkle-spec.md)의 비어 있지 않은 ordered tree는 SHA-256, leaf `SHA256(0x00 || receipt_hash_raw32)`, node `SHA256(0x01 || left || right)`, largest-power-of-two split과 leaf-to-root inclusion path를 쓴다. 이는 [RFC 9162 §2.1.1 및 §2.1.3](https://www.rfc-editor.org/rfc/rfc9162.html#section-2.1)의 Merkle 구성과 포함 경로에 대응한다. VeriMod는 receipt hash를 leaf 입력으로 삼고 receipt ID로 정렬하며 빈 epoch를 거부한다. RFC의 빈 리스트 hash 정의까지 동등하다고 하지 않는다.

VeriMod v1에는 RFC의 consistency proof, Signed Tree Head 및 전체 append-only CT log가 없다. 동일한 Merkle 구성만으로 RFC 9162 전체나 Certificate Transparency 준수를 주장하지 않는다. 이 검토는 규격을 변경하지 않는다.
