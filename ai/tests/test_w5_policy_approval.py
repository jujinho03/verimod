"""Approval preparation from existing public evidence only; no dataset loaders."""
from copy import deepcopy
from fractions import Fraction
import importlib.util
import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("policy_approval_prep", ROOT / "ai/scripts/prepare_w5_policy_approval.py")
prep = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(prep)


@pytest.fixture(scope="module")
def source():
    return json.loads(prep.SOURCE.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def report(source):
    return prep.build_preparation(source)


def test_no_approval_manifest_or_model_execution(report):
    assert report["approved_X"] is report["approved_B"] is report["adopted_candidate_id"] is None
    for name in ("team_approved", "policy_applied", "manifest_generated", "lock_executed", "test_accessed",
                 "raw_prediction_rows_recomputed", "error_cases_reanalyzed", "node_parity_executed"):
        assert report[name] is False
    assert report["new_policy_manifest_hash"] is None
    assert report["source_row_revalidation_reused"] is True


def test_complete_breakpoint_grid_uses_all_25_candidates(report):
    assert report["candidate_pool"] == 25
    assert len(report["X_breakpoints"]) == 11 and len(report["B_breakpoints"]) == 22
    assert len(report["full_breakpoint_grid"]) == 242
    assert all(s["usage"] == "HYPOTHETICAL_SENSITIVITY_NOT_APPROVAL" for s in report["full_breakpoint_grid"])


def test_minimum_review_frontier(report):
    assert [(r["minimum_X"]["numerator"], r["minimum_X"]["denominator"],
             r["minimum_B"]["numerator"], r["minimum_B"]["denominator"]) for r in report["minimum_review_frontier"]] == [
        (32,547,344,1255), (53,547,229,1255), (91,547,198,1255), (174,547,39,251)]


def test_exact_feasibility_edges_and_impossible_combinations(source):
    rows=source["recalculation"]["candidates"]
    assert prep.scenario(rows,Fraction(32,547),Fraction(344,1255))["candidate_id"]=="H75-90_O75-90"
    assert prep.scenario(rows,Fraction(32,547)-Fraction(1,10**9),Fraction(1))["feasibility"]=="INFEASIBLE"
    assert prep.scenario(rows,Fraction("0.0585"),Fraction(1))["feasibility"]=="INFEASIBLE"  # literal 5.85%, not rounded display
    assert prep.scenario(rows,Fraction(1),Fraction(195,1255)-Fraction(1,10**9))["feasibility"]=="INFEASIBLE"
    assert prep.scenario(rows,Fraction(53,547),Fraction(229,1255))["candidate_id"]=="H50-75_O75-90"


def test_increased_budget_can_select_outside_four_candidates(source):
    rows=source["recalculation"]["candidates"]
    selected=prep.scenario(rows,Fraction(53,547),Fraction(44,100))
    assert selected["candidate_id"]=="H25-75_O50-90"
    assert selected["candidate_id"] not in prep.FOUR


def test_requested_four_observed_bounds_select_corresponding_candidate(source):
    rows=source["recalculation"]["candidates"]
    for name in prep.FOUR:
        row=next(r for r in rows if r["candidate_id"]==name)
        assert prep.scenario(rows,prep.rate(row,"FRR"),prep.rate(row,"HRR_TOTAL"))["candidate_id"]==name


def test_synthetic_threshold_boundaries_have_no_new_identity(report):
    assert report["python_boundary_vector_count"]==84
    for vectors in report["synthetic_python_boundary_vectors"].values():
        assert len(vectors)==21
        assert next(v for v in vectors if v["id"]=="truncated_max")["expected_action"]=="HUMAN_REVIEW"
        for label in ("hate","offensive"):
            assert next(v for v in vectors if v["id"]==label+"_review_-1")["expected_action"]=="ALLOW"
            assert next(v for v in vectors if v["id"]==label+"_review_+0")["expected_action"]=="HUMAN_REVIEW"
            assert next(v for v in vectors if v["id"]==label+"_restrict_+0")["expected_action"]=="RESTRICT"
        assert all("policy_manifest_hash" not in v for v in vectors)


@pytest.mark.parametrize("fault", ["status", "differences", "approval", "sealed", "pool"])
def test_incompatible_source_evidence_rejected(source,fault):
    s=deepcopy(source)
    if fault=="status":s["status"]="FAIL"
    if fault=="differences":s["recalculation"]["difference_count"]=1
    if fault=="approval":s["team_approved"]=True
    if fault=="sealed":s["test_accessed"]=True
    if fault=="pool":s["recalculation"]["candidates"].pop()
    with pytest.raises(ValueError):prep.build_preparation(s)
