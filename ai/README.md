# VeriMod AI 작업 공간

**담당:** 주진호 / A / AI & Data Science

**상태: W2 data evidence + W3 AI-07 첫 공식 baseline 완료** — AI-04/AI-15 split 및 leakage 점검(PR #16), AI-20 EDA, AI-02 A-side taxonomy.
W3 CPU 실행 spec과 dependency lock은 [baseline evidence](../docs/evidence/w3-a-baseline-spec.md)에 기록했습니다.
공식 `AI07-BL-KLUE-RB-45126-R01`의 3-epoch 학습과 full VALIDATION 평가는 [run evidence](../docs/evidence/w3-a-ai07-baseline-run.md)에 기록했습니다. TEST는 미열람 상태이며 inference 서비스는 아직 없습니다.
R01은 dirty tree에서 실행됐습니다. 실행 source 12개 hash의 일치와 `pyproject.toml` historical hash 누락의 승인된 limitation은 [source provenance](../docs/evidence/w3-a-r01-source-provenance.md)에 기록했습니다. source snapshot commit은 실행 이후의 기록이며 execution-time commit이 아닙니다.
Training runner의 tiny **SMOKE_ONLY** 학습·평가 경로 검증은 [smoke evidence](../docs/evidence/w3-a-runner-smoke.md)에 별도로 기록합니다.

> CURRENT != TARGET · DRAFT != IMPLEMENTED · ADOPTED != TRAINED

W3 A packaging은 registry·actual manifest·synthetic real-model fixture까지 완료했습니다.
[최종 evidence](../docs/evidence/w3-a-final.md)와 [재현·handoff](../docs/evidence/w3-a-reproducibility-handoff.md)를 참조하세요.
Shared Receipt schema 정렬은 남아 있어 `W3_A_COMPLETE_WITH_INTEGRATION_BLOCKER`입니다.
다른 PC 검증은 미실행이며, 최종 publication 상태는 commit/push 검증 기록을 따릅니다.

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
| 모델 학습 | 공식 R01 3-epoch baseline 완료; best VALIDATION Macro-F1 checkpoint 보존 | `src/verimod_ai/training/`, [run evidence](../docs/evidence/w3-a-ai07-baseline-run.md) |
| Inference | CONTRACT DRAFT ONLY | `src/verimod_ai/inference/` |
| Evaluation skeleton (AI-06) | 기존 skeleton + 실제 3-class VALIDATION metrics/OVR; policy/threshold/bootstrap 평가는 미실행 | [src/verimod_ai/evaluation/](src/verimod_ai/evaluation/), [run evidence](../docs/evidence/w3-a-ai07-baseline-run.md) |
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

W3 검증 환경은 Windows x64 / Python 3.12.14 / CPU입니다. `ai/`에서 실행합니다.

```sh
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements-w3.lock.txt
python -m pip install -e . --no-deps
python -m pip install pytest==9.1.1
pytest
```

전체 재현 순서와 TRAIN/VALIDATION tokenizer 분석 명령은 baseline evidence를 참조하세요.
CUDA 환경은 이번 CPU lock으로 검증하지 않았습니다.
