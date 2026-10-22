"""Invented Git metadata and claims only; no project datasets or real LOCKs."""
from concurrent.futures import ProcessPoolExecutor
from datetime import datetime
from fractions import Fraction
import hashlib
import json
import os
from pathlib import Path
import subprocess

import pytest

from verimod_ai.evaluation import w5_execution_guard as guard
from verimod_ai.evaluation.w5_preregistration import RealEvaluationBlocked, reject_real_evaluation


PATHS = {
    "model_manifest": "ai/artifacts/manifests/w5_model/synthetic/model.json",
    "policy_manifest": "ai/artifacts/manifests/w5_policy/synthetic/policy.json",
    "evaluation_code": "ai/scripts/synthetic_evaluator.py",
    "preregistration": "docs/eval/synthetic-preregistration.json",
    "approval_record": "docs/eval/approvals/synthetic-approval.json",
}
LOCK_PATH = "docs/eval/locks/synthetic-only.json"


def _git(repo, *args, input=None):
    env = dict(os.environ, GIT_AUTHOR_DATE="2026-10-22T02:00:00Z",
               GIT_COMMITTER_DATE="2026-10-22T02:00:00Z", GIT_TERMINAL_PROMPT="0")
    for name in ("GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_OBJECT_DIRECTORY",
                 "GIT_ALTERNATE_OBJECT_DIRECTORIES"):
        env.pop(name, None)
    return subprocess.check_output([
        "git", "-c", "core.autocrlf=false", "-c", "core.hooksPath=DISABLED_SYNTHETIC_HOOKS",
        "-c", "user.name=Synthetic Fixture", "-c", "user.email=fixture@example.invalid",
        "-c", "commit.gpgSign=false", "-C", str(repo), *args,
    ], input=input, env=env, stderr=subprocess.PIPE).decode().strip()


def _commit(fixture):
    repo, lock = fixture["repo"], fixture["lock"]
    target = repo / LOCK_PATH
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(lock), encoding="utf-8")
    _git(repo, "add", "--", LOCK_PATH, *PATHS.values())
    _git(repo, "commit", "--allow-empty", "-m", "synthetic readiness fixture")
    return _git(repo, "rev-parse", "HEAD")


@pytest.fixture
def snapshot(tmp_path):
    repo = tmp_path / "synthetic-repository"
    repo.mkdir()
    _git(repo, "init", "--quiet")
    artifacts = {}
    for role, relative in PATHS.items():
        target = repo / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        raw = b"# invented evaluator\n" if role == "evaluation_code" else b'{"fixture":"invented"}\n'
        target.write_bytes(raw)
        artifacts[role] = {"path": relative, "sha256": hashlib.sha256(raw).hexdigest()}
    fixture = {"repo": repo, "lock": {
        "schema": guard.SCHEMA,
        "X": {"numerator": 32, "denominator": 547},
        "B": {"numerator": 542, "denominator": 1255},
        "candidate_id": "H50-90_O50-90", "approved_at": "2026-10-22T01:00:00Z",
        "artifacts": artifacts,
    }}
    fixture["sha"] = _commit(fixture)
    return fixture


def _authorization(sha):
    return {"scope": "FIRST_TEST_EVALUATION", "lock_commit_sha": sha,
            "authorized_at": "2026-10-22T03:00:00Z", "source_sha256": "b" * 64}


def _inspect(fixture, **overrides):
    kwargs = {"lock_sha": fixture["sha"], "lock_path": LOCK_PATH,
              "artifact_paths": PATHS, "authorization": _authorization(fixture["sha"])}
    kwargs.update(overrides)
    return guard.inspect_git_lock(fixture["repo"], **kwargs)


def test_git_blob_bindings_pass_but_never_authorize_execution(snapshot):
    result = _inspect(snapshot)
    assert result["git_binding_status"] == "PASS"
    assert len(result["artifact_sha256"]) == 5
    assert result["head_commit_sha"] == snapshot["sha"]
    assert datetime.fromisoformat(result["git_committer_time"]).isoformat() == "2026-10-22T02:00:00+00:00"
    assert result["X"] == {"numerator": 32, "denominator": 547}
    assert result["execution_allowed"] is False and result["test_state"] == "SEALED"
    with pytest.raises(RealEvaluationBlocked):
        reject_real_evaluation()


def test_exact_fraction_avoids_rounding_and_supports_equal_ratios():
    assert guard.exact_rate({"numerator": 64, "denominator": 1094}) == Fraction(32, 547)
    assert guard.exact_rate({"numerator": 585, "denominator": 10000}) < Fraction(32, 547)


@pytest.mark.parametrize("value", [0.0585, True, float("nan"), {},
    {"numerator": True, "denominator": 2}, {"numerator": 1, "denominator": 0},
    {"numerator": -1, "denominator": 2}, {"numerator": 3, "denominator": 2},
    {"numerator": 1, "denominator": 2, "extra": 1},
    {"numerator": 1, "denominator": 2**53},
])
def test_bad_exact_rate_is_rejected(value):
    with pytest.raises(guard.ReadinessError):
        guard.exact_rate(value)


@pytest.mark.parametrize("path", ["../sealed-input.jsonl", "ai/data/opaque.jsonl",
    "docs/eval/../hidden.json", "C:/opaque.json", "docs/eval//value.json",
    "docs/eval/value.json:stream", "docs/eval/*", "docs\\eval\\value.json"])
def test_bad_paths_rejected_before_any_git_or_filesystem_access(monkeypatch, path):
    def denied(*args, **kwargs):
        raise AssertionError("I/O must not occur")
    monkeypatch.setattr(guard, "_git", denied)
    monkeypatch.setattr(Path, "stat", denied)
    monkeypatch.setattr(Path, "open", denied)
    with pytest.raises(guard.ReadinessError):
        guard.inspect_git_lock(Path("UNUSED"), lock_sha="a" * 40, lock_path=LOCK_PATH,
            artifact_paths={**PATHS, "preregistration": path}, authorization=_authorization("a" * 40))


@pytest.mark.parametrize("bad_reference", ["missing", "blob"])
def test_missing_commit_or_noncommit_reference_rejected(snapshot, bad_reference):
    sha = "f" * 40 if bad_reference == "missing" else _git(snapshot["repo"], "rev-parse", "HEAD:" + LOCK_PATH)
    with pytest.raises(guard.ReadinessError):
        _inspect(snapshot, lock_sha=sha, authorization=_authorization(sha))


def test_wrong_authorization_sha_rejected_before_git(snapshot, monkeypatch):
    monkeypatch.setattr(guard, "_git", lambda *a: pytest.fail("no Git read expected"))
    with pytest.raises(guard.ReadinessError, match="exact LOCK SHA"):
        _inspect(snapshot, authorization=_authorization("c" * 40))


@pytest.mark.parametrize("field,value", [
    ("approved_at", "2026-10-22T02:01:00Z"),
    ("approved_at", "2026-10-22T01:00:00"),
    ("schema", "unknown"), ("candidate_id", None),
])
def test_bad_locked_metadata_rejected(snapshot, field, value):
    snapshot["lock"][field] = value
    snapshot["sha"] = _commit(snapshot)
    with pytest.raises(guard.ReadinessError):
        _inspect(snapshot)


@pytest.mark.parametrize("when", ["2026-10-22T02:00:00Z", "2026-10-22T01:59:59Z"])
def test_authorization_must_follow_commit(snapshot, when):
    auth = _authorization(snapshot["sha"])
    auth["authorized_at"] = when
    with pytest.raises(guard.ReadinessError, match="order"):
        _inspect(snapshot, authorization=auth)


def test_unrelated_history_is_rejected(snapshot):
    tree = _git(snapshot["repo"], "rev-parse", "HEAD^{tree}")
    orphan = _git(snapshot["repo"], "commit-tree", tree, input=b"invented unrelated history\n")
    with pytest.raises(guard.ReadinessError):
        _inspect(snapshot, lock_sha=orphan, authorization=_authorization(orphan))


def test_locked_digest_mismatch(snapshot):
    snapshot["lock"]["artifacts"]["evaluation_code"]["sha256"] = "0" * 64
    snapshot["sha"] = _commit(snapshot)
    with pytest.raises(guard.ReadinessError, match="digest mismatch"):
        _inspect(snapshot)


def test_head_changes_are_rejected_but_unrelated_commit_is_allowed(snapshot):
    _git(snapshot["repo"], "commit", "--allow-empty", "-m", "unrelated synthetic commit")
    assert _inspect(snapshot)["git_binding_status"] == "PASS"
    (snapshot["repo"] / PATHS["evaluation_code"]).write_bytes(b"# changed evaluator\n")
    _commit(snapshot)
    with pytest.raises(guard.ReadinessError, match="HEAD artifact"):
        _inspect(snapshot)


def test_head_lock_change_is_rejected(snapshot):
    snapshot["lock"]["approved_at"] = "2026-10-22T00:30:00Z"
    _commit(snapshot)  # LOCK bytes at HEAD now differ from the locked commit.
    with pytest.raises(guard.ReadinessError, match="HEAD LOCK"):
        _inspect(snapshot)


def test_oversized_blob_rejected_before_content_read(snapshot, monkeypatch):
    monkeypatch.setattr(guard, "MAX_BLOB_BYTES", 4)
    with pytest.raises(guard.ReadinessError, match="size limit"):
        _inspect(snapshot)


def test_symlink_blob_refused_without_following_target(snapshot):
    repo = snapshot["repo"]
    blob = _git(repo, "hash-object", "-w", "--stdin", input=b"DO_NOT_ACCESS_TARGET")
    _git(repo, "update-index", "--cacheinfo", "120000", blob, PATHS["policy_manifest"])
    _git(repo, "commit", "-m", "synthetic symlink entry")
    snapshot["sha"] = _git(repo, "rev-parse", "HEAD")
    with pytest.raises(guard.ReadinessError, match="regular Git blob"):
        _inspect(snapshot)


def test_missing_expected_role_and_duplicate_json_rejected(snapshot):
    with pytest.raises(guard.ReadinessError, match="five"):
        _inspect(snapshot, artifact_paths={})
    with pytest.raises(guard.ReadinessError):
        guard._json(b'{"X":1,"X":2}')
    with pytest.raises(guard.ReadinessError):
        guard._json(b'{"X":NaN}')


def _claim_worker(registry):
    try:
        guard.reserve_campaign_claim(Path(registry), lock_sha="a" * 40, evaluation_sha256="b" * 64)
        return True
    except guard.ClaimAlreadyReserved:
        return False


def test_concurrent_processes_allow_exactly_one_claim(tmp_path):
    registry = tmp_path / "invented-registry"
    registry.mkdir()
    with ProcessPoolExecutor(max_workers=4) as pool:
        result = list(pool.map(_claim_worker, [str(registry)] * 8))
    assert result.count(True) == 1 and result.count(False) == 7
    saved = json.loads((registry / guard.CAMPAIGN / "reserved.json").read_text())
    assert saved["lock_sha"] == "a" * 40
    # A different LOCK does not grant another opening of the same campaign.
    with pytest.raises(guard.ClaimAlreadyReserved):
        guard.reserve_campaign_claim(registry, lock_sha="c" * 40, evaluation_sha256="d" * 64)


@pytest.mark.parametrize("marker", [None, b"", b"corrupt", b'{"status":"failed"}', b'{"status":"complete"}'])
def test_empty_corrupt_failed_or_completed_claim_always_blocks_retry(tmp_path, marker):
    claim = tmp_path / guard.CAMPAIGN
    claim.mkdir()
    if marker is not None:
        (claim / "reserved.json").write_bytes(marker)
    with pytest.raises(guard.ClaimAlreadyReserved):
        guard.reserve_campaign_claim(tmp_path, lock_sha="a" * 40, evaluation_sha256="b" * 64)
    assert claim.is_dir()


def test_write_failure_preserves_reservation(tmp_path, monkeypatch):
    def crash(_fd):
        raise OSError("invented fsync failure")
    monkeypatch.setattr(guard.os, "fsync", crash)
    with pytest.raises(OSError, match="invented"):
        guard.reserve_campaign_claim(tmp_path, lock_sha="a" * 40, evaluation_sha256="b" * 64)
    assert (tmp_path / guard.CAMPAIGN).is_dir()
    with pytest.raises(guard.ClaimAlreadyReserved):
        guard.reserve_campaign_claim(tmp_path, lock_sha="a" * 40, evaluation_sha256="b" * 64)
