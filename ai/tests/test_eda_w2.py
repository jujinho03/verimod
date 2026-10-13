"""AI-20 EDA script checks on synthetic fixtures; the sealed TEST is never used."""

import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from eda_w2 import guard_path, load_split, run  # noqa: E402

CONFIG = Path(__file__).resolve().parents[1] / "configs" / "w2_dataset.json"


def row(index: int, split: str, label: str, bias: str = "none", text: str | None = None, title: str | None = None) -> dict:
    return {"record_id": f"{split}:{index:06d}", "text": text or f"synthetic {split} comment {index:04d}",
            "label": label, "news_title": title or f"synthetic title {index // 2}", "bias": bias,
            "contain_gender_bias": bias == "gender"}


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")


class EdaTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        base = Path(self.tmp.name)
        self.splits = base / "splits"
        self.splits.mkdir()
        self.out = base / "out"
        config = json.loads(CONFIG.read_text(encoding="utf-8"))
        self.train = [row(0, "t", "hate", "gender"), row(1, "t", "offensive", "others"),
                      row(2, "t", "none"), row(3, "t", "none", text="x" * 501)]
        self.validation = [row(10, "v", "hate"), row(11, "v", "none")]
        write_jsonl(self.splits / "train.jsonl", self.train)
        write_jsonl(self.splits / "validation.jsonl", self.validation)
        # A decoy TEST file whose content would break the run if it were ever read.
        (self.splits / "test.jsonl").write_text("NOT JSON - must never be read\n", encoding="utf-8")
        self.evidence = base / "evidence.json"
        self.evidence.write_text(json.dumps({
            "revision": config["revision"],
            "split": {"seed": config["seed"], "actual": {
                "train": {"count": 4, "class_counts": {"hate": 1, "offensive": 1, "none": 2}},
                "validation": {"count": 2, "class_counts": {"hate": 1, "offensive": 0, "none": 1}},
                "test": {"count": 3, "class_counts": {"hate": 1, "offensive": 1, "none": 1}}}},
            "duplicates": {"exact_duplicate_excess": 0, "normalized_duplicate_excess": 0,
                           "same_label_removed": 0, "conflicting_quarantined": 0},
            "groups": {"unique_title_proxy_groups": 4, "atomic_groups": 4,
                       "near_duplicate": {"status": "CHECKED", "matched_pairs": 0}},
            "leakage": {"exact_overlap": 0},
        }), encoding="utf-8")

    def tearDown(self):
        self.tmp.cleanup()

    def test_counts_reconcile_and_test_comes_from_aggregate(self):
        summary = run(self.splits, self.evidence, CONFIG, self.out)
        for split, rows in (("train", self.train), ("validation", self.validation)):
            block = summary["splits"][split]
            self.assertEqual(block["count"], len(rows))
            self.assertEqual(sum(block["labels"]["counts"].values()), len(rows))
            self.assertEqual(sum(block["bias"]["counts"].values()), len(rows))
            cells = block["label_x_bias"]["counts"]
            self.assertEqual(sum(sum(v.values()) for v in cells.values()), len(rows))
        self.assertEqual(summary["splits"]["train"]["over_500"], {"count": 1, "pct": 25.0})
        self.assertEqual(summary["test_pre_seal_aggregate"]["count"], 3)
        self.assertEqual(len(summary["figures"]), 6)
        for name in summary["figures"]:
            self.assertTrue((self.out / name).read_text(encoding="utf-8").startswith("<svg"))

    def test_test_path_is_not_accepted(self):
        with self.assertRaises(PermissionError):
            load_split(self.splits, "test")
        with self.assertRaises(PermissionError):
            guard_path(self.splits / "test.jsonl")
        with self.assertRaises(PermissionError):
            run(self.splits, self.splits / "test.jsonl", CONFIG, self.out)

    def test_output_contains_no_raw_text(self):
        run(self.splits, self.evidence, CONFIG, self.out)
        written = "".join(path.read_text(encoding="utf-8") for path in self.out.iterdir())
        for record in self.train + self.validation:
            self.assertNotIn(record["text"], written)
            self.assertNotIn(record["news_title"], written)
        summary = json.loads((self.out / "summary.json").read_text(encoding="utf-8"))
        keys = set()

        def walk(node):
            if isinstance(node, dict):
                keys.update(node)
                for value in node.values():
                    walk(value)

        walk(summary)
        self.assertFalse(keys & {"text", "comments", "news_title", "title"})

    def test_unexpected_label_or_mismatch_is_rejected(self):
        write_jsonl(self.splits / "validation.jsonl", [row(10, "v", "profanity"), row(11, "v", "none")])
        with self.assertRaises(ValueError):
            run(self.splits, self.evidence, CONFIG, self.out)
        write_jsonl(self.splits / "validation.jsonl", [row(10, "v", "none"), row(11, "v", "none")])
        with self.assertRaises(ValueError):
            run(self.splits, self.evidence, CONFIG, self.out)


if __name__ == "__main__":
    unittest.main()
