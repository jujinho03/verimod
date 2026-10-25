"""AI-12 preparation uses invented observations only, never dataset files."""

from dataclasses import replace
import importlib.util
from pathlib import Path

import pytest

from verimod_ai.evaluation.bootstrap import bootstrap_ci
from verimod_ai.evaluation.w5_preregistration import (
    CONFIG, RealEvaluationBlocked, SyntheticRow, _report, build_synthetic_report,
    inspect_approval_metadata, reject_real_evaluation,
)


def _approval_record():
    # Structural dummy metadata: these are not approvals or an actual LOCK.
    return {
        "xb_approved_by": "주진호", "model_policy_approved_by": "주진호",
        "test_authorized_by": "주진호", "X": 0.1, "B": 0.3,
        "lock_commit_sha": "a" * 40, "authorization_lock_sha": "a" * 40,
        "model_manifest_sha256": "b" * 64, "policy_manifest_sha256": "c" * 64,
        "evaluation_code_sha256": "d" * 64,
        "xb_approved_at": "2026-10-21T09:00:00+09:00",
        "model_policy_approved_at": "2026-10-21T09:01:00+09:00",
        "locked_at": "2026-10-21T09:02:00+09:00",
        "test_authorized_at": "2026-10-21T09:03:00+09:00",
    }


@pytest.fixture(scope="module")
def synthetic_report():
    return build_synthetic_report()


def test_fixed_protocol_and_configuration_rejection():
    CONFIG.validate()
    for field, value in (("n_resamples", 999), ("seed", 1), ("confidence_level", 0.9),
                         ("lower_percentile", 5.0), ("upper_percentile", 95.0),
                         ("n_resamples", True), ("seed", 20260923.0)):
        with pytest.raises(ValueError, match="fixed protocol"):
            replace(CONFIG, **{field: value}).validate()


def test_fixed_fixture_counts_and_meaning(synthetic_report):
    assert synthetic_report["evidence_type"] == "SYNTHETIC_ONLY"
    assert synthetic_report["test_state"] == "SEALED"
    model = synthetic_report["metrics"]["model"]
    assert model["accuracy_counts"] == {"numerator": 6, "denominator": 12}
    assert model["accuracy"] == 0.5
    assert sum(sum(row.values()) for row in model["confusion_matrix"].values()) == 12
    policy = synthetic_report["metrics"]["policy"]
    assert policy["counts"] == {
        "FRR": {"numerator": 1, "denominator": 4},
        "RP": {"numerator": 3, "denominator": 4},
        "HAR": {"numerator": 2, "denominator": 8},
        "HRR_TOTAL": {"numerator": 4, "denominator": 12},
    }
    assert policy["action_counts"] == {"ALLOW": 4, "RESTRICT": 4, "HUMAN_REVIEW": 4}
    assert policy["FRR"] == 0.25 and policy["RP"] == 0.75
    assert synthetic_report["metrics"]["latency"]["status"] == "SYNTHETIC_ONLY_NOT_MEASURED"
    assert synthetic_report["metrics"]["latency"]["mean"] == 15.5
    assert synthetic_report["metrics"]["latency"]["p95"] == 21.0


def test_all_intervals_use_preregistered_configuration(synthetic_report):
    assert len(synthetic_report["confidence_intervals"]) == 18
    assert synthetic_report["n_groups"] == 6
    for interval in synthetic_report["confidence_intervals"].values():
        assert interval["n_resamples"] == 1000
        assert interval["seed"] == 20260923
        assert interval["confidence_level"] == 0.95
        assert interval["unit"] == "group"
        assert interval["method"] == "percentile"
        assert 0 <= interval["n_undefined"] <= 1000
        assert interval["lower"] <= interval["upper"]


def test_group_resampling_is_reproducible(synthetic_report):
    assert build_synthetic_report() == synthetic_report


def test_iid_mode_is_explicit_and_invalid_mode_rejected():
    report = build_synthetic_report(sampling_unit="item")
    assert "real independence is unverified" in report["assumption"]
    assert all(ci["unit"] == "item" for ci in report["confidence_intervals"].values())
    with pytest.raises(ValueError, match="sampling_unit"):
        build_synthetic_report(sampling_unit="unknown")


def test_undefined_denominators_remain_explicit():
    rows = [SyntheticRow("none", "none", "ALLOW", 1.0, "invented-group")]
    report = _report(rows)
    assert report["policy"]["RP"] is None and report["policy"]["HAR"] is None
    assert report["policy"]["counts"]["RP"] == {"numerator": 0, "denominator": 0}
    assert report["model"]["per_class"]["hate"]["precision"] == 0
    assert report["model"]["per_class"]["hate"]["precision_defined"] is False
    assert report["model"]["macro_f1"] == pytest.approx(1 / 3)
    interval = bootstrap_ci(rows, lambda sample: _report(sample)["policy"]["RP"],
                            n_resamples=1000, seed=20260923, confidence_level=0.95)
    assert interval["n_undefined"] == 1000
    assert interval["lower"] is None and interval["upper"] is None and interval["point"] is None


@pytest.mark.parametrize("latency", [-1.0, float("inf"), float("nan")])
def test_invalid_latency_is_rejected(latency):
    with pytest.raises(ValueError, match="latency"):
        _report([SyntheticRow("none", "none", "ALLOW", latency, "invented")])


def test_empty_or_complete_metadata_never_opens_gate():
    empty = inspect_approval_metadata()
    assert empty["metadata_structure_status"] == "BLOCKED"
    complete = inspect_approval_metadata(_approval_record())
    assert complete["metadata_structure_status"] == "PASS"
    for result in (empty, complete):
        assert result["execution_allowed"] is False
        assert result["execution_status"] == "BLOCKED"
        assert result["test_state"] == "SEALED"


@pytest.mark.parametrize("key,value", [
    ("test_authorized_by", True), ("X", True), ("B", float("nan")),
    ("X", -0.1), ("B", 1.1), ("lock_commit_sha", "invalid"),
    ("authorization_lock_sha", "b" * 40), ("model_manifest_sha256", "short"),
    ("locked_at", "2026-10-21T00:02:00"),
    ("locked_at", "2026-10-21T08:00:00+09:00"),
    ("test_authorized_at", "2026-10-21T09:02:00+09:00"),
    ("test_authorized_at", "2026-10-21T09:01:00+09:00"),
])
def test_approval_order_digest_and_identity_fail_closed(key, value):
    record = _approval_record()
    record[key] = value
    result = inspect_approval_metadata(record)
    assert result["metadata_structure_status"] == "BLOCKED"
    assert result["execution_allowed"] is False
    assert result["metadata_problems"]


def test_real_execution_boundary_always_raises():
    with pytest.raises(RealEvaluationBlocked, match="TEST SEALED"):
        reject_real_evaluation()


def test_cli_rejects_actual_execution_before_writes(monkeypatch, capsys):
    script = Path(__file__).resolve().parents[1] / "scripts" / "prepare_w5_evaluation.py"
    spec = importlib.util.spec_from_file_location("w5_preparation_cli", script)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    def no_writes(*args, **kwargs):
        raise AssertionError("blocked command must not write output")
    monkeypatch.setattr(Path, "mkdir", no_writes)
    monkeypatch.setattr(Path, "open", no_writes)
    assert module.main(["test-evaluate", "--save-evidence"]) == 3
    assert "TEST SEALED" in capsys.readouterr().out
    with pytest.raises(SystemExit) as exc:
        module.main(["synthetic-dry-run", "--data-path", "UNUSED_DUMMY"])
    assert exc.value.code == 2
