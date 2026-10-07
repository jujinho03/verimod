# configs

| 파일 | 종류 |
|---|---|
| `w2_dataset.json` | **고정(pinned), 사용 중.** `scripts/prepare_w2_dataset.py`(AI-04/AI-15)가 읽습니다. 새 evidence 기록 없이 수정하지 마세요. |
| `w3_baseline.json` | **SPEC_FROZEN.** freeze 당시 `TRAINING_NOT_STARTED` snapshot을 그대로 보존합니다. 동일 config로 공식 R01을 완료했으며 현재 실행 상태는 [run evidence](../../docs/evidence/w3-a-ai07-baseline-run.md)에 기록합니다. |
| `dataset.example.yaml` | 템플릿 전용 — 어떤 코드도 읽지 않음 |
| `model.example.yaml` | 템플릿 전용 — 어떤 코드도 읽지 않음 |
| `training.example.yaml` | 템플릿 전용 — 어떤 코드도 읽지 않음 |

템플릿은 아직 미해결인 값을 표시합니다. `null` / `unresolved`는 "기본값 사용"이 아니라 "아직 결정하지 않음"을 뜻합니다.
실행 spec은 JSON을 사용합니다. YAML 템플릿을 읽는 loader는 없으며, PyYAML은 Transformers의 전이 dependency입니다.
