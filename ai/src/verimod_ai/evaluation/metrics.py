"""Evaluation metric boundaries.

Model metrics and policy metrics are kept separate. All functions raise
NotImplementedError until the taxonomy and label semantics are frozen; no
placeholder numbers are returned.

Policy selection (D25, WORKING ASSUMPTION) runs on validation only:
minimize HAR subject to FRR <= X and HRR_TOTAL <= B; ties -> higher RP, then
lower HRR_TOTAL. X and B are UNRESOLVED. Exact metric definitions are not yet
recorded in this repository (TODO). The sealed internal TEST is not used here.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence


# --- model metrics -----------------------------------------------------------

def per_label_metrics(y_true: Sequence, y_pred: Sequence) -> Mapping[str, Mapping[str, float]]:
    """Per-label precision / recall / F1 / support (and FPR / FNR)."""
    raise NotImplementedError("model metrics: label semantics UNRESOLVED")


def macro_f1(y_true: Sequence, y_pred: Sequence) -> float:
    raise NotImplementedError("model metrics: label semantics UNRESOLVED")


def micro_f1(y_true: Sequence, y_pred: Sequence) -> float:
    raise NotImplementedError("model metrics: label semantics UNRESOLVED")


def confusion(y_true: Sequence, y_pred: Sequence) -> object:
    """Confusion matrix (single-label) or per-label confusion (multi-label)."""
    raise NotImplementedError("model metrics: single- vs multi-label UNRESOLVED")


# --- policy metrics ----------------------------------------------------------

def policy_metrics(actions: Sequence[str], references: Sequence) -> Mapping[str, float]:
    """FRR, RP, HAR and HRR_TOTAL for a policy applied to validation scores."""
    raise NotImplementedError("policy metrics: definitions and reference labels UNRESOLVED")
