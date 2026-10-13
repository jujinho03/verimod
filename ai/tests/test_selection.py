"""AI-06 selection skeleton on synthetic validation candidates; no real threshold is chosen."""

import unittest

from verimod_ai.evaluation.policy_metrics import PolicyMetrics
from verimod_ai.evaluation.selection import Candidate, select_candidate

X, B = 0.10, 0.20  # synthetic bounds for the test only; real X/B are UNRESOLVED


def cand(cid, frr, rp, har, hrr, split="validation"):
    return Candidate(cid, split, PolicyMetrics(100, 50, 50, 10, frr, rp, har, hrr))


class SelectionTests(unittest.TestCase):
    def test_constraint_filtering(self):
        chosen = select_candidate([cand("frr-too-high", 0.2, 0.9, 0.01, 0.1),
                                   cand("hrr-too-high", 0.05, 0.9, 0.02, 0.3),
                                   cand("ok", 0.05, 0.8, 0.30, 0.1)], max_frr=X, max_hrr_total=B)
        self.assertEqual(chosen.candidate_id, "ok")

    def test_minimum_har(self):
        chosen = select_candidate([cand("a", 0.05, 0.9, 0.30, 0.1), cand("b", 0.05, 0.7, 0.20, 0.15)],
                                  max_frr=X, max_hrr_total=B)
        self.assertEqual(chosen.candidate_id, "b")

    def test_rp_tie_break(self):
        chosen = select_candidate([cand("low-rp", 0.05, 0.6, 0.2, 0.1), cand("high-rp", 0.05, 0.9, 0.2, 0.1),
                                   cand("no-rp", 0.05, None, 0.2, 0.1)], max_frr=X, max_hrr_total=B)
        self.assertEqual(chosen.candidate_id, "high-rp")

    def test_hrr_total_second_tie_break(self):
        chosen = select_candidate([cand("more-review", 0.05, 0.9, 0.2, 0.18),
                                   cand("less-review", 0.05, 0.9, 0.2, 0.08)], max_frr=X, max_hrr_total=B)
        self.assertEqual(chosen.candidate_id, "less-review")

    def test_no_feasible_candidate(self):
        self.assertIsNone(select_candidate([cand("a", 0.5, 0.9, 0.1, 0.1), cand("b", 0.05, 0.9, None, 0.1)],
                                           max_frr=X, max_hrr_total=B))
        self.assertIsNone(select_candidate([], max_frr=X, max_hrr_total=B))

    def test_validation_only_and_explicit_bounds(self):
        with self.assertRaises(PermissionError):
            select_candidate([cand("t", 0.05, 0.9, 0.1, 0.1, split="test")], max_frr=X, max_hrr_total=B)
        with self.assertRaises(ValueError):
            select_candidate([], max_frr=1.5, max_hrr_total=B)
        with self.assertRaises(TypeError):
            select_candidate([])  # X and B have no defaults


if __name__ == "__main__":
    unittest.main()
