"""S1/S2/S3 research scenarios from committed public evidence only; no data loaders."""
from copy import deepcopy
import importlib.util
import json
from pathlib import Path
import sys

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "ai/scripts"))
SPEC = importlib.util.spec_from_file_location("research_scenarios", ROOT / "ai/scripts/prepare_w5_research_scenarios.py")
rs = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(rs)


@pytest.fixture(scope="module")
def source():
    return json.loads(rs.SOURCE.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def report(source):
    return rs.build_research_scenarios(source)


def test_research_scope_never_approves_or_locks(report):
    assert report["approved_X"] is report["approved_B"] is report["adopted_candidate_id"] is None
    for name in ("team_approved", "manifest_generated", "lock_executed", "test_accessed",
                 "raw_prediction_rows_recomputed"):
        assert report[name] is False
    assert report["new_policy_manifest_hash"] is None and report["candidate_pool"] == 25


@pytest.mark.parametrize("sid,expected,frr,har,hrr", [
    ("S1", "H50-90_O50-90", 32, 90, 542),
    ("S2", "H50-75_O50-90", 53, 90, 354),
    ("S3", "H50-75_O75-90", 53, 158, 229),
])
def test_official_rule_selects_expected_candidate(report, sid, expected, frr, har, hrr):
    s = report["scenarios"][sid]
    assert s["feasibility"] == "FEASIBLE" and s["candidate_id"] == expected
    assert s["fully_tied_candidates"] == [expected]
    m = s["selected"]["metrics"]
    assert (m["FRR"]["numerator"], m["HAR"]["numerator"], m["HRR_TOTAL"]["numerator"]) == (frr, har, hrr)
    assert s["ranked_feasible_pool"][0]["candidate_id"] == expected
    assert len(s["ranked_feasible_pool"]) == s["feasible_count"]


def test_class_action_tables_are_exact_and_complete(report):
    for s in report["scenarios"].values():
        t, a = s["selected"]["class_actions"], s["selected"]["actions"]
        assert sum(t["none"].values()) == 547 and sum(t["harmful"].values()) == 708
        for action in ("RESTRICT", "HUMAN_REVIEW", "ALLOW"):
            assert t["none"][action] + t["harmful"][action] == a[action]


def test_tradeoff_deltas_match_reviewed_comparison(report):
    d12, d23 = report["deltas"]["S1_to_S2"], report["deltas"]["S2_to_S3"]
    assert (d12["none_RESTRICT"], d12["harmful_ALLOW"], d12["HUMAN_REVIEW"]) == (21, 0, -188)
    assert (d23["none_RESTRICT"], d23["harmful_ALLOW"], d23["none_ALLOW"], d23["HUMAN_REVIEW"]) == (0, 68, 57, -125)


def test_stability_cells_contain_scenario_bounds(report):
    for s in report["scenarios"].values():
        for key in ("X", "B"):
            cell, value = s["stability_cell"][key], s[key]["value"]
            assert cell["lower_inclusive"]["value"] <= value
            assert cell["upper_exclusive"] is None or value < cell["upper_exclusive"]["value"]


def test_approved_or_test_touched_source_is_refused(source):
    for field, value in (("team_approved", True), ("test_accessed", True)):
        bad = deepcopy(source)
        bad[field] = value
        with pytest.raises(ValueError):
            rs.build_research_scenarios(bad)


def test_inconsistent_counts_are_refused(source):
    bad = deepcopy(source)
    bad["recalculation"]["candidates"][0]["actions"]["ALLOW"] += 1
    with pytest.raises(ValueError):
        rs.build_research_scenarios(bad)
