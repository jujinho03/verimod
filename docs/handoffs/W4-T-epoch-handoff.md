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

## Mandatory F SQLite pre-broadcast acknowledgement

`backend/contracts/scripts/register-epoch.ts` never broadcasts a newly signed transaction until an explicit local callback runner obtains a successful acknowledgement from F's `EpochSenderHandoff.persistBeforeBroadcast()`. The runner receives the raw transaction only through stdin and returns only the public acknowledgement. It must run on the same approved host as the authoritative file-backed F SQLite database; no HTTP endpoint is used. The sender requires a host-approved `VERIMOD_F_PREBROADCAST_ACK_EXECUTABLE` and nonempty JSON `VERIMOD_F_PREBROADCAST_ACK_ARGS_JSON`. The runner must invoke F's existing adapter against that database, not a copy or synthetic database. Missing or malformed runner configuration stops before broadcast.

The acknowledgement must be `SUBMITTING` and exactly match epoch ID, root, count, protocol version, Base chain ID, approved contract, transaction hash, and nonce in T's durable journal. Any callback failure, timeout, malformed acknowledgement, or mismatch prevents broadcast. A copied/synthetic database is not authoritative evidence; the bridge must run on the approved host against the actual F freeze database.

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

## T submission boundary and F confirmation

T will use the identical four epoch values with `npm run epoch:register` in `backend/contracts`. The sender persists the raw signed transaction/hash/nonce before broadcast and, after receipt/event/getter identity checks, records only `SUBMITTED` in its own durable journal. A successful mined receipt is not F's authoritative `CONFIRMED` state.

`CONFIRMED` may be produced only by F's separate trusted post-confirmation process after it has independently checked the transaction receipt, trusted destination, `EpochRegistered` event, epoch getter values, canonical block hash, and at least 12 Base Sepolia confirmations. Until that F update is complete, public bundle proof/anchor fields remain null and the browser must not report `VALID`.

The following is the proposed F-owned confirmation material, not output emitted by the T sender:

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

F must store and independently verify this anchor material before marking its epoch `CONFIRMED`; only then may it export public bundle proof + anchor. The browser verifier must use the approved Base profile and public RPC to reproduce `VALID`. A fresh unanchored receipt remains `PENDING`.

## Stop conditions

- Existing epoch with same root/count/version: do not resend; reconcile confirmation.
- Existing epoch with another nonzero root: `ROOT_CONFLICT`; no overwrite and no send.
- RPC transport failure: `PENDING`/availability issue, not hash mismatch.
- Different chain, contract, or publisher: `UNTRUSTED_ANCHOR`.
