"""AI-06 model metrics on synthetic predictions only."""

import unittest

from verimod_ai.evaluation.metrics import (
    confusion_matrix, macro_f1, micro_f1, model_report, per_class_metrics,
)


class ModelMetricTests(unittest.TestCase):
    def test_perfect_prediction(self):
        y = ["hate", "offensive", "none", "none"]
        report = model_report(y, y)
        self.assertEqual(report["macro_f1"], 1.0)
        self.assertEqual(report["micro_f1"], 1.0)
        for c in ("hate", "offensive", "none"):
            self.assertEqual(report["per_class"][c]["f1"], 1.0)

    def test_all_wrong_prediction(self):
        y_true = ["hate", "offensive", "none"]
        y_pred = ["none", "hate", "offensive"]
        self.assertEqual(macro_f1(y_true, y_pred), 0.0)
        self.assertEqual(micro_f1(y_true, y_pred), 0.0)
        matrix = confusion_matrix(y_true, y_pred)
        self.assertEqual(matrix["hate"]["none"], 1)
        self.assertEqual(sum(matrix[c][c] for c in matrix), 0)

    def test_missing_predicted_class(self):
        y_true = ["hate", "offensive", "none", "none"]
        y_pred = ["none", "offensive", "none", "none"]  # never predicts hate
        hate = per_class_metrics(y_true, y_pred)["hate"]
        self.assertEqual((hate["precision"], hate["precision_defined"]), (0.0, False))
        self.assertEqual((hate["recall"], hate["recall_defined"]), (0.0, True))
        none = per_class_metrics(y_true, y_pred)["none"]
        self.assertAlmostEqual(none["precision"], 2 / 3)
        self.assertEqual(none["recall"], 1.0)
        self.assertAlmostEqual(none["f1"], 0.8)

    def test_zero_support_class_counts_in_macro(self):
        y = ["none", "offensive", "none"]  # no hate in truth or prediction
        per_class = per_class_metrics(y, y)
        self.assertEqual(per_class["hate"]["support"], 0)
        self.assertFalse(per_class["hate"]["f1_defined"])
        self.assertAlmostEqual(macro_f1(y, y), 2 / 3)  # (0 + 1 + 1) / 3
        self.assertEqual(micro_f1(y, y), 1.0)

    def test_macro_micro_consistency(self):
        y_true = ["hate", "hate", "offensive", "offensive", "none", "none", "none"]
        y_pred = ["hate", "offensive", "offensive", "none", "none", "none", "hate"]
        per_class = per_class_metrics(y_true, y_pred)
        self.assertAlmostEqual(macro_f1(y_true, y_pred), sum(v["f1"] for v in per_class.values()) / 3)
        accuracy = sum(t == p for t, p in zip(y_true, y_pred)) / len(y_true)
        self.assertAlmostEqual(micro_f1(y_true, y_pred), accuracy)
        self.assertEqual(sum(v["support"] for v in per_class.values()), len(y_true))

    def test_input_validation(self):
        with self.assertRaises(ValueError):
            micro_f1(["hate"], ["hate", "none"])
        with self.assertRaises(ValueError):
            micro_f1(["hate"], ["profanity"])
        with self.assertRaises(ValueError):
            micro_f1([], [])


if __name__ == "__main__":
    unittest.main()
