"""I1 boundary types: AI adapter -> policy / receipt issuance.

Mirrors docs/04-interface-contract-draft.md section C01 (AI-03 DRAFT) and the
current demo shape in frontend/src/domain/types.ts. It adds no new fields.
C01 is DRAFT, not a frozen schema; requiredness and exact keys may change at FRZ-01.

Policy output (action, reason_codes, triggered_rule_ids, policy_manifest_hash)
belongs to the policy layer and is intentionally absent here.
"""

from __future__ import annotations

from typing import Literal, Protocol, TypedDict

# D07 (ADOPTED): each score is an integer 0..1_000_000. A probability-like
# float p is converted once at the Python inference boundary with
# floor(p * 1_000_000 + 0.5); downstream code never re-rounds.
# TODO: implement the conversion together with its boundary vectors.
PPM_MAX = 1_000_000

ScoreSemantics = Literal["CALIBRATED", "UNCALIBRATED"]
InputStatus = Literal["FULL", "TRUNCATED"]

# Error code candidates from C01. Only INFERENCE_UNAVAILABLE has a working
# assumption (D24: 503, no DECISION, no fake ALLOW); the rest are PROPOSED.
ErrorCode = Literal[
    "EMPTY_INPUT",
    "INVALID_INPUT",
    "UNSUPPORTED_TAXONOMY",
    "INVALID_MODEL_OUTPUT",
    "INFERENCE_TIMEOUT",
    "INFERENCE_UNAVAILABLE",
]


class EvidenceSpan(TypedDict):
    """Original-text code point range [start, end). D03: evidence is SHOULD."""

    start: int
    end: int
    label_id: str
    method_id: str
    method_version: str


class InferenceOutput(TypedDict):
    output_version: str
    inference_id: str
    content_commitment: str
    model_manifest_hash: str
    taxonomy_id: str
    taxonomy_version: str
    # Keys = taxonomy label ids. The exact required-key set is UNRESOLVED.
    scores_ppm: dict[str, int]
    score_semantics: ScoreSemantics
    input_status: InputStatus
    evidence: list[EvidenceSpan]
    inferred_at: str


class InferenceError(TypedDict):
    code: ErrorCode
    retryable: bool


class InferenceSuccess(TypedDict):
    ok: Literal[True]
    request_id: str
    inference: InferenceOutput


class InferenceFailure(TypedDict):
    ok: Literal[False]
    request_id: str
    error: InferenceError


class InferenceAdapter(Protocol):
    """Shape a future model adapter will satisfy.

    TODO: the request shape is not specified in C01 beyond the issuer passing
    the content commitment; confirm with the I1 consumer before FRZ-01.
    """

    def infer(self, text: str, *, content_commitment: str) -> InferenceSuccess | InferenceFailure: ...
