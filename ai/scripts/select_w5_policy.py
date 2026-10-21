"""AI-11: pinned Validation aggregate audit and explicitly non-approved simulations.

No dataset/model loader, arbitrary input path, approval switch, or LOCK writer.
The W4 files remain immutable; each run creates a new W5 evidence directory.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import uuid

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "ai/src"))
from verimod_ai.evaluation.policy_metrics import PolicyMetrics
from verimod_ai.evaluation.selection import Candidate, feasible, select_candidate

PUBLIC = ROOT / "ai/artifacts/reports/w4_a_validation/20261016"
OUTPUT = ROOT / "ai/artifacts/reports/w5_ai11"
PREDICTIONS_SHA256 = "74fcac005741574422edcd597dc1f78d8234b20e24e50f35d722d01fd927a400"
# Semantic JSON digests tolerate Git newline conversion, not changed evidence.
EXPECTED = {
    "validation.json": "ddddf229b696d6df39393d514830168a6dd2652ee366a295b23f919ea53ef8c7",
    "policy_candidates.json": "e11fe67a210949e6b31a6ce27bc64dca805f7135600898748d937ca8e5632b87",
}
ACTIONS = ("ALLOW", "HUMAN_REVIEW", "RESTRICT")
METRICS = ("FRR", "RP", "HAR", "HRR_TOTAL")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def json_digest(value):
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"),
                         ensure_ascii=False, allow_nan=False).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def checked_metric(record, expected_denominator):
    n, d, value = (record[k] for k in ("numerator", "denominator", "value"))
    require(type(n) is int and type(d) is int and 0 <= n <= d,
            "invalid metric numerator/denominator")
    require(d == expected_denominator, "wrong metric population")
    if d == 0:
        require(value is None, "zero denominator must be undefined")
    else:
        require(type(value) in (int, float) and math.isfinite(value)
                and math.isclose(value, n / d, rel_tol=0, abs_tol=1e-12),
                "metric value disagrees with counts")
    return value


def validate_reports(validation, comparison):
    """Validate saved aggregates; this cannot verify their private source rows."""
    p = validation["provenance"]
    require(p["split"] == "validation", "only Validation evidence is allowed")
    require(p["test_accessed"] is False and p["training_executed"] is False,
            "unexpected evidence provenance")
    require(p["run_id"] == "AI07-BL-KLUE-RB-45126-R01"
            and p["score_semantics"] == "UNCALIBRATED", "wrong model/score provenance")
    require(p["predictions_sha256"] == comparison["predictions_sha256"] == PREDICTIONS_SHA256,
            "prediction digest mismatch")
    require(p["split_count"] == p["prediction_rows"] == comparison["eligible"] == 1255,
            "wrong Validation population")
    require(validation["input_status_counts"] == {"FULL": 1255}, "unexpected status population")
    require(comparison["X"] is None and comparison["B"] is None
            and comparison["team_approved"] is False, "W4 approval state changed")
    require(comparison["formal_selection"] == "NOT_EXECUTED_X_B_UNAPPROVED",
            "unexpected W4 formal selection state")
    rows = comparison["candidates"]
    require(len(rows) == 25, "expected the frozen 25-candidate pool")
    require(len({r["candidate_id"] for r in rows}) == 25, "duplicate candidate IDs")
    candidates = []
    for row in rows:
        a, m = row["actions"], row["metrics"]
        require(set(a) == set(ACTIONS) and set(m) == set(METRICS), "unknown action/metric")
        require(all(type(v) is int and v >= 0 for v in a.values()), "invalid action count")
        require(sum(a.values()) == row["n"] == 1255, "action total mismatch")
        values = {k: checked_metric(m[k], d) for k, d in
                  (("FRR", 547), ("RP", a["RESTRICT"]), ("HAR", 708), ("HRR_TOTAL", 1255))}
        require(m["FRR"]["numerator"] + m["RP"]["numerator"] == a["RESTRICT"],
                "restricted class counts disagree")
        require(m["HRR_TOTAL"]["numerator"] == a["HUMAN_REVIEW"], "review count mismatch")
        harmful_review = 708 - m["RP"]["numerator"] - m["HAR"]["numerator"]
        normal_allow = a["ALLOW"] - m["HAR"]["numerator"]
        normal_review = 547 - m["FRR"]["numerator"] - normal_allow
        require(min(harmful_review, normal_allow, normal_review) >= 0
                and harmful_review + normal_review == a["HUMAN_REVIEW"],
                "impossible label/action cross counts")
        require(row["by_input_status"] == {"FULL": a, "TRUNCATED": {}},
                "status-specific action counts disagree")
        for label in ("hate", "offensive"):
            t = row["thresholds_ppm"][label]
            require(set(t) == {"review", "restrict"}
                    and all(type(v) is int and 0 <= v <= 1_000_000 for v in t.values())
                    and t["review"] <= t["restrict"], "invalid PPM thresholds")
        candidates.append(Candidate(row["candidate_id"], "validation", PolicyMetrics(
            row["n"], 547, 708, a["RESTRICT"], **values)))
    return candidates


def simulate(candidates, x, b):
    """Bounds are scenario assumptions, never team approval or policy adoption."""
    chosen = select_candidate(candidates, max_frr=x, max_hrr_total=b)
    pool = [c for c in candidates if feasible(c, max_frr=x, max_hrr_total=b)]
    ties = []
    if chosen:
        key = lambda c: (c.metrics.HAR, c.metrics.RP, c.metrics.HRR_TOTAL)
        ties = sorted(c.candidate_id for c in pool if key(c) == key(chosen))
    return {"status": "FEASIBLE" if chosen else "INFEASIBLE",
            "usage": "SIMULATION_ONLY_NOT_TEAM_APPROVED", "X": x, "B": b,
            "feasible_count": len(pool), "candidate_id": chosen.candidate_id if chosen else None,
            "fully_tied_candidates": ties,
            "last_resort": "candidate_id ascending; all metric ties disclosed; adoption still requires approval"}


def build_report(validation, comparison, *, x=None, b=None):
    require((x is None) == (b is None), "both simulation bounds are required")
    candidates = validate_reports(validation, comparison)
    observed = sorted({(c.metrics.FRR, c.metrics.HRR_TOTAL) for c in candidates})
    scenarios = [simulate(candidates, x0, b0) for x0, b0 in observed]
    table = []
    for row in comparison["candidates"]:
        table.append({**row, "review_per_1000_at_validation_mix":
                      row["actions"]["HUMAN_REVIEW"] / row["n"] * 1000})
    return {
        "ticket": "AI-11", "status": "PARTIAL", "aggregate_audit": "PASS",
        "formal_selection": "BLOCKED_X_B_AND_POLICY_APPROVAL_REQUIRED",
        "team_approved": False, "X": None, "B": None, "adopted_candidate_id": None,
        "lock_executed": False, "test_accessed": False, "model_executed": False,
        "row_recomputation": "BLOCKED_EXACT_VALIDATION_PREDICTIONS_LOCATION_UNVERIFIED",
        "evidence_kind": "SAVED_VALIDATION_AGGREGATE_AUDIT_NOT_NEW_INFERENCE",
        "candidate_count": len(candidates), "predictions_sha256": PREDICTIONS_SHA256,
        "private_predictions_hash_verified": False,
        "selection_rule": "FRR<=X and HRR_TOTAL<=B; min HAR, max RP, min HRR_TOTAL",
        "policy_semantics": "TRUNCATED_HUMAN_REVIEW > ANY_RESTRICT > ANY_REVIEW > ALLOW",
        "minimum_candidate_FRR": min(c.metrics.FRR for c in candidates),
        "candidates": table,
        "observed_boundary_simulations": scenarios,
        "requested_simulation": simulate(candidates, x, b) if x is not None else None,
        "limitations": ["native none is a normal proxy, not policy ALLOW",
                        "scores are UNCALIBRATED, not harmful probabilities",
                        "workload per 1000 assumes the Validation class/score mix; no traffic or service-time forecast",
                        "25 candidates share Validation selection bias; no TEST/generalization claim",
                        "FRR, HAR and review cost cannot all be minimized by selecting the lowest FRR alone"],
    }


def load_pinned_reports():
    data, sources = {}, {}
    for name, expected in EXPECTED.items():
        path = PUBLIC / name
        raw = path.read_bytes()
        value = json.loads(raw)
        digest = json_digest(value)
        require(digest == expected, f"frozen aggregate changed: {name}")
        data[name] = value
        sources[name] = {"path": path.relative_to(ROOT).as_posix(),
                         "file_sha256": hashlib.sha256(raw).hexdigest(),
                         "semantic_json_sha256": digest}
    return data, sources


def write_new_report(report, root, run_id):
    require(bool(re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,79}", run_id)), "unsafe run ID")
    encoded = json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    target = root / run_id
    target.mkdir(parents=True, exist_ok=False)
    output = target / "selection.json"
    with output.open("x", encoding="utf-8", newline="\n") as stream:
        stream.write(encoded)
    return output


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=("audit", "simulate", "formal"), default="audit")
    parser.add_argument("--x", type=float)
    parser.add_argument("--b", type=float)
    parser.add_argument("--run-id")
    args = parser.parse_args(argv)
    if args.mode == "formal":
        parser.error("BLOCKED: this preparation release cannot execute formal selection or approve a policy")
    if (args.mode == "simulate") != (args.x is not None and args.b is not None):
        parser.error("simulate requires both --x and --b; audit accepts neither")
    if args.mode == "audit" and (args.x is not None or args.b is not None):
        parser.error("audit accepts no assumed bounds")
    data, sources = load_pinned_reports()
    report = build_report(data["validation.json"], data["policy_candidates.json"], x=args.x, b=args.b)
    report["sources"] = sources
    report["created_at_utc"] = datetime.now(timezone.utc).isoformat()
    report["source_commit"] = subprocess.check_output(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    tracked_sources = [Path(__file__), ROOT / "ai/src/verimod_ai/evaluation/selection.py",
                       ROOT / "ai/src/verimod_ai/evaluation/policy_metrics.py"]
    report["execution_source_sha256"] = {
        p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in tracked_sources}
    run_id = args.run_id or datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ-") + uuid.uuid4().hex[:8]
    output = write_new_report(report, OUTPUT, run_id)
    print(json.dumps({"status": report["status"], "aggregate_audit": "PASS",
                      "candidate_count": 25, "formal_selection": report["formal_selection"],
                      "output": output.relative_to(ROOT).as_posix()}))


if __name__ == "__main__":
    main()
