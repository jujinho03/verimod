"""AI-06: policy metrics over given truth labels and given policy actions.

Evidence: docs/research/w2-evaluation-skeleton.md

These functions never derive an action from a label (``none`` is not ALLOW)
and never apply a threshold; actions come from a policy evaluation done
elsewhere. Population = eligible cases only. Ineligible cases (e.g. a future
Secondary record whose risk dimension is unsupported) are excluded.

- clean:   eligible, native label == REFERENCE_CLASS (``none``)
- harmful: eligible, native label in SCORE_KEYS (``hate``, ``offensive``)
- FRR       = RESTRICT among clean / clean
- RP        = harmful among RESTRICT / RESTRICT (eligible)
- HAR       = ALLOW among harmful / harmful
- HRR_TOTAL = HUMAN_REVIEW among eligible / eligible

A metric with a zero denominator is ``None`` (undefined), never 0.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

from verimod_ai.data.taxonomy import POLICY_ACTIONS, REFERENCE_CLASS, SCORE_KEYS

UNRESOLVED_SUBMETRICS = ("HRR_SCORE_BAND", "HRR_TRUNCATED")


@dataclass(frozen=True)
class PolicyCase:
    native_label: str
    action: str
    eligible: bool = True


@dataclass(frozen=True)
class PolicyMetrics:
    n_eligible: int
    n_clean: int
    n_harmful: int
    n_restrict: int
    FRR: float | None
    RP: float | None
    HAR: float | None
    HRR_TOTAL: float | None


def _rate(numerator: int, denominator: int) -> float | None:
    return numerator / denominator if denominator else None


def policy_metrics(cases: Sequence[PolicyCase]) -> PolicyMetrics:
    eligible = [case for case in cases if case.eligible]
    for case in eligible:
        if case.action not in POLICY_ACTIONS:
            raise ValueError(f"unknown policy action: {case.action!r}")
        if case.native_label != REFERENCE_CLASS and case.native_label not in SCORE_KEYS:
            raise ValueError(f"eligible case has unsupported label {case.native_label!r}; mark it ineligible")
    clean = [c for c in eligible if c.native_label == REFERENCE_CLASS]
    harmful = [c for c in eligible if c.native_label in SCORE_KEYS]
    restricted = [c for c in eligible if c.action == "RESTRICT"]
    return PolicyMetrics(
        n_eligible=len(eligible), n_clean=len(clean), n_harmful=len(harmful), n_restrict=len(restricted),
        FRR=_rate(sum(c.action == "RESTRICT" for c in clean), len(clean)),
        RP=_rate(sum(c.native_label in SCORE_KEYS for c in restricted), len(restricted)),
        HAR=_rate(sum(c.action == "ALLOW" for c in harmful), len(harmful)),
        HRR_TOTAL=_rate(sum(c.action == "HUMAN_REVIEW" for c in eligible), len(eligible)),
    )


def review_submetric(name: str, cases: Sequence[PolicyCase]) -> float:
    """Placeholder: denominator and reason attribution for HRR sub-metrics are UNRESOLVED."""
    if name not in UNRESOLVED_SUBMETRICS:
        raise ValueError(f"unknown review sub-metric: {name!r}")
    raise NotImplementedError(f"UNRESOLVED — exact {name} denominator/attribution semantics")
