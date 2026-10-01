# Merkle Spec v1

상태: **PROTOCOL FREEZE CANDIDATE** (전체 FRZ-01 전). 소유: PROTOCOL. W2 Node 회귀와 epoch 저장 검증을 통과했다.

## 범위

이 규격은 receipt hash의 ordered inclusion proof와 epoch 동결만 다룬다.
consistency proof, global append-only log, head registry는 이 버전에 포함하지 않는다.

## Tree

- merkle_spec은 ct-sha256-receipt-v1이다.
- leaf는 SHA-256(0x00 || receipt_hash_raw32)이다.
- internal node는 SHA-256(0x01 || left_raw32 || right_raw32)이다.
- 트리는 RFC 9162-style largest-power-of-two split을 사용한다. 크기 n > 1에서는 k를 n보다 작은 최대 2의 거듭제곱으로 하고, root는 node(MTH(first k), MTH(rest))다.
- 단일 leaf의 proof는 빈 배열이다.
- empty epoch는 root를 만들지 않으며 거부한다.

## Epoch freeze

- 입력 member는 receipt_id ASCII 오름차순으로 정렬한다.
- receipt_id와 receipt_hash는 각각 epoch 안에서 유일해야 한다.
- leaf_index는 정렬 뒤의 0-based index이고, tree_size는 정렬된 member 수다.
- proof의 sibling은 leaf에서 root 방향 순서다.
- issuer가 발급한 member의 issuer_seq는 1 이상 safe integer여야 하며 epoch 안에서 중복이나 구멍 없이 연속이다. 동결 결과는 issuer_seq_min/max 범위를 함께 기록한다. 합성 외부 filler는 이 범위에 포함하지 않는다.
- 같은 receipt를 둘 이상의 frozen epoch에 넣지 않는 V2 저장소 제약은 이 문서의 tree 함수 범위 밖이며, persistence 구현에서 보장한다.

## 검증 경계

검증기는 receipt_hash hex 문자열이 아니라 decode한 32 raw bytes를 leaf 입력으로 사용한다.
root, sibling, index, tree size가 올바른 폭과 범위를 만족하지 않으면 inclusion proof는 실패다.
이 규격은 FRZ-01 전 WORKING ASSUMPTION이며, 변경은 bytes/proof fixture와 함께 검토한다.
