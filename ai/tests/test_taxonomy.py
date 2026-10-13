"""AI-02 A-side taxonomy boundaries. Synthetic inputs only."""

import unittest

from verimod_ai.data import taxonomy
from verimod_ai.data.label_mapping import (
    LabelMappingNotConfigured, UnsupportedNativeLabel, map_native_labels,
)

BEEP = taxonomy.PRIMARY_DATASET
DEMO_LABELS = ("hate", "profanity", "sexual", "spam", "violence")


class TaxonomyTests(unittest.TestCase):
    def test_allowed_native_labels_only(self):
        for label in taxonomy.NATIVE_TARGET:
            self.assertEqual(map_native_labels([label], source_dataset=BEEP), (label,))
        for label in ("profanity", "Hate", "", "clean", "gender"):
            with self.assertRaises(UnsupportedNativeLabel):
                map_native_labels([label], source_dataset=BEEP)

    def test_none_is_reference_not_allow(self):
        self.assertEqual(map_native_labels(["none"], source_dataset=BEEP), ("none",))
        self.assertEqual(taxonomy.REFERENCE_CLASS, "none")
        self.assertNotIn("none", taxonomy.SCORE_KEYS)
        values = set(taxonomy.NATIVE_TARGET) | set(taxonomy.SCORE_KEYS) | {taxonomy.REFERENCE_CLASS}
        self.assertFalse(values & set(taxonomy.POLICY_ACTIONS))

    def test_unsupported_labels_are_not_silently_mapped(self):
        for label in taxonomy.UNSUPPORTED:
            with self.assertRaises(UnsupportedNativeLabel):
                map_native_labels([label], source_dataset=BEEP)
        with self.assertRaises(UnsupportedNativeLabel):
            map_native_labels(["hate", "offensive"], source_dataset=BEEP)
        with self.assertRaises(LabelMappingNotConfigured):
            map_native_labels(["hate"], source_dataset="K-MHaS")

    def test_supported_taxonomy_excludes_unsupported_demo_labels(self):
        self.assertEqual(taxonomy.SCORE_KEYS, ("hate", "offensive"))
        for label in DEMO_LABELS:
            if label != "hate":
                self.assertNotIn(label, taxonomy.SCORE_KEYS)
                self.assertIn(label, taxonomy.UNSUPPORTED)
        self.assertIn("misinformation", taxonomy.UNSUPPORTED)
        self.assertEqual(taxonomy.STATUS, "PROPOSED_FOR_GATE_2")


if __name__ == "__main__":
    unittest.main()
