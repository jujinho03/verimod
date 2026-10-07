# VeriMod backend

W3 local implementation of the authoritative Decision Receipt issuance boundary.
The historical frontend synthetic demo can still operate without this server.

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

The current server has no live model adapter. Unit tests retain their synthetic BEEP-shaped fixture;
joint integration tests separately replay A's actual selected-model output fixture with native
`hate/offensive/none` and exposed `hate/offensive` scores. Shared schema validates the actual
`verimod-ko-beep-hate/1` profile separately from the historical five-label synthetic profile before persistence.
Fresh F commitments replace only the fixture transport commitment; model scores and manifest hash stay unchanged.
The fixed HUMAN_REVIEW policy in joint tests is a test dependency, not a threshold or policy lock.
`AppOptions.actualModelManifest` optionally exposes an approved actual manifest alongside explicitly legacy manifests.
See [W3 team integration](../docs/evidence/w3-team-integration.md) for the local checkpoint and boundaries.

## Run

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```

`VERIMOD_DB_PATH` selects the SQLite file. The default is `./data/verimod.sqlite`. The server stays in safe-failure mode until a real inference and policy adapter are explicitly wired.
