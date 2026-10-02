# VeriMod AI 작업 공간

**담당:** 주진호 / A / AI & Data Science

**상태: SCAFFOLD + W2 data evidence** — AI-04/AI-15 split 및 leakage 점검(PR #16), AI-20 EDA, AI-02 A-side taxonomy.
학습된 모델은 없고, inference 서비스도 없으며, 평가도 실행하지 않았습니다.

> CURRENT != TARGET · DRAFT != IMPLEMENTED · ADOPTED != TRAINED

## 목적

이 작업 공간은 VeriMod의 AI 영역을 담당합니다.

- dataset 수집 및 전처리
- native label을 향후 VeriMod taxonomy로 매핑
- 모델 학습, inference, 평가
- calibration
- model manifest 생성

AI 계층은 모델 점수만 산출합니다. 정책(`ALLOW / HUMAN_REVIEW / RESTRICT`), receipt, hashing,
Merkle batching, anchoring은 다른 영역이 담당합니다([I1 계약 초안](../docs/04-interface-contract-draft.md) 참조).
블록체인 anchor는 모델이 실제로 실행되었거나 그 점수가 정확했다는 것을 증명하지 않습니다.

## 현황

| 영역 | 현재 상태 | 위치 |
|---|---|---|
| Dataset 조사 (AI-01/AI-02) | W1 complete — 조사 evidence | [docs/research/ai-01-02-dataset-taxonomy.md](../docs/research/ai-01-02-dataset-taxonomy.md) |
| Primary 확보 / split / leakage (AI-04/AI-15) | W2 evidence; AI-15 PARTIAL (Secondary overlap 미수행) | [configs/w2_dataset.json](configs/w2_dataset.json), [scripts/prepare_w2_dataset.py](scripts/prepare_w2_dataset.py), [docs/research/w2-*](../docs/research/w2-primary-dataset-decision.md) |
| EDA (AI-20) | W2 evidence — TRAIN + VALIDATION만 대상 | [scripts/eda_w2.py](scripts/eda_w2.py), [artifacts/reports/w2_eda/](artifacts/reports/w2_eda/), [docs/research/w2-eda.md](../docs/research/w2-eda.md) |
| Supported taxonomy (AI-02) | A-side 결정, PROPOSED FOR GATE-2 | [src/verimod_ai/data/taxonomy.py](src/verimod_ai/data/taxonomy.py), [docs/research/w2-taxonomy-decision.md](../docs/research/w2-taxonomy-decision.md) |
| Dataset 코드 (package) | taxonomy 상수와 BEEP! label 매핑만 존재 | `src/verimod_ai/data/` |
| Preprocessing v1 (AI-05) | `verimod-ko-text-v1`, synthetic test로 검증 | [src/verimod_ai/data/preprocessing.py](src/verimod_ai/data/preprocessing.py), [docs/research/w2-preprocessing.md](../docs/research/w2-preprocessing.md) |
| 모델 학습 | NOT STARTED | `src/verimod_ai/training/` |
| Inference | CONTRACT DRAFT ONLY | `src/verimod_ai/inference/` |
| Evaluation skeleton (AI-06) | metrics, policy metrics, validation 전용 선택, bootstrap — synthetic test만 수행했고 실제 평가는 없음 | [src/verimod_ai/evaluation/](src/verimod_ai/evaluation/), [docs/research/w2-evaluation-skeleton.md](../docs/research/w2-evaluation-skeleton.md) |
| Notebooks | NOT STARTED | `notebooks/` |

## 결정된 항목과 미해결 항목

| 항목 | 상태 |
|---|---|
| Primary dataset | BEEP! Korean HateSpeech, revision 고정 — [AI-04 결정](../docs/research/w2-primary-dataset-decision.md) |
| Native 학습 target | `hate / offensive / none` single-label |
| Internal TEST | 1,255행, SHA-256 기록, W5까지 sealed — [split evidence](../docs/research/w2-split-leakage.md) |
| Secondary dataset | NOT ADOPTED |
| Supported taxonomy | A-side: score key `hate`, `offensive`; reference `none` (ALLOW 아님). PROPOSED FOR GATE-2; I1 consumer 정렬 대기 |
| Threshold / calibration | UNRESOLVED |
| TEST 방법론 | UNRESOLVED (Row-25) |
| 최종 모델 | UNRESOLVED (D01 방향만 존재) |

`frontend/`의 synthetic demo label `hate / profanity / sexual / spam / violence`는 목표 taxonomy가 아닙니다.

## 디렉터리 구성

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

## 설치

Python 3.10+가 필요합니다. `ai/`에서 실행합니다.

```sh
python -m venv .venv            # or: uv venv .venv --python 3.12 --seed
.venv\Scripts\activate          # Windows (POSIX: source .venv/bin/activate)
python -m pip install -e ".[dev]"
pytest
```

아직 runtime dependency는 없습니다. ML framework와 CUDA 전용 PyTorch build는
모델/toolchain 결정 이후에만 추가합니다.
