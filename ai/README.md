# VeriMod AI 작업 공간 — 한국어 현황

담당: A / 주진호 · 데이터·모델·추론·평가. 최신 정리일: 2026-10-17.

**main의 AI 실행 코드는 W3 통합 기준입니다.** W4 실제 FastAPI/Validation/E2E 구현은 A의 고정 [3a8993b 소스](https://github.com/jujinho03/verimod/tree/3a8993bfaf36642d2a67d0a147da9086008bd912/ai)에 있습니다. 이번 문서 반영으로 W4 실행 코드가 main에 병합된 것은 아닙니다.

## 현재 확인한 성과

| 항목 | 실행·근거 |
| --- | --- |
| W2 데이터·전처리 | BEEP! split/leakage·EDA, verimod-ko-text-v1. TRAIN/VALIDATION 범위 |
| W3 AI-07 | R01 3-epoch CPU baseline·공식 VALIDATION·선정 checkpoint |
| W3 AI-08/16 | 실제 Model Manifest·원본 출력 fixture·재현 인계 |
| W4 AI-09 | 실제 selected R01 Python /infer와 I1·실패 계약 검증 PASS |
| W4 AI-21 | VALIDATION 1,255건, Macro-F1 0.6524599868976999, Accuracy 0.6629482071713148. W3와 동일 |
| W4 정책·AI-10 | 25개 후보, parity 21/21, 실제 정상 2건/실패 17건 PASS |
| 후속 발급·Freeze | 실제 Receipt 2건, Epoch 1/count 2/version 1. 온체인은 아직 미실행 |

[W4 한국어 실행 해설](../docs/evidence/w4-a-actual-frozen-epoch.md) · [팀 현황](../docs/progress/W4.md) · [공개 JSON](../docs/handoffs/w4-frozen-epoch-public/20261017-r01/README.md).

## 모델과 책임 경계

- 선정 run: `AI07-BL-KLUE-RB-45126-R01`, 모델: `klue/roberta-base`.
- Native 학습 target: hate/offensive/none. 외부 score key: hate/offensive.
- none은 ALLOW와 동의어가 아닙니다. AI는 정책/action을 생성하지 않습니다.
- 실제 점수는 UNCALIBRATED이며 정책은 Node 계층의 별도 책임입니다.
- 전처리 HEAD 500 Unicode codepoints, tokenizer right truncation/max_length 128, native softmax/PPM 반올림 한 번.
- 실제 정책 후보는 W4_PROVISIONAL_E2E_ONLY/team_approved=false. X/B·운영 승인·LOCK은 없습니다.
- 가중치·원문·전체 predictions·private DB는 로컬 비공개입니다. clone만으로 실제 모델 서비스가 구성되지 않습니다.
- TEST는 SEALED입니다. 이번 문서 작업에서는 데이터/모델을 열거나 재학습하지 않았습니다.

## W3 재현 원본 보존

[Baseline 사양](../docs/evidence/w3-a-baseline-spec.md), [공식 run](../docs/evidence/w3-a-ai07-baseline-run.md), [source provenance](../docs/evidence/w3-a-r01-source-provenance.md), [최종 증거](../docs/evidence/w3-a-final.md), [재현 인계](../docs/evidence/w3-a-reproducibility-handoff.md)를 보존합니다.

R01은 당시 dirty tree에서 실행됐으며 실행 source 12개 hash와 pyproject historical hash 누락의 승인된 한계를 구별합니다. 이후 source snapshot commit을 execution-time commit으로 바꾸지 않습니다. W3 frozen config/lock/Registry/Manifest/fixture도 변경하지 않습니다.

W3 검증 환경은 Windows x64/Python 3.12.14/CPU입니다. 다음은 W3 환경 설치 안내이며 W4 서비스 의존성과 혼합하지 않습니다. `ai/`에서 실행합니다.

```sh
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements-w3.lock.txt
python -m pip install -e . --no-deps
python -m pip install pytest==9.1.1
pytest
```

CUDA/다른 PC 재현과 새 회귀 실행은 이 문서 갱신에서 수행하지 않았습니다. main의 기존 코드와 W4 A 브랜치 검사를 구별하세요.

## 데이터·분석 자료

- [Primary 결정](../docs/research/w2-primary-dataset-decision.md), [split/leakage](../docs/research/w2-split-leakage.md)
- [EDA](../docs/research/w2-eda.md), [taxonomy](../docs/research/w2-taxonomy-decision.md), [전처리](../docs/research/w2-preprocessing.md)
- [실제 정책 후보와 과거 비교 원본](https://github.com/jujinho03/verimod/blob/3a8993bfaf36642d2a67d0a147da9086008bd912/docs/evidence/w4-a-validation-policy.md)

Secondary·calibration·정책 LOCK·W5 이후 작업을 완료한 것으로 표시하지 않습니다. Blockchain은 실제 모델 실행이나 AI 정확성을 증명하지 않습니다.
