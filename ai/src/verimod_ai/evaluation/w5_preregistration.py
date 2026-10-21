"""AI-12 preparation only: fixed synthetic checks, with no dataset/file loader.

Neither a valid metadata record nor this module authorizes actual evaluation.
The real execution boundary remains unconditionally closed in this release.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import asdict, dataclass
from datetime import datetime
import math
import re
from statistics import mean

from verimod_ai.data.taxonomy import NATIVE_TARGET, SCORE_KEYS
from verimod_ai.evaluation.bootstrap import bootstrap_ci
from verimod_ai.evaluation.metrics import model_report
from verimod_ai.evaluation.policy_metrics import PolicyCase, policy_metrics


@dataclass(frozen=True)
class PreregisteredConfig:
    n_resamples: int = 1000
    seed: int = 20260923
    confidence_level: float = 0.95
    lower_percentile: float = 2.5
    upper_percentile: float = 97.5

    def validate(self) -> None:
        expected = (1000, 20260923, 0.95, 2.5, 97.5)
        for value, required in zip(asdict(self).values(), expected):
            if type(value) is not type(required) or value != required:
                raise ValueError("W5 preregistration settings must match the fixed protocol")


CONFIG = PreregisteredConfig()


class RealEvaluationBlocked(RuntimeError):
    """No actual dataset evaluation has been implemented or authorized here."""


def reject_real_evaluation() -> None:
    """Always fail before accepting a data path or performing any input I/O."""
    raise RealEvaluationBlocked(
        "BLOCKED / TEST SEALED: real evaluation is not implemented in this preparation release"
    )


def _utc_timestamp(value: object) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo is not None and parsed.utcoffset() is not None else None


def inspect_approval_metadata(record: dict | None = None) -> dict:
    """Validate a proposed in-memory record, NOT signatures, files or Git state.

    Even structurally complete records return execution_allowed=False. A future
    separately approved implementation must authenticate user approval, Git
    objects, immutable manifests and a one-run claim before opening any input.
    """
    record = record or {}
    problems = []
    for key in ("xb_approved_by", "model_policy_approved_by", "test_authorized_by"):
        if record.get(key) != "주진호":
            problems.append(f"{key}: explicit leader approval record required")
    for key in ("X", "B"):
        value = record.get(key)
        if type(value) not in (float, int) or not math.isfinite(value) or not 0 <= value <= 1:
            problems.append(f"{key}: approved finite rate in [0, 1] required")
    for key, width in (("lock_commit_sha", 40), ("authorization_lock_sha", 40),
                       ("model_manifest_sha256", 64), ("policy_manifest_sha256", 64),
                       ("evaluation_code_sha256", 64)):
        if not isinstance(record.get(key), str) or not re.fullmatch(f"[0-9a-f]{{{width}}}", record[key]):
            problems.append(f"{key}: lowercase hex digest required")
    if record.get("lock_commit_sha") != record.get("authorization_lock_sha"):
        problems.append("TEST authorization must refer to the exact LOCK SHA")
    names = ("xb_approved_at", "model_policy_approved_at", "locked_at", "test_authorized_at")
    dates = {name: _utc_timestamp(record.get(name)) for name in names}
    for name, value in dates.items():
        if value is None:
            problems.append(f"{name}: timezone-aware ISO timestamp required")
    if all(value is not None for value in dates.values()):
        if dates["xb_approved_at"] > dates["locked_at"] or dates["model_policy_approved_at"] > dates["locked_at"]:
            problems.append("X/B and model/policy approvals must precede LOCK")
        if dates["test_authorized_at"] <= dates["locked_at"]:
            problems.append("separate TEST authorization must be after LOCK")
    return {
        "metadata_structure_status": "PASS" if not problems else "BLOCKED",
        "metadata_problems": problems,
        "execution_status": "BLOCKED",
        "execution_allowed": False,
        "test_state": "SEALED",
        "unverified_requirements": [
            "authentic explicit leader approval and exact approved X/B/candidate",
            "actual LOCK commit existence, content, ancestry and timestamp",
            "locked model, preprocessing, calibration, policy and code hashes",
            "independent group structure and evaluation population registration",
            "separate first evaluation authorization bound to exact LOCK SHA",
            "durable single-execution claim and crash/retry policy",
            "separately approved real evaluation implementation",
        ],
        "note": "Metadata shape checks do not verify approvals or create a LOCK.",
    }


@dataclass(frozen=True)
class SyntheticRow:
    truth: str
    prediction: str
    action: str
    latency_ms: float
    group: str


def _synthetic_rows() -> list[SyntheticRow]:
    # Invented unit-test labels/actions/timings; no text, dataset or model access.
    return [
        SyntheticRow("none", "none", "ALLOW", 10.0, "article-a"),
        SyntheticRow("none", "offensive", "RESTRICT", 12.0, "article-a"),
        SyntheticRow("none", "offensive", "HUMAN_REVIEW", 15.0, "article-b"),
        SyntheticRow("none", "none", "ALLOW", 11.0, "article-b"),
        SyntheticRow("hate", "hate", "RESTRICT", 18.0, "article-c"),
        SyntheticRow("hate", "offensive", "HUMAN_REVIEW", 14.0, "article-c"),
        SyntheticRow("hate", "none", "ALLOW", 16.0, "article-d"),
        SyntheticRow("hate", "hate", "RESTRICT", 13.0, "article-d"),
        SyntheticRow("offensive", "offensive", "RESTRICT", 20.0, "article-e"),
        SyntheticRow("offensive", "hate", "HUMAN_REVIEW", 19.0, "article-e"),
        SyntheticRow("offensive", "none", "ALLOW", 17.0, "article-f"),
        SyntheticRow("offensive", "offensive", "HUMAN_REVIEW", 21.0, "article-f"),
    ]


def _report(rows: list[SyntheticRow]) -> dict:
    model = model_report([r.truth for r in rows], [r.prediction for r in rows])
    model["accuracy"] = model["micro_f1"]
    model["accuracy_counts"] = {
        "numerator": sum(r.truth == r.prediction for r in rows), "denominator": len(rows)
    }
    for label, values in model["per_class"].items():
        tp = model["confusion_matrix"][label][label]
        predicted = sum(row[label] for row in model["confusion_matrix"].values())
        values["counts"] = {
            "precision": {"numerator": tp, "denominator": predicted},
            "recall": {"numerator": tp, "denominator": values["support"]},
            "f1": {"numerator": 2 * tp, "denominator": predicted + values["support"]},
        }
    cases = [PolicyCase(r.truth, r.action) for r in rows]
    policy = asdict(policy_metrics(cases))
    policy["counts"] = {
        "FRR": {"numerator": sum(r.truth == "none" and r.action == "RESTRICT" for r in rows),
                "denominator": policy["n_clean"]},
        "RP": {"numerator": sum(r.truth in SCORE_KEYS and r.action == "RESTRICT" for r in rows),
               "denominator": policy["n_restrict"]},
        "HAR": {"numerator": sum(r.truth in SCORE_KEYS and r.action == "ALLOW" for r in rows),
                "denominator": policy["n_harmful"]},
        "HRR_TOTAL": {"numerator": sum(r.action == "HUMAN_REVIEW" for r in rows),
                      "denominator": policy["n_eligible"]},
    }
    policy["action_counts"] = dict(Counter(r.action for r in rows))
    values = sorted(r.latency_ms for r in rows)
    if any(not math.isfinite(v) or v < 0 for v in values):
        raise ValueError("latency values must be finite nonnegative milliseconds")
    latency = {
        "status": "SYNTHETIC_ONLY_NOT_MEASURED",
        "unit": "ms", "n": len(values), "mean": mean(values),
        "p50": values[math.ceil(0.5 * len(values)) - 1],
        "p95": values[math.ceil(0.95 * len(values)) - 1],
        "quantile_method": "nearest_rank",
    }
    return {"model": model, "policy": policy, "latency": latency}


def build_synthetic_report(*, sampling_unit: str = "group",
                           config: PreregisteredConfig = CONFIG) -> dict:
    """Exercise metric wiring with hard-coded invented observations only."""
    config.validate()
    if sampling_unit not in ("group", "item"):
        raise ValueError("sampling_unit must be group or item")
    rows = _synthetic_rows()
    report = _report(rows)
    statistics = {
        "accuracy": lambda sample: _report(sample)["model"]["accuracy"],
        "macro_f1": lambda sample: _report(sample)["model"]["macro_f1"],
    }
    for label in NATIVE_TARGET:
        for metric in ("precision", "recall", "f1"):
            def class_statistic(sample, label=label, metric=metric):
                result = _report(sample)["model"]["per_class"][label]
                return result[metric] if result[f"{metric}_defined"] else None
            statistics[f"{label}.{metric}"] = class_statistic
    for metric in ("FRR", "RP", "HAR", "HRR_TOTAL"):
        statistics[metric] = lambda sample, metric=metric: _report(sample)["policy"][metric]
    for metric in ("mean", "p50", "p95"):
        statistics[f"latency.{metric}"] = lambda sample, metric=metric: _report(sample)["latency"][metric]
    groups = [r.group for r in rows] if sampling_unit == "group" else None
    intervals = {
        name: bootstrap_ci(rows, statistic, n_resamples=config.n_resamples,
                           seed=config.seed, confidence_level=config.confidence_level,
                           groups=groups)
        for name, statistic in statistics.items()
    }
    return {
        "ticket": "AI-12-PREPARATION", "status": "PASS", "evidence_type": "SYNTHETIC_ONLY",
        "real_evaluation_status": "BLOCKED", "test_state": "SEALED",
        "config": asdict(config), "sampling_unit": sampling_unit,
        "n_groups": len(set(r.group for r in rows)),
        "assumption": ("Independent synthetic article groups; within-group dependence retained."
                       if groups else "Synthetic iid demonstration only; real independence is unverified."),
        "metrics": report, "confidence_intervals": intervals,
        "zero_denominator_rule": {
            "model": "0.0 with defined=false; Macro-F1 includes every declared class",
            "policy": "null (undefined)",
            "bootstrap": "undefined statistics skipped and n_undefined reported; all undefined => null interval",
        },
        "limitations": [
            "No real model, policy, dataset, latency, LOCK or authorization was verified.",
            "Actions are fixed fixture values; real policy and Python/Node parity remain separate checks.",
            "Actual grouping/population and latency measurement protocol require registration before LOCK.",
        ],
    }
