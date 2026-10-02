# data

로컬 dataset 작업 공간입니다. **이 README와 `fixtures/`를 제외한 모든 파일은 Git에서 무시됩니다.**

절대 commit하지 않는 항목:

- 원본 dataset (`data/raw/`)
- 전처리되었거나 split된 dataset (`data/processed/`)
- 다운로드 cache (`data/cache/`, `data/downloads/`)
- 임시 전처리 산출물

commit할 수 있는 항목(작고, 검토를 거쳤으며, 라이선스가 있는 dataset의 원문 텍스트를 포함하지 않는 것):

- synthetic test fixture (`data/fixtures/`)
- metadata, manifest, schema, split 정의 — 가능하면 `configs/`와 `docs/research/`에 둡니다

W2 BEEP! 원본 파일과 sealed internal TEST는 repository 밖의
`../verimod-local-data/w2/`에 있습니다([AI-04](../../docs/research/w2-primary-dataset-decision.md) 참조).
이 파일들의 무결성은 Git의 파일이 아니라 SHA-256 값으로 기록합니다.
