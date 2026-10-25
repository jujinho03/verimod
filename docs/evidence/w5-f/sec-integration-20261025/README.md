# W5 F independent SEC-W5-01 review and integration — 2026-10-25

**F security review: PASS. Windows approved writable Callback: UNSUPPORTED / FAIL-CLOSED.** This is a security restriction, not Windows writable Callback feature completion.

## Reviewed source and history

- Prior F: `a45e0d5b25e4918350f9d20f1dbb4dbef2b831f9`.
- T SEC: `baf8b36b3e8ce9089ea6c7496e716eefe27fe4ff`, whose single parent is exactly prior F.
- SEC diff contains exactly `backend/src/durabilityCallback.ts` and `backend/test/durability-callback.test.ts`.
- The F branch integrated SEC with `git merge --ff-only`. F follow-up test alignment is `90f400b426da6841ca72e0971eb264d0e5755a69`.
- The evidence commit changes documents only. Runtime/test source is identical to the tested candidate. No rebase, forced reset, force push, A branch change, or main merge was performed.

## Independent security assessment

The guard rejects Windows at the first statement in `openApprovedDatabase`, before evaluating `database_path`, filesystem checks, or the SQLite constructor. Independent exact-SEC code execution used a validated SYNTHETIC_TEST_ONLY approval and synthetic SQLite fixtures only:

1. Existing approved fixture: exact `WINDOWS_WRITABLE_NO_CREATE_UNSUPPORTED`, identical file hash afterward.
2. Approve then delete fixture: the same error, no replacement database, unchanged directory entries.
3. Trapped database-path getter: Windows guard error occurs before the getter can execute.

All three passed; [sanitized guard receipt](windows-guard.json). The deleted-file and pre-path cases were added as permanent regressions in the existing Windows guard group.

The Linux/non-Windows branch, no-create URI, DB file/header/identity checks, schema checks, and durable-journaling checks are unchanged. No `DatabaseSync(absolutePath)` production workaround or identity/no-create relaxation was introduced. This review verifies the Windows block and preservation of supported-platform code; it does not certify arbitrary untested platforms. Approval remains host-provisioned and untrusted stdin cannot choose a DB path.

## Windows regression alignment without hiding failures

Running the unmodified SEC SHA's entire Windows Backend suite gave **148 PASS / 3 FAIL / 53 SKIP (204 total)**. The three failures were approved reopen and confirmed-CLI success assumptions in `trusted-confirmation.test.ts`.

F changed test expectations only:

- Trusted identity: duplicate verification remains exercised on the existing synthetic connection. Windows explicitly rejects the approved writable reopen, then a **fixture-only read-only** connection checks persisted identity and evidence. Supported platforms keep the original approved reopen and post-reopen duplicate-verification assertions.
- Contradictory retry: common revocation/public-release assertions still execute. Windows asserts writable reopen denial and reads the persisted fixture read-only. Supported platforms retain the approved opener.
- Confirmed CLI: Windows must exit nonzero with the explicit sanitized guard, empty stdout, zero RPC requests, unchanged SUBMITTED state, and null public proof/anchor. Supported platforms retain the successful confirmed-CLI/RPC/release assertions.

No production opener was mocked, no platform was spoofed, no broad skip was added, and no Windows writable success was asserted. The existing **53** unsupported writable Callback cases remain SKIP. All **71** trusted-confirmation cases still execute on Windows; three now exercise the explicit platform denial contract. Two additional Windows-only guard tests are added.

## Integrated results

| Check | Result |
| --- | --- |
| Frontend complete unit run | 250 PASS / 0 FAIL / 0 SKIP, 23 files |
| Frontend build/typecheck/lint/w5:typecheck | PASS; two existing lint warnings |
| Windows complete Backend run | **153 PASS / 0 FAIL / 53 SKIP**, 206 total, one complete execution |
| Windows trusted-confirmation suite | 71/71 executed and PASS; approved writable feature remains unsupported |
| Backend typecheck/build | PASS |
| Basic browser | 1 PASS, 20/20 matrix assertions |
| W5 Desktop | 12 executed, 12 PASS, 0 FAIL, 3 live-RPC SKIP |
| W5 Mobile emulation | 12 executed, 12 PASS, 0 FAIL, 3 live-RPC SKIP |
| Live RPC Browser | 0 executed / 0 PASS / 6 SKIP, explicitly disabled |

Original SEC Linux CI [#257](https://github.com/jujinho03/verimod/actions/runs/40097294622) is SUCCESS: Ubuntu Backend **199 PASS / 0 FAIL / 5 SKIP**, 204 total. The skips are four Windows launcher tests and the original Windows guard case. That historical SEC run is not proof for F's new test changes. The final F SHA requires its own remote Linux CI; newly added Windows guard cases should remain platform skips there, never count as Linux passes.

Browser execution retained the existing test bodies/projects and used the previously verified owned Vite/Chromium adapter with an OS-selected loopback port, separate output paths, and clean server shutdown. No other user's server/port was terminated. New logs are under ignored `private-data/w5-sec-review-20261025-01/`, and public/synthetic screenshots under `private-data/w5-final-browser/w5-sec-review-20261025-01-owned/`. This is mobile emulation, not physical-device QA. [Aggregate receipt](validation.json).

## W4, ownership and delivery gate

The earlier inventory of 53 W4 documents was checked again with identical SHA-256 values. `shared/**`, `frontend/**`, and historical W4 evidence paths have an empty diff against prior F. Model/Policy Manifest, Receipt hashing, canonicalization and Merkle algorithms are unchanged. Synthetic test DB creation/deletion is confined to test-owned directories; no authoritative DB, key, sealed TEST data, signing, broadcast, actual Epoch submission, S1 approval or policy LOCK was used. Policy remains `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`.

F (노유신 / ysn-0215) independently assessed T's SEC implementation and added the above F test alignment. T must formally review the final F SHA's F features, alignment tests, and integration contracts. T's own approval of the SEC implementation does not replace this F independent SEC review. PR #29 stays Draft until exact-SHA CI and independent T review are checked. Main merge requires the team leader's approval; this run does not perform it. Live-RPC browser execution, physical mobile QA, team policy approvals and the final 21:00 KST Gate-5 decision remain separate.
