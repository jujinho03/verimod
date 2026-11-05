# Auto Anchor: local Base Sepolia validation (2026-11-03)

This is the phase 1 local result. It does not deploy the GCP phase 2 services. The W4 publisher, contract, epoch 1, and evidence files are unchanged.

## Dedicated demo target

- Publisher: `0x8Ef5F1E4aC6AFcd780B0966407b5f32Fd06B918D`
- Contract: `0x05dC13B9F35F0BBC37f662c621831A2394F66312`
- Deployment transaction: `0xacf3e948a5e904bd05ace04aa56e15ef80e742f6026ab23320bca5b4df9fed8d`
- Deployment block: `53922032`; chain ID: `84532`
- The only manual step was claiming 0.001 test ETH from the Base Sepolia faucet to the public publisher address. No real ETH deposit was required.

## Local result

| Check | Result | Evidence |
| --- | --- | --- |
| Browser issuance and automatic epoch | PASS | Direct-input receipt `2d710a61-c281-48d9-9488-afcfd83d5560`, epoch 6 |
| Durable ACK before broadcast | PASS | Epoch 3 remained SUBMITTING after an injected post-ACK exit; recovery replayed its exact saved raw transaction, nonce 3 |
| Base Sepolia, 12 confirmations, CONFIRMED | PASS | Epoch 6 transaction `0x27d5932cfe6e686a8ecbddf7a96251f452792c438b7a7dd8e5020fbd0dd1f08a`, block `53960749` |
| Public proof/anchor and browser verification | PASS | Browser result VALID for new receipt and original W4 `evidence-0`; six ledger/hash/proof stages passed |
| Recovery and duplicate registration | PASS | Before ACK: epoch 2; after ACK: epoch 3; after broadcast: epoch 4; unknown RPC response plus backend restart: epoch 5. All reached CONFIRMED with unique nonces 2–5. Duplicate broadcast report returned 409 and next job was null. |

The Worker journal stores phases and hashes, not signed bytes. The backend stores signed raw bytes durably in the local SQLite file before ACK and returns them only through the authenticated Worker recovery endpoint. Public receipt and epoch responses omit signed bytes.

## Local processes and environment

Use separate processes for R01 (8099), backend (3001), root UI (5190), root session service (3101), and Signer Worker. The local SQLite file is `backend/data/auto-demo.sqlite`, outside the tracked tree. The backend and Worker env files are under `C:\Users\User\VeriModSecrets`, outside the repository. Do not copy either into Git.

Backend env keys: `VERIMOD_AUTO_ANCHOR=true`, `VERIMOD_AUTO_ANCHOR_TOKEN`, `VERIMOD_AUTO_ANCHOR_CONTRACT`, `VERIMOD_AUTO_ANCHOR_PUBLISHER`, `VERIMOD_AUTO_ANCHOR_RPC_URL`, `VERIMOD_AUTO_ANCHOR_COOLDOWN_MS`, `VERIMOD_DB_PATH`, `PORT`, `VERIMOD_W4_PROVISIONAL_E2E_ONLY`, `VERIMOD_INFERENCE_URL`, `VERIMOD_MODEL_MANIFEST_PATH`, `VERIMOD_POLICY_MANIFEST_PATH`, `VERIMOD_POLICY_MANIFEST_HASH`, and the four policy threshold variables.

Worker env keys: `VERIMOD_DEPLOYER_PRIVATE_KEY`, `VERIMOD_BASE_SEPOLIA_RPC_URL`, `VERIMOD_AUTO_ANCHOR_TOKEN`, `VERIMOD_AUTO_ANCHOR_CONTRACT`, `VERIMOD_AUTO_ANCHOR_PUBLISHER`, `VERIMOD_BACKEND_URL`, `VERIMOD_WORKER_JOURNAL`. The private key belongs only in the Worker env file. `VERIMOD_WORKER_FAILPOINT` is for local crash tests only.

## Later GCP and separate Worker move

Keep the backend SQLite and token on the GCP web host, and put the private key and token on the separate Worker host. Run the existing `verimod-ai` service on 8099, `verimod-backend` with `WorkingDirectory=/opt/verimod/app/backend` and an `EnvironmentFile` outside the repository, and `verimod-svc` on 3101. Run a separate `verimod-signer-worker` systemd unit on the Worker host with its own protected `EnvironmentFile`, working directory, and restart policy. Do not give the backend unit access to the Worker key file. Install the Worker runtime dependencies on that host; the local script currently runs through `tsx`.

Caddy must serve the root UI build and proxy `/api/*` to backend 3001 and `/svc/*` to session service 3101. The separate Worker needs a reachable HTTPS backend URL for `/api/auto-anchor/*` with its bearer token. Keep that token out of Caddy access logs. Confirm the GCP firewall, TLS route, service user permissions, and persistent SQLite location before phase 2 deployment. The root UI's immutable `BASE_SEPOLIA_AUTO_DEMO` profile is pinned to the dedicated contract, publisher, and deployment block; the old W4 profile remains available.

The production-ready systemd templates and secret-free environment examples are in [`deploy/systemd`](../deploy/systemd/README.md). They are required in addition to pulling Git: the backend drop-in enables the batcher, and the Worker unit performs durable signing and broadcast. On 2026-11-04, the GCP host was recovered with this layout; a previously pending receipt reached epoch 20 and a fresh production receipt reached epoch 21 and `CONFIRMED` after 12 confirmations.
