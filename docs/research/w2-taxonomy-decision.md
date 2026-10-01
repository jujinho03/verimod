# AI-02 — A-side supported taxonomy decision (W2)

Status: **A-side decision evidence, 2026-10-01 — PROPOSED FOR GATE-2.** This is not a team semantic freeze (FRZ-01) and does not change any frontend, backend or protocol schema. It follows the [W1 mapping feasibility](ai-01-02-dataset-taxonomy.md#mapping-feasibility), the [AI-04 Primary decision](w2-primary-dataset-decision.md) and the [AI-20 EDA](w2-eda.md). It respects D02 (native labels → feasibility → supported taxonomy; no forced synthetic 5-label taxonomy; misinformation excluded) and the [I1 C01 draft](../04-interface-contract-draft.md).

Code: [`ai/src/verimod_ai/data/taxonomy.py`](../../ai/src/verimod_ai/data/taxonomy.py) and [`label_mapping.py`](../../ai/src/verimod_ai/data/label_mapping.py). Tests: [`ai/tests/test_taxonomy.py`](../../ai/tests/test_taxonomy.py).

## Decision

| Layer | Decision | Basis |
|---|---|---|
| 1. Dataset native target | BEEP! hate axis `hate / offensive / none`, **single-label 3-class** | Only native supervision in the Primary dataset. EDA: shares 24.3 / 32.1 / 43.6% in train, validation and the TEST aggregate alike; ratio 1.79 |
| 2. Model output score keys | **`hate`, `offensive`** — the supported harmful classes | Both have direct native supervision with 1,423 / 1,882 train rows |
| 3. Negative / reference class | **`none`** — a training class, **not** a score key, **not** ALLOW | The native negative means "not hate/offensive under BEEP!'s guideline". It does not measure other risks |
| 4. Unsupported dimensions | `profanity`, `sexual`, `spam`, `violence`: no native supervision. `misinformation`: out of scope (D02) | No key, no score and no fake 0 |
| 5. Policy boundary | Scores only. Action, `reason_codes` and `triggered_rule_ids` come from the policy layer | model class ≠ action; dataset label ≠ reason_code |

The `bias` axis and `contain_gender_bias` stay **auxiliary metadata for evaluation slices**, not supported classes. EDA shows they co-occur with harmful labels and that the flag duplicates `bias=gender`. Making them classes would add a group-attribute output with no moderation semantics agreed.

## Why not the synthetic 5-label set

- **hate:** kept as a name, but its meaning is BEEP!'s hate definition, not the demo's keyword scorer.
- **offensive:** added, with no counterpart in the demo set.
- **profanity:** not supported. `offensive` ≠ `profanity`; offensive covers sarcasm, rudeness and indirect attack, and profanity cannot be separated from it by swear words alone ([AI-02 feasibility](ai-01-02-dataset-taxonomy.md#native-label-review)).
- **sexual / spam / violence:** not supported; none of the three candidate datasets has native supervision for them.

This is the D02 "5 → fewer" fallback, decided from data: 2 supported harmful classes plus 1 reference class.

## Score semantics

- `scores_ppm` keys = `{hate, offensive}`; each is an integer 0..1,000,000 (D07). Conversion from a 0..1 model score happens once at the Python boundary.
- Scores are **UNCALIBRATED** until calibration evidence exists. Write "model score 0.82" or "scores_ppm 820000", never "probability".
- Because the native task is single-label, a 3-class head would make the two harmful scores mutually exclusive shares. Consumers must not assume they sum to anything; I1 sets no sum constraint. The training head choice is W3.
- `none` is not exposed. A low harmful score means "below this model's harmful classes", not "safe".
- Evidence spans: BEEP! has no span annotation. Any later attribution is a method output (D03 SHOULD), never supervised evidence or a causal explanation.
- `TRUNCATED`: the Primary data has 0 records over 500 code points, so the truncation path must be tested with synthetic fixtures.

## Taxonomy identity — PROPOSED FOR GATE-2

| Field | Proposed value | Note |
|---|---|---|
| `taxonomy_id` | `verimod-ko-beep-hate` | Replaces the demo `verimod-example-ko` only after team agreement |
| `taxonomy_version` | `1` | Bump on any key or meaning change |
| required score keys | `hate`, `offensive` | Exact-key validation semantics stay with the I1 consumer agreement |

## Dependencies — not changed by A

- **DEPENDENCY — downstream I1 consumer alignment required.** `frontend/src/domain/types.ts` (`LABEL_IDS`, `ScoresPpm`), `schema.ts`, `policy.ts` and `manifests.ts` still use the synthetic 5-label taxonomy `verimod-example-ko / 0`. Aligning them, and any backend issuance, is for the T/F owners at FRZ-01.
- Policy parity fixtures (W2 item E) will use the 2-key score map once the consumer agrees.
- Thresholds (X, B), calibration and TEST methodology (Row-25) remain UNRESOLVED.

## Boundaries

FRZ-01 PASS: NO. Team GATE-2 PASS: NO. TEST opened: NO. Training: NO. T/F code changed: NO.
