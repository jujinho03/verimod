# AI-05 — Deterministic preprocessing v1

Status: **W2 A-owner evidence, 2026-10-01.** This defines the model-input text representation before any tokenizer. It is not a tokenizer or model choice and makes no performance claim.

Code: [`ai/src/verimod_ai/data/preprocessing.py`](../../ai/src/verimod_ai/data/preprocessing.py). Tests: [`ai/tests/test_preprocessing.py`](../../ai/tests/test_preprocessing.py).

## Contract

| Item | v1 |
|---|---|
| `PREPROCESSING_VERSION` | `verimod-ko-text-v1` |
| Length unit | Unicode code points (Python `str` length), not UTF-16 units or bytes |
| Boundary | `MAX_CODE_POINTS = 500`, the W2 v1 boundary. It is not a final tokenizer/model context length |
| `FULL` | `len(text) <= 500` → `processed_text = text` |
| `TRUNCATED` | `len(text) > 500` → `processed_text = text[:500]` (head kept) |
| Source text | Never modified. The output is a new value |

Output fields: `sample_id`, `processed_text`, `input_status`, `original_length_codepoints`, `processed_length_codepoints`, `preprocessing_version`, optional `source_dataset`. No policy action, reason code, receipt hash, Merkle, chain data or score.

Head truncation in code points matches the existing synthetic demo manifest (`max_code_points: 500`, `truncation: HEAD`, `unicode_normalization: NONE`). The demo stays a synthetic example; this document does not adopt its policy rules.

## Preserved (no transformation)

Case, punctuation, emoji (including multi-code-point sequences under 500), repeated or mixed whitespace and line breaks, decomposed or compatibility characters, profanity and spelling.

## Excluded transformations

Lowercasing, punctuation or emoji removal, profanity masking, spelling correction, whitespace collapse, NFC/NFKC or any Unicode normalization, forced Jamo conversion, stopword removal, stemming and morphological rewriting.

The AI-15 leakage key (`w2-leakage-nfc-whitespace-v1`: NFC and whitespace collapse) is a comparison-only key for duplicate detection. It is **not** model preprocessing.

## Known limits

- Truncation can split a multi-code-point grapheme, such as a ZWJ emoji or decomposed Hangul, at position 500. v1 does not adjust for this.
- Empty or invalid input is not rejected here. That belongs to the inference boundary (`EMPTY_INPUT` / `INVALID_INPUT` are C01 PROPOSED candidates).
- Tokenizer/model truncation (subword limit) is a W3 concern. It may truncate further, and that must be recorded separately.

## Primary data observation

[AI-20 EDA](w2-eda.md): TRAIN and VALIDATION have **0** records over 500 code points (max 135). Every Primary record is therefore `FULL`. `TRUNCATED` behaviour is validated **by synthetic tests only**: exactly 500 → FULL; 501 → TRUNCATED with length 500; supplementary-plane emoji count as one code point.

## Boundaries

- DEPENDENCY — upstream/downstream content commitment handled outside AI preprocessing. Receipts commit to the original content, not `processed_text`. A does not define commitment or hashing.
- How policy treats `TRUNCATED` (e.g. the demo's `TRUNCATED → HUMAN_REVIEW`) is a policy-layer rule and stays PROPOSED.
- A future model manifest should record `preprocessing_version`. Manifest generation is out of scope.
- Sealed TEST: not opened. Training: NO.
