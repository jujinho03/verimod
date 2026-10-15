# VeriMod backend

Authoritative Decision Receipt issuance and W4 epoch handoff service.

## Implemented

- SQLite persistence for receipts, private content, epochs, members, lifecycle placeholders, and idempotency records.
- `POST /api/decisions`: demo principal boundary, required `Idempotency-Key`, replay/conflict handling, private issuance material, and safe `503 INFERENCE_UNAVAILABLE` failure.
- `POST /api/epochs/freeze`: atomic allocation from uint64 epoch `1`, deterministic member/root/count freeze, same-key replay, empty-candidate `409`, and one-receipt/one-epoch enforcement.
- `GET /api/epochs/:id`: `FROZEN / SUBMITTING / SUBMITTED / CONFIRMED / FAILED` plus durable sender fields.
- `GET /api/receipts/:id/bundle`: body/hash only before an authenticated anchor is recorded; Merkle proof and public anchor afterward. Raw text, salt, signed transaction, and private package are excluded.
- `EpochService` sender handoff methods persist signed raw transaction/hash/nonce before submission and reject conflicting retries.
- Optional I1 HTTP inference adapter and validation-configured Node policy evaluator. Missing configuration keeps the server in safe-failure mode.

The role headers are a PoC authorization stub, not identity proof:

```text
x-demo-principal: <non-empty demo principal>
x-demo-role: DEMO_USER | DEMO_REVIEWER | DEMO_OPERATOR
```

## Runtime configuration

`VERIMOD_DB_PATH` selects the SQLite file. The default is `./data/verimod.sqlite`.

The R01 W4 provisional technical E2E path requires an explicit local-only switch, the two pinned A manifest snapshots, a loopback inference endpoint, and all four matching thresholds:

```text
VERIMOD_W4_PROVISIONAL_E2E_ONLY=true
VERIMOD_INFERENCE_URL=http://127.0.0.1:<port>/infer
VERIMOD_INFERENCE_TIMEOUT_MS=8000
VERIMOD_MODEL_MANIFEST_PATH=./config/w4-r01.model_manifest.json
VERIMOD_POLICY_MANIFEST_PATH=./config/w4-provisional.policy_manifest.json
VERIMOD_POLICY_MANIFEST_HASH=0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e
VERIMOD_HATE_REVIEW_PPM=24495
VERIMOD_HATE_RESTRICT_PPM=216950
VERIMOD_OFFENSIVE_REVIEW_PPM=180483
VERIMOD_OFFENSIVE_RESTRICT_PPM=646501
```

The server binds only to `127.0.0.1`. These thresholds are W4 provisional test values, not an approved operational default. The model and policy hashes are pinned to A's R01 and W4 manifest snapshots; each request checks the canonical manifest hashes and the active policy thresholds. Missing or mismatched inputs return `503` before a Receipt is persisted. X/B and team approval remain pending.

The frontend live path uses these build values:

```text
VITE_VERIMOD_LIVE_ENABLED=true
VITE_VERIMOD_API_URL=
VITE_BASE_SEPOLIA_CONTRACT_ADDRESS=0x...
VITE_BASE_SEPOLIA_PUBLISHER=0x...
VITE_BASE_SEPOLIA_RPC_URLS=https://primary.example,https://backup.example
VITE_BASE_SEPOLIA_DEPLOYMENT_BLOCK=<actual deployment block>
VITE_BASE_SEPOLIA_MIN_CONFIRMATIONS=<team-approved value>
```

An empty `VITE_VERIMOD_API_URL` uses the same origin; Vite development proxies `/api` to port 3001. The Base verifier is hidden unless every approved profile value is valid. Local mode is always labeled as a fallback and is not public-chain evidence.

## Run

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```
