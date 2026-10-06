# VeriMod backend

W3 local implementation of the authoritative Decision Receipt issuance boundary.

## Implemented

- SQLite migration for `receipts`, `content_store`, `epochs`, `epoch_members`, `appeals`, `reviews`, and `idempotency_records`.
- `POST /api/decisions` with demo principal checks, required `Idempotency-Key`, stored response replay, conflict detection, and private issuance material.
- Public receipt, pre-anchor bundle, and manifest reads.
- Safe inference failure: the default adapter returns `503 INFERENCE_UNAVAILABLE` and creates no receipt.
- Route/principal boundaries for the eight planned business endpoints. Appeal/review workflow and epoch freeze return `501` until their scheduled implementation.

The role headers are a PoC authorization stub, not identity proof:

```text
x-demo-principal: <non-empty demo principal>
x-demo-role: DEMO_USER | DEMO_REVIEWER | DEMO_OPERATOR
```

The current server intentionally has no live model adapter. Tests inject a deterministic BEEP-shaped fixture with native classes `hate/offensive/none` and score keys `hate/offensive`; the fixture is not a trained model. The T-owned shared runtime schema still describes the legacy five-label demo, so the W3 entry freeze must close that consumer mismatch before live integration.

## Run

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```

`VERIMOD_DB_PATH` selects the SQLite file. The default is `./data/verimod.sqlite`. The server stays in safe-failure mode until a real inference and policy adapter are explicitly wired.
