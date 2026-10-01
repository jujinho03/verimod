"""A-side supported taxonomy (AI-02, W2) — PROPOSED FOR GATE-2.

Decision record: docs/research/w2-taxonomy-decision.md
This is an A-side decision. It is not a team semantic freeze (FRZ-01) and does
not change any frontend/backend schema; downstream I1 consumer alignment is a
separate dependency.

Separated on purpose:
- native target: the classes the model is trained on (BEEP! hate axis)
- score keys: the harmful classes exposed as scores_ppm keys
- reference class: the native negative class, never an action
- unsupported dimensions: not represented by any score key
"""

from __future__ import annotations

STATUS = "PROPOSED_FOR_GATE_2"
TAXONOMY_ID = "verimod-ko-beep-hate"
TAXONOMY_VERSION = "1"

PRIMARY_DATASET = "BEEP! Korean HateSpeech"
NATIVE_TARGET = ("hate", "offensive", "none")  # single-label, 3-class
SCORE_KEYS = ("hate", "offensive")  # harmful classes exposed to the policy layer
REFERENCE_CLASS = "none"  # native negative; not a score key and not ALLOW

# No native supervision in the Primary dataset, or out of scope.
UNSUPPORTED = ("profanity", "sexual", "spam", "violence", "misinformation")

# Policy actions belong to the policy layer; no taxonomy value may equal one.
POLICY_ACTIONS = ("ALLOW", "HUMAN_REVIEW", "RESTRICT")
