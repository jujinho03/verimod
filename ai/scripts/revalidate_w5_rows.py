"""Read only the two explicitly authorized, hash-pinned Validation row files.

No arbitrary dataset path arguments, directory enumeration, model inference,
policy approval, LOCK or TEST execution. Public outputs never contain text/IDs.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "ai/src"))
from verimod_ai.evaluation.w5_validation_rows import (
    BASELINE, analyze_cases, recalculate, validate_alignment, validate_predictions,
)

PREDICTIONS = ROOT / "ai/.venv/w4-private-20261016/predictions.jsonl"
SPLIT = ROOT / "../verimod-local-data/w2/beep-splits/validation.jsonl"
EXPECTED_PREDICTIONS = "74fcac005741574422edcd597dc1f78d8234b20e24e50f35d722d01fd927a400"
EXPECTED_SPLIT = "a92f81ed8eadb9fdb1950be542f9edac4fe778f3e7bd2d630cd1494ef031a26a"
PUBLIC = ROOT / "ai/artifacts/reports/w4_a_validation/20261016"
OUTPUT = ROOT / "ai/artifacts/reports/w5_validation_rows"


def read_verified(path, expected, role):
    if path.is_symlink():
        raise ValueError(role + ": symlink input refused")
    try:
        raw = path.read_bytes()
    except OSError:
        raise ValueError(role + ": approved file unavailable; no search performed") from None
    digest = hashlib.sha256(raw).hexdigest()
    if digest != expected:
        raise ValueError(role + ": hash mismatch; input not parsed or used")
    try:
        rows = [json.loads(line) for line in raw.decode("utf-8").splitlines()]
    except (ValueError, UnicodeError):
        raise ValueError(role + ": invalid JSONL; content suppressed") from None
    return rows, {"role": role, "sha256": digest, "expected_sha256": expected, "hash_match": True}


def write_new(path, value):
    with path.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, allow_nan=False)
        stream.write("\n")


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-id", default=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ-") + uuid4().hex[:8])
    args = parser.parse_args(argv)
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,79}", args.run_id):
        parser.error("Invalid run ID")
    rows, prediction_evidence = read_verified(PREDICTIONS, EXPECTED_PREDICTIONS, "validation_predictions")
    schema = validate_predictions(rows, expected_counts={"hate": 305, "offensive": 403, "none": 547})
    inputs, sources = {}, {}
    for name in ("validation.json", "policy_candidates.json"):
        raw = (PUBLIC / name).read_bytes()
        inputs[name] = json.loads(raw)
        sources[name] = hashlib.sha256(raw).hexdigest()
    v, c = inputs["validation.json"], inputs["policy_candidates.json"]
    if v["provenance"]["predictions_sha256"] != EXPECTED_PREDICTIONS or c["predictions_sha256"] != EXPECTED_PREDICTIONS:
        raise ValueError("Public prediction provenance mismatch")
    if v["provenance"]["split_sha256"] != EXPECTED_SPLIT or v["provenance"]["split"] != "validation":
        raise ValueError("Public split provenance mismatch")
    if c["X"] is not None or c["B"] is not None or c["team_approved"] is not False:
        raise ValueError("Unexpected approval state")
    report = {"ticket": "AI-11/AI-13-ROW-REVALIDATION", "created_at_utc": datetime.now(timezone.utc).isoformat(),
              "base_git_sha": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
              "prediction_provenance": prediction_evidence, "prediction_schema": schema,
              "recalculation": recalculate(rows, v, c), "public_input_sha256": sources,
              "X": None, "B": None, "team_approved": False, "policy_selected": False,
              "lock_executed": False, "test_accessed": False, "model_inference_executed": False,
              "raw_text_or_personal_data_published": False}
    if report["recalculation"]["status"] != "PASS":
        report["status"] = "FAIL"
        run_dir = OUTPUT / args.run_id
        run_dir.mkdir(parents=True, exist_ok=False)
        write_new(run_dir / "revalidation.json", report)
        print(json.dumps({"status": "FAIL", "difference_count": report["recalculation"]["difference_count"]}))
        return 1
    mapping = []
    try:
        split, split_evidence = read_verified(SPLIT, EXPECTED_SPLIT, "validation_split")
        alignment = validate_alignment(rows, split)
    except ValueError as exc:
        report["split_alignment"] = {"status": "BLOCKED", "reason": str(exc)}
        report["case_analysis"] = {"status": "BLOCKED", "verified_real_cases": 0}
        report["status"] = "PARTIAL"
    else:
        report["split_provenance"] = split_evidence
        report["split_alignment"] = alignment
        thresholds = next(x for x in c["candidates"] if x["candidate_id"] == BASELINE)["thresholds_ppm"]
        report["case_analysis"], mapping = analyze_cases(rows, split, thresholds)
        report["status"] = "PASS"
    source_files = [Path(__file__), ROOT / "ai/src/verimod_ai/evaluation/w5_validation_rows.py",
                    ROOT / "ai/src/verimod_ai/evaluation/w4_policy.py", ROOT / "ai/scripts/run_w4_validation.py"]
    report["execution_source_sha256"] = {p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                                         for p in source_files}
    report["scope"] = "Row re-evaluation of W4 saved Validation scores; no new model execution, TEST evaluation, approval or LOCK."
    run_dir = OUTPUT / args.run_id
    run_dir.mkdir(parents=True, exist_ok=False)
    if mapping:
        private = ROOT / "ai/.venv" / ("w5-case-map-" + args.run_id)
        ignored = subprocess.run(["git", "check-ignore", "-q", "--", str(private / "case-map.json")], cwd=ROOT)
        if ignored.returncode != 0:
            raise ValueError("Private mapping destination must be Git ignored")
        private.mkdir(exist_ok=False)
        write_new(private / "case-map.json", {"predictions_sha256": EXPECTED_PREDICTIONS,
                                             "split_sha256": EXPECTED_SPLIT, "cases": mapping})
        report["case_mapping_storage"] = "LOCAL_GIT_IGNORED_NO_TEXT_OR_RECORD_IDS"
    write_new(run_dir / "revalidation.json", report)
    print(json.dumps({"status": report["status"], "rows": len(rows), "candidates": 25,
                      "differences": report["recalculation"]["difference_count"],
                      "real_cases": report["case_analysis"]["verified_real_cases"],
                      "output": (run_dir / "revalidation.json").relative_to(ROOT).as_posix()}))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, KeyError, TypeError):
        print(json.dumps({"status": "BLOCKED", "reason": "Input/provenance/schema validation failed; private contents suppressed"}))
        raise SystemExit(2)
