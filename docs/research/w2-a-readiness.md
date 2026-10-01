# W2 A-side Gate-2 Readiness

Status: **A-owner readiness/evidence packet, 2026-10-01.** Audit baseline: main `edbf446d834aa75078493337b617a379c1757509` (PR #20 merge).

This is **not** a Team Gate-2 PASS and **not** an FRZ-01 freeze. It lists what A can hand to the team, with every remaining dependency stated. Other owners' W2 status is not assessed here.

The audit used repository evidence only. The sealed internal TEST artifact was not opened, re-hashed or re-counted; its count and SHA-256 are quoted from [AI-04/AI-15 evidence](w2-split-leakage.md).

## Ticket audit

| Ticket | A-owner state | Evidence |
|---|---|---|
| AI-04 | **COMPLETE** | [Primary decision](w2-primary-dataset-decision.md), [split and seal](w2-split-leakage.md), [`ai/configs/w2_dataset.json`](../../ai/configs/w2_dataset.json), [`ai/scripts/prepare_w2_dataset.py`](../../ai/scripts/prepare_w2_dataset.py) |
| AI-15 | **PARTIAL** — PRIMARY INTERNAL LEAKAGE COMPLETE; **BLOCKED — Secondary dataset not yet adopted**; Primary↔Secondary overlap NOT DONE | [split and leakage](w2-split-leakage.md) |
| AI-20 | **COMPLETE** | [EDA](w2-eda.md), [`ai/scripts/eda_w2.py`](../../ai/scripts/eda_w2.py), [`ai/artifacts/reports/w2_eda/`](../../ai/artifacts/reports/w2_eda/) (6 SVG + `summary.json`) |
| AI-02 | **COMPLETE** — A-side decision, PROPOSED FOR GATE-2 | [taxonomy decision](w2-taxonomy-decision.md), [`taxonomy.py`](../../ai/src/verimod_ai/data/taxonomy.py), [`label_mapping.py`](../../ai/src/verimod_ai/data/label_mapping.py) |
| AI-05 | **COMPLETE** | [preprocessing v1](w2-preprocessing.md), [`preprocessing.py`](../../ai/src/verimod_ai/data/preprocessing.py) |
| AI-06 | **COMPLETE** — skeleton only | [evaluation skeleton](w2-evaluation-skeleton.md), [`ai/src/verimod_ai/evaluation/`](../../ai/src/verimod_ai/evaluation/) |

Audited values:

- **AI-04:**
  - BEEP! Korean HateSpeech at `f8d05dce2b22007bb149e5139c0060c68ad8f94b`, CC BY-SA 4.0
  - Pool = public labeled train + dev (8,367); official hidden-label TEST not used
  - Internal split train 5,857 / validation 1,255 / TEST 1,255, seed `45126`, `group-greedy-class-aware-v1`
  - TEST sealed with SHA-256 `ba9b87bde42e5eba8b3c5ca5f2423553a2f913400fd202d30b9e4bd00eb8138e`
  - Source data stays outside Git
- **AI-15:**
  - Exact and normalized duplicate excess 0; conflicting-label quarantine rule present (0 rows affected)
  - Title-proxy group atomicity; cross-split record, exact, normalized, title and near-cluster overlap 0
  - Near duplicates: 3-gram Jaccard ≥ 0.90 heuristic, partial — 857 short texts skipped

## Readiness matrix

| # | Item | A-owner state | Evidence | Remaining dependency | Gate implication |
|---:|---|---|---|---|---|
| 1 | Primary dataset | COMPLETE | [AI-04](w2-primary-dataset-decision.md) | — | Ready to present |
| 2 | Dataset revision / license | COMPLETE | pinned SHA, CC BY-SA 4.0, file SHA-256 table | Attribution / ShareAlike obligations apply to any redistribution | Ready to present; license duties carried forward |
| 3 | Deterministic split | COMPLETE | [split](w2-split-leakage.md), `w2_dataset.json` | — | Ready to present |
| 4 | TEST seal | COMPLETE | count 1,255 + SHA-256 recorded | TEST methodology (Row-25) UNRESOLVED | Sealed until W5; use rule needs a team decision |
| 5 | Leakage — Primary internal | COMPLETE | [AI-15](w2-split-leakage.md) | Near-duplicate check partial (short texts) | Ready, with limitation stated |
| 6 | Leakage — Primary↔Secondary | BLOCKED | — | Secondary dataset not yet adopted | Does not block Primary training (D28 WA); blocks external-evaluation leakage claims |
| 7 | EDA | COMPLETE | [AI-20](w2-eda.md) | — | Ready to present |
| 8 | Supported taxonomy | PROPOSED FOR GATE-2 | [AI-02](w2-taxonomy-decision.md) | DEPENDENCY — downstream I1 consumer alignment required | Team decision at GATE-2 |
| 9 | Taxonomy ID / version | PROPOSED FOR GATE-2 | `verimod-ko-beep-hate` / `1` | Same as 8 | Team decision at GATE-2 |
| 10 | Preprocessing version | COMPLETE | `verimod-ko-text-v1` ([AI-05](w2-preprocessing.md)) | Tokenizer limit is W3 | Freeze candidate |
| 11 | FULL / TRUNCATED semantics | COMPLETE (synthetic-test validated) | [AI-05](w2-preprocessing.md) | Policy handling of `TRUNCATED` is a policy-layer rule | Freeze candidate |
| 12 | Model metrics | COMPLETE (implementation) | [AI-06](w2-evaluation-skeleton.md) | No model yet | Freeze candidate (metric set) |
| 13 | Policy metrics | COMPLETE (implementation) | [AI-06](w2-evaluation-skeleton.md) | Actions come from a policy layer | Freeze candidate (metric set) |
| 14 | Threshold-selection rule | READY (D25 WORKING ASSUMPTION, implemented) | `selection.py` | Team adoption of D25 | Freeze candidate (rule only) |
| 15 | Actual X / B | UNRESOLVED | — | Team decision | Not freezable now |
| 16 | Bootstrap implementation | COMPLETE (utility only) | `bootstrap.py` | Resample count, seed and confidence level not decided | Utility ready; settings not frozen |
| 17 | HRR sub-metric semantics | UNRESOLVED | `review_submetric()` placeholder | Denominator / attribution definition | Not freezable now |
| 18 | I1 downstream consumer alignment | BLOCKED | [AI-02 dependencies](w2-taxonomy-decision.md#dependencies--not-changed-by-a) | BLOCKED — T owner 산출물 필요; BLOCKED — F owner 산출물 필요 | GATE-2 / FRZ-01 cannot close on A evidence alone |
| 19 | Model training | W3 | — | Model and tokenizer choice | Not a W2 item |
| 20 | TEST evaluation | W5 | — | Row-25 methodology; trained model | Not a W2 item |

## A-side semantic freeze candidates

**NOT FROZEN BY A ALONE.** These are what A submits to the team for FRZ-01. Freezing them requires team agreement.

| Candidate | Proposed value |
|---|---|
| Primary dataset | BEEP! Korean HateSpeech, pinned revision `f8d05dce2b22007bb149e5139c0060c68ad8f94b` |
| Native target | `hate / offensive / none`, single-label 3-class |
| Supported harmful score keys | `hate`, `offensive` |
| Reference class | `none` (not a score key, not ALLOW) |
| Taxonomy ID / version | `verimod-ko-beep-hate` / `1` |
| Preprocessing | `verimod-ko-text-v1` |
| Input status | `FULL` / `TRUNCATED` |
| W2 code-point boundary | 500 (head truncation; not a tokenizer limit) |
| Model metric set | Macro-F1, Micro-F1, per-class precision / recall / F1 / support, confusion matrix |
| Policy metric set | FRR, RP, HAR, HRR_TOTAL |
| Selection objective | `FRR <= X AND HRR_TOTAL <= B`, then minimum HAR; ties → higher RP, then lower HRR_TOTAL; validation only |

**Not freeze candidates:** X, B, actual thresholds, calibration, final trained model, HRR_SCORE_BAND exact semantics, HRR_TRUNCATED exact semantics, Secondary dataset.

Semantics carried with the candidates: model class ≠ policy action; dataset label ≠ reason_code; an uncalibrated score is not a probability.

## Downstream dependencies (outside A scope)

- **DEPENDENCY — downstream I1 consumer alignment required.** The current I1 consumers (`frontend/src/domain` types, schema, policy and manifest) use the synthetic 5-label taxonomy `verimod-example-ko / 0`. Moving to the A-side taxonomy is not A's change.
  - BLOCKED — T owner 산출물 필요 (protocol/schema side of the I1 freeze)
  - BLOCKED — F owner 산출물 필요 (issuance/consumer implementation)
- **Policy parity with Node issuance:** BLOCKED — F owner 산출물 필요.
- **Content commitment:** handled outside AI preprocessing. A defines no commitment or hashing.

These record dependency existence only; no T/F implementation is assessed.

## W3 readiness (A view; W3 not started)

| Entry condition | State |
|---|---|
| Primary pinned | YES |
| TRAIN / VALIDATION available | YES (local artifacts outside Git) |
| TEST sealed | YES |
| Taxonomy proposal | YES (PROPOSED FOR GATE-2) |
| Preprocessing v1 | YES |
| Evaluation skeleton | YES |
| Model architecture | NOT YET EXECUTED — W3 (D01 direction: Korean encoder fine-tuning) |
| Tokenizer max token length | W3 |
| Training | NOT STARTED |
| Secondary overlap | BLOCKED, but Secondary is not part of Primary training by default (D28 WORKING ASSUMPTION) |
| Training runtime / accelerator environment | W3 |

## Boundaries

Secondary adopted: NO. Sealed TEST opened: NO. Training: NO. Actual threshold: NO. Calibration: NO. T/F modified: NO. FRZ-01 PASS: NO. Team GATE-2 PASS: NO. Team W2 COMPLETE: NO.
