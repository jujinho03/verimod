# Merkle Spec v1

상태: **W2 동결 후보**. 이 문서는 `docs/spec/merkle-spec.md`의 배포 경로 호환 사본이며 W2 제출물의 기준 경로다.

## Tree rule

- `merkle_spec` = `ct-sha256-receipt-v1`.
- leaf = `SHA-256(0x00 || receipt_hash_raw32)`.
- node = `SHA-256(0x01 || left_raw32 || right_raw32)`.
- RFC 9162-style largest-power-of-two split을 사용한다.
- receipt hash의 hex 텍스트가 아니라 decode한 32 raw bytes를 leaf 입력으로 쓴다.
- single leaf의 proof는 빈 배열이며 empty epoch는 거부한다.

## Epoch freeze rule

- member는 `receipt_id` ASCII 오름차순으로 결정적으로 정렬한다.
- 빈 epoch, 중복 `receipt_id`, 중복 `receipt_hash`를 거부한다.
- `leaf_index`는 정렬 뒤의 0-based index, `tree_size`는 member 수다.
- issuer가 발급한 member에는 `issuer_seq`를 포함한다. 값은 1 이상 safe integer이며 같은 epoch 안에서 중복이나 구멍 없이 연속이어야 한다.
- 동결 결과에는 해당 발급자 member의 `[issuer_seq_min, issuer_seq_max]`를 기록한다. 합성 외부 filler는 이 범위에 포함하지 않는다.
- 동일 receipt를 두 frozen epoch에 포함하지 않는 것은 저장소 V2 제약으로 검사한다.

## 제외 범위

consistency proof, global append-only log, head registry는 구현하지 않는다. 이 문서는 canonical byte/해시 규칙을 바꾸지 않는다.
