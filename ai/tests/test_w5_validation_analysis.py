"""Synthetic aggregate fixtures: no dataset, model, or private prediction access."""
from copy import deepcopy
import importlib.util
from pathlib import Path

import pytest


MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts/analyze_w5_validation.py"
SPEC = importlib.util.spec_from_file_location("w5_validation_analysis", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


@pytest.fixture
def reports():
    matrix = {"hate": {"hate": 2, "offensive": 1, "none": 0},
              "offensive": {"hate": 1, "offensive": 1, "none": 1},
              "none": {"hate": 0, "offensive": 1, "none": 1}}
    per_class = {}
    for label, support, score in (("hate", 3, 2 / 3), ("offensive", 3, 1 / 3), ("none", 2, 1 / 2)):
        per_class[label] = {"support": support, "precision": score, "recall": score, "f1": score,
                            "precision_defined": True, "recall_defined": True, "f1_defined": True}
    validation = {"status": "PASS", "provenance": {
        "split": "validation", "test_accessed": False, "score_semantics": "UNCALIBRATED",
        "predictions_sha256": "a" * 64, "split_count": 8, "prediction_rows": 8},
        "metrics": {"classes": ["hate", "offensive", "none"], "n": 8, "confusion_matrix": matrix,
                    "per_class": per_class, "accuracy": .5, "micro_f1": .5, "macro_f1": .5},
        "input_status_counts": {"FULL": 8}}
    candidate = {"candidate_id": MODULE.BASELINE, "n": 8,
                 "actions": {"ALLOW": 3, "HUMAN_REVIEW": 3, "RESTRICT": 2},
                 "metrics": {"FRR": MODULE.ratio(1, 2), "RP": MODULE.ratio(1, 2),
                             "HAR": MODULE.ratio(2, 6), "HRR_TOTAL": MODULE.ratio(3, 8)},
                 "by_input_status": {"FULL": {"ALLOW": 3, "HUMAN_REVIEW": 3, "RESTRICT": 2},
                                     "TRUNCATED": {}}}
    candidates = [candidate]
    for index in range(24):
        other = deepcopy(candidate)
        other["candidate_id"] = f"synthetic-{index}"
        candidates.append(other)
    return validation, {"eligible": 8, "predictions_sha256": "a" * 64, "candidates": candidates}


def test_recovers_proxy_table_without_equating_native_error_and_policy_error(reports):
    report = MODULE.analyze_aggregates(*reports)
    assert report["model"]["classification_error"] == MODULE.ratio(4, 8)
    assert report["model"]["hate_offensive_confusions"] == MODULE.ratio(2, 6)
    cross = report["candidate_proxy_action_counts"][0]["proxy_action_counts"]
    assert cross == {"none_proxy": {"RESTRICT": 1, "ALLOW": 1, "HUMAN_REVIEW": 0},
                     "hate_offensive_proxy": {"RESTRICT": 1, "ALLOW": 2, "HUMAN_REVIEW": 3}}
    assert report["row_case_analysis"]["verified_real_cases"] == 0
    assert report["row_case_analysis"]["status"] == "BLOCKED"
    assert report["raw_prediction_rows_accessed"] is False


@pytest.mark.parametrize("split", ["train", "sealed", "unknown"])
def test_rejects_non_validation_report_before_analysis(reports, split):
    reports[0]["provenance"]["split"] = split
    with pytest.raises(ValueError, match="Only reports"):
        MODULE.analyze_aggregates(*reports)


def test_rejects_unverified_provenance_pair(reports):
    reports[1]["predictions_sha256"] = "b" * 64
    with pytest.raises(ValueError, match="same Validation prediction hash"):
        MODULE.analyze_aggregates(*reports)


def test_rejects_claimed_metrics_inconsistent_with_matrix(reports):
    reports[0]["metrics"]["per_class"]["offensive"]["f1"] = .99
    with pytest.raises(ValueError, match="does not match counts"):
        MODULE.analyze_aggregates(*reports)


def test_rejects_inconsistent_proxy_partition_even_when_rates_are_valid(reports):
    candidate = reports[1]["candidates"][0]
    candidate["metrics"]["RP"] = MODULE.ratio(2, 2)
    with pytest.raises(ValueError, match="column mismatch"):
        MODULE.analyze_aggregates(*reports)


def test_rejects_negative_derived_cell(reports):
    candidate = reports[1]["candidates"][0]
    candidate["metrics"]["HAR"] = MODULE.ratio(4, 6)
    with pytest.raises(ValueError, match="non-negative integer"):
        MODULE.analyze_aggregates(*reports)


def test_rejects_bool_count_and_nan_rate(reports):
    invalid = deepcopy(reports)
    invalid[0]["metrics"]["confusion_matrix"]["hate"]["hate"] = True
    with pytest.raises(ValueError, match="non-negative integer"):
        MODULE.analyze_aggregates(*invalid)
    reports[1]["candidates"][0]["metrics"]["FRR"]["value"] = float("nan")
    with pytest.raises(ValueError, match="does not match counts"):
        MODULE.analyze_aggregates(*reports)


def test_undefined_restrict_precision_stays_null(reports):
    candidate = reports[1]["candidates"][0]
    candidate["actions"] = {"ALLOW": 3, "HUMAN_REVIEW": 5, "RESTRICT": 0}
    candidate["by_input_status"]["FULL"] = dict(candidate["actions"])
    candidate["metrics"].update(FRR=MODULE.ratio(0, 2), RP=MODULE.ratio(0, 0), HRR_TOTAL=MODULE.ratio(5, 8))
    report = MODULE.analyze_aggregates(*reports)
    assert report["candidate_proxy_action_counts"][0]["policy_metrics"]["RP"]["value"] is None
    candidate["metrics"]["RP"]["value"] = 0
    with pytest.raises(ValueError, match="must be null"):
        MODULE.analyze_aggregates(*reports)


def test_refuses_duplicate_candidates(reports):
    reports[1]["candidates"][1]["candidate_id"] = MODULE.BASELINE
    with pytest.raises(ValueError, match="unique"):
        MODULE.analyze_aggregates(*reports)


def test_existing_evidence_is_never_overwritten(tmp_path):
    output = MODULE.write_report({"synthetic_fixture": True}, "run-1", tmp_path)
    before = output.read_bytes()
    with pytest.raises(FileExistsError):
        MODULE.write_report({"synthetic_fixture": "changed"}, "run-1", tmp_path)
    assert output.read_bytes() == before


@pytest.mark.parametrize("run_id", ["../escape", "a/b", "a\\b", ".", "", "CON:"])
def test_rejects_unsafe_output_name_before_filesystem_access(tmp_path, run_id):
    with pytest.raises(ValueError, match="safe single directory name"):
        MODULE.write_report({}, run_id, tmp_path)
    assert list(tmp_path.iterdir()) == []
