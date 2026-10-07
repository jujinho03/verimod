# W3 experiment registry

`registry.jsonl` contains one official run: `AI07-BL-KLUE-RB-45126-R01`.
The decision is `KEEP_AS_W3_BASELINE`; this is not FINAL_MODEL, PRODUCTION_READY or LOCKED_FOR_TEST.
Smoke and synthetic fixture replay are not official training experiments.

Execution base HEAD, null execution-time source commit and the later source snapshot commit
are separate fields. The missing execution-time pyproject hash is an approved documented limitation.
The historical lock hash, runtime inventory, config/source hashes and selected artifact hash are retained.

`package_w3_baseline.py` builds this entry from preserved reports. It rejects a differing existing
registry; it does not train or access a dataset. Scores are UNCALIBRATED. TEST is sealed.

See [reproducibility and handoff](../../docs/evidence/w3-a-reproducibility-handoff.md).
