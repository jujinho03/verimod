"""W4 policy metrics and boundary evidence; synthetic rows, never private datasets."""
import json
from pathlib import Path
import pytest
from verimod_ai.evaluation.w4_policy import evaluate, summarize, boundary_vectors

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'ai/artifacts/reports/w4_a_validation/20261016'
MANIFEST = json.loads((PUBLIC / 'policy_manifest.json').read_text())
CONFIG = MANIFEST['thresholds_ppm']
HASH = json.loads((PUBLIC / 'policy_hash.json').read_text())['policy_manifest_hash']


def test_truncation_overrides_both_restrictions():
    result = evaluate({'hate': 1_000_000, 'offensive': 1_000_000}, 'TRUNCATED', CONFIG, HASH)
    assert result == {'policy_manifest_hash': HASH, 'action': 'HUMAN_REVIEW',
                      'reason_codes': ['INPUT_TRUNCATED'], 'triggered_rule_ids': ['W4-TRUNCATED']}


def test_restriction_precedes_review_and_reports_only_winning_band():
    result = evaluate({'hate': CONFIG['hate']['review'], 'offensive': CONFIG['offensive']['restrict']}, 'FULL', CONFIG, HASH)
    assert result['action'] == 'RESTRICT'
    assert result['reason_codes'] == ['SCORE_OFFENSIVE_RESTRICT']
    assert result['triggered_rule_ids'] == ['W4-OFFENSIVE-RESTRICT']


def test_all_boundary_expected_values_match_fixed_node_evidence():
    vectors = boundary_vectors(CONFIG, HASH)
    recorded = json.loads((PUBLIC / 'policy_vectors.json').read_text())['vectors']
    node = json.loads((PUBLIC / 'policy_parity.json').read_text())
    assert len(vectors) == 21 and vectors == recorded
    assert node['status'] == 'PASS' and node['vector_count'] == 21
    for vector, result in zip(vectors, node['results']):
        assert vector['expected'] == result['actual']
        assert result['actual']['reason_codes'] == sorted(set(result['actual']['reason_codes']))
        assert result['actual']['triggered_rule_ids'] == sorted(set(result['actual']['triggered_rule_ids']))


def test_none_is_truth_proxy_not_action():
    rows = [dict(native_truth='none', scores_ppm={'hate': 1_000_000, 'offensive': 0}, input_status='FULL'),
            dict(native_truth='hate', scores_ppm={'hate': 0, 'offensive': 0}, input_status='FULL'),
            dict(native_truth='offensive', scores_ppm={'hate': 0, 'offensive': 0}, input_status='TRUNCATED')]
    result = summarize(rows, CONFIG)
    assert result['actions'] == {'ALLOW': 1, 'HUMAN_REVIEW': 1, 'RESTRICT': 1}
    assert result['metrics']['FRR'] == {'numerator': 1, 'denominator': 1, 'value': 1.0}
    assert result['metrics']['RP'] == {'numerator': 0, 'denominator': 1, 'value': 0.0}
    assert result['metrics']['HAR'] == {'numerator': 1, 'denominator': 2, 'value': 0.5}
    assert result['metrics']['HRR_TOTAL']['denominator'] == 3


def test_undefined_restriction_precision_not_zero():
    result = summarize([dict(native_truth='none', scores_ppm={'hate': 0, 'offensive': 0}, input_status='FULL')], CONFIG)
    assert result['metrics']['RP'] == {'numerator': 0, 'denominator': 0, 'value': None}
    assert result['metrics']['HAR']['value'] is None


@pytest.mark.parametrize('bad', [True, -1, 1_000_001, 0.5])
def test_reject_invalid_ppm(bad):
    with pytest.raises(ValueError):
        evaluate({'hate': bad, 'offensive': 0}, 'FULL', CONFIG, HASH)


def test_candidate_population_and_no_approval_claim():
    data = json.loads((PUBLIC / 'policy_candidates.json').read_text())
    assert data['X'] is None and data['B'] is None and data['team_approved'] is False
    assert len(data['candidates']) == 25
    for c in data['candidates']:
        assert sum(c['actions'].values()) == c['n'] == 1255
        for name, denominator in [('FRR', 547), ('HAR', 708), ('HRR_TOTAL', 1255), ('RP', c['actions']['RESTRICT'])]:
            m = c['metrics'][name]
            assert m['denominator'] == denominator
            assert m['value'] == (m['numerator'] / denominator if denominator else None)
    assert MANIFEST['policy_status'] == 'W4_PROVISIONAL' and MANIFEST['team_approved'] is False


def test_validation_matches_w3_without_test_access():
    v = json.loads((PUBLIC / 'validation.json').read_text())
    assert v['provenance']['prediction_rows'] == 1255 and v['provenance']['test_accessed'] is False
    assert v['metrics']['macro_f1'] == 0.6524599868976999
    assert v['metrics']['accuracy'] == 0.6629482071713148
    assert v['w3_comparison']['confusion_matrix_equal'] is True
