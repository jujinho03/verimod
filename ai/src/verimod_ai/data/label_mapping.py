"""Native dataset labels -> future VeriMod taxonomy.

The final taxonomy and mapping are not frozen (AI-20 / AI-02, GATE-2), so this
module deliberately refuses to map. No fake or provisional mapping is provided.
Mapping feasibility: docs/research/ai-01-02-dataset-taxonomy.md#mapping-feasibility
"""

from __future__ import annotations

from collections.abc import Sequence


class LabelMappingNotConfigured(RuntimeError):
    """Raised while no frozen native -> VeriMod mapping exists."""


def map_native_labels(native_labels: Sequence[str], *, source_dataset: str) -> tuple[str, ...]:
    """Map native labels to VeriMod taxonomy label ids.

    Single-label vs multi-label semantics and negative-label handling are
    unresolved; the return shape may change when the mapping is frozen.
    """
    raise LabelMappingNotConfigured(
        f"No frozen VeriMod taxonomy mapping for {source_dataset!r}; "
        "final taxonomy is UNRESOLVED (AI-20 / AI-02, GATE-2)."
    )
