"""Scaffold integrity only. No model, dataset download or TEST access."""

import unittest

import verimod_ai
from verimod_ai.data.label_mapping import LabelMappingNotConfigured, map_native_labels
from verimod_ai.data.schema import NativeSample
from verimod_ai.evaluation import metrics
from verimod_ai.inference.contract import PPM_MAX, InferenceAdapter, InferenceOutput


class WorkspaceTests(unittest.TestCase):
    def test_package_imports(self):
        self.assertEqual(verimod_ai.__version__, "0.0.0")
        self.assertEqual(PPM_MAX, 1_000_000)
        self.assertIn("scores_ppm", InferenceOutput.__annotations__)
        self.assertTrue(hasattr(InferenceAdapter, "infer"))

    def test_sample_schema_keeps_native_labels(self):
        sample = NativeSample("s-1", "synthetic text", ("offensive",), "synthetic")
        self.assertEqual(sample.native_labels, ("offensive",))
        self.assertEqual(dict(sample.metadata), {})

    def test_unresolved_label_mapping_fails_explicitly(self):
        with self.assertRaises(LabelMappingNotConfigured):
            map_native_labels(["hate"], source_dataset="synthetic")

    def test_metrics_are_not_faked(self):
        for fn in (metrics.macro_f1, metrics.micro_f1, metrics.per_label_metrics,
                   metrics.confusion, metrics.policy_metrics):
            with self.assertRaises(NotImplementedError):
                fn([], [])


if __name__ == "__main__":
    unittest.main()
