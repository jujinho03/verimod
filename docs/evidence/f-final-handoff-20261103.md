# F final handoff — Redesign issuance and access boundary

Date: 2026-11-03 KST  
Base: `2a1ce3ab8d6cfb4527b283d9e4972ac79d0a181a`  
Scope: F-owned Redesign service, Backend API boundary, receipt retrieval. No chain transaction, signing, epoch freeze, policy approval, or TEST access was performed.

## Implemented

- Added an optional server-to-server `VERIMOD_INTERNAL_API_TOKEN` boundary to the Backend. When configured, caller-controlled `x-demo-principal` and `x-demo-role` are rejected without the internal token.
- Production startup for both the Backend and Redesign service now fails closed when the token is absent.
- New Receipt and bundle reads are scoped to the issuing principal when the internal boundary is enabled.
- The browser no longer reads a newly issued Receipt directly from `/api`. It uses the owner-token protected `/svc/sessions/:id/receipts/:receiptId/bundle` route.
- The service verifies both the session owner token and that the Receipt belongs to that session before proxying the bundle.
- Historical static W4 evidence remains on the existing `/evidence` path and was not modified.

## Verification performed

| Check | Result |
| --- | --- |
| Redesign unit/integration | PASS — 27/27 |
| Redesign TypeScript | PASS |
| Redesign production build | PASS |
| Backend unit/integration | PASS — 160 passed, 53 skipped |
| Backend TypeScript | PASS |
| Backend build | PASS |
| Missing internal token with configured Backend | PASS — direct spoofed Receipt request rejected (403) |
| Missing/wrong session owner token | PASS — protected bundle request rejected (403) |
| Correct session owner + internal service path | PASS — bundle returned; schema/hash/PENDING_ANCHOR assertions preserved |

The 53 Backend skips are the existing Windows callback/platform boundary and are not counted as PASS.

## Actual R01 status

The supplied handoff ZIP was read without extracting private material. The packaged `model.safetensors` SHA-256 was independently streamed and matched:

`a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f`

This host's current Python 3.10 environment does not contain the pinned PyTorch/Transformers runtime, while the lock was resolved for CPython 3.12. Therefore a current Redesign → live R01 run was **not executed** in this change and must not be reported as PASS. Existing integration tests use the explicitly labelled fixed test adapter.

## Readiness decision

- Core code/security regression: `PASS` for the tested boundary.
- Current Redesign → live R01 → 201/PENDING_ANCHOR: `BLOCKED_ENVIRONMENT` pending a pinned Python 3.12 runtime and a private isolated DB run.
- Public deployment: `NO-GO` until the live R01 run, HTTPS/reverse-proxy policy, rate/concurrency limits, and deployment environment token configuration are independently verified.
- Automatic Epoch/TX: unchanged and outside this commit. Option B remains the safe fallback.

