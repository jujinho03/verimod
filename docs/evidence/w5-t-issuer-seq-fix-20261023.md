# W5 T issuer_seq UUID-collision fix receipt

- PR under review: #28, starting head `f8cec268d1baccc65035336a5cc232d22f9f5546`.
- Review cause: a distinct DECISION and APPEAL can reuse a UUID, causing the prior UUID-only direct-link test to skip the intermediate issuer sequence check.
- Fix: lifecycle evaluation now receives the verified body, subject, and previous receipt hashes. A direct link requires equal verified hashes. Different hashes reusing any linked `receipt_id` fail lifecycle explicitly, including a current receipt collision.
- Scope: provided, verifiable links only. This does not claim issuer-wide history completeness or prove no hidden records exist.

## Regression evidence

- New end-to-end in-memory ledgers generate independent receipt hashes, Merkle proofs, and anchored epochs. No chain, operating database, original content, salt, key, or TEST data is used.
- DECISION seq 10 -> APPEAL seq 30 (same UUID, different hash) -> REVIEW seq 20: Core `VALID`, Lifecycle `FAILED`.
- The same reversed sequence with distinct UUIDs: Lifecycle `FAILED`.
- Hash-identical direct REVIEW: Lifecycle `PASSED`.
- Existing APPEAL/review, missing history, RPC unavailable, and anchor-pending lifecycle tests remain in `verify.test.ts`.
- `frontend npm test`: 20 files / 206 tests PASS (exit 0).
- `frontend npm run lint`: exit 0, with two existing optional-chaining warnings in `src/api/client.test.ts`.
- `frontend npm run build`: PASS (exit 0).
- `frontend npm run test:browser`: 1 PASS (exit 0).
- Backend was not changed. Its local test/typecheck/build attempt is BLOCKED by a pre-existing missing `ethers` package in this worktree; 60 tests passed and 3 suites could not import the dependency.

## Boundaries

- Windows SQLite direct-path work, policy LOCK, TEST data, chain sends, main merge, and F-owned branch changes are out of scope.
- F integration must use F SHA `85a72a75` and remain a local temporary validation until F authorizes a branch update.
