# W3 — A / 주진호

Status: **W3_A_COMPLETE_WITH_INTEGRATION_BLOCKER**, subject to final commit/push verification described
in [final closure](../evidence/w3-a-final.md). This file records A only.

| Ticket | A status | Evidence |
|---|---|---|
| AI-07 | COMPLETE | [Official baseline R01](../evidence/w3-a-ai07-baseline-run.md) |
| AI-21 | COMPLETE | `ai/experiments/registry.jsonl`, KEEP_AS_W3_BASELINE |
| AI-08 | COMPLETE | Actual model manifest + shared canonical hash |
| AI-16 | COMPLETE — A package | [Reproducibility/handoff](../evidence/w3-a-reproducibility-handoff.md), actual synthetic fixture, generator/verifier |

Source snapshot: `f6b39d3b7c5637b68e18c2b1b59ee91890c059f0`. Historical pyproject hash limitation
is approved and documented. TEST sealed; no Secondary, calibration, threshold or policy lock.
Cross-machine verification NOT_EXECUTED. Local fixture replay matched exactly in two processes.

F branch validator passes the actual two harmful score keys, but main/shared Receipt schema still rejects
the actual taxonomy. Latest fetched origin/main was the pre-W3 base; F/T work remained on separate branches.
Their full W3 status is not inferred from A tests. No branch merge beyond the authorized main sync was performed.
Actual authoritative Receipt / Hardhat / external anchor integration remains unexecuted; PENDING_ANCHOR.

No W4 work started.
