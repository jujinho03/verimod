"""AI-13: audit fixed public Validation aggregates; never load prediction rows.

Only the two named W4 public reports are inputs. Output is a fresh W5 directory.
Derived proxy/action counts describe aggregates, never reconstructed real cases.
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
from uuid import uuid4


ROOT = Path(__file__).resolve().parents[2]
SOURCE_DIR = ROOT / "ai/artifacts/reports/w4_a_validation/20261016"
OUTPUT_DIR = ROOT / "ai/artifacts/reports/w5_ai13"
CLASSES = ("hate", "offensive", "none")
ACTIONS = ("ALLOW", "HUMAN_REVIEW", "RESTRICT")
BASELINE = "H50-75_O50-75"


def count(value: object, label: str) -> int:
    if type(value) is not int or value < 0:
        raise ValueError(f"{label}: expected a non-negative integer")
    return value


def ratio(numerator: int, denominator: int) -> dict:
    return {"numerator": numerator, "denominator": denominator,
            "value": numerator / denominator if denominator else None}


def check_number(value: object, expected: float | None, label: str) -> None:
    if expected is None:
        if value is not None:
            raise ValueError(f"{label}: undefined ratio must be null")
    elif (type(value) not in (int, float) or not math.isfinite(value)
          or not math.isclose(value, expected, rel_tol=0, abs_tol=1e-12)):
        raise ValueError(f"{label}: metric does not match counts")


def analyze_aggregates(validation: dict, policy: dict) -> dict:
    """Validate totals and derive counts without reading any file or raw row."""
    provenance = validation["provenance"]
    if provenance["split"] != "validation" or provenance["test_accessed"] is not False:
        raise ValueError("Only reports explicitly declaring sealed-test Validation are allowed")
    if validation["status"] != "PASS":
        raise ValueError("Source Validation report must be PASS")
    if provenance["score_semantics"] != "UNCALIBRATED":
        raise ValueError("Unexpected score semantics; review the analysis contract")
    prediction_hash = provenance["predictions_sha256"]
    if (not isinstance(prediction_hash, str)
            or not re.fullmatch(r"[0-9a-f]{64}", prediction_hash)
            or policy["predictions_sha256"] != prediction_hash):
        raise ValueError("Reports must identify the same Validation prediction hash")

    metrics = validation["metrics"]
    if tuple(metrics["classes"]) != CLASSES:
        raise ValueError("Unexpected native class contract")
    matrix = metrics["confusion_matrix"]
    if set(matrix) != set(CLASSES):
        raise ValueError("Unexpected confusion-matrix rows")
    for truth in CLASSES:
        if set(matrix[truth]) != set(CLASSES):
            raise ValueError("Unexpected confusion-matrix columns")
        for predicted in CLASSES:
            count(matrix[truth][predicted], f"matrix.{truth}.{predicted}")
    supports = {truth: sum(matrix[truth].values()) for truth in CLASSES}
    n = sum(supports.values())
    if n == 0:
        raise ValueError("Empty source population")
    for declared in (metrics["n"], provenance["split_count"],
                     provenance["prediction_rows"], policy["eligible"]):
        if count(declared, "population") != n:
            raise ValueError("Population count mismatch")
    if validation["input_status_counts"] != {"FULL": n}:
        raise ValueError("This analysis requires the recorded all-FULL Validation population")

    per_class = {}
    for label in CLASSES:
        tp = matrix[label][label]
        predicted_count = sum(matrix[truth][label] for truth in CLASSES)
        support = supports[label]
        expected = {"precision": tp / predicted_count if predicted_count else 0.0,
                    "recall": tp / support if support else 0.0,
                    "f1": 2 * tp / (predicted_count + support) if predicted_count + support else 0.0}
        recorded = metrics["per_class"][label]
        if count(recorded["support"], "support") != support:
            raise ValueError("Support mismatch")
        for key, expected_value in expected.items():
            check_number(recorded[key], expected_value, f"{label}.{key}")
        for key, denominator in (("precision", predicted_count), ("recall", support),
                                 ("f1", predicted_count + support)):
            if recorded[f"{key}_defined"] is not bool(denominator):
                raise ValueError(f"{label}.{key}: defined flag mismatch")
        per_class[label] = {"support": support, "population_share": ratio(support, n),
                            "predicted_count": predicted_count, "true_positive": tp,
                            "false_positive": predicted_count - tp, "false_negative": support - tp,
                            **expected}
    correct = sum(matrix[label][label] for label in CLASSES)
    check_number(metrics["accuracy"], correct / n, "accuracy")
    check_number(metrics["micro_f1"], correct / n, "micro_f1")
    check_number(metrics["macro_f1"], sum(c["f1"] for c in per_class.values()) / 3, "macro_f1")

    normal = supports["none"]
    harmful = n - normal
    candidates = policy["candidates"]
    if len(candidates) != 25:
        raise ValueError("Expected the fixed W4 set of 25 candidates")
    seen = set()
    derived = []
    for candidate in candidates:
        candidate_id = candidate["candidate_id"]
        if not isinstance(candidate_id, str) or candidate_id in seen:
            raise ValueError("Candidate IDs must be unique strings")
        seen.add(candidate_id)
        if count(candidate["n"], "candidate.n") != n or set(candidate["actions"]) != set(ACTIONS):
            raise ValueError("Candidate population/action contract mismatch")
        actions = {a: count(candidate["actions"][a], f"actions.{a}") for a in ACTIONS}
        if sum(actions.values()) != n:
            raise ValueError("Candidate actions must sum to population")
        reported = candidate["metrics"]
        expected_denominators = {"FRR": normal, "RP": actions["RESTRICT"],
                                 "HAR": harmful, "HRR_TOTAL": n}
        for name, denominator in expected_denominators.items():
            numerator = count(reported[name]["numerator"], f"{name}.numerator")
            if count(reported[name]["denominator"], f"{name}.denominator") != denominator:
                raise ValueError(f"{name}: denominator mismatch")
            if numerator > denominator:
                raise ValueError(f"{name}: numerator exceeds denominator")
            check_number(reported[name]["value"], numerator / denominator if denominator else None, name)
        if reported["HRR_TOTAL"]["numerator"] != actions["HUMAN_REVIEW"]:
            raise ValueError("HRR numerator/action mismatch")
        cross = {
            "none_proxy": {"RESTRICT": reported["FRR"]["numerator"],
                           "ALLOW": actions["ALLOW"] - reported["HAR"]["numerator"]},
            "hate_offensive_proxy": {"RESTRICT": reported["RP"]["numerator"],
                                     "ALLOW": reported["HAR"]["numerator"]},
        }
        for proxy, total in (("none_proxy", normal), ("hate_offensive_proxy", harmful)):
            cross[proxy]["HUMAN_REVIEW"] = total - sum(cross[proxy].values())
            for action in ACTIONS:
                count(cross[proxy][action], f"derived.{proxy}.{action}")
        for action in ACTIONS:
            if sum(values[action] for values in cross.values()) != actions[action]:
                raise ValueError("Derived proxy/action column mismatch")
        status_counts = candidate["by_input_status"]
        if (set(status_counts) != {"FULL", "TRUNCATED"}
                or status_counts["FULL"] != actions or status_counts["TRUNCATED"] != {}):
            raise ValueError("Candidate input-status counts mismatch")
        derived.append({"candidate_id": candidate_id, "proxy_action_counts": cross,
                        "review_composition": {
                            "none_proxy": ratio(cross["none_proxy"]["HUMAN_REVIEW"], actions["HUMAN_REVIEW"]),
                            "hate_offensive_proxy": ratio(cross["hate_offensive_proxy"]["HUMAN_REVIEW"], actions["HUMAN_REVIEW"])},
                        "policy_metrics": reported})
    if BASELINE not in seen:
        raise ValueError("W4 technical candidate is missing")
    return {
        "status": "PARTIAL",
        "aggregate_audit": {"status": "PASS", "candidate_count": len(derived), "population": n},
        "row_case_analysis": {"status": "NOT_IMPLEMENTED", "verified_real_cases": 0,
                              "scope": "THIS_AGGREGATE_ONLY_COMMAND",
                              "reason": "This aggregate-only command does not read private rows; use the separately authorized revalidate_w5_rows.py evidence."},
        "test_accessed": False, "model_inference_executed": False,
        "raw_prediction_rows_accessed": False, "policy_selected": False,
        "source_provenance": provenance,
        "provenance_verification_scope": "Public reports agree on prediction hash and counts; private prediction bytes not verified.",
        "model": {"confusion_matrix": matrix, "per_class": per_class,
                  "accuracy": ratio(correct, n), "macro_f1": metrics["macro_f1"],
                  "classification_error": ratio(n - correct, n),
                  "none_predicted_hate_or_offensive": ratio(matrix["none"]["hate"] + matrix["none"]["offensive"], normal),
                  "hate_offensive_predicted_none": ratio(matrix["hate"]["none"] + matrix["offensive"]["none"], harmful),
                  "hate_offensive_confusions": ratio(matrix["hate"]["offensive"] + matrix["offensive"]["hate"], harmful)},
        "candidate_proxy_action_counts": derived,
        "limitations": ["Native predictions and policy actions are distinct; the aggregates cannot identify their casewise overlap.",
                        "Native none is an operational normal proxy, not definitive platform acceptability.",
                        "UNCALIBRATED scores are not empirical probabilities of harm.",
                        "HUMAN_REVIEW routing does not establish reviewer correctness, turnaround, or appeals success.",
                        "Validation tuning and selection do not establish untouched TEST or deployment performance.",
                        "Domain shift, annotation ambiguity, and subgroup disparities require evidence beyond these aggregates."],
    }


def write_report(report: dict, run_id: str, output_root: Path = OUTPUT_DIR) -> Path:
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,79}", run_id):
        raise ValueError("run-id must be a safe single directory name")
    run_dir = output_root / run_id
    run_dir.mkdir(parents=True, exist_ok=False)
    output = run_dir / "analysis.json"
    with output.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(report, stream, ensure_ascii=False, indent=2, allow_nan=False)
        stream.write("\n")
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-id", default=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ-") + uuid4().hex[:8])
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]{0,79}", args.run_id):
        parser.error("run-id must be a safe single directory name")
    inputs = {}
    hashes = {}
    for name in ("validation.json", "policy_candidates.json"):
        path = SOURCE_DIR / name
        payload = path.read_bytes()
        inputs[name] = json.loads(payload)
        hashes[path.relative_to(ROOT).as_posix()] = hashlib.sha256(payload).hexdigest()
    report = analyze_aggregates(inputs["validation.json"], inputs["policy_candidates.json"])
    report["run_id"] = args.run_id
    report["created_at_utc"] = datetime.now(timezone.utc).isoformat()
    report["source_file_sha256"] = hashes
    report["analysis_script_sha256"] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    report["base_git_sha"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    report["code_state"] = "Script source SHA-256 identifies executed working-tree bytes; base_git_sha is not a claim that new code was committed."
    output = write_report(report, args.run_id)
    print(json.dumps({"status": report["status"], "aggregate_audit": "PASS", "row_cases": report["row_case_analysis"]["status"],
                      "report": output.relative_to(ROOT).as_posix()}, ensure_ascii=False))


if __name__ == "__main__":
    main()
