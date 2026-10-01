# VeriMod AI Workspace

**Owner:** 주진호 / A / AI & Data Science

**Status: SCAFFOLD ONLY** — plus the W2 AI-04/AI-15 dataset preparation script already merged from PR #16.
No model has been trained, no inference service exists, and no evaluation has been run.

> CURRENT != TARGET · DRAFT != IMPLEMENTED · ADOPTED != TRAINED

## Purpose

This workspace will hold the AI side of VeriMod:

- dataset ingestion and preprocessing
- native-label mapping to the future VeriMod taxonomy
- model training, inference and evaluation
- calibration
- model manifest generation

The AI layer produces model scores only. Policy (`ALLOW / HUMAN_REVIEW / RESTRICT`), receipts, hashing,
Merkle batching and anchoring are owned elsewhere (see [I1 contract draft](../docs/04-interface-contract-draft.md)).
A blockchain anchor does not prove that a model ran or that its score was correct.

## Status

| Area | Current Status | Location |
|---|---|---|
| Dataset research (AI-01/AI-02) | W1 complete — research evidence | [docs/research/ai-01-02-dataset-taxonomy.md](../docs/research/ai-01-02-dataset-taxonomy.md) |
| Primary acquisition / split / leakage (AI-04/AI-15) | W2 evidence; AI-15 PARTIAL (Secondary overlap not done) | [configs/w2_dataset.json](configs/w2_dataset.json), [scripts/prepare_w2_dataset.py](scripts/prepare_w2_dataset.py), [docs/research/w2-*](../docs/research/w2-primary-dataset-decision.md) |
| Dataset code (package) | NOT STARTED | `src/verimod_ai/data/` |
| Model training | NOT STARTED | `src/verimod_ai/training/` |
| Inference | CONTRACT DRAFT ONLY | `src/verimod_ai/inference/` |
| Evaluation | NOT STARTED | `src/verimod_ai/evaluation/` |
| Notebooks | NOT STARTED | `notebooks/` |

## Decided vs unresolved

| Item | State |
|---|---|
| Primary dataset | BEEP! Korean HateSpeech, pinned revision — [AI-04 decision](../docs/research/w2-primary-dataset-decision.md) |
| Native training target | `hate / offensive / none` single-label — acquisition target, **not** final taxonomy |
| Internal TEST | 1,255 rows, SHA-256 recorded, sealed until W5 — [split evidence](../docs/research/w2-split-leakage.md) |
| Secondary dataset | NOT ADOPTED |
| Final supported taxonomy / labels | UNRESOLVED (AI-20 / AI-02, GATE-2) |
| Thresholds / calibration | UNRESOLVED |
| TEST methodology | UNRESOLVED (Row-25) |
| Final model | UNRESOLVED (D01 direction only) |

The synthetic demo labels `hate / profanity / sexual / spam / violence` in `frontend/` are not the target taxonomy.

## Layout

```text
ai/
├── configs/        # w2_dataset.json (pinned, used) + *.example.yaml templates
├── scripts/        # standalone stdlib scripts (AI-04/AI-15 dataset preparation)
├── src/verimod_ai/ # package: data / inference / evaluation / training boundaries
├── tests/          # scaffold integrity + AI-04/AI-15 synthetic-fixture tests
├── notebooks/      # exploration only (policy in notebooks/README.md)
├── data/           # local datasets — never committed (policy in data/README.md)
└── artifacts/      # local checkpoints — never committed (policy in artifacts/README.md)
```

## Setup

Python 3.10+ is required. Run from `ai/`:

```sh
python -m venv .venv            # or: uv venv .venv --python 3.12 --seed
.venv\Scripts\activate          # Windows (POSIX: source .venv/bin/activate)
python -m pip install -e ".[dev]"
pytest
```

There are no runtime dependencies yet. ML frameworks and a CUDA-specific PyTorch build are added only
after the model/toolchain decision.
