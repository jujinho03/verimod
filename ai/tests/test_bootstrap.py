"""AI-06 bootstrap utility on synthetic values; no dataset or file access."""

from pathlib import Path
import unittest

from verimod_ai.evaluation import bootstrap
from verimod_ai.evaluation.bootstrap import bootstrap_ci

VALUES = [0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1]


def mean(xs):
    return sum(xs) / len(xs)


class BootstrapTests(unittest.TestCase):
    def run_ci(self, **overrides):
        args = {"n_resamples": 200, "seed": 7, "confidence_level": 0.95} | overrides
        return bootstrap_ci(VALUES, mean, **args)

    def test_fixed_seed_reproducible(self):
        self.assertEqual(self.run_ci(), self.run_ci())
        self.assertNotEqual(self.run_ci()["lower"], None)
        result = self.run_ci()
        self.assertLessEqual(result["lower"], result["point"])
        self.assertLessEqual(result["point"], result["upper"])
        self.assertEqual(result["method"], "percentile")

    def test_group_resampling_reproducible(self):
        groups = [i // 3 for i in range(len(VALUES))]
        a = bootstrap_ci(VALUES, mean, n_resamples=100, seed=3, confidence_level=0.9, groups=groups)
        b = bootstrap_ci(VALUES, mean, n_resamples=100, seed=3, confidence_level=0.9, groups=groups)
        self.assertEqual(a, b)
        self.assertEqual(a["unit"], "group")

    def test_undefined_statistic_is_counted(self):
        result = bootstrap_ci([1, 2], lambda xs: None, n_resamples=5, seed=1, confidence_level=0.9)
        self.assertEqual(result["n_undefined"], 5)
        self.assertIsNone(result["lower"])

    def test_input_validation(self):
        with self.assertRaises(TypeError):
            bootstrap_ci(VALUES, mean)  # no defaults for n_resamples / seed / confidence_level
        for bad in ({"n_resamples": 0}, {"seed": None}, {"confidence_level": 1.0}, {"confidence_level": 95}):
            with self.assertRaises(ValueError):
                self.run_ci(**bad)
        with self.assertRaises(ValueError):
            bootstrap_ci([], mean, n_resamples=1, seed=1, confidence_level=0.9)
        with self.assertRaises(ValueError):
            bootstrap_ci(VALUES, mean, n_resamples=1, seed=1, confidence_level=0.9, groups=[1])

    def test_no_test_split_dependency(self):
        source = Path(bootstrap.__file__).read_text(encoding="utf-8")
        for token in ("open(", "read_text", "read_bytes", "jsonl", "verimod-local-data"):
            self.assertNotIn(token, source)


if __name__ == "__main__":
    unittest.main()
