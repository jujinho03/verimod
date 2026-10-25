# W5 F PR #29 revalidation

Scope: F-only corrections on `nohyusin` after `bfcaf54fce3b3fc1f19508d3cc674bfb487858db`. This record does not replace W4 evidence, access TEST data, send a chain transaction, or claim T/F integration.

## F1 manifest evidence semantics

- A hash allowlist without a supplied manifest body is `NOT_CHECKED`.
- An unknown hash without a document is `NOT_CHECKED`.
- `PASSED` requires canonical domain-hashing of every referenced supplied document.
- A supplied document whose computed hash differs is `FAILED`.
- A DECISION with only the Model document remains `NOT_CHECKED` until the Policy document is also verified.
- REVIEW follows the same supplied-document rule. APPEAL remains unreferenced.
- These side checks do not change the Core result; a Core `VALID` receipt can have manifest `NOT_CHECKED`.

## F2 legacy browser storage

- The UI detects, without displaying, legacy `verimod:w4-live-decision:v1` and private `contents` / `appeals` in `verimod:state:v1`.
- A user can explicitly download a local backup before explicitly clearing the legacy private material.
- Cleanup removes the legacy live cache and sanitizes private maps while retaining valid public receipts and epochs. Malformed state is only removed after the same explicit cleanup action.
- New state persistence continues to store empty private maps. Generic error paths do not include owner text or salt.

## Local revalidation

| Command | Result |
| --- | --- |
| `frontend: npm test -- --maxWorkers=1` | PASS — 246/246, 23 files |
| `frontend: npm run build` | PASS |
| `frontend: npm run lint` | PASS — 2 existing warnings, 0 errors |
| `frontend: npm run w5:typecheck` | PASS |
| `backend: npm test` | PASS — 203/203, 12 files |
| `backend: npm run typecheck` | PASS |
| `backend: npm run build` | PASS |
| `frontend: npm run w5:browser -- --max-failures=1` | BLOCKED — browser regression did not complete in this Windows sandbox; no browser/mobile PASS is claimed |

## Integration boundary

Fetched remote `main` remains `8d0580a7ef6a7e88c2314e6f5f30ff5f08f693ab`; T reference `f8cec268d1baccc65035336a5cc232d22f9f5546` is not in `main`. No T branch was merged. PR #29 remains Draft pending T merge, a normal F merge of the updated `main`, integrated regression, browser/mobile execution, and GitHub CI for the new F commit.
