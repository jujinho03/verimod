"""S1/S2/S3 research/demo policy scenarios from committed public evidence only.

Reuses the pinned 25-candidate revalidation and the exact-ratio `scenario()`
check (which also asserts agreement with the existing selector). Derives the
class x action table from stored counts; no prediction rows, raw data, model,
Manifest, policy hash, LOCK or TEST access. The scenario X/B values are
research assumptions, not approved operating limits or reviewer capacity.
"""
from datetime import datetime, timezone
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import subprocess
import sys
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "ai/scripts"))
from prepare_w5_policy_approval import SOURCE, SOURCE_SHA, fraction_record, rate, scenario  # noqa: E402

OUTPUT = ROOT / "ai/artifacts/reports/w5_research_scenarios"
NONE_N, HARMFUL_N, TOTAL_N = 547, 708, 1255
SCENARIOS = {
    "S1": {"label": "FRR protection first", "X": Fraction(6, 100), "B": Fraction(45, 100)},
    "S2": {"label": "balanced", "X": Fraction(10, 100), "B": Fraction(30, 100)},
    "S3": {"label": "review-volume limited", "X": Fraction(10, 100), "B": Fraction(20, 100)},
}


def class_actions(row):
    """Exact none/harmful x action counts implied by stored numerators."""
    a, m = row["actions"], row["metrics"]
    h_restrict, h_allow = m["RP"]["numerator"], m["HAR"]["numerator"]
    n_restrict = m["FRR"]["numerator"]
    h_review = HARMFUL_N - h_restrict - h_allow
    n_allow, n_review = a["ALLOW"] - h_allow, a["HUMAN_REVIEW"] - h_review
    table = {"none": {"RESTRICT": n_restrict, "HUMAN_REVIEW": n_review, "ALLOW": n_allow},
             "harmful": {"RESTRICT": h_restrict, "HUMAN_REVIEW": h_review, "ALLOW": h_allow}}
    if (sum(a.values()) != TOTAL_N or row["n"] != TOTAL_N
            or sum(table["none"].values()) != NONE_N or min(v for c in table.values() for v in c.values()) < 0
            or a["RESTRICT"] != n_restrict + h_restrict or m["RP"]["denominator"] != a["RESTRICT"]):
        raise ValueError("Stored counts are internally inconsistent")
    return table


def stability_cell(rows, x, b):
    """Half-open [lower, upper) X/B interval in which the feasible pool is fixed."""
    def cell(values, v):
        points = sorted(set(values) | {Fraction(0)})
        lower = max(p for p in points if p <= v)
        upper = min((p for p in points if p > v), default=None)
        return {"lower_inclusive": fraction_record(lower),
                "upper_exclusive": fraction_record(upper) if upper is not None else None}
    return {"X": cell([rate(r, "FRR") for r in rows], x), "B": cell([rate(r, "HRR_TOTAL") for r in rows], b)}


def summary(row):
    return {"candidate_id": row["candidate_id"], "thresholds_ppm": row["thresholds_ppm"],
            "metrics": row["metrics"], "actions": row["actions"], "class_actions": class_actions(row)}


def delta(a, b):
    ta, tb = a["class_actions"], b["class_actions"]
    return {"from": a["candidate_id"], "to": b["candidate_id"],
            "none_RESTRICT": tb["none"]["RESTRICT"] - ta["none"]["RESTRICT"],
            "harmful_ALLOW": tb["harmful"]["ALLOW"] - ta["harmful"]["ALLOW"],
            "none_ALLOW": tb["none"]["ALLOW"] - ta["none"]["ALLOW"],
            "HUMAN_REVIEW": b["actions"]["HUMAN_REVIEW"] - a["actions"]["HUMAN_REVIEW"],
            "RESTRICT": b["actions"]["RESTRICT"] - a["actions"]["RESTRICT"]}


def build_research_scenarios(source):
    recalc = source["recalculation"]
    if (source["status"] != "PASS" or recalc["difference_count"] != 0 or source["test_accessed"] is not False
            or source["team_approved"] is not False):
        raise ValueError("Source must be unapproved, previously validated Validation evidence")
    rows = recalc["candidates"]
    if len(rows) != 25 or len({r["candidate_id"] for r in rows}) != 25:
        raise ValueError("Expected frozen 25-candidate pool")
    for r in rows:  # validate every candidate, not only the selected ones
        class_actions(r)
    by_id = {r["candidate_id"]: r for r in rows}
    results = {}
    for sid, spec in SCENARIOS.items():
        sel = scenario(rows, spec["X"], spec["B"])  # raises if the existing selector disagrees
        pool = sorted((r for r in rows if rate(r, "FRR") <= spec["X"] and rate(r, "HRR_TOTAL") <= spec["B"]),
                      key=lambda r: (rate(r, "HAR"), -rate(r, "RP"), rate(r, "HRR_TOTAL"), r["candidate_id"]))
        results[sid] = {"label": spec["label"], **sel,
                        "ranked_feasible_pool": [{"candidate_id": r["candidate_id"],
                                                  **{k: fraction_record(rate(r, k)) for k in ("FRR", "HAR", "RP", "HRR_TOTAL")}}
                                                 for r in pool],
                        "selected": summary(by_id[sel["candidate_id"]]) if sel["candidate_id"] else None,
                        "stability_cell": stability_cell(rows, spec["X"], spec["B"])}
    sel = {k: v["selected"] for k, v in results.items()}
    return {"ticket": "AI-11-RESEARCH-DEMO-SCENARIOS", "status": "PASS",
            "scope": "RESEARCH_DEMO_SCENARIO_COMPARISON_NOT_POLICY_APPROVAL",
            "selection_rule": "FRR<=X and HRR_TOTAL<=B; then min HAR, max RP, min HRR_TOTAL; candidate_id last",
            "x_b_semantics": "research assumptions; not measured reviewer capacity or approved operating limits",
            "scenarios": results,
            "deltas": {"S1_to_S2": delta(sel["S1"], sel["S2"]), "S2_to_S3": delta(sel["S2"], sel["S3"])},
            "approved_X": None, "approved_B": None, "team_approved": False, "adopted_candidate_id": None,
            "manifest_generated": False, "new_policy_manifest_hash": None, "lock_executed": False,
            "test_accessed": False, "raw_prediction_rows_recomputed": False, "candidate_pool": 25}


def main():
    payload = SOURCE.read_bytes()
    if hashlib.sha256(payload).hexdigest() != SOURCE_SHA:
        raise ValueError("Committed source report changed; do not use it")
    report = build_research_scenarios(json.loads(payload))
    report.update(source_report_sha256=SOURCE_SHA,
                  execution_script_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  source_commit=subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
                  created_at_utc=datetime.now(timezone.utc).isoformat())
    target = OUTPUT / (datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ-") + uuid4().hex[:8])
    target.mkdir(parents=True, exist_ok=False)
    with (target / "scenarios.json").open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(report, stream, indent=2, ensure_ascii=False, allow_nan=False)
        stream.write("\n")
    print(json.dumps({"status": "PASS", "selected": {k: v["candidate_id"] for k, v in report["scenarios"].items()},
                      "output": (target / "scenarios.json").relative_to(ROOT).as_posix()}))


if __name__ == "__main__":
    main()
