# AI-04 / AI-15 — deterministic split, leakage checks, TEST seal

Status: **W2 A-owner execution evidence, 2026-09-30**. The input is the 8,367 official BEEP! labeled train+dev records pinned in [AI-04 acquisition](w2-primary-dataset-decision.md). No model training, TEST evaluation, EDA, preprocessing for inference, or final taxonomy selection was performed.

## Duplicate and group checks before split

Leakage normalization version: `w2-leakage-nfc-whitespace-v1`. It applies Unicode NFC; converts CRLF/CR to LF; collapses Unicode whitespace runs to one ASCII space; and trims ends. It does **not** change stored input, remove punctuation/emoji, transliterate Jamo, replace profanity, or correct spelling. Exact duplicate compares raw comment strings. Normalized duplicate compares only leakage keys.

| Pre-split result | Count |
|---|---:|
| Exact duplicate excess | 0 |
| Normalized duplicate excess | 0 |
| Same-label duplicate rows removed | 0 |
| Conflicting-label rows quarantined | 0 |

If normalized duplicate labels conflict, the code quarantines the entire cluster without majority vote. Same-label duplicates retain the first stable source ID. These paths are exercised with synthetic unit fixtures.

Normalized `news_title` is a **group proxy**, not an article ID or author ID. Alignment passed, empty titles = 0. There are 1,480 unique title proxy values; 1,460 occur more than once. After adding qualifying near-duplicate links, there are 1,479 atomic groups. Group size median = 6, 95th percentile = 9, maximum = 13. Repeated titles cannot cross splits. Different titles may still refer to one article, and author leakage cannot be excluded without the absent identifiers.

## Near duplicate check

Method: character 3-gram set Jaccard on normalized comments; threshold **≥0.90 is a W2 heuristic**. Eligible text length is at least 12 characters. An inverted trigram index examined 4,909,653 posting visits, under its 15,000,000 cap, and found 2 qualifying record pairs. Qualifying records were linked into the same atomic split group; none was automatically deleted. **857 short texts were skipped**, so the check is partial and not a claim that all similar short texts were found. Common short phrases and Jaccard false positives remain limitations.

## Deterministic allocator and result

Seed `45126`; target train/validation/test ratios `0.70/0.15/0.15`. Algorithm `group-greedy-class-aware-v1`, implemented with Python **3.14.7 standard library** (no external split library). Stable source IDs are `train` then `dev` with 1-based padded row ordinals. Groups are ordered by descending size, with SHA-256 of seed and smallest source ID as tie key. Each group is assigned atomically to the split with the smallest class-distribution squared-error increment, then total-size squared-error increment, then seeded SHA-256 tie key. Group atomicity and leakage checks have priority over exact target ratios; this seed was not tuned by trying alternatives.

| Internal split | Count | Actual ratio | hate | offensive | none | Atomic groups |
|---|---:|---:|---:|---:|---:|---:|
| train | 5,857 | 0.700012 | 1,423 | 1,882 | 2,552 | 1,154 |
| validation | 1,255 | 0.149994 | 305 | 403 | 547 | 162 |
| TEST | 1,255 | 0.149994 | 305 | 403 | 547 | 163 |

The table is the one permitted pre-seal aggregate; it is not TEST performance or row-level inspection.

Automated pre-seal assertions all passed: stable record ID overlap **0**, exact comment overlap **0**, normalized comment overlap **0**, normalized title proxy overlap **0**, atomic near/group cluster overlap **0**. The eligible-text near-duplicate limitation above still applies.

## TEST seal

- Local-only path: `../verimod-local-data/w2/beep-splits/test.jsonl`.
- Format: UTF-8, LF, JSONL, stable field and row order. Fields are model input, native label, and stable metadata needed for W5; this artifact is outside Git.
- Count: **1,255**.
- Raw-file-byte SHA-256: `ba9b87bde42e5eba8b3c5ca5f2423553a2f913400fd202d30b9e4bd00eb8138e`.
- Seal timestamp: `2026-09-30T14:18:41.863208+00:00` (2026-09-30 23:18:41 KST).
- Script/version: `ai/scripts/prepare_w2_dataset.py`, `w2-dataset-prep-v1`; source revision and seed above.

The script wrote TEST only after all overlap assertions and computed the seal by reading raw bytes **once at creation**. This execution did not reopen, preview, run EDA, or evaluate the sealed TEST afterward. Subsequent checks used the aggregate evidence JSON and synthetic fixtures. The script refuses to read or overwrite an existing split artifact. The hash detects file changes; it does not cryptographically prove that no person has read the file.

The first CLI run completed artifact creation and evidence writing, then hit a Windows `cp949` console encoding error while printing a Unicode status label. Only console output encoding was corrected. The actual run was **not repeated** against the sealed directory. Ten synthetic unit tests passed after the correction. Reproducing the TEST hash was tested only on synthetic fixtures, not by reopening the actual TEST.

## Pending boundary

`BLOCKED — Secondary dataset not yet adopted`. Primary↔Secondary overlap is therefore not checked, and no Secondary records were downloaded or merged into training. The official BEEP! hidden-label TEST and official benchmark evaluation were not used. Final supported taxonomy belongs to AI-20/AI-02; FRZ-01 and Team GATE-2 remain pending.
