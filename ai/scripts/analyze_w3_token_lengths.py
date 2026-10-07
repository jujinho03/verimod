"""AI-07 spec evidence only: pinned tokenizer, TRAIN/VALIDATION, no model inference."""

from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import re
import sys

AI_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = AI_ROOT.parent
sys.path.insert(0, str(AI_ROOT / "src"))

from verimod_ai.data.preprocessing import PREPROCESSING_VERSION, preprocess_text
from verimod_ai.data.taxonomy import NATIVE_TARGET, PRIMARY_DATASET

ALLOWED_SPLITS = ("train", "validation")
MODEL_ID = "klue/roberta-base"
REVISION = "02f94ba5e3fcb7e2a58a390b8639b0fac974a8da"
DATASET_REVISION = "f8d05dce2b22007bb149e5139c0060c68ad8f94b"
EXPECTED = {
    "train": {"count": 5857, "class_counts": {"hate": 1423, "offensive": 1882, "none": 2552},
              "sha256": "fc9a70cdffc2dad297d37e1724d8011e070e17dd251f2d061ec40f7ea2d89a2b"},
    "validation": {"count": 1255, "class_counts": {"hate": 305, "offensive": 403, "none": 547},
                   "sha256": "a92f81ed8eadb9fdb1950be542f9edac4fe778f3e7bd2d630cd1494ef031a26a"},
}


def split_paths(directory: Path, splits: list[str] | tuple[str, ...]) -> dict[str, Path]:
    """Reject disallowed split requests before any file read or Hub operation."""
    if not splits or len(set(splits)) != len(splits) or any(s not in ALLOWED_SPLITS for s in splits):
        raise PermissionError("Only unique TRAIN/VALIDATION split requests are allowed; TEST is sealed")
    # Normalize '..' before Windows resolves the existing file handle.
    directory = Path(os.path.abspath(directory)).resolve()
    paths = {}
    for split in splits:
        path = (directory / f"{split}.jsonl").resolve()
        if path.parent != directory or path.name != f"{split}.jsonl":
            raise PermissionError("Split path redirects outside its allowlisted logical location")
        paths[split] = path
    return paths


def percentile(values: list[int], fraction: float) -> int:
    """Nearest-rank percentile: sorted[ceil(q*N)-1], including special tokens."""
    if not values or not 0 < fraction <= 1:
        raise ValueError("Non-empty lengths and fraction in (0, 1] required")
    return sorted(values)[math.ceil(fraction * len(values)) - 1]


def summarize(values: list[int]) -> dict:
    result = {"count": len(values), **{f"p{int(q * 100)}": percentile(values, q)
              for q in (0.50, 0.90, 0.95, 0.99)}, "max": max(values)}
    result["truncation"] = {str(limit): {"count": sum(v > limit for v in values),
                            "rate": sum(v > limit for v in values) / len(values)}
                            for limit in (128, 256, 512)}
    return result


def run(directory: Path, splits: list[str], *, offline: bool = False) -> dict:
    paths = split_paths(directory, splits)
    config = json.loads((AI_ROOT / "configs/w2_dataset.json").read_text(encoding="utf-8"))
    if (config["revision"] != DATASET_REVISION or config["seed"] != 45126
            or tuple(config["native_target"]["labels"]) != NATIVE_TARGET
            or config["dataset"] != PRIMARY_DATASET or PREPROCESSING_VERSION != "verimod-ko-text-v1"):
        raise ValueError("Dataset/preprocessing provenance differs from the audited baseline")
    if not re.fullmatch(r"[0-9a-f]{40}", REVISION):
        raise ValueError("Immutable tokenizer commit required")

    # Validate both selected artifacts before tokenizer access; never enumerate/read TEST.
    records = {}
    for split, path in paths.items():
        raw = path.read_bytes()
        expected = EXPECTED[split]
        if hashlib.sha256(raw).hexdigest() != expected["sha256"]:
            raise ValueError(f"{split}: audited split SHA-256 mismatch")
        rows = [json.loads(line) for line in raw.decode("utf-8").splitlines()]
        if len(rows) != expected["count"] or Counter(r["label"] for r in rows) != Counter(expected["class_counts"]):
            raise ValueError(f"{split}: audited row/class counts mismatch")
        if any(not isinstance(r.get("text"), str) or r["label"] not in NATIVE_TARGET for r in rows):
            raise ValueError(f"{split}: invalid input schema")
        records[split] = rows

    from transformers import AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_ID, revision=REVISION, trust_remote_code=False, use_fast=True,
        cache_dir=AI_ROOT / ".venv/hf-cache", local_files_only=offline, token=False,
    )
    tokenizer.truncation_side = "right"
    result = {
        "analysis_version": "w3-token-lengths-v1", "executed_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset_revision": DATASET_REVISION, "split_seed": 45126,
        "tokenizer_id": MODEL_ID, "tokenizer_revision": REVISION,
        "tokenizer_class": type(tokenizer).__name__, "use_fast": tokenizer.is_fast,
        "preprocessing_version": PREPROCESSING_VERSION,
        "order": "original text -> existing 500-code-point HEAD preprocessing -> tokenizer",
        "add_special_tokens": True, "padding": False, "truncation_during_analysis": False,
        "percentile_method": "nearest_rank_ceil_qN", "tokenization_batch_size": 256,
        "test_accessed": False, "model_inference_executed": False, "splits": {},
    }
    for split, rows in records.items():
        prepared = [preprocess_text(r["record_id"], r["text"], source_dataset=PRIMARY_DATASET) for r in rows]
        lengths = []
        for offset in range(0, len(prepared), 256):
            encoded = tokenizer([r.processed_text for r in prepared[offset:offset + 256]],
                                add_special_tokens=True, padding=False, truncation=False,
                                return_attention_mask=False, return_token_type_ids=False)
            lengths.extend(len(ids) for ids in encoded["input_ids"])
        result["splits"][split] = {
            **summarize(lengths), "input_sha256": EXPECTED[split]["sha256"],
            "class_counts": EXPECTED[split]["class_counts"],
            "codepoint_truncated_count": sum(r.input_status == "TRUNCATED" for r in prepared),
        }
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--splits-dir", type=Path, default=os.environ.get("VERIMOD_BEEP_SPLITS"))
    parser.add_argument("--splits", nargs="+", default=list(ALLOWED_SPLITS))
    parser.add_argument("--offline", action="store_true")
    parser.add_argument("--report", type=Path, default=AI_ROOT / "artifacts/reports/w3_baseline/token_length_summary.json")
    args = parser.parse_args()
    # Reject TEST even if the data directory is missing.
    if any(s not in ALLOWED_SPLITS for s in args.splits):
        parser.error("Only train and validation are allowed; TEST is sealed")
    if args.splits_dir is None:
        parser.error("Set VERIMOD_BEEP_SPLITS or --splits-dir to the existing internal split directory")
    report = args.report.resolve()
    if not report.is_relative_to((AI_ROOT / "artifacts/reports").resolve()):
        parser.error("Report must be under ai/artifacts/reports; data files cannot be overwritten")
    result = run(args.splits_dir, args.splits, offline=args.offline)
    report.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    report.write_text(serialized, encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    print(serialized, end="")


if __name__ == "__main__":
    main()
