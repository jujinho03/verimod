# data

Local dataset workspace. **Everything here is ignored by Git except this README and `fixtures/`.**

Never commit:

- raw datasets (`data/raw/`)
- processed or split datasets (`data/processed/`)
- download caches (`data/cache/`, `data/downloads/`)
- temporary preprocessing outputs

May be committed (small, reviewed, no source text from licensed datasets):

- synthetic test fixtures (`data/fixtures/`)
- metadata, manifests, schemas and split definitions — prefer `configs/` and `docs/research/`

The W2 BEEP! source files and the sealed internal TEST live outside the repository in
`../verimod-local-data/w2/` (see [AI-04](../../docs/research/w2-primary-dataset-decision.md)).
Their integrity is recorded as SHA-256 values, not as files in Git.
