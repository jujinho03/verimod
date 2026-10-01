"""Native dataset labels -> VeriMod taxonomy classes.

Only the Primary dataset (BEEP!) has an A-side mapping, PROPOSED FOR GATE-2
(docs/research/w2-taxonomy-decision.md). Any other source still refuses to map;
no fake or provisional mapping is provided. The result is a training class, not
a policy action: ``none`` maps to the reference class, never to ALLOW.
"""

from __future__ import annotations

from collections.abc import Sequence

from verimod_ai.data.taxonomy import NATIVE_TARGET, PRIMARY_DATASET


class LabelMappingNotConfigured(RuntimeError):
    """Raised while no native -> VeriMod mapping exists for a source."""


class UnsupportedNativeLabel(ValueError):
    """Raised for a native label outside the supported mapping; never silently dropped."""


def map_native_labels(native_labels: Sequence[str], *, source_dataset: str) -> tuple[str, ...]:
    """Map one record's native hate-axis label to its VeriMod training class.

    BEEP! is single-label, so exactly one label is accepted.
    """
    if source_dataset != PRIMARY_DATASET:
        raise LabelMappingNotConfigured(
            f"No VeriMod taxonomy mapping for {source_dataset!r}; only the Primary dataset is mapped."
        )
    if len(native_labels) != 1:
        raise UnsupportedNativeLabel("BEEP! hate axis is single-label; exactly one label is required")
    (label,) = native_labels
    if label not in NATIVE_TARGET:
        raise UnsupportedNativeLabel(f"Unsupported native label: {label!r}")
    return (label,)
