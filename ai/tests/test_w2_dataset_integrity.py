"""Synthetic fixtures only; no official dataset records are committed here."""

from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from prepare_w2_dataset import (  # noqa: E402
    allocate, assert_no_overlap, build_groups, deduplicate, normalize,
    parse_source, prepare, sha256,
)


def sample(index: int, label: str, *, text: str | None = None, title: str | None = None) -> dict:
    return {"record_id": f"train:{index:06d}", "text": text or f"synthetic item {index}",
            "title": title or f"synthetic title {index}", "label": label,
            "bias": "none", "contain_gender_bias": False}


class DatasetIntegrityTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def fixture(self, *, bad_label=False, bad_title_count=False, malformed=False):
        source = self.root / "source"
        (source / "labeled").mkdir(parents=True)
        (source / "news_title").mkdir()
        hashes = {}
        for split, size in (("train", 24), ("dev", 6)):
            header = "comments\tcontain_gender_bias\tbias\thate\n"
            rows = []
            titles = []
            for i in range(size):
                label = ("hate", "offensive", "none")[i % 3]
                if bad_label and split == "dev" and i == 0:
                    label = "unapproved"
                comment = f"synthetic {split} sample {i:03d}"
                if malformed and split == "dev" and i == 0:
                    rows.append(f"{comment}\tFalse\tnone\n")
                else:
                    rows.append(f"{comment}\tFalse\tnone\t{label}\n")
                titles.append(f"synthetic title {split} {i:03d}\n")
            if bad_title_count and split == "dev":
                titles.pop()
            paths = {f"labeled/{split}.tsv": (header + "".join(rows)).encode(),
                     f"news_title/{split}.news_title.txt": "".join(titles).encode()}
            for name, data in paths.items():
                dest = source / name
                dest.write_bytes(data)
                hashes[name] = sha256(data)
        for name in ("README.md", "LICENSE.md"):
            data = f"synthetic {name}\n".encode()
            (source / name).write_bytes(data)
            hashes[name] = sha256(data)
        config = {"dataset": "synthetic fixture", "repository": "not-used/synthetic",
                  "revision": "synthetic-revision", "license": "synthetic",
                  "source_sha256": hashes, "official_rows": {"train": 24, "dev": 6},
                  "seed": 45126, "ratios": {"train": .70, "validation": .15, "test": .15},
                  "normalization_version": "synthetic-v1", "split_algorithm": "group-greedy-class-aware-v1",
                  "near_duplicate": {"minimum_characters": 1000, "jaccard_threshold": .9,
                                     "maximum_posting_visits": 100}}
        return source, config

    def test_source_count_columns_and_alignment(self):
        source, config = self.fixture()
        records, evidence = parse_source(source, config)
        self.assertEqual(len(records), 30)
        self.assertEqual(evidence["dev"]["title_alignment"], "PASS")

    def test_unexpected_native_label_rejected(self):
        source, config = self.fixture(bad_label=True)
        with self.assertRaisesRegex(ValueError, "Unexpected native hate label"):
            parse_source(source, config)

    def test_title_row_mismatch_rejected(self):
        source, config = self.fixture(bad_title_count=True)
        with self.assertRaisesRegex(ValueError, "Labeled/title row mismatch"):
            parse_source(source, config)

    def test_malformed_row_rejected(self):
        source, config = self.fixture(malformed=True)
        with self.assertRaisesRegex(ValueError, "Missing/malformed"):
            parse_source(source, config)

    def test_exact_and_normalized_duplicates(self):
        rows = [sample(1, "hate", text="같은 문장"),
                sample(2, "hate", text="같은 문장"),
                sample(3, "hate", text="같은  문장")]
        kept, result = deduplicate(rows)
        self.assertEqual(len(kept), 1)
        self.assertEqual(result["exact_duplicate_excess"], 1)
        self.assertEqual(result["normalized_duplicate_excess"], 2)
        self.assertEqual(result["same_label_removed"], 2)

    def test_conflicting_duplicate_quarantine(self):
        rows = [sample(1, "hate", text="충돌 문장"), sample(2, "offensive", text="충돌  문장")]
        kept, result = deduplicate(rows)
        self.assertFalse(kept)
        self.assertEqual(result["conflicting_quarantined"], 2)
        self.assertEqual(result["conflicting_label_combinations"], {"hate+offensive": 2})

    def test_exact_normalized_and_group_overlap_detection(self):
        cases = [
            (sample(1, "hate", text="exact", title="one"), sample(2, "none", text="exact", title="two"), "text"),
            (sample(1, "hate", text="same  text", title="one"), sample(2, "none", text="same text", title="two"), "normalized"),
            (sample(1, "hate", text="first", title="same title"), sample(2, "none", text="second", title="same title"), "title"),
        ]
        for a, b, kind in cases:
            with self.subTest(kind=kind), self.assertRaisesRegex(ValueError, kind):
                assert_no_overlap({"train": [a], "validation": [b], "test": []})

    def test_group_atomicity_and_seed_membership(self):
        source, config = self.fixture()
        records, _ = parse_source(source, config)
        groups, _ = build_groups(records, config["near_duplicate"])
        first = allocate(groups, config)
        second = allocate(groups, config)
        self.assertEqual({key: [r["record_id"] for r in value] for key, value in first.items()},
                         {key: [r["record_id"] for r in value] for key, value in second.items()})
        self.assertEqual(assert_no_overlap(first)["title_group_overlap"], 0)

    def test_title_and_near_duplicate_links_are_atomic(self):
        base = "abcdefghijklmnopqrstuvwx" * 5
        rows = [sample(1, "hate", text=base, title="repeated title"),
                sample(2, "hate", text=base[:-1] + "y", title="other title"),
                sample(3, "none", text="unrelated", title="repeated title")]
        groups, result = build_groups(rows, {"minimum_characters": 12,
                                             "jaccard_threshold": .9,
                                             "maximum_posting_visits": 10000})
        self.assertEqual(len(groups), 1)
        self.assertEqual(result["near_duplicate"]["matched_pairs"], 1)

    def test_test_artifact_hash_reproducible_without_reopening(self):
        source, config = self.fixture()
        first = prepare(config, source, self.root / "run-one", download=False)
        second = prepare(config, source, self.root / "run-two", download=False)
        self.assertEqual(first["test_seal"]["sha256"], second["test_seal"]["sha256"])
        self.assertEqual(first["split"]["actual"], second["split"]["actual"])
        with self.assertRaises(FileExistsError):
            prepare(config, source, self.root / "run-one", download=False)

    def test_normalization_v1_preserves_punctuation_and_emoji(self):
        self.assertEqual(normalize(" A\r\n\tB!😀 "), "A B!😀")
        # NFC's canonical composition is required; no extra compatibility conversion.
        self.assertEqual(normalize("가"), "가")


if __name__ == "__main__":
    unittest.main()
