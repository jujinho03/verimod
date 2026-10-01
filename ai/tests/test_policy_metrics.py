"""AI-06 policy metrics on synthetic (label, action) fixtures only."""

import unittest

from verimod_ai.evaluation.policy_metrics import PolicyCase, policy_metrics, review_submetric

# 4 clean (none), 6 harmful (hate/offensive); actions are given, never derived.
FIXTURE = [
    PolicyCase("none", "ALLOW"), PolicyCase("none", "ALLOW"),
    PolicyCase("none", "RESTRICT"), PolicyCase("none", "HUMAN_REVIEW"),
    PolicyCase("hate", "RESTRICT"), PolicyCase("hate", "RESTRICT"), PolicyCase("hate", "ALLOW"),
    PolicyCase("offensive", "RESTRICT"), PolicyCase("offensive", "HUMAN_REVIEW"),
    PolicyCase("offensive", "ALLOW"),
]


class PolicyMetricTests(unittest.TestCase):
    def setUp(self):
        self.m = policy_metrics(FIXTURE)

    def test_counts(self):
        self.assertEqual((self.m.n_eligible, self.m.n_clean, self.m.n_harmful, self.m.n_restrict), (10, 4, 6, 4))

    def test_frr(self):
        self.assertAlmostEqual(self.m.FRR, 1 / 4)

    def test_rp(self):
        self.assertAlmostEqual(self.m.RP, 3 / 4)

    def test_har(self):
        self.assertAlmostEqual(self.m.HAR, 2 / 6)

    def test_hrr_total(self):
        self.assertAlmostEqual(self.m.HRR_TOTAL, 2 / 10)

    def test_none_label_is_not_assumed_allow(self):
        # A clean case routed to review or restriction is counted as such, not as ALLOW.
        m = policy_metrics([PolicyCase("none", "HUMAN_REVIEW"), PolicyCase("none", "RESTRICT")])
        self.assertEqual(m.FRR, 0.5)
        self.assertEqual(m.HRR_TOTAL, 0.5)
        self.assertIsNone(m.HAR)  # no harmful cases: undefined, not 0
        with self.assertRaises(ValueError):
            policy_metrics([PolicyCase("none", "NONE")])

    def test_ineligible_and_unsupported_excluded(self):
        extra = FIXTURE + [PolicyCase("sexual", "RESTRICT", eligible=False),
                           PolicyCase("none", "RESTRICT", eligible=False)]
        self.assertEqual(policy_metrics(extra), self.m)
        with self.assertRaises(ValueError):
            policy_metrics([PolicyCase("sexual", "ALLOW")])  # unsupported must be marked ineligible

    def test_undefined_when_denominator_zero(self):
        m = policy_metrics([PolicyCase("hate", "ALLOW")])
        self.assertIsNone(m.FRR)
        self.assertIsNone(m.RP)
        self.assertEqual(m.HAR, 1.0)

    def test_hrr_submetrics_unresolved(self):
        for name in ("HRR_SCORE_BAND", "HRR_TRUNCATED"):
            with self.assertRaises(NotImplementedError):
                review_submetric(name, FIXTURE)


if __name__ == "__main__":
    unittest.main()
