"""AI-11 safe public aggregates and synthetic candidate scenarios; no dataset IO."""
from copy import deepcopy
import importlib.util
import json
import math
from pathlib import Path
from unittest.mock import patch

import pytest

from verimod_ai.evaluation.policy_metrics import PolicyMetrics
from verimod_ai.evaluation.selection import Candidate

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("w5_selection_script", ROOT / "ai/scripts/select_w5_policy.py")
w5 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(w5)


@pytest.fixture
def reports():
    data, _ = w5.load_pinned_reports()
    return data["validation.json"], data["policy_candidates.json"]


def candidate(cid, frr=.1, rp=.8, har=.2, hrr=.2):
    return Candidate(cid, "validation", PolicyMetrics(100, 50, 50, 10, frr, rp, har, hrr))


def test_saved_evidence_is_audit_only(reports):
    report = w5.build_report(*reports)
    assert report["aggregate_audit"] == "PASS" and report["candidate_count"] == 25
    assert report["X"] is report["B"] is report["adopted_candidate_id"] is None
    assert not report["team_approved"] and not report["test_accessed"] and not report["model_executed"]
    assert report["row_recomputation"].startswith("BLOCKED")
    assert all(s["usage"] == "SIMULATION_ONLY_NOT_TEAM_APPROVED"
               for s in report["observed_boundary_simulations"])


@pytest.mark.parametrize("fault", ["split", "digest", "count", "approval", "duplicate", "ratio", "negative", "cross", "status", "threshold"])
def test_corrupt_or_wrong_population_rejected(reports, fault):
    v, c = deepcopy(reports)
    first = c["candidates"][0]
    if fault == "split": v["provenance"]["split"] = "held_out_synthetic"
    if fault == "digest": c["predictions_sha256"] = "0" * 64
    if fault == "count": first["actions"]["ALLOW"] += 1
    if fault == "approval": c["team_approved"] = True
    if fault == "duplicate": c["candidates"][1]["candidate_id"] = first["candidate_id"]
    if fault == "ratio": first["metrics"]["FRR"]["value"] += .01
    if fault == "negative": first["metrics"]["FRR"]["numerator"] = -1
    if fault == "cross":
        first["metrics"]["RP"]["numerator"] -= 1
        first["metrics"]["RP"]["value"] = first["metrics"]["RP"]["numerator"] / first["actions"]["RESTRICT"]
    if fault == "status": first["by_input_status"]["TRUNCATED"] = {"HUMAN_REVIEW": 1}
    if fault == "threshold": first["thresholds_ppm"]["hate"]["review"] = True
    with pytest.raises(ValueError): w5.validate_reports(v, c)


def test_exact_boundary_and_infeasible(reports):
    cs = w5.validate_reports(*reports)
    x, b = 32 / 547, 542 / 1255
    exact = w5.simulate(cs, x, b)
    assert exact["candidate_id"] == "H50-90_O50-90"
    assert w5.simulate(cs, math.nextafter(x, 0), 1)["status"] == "INFEASIBLE"
    assert w5.simulate([candidate("edge")], .1, .2)["status"] == "FEASIBLE"
    assert w5.simulate([candidate("edge")], .1, math.nextafter(.2, 0))["status"] == "INFEASIBLE"


@pytest.mark.parametrize("x,b", [(-.1, .2), (1.1, .2), (.1, float("nan")), (True, .2)])
def test_invalid_bounds(x, b):
    with pytest.raises(ValueError): w5.simulate([candidate("a")], x, b)


def test_ties_and_undefined_rp_are_disclosed():
    cs = [candidate("z"), candidate("a"), candidate("worse", rp=.7), candidate("undefined", rp=None)]
    result = w5.simulate(cs, .1, .2)
    assert result["candidate_id"] == "a"
    assert result["fully_tied_candidates"] == ["a", "z"]
    assert w5.simulate([candidate("review", hrr=.1), candidate("base")], .1, .2)["candidate_id"] == "review"


def test_undefined_denominator_is_not_zero():
    assert w5.checked_metric({"numerator": 0, "denominator": 0, "value": None}, 0) is None
    with pytest.raises(ValueError):
        w5.checked_metric({"numerator": 0, "denominator": 0, "value": 0}, 0)


def test_formal_mode_rejects_before_any_report_read():
    with patch.object(w5, "load_pinned_reports", side_effect=AssertionError("must not load")):
        with pytest.raises(SystemExit) as error: w5.main(["--mode", "formal"])
    assert error.value.code == 2


@pytest.mark.parametrize("args", [["--x", ".1"], ["--mode", "simulate", "--b", ".2"]])
def test_partial_bound_cli_rejects_before_read(args):
    with patch.object(w5, "load_pinned_reports", side_effect=AssertionError("must not load")):
        with pytest.raises(SystemExit): w5.main(args)


def test_no_overwrite_or_path_escape(tmp_path):
    path = w5.write_new_report({"synthetic": True}, tmp_path, "safe-run")
    saved = path.read_bytes()
    with pytest.raises(FileExistsError): w5.write_new_report({}, tmp_path, "safe-run")
    assert path.read_bytes() == saved
    for run_id in ("../escape", "/escape", "..", "a/b", "a\\b"):
        with pytest.raises(ValueError): w5.write_new_report({}, tmp_path, run_id)


def test_newline_independent_semantic_digest():
    assert w5.json_digest(json.loads('{"a": 1}\r\n')) == w5.json_digest({"a": 1})
