"""AI-05 preprocessing v1 on synthetic Unicode fixtures only."""

import unicodedata
import unittest

from verimod_ai.data.preprocessing import (
    MAX_CODE_POINTS, PREPROCESSING_VERSION, preprocess_sample, preprocess_text,
)
from verimod_ai.data.schema import NativeSample


class PreprocessingTests(unittest.TestCase):
    def check_full(self, text):
        result = preprocess_text("s", text)
        self.assertEqual(result.input_status, "FULL")
        self.assertEqual(result.processed_text, text)
        self.assertEqual(result.original_length_codepoints, len(text))
        self.assertEqual(result.processed_length_codepoints, len(text))
        return result

    def test_ascii_korean_and_emoji_under_limit_are_full(self):
        self.check_full("plain ascii text")
        self.check_full("한국어 댓글 예시입니다")
        result = self.check_full("이모지 😀 포함 👍🏽")
        self.assertEqual(result.original_length_codepoints, 11)  # code points; UTF-16 units would be 14

    def test_exactly_limit_is_full(self):
        self.check_full("가" * MAX_CODE_POINTS)

    def test_one_over_limit_is_truncated_to_head(self):
        text = "가" * MAX_CODE_POINTS + "끝"
        result = preprocess_text("s", text)
        self.assertEqual(result.input_status, "TRUNCATED")
        self.assertEqual(result.processed_length_codepoints, MAX_CODE_POINTS)
        self.assertEqual(result.original_length_codepoints, MAX_CODE_POINTS + 1)
        self.assertEqual(result.processed_text, text[:MAX_CODE_POINTS])

    def test_emoji_beyond_bmp_counts_as_one_code_point(self):
        text = "😀" * (MAX_CODE_POINTS + 1)
        result = preprocess_text("s", text)
        self.assertEqual(result.input_status, "TRUNCATED")
        self.assertEqual(result.processed_text, "😀" * MAX_CODE_POINTS)

    def test_source_string_not_mutated(self):
        text = "원문  유지!! 😀\n" * 60
        before = str(text)
        preprocess_text("s", text)
        self.assertEqual(text, before)
        sample = NativeSample("s-1", text, ("none",), "synthetic")
        result = preprocess_sample(sample)
        self.assertEqual(sample.text, before)
        self.assertEqual(result.source_dataset, "synthetic")

    def test_punctuation_emoji_whitespace_and_case_preserved(self):
        text = "WoW!!  ...  ㅋㅋㅋ\t\t😀😀  ?!  \n\n끝"
        self.assertEqual(preprocess_text("s", text).processed_text, text)

    def test_no_implicit_unicode_normalization(self):
        decomposed = unicodedata.normalize("NFD", "한글")  # conjoining jamo
        compat = "ｆｕｌｌ①ﬁ"  # changes under NFKC
        for text in (decomposed, compat):
            result = preprocess_text("s", text)
            self.assertEqual(result.processed_text, text)
            self.assertNotEqual(result.processed_text, unicodedata.normalize("NFKC", text))

    def test_version_is_stable_and_recorded(self):
        self.assertEqual(PREPROCESSING_VERSION, "verimod-ko-text-v1")
        self.assertEqual(MAX_CODE_POINTS, 500)
        self.assertEqual(preprocess_text("s", "x").preprocessing_version, PREPROCESSING_VERSION)

    def test_output_has_no_policy_or_protocol_fields(self):
        fields = set(preprocess_text("s", "x").__dataclass_fields__)
        self.assertEqual(fields, {"sample_id", "processed_text", "input_status", "original_length_codepoints",
                                  "processed_length_codepoints", "preprocessing_version", "source_dataset"})

    def test_non_string_rejected(self):
        with self.assertRaises(TypeError):
            preprocess_text("s", b"bytes")


if __name__ == "__main__":
    unittest.main()
