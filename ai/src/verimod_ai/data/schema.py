"""Generic sample representation shared by future dataset loaders.

This is not a dataset implementation and does not encode the VeriMod taxonomy.
Labels stay in the source dataset's native vocabulary.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, field

MetadataValue = str | int | float | bool | None


@dataclass(frozen=True)
class NativeSample:
    """One labeled record in its source dataset's native terms.

    ``text`` is the model input. It is not the original content used for the
    receipt content commitment, which the issuing layer owns.
    """

    sample_id: str
    text: str
    native_labels: tuple[str, ...]
    source_dataset: str
    metadata: Mapping[str, MetadataValue] = field(default_factory=dict)
