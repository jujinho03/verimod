# AI-06 — Evaluation skeleton

Status: **W2 A-owner evidence, 2026-10-01.** These are metric implementations and selection logic checked only on synthetic fixtures. No model exists, no prediction was made, no threshold was chosen and nothing was computed on real data. Standard library only; no new dependency.

Code: [`ai/src/verimod_ai/evaluation/`](../../ai/src/verimod_ai/evaluation/) (`metrics.py`, `policy_metrics.py`, `selection.py`, `bootstrap.py`). Tests: `ai/tests/test_model_metrics.py`, `test_policy_metrics.py`, `test_selection.py`, `test_bootstrap.py`.

## Three separate layers

| Layer | Values | Used by |
|---|---|---|
| Native classifier classes | `hate / offensive / none` (single-label, 3-class) | model metrics |
| Consumer-facing harmful score keys | `hate / offensive` (`scores_ppm`) | I1 output ([AI-02](w2-taxonomy-decision.md)) |
| Policy actions | `ALLOW / HUMAN_REVIEW / RESTRICT` | policy metrics; produced by a separate policy layer |

None of these is derived from another inside the evaluation code. `none` is never treated as ALLOW.

## Model metrics (`metrics.py`)

- Confusion matrix `matrix[true][predicted]`, plus per-class precision, recall, F1 and support.
- Macro-F1 is the mean of per-class F1 over **all declared classes**, including zero-support classes.
- Micro-F1 equals accuracy for single-label multiclass.
- Zero-division rule: a zero denominator gives **0.0**, flagged `*_defined = False`. Deterministic, no warnings.
- Validation: equal lengths, at least one example, unique classes, no label outside the declared classes.

## Policy metrics (`policy_metrics.py`)

Input: given `(native_label, action, eligible)` cases. Population: eligible cases only.

| Metric | Definition |
|---|---|
| FRR | RESTRICT among clean (`none`) / clean |
| RP | harmful (`hate`, `offensive`) among RESTRICT / RESTRICT |
| HAR | ALLOW among harmful / harmful |
| HRR_TOTAL | HUMAN_REVIEW among eligible / eligible |

- A zero denominator gives **`None` (undefined)**, never 0.
- An eligible case with an unsupported label is rejected and must be marked ineligible, so a future Secondary record with an unsupported dimension can be excluded explicitly.
- No action is inferred from a label, and no rule or threshold is created here.
- **UNRESOLVED — exact HRR submetric denominator/attribution semantics.** `HRR_SCORE_BAND` and `HRR_TRUNCATED` are not defined in the repository, so `review_submetric()` raises `NotImplementedError`. No formula is guessed.

## Validation-only selection (`selection.py`, D25 WORKING ASSUMPTION)

- **Feasible:** `FRR <= X` and `HRR_TOTAL <= B`, with FRR, HRR_TOTAL and HAR all defined.
- **Objective:** minimum HAR.
- **Tie-break:** higher RP first (undefined RP ranks last), then lower HRR_TOTAL. `candidate_id` ascending is used only as a deterministic last resort.
- **No feasible candidate:** returns `None`.
- `max_frr` (X) and `max_hrr_total` (B) are required arguments in [0, 1] with **no defaults**. Their values are UNRESOLVED.
- Candidates must carry `split == "validation"`; any other split is rejected. TEST-based selection is impossible through this API.
- No real sweep was run. The tests use synthetic bounds 0.10 / 0.20, which are not proposals.

## Bootstrap CI (`bootstrap.py`)

The repository fixes no resample count, seed or interval method, so `n_resamples`, `seed` and `confidence_level` are **required, with no defaults**. The method is a percentile interval:

- Resampling uses `random.Random(seed)`.
- The interval is the sorted values at `floor(α/2·k)` and `ceil((1−α/2)·k)−1`.
- Undefined (`None`) resample statistics are counted and skipped.
- Optional `groups` resample whole groups. This is the cluster bootstrap suggested by the [AI-20](w2-eda.md) finding that validation is title-clustered.

Reproducibility is tested on synthetic values only. No dataset CI was computed.

## Dependencies and boundaries

- DEPENDENCY — downstream I1 consumer alignment required. The frontend/backend policy implementation is not imported, tested or changed. Parity with Node issuance waits for the F-owner implementation.
- Sealed TEST: not opened or evaluated. Training: NO. Threshold: NOT selected. Calibration: not claimed. Secondary: not adopted.
