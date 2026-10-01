# W1 T Evidence — DOC-12(T) and CHAIN-01

- Owner: T / 설경민
- Recorded: 2026-10-01. This is a late W1 evidence separation; it does not claim the material existed during the nominal W1 period.
- Scope: only DOC-12(T) protocol review and CHAIN-01 wallet-handling evidence. It does not include W2 bytes, schema, vectors, Merkle, AI, service, deployment, or funding work.

## DOC-12(T) — protocol review of inference-attestation handoff

T reviewed the existing [DOC-12(A) research note](tee-inference-attestation-w1.md) against the current receipt and verification boundaries. The existing `model_manifest_hash` identifies the recorded model manifest; it must not be presented as proof that a particular model processed a particular input. A future signature or TEE attestation must bind an explicitly versioned statement to the relevant model/input/output commitments and freshness, with verifier policy evaluating the attestation chain and reference values.

This W1 review makes no protocol-field, canonical-byte, schema, key-management, provider, or ABI decision. It does not claim a TEE, inference signing, remote attestation verifier, or model-execution proof is implemented. Those remain follow-up work and require the normal freeze/spec-change process before they can affect receipt bytes or TrustProfile.

Evidence boundary: this is T's repository handoff review of the existing W1 research note, not evidence that an external attestation was generated or verified.

## CHAIN-01 — dedicated test-wallet handling evidence

The repository contains a narrow helper, [`provision-test-wallet.mjs`](../../backend/contracts/scripts/provision-test-wallet.mjs), for a dedicated Base Sepolia test wallet. Its observable safety behavior is limited to: refuse to overwrite an existing `.env`; create a random wallet; write the private key only to `.env` with mode `0600`; and print the address without printing the private key. The versioned [`.env.example`](../../backend/contracts/.env.example) contains placeholders only, and the real `.env` is excluded from Git.

Historical W1 source evidence recorded a dedicated wallet creation and a zero-balance observation. This PR does not recreate a wallet, access a private key, query wallet balance, request faucet funds, send a transaction, deploy a contract, or claim an anchor exists. Therefore wallet funding and transaction-sending readiness remain **NOT DONE / NOT VERIFIED**.

The nearby RPC configuration and read-only chain-id checks are CHAIN-02 evidence, not CHAIN-01 completion. They are intentionally not changed by this PR.

## Result

| Ticket | Result | Explicit non-claim |
|---|---|---|
| DOC-12(T) | PASS — protocol-boundary review/handoff evidence | no TEE, signature, attestation, schema, ABI, or provider implementation |
| CHAIN-01 | PASS — dedicated-wallet handling and historical-evidence boundary recorded | no funded wallet, transaction, deployment, or epoch anchor |
