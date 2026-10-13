# artifacts

Local model output workspace. **Everything here is ignored by Git except this README, `manifests/` and `reports/`.**

Never commit:

- model checkpoints and large weights (`artifacts/checkpoints/`, `artifacts/models/`)
- optimizer states
- tensor or training caches (`artifacts/cache/`)

May be committed later (small, reviewed):

- model manifests and their hashes (`artifacts/manifests/`)
- evaluation summaries and small JSON metadata (`artifacts/reports/`)

No artifact exists yet; training has not started.
