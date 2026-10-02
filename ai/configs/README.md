# configs

| 파일 | 종류 |
|---|---|
| `w2_dataset.json` | **고정(pinned), 사용 중.** `scripts/prepare_w2_dataset.py`(AI-04/AI-15)가 읽습니다. 새 evidence 기록 없이 수정하지 마세요. |
| `dataset.example.yaml` | 템플릿 전용 — 어떤 코드도 읽지 않음 |
| `model.example.yaml` | 템플릿 전용 — 어떤 코드도 읽지 않음 |
| `training.example.yaml` | 템플릿 전용 — 어떤 코드도 읽지 않음 |

템플릿은 아직 미해결인 값을 표시합니다. `null` / `unresolved`는 "기본값 사용"이 아니라 "아직 결정하지 않음"을 뜻합니다.
아직 YAML parser는 dependency에 없습니다. config를 실제로 사용하게 될 때 loader를 추가합니다.
