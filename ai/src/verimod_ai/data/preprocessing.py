"""AI-05: deterministic preprocessing v1 (model-input text, before any tokenizer).

Evidence: docs/research/w2-preprocessing.md

The only transformation is a head truncation at MAX_CODE_POINTS Unicode code
points. Source semantics are preserved: no Unicode normalization (NFC/NFKC), no
case folding, no whitespace collapse, no punctuation/emoji removal, no masking
or correction. The AI-15 leakage normalization is a separate, comparison-only
key and is not model preprocessing.

Tokenizer/model-specific truncation is W3. Content commitment and receipt
hashing are outside AI preprocessing and use the original content, not
``processed_text``.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from verimod_ai.data.schema import NativeSample

PREPROCESSING_VERSION = "verimod-ko-text-v1"
MAX_CODE_POINTS = 500  # W2 v1 boundary, not a final tokenizer/model context length

InputStatus = Literal["FULL", "TRUNCATED"]


@dataclass(frozen=True)
class PreprocessedText:
    sample_id: str
    processed_text: str
    input_status: InputStatus
    original_length_codepoints: int
    processed_length_codepoints: int
    preprocessing_version: str = PREPROCESSING_VERSION
    source_dataset: str | None = None


def preprocess_text(sample_id: str, text: str, *, source_dataset: str | None = None) -> PreprocessedText:
    """Return the v1 model-input representation; ``text`` itself is never modified.

    Lengths are Python ``str`` lengths, i.e. Unicode code points (not UTF-16
    units or bytes). Truncation may split a multi-code-point grapheme; v1 does
    not adjust for that. Empty/invalid-input rejection belongs to the inference
    boundary (C01 candidates), not to this function.
    """
    if not isinstance(text, str):
        raise TypeError("text must be str")
    original = len(text)
    if original <= MAX_CODE_POINTS:
        processed, status = text, "FULL"
    else:
        processed, status = text[:MAX_CODE_POINTS], "TRUNCATED"
    return PreprocessedText(
        sample_id=sample_id,
        processed_text=processed,
        input_status=status,
        original_length_codepoints=original,
        processed_length_codepoints=len(processed),
        source_dataset=source_dataset,
    )


def preprocess_sample(sample: NativeSample) -> PreprocessedText:
    return preprocess_text(sample.sample_id, sample.text, source_dataset=sample.source_dataset)
