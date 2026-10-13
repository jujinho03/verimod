# W4 T Epoch Handoff Receipt

Recipient: A/F team · Owner after receipt: T (설경민) · Status: **READY FOR ACTUAL FROZEN EPOCH**

## T public-chain target

| field | value |
|---|---|
| chain | Base Sepolia `84532` |
| contract | `0xd17ba590b23e984e3f3408bcdc3529be9868ec50` |
| publisher | `0xd47675be41ec3476f541c1d8d8a9f622c90182ed` |
| deployment tx | `0xd80cdfe4f726b7902f11c35cb0565e19296dc4f012c3cdab3dcbaa15f08b6d1b` |
| deployment block | `48012271` |
| profile | `BASE_SEPOLIA_DEMO`, protocol version `1`, confirmation policy `12` |

Do not send a W3 historical synthetic root to this contract.

## A → F prerequisite

F may issue an anchor candidate only after an actual `/infer` success and the approved policy configuration are available. On inference failure, F must return `503 INFERENCE_UNAVAILABLE`; it must not create a Receipt or an anchor candidate.

## F → T required receipt

F runs `POST /api/epochs/freeze` with its operator identity and idempotency key. Send T the exact returned `epoch` object and the following evidence, without private text, salts, private package fields, or signed transaction bytes.

```json
{
  "epoch_id": "1",
  "merkle_root": "0x<64 lowercase hex characters>",
  "receipt_count": 1,
  "protocol_version": 1,
  "status": "FROZEN",
  "member_receipt_hashes": ["0x<64 lowercase hex characters>"],
  "source": "actual-model Receipt only"
}
```

The supplied root/count/version must be the F SQLite frozen values. T will reject an empty/invalid value and will never substitute a synthetic root.

## T → F return receipt

T will use the identical four epoch values with `npm run epoch:register` in `backend/contracts`. The sender persists raw signed transaction/hash/nonce before broadcast and only returns success after all checks below pass.

```json
{
  "epoch_id": "1",
  "chain_id": "84532",
  "contract_address": "0xd17ba590b23e984e3f3408bcdc3529be9868ec50",
  "tx_hash": "0x<64 lowercase hex characters>",
  "block_number": "<decimal>",
  "block_hash": "0x<64 lowercase hex characters>",
  "status": "CONFIRMED",
  "checks": ["receipt.status=1", "receipt.to=trusted contract", "EpochRegistered", "epochs getter", "root/count/version match"]
}
```

F must store this anchor material and mark its epoch `CONFIRMED`; only then may it export public bundle proof + anchor. The browser verifier must use the approved Base profile and public RPC to reproduce `VALID`. A fresh unanchored receipt remains `PENDING`.

## Stop conditions

- Existing epoch with same root/count/version: do not resend; reconcile confirmation.
- Existing epoch with another nonzero root: `ROOT_CONFLICT`; no overwrite and no send.
- RPC transport failure: `PENDING`/availability issue, not hash mismatch.
- Different chain, contract, or publisher: `UNTRUSTED_ANCHOR`.
