"""Committed metadata and synthetic fixture only; no dataset/model execution."""
from copy import deepcopy
import json
from pathlib import Path
import unittest
from verimod_ai.inference.w3_handoff import validate_package, validate_i1, score_to_ppm, RUN_ID, SOURCE_SNAPSHOT

ROOT = Path(__file__).resolve().parents[2]

class W3HandoffTests(unittest.TestCase):
    def setUp(self):
        self.registry = [json.loads(x) for x in (ROOT / 'ai/experiments/registry.jsonl').read_text(encoding='utf-8').splitlines() if x.strip()]
        self.manifest = json.loads((ROOT / f'ai/artifacts/manifests/{RUN_ID}.model_manifest.json').read_text(encoding='utf-8'))
        self.fixture = json.loads((ROOT / 'ai/fixtures/w3_real_model_i1_fixture.json').read_text(encoding='utf-8'))

    def test_complete_metadata_package(self):
        self.assertTrue(validate_package(self.registry, self.manifest, self.fixture))

    def test_registry_unique_and_required_fields(self):
        with self.assertRaises(ValueError): validate_package(self.registry * 2, self.manifest, self.fixture)
        del self.registry[0]['executed_at']
        with self.assertRaises(ValueError): validate_package(self.registry, self.manifest, self.fixture)

    def test_execution_commit_is_null_and_snapshot_preserved(self):
        self.assertIsNone(self.registry[0]['source_commit_at_execution'])
        self.assertEqual(self.registry[0]['source_snapshot_commit'], SOURCE_SNAPSHOT)
        self.registry[0]['source_commit_at_execution'] = SOURCE_SNAPSHOT
        with self.assertRaises(ValueError): validate_package(self.registry, self.manifest, self.fixture)

    def test_manifest_hash_revision_taxonomy_and_rule_mismatch_rejected(self):
        for key, bad in [('artifact_sha256', '0'*64), ('model_revision', 'main'),
                         ('dataset_revision', 'main'), ('native_classes', ['hate', 'none']),
                         ('score_to_ppm_rule', 'round(score)'), ('test_status', 'OPEN')]:
            manifest = deepcopy(self.manifest)
            manifest[key] = bad
            with self.subTest(key=key), self.assertRaises(ValueError):
                validate_package(self.registry, manifest, self.fixture)

    def test_raw_dataset_provenance_rejected(self):
        self.fixture['source_dataset'] = 'BEEP! Korean HateSpeech'
        with self.assertRaises(ValueError): validate_package(self.registry, self.manifest, self.fixture)

    def test_fixture_count_and_nonfinite_scores_rejected(self):
        fixture = deepcopy(self.fixture)
        fixture['results'].pop()
        with self.assertRaises(ValueError): validate_package(self.registry, self.manifest, fixture)
        self.fixture['results'][0]['native_scores']['hate'] = float('nan')
        with self.assertRaises(ValueError): validate_package(self.registry, self.manifest, self.fixture)

    def test_actual_i1_has_only_harmful_keys_and_no_policy(self):
        for row in self.fixture['results']:
            value = row['i1_response']
            self.assertTrue(validate_i1(value))
            self.assertEqual(set(value['inference']['scores_ppm']), {'hate', 'offensive'})
            self.assertNotIn('policy', value)
            for key in ('profanity', 'sexual', 'spam', 'violence'):
                self.assertNotIn(key, value['inference']['scores_ppm'])

    def test_legacy_extra_label_is_rejected(self):
        value = deepcopy(self.fixture['results'][0]['i1_response'])
        value['inference']['scores_ppm']['spam'] = 0
        with self.assertRaises(ValueError): validate_i1(value)

    def test_ppm_bounds_half_up_and_no_sum_repair(self):
        self.assertEqual(score_to_ppm(0), 0)
        self.assertEqual(score_to_ppm(1), 1_000_000)
        self.assertEqual(score_to_ppm(0.0000005), 1)
        self.assertEqual(sum(score_to_ppm(0.3333335) for _ in range(3)), 1_000_002)
        for value in (float('nan'), float('inf'), -0.1, 1.1, True):
            with self.subTest(value=value), self.assertRaises(ValueError): score_to_ppm(value)

    def test_ppm_and_semantics_tamper_rejected(self):
        bad = deepcopy(self.fixture)
        bad['results'][0]['native_scores_ppm']['hate'] += 1
        with self.assertRaises(ValueError): validate_package(self.registry, self.manifest, bad)
        self.fixture['score_semantics'] = 'CALIBRATED'
        with self.assertRaises(ValueError): validate_package(self.registry, self.manifest, self.fixture)

    def test_native_reference_ppm_type_and_logit_shape(self):
        bad = deepcopy(self.fixture)
        bad['results'][0]['native_scores_ppm']['none'] = float(bad['results'][0]['native_scores_ppm']['none'])
        with self.assertRaises(ValueError): validate_package(self.registry, self.manifest, bad)
        self.fixture['results'][0]['raw_logits'].pop()
        with self.assertRaises(ValueError): validate_package(self.registry, self.manifest, self.fixture)

if __name__ == '__main__': unittest.main()
