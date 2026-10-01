# AI-04 — W2 Primary dataset acquisition

Status: **W2 A-owner evidence, 2026-09-30**. Primary selection was approved by the Command Center. This document records the pinned acquisition; it does not claim final VeriMod taxonomy, model training, official benchmark evaluation, or Team GATE-2/FRZ-01 completion.

## Decision and use boundary

- Primary: **BEEP! Korean HateSpeech**, official repository [`kocohub/korean-hate-speech`](https://github.com/kocohub/korean-hate-speech).
- Pinned Git revision: `f8d05dce2b22007bb149e5139c0060c68ad8f94b`.
- Dataset license: [CC BY-SA 4.0](https://github.com/kocohub/korean-hate-speech/blob/f8d05dce2b22007bb149e5139c0060c68ad8f94b/LICENSE.md). Attribution, license link, and change notice are required; distributing adapted licensed material invokes ShareAlike. No source comments or titles are redistributed in this repository. Other rights, including privacy and publicity, may still matter.
- Official [README](https://github.com/kocohub/korean-hate-speech/blob/f8d05dce2b22007bb149e5139c0060c68ad8f94b/README.md) reports labeled train 7,896 / dev 471 / hidden-label test 974. The **VeriMod pool is train+dev only (8,367)**. The official test, unlabeled corpus, and other datasets were excluded.
- The resulting TEST is a **VeriMod internal holdout**, not reproduction of the official benchmark test.

The native `hate` axis is single-label `hate / offensive / none`. `hate` and `offensive` are harmful native classes; `none` is a negative/reference class, **not automatic ALLOW**. The separate `bias` axis and `contain_gender_bias` flag are retained as local metadata only. These are acquisition targets, **not final supported taxonomy**. Definitions come from the [official annotation guideline](https://github.com/kocohub/korean-hate-speech/blob/f8d05dce2b22007bb149e5139c0060c68ad8f94b/guideline/annotation_guideline_en.md).

## Pinned file integrity

All six paths were confirmed in the pinned official Git tree. Downloaded bytes matched that tree's Git blob IDs and the SHA-256 values below. Files reside under `../verimod-local-data/w2/beep/`, outside the Git repository. No row text was emitted to documentation or logs.

| Source path at pinned revision | Raw-byte SHA-256 | Rows | Parse / integrity |
|---|---|---:|---|
| `labeled/train.tsv` | `ebebacdcd023af2c4acc8c0a37695fb6433ac04fc009feff8f222724e303a5a9` | 7,896 | PASS; required columns and native domain |
| `labeled/dev.tsv` | `232b615d6e359a9d31dfb8370f32e1733dc5bb3f9c5430d34d7fcc7ba4b7e8ef` | 471 | PASS; required columns and native domain |
| `news_title/train.news_title.txt` | `80fcb349633ddf38062c17363f18e62b3e533640c2a31ba50468963ff5db1492` | 7,896 | PASS; 1:1 row alignment |
| `news_title/dev.news_title.txt` | `5332b771458697677396a6bae8de0f590be9b4b8718592d6e1a92b6592b5d47f` | 471 | PASS; 1:1 row alignment |
| `README.md` | `12d2668b0c23b048b16da8ccc5bd3b8f2e940b305a12324d22c330d1705c8fee` | N/A | SHA-256/Git blob verified |
| `LICENSE.md` | `87a816969906840bf7af8d4d01cdfad4741b18946365e1f286007935509f2edb` | N/A | SHA-256/Git blob verified |

The labeled header is `comments`, `contain_gender_bias`, `bias`, `hate`. The title files have one line per labeled row. Missing/malformed required values, unrecognized hate/bias values, empty title lines, and row-count mismatches were **0** in this pinned acquisition. Native `hate` counts before deduplication: train `hate` 1,911 / `offensive` 2,499 / `none` 3,486; dev `hate` 122 / `offensive` 189 / `none` 160. These are integrity aggregates, not EDA or performance results.

Acquisition/config code: `ai/configs/w2_dataset.json` and `ai/scripts/prepare_w2_dataset.py`. The script requires the six pinned hashes and refuses to read or overwrite an existing split artifact. Source acquisition used only the six allowlisted paths; the official TEST files were not opened.
