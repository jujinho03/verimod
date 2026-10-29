# VeriMod AI 작업 공간 — 한국어 현황

담당: A / 주진호 · 데이터·모델·추론·평가. 상태 대조 기준: main `f7c84f27ff964d114cacc8c5c181b4df8b9f766b` (W6 통합 후).

**2026-10-18부터 W4 실제 FastAPI 추론·Validation·E2E 코드가 main에 들어 있습니다.** 실제 실행 증거의 기준 커밋은 A의 고정 [3a8993b 소스](https://github.com/jujinho03/verimod/tree/3a8993bfaf36642d2a67d0a147da9086008bd912/ai)입니다. 모델 가중치와 데이터는 저장소에 없습니다.

## 현재 확인한 성과

| 항목 | 실행·근거 |
| --- | --- |
| W2 데이터·전처리 | BEEP! split/leakage·EDA, verimod-ko-text-v1. TRAIN/VALIDATION 범위 |
| W3 AI-07 | R01 3-epoch CPU baseline·공식 VALIDATION·선정 checkpoint |
| W3 AI-08/16 | 실제 Model Manifest·원본 출력 fixture·재현 인계 |
| W4 AI-09 | 실제 selected R01 Python /infer와 I1·실패 계약 검증 PASS |
| W4 AI-21 | VALIDATION 1,255건, Macro-F1 0.6524599868976999, Accuracy 0.6629482071713148. W3와 동일 |
| W4 정책·AI-10 | 25개 후보, parity 21/21, 실제 정상 2건/실패 17건 PASS |
| W4 발급·앵커 | 실제 Receipt 2건, Epoch 1/count 2/version 1을 Base Sepolia에 등록. [공개 앵커 증거](../docs/handoffs/w4-anchored-epoch-public/20261020-r01/README.md) |

[W4 한국어 실행 해설](../docs/evidence/w4-a-actual-frozen-epoch.md) · [팀 현황](../docs/progress/W4.md) · [공개 JSON](../docs/handoffs/w4-frozen-epoch-public/20261017-r01/README.md).

## W6 통합과 남은 검증

F [PR #31](https://github.com/jujinho03/verimod/pull/31), T [PR #32](https://github.com/jujinho03/verimod/pull/32), A [PR #33](https://github.com/jujinho03/verimod/pull/33)은 독립 리뷰 후 main에 병합됐고 최종 main CI의 frontend·backend·contracts가 성공했습니다. Git 통합 성공은 팀 전체 Engineering Exit 승인과 다릅니다.

- **AI-19:** 2026-10-27 기존 물리 오프라인 실측 1회에서 로컬 R01 `/healthz`와 `/infer`가 성공했습니다. [실행 판정과 범위](../docs/evidence/w6-a-ai19-offline/ai19-final-assessment.md) · [결과 JSON](../docs/evidence/w6-a-ai19-offline/physical-offline-result.json). 새 학습이나 이번 재실행은 없었습니다.
- **실행 출처 한계:** 결과 JSON의 `git.tracked_changes`에는 당시 `docs/eval/w5-model-card-limitations.md` 수정 1건이 기록돼 있으나 판정 문서 첫머리는 전체 추적 변경 0건이라고 적어 서로 다릅니다. 당시 결과에 미친 영향은 미확인입니다. W4 범위 변경 여부는 별도 검사로 기록됐습니다. 기존 기록은 그대로 보존합니다.
- 서버 원본 로그는 공개 Git에 없으므로 이번 감사는 결과 JSON과 기존 판정 기록을 대조한 것입니다. 당시 서버 로그를 독립적으로 확인하거나 모델을 재실행한 것은 아닙니다.
- AI 추론과 F의 authoritative Receipt 발급·고정은 별도 경로입니다. 새 Receipt 발급 및 W4 앵커 포함을 AI-19만으로 주장하지 않으며, 신규 앵커 전 Receipt는 PENDING입니다.
- 가중치·config·Manifest의 고정 hash는 서비스가 검사합니다. tokenizer revision 고정과 로컬 로딩은 구현돼 있으나, AI-19의 tokenizer 파일 hash 수집은 증거일 뿐 파일 hash Runtime Binding 구현이나 LOCK이 아닙니다.
- [Data Card](../docs/data-card.md)와 [Model Card](../docs/model-card.md)는 현재 공개 산출물입니다. 모델 정확도와 정책 안전성은 별도의 평가 문제이며 블록체인 무결성 증명이 정확성을 보증하지 않습니다.

| Gate | 통합 후 근거별 상태 | 남은 조건 |
| --- | --- | --- |
| E1 | PASS 권고 | W4 원본 불변과 기존 동일 Receipt 재검증 근거. 팀장 최종 판정 필요 |
| E2 | PARTIAL | 신규 rehash 변형 `INVALID_PROOF` 실측 또는 대체 범위 승인 |
| E3 | PARTIAL | 공개 RPC 반복 안정성·모바일 복구 및 원본 실행 증거 확인 |
| E4 | Git 통합 PASS 후보 | 세 PR 병합과 main CI 성공; 팀장 최종 판정 필요 |
| E5 | PARTIAL | 보안 부정 검증 미완료 항목과 Windows SKIP 해소 또는 범위 결정 |
| E6 | PARTIAL | BASE 10회 NOT_MET, 실제 Hardhat LOCAL NOT_VERIFIED, RECORDED 미준비 |
| E7 | PARTIAL | 본 README 정정 후에도 DOC-09 원문 대조 및 OPS-04 기록 확인 필요 |
| E8 | PARTIAL | 480초 공동 리허설과 검증된 녹화본 미확인 |

[병합 전 E1~E8 역사적 판정](../docs/evidence/w6-a-closeout/e1-e8-matrix.md)과 [W7 시연 준비](../docs/evidence/w6-a-closeout/w7-demo-readiness.md)는 당시 상태를 보존합니다.

## 모델과 책임 경계

- 선정 run: `AI07-BL-KLUE-RB-45126-R01`, 모델: `klue/roberta-base`.
- Native 학습 target: hate/offensive/none. 외부 score key: hate/offensive.
- none은 ALLOW와 동의어가 아닙니다. AI는 정책/action을 생성하지 않습니다.
- 실제 점수는 UNCALIBRATED이며 정책은 Node 계층의 별도 책임입니다.
- 전처리 HEAD 500 Unicode codepoints, tokenizer right truncation/max_length 128, native softmax/PPM 반올림 한 번.
- W4의 실제 시연 정책은 `W4_PROVISIONAL_E2E_ONLY` / `team_approved=false`입니다. W5 연구·시연 S1은 별도의 추천안이며 `PENDING_APPROVAL`입니다. S1 X/B·후보 확정, A/F 계약, 운영 승인 및 LOCK은 없습니다.
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
