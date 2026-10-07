"""AI-07 spec/analysis boundaries only; no real dataset read or model inference."""

import json
from pathlib import Path, PureWindowsPath
import subprocess
import sys
import tomllib
import unittest
from unittest.mock import patch

from verimod_ai.data.preprocessing import PREPROCESSING_VERSION
from verimod_ai.data.taxonomy import NATIVE_TARGET, REFERENCE_CLASS, SCORE_KEYS

AI_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(AI_ROOT / "scripts"))
import analyze_w3_token_lengths as analysis


class BaselineConfigTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config = json.loads((AI_ROOT / "configs/w3_baseline.json").read_text(encoding="utf-8"))

    def test_actual_taxonomy_and_primary_only(self):
        c = self.config
        self.assertEqual(c["native_labels"], ["hate", "offensive", "none"])
        self.assertEqual(tuple(c["native_labels"]), NATIVE_TARGET)
        self.assertEqual(tuple(c["exposed_score_keys"]), SCORE_KEYS)
        self.assertEqual(c["exposed_score_keys"], ["hate", "offensive"])
        self.assertEqual(c["reference_class"], REFERENCE_CLASS)
        self.assertEqual(c["reference_class"], "none")
        self.assertEqual(c["primary_dataset"], "BEEP! Korean HateSpeech")
        self.assertEqual(c["dataset_revision"], analysis.DATASET_REVISION)
        serialized = json.dumps(c).lower()
        for forbidden in ("secondary", "profanity", "sexual", "spam", "violence"):
            self.assertNotIn(forbidden, serialized)

    def test_pinned_source_and_preprocessing(self):
        c = self.config
        for kind in ("model", "tokenizer"):
            self.assertEqual(c[f"{kind}_id"], "klue/roberta-base")
            self.assertRegex(c[f"{kind}_revision"], r"^[0-9a-f]{40}$")
            self.assertEqual(c[f"{kind}_revision"], analysis.REVISION)
        self.assertEqual(c["model_revision"], c["tokenizer_revision"])
        self.assertFalse(c["trust_remote_code"])
        self.assertEqual(c["preprocessing_version"], PREPROCESSING_VERSION)
        self.assertEqual(c["preprocessing_version"], "verimod-ko-text-v1")
        self.assertEqual(c["seed"], 45126)

    def test_training_selection_and_score_boundary(self):
        c = self.config
        self.assertEqual(c["task"], "single_label_text_classification")
        self.assertEqual(c["loss"], "cross_entropy")
        self.assertIsNone(c["class_weighting"])
        self.assertEqual(c["selection_split"], "validation")
        self.assertEqual(c["selection_metric"], "macro_f1")
        self.assertEqual(c["checkpoint_selection_metric"], "macro_f1")
        self.assertEqual(c["score_semantics"], "UNCALIBRATED")
        self.assertEqual(c["test_access"], "SEALED")
        self.assertEqual(c["training_status"], "NOT_STARTED")
        self.assertEqual(c["epochs"], 3)
        self.assertEqual(c["learning_rate"], 2e-5)
        self.assertEqual(c["weight_decay"], 0.01)
        self.assertEqual(c["warmup_ratio"], 0.10)
        self.assertEqual(c["lr_scheduler"], "linear")
        self.assertEqual(c["max_grad_norm"], 1.0)

    def test_length_choice_is_supported_by_measured_evidence(self):
        report = json.loads((AI_ROOT / "artifacts/reports/w3_baseline/token_length_summary.json").read_text(encoding="utf-8"))
        c = self.config
        self.assertEqual(report["tokenizer_revision"], c["tokenizer_revision"])
        self.assertEqual(report["preprocessing_version"], c["preprocessing_version"])
        self.assertFalse(report["test_accessed"])
        self.assertEqual(set(report["splits"]), {"train", "validation"})
        # This baseline selects the smallest candidate with zero observed information loss.
        feasible = [limit for limit in (128, 256, 512)
                    if all(s["truncation"][str(limit)]["count"] == 0 for s in report["splits"].values())]
        self.assertTrue(feasible)
        self.assertEqual(c["max_length"], min(feasible))

    def test_cpu_device_and_effective_batch_are_explicit(self):
        c = self.config
        self.assertEqual(c["device"], "cpu")
        self.assertEqual(c["mixed_precision"], "none")
        self.assertEqual(c["effective_train_batch_size"], c["train_batch_size"] * c["gradient_accumulation_steps"])
        self.assertGreater(c["train_batch_size"], 0)
        self.assertGreater(c["eval_batch_size"], 0)
        self.assertEqual(c["data_seed"], c["seed"])
        self.assertEqual(c["dataloader_num_workers"], 0)

    def test_committed_config_contains_no_absolute_local_paths(self):
        def walk(value):
            if isinstance(value, dict):
                for item in value.values():
                    walk(item)
            elif isinstance(value, list):
                for item in value:
                    walk(item)
            elif isinstance(value, str):
                self.assertFalse(PureWindowsPath(value).is_absolute(), value)
                self.assertFalse(value.startswith("/"), value)
        walk(self.config)
        self.assertEqual(self.config["data_location_env"], "VERIMOD_BEEP_SPLITS")
        for name in ("train", "validation"):
            self.assertEqual(self.config["split_provenance"][name], analysis.EXPECTED[name])

    def test_runtime_dependencies_are_pinned_and_unrelated_packages_excluded(self):
        project = tomllib.loads((AI_ROOT / "pyproject.toml").read_text(encoding="utf-8"))
        lock = (AI_ROOT / "requirements-w3.lock.txt").read_text(encoding="utf-8")
        for dependency in project["project"]["dependencies"]:
            self.assertRegex(dependency, r"^[A-Za-z0-9_.-]+==[^\s]+$")
        for forbidden in ("tensorflow", "datasets", "pandas", "pyarrow", "pytest", "verimod-ai", "file:///", "C:\\Users"):
            self.assertNotIn(forbidden.lower(), lock.lower())
        self.assertIn("torch==2.14.1+cpu", lock)


class TokenAnalysisBoundaryTests(unittest.TestCase):
    def test_test_and_unknown_splits_rejected_before_any_read(self):
        with patch.object(Path, "read_bytes", side_effect=AssertionError("must not read")):
            for splits in (["test"], ["train", "test"], ["../test"], [], ["train", "train"]):
                with self.subTest(splits=splits), self.assertRaises(PermissionError):
                    analysis.split_paths(Path("not-a-data-directory"), splits)

    def test_cli_test_request_fails_without_loading_tokenizer(self):
        result = subprocess.run([sys.executable, "-B", str(AI_ROOT / "scripts/analyze_w3_token_lengths.py"),
                                 "--splits", "test"], capture_output=True, text=True)
        self.assertEqual(result.returncode, 2)
        self.assertIn("TEST is sealed", result.stderr)

    def test_percentiles_and_strict_greater_than_truncation(self):
        result = analysis.summarize([2, 128, 129, 256, 257, 512, 513])
        self.assertEqual(result["p50"], 256)
        self.assertEqual(result["max"], 513)
        self.assertEqual([result["truncation"][str(n)]["count"] for n in (128, 256, 512)], [5, 3, 1])
        self.assertAlmostEqual(result["truncation"]["128"]["rate"], 5 / 7)


if __name__ == "__main__":
    unittest.main()
