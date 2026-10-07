# artifacts

로컬 모델 산출물 작업 공간입니다. **이 README, `manifests/`, `reports/`를 제외한 모든 파일은 Git에서 무시됩니다.**

절대 commit하지 않는 항목:

- 모델 checkpoint와 대용량 weight (`artifacts/checkpoints/`, `artifacts/models/`)
- optimizer state
- tensor 또는 학습 cache (`artifacts/cache/`)

추후 commit할 수 있는 항목(작고, 검토를 거친 것):

- model manifest와 그 hash (`artifacts/manifests/`)
- 평가 요약과 작은 JSON metadata (`artifacts/reports/`)

W3 R01 selected model은 ignored checkpoint 경로에 보존합니다. 실제 manifest는 `manifests/`,
validation 및 handoff 검증 요약은 `reports/`에 있습니다. [W3 A final](../../docs/evidence/w3-a-final.md)을 참조하세요.
