# VeriMod AI Workspace

**Owner:** 주진호 / A / AI & Data Science

**Status: SCAFFOLD + W2 data evidence** — AI-04/AI-15 split and leakage (PR #16), AI-20 EDA, AI-02 A-side taxonomy.
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
| EDA (AI-20) | W2 evidence — TRAIN + VALIDATION only | [scripts/eda_w2.py](scripts/eda_w2.py), [artifacts/reports/w2_eda/](artifacts/reports/w2_eda/), [docs/research/w2-eda.md](../docs/research/w2-eda.md) |
| Supported taxonomy (AI-02) | A-side decision, PROPOSED FOR GATE-2 | [src/verimod_ai/data/taxonomy.py](src/verimod_ai/data/taxonomy.py), [docs/research/w2-taxonomy-decision.md](../docs/research/w2-taxonomy-decision.md) |
| Dataset code (package) | Taxonomy constants and BEEP! label mapping only | `src/verimod_ai/data/` |
| Model training | NOT STARTED | `src/verimod_ai/training/` |
| Inference | CONTRACT DRAFT ONLY | `src/verimod_ai/inference/` |
| Evaluation | NOT STARTED | `src/verimod_ai/evaluation/` |
| Notebooks | NOT STARTED | `notebooks/` |

## Decided vs unresolved

| Item | State |
|---|---|
| Primary dataset | BEEP! Korean HateSpeech, pinned revision — [AI-04 decision](../docs/research/w2-primary-dataset-decision.md) |
| Native training target | `hate / offensive / none` single-label |
| Internal TEST | 1,255 rows, SHA-256 recorded, sealed until W5 — [split evidence](../docs/research/w2-split-leakage.md) |
| Secondary dataset | NOT ADOPTED |
| Supported taxonomy | A-side: score keys `hate`, `offensive`; reference `none` (not ALLOW). PROPOSED FOR GATE-2; I1 consumer alignment pending |
| Thresholds / calibration | UNRESOLVED |
| TEST methodology | UNRESOLVED (Row-25) |
| Final model | UNRESOLVED (D01 direction only) |

The synthetic demo labels `hate / profanity / sexual / spam / violence` in `frontend/` are not the target taxonomy.

## Layout

```text
ai/
├── configs/        # w2_dataset.json (pinned, used) + *.example.yaml templates
├── scripts/        # standalone stdlib scripts (AI-04/AI-15 preparation, AI-20 EDA)
├── src/verimod_ai/ # package: data / inference / evaluation / training boundaries
├── tests/          # scaffold, AI-04/AI-15, AI-20 EDA and AI-02 taxonomy tests (synthetic fixtures)
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
