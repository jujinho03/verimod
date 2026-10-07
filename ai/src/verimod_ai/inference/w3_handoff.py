"""Actual BEEP fixture boundary, reusing I1 keys without policy generation."""
import math
import re
from datetime import datetime
from verimod_ai.data.taxonomy import NATIVE_TARGET, SCORE_KEYS, TAXONOMY_ID, TAXONOMY_VERSION
from verimod_ai.inference.contract import InferenceOutput, InferenceSuccess
from verimod_ai.data.preprocessing import PREPROCESSING_VERSION

RUN_ID = 'AI07-BL-KLUE-RB-45126-R01'
SOURCE_SNAPSHOT = 'f6b39d3b7c5637b68e18c2b1b59ee91890c059f0'
BASE_HEAD = '09d72598dcd1d6744d4c80b99af0721d4c1efedc'
ARTIFACT_SHA = 'a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f'
REVISION = '02f94ba5e3fcb7e2a58a390b8639b0fac974a8da'
DATASET_REVISION = 'f8d05dce2b22007bb149e5139c0060c68ad8f94b'
PPM_RULE = 'floor(score * 1_000_000 + 0.5)'
HEX = re.compile(r'^0x[0-9a-f]{64}$')
UUID = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')

def require(condition, message):
    if not condition:
        raise ValueError(message)

def score_to_ppm(score):
    """Exactly one independent rounding at the Python boundary; no sum repair."""
    require(type(score) in (float, int) and math.isfinite(score) and 0 <= score <= 1, 'Invalid model score')
    return math.floor(score * 1_000_000 + 0.5)

def validate_i1(value):
    require(set(value) == set(InferenceSuccess.__required_keys__), 'I1 success keys')
    require(value['ok'] is True and isinstance(value['request_id'], str) and bool(value['request_id']), 'I1 envelope')
    output = value['inference']
    require(set(output) == set(InferenceOutput.__required_keys__), 'I1 output keys')
    require(output['output_version'] == 'inference/1', 'I1 version')
    require(bool(UUID.fullmatch(output['inference_id'])), 'I1 inference UUID')
    require(all(bool(HEX.fullmatch(output[key])) for key in ('content_commitment', 'model_manifest_hash')), 'I1 hashes')
    require((output['taxonomy_id'], output['taxonomy_version']) == (TAXONOMY_ID, TAXONOMY_VERSION), 'Actual taxonomy')
    require(set(output['scores_ppm']) == set(SCORE_KEYS), 'Only actual harmful score keys')
    require(all(type(x) is int and 0 <= x <= 1_000_000 for x in output['scores_ppm'].values()), 'PPM range/type')
    require(output['score_semantics'] == 'UNCALIBRATED', 'Score semantics')
    require(output['input_status'] in ('FULL', 'TRUNCATED'), 'Input status')
    require(output['evidence'] == [], 'Fixture has no fabricated attribution')
    require(bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z', output['inferred_at'])), 'Timestamp format')
    datetime.fromisoformat(output['inferred_at'].replace('Z', '+00:00'))
    return True

def validate_package(registry, manifest, fixture):
    require(len(registry) == 1 and registry[0]['run_id'] == RUN_ID, 'Unique first official R01')
    entry = registry[0]
    required_registry = ('executed_at task execution_base_head source_commit_at_execution source_snapshot_commit '
        'provenance_status provenance_limitation model_id model_revision tokenizer_id tokenizer_revision '
        'dataset_name dataset_revision split_seed train_count validation_count train_sha256 validation_sha256 '
        'preprocessing_version max_length native_labels exposed_score_keys reference_class seed epochs '
        'learning_rate weight_decay warmup_ratio scheduler max_grad_norm train_batch_size eval_batch_size '
        'gradient_accumulation_steps effective_batch_size class_weighting selection_split selection_metric '
        'selected_step metrics latency_summary artifact_path artifact_sha256 score_semantics test_access '
        'secondary_dataset_access decision decision_reason').split()
    require(all(k in entry for k in required_registry), 'Registry required fields')
    required_manifest = ('manifest_type manifest_version model_id model_revision tokenizer_id tokenizer_revision '
        'architecture parameter_count artifact_type artifact_sha256 dataset_name dataset_revision split_seed '
        'preprocessing_version native_classes exposed_score_keys reference_class score_semantics score_to_ppm_rule '
        'max_length truncation_rule training_seed evaluation_split evaluation_n evaluation_metrics '
        'execution_base_head source_snapshot_commit dependency_lock_sha256 baseline_config_sha256 test_status limitations').split()
    require(all(k in manifest for k in required_manifest), 'Manifest required fields')
    for record in (entry, manifest, fixture):
        require(record['run_id'] == RUN_ID and record['source_snapshot_commit'] == SOURCE_SNAPSHOT, 'Run/source identity')
        require(record['score_semantics'] == 'UNCALIBRATED', 'UNCALIBRATED required')
    for record in (entry, manifest):
        require(record['source_commit_at_execution'] is None and record['execution_base_head'] == BASE_HEAD, 'Truthful execution provenance')
        require(record['artifact_sha256'] == ARTIFACT_SHA, 'Artifact hash')
        require(record['model_revision'] == record['tokenizer_revision'] == REVISION, 'Pinned revisions')
        require(record['dataset_revision'] == DATASET_REVISION, 'Dataset revision')
        require(record['reference_class'] == 'none' and record['exposed_score_keys'] == list(SCORE_KEYS), 'Score/reference split')
    require(entry['native_labels'] == manifest['native_classes'] == list(NATIVE_TARGET), 'Native taxonomy')
    require(entry['test_access'] == manifest['test_status'] == 'SEALED', 'Sealed TEST')
    require(entry['secondary_dataset_access'] == 'NOT_ACCESSED', 'Primary only')
    require(entry['provenance_status'] == 'PASS_WITH_DOCUMENTED_LIMITATION', 'Provenance limitation')
    require(entry['decision'] == 'KEEP_AS_W3_BASELINE', 'No final model/LOCK claim')
    require(entry['selected_step'] == 1101 and entry['metrics']['macro_f1'] == 0.6524599868976999, 'Approved metrics/step')
    require(entry['metrics']['micro_f1'] == entry['metrics']['accuracy'] == 0.6629482071713148, 'Approved metrics')
    require(manifest['score_to_ppm_rule'] == PPM_RULE, 'Single boundary rounding rule')
    require(manifest['evaluation_split'] == 'validation' and manifest['evaluation_n'] == 1255, 'Validation provenance')
    for key in ('macro_f1', 'micro_f1', 'accuracy'):
        require(manifest['evaluation_metrics'][key] == str(entry['metrics'][key]), 'Decimal metric preservation')
    require(fixture['fixture_type'] == 'REAL_MODEL_OUTPUT_FIXTURE' and fixture['execution_mode'] == 'OFFLINE_SELECTED_MODEL', 'Fixture kind')
    require(fixture['live_inference'] is False and fixture['test_accessed'] is False and fixture['secondary_accessed'] is False, 'Fixture boundary')
    require(fixture['model_artifact_sha256'] == ARTIFACT_SHA, 'Fixture artifact')
    require(fixture['runtime']['parameter_count'] == manifest['parameter_count'] == 110620419, 'Actual parameter count')
    require(fixture['source_dataset'] is None and fixture['input_source'] == 'AI_AUTHORED_SYNTHETIC', 'No BEEP input provenance')
    require(bool(HEX.fullmatch(fixture['model_manifest_hash'])), 'Manifest canonical hash')
    require(len(fixture['results']) == 3 and len({x['fixture_id'] for x in fixture['results']}) == 3, 'Three unique fixtures')
    for row in fixture['results']:
        require(row['preprocessing_version'] == PREPROCESSING_VERSION, 'Preprocessing version')
        require(len(row['raw_logits']) == 3 and all(type(v) in (float, int) and math.isfinite(v) for v in row['raw_logits']), 'Finite three-class logits')
        require(row['synthetic_text'] and 'expected_label' not in row, 'Synthetic input without forced expected labels')
        require(row['predicted_native_class'] in NATIVE_TARGET, 'Native predicted class')
        require(row['score_semantics'] == 'UNCALIBRATED', 'Row semantics')
        require(set(row['native_scores']) == set(row['native_scores_ppm']) == set(NATIVE_TARGET), 'Three native scores')
        for label, score in row['native_scores'].items():
            require(type(row['native_scores_ppm'][label]) is int and 0 <= row['native_scores_ppm'][label] <= 1_000_000, 'Native PPM type/range')
            require(row['native_scores_ppm'][label] == score_to_ppm(score), 'Exact independent PPM rounding')
        require(row['predicted_native_class'] == max(row['native_scores'], key=row['native_scores'].get), 'Argmax class')
        validate_i1(row['i1_response'])
        output = row['i1_response']['inference']
        require(output['scores_ppm'] == {k: row['native_scores_ppm'][k] for k in SCORE_KEYS}, 'No downstream rerounding')
        require(output['input_status'] == row['input_status'], 'Preprocessing status')
        require(output['model_manifest_hash'] == fixture['model_manifest_hash'], 'Manifest reference')
    return True
