"""Data-free AI-12 readiness primitives; never authorize or run evaluation.

The proposed snapshot schema is not an adopted LOCK/Manifest contract. Only
explicit public metadata/code Git blobs are read. No working-tree data loader,
model loader, policy writer or execution CLI is provided.
"""
from __future__ import annotations

from datetime import datetime
from fractions import Fraction
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess


SCHEMA = "verimod.w5.lock-preflight.v1"
CAMPAIGN = "verimod-r01-first-evaluation-v1"
ROLES = frozenset({"model_manifest", "policy_manifest", "evaluation_code",
                   "preregistration", "approval_record"})
MAX_BLOB_BYTES = 2_000_000


class ReadinessError(ValueError):
    """A metadata or Git binding is missing/invalid; error excludes input bytes."""


class ClaimAlreadyReserved(RuntimeError):
    """A prior attempt, including an incomplete attempt, prevents retry."""


def exact_rate(value: object) -> Fraction:
    if not isinstance(value, dict) or set(value) != {"numerator", "denominator"}:
        raise ReadinessError("exact integer fraction required")
    n, d = value["numerator"], value["denominator"]
    if type(n) is not int or type(d) is not int or d <= 0 or not 0 <= n <= d:
        raise ReadinessError("rate must be in [0, 1] with positive integer denominator")
    if n > 2**53 - 1 or d > 2**53 - 1:
        raise ReadinessError("fraction integers must fit the canonical safe-integer profile")
    return Fraction(n, d)


def _digest(value: object, size: int) -> str:
    if not isinstance(value, str) or not re.fullmatch(r"[0-9a-f]{" + str(size) + "}", value):
        raise ReadinessError("invalid digest format")
    return value


def _time(value: object) -> datetime:
    try:
        if not isinstance(value, str):
            raise ValueError
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None or parsed.utcoffset() is None:
            raise ValueError
        return parsed
    except ValueError:
        raise ReadinessError("timezone-aware timestamp required") from None


def _metadata_path(path: object, role: str) -> str:
    # ASCII-only explicit paths: no glob, escape, colon, dot segment or Git magic.
    if not isinstance(path, str) or not re.fullmatch(r"[A-Za-z0-9_./-]+", path):
        raise ReadinessError("explicit public metadata/code path required")
    if any(part in ("", ".", "..") for part in path.split("/")):
        raise ReadinessError("path escape refused")
    patterns = {
        "lock": r"docs/eval/locks/[A-Za-z0-9_-]+\.json",
        "model_manifest": r"ai/artifacts/manifests/w5_model/[A-Za-z0-9_/-]+\.json",
        "policy_manifest": r"ai/artifacts/manifests/w5_policy/[A-Za-z0-9_/-]+\.json",
        "evaluation_code": r"ai/(scripts|src/verimod_ai/evaluation)/[A-Za-z0-9_/]+\.py",
        "preregistration": r"docs/eval/[A-Za-z0-9_-]+\.json",
        "approval_record": r"docs/eval/approvals/[A-Za-z0-9_-]+\.json",
    }
    if role not in patterns or not re.fullmatch(patterns[role], path):
        raise ReadinessError("path outside role-specific public metadata allowlist")
    return path


def _git(repo: Path, *args: str) -> bytes:
    env = dict(os.environ, GIT_NO_LAZY_FETCH="1", GIT_TERMINAL_PROMPT="0")
    # Prevent inherited repository redirection and replacement objects. No fetch.
    for name in ("GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_OBJECT_DIRECTORY",
                 "GIT_ALTERNATE_OBJECT_DIRECTORIES"):
        env.pop(name, None)
    result = subprocess.run(["git", "--no-replace-objects", "-C", str(repo), *args],
                            capture_output=True, env=env, timeout=15, check=False)
    if result.returncode:
        raise ReadinessError("Git evidence unavailable or inconsistent")
    return result.stdout


def _blob(repo: Path, commit: str, path: str) -> bytes:
    # ls-tree is restricted to one prevalidated path, never a tree inventory.
    entry = _git(repo, "ls-tree", "-z", commit, "--", path).split(b"\0")
    if len(entry) != 2 or entry[1] != b"":
        raise ReadinessError("exact metadata blob missing")
    try:
        meta, name = entry[0].split(b"\t")
        mode, kind, oid = meta.split(b" ")
    except ValueError:
        raise ReadinessError("invalid Git tree entry") from None
    if name != path.encode("ascii") or mode not in (b"100644", b"100755") or kind != b"blob":
        raise ReadinessError("regular Git blob required; symlink/submodule refused")
    object_id = _digest(oid.decode("ascii"), 40)
    size = int(_git(repo, "cat-file", "-s", object_id))
    if not 0 <= size <= MAX_BLOB_BYTES:
        raise ReadinessError("metadata blob size limit exceeded")
    data = _git(repo, "cat-file", "blob", object_id)
    if len(data) != size:
        raise ReadinessError("metadata blob size changed")
    return data


def _json(raw: bytes) -> dict:
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ReadinessError("duplicate metadata key")
            result[key] = value
        return result
    try:
        value = json.loads(raw, object_pairs_hook=unique,
                           parse_constant=lambda _: (_ for _ in ()).throw(ReadinessError("nonfinite metadata")))
    except (ValueError, UnicodeError):
        raise ReadinessError("invalid JSON metadata") from None
    if not isinstance(value, dict):
        raise ReadinessError("metadata object required")
    return value


def inspect_git_lock(repo: Path, *, lock_sha: str, lock_path: str,
                     artifact_paths: dict[str, str], authorization: dict) -> dict:
    """Check exact Git bindings, not approval authenticity or runtime readiness.

    `artifact_paths` is a caller-supplied expected public metadata allowlist,
    not paths accepted from an untrusted LOCK file. No checkout is performed.
    Complete structural evidence STILL returns execution_allowed=False.
    """
    _digest(lock_sha, 40)
    _metadata_path(lock_path, "lock")
    if not isinstance(artifact_paths, dict) or set(artifact_paths) != ROLES:
        raise ReadinessError("all five expected artifact roles required")
    for role, path in artifact_paths.items():
        _metadata_path(path, role)
    if len(set(artifact_paths.values())) != len(ROLES):
        raise ReadinessError("distinct artifact paths required")
    if not isinstance(authorization, dict) or authorization.get("scope") != "FIRST_TEST_EVALUATION":
        raise ReadinessError("separate first-evaluation authorization metadata required")
    if authorization.get("lock_commit_sha") != lock_sha:
        raise ReadinessError("authorization must bind exact LOCK SHA")
    _digest(authorization.get("source_sha256"), 64)
    authorized_at = _time(authorization.get("authorized_at"))
    if _git(repo, "cat-file", "-t", lock_sha).strip() != b"commit":
        raise ReadinessError("LOCK reference must be a commit")
    head = _digest(_git(repo, "rev-parse", "HEAD").decode().strip(), 40)
    _git(repo, "merge-base", "--is-ancestor", lock_sha, head)
    committed_at = _time(_git(repo, "show", "-s", "--format=%cI", lock_sha).decode().strip())
    raw_lock = _blob(repo, lock_sha, lock_path)
    lock = _json(raw_lock)
    if set(lock) != {"schema", "X", "B", "candidate_id", "approved_at", "artifacts"} or lock["schema"] != SCHEMA:
        raise ReadinessError("unsupported proposed preflight schema")
    x, b = exact_rate(lock["X"]), exact_rate(lock["B"])
    if not isinstance(lock["candidate_id"], str) or not re.fullmatch(r"H\d+-\d+_O\d+-\d+", lock["candidate_id"]):
        raise ReadinessError("candidate identity required")
    if not _time(lock["approved_at"]) <= committed_at < authorized_at:
        raise ReadinessError("approval <= Git commit < separate authorization order required")
    if not isinstance(lock["artifacts"], dict) or set(lock["artifacts"]) != ROLES:
        raise ReadinessError("all locked artifacts required")
    hashes = {}
    for role, path in artifact_paths.items():
        reference = lock["artifacts"][role]
        if not isinstance(reference, dict) or set(reference) != {"path", "sha256"} or reference["path"] != path:
            raise ReadinessError("locked artifact differs from expected role/path")
        expected = _digest(reference["sha256"], 64)
        raw = _blob(repo, lock_sha, path)
        if hashlib.sha256(raw).hexdigest() != expected:
            raise ReadinessError("locked artifact digest mismatch")
        if _blob(repo, head, path) != raw:
            raise ReadinessError("HEAD artifact differs from locked bytes")
        hashes[role] = expected
    if _blob(repo, head, lock_path) != raw_lock:
        raise ReadinessError("HEAD LOCK differs from locked bytes")
    return {
        "git_binding_status": "PASS", "schema": SCHEMA,
        "lock_commit_sha": lock_sha, "head_commit_sha": head,
        "git_committer_time": committed_at.isoformat(),
        "lock_blob_sha256": hashlib.sha256(raw_lock).hexdigest(),
        "artifact_sha256": hashes, "candidate_id": lock["candidate_id"],
        "X": {"numerator": x.numerator, "denominator": x.denominator},
        "B": {"numerator": b.numerator, "denominator": b.denominator},
        "execution_allowed": False, "execution_status": "BLOCKED", "test_state": "SEALED",
        "unverified_requirements": [
            "user approval authenticity; Git timestamps and source digest strings are not authentication",
            "adopted A/F Manifest and LOCK schemas, semantic approval-to-policy binding, parity and F regression",
            "actual weights/tokenizer/environment and complete transitive evaluator dependencies",
            "group/population/latency protocol completeness and actual runtime byte equality",
            "trusted single campaign registry and separately authorized real execution integration",
        ],
    }


def reserve_campaign_claim(registry: Path, *, lock_sha: str, evaluation_sha256: str) -> Path:
    """Preparation primitive, exercised ONLY in disposable synthetic fixtures.

    A future authorized integration must provide one trusted, stable registry
    outside replaceable checkouts. No TTL, deletion, force or recovery path.
    Directory reservation survives metadata-write failure and ordinary process
    crashes; power-loss/filesystem guarantees are not established by unit tests.
    """
    _digest(lock_sha, 40)
    _digest(evaluation_sha256, 64)
    if registry.is_symlink() or not registry.is_dir():
        raise ReadinessError("existing trusted registry directory required")
    claim = registry / CAMPAIGN  # deliberately independent of LOCK SHA/run UUID
    try:
        claim.mkdir(exist_ok=False)
    except FileExistsError:
        raise ClaimAlreadyReserved("campaign already reserved; explicit recovery review required") from None
    # Never remove the reservation if any operation below fails.
    with (claim / "reserved.json").open("x", encoding="utf-8", newline="\n") as stream:
        json.dump({"campaign": CAMPAIGN, "lock_sha": lock_sha,
                   "evaluation_sha256": evaluation_sha256,
                   "usage": "PREPARATION_PRIMITIVE_NOT_EXECUTION_AUTHORIZATION"}, stream, sort_keys=True)
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())
    return claim
