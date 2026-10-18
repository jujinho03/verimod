# R01 소스 출처

## 실행

`AI07-BL-KLUE-RB-45126-R01`

## 실행 기준

- 브랜치: `main`.
- execution_base_head: `09d72598dcd1d6744d4c80b99af0721d4c1efedc`.
- execution_worktree_state: `DIRTY`.
- source_commit_at_execution: **null**.
- source_snapshot_commit: **이 커밋 전 문서에서는 null**; 커밋 후 기록에 자기 참조 없이 새 SHA를 저장합니다.

R01은 HEAD 09d72598dcd1d6744d4c80b99af0721d4c1efedc를 기준으로 한, 커밋되지 않은 작업 트리에서 실행했습니다.

snapshot commit은 R01 이후에 만들어지며, 절대 실행 시점 commit이라고 부르면 안 됩니다.

## 정확한 실행 소스

| 파일 | R01 기록 SHA-256 | 현재 SHA-256 | 일치 |
|---|---|---|---|
| `ai/scripts/train_w3_baseline.py` | `afdd8289c1684cd96a5ee0dc2c64df84cbaa4a43983d2aa10c8bff1738097bab` | `afdd8289c1684cd96a5ee0dc2c64df84cbaa4a43983d2aa10c8bff1738097bab` | YES |
| `ai/src/verimod_ai/training/runner.py` | `a48a78d8ab235e20c179f62181df47655604a3a16629dd2794a78e8206e9ae26` | `a48a78d8ab235e20c179f62181df47655604a3a16629dd2794a78e8206e9ae26` | YES |
| `ai/src/verimod_ai/training/dataset.py` | `70c2a59ff388e27baae0d038ffd9ab2b63571329d2d8df1a727e334a7f391414` | `70c2a59ff388e27baae0d038ffd9ab2b63571329d2d8df1a727e334a7f391414` | YES |
| `ai/src/verimod_ai/training/reproducibility.py` | `e5e084d2dedc2b21685c9f87044dd7b819bc1b9d84cfcb9a0426b2ed035362b5` | `e5e084d2dedc2b21685c9f87044dd7b819bc1b9d84cfcb9a0426b2ed035362b5` | YES |
| `ai/src/verimod_ai/training/metrics.py` | `ab4cf10b83e5d0c719b17632ce76e72820748c74143c5f977344a4e8ac45330a` | `ab4cf10b83e5d0c719b17632ce76e72820748c74143c5f977344a4e8ac45330a` | YES |
| `ai/src/verimod_ai/data/taxonomy.py` | `595e2c26403b32291722c03152d688924948f08d297aca23b004efc5f13c0077` | `595e2c26403b32291722c03152d688924948f08d297aca23b004efc5f13c0077` | YES |
| `ai/src/verimod_ai/data/label_mapping.py` | `edb914efec8a4312fa8ce79c5f6565552778fff28ac7b159976a8ca06d3d5a75` | `edb914efec8a4312fa8ce79c5f6565552778fff28ac7b159976a8ca06d3d5a75` | YES |
| `ai/src/verimod_ai/data/preprocessing.py` | `888db925ca63ae8abeb4ce47f29a8dc99d662d287e68325fbc4416289bbc9f77` | `888db925ca63ae8abeb4ce47f29a8dc99d662d287e68325fbc4416289bbc9f77` | YES |
| `ai/src/verimod_ai/evaluation/metrics.py` | `5d7c45108d4b9a900f3433d2d884d7e592ded9ae647c2eface6567f3a159ab13` | `5d7c45108d4b9a900f3433d2d884d7e592ded9ae647c2eface6567f3a159ab13` | YES |
| `ai/configs/w3_baseline.json` | `466254e11c8f9d7597aeb877fc1925d0e561dd9c120213377abcd4e52ec9587f` | `466254e11c8f9d7597aeb877fc1925d0e561dd9c120213377abcd4e52ec9587f` | YES |
| `ai/configs/w2_dataset.json` | `41b110959e83f734b5ba5f0e9f7754528286882d517fa1df1cb09e99dd20aa27` | `41b110959e83f734b5ba5f0e9f7754528286882d517fa1df1cb09e99dd20aa27` | YES |
| `ai/requirements-w3.lock.txt` | `8b61fa68c369af1d447f3d7458fccffb2cebf361b382198c2e35bc91ad12bdde` | `8b61fa68c369af1d447f3d7458fccffb2cebf361b382198c2e35bc91ad12bdde` | YES |
| `ai/pyproject.toml` | NOT RECORDED | `474bab5cb469a3b86166ebeeedd4add7cc5f38d6d6a1de0650a0efd1d6bf2c97` | NOT RECORDED; 승인된 한계 |

## 현재 snapshot 검증

- 판정 기록 시각(UTC): `2026-10-07T00:43:17.678964+00:00`.
- 과거 hash 일치: **12/12**; 불일치: **0**.
- 학습/config/hyperparameter/소스 변경 없음. 이 단계에서는 출처 metadata와 README 상태만 갱신했습니다.
- 관련 없는 기존 `output/`은 제외했고 건드리지 않았습니다.

## 문서화된 출처 한계

- ai/pyproject.toml의 과거 SHA-256은 R01 실행 시점에 기록되지 않았습니다.
- 현재 pyproject SHA를 과거 실행 SHA로 표시하면 안 됩니다(MUST NOT).
- 실제 런타임 의존성 출처는 실행 시점 requirements lock hash와 기록된 런타임 패키지/환경 증거로 따로 보존합니다.
- 과거 hash가 기록된 실행 핵심 파일 12개에서는 소스가 달라진 증거가 없었습니다.
- R01을 다시 실행하지 **않습니다**.

Command Center는 `BLOCKED_MISSING_EXECUTION_REFERENCE`를 **PASS_WITH_DOCUMENTED_LIMITATION**으로 대체했습니다. 없는 과거 byte hash는 복구할 수 없습니다. 이 항목은 현재 hash로 채우지 않고 `DOCUMENTED_PROVENANCE_LIMITATION`으로 남깁니다. 이 판정은 승인된 R01 결과를 무효화하거나 바꾸거나 재실행하지 않습니다.

## 산출물 연결

- 선정 가중치: `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model/model.safetensors`; Git에서 제외된 로컬 산출물.
- 선정 모델 SHA-256: `a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f`.
- Best step: **1101**; epoch **3**.
- Macro-F1: **0.6524599868976999**; Micro-F1/Accuracy: **0.6629482071713148**.
- 지표 / latency / epoch log / 실행 hash / 무결성: `ai/artifacts/reports/w3_baseline_run/AI07-BL-KLUE-RB-45126-R01/`.
- 예측: `ai/artifacts/results/AI07-BL-KLUE-RB-45126-R01/validation_predictions.jsonl`; 이전 감사에서 **1,255**건으로 확정; Git에서 제외.
- 이 source snapshot 단계에서는 지표 재계산이나 예측 추론을 하지 않았습니다.

## 환경 출처

- Python **3.12.14**; PyTorch **2.14.1+cpu**; Transformers **4.57.6**; CPU **Intel Core i5-1035G4**.
- `ai/artifacts/reports/w3_baseline/environment.json`에 런타임 패키지 목록을 보존합니다.
- `ai/requirements-w3.lock.txt`는 실행 시점 SHA-256이 있으며 현재와 정확히 일치합니다.

## Git byte 보존

- 실제 설정 `core.autocrlf=true`는 저장되는 Git blob에서 CRLF를 LF로 정규화할 수 있습니다.
- `source_snapshot.json`은 기록된 파일 12개 모두에 대해 실행 SHA-256, 원래 줄바꿈, 정규화 blob의 기대 SHA-256, 파일별 복원 규칙을 기록합니다.
- 커밋 전에는 staged/HEAD blob bytes를 정규화 byte hash와 대조합니다. 커밋 후에는 각 파일을 기록된 LF/CRLF bytes로 복원해 메모리에서 원래 실행 hash를 검증합니다.
- 작업 소스 bytes와 과거 hash는 다시 쓰지 않습니다. Git object ID, 정규화 byte SHA-256, 실행 raw-byte SHA-256은 서로 구별됩니다.

## 커밋 범위와 개인정보

- 승인된 W3 source/config/lock/test, README 갱신, 작은 metadata, 사람이 읽는 증거를 포함합니다.
- 원래 실행 보고서는 바뀌지 않습니다. 이전 감사와 그때의 blocked 판정은 `source_provenance_audit.json`에 과거 관측으로 명시 보존합니다.
- 이전 44개 파일 감사에서 실제 개인 경로와 자격증명 패턴은 없었습니다. 현재 후보와 staged 내용도 커밋 전에 다시 검사합니다.
- 공개 GitHub 소유자 식별자와 합성 fixture는 원시 데이터셋 export나 비밀 자격증명이 아닙니다.
- `output/`, `.venv/`, 원시 데이터, TEST 산출물, 가중치/checkpoint, 예측, 로컬 학습 로그, 자격증명은 제외합니다.
- 중복된 원래 runner 결과 보고서와 중간 `progress.json`은 제외하며, 로컬 파일은 보존합니다.

## 테스트

- 새 안전 AI 테스트 보고서: `ai/artifacts/reports/w3_baseline_run/AI07-BL-KLUE-RB-45126-R01/source_snapshot_tests.json`.
- **84 passed, 16 subtests passed; failures 0**.
- 테스트 harness가 실제 데이터셋 파일시스템 접근을 막으며, 시도는 **0**회입니다.
- 테스트는 임시 합성 fixture/config/toy 배열을 씁니다. 학습된 모델 추론이나 학습 재실행은 없었습니다.

## 커밋 후 출처 규칙

1. `execution_base_head`는 실행 시점의 기준 Git HEAD를 가리킵니다.
2. 실행 소스 hash는 R01에 쓰인 기록된 raw bytes를 가리킵니다.
3. `source_snapshot_commit`은 이후 검증된 source snapshot을 가리킵니다.

새 commit SHA는 커밋 후 `ai/artifacts/results/AI07-BL-KLUE-RB-45126-R01/source_snapshot_post_commit.json`(Git에서 제외된 로컬 기록)에 기록하며, 다음 AI-21 등록부에 반영할 수 있습니다. 자기 SHA 삽입, amend 반복, 실행 시점 commit 주장은 쓰지 않습니다.

## 경계

- TEST NOT ACCESSED; SECONDARY NOT ACCESSED.
- R01 NOT RERUN; 모델 추론 없음; 모델/config/hyperparameter/지표 변경 없음.
- threshold/정책/calibration/새 모델 작업 없음.
- AI-21, AI-08, AI-16은 이 단계에서 완료로 표시하지 않습니다.
- 이 source snapshot 커밋은 승인됐고, push는 승인되지 않았습니다.

## 상태

**PASS_WITH_DOCUMENTED_LIMITATION**

`SOURCE_PROVENANCE_VERIFIED_WITH_LIMITATION` — 기록된 실행 핵심 hash 12개가 일치하며, pyproject 과거 byte hash는 NOT_RECORDED로 남습니다.

source snapshot 커밋 다음 단일 단계: Baseline 패키징 및 인계(AI-21 실험 등록부 + AI-08 실제 Model Manifest + AI-16 재현성 / 실제 모델 fixture).
