"""Approval preparation from committed public evidence, never raw data or manifests.

Reuses 25 already-revalidated candidates. Computes only sensitivity scenarios
and synthetic boundary expectations; does not approve/apply policy or generate
a Policy Manifest, its new hash, a LOCK, or any TEST execution.
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
sys.path.insert(0, str(ROOT / "ai/src"))
from verimod_ai.evaluation.policy_metrics import PolicyMetrics
from verimod_ai.evaluation.selection import Candidate, select_candidate
from verimod_ai.evaluation.w4_policy import boundary_vectors

SOURCE = ROOT / "ai/artifacts/reports/w5_validation_rows/20261021T231440Z-aa90617c/revalidation.json"
SOURCE_SHA = "70c47b0893b7ae21691fe1a10c3ac321af7c3c73c1aa9315b4baf0545b3c8938"
FOUR = ("H50-90_O50-90", "H50-75_O50-90", "H50-75_O75-90", "H75-90_O75-90")
W4_HASH = "0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e"
OUTPUT = ROOT / "ai/artifacts/reports/w5_policy_approval"


def fraction_record(value):
    return {"numerator": value.numerator, "denominator": value.denominator,
            "value": float(value), "percent": 100 * float(value)}


def rate(row, metric):
    m = row["metrics"][metric]
    return Fraction(m["numerator"], m["denominator"]) if m["denominator"] else None


def as_candidate(row):
    return Candidate(row["candidate_id"], "validation", PolicyMetrics(
        row["n"], 547, 708, row["actions"]["RESTRICT"],
        **{k: m["value"] for k, m in row["metrics"].items()}))


def scenario(rows, x, b):
    """Exact count-ratio constraints; verify the existing selector agrees."""
    if not Fraction(0) <= x <= Fraction(1) or not Fraction(0) <= b <= Fraction(1):
        raise ValueError("Scenario bounds must be in [0, 1]")
    pool = [r for r in rows if rate(r, "FRR") <= x and rate(r, "HRR_TOTAL") <= b]
    def objective(r):
        rp = rate(r, "RP")
        return rate(r, "HAR"), rp is None, -rp if rp is not None else Fraction(0), rate(r, "HRR_TOTAL")
    chosen = min(pool, key=lambda r: (*objective(r), r["candidate_id"])) if pool else None
    existing = select_candidate([as_candidate(r) for r in rows], max_frr=float(x), max_hrr_total=float(b))
    if (existing.candidate_id if existing else None) != (chosen["candidate_id"] if chosen else None):
        raise ValueError("Existing selector differs from exact-ratio scenario")
    return {"X": fraction_record(x), "B": fraction_record(b),
            "feasibility": "FEASIBLE" if chosen else "INFEASIBLE", "feasible_count": len(pool),
            "candidate_id": chosen["candidate_id"] if chosen else None,
            "fully_tied_candidates": sorted(r["candidate_id"] for r in pool if chosen and objective(r) == objective(chosen)),
            "usage": "HYPOTHETICAL_SENSITIVITY_NOT_APPROVAL"}


def minimum_review_frontier(rows):
    result = []
    for x in sorted({rate(r, "FRR") for r in rows}):
        eligible = [r for r in rows if rate(r, "FRR") <= x]
        b = min(rate(r, "HRR_TOTAL") for r in eligible)
        if not result or result[-1]["minimum_B"] != fraction_record(b):
            result.append({"minimum_X": fraction_record(x), "minimum_B": fraction_record(b),
                           "witness_candidates": sorted(r["candidate_id"] for r in eligible if rate(r, "HRR_TOTAL") == b)})
    return result


def build_preparation(source):
    recalc = source["recalculation"]
    if (source["status"] != "PASS" or recalc["status"] != "PASS" or recalc["difference_count"] != 0
            or recalc["python_reference_action_mismatches"] != 0
            or source["test_accessed"] is not False or source["team_approved"] is not False):
        raise ValueError("Source must be unapproved, previously validated Validation evidence")
    rows = recalc["candidates"]
    if len(rows) != 25 or len({r["candidate_id"] for r in rows}) != 25:
        raise ValueError("Expected frozen 25-candidate pool")
    xs = sorted({Fraction(0), Fraction(1)} | {rate(r, "FRR") for r in rows})
    bs = sorted({Fraction(0), Fraction(1)} | {rate(r, "HRR_TOTAL") for r in rows})
    full_grid = [scenario(rows, x, b) for x in xs for b in bs]
    illustrative_x = [Fraction(5, 100), Fraction(32, 547), Fraction(53, 547), Fraction(91, 547)]
    illustrative_b = [Fraction(p, 100) for p in (15, 20, 28, 30, 35, 44)]
    compact = [scenario(rows, x, b) for x in illustrative_x for b in illustrative_b]
    selected = [next(r for r in rows if r["candidate_id"] == cid) for cid in FOUR]
    boundaries = {}
    for r in selected:
        vectors = boundary_vectors(r["thresholds_ppm"], "PREPARATION_ONLY_NOT_A_MANIFEST_HASH")
        # Deliberately omit a policy hash: no new identity was generated.
        boundaries[r["candidate_id"]] = [{"id": v["id"], "scores_ppm": v["scores_ppm"],
                                         "input_status": v["input_status"],
                                         "expected_action": v["expected"]["action"],
                                         "expected_reason_codes": v["expected"]["reason_codes"],
                                         "expected_rule_ids": v["expected"]["triggered_rule_ids"]} for v in vectors]
    return {"ticket": "AI-11-POLICY-APPROVAL-PREPARATION", "status": "PASS",
            "scope": "PREPARATION_ONLY_NOT_POLICY_APPROVAL_OR_ACTIVATION",
            "approved_X": None, "approved_B": None, "team_approved": False, "adopted_candidate_id": None,
            "policy_applied": False, "manifest_generated": False, "new_policy_manifest_hash": None,
            "lock_executed": False, "test_accessed": False, "raw_prediction_rows_recomputed": False,
            "error_cases_reanalyzed": False, "source_row_revalidation_reused": True,
            "candidate_pool": 25, "four_candidate_comparison": selected,
            "X_breakpoints": [fraction_record(v) for v in xs], "B_breakpoints": [fraction_record(v) for v in bs],
            "full_breakpoint_grid": full_grid, "illustrative_grid": compact,
            "minimum_review_frontier": minimum_review_frontier(rows),
            "selection_rule": "FRR<=X and HRR_TOTAL<=B; then min HAR, max RP, min HRR_TOTAL; disclose metric ties",
            "grid_scope": "All observed FRR/HRR breakpoints plus 0/1. Within adjacent half-open bound intervals, the feasible pool and ranking stay fixed. Last endpoint 1 is included.",
            "synthetic_python_boundary_vectors": boundaries, "python_boundary_vector_count": sum(map(len, boundaries.values())),
            "node_parity_executed": False, "F_runtime_execution": False,
            "readiness_blockers": ["F evaluator hard-pins W4 policy hash and provisional metadata",
                                   "Existing W4 Node parity harness uses localW4E2E and W4 hash validation",
                                   "Canonical profile accepts integer numbers only; exact rational X/B encoding requires A/F agreement",
                                   "Actual reviewer capacity, input rate and per-case review time are unmeasured",
                                   "New Manifest approval, F owner change approval and real LOCK/TEST approvals remain separate"]}


def main():
    payload = SOURCE.read_bytes()
    if hashlib.sha256(payload).hexdigest() != SOURCE_SHA:
        raise ValueError("Committed source report changed; do not use it")
    report = build_preparation(json.loads(payload))
    historical = {}
    for prefix in ("w4_a_validation/20261016", "w4_a_revalidation/20261016-final-r02"):
        base = ROOT / "ai/artifacts/reports" / prefix
        for name in ("policy_manifest.json", "policy_manifest.canonical.json", "policy_hash.json"):
            path = base / name
            raw = path.read_bytes()
            historical[path.relative_to(ROOT).as_posix()] = hashlib.sha256(raw).hexdigest()
        canonical = (base / "policy_manifest.canonical.json").read_bytes()
        if "0x" + hashlib.sha256(b"verimod:policy:v1\0" + canonical).hexdigest() != W4_HASH:
            raise ValueError("Historical W4 policy identity mismatch")
    inspected = ["backend/src/inference.ts", "backend/src/issuance.ts", "backend/src/app.ts",
                 "backend/test/inference.test.ts", "backend/test/w4-manifest-boundary.test.ts",
                 "ai/scripts/prepare_w4_policy.py", "ai/scripts/w4_policy_parity.mts",
                 "shared/protocol/src/canonical.ts", "shared/protocol/src/hash.ts",
                 "ai/src/verimod_ai/evaluation/selection.py", "ai/src/verimod_ai/evaluation/w4_policy.py"]
    report.update(source_report_sha256=SOURCE_SHA, historical_W4_policy_hash=W4_HASH,
                  historical_manifest_file_sha256=historical, inspected_source_sha256={
                      p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest() for p in inspected},
                  execution_script_sha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  source_commit=subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
                  created_at_utc=datetime.now(timezone.utc).isoformat())
    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ-") + uuid4().hex[:8]
    target = OUTPUT / run_id
    target.mkdir(parents=True, exist_ok=False)
    with (target / "preparation.json").open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(report, stream, indent=2, ensure_ascii=False, allow_nan=False)
        stream.write("\n")
    print(json.dumps({"status": "PASS", "scope": "PREPARATION_ONLY", "grid_points": len(report["full_breakpoint_grid"]),
                      "boundary_vectors": report["python_boundary_vector_count"], "policy_approved": False,
                      "output": (target / "preparation.json").relative_to(ROOT).as_posix()}))


if __name__ == "__main__":
    main()
