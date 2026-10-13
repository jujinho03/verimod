# AI-20 — BEEP! Primary EDA (TRAIN + VALIDATION)

Status: **W2 A-owner EDA evidence, 2026-10-01**. Aggregate statistics only. No model training, inference, TEST evaluation or final threshold. Taxonomy conclusions are in [AI-02 decision](w2-taxonomy-decision.md).

## Reproducibility and input scope

| Item | Value |
|---|---|
| Dataset / revision | BEEP! Korean HateSpeech, `f8d05dce2b22007bb149e5139c0060c68ad8f94b` ([AI-04](w2-primary-dataset-decision.md)) |
| Split | seed `45126`, `group-greedy-class-aware-v1` ([AI-04/AI-15](w2-split-leakage.md)) |
| Input read | local `train.jsonl` (5,857) and `validation.jsonl` (1,255) only; counts and class counts reconciled against the AI-04 evidence before any statistic |
| Sealed TEST | **not opened**. Only the pre-seal aggregate from AI-04 is quoted. The script rejects any path starting with `test` |
| Script | [`ai/scripts/eda_w2.py`](../../ai/scripts/eda_w2.py), `w2-eda-v1`, Python standard library only |
| Python | 3.12.14 (recorded run); re-run on 3.10.21 gives identical figures and statistics |
| Determinism | no sampling; two runs produce byte-identical outputs |
| Outputs | [`summary.json`](../../ai/artifacts/reports/w2_eda/summary.json) and six SVG figures in [`ai/artifacts/reports/w2_eda/`](../../ai/artifacts/reports/w2_eda/) |

Length is counted in Unicode code points of the stored comment, without normalization. Percentiles use the nearest-rank method. No comment or title text appears in any output; the script checks this before writing, and tests check it on synthetic fixtures.

Command (from `ai/`):

```sh
python scripts/eda_w2.py --splits-dir ../../verimod-local-data/w2/beep-splits --evidence ../../verimod-local-data/w2/beep-evidence.json
```

## A. Overview

| Split | Count | Source of numbers |
|---|---:|---|
| train | 5,857 | local artifact |
| validation | 1,255 | local artifact |
| internal TEST | 1,255 | AI-04 pre-seal aggregate only |

Native target: hate axis `hate / offensive / none`, single-label. Auxiliary axes: `bias` (`gender / others / none`) and `contain_gender_bias` (True/False).

## B. Label distribution — [fig1](../../ai/artifacts/reports/w2_eda/fig1_label_distribution.svg)

| Split | hate | offensive | none |
|---|---:|---:|---:|
| train | 1,423 (24.30%) | 1,882 (32.13%) | 2,552 (43.57%) |
| validation | 305 (24.30%) | 403 (32.11%) | 547 (43.59%) |
| TEST (pre-seal aggregate) | 305 | 403 | 547 |

## C. Length distribution — [fig2](../../ai/artifacts/reports/w2_eda/fig2_length_histogram.svg), [fig3](../../ai/artifacts/reports/w2_eda/fig3_length_percentiles.svg)

| Split | min | p50 | mean | p90 | p95 | p99 | max |
|---|---:|---:|---:|---:|---:|---:|---:|
| train | 4 | 31 | 38.79 | 81 | 97 | 120 | 135 |
| validation | 4 | 31 | 38.60 | 79 | 97 | 118 | 128 |

Median length by label (train / validation): hate 38 / 38, offensive 31 / 31, none 26 / 28.

## D. Over 500 code points

| Split | Count | Share |
|---|---:|---:|
| train | 0 | 0.00% |
| validation | 0 | 0.00% |

500 is the current preprocessing candidate boundary from the synthetic PoC, not a final production length.

## E. Bias axis — [fig4](../../ai/artifacts/reports/w2_eda/fig4_bias_distribution.svg)

| Split | bias=gender | bias=others | bias=none | contain_gender_bias=True | False |
|---|---:|---:|---:|---:|---:|
| train | 887 (15.14%) | 1,102 (18.82%) | 3,868 (66.04%) | 887 (15.14%) | 4,970 (84.86%) |
| validation | 203 (16.18%) | 241 (19.20%) | 811 (64.62%) | 203 (16.18%) | 1,052 (83.82%) |

`contain_gender_bias=True` coincides exactly with `bias=gender` in both splits (train 887/887, validation 203/203, no other combination). The bias axis is not merged into the training target.

## F. Label × bias — [fig5](../../ai/artifacts/reports/w2_eda/fig5_label_bias_heatmap.svg)

Counts, then share within each native label.

| train | gender | others | none |
|---|---:|---:|---:|
| hate | 561 (39.42%) | 454 (31.90%) | 408 (28.67%) |
| offensive | 272 (14.45%) | 549 (29.17%) | 1,061 (56.38%) |
| none | 54 (2.12%) | 99 (3.88%) | 2,399 (94.00%) |

| validation | gender | others | none |
|---|---:|---:|---:|
| hate | 134 (43.93%) | 91 (29.84%) | 80 (26.23%) |
| offensive | 51 (12.66%) | 123 (30.52%) | 229 (56.82%) |
| none | 18 (3.29%) | 27 (4.94%) | 502 (91.77%) |

This is descriptive co-occurrence. It does not establish correlation strength or causality.

## G. News-title proxy groups — [fig6](../../ai/artifacts/reports/w2_eda/fig6_title_group_sizes.svg)

| Split | Unique title groups | min | p50 | mean | p95 | max | Singleton groups |
|---|---:|---:|---:|---:|---:|---:|---:|
| train | 1,154 | 1 | 5 | 5.08 | 7 | 8 | 19 |
| validation | 162 | 2 | 8 | 7.75 | 10 | 12 | 0 |

Train ↔ validation title-proxy overlap recomputed from the two artifacts: **0**. The title is a group proxy, not an article or author ID.

## H. Duplicates and leakage (AI-15 summary, not re-checked)

From [AI-15 evidence](w2-split-leakage.md): exact and normalized duplicate excess 0; conflicting-label quarantine 0; cross-split record, exact, normalized, title-group and near-cluster overlap 0. Near-duplicate check is partial: 3-gram Jaccard ≥ 0.90 on texts of 12+ characters, 2 matched pairs, 857 short texts skipped. TEST leakage was not re-checked here.

## I. Class imbalance

Train largest / smallest = none / hate = 2,552 / 1,423 = **1.793**.

## Implications

Each item separates the observation from its interpretation. Interpretations are inputs to W3 planning, not decisions.

1. **Length boundary never triggers.**
   - Observation: max 135 code points; 0 records over 500.
   - Interpretation: the Primary data cannot exercise the `TRUNCATED` path. It must be tested with synthetic fixtures. The real model input limit must be set in tokenizer tokens during W3, not inferred from code points. The data covers only short entertainment-news comments, which limits external validity for longer content.
2. **Imbalance is mild.**
   - Observation: ratio 1.79, with identical class shares across train, validation and the TEST aggregate.
   - Interpretation: aggressive resampling is not indicated. Report Macro-F1 together with per-class metrics. Class weighting is optional and should be judged on validation only.
3. **Harmful labels co-occur with the bias axis.**
   - Observation: 71.3% of train `hate` rows have `bias≠none`, against 6.0% of `none` rows.
   - Interpretation: a model may learn group or gender mentions as a shortcut. Evaluation should slice errors by bias value. This is a risk to check, not a causal finding.
4. **Validation is more clustered than train.**
   - Observation: validation has 162 title groups with mean size 7.75; train has 1,154 groups with mean size 5.08. This follows from the size-first group allocator.
   - Interpretation: validation records are not independent. The effective sample size is below 1,255, so threshold selection (D25) should report group-aware uncertainty, for example a title-group bootstrap.
5. **Length differs by label.**
   - Observation: train medians are 38 (hate), 31 (offensive) and 26 (none).
   - Interpretation: length is a possible shortcut feature. Include length-stratified error analysis.
6. **`hate` and `offensive` are adjacent native classes.**
   - Observation: `offensive` is the largest harmful class (32.1%). The [AI-01 research](ai-01-02-dataset-taxonomy.md#annotation-reliability-and-release-caveats) records the paper's hate-axis Krippendorff's alpha as 0.496.
   - Interpretation: expect `hate` ↔ `offensive` confusion. The confusion matrix and per-class F1 matter more than a single score. Whether policy uses each score separately or together is a policy-layer decision.
7. **One bias flag is redundant.**
   - Observation: `contain_gender_bias` duplicates `bias=gender`.
   - Interpretation: treat them as one auxiliary signal and do not double-count them in slices.

## Boundaries

TEST opened: NO. TEST evaluated: NO. Training: NO. Raw text in outputs: NO. Secondary dataset: not adopted. FRZ-01 / Team GATE-2: not declared.
