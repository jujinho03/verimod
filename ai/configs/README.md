# configs

| File | Kind |
|---|---|
| `w2_dataset.json` | **Pinned, in use.** Read by `scripts/prepare_w2_dataset.py` (AI-04/AI-15). Do not edit without a new evidence record. |
| `dataset.example.yaml` | Template only — not read by any code |
| `model.example.yaml` | Template only — not read by any code |
| `training.example.yaml` | Template only — not read by any code |

The templates mark which values are still unresolved. `null` / `unresolved` means "not decided", not "use a default".
No YAML parser is a dependency yet; a loader is added when a config is actually consumed.
