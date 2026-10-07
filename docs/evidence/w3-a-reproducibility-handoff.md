# W3 A Reproducibility & Handoff

## Official Run

- Run: `AI07-BL-KLUE-RB-45126-R01`.
- Decision: KEEP_AS_W3_BASELINE; further model/policy comparison remains future work.
- Registry: `ai/experiments/registry.jsonl` (one official entry).
- R01 was not rerun during packaging. Only three synthetic inputs were inferred twice.

## Source

- execution_base_head: `09d72598dcd1d6744d4c80b99af0721d4c1efedc`.
- source_commit_at_execution: **null**; R01 ran from a dirty tree.
- source_snapshot_commit: `f6b39d3b7c5637b68e18c2b1b59ee91890c059f0` (post-run snapshot).
- Provenance: PASS_WITH_DOCUMENTED_LIMITATION. The execution-time pyproject SHA was not recorded;
  the current hash must never be backfilled as historical. Execution lock/config hashes and runtime
  inventory are preserved. See [source provenance](w3-a-r01-source-provenance.md).
- The verifier restores the recorded LF/CRLF bytes from this commit in memory and verifies all 12
  historical hashes. It does not rewrite source files. Line-ending-normalized Git blobs and original
  execution-byte hashes are distinct.

## Environment

- Windows 11 x64; Python 3.12.14; PyTorch 2.14.1+cpu; Transformers 4.57.6.
- Intel Core i5-1035G4 CPU; RAM 16,930,271,232 bytes; no CUDA; mixed precision NONE.
- Frozen seed 45126; torch intra-op threads 4, inter-op threads 1.
- Local JS checks: Node 24.10.0 / npm 11.6.1. Repository CI pins Node 24.19.0 / npm 12.0.2.
- Historical package inventory: `ai/artifacts/reports/w3_baseline/environment.json`.

## Install

Use a clean checkout with the source snapshot in its history and the closure files present.
Commands below are from repository root; install CPython 3.12.14 x64 first.

```powershell
python -m venv ai/.venv
& ai/.venv/Scripts/python.exe -m pip install -r ai/requirements-w3.lock.txt
& ai/.venv/Scripts/python.exe -m pip install -e ai --no-deps
& ai/.venv/Scripts/python.exe -m pip install pytest==9.1.1
npm --prefix backend ci
```

The lock explicitly identifies the CPU torch wheel source and exact transitive packages. Do not
replace it with a full machine-wide pip freeze or silently switch to a CUDA build.

Provision the pinned tokenizer cache before offline fixture replay:

```powershell
& ai/.venv/Scripts/python.exe -c "from huggingface_hub import snapshot_download; snapshot_download('klue/roberta-base', revision='02f94ba5e3fcb7e2a58a390b8639b0fac974a8da', cache_dir='ai/.venv/hf-cache', allow_patterns=['config.json','tokenizer*','special_tokens_map.json','vocab.txt'])"
```

Selected trained weights/config must be transferred separately through an approved private channel;
they are not in Git. Hash-check them before use. The base pretrained cache alone is not the selected model.

## Dataset Preparation

Use the already-created internal split artifacts, not a new split. `ai/configs/w2_dataset.json`
is the source of dataset revision/split semantics. Historical preparation implementation is
`ai/scripts/prepare_w2_dataset.py`; do not rerun raw-source preparation or regenerate/reopen TEST for this handoff.
Provision only `train.jsonl` and `validation.jsonl` privately into the logical splits directory.

| Split | N | SHA-256 |
|---|---:|---|
| TRAIN | 5857 | fc9a70cdffc2dad297d37e1724d8011e070e17dd251f2d061ec40f7ea2d89a2b |
| VALIDATION | 1255 | a92f81ed8eadb9fdb1950be542f9edac4fe778f3e7bd2d630cd1494ef031a26a |

Dataset revision: `f8d05dce2b22007bb149e5139c0060c68ad8f94b`; split seed 45126.
`training/dataset.py` allows only train/validation, validates their count/hash/labels and rejects TEST
before path resolution. TEST is not needed for metadata verification or synthetic fixture replay.

## Training

Historical official command (documentation only; not executed again during closure):

```powershell
& ai/.venv/Scripts/python.exe -B ai/scripts/train_w3_baseline.py --config ai/configs/w3_baseline.json --splits-dir ../verimod-local-data/w2/beep-splits --run-id AI07-BL-KLUE-RB-45126-R01 --offline
```

Do not overwrite/reuse R01. A separately approved future reproduction needs an empty artifact workspace
and a distinct run ID, plus the pinned base-model cache for offline training. Keep the frozen config
unchanged. This closure grants no additional training run. `training_status: NOT_STARTED` in the original
config is its frozen pre-run state; run_identity/registry record actual R01 completion.

## Expected Validation Reference

Macro-F1 **0.6524599868976999**; Micro-F1 **0.6629482071713148**; Accuracy **0.6629482071713148**.
These are preserved R01 full VALIDATION results, not TEST or synthetic-fixture performance.
Different hardware/driver/library combinations are not guaranteed to produce bitwise identical weights.

## Selected Artifact

- Path: `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model/model.safetensors`.
- SHA-256: `a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f`.
- Best step: 1101; architecture RobertaForSequenceClassification; parameter count 110620419.
- Manifest: `ai/artifacts/manifests/AI07-BL-KLUE-RB-45126-R01.model_manifest.json`.

## Manifest Hash

Canonical hash: `0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1`.

```powershell
node backend/node_modules/tsx/dist/cli.mjs ai/scripts/w3_protocol_bridge.mts ai/artifacts/manifests/AI07-BL-KLUE-RB-45126-R01.model_manifest.json
```

The bridge invokes T-owned `canonicalBytes` in `shared/protocol/src/canonical.ts` and
`domainHash(DOMAINS.model, ...)` in `shared/protocol/src/hash.ts`, exactly the mechanism used by
`shared/protocol/src/manifests.ts:manifestHashes`. Domain: `verimod:model:v1`; protocol: `verimod/1`.
No Python canonicalization, protocol hashing or Merkle implementation is added.

The shared canonical profile accepts only safe integer JSON numbers. Manifest metric values are
explicit decimal strings copied from the original numeric metrics report; they retain the exact values.
Ordinary `manifest_file_sha256` is separate byte provenance and may vary with line endings/formatting;
it is never substituted for model_manifest_hash.

## Fixture Reproduction

Exact commands executed for the original fixture and independent-process replay:

```powershell
& ai/.venv/Scripts/python.exe -B ai/scripts/generate_w3_fixture.py
& ai/.venv/Scripts/python.exe -B ai/scripts/generate_w3_fixture.py --output ai/artifacts/results/AI07-BL-KLUE-RB-45126-R01/handoff_repeat.json --compare ai/fixtures/w3_real_model_i1_fixture.json
```

For subsequent verification choose a new unused output path with `--output`, retaining `--compare`
against the committed fixture. Existing output files are protected from overwrite.
Three AI-authored synthetic Korean inputs are preprocessed with verimod-ko-text-v1 (500 code point HEAD),
then pinned tokenizer right truncation at 128 tokens. Selected CPU model scores are rounded once with
`floor(score * 1_000_000 + 0.5)`; no ppm sum repair. All native scores remain evidence; only hate/offensive
are exposed in I1. `none` is not ALLOW. No expected label or attribution is fabricated.

Two actual independent process runs matched logits, scores, ppm, predicted classes, input status and
manifest reference exactly, with no tolerance. Timestamps differ and are not deterministic outputs.
Report: `ai/artifacts/reports/w3_handoff/fixture_reproducibility.json`.

**CROSS_MACHINE_VERIFICATION = NOT_EXECUTED.** Local repeat is not another-PC validation.

## Single Verification Command

```powershell
& ai/.venv/Scripts/python.exe -B ai/scripts/verify_w3_handoff.py --model-dir ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model
```

This checks registry, manifest, fixture/I1 shape, shared manifest hash, source snapshot and model bytes.
It performs no inference. Without `--model-dir` it explicitly reports
`METADATA_VERIFIED_ARTIFACT_UNVERIFIED`; unavailable supplied weights report NOT_AVAILABLE, not a model PASS.
This partial mode was tested locally and is not cross-machine evidence.

## Contract

Status: **A_OUTPUT_READY_CONSUMER_ALIGNMENT_REQUIRED**.

- A validator reuses exact TypedDict keys from `ai/src/verimod_ai/inference/contract.py` and existing A taxonomy.
- All three fixture envelopes pass F's actual `assertValidInference` at remote commit
  `e5f2bdcc49a5182d25ba9cfb96f6d591d44ca0a4` (`backend/src/inference.ts`). The bridge reads that Git blob,
  erases TS types with existing esbuild and binds its hash import to the actual shared module; the validator
  body is not reimplemented. Reproduce with `--consumer-ref` followed by that SHA.
- Current main/shared Receipt schema rejects the actual taxonomy with INVALID_SCHEMA. T branch
  `0b6622cdcca843a7ec0638a6cf84fcf31f01ba87` has the same legacy shared schema/types/manifest code.
- At initial fetch, origin/main was still `09d72598dcd1d6744d4c80b99af0721d4c1efedc`; T/F W3 work existed
  on separate branches. They were inspected but not merged without authorization to merge those branches.
- The shared schema probes contain synthetic placeholder policy fields only to reach its inference
  validator. They are not policy decisions or issued receipts. No authoritative issuance, Merkle epoch,
  registerEpoch or external anchor was executed. Anchor status remains **PENDING_ANCHOR**.
- No fake legacy five-label conversion. Shared/backend/frontend source contracts were not modified.
- Main does not contain the F W3 issuance service; this is validator-level handoff evidence, not runtime E2E.

Verification report: `ai/artifacts/reports/w3_handoff/verification.json`.

## Boundaries

TEST sealed; Primary only; native 3-class; scores uncalibrated; no production fitness claim;
no threshold lock, policy lock, calibration, secondary evaluation or W4 service implementation.
Inference failure must remain separate from Receipt status; the intended unavailable boundary is
503 INFERENCE_UNAVAILABLE with zero Decision Receipts. No fake scores or ALLOW fallback is added here.
