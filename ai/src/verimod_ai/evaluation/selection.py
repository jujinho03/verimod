"""AI-06: validation-only policy candidate selection skeleton (D25, WORKING ASSUMPTION).

Feasible: FRR <= X and HRR_TOTAL <= B (both defined).
Objective: minimum HAR (must be defined).
Tie-break: higher RP (undefined RP ranks last), then lower HRR_TOTAL, then
candidate_id ascending as a deterministic last resort.

X and B are required arguments with no defaults; their values are UNRESOLVED.
Only candidates evaluated on the validation split are accepted.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

from verimod_ai.evaluation.policy_metrics import PolicyMetrics

ALLOWED_SPLIT = "validation"


@dataclass(frozen=True)
class Candidate:
    candidate_id: str
    split: str
    metrics: PolicyMetrics


def _check_bound(name: str, value: float) -> None:
    if not isinstance(value, (int, float)) or isinstance(value, bool) or not 0 <= value <= 1:
        raise ValueError(f"{name} must be a number in [0, 1]")


def feasible(candidate: Candidate, *, max_frr: float, max_hrr_total: float) -> bool:
    m = candidate.metrics
    return (m.FRR is not None and m.HRR_TOTAL is not None and m.HAR is not None
            and m.FRR <= max_frr and m.HRR_TOTAL <= max_hrr_total)


def select_candidate(candidates: Sequence[Candidate], *, max_frr: float, max_hrr_total: float) -> Candidate | None:
    """Return the selected candidate, or None when no candidate is feasible."""
    _check_bound("max_frr (X)", max_frr)
    _check_bound("max_hrr_total (B)", max_hrr_total)
    for candidate in candidates:
        if candidate.split != ALLOWED_SPLIT:
            raise PermissionError(f"selection accepts {ALLOWED_SPLIT!r} candidates only; got {candidate.split!r}")
    pool = [c for c in candidates if feasible(c, max_frr=max_frr, max_hrr_total=max_hrr_total)]
    if not pool:
        return None
    return min(pool, key=lambda c: (c.metrics.HAR,
                                    c.metrics.RP is None, -(c.metrics.RP or 0.0),
                                    c.metrics.HRR_TOTAL, c.candidate_id))
