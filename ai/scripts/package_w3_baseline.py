"""Package preserved R01 evidence; never trains or reads a dataset."""
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'ai/src'))
from verimod_ai.inference.w3_handoff import RUN_ID, SOURCE_SNAPSHOT, BASE_HEAD, ARTIFACT_SHA, PPM_RULE

def read(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8-sig'))

def write(path, data):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8', newline='\n')

def main():
    reports = f'ai/artifacts/reports/w3_baseline_run/{RUN_ID}'
    config = read('ai/configs/w3_baseline.json')
    metrics = read(reports + '/metrics.json')
    latency = read(reports + '/latency.json')
    identity = read(reports + '/run_identity.json')
    artifacts = read(reports + '/artifact_hashes.json')
    source = read(reports + '/execution_source.json')['sha256']
    for path, expected in source.items():
        if hashlib.sha256((ROOT / path).read_bytes()).hexdigest() != expected:
            raise ValueError('Execution source divergence: ' + path)
    with (ROOT / artifacts['weight_path']).open('rb') as file:
        if hashlib.file_digest(file, 'sha256').hexdigest() != ARTIFACT_SHA:
            raise ValueError('Selected model hash mismatch')
    if metrics['macro_f1'] != 0.6524599868976999 or artifacts['selected_step'] != 1101:
        raise ValueError('R01 evidence mismatch')
    limitation = 'ai/pyproject.toml execution-time SHA-256 was not recorded; its current hash is not historical. Execution lock hash and runtime inventory are preserved.'
    entry = {
        'run_id': RUN_ID, 'executed_at': identity['training_started_at_utc'],
        'completed_at': identity['ended_at_utc'], 'task': config['task'],
        'execution_base_head': BASE_HEAD, 'source_commit_at_execution': None,
        'source_snapshot_commit': SOURCE_SNAPSHOT,
        'provenance_status': 'PASS_WITH_DOCUMENTED_LIMITATION', 'provenance_limitation': limitation,
        'model_id': config['model_id'], 'model_revision': config['model_revision'],
        'tokenizer_id': config['tokenizer_id'], 'tokenizer_revision': config['tokenizer_revision'],
        'dataset_name': config['primary_dataset'], 'dataset_revision': config['dataset_revision'],
        'split_seed': config['seed'], 'train_count': 5857, 'validation_count': 1255,
        'train_sha256': config['split_provenance']['train']['sha256'],
        'validation_sha256': config['split_provenance']['validation']['sha256'],
        **{key: config[key] for key in ('preprocessing_version', 'max_length', 'native_labels',
           'exposed_score_keys', 'reference_class', 'seed', 'epochs', 'learning_rate', 'weight_decay',
           'warmup_ratio', 'max_grad_norm', 'train_batch_size', 'eval_batch_size',
           'gradient_accumulation_steps', 'class_weighting', 'selection_split', 'selection_metric', 'score_semantics')},
        'scheduler': config['lr_scheduler'], 'effective_batch_size': config['effective_train_batch_size'],
        'optimizer': config['optimizer'], 'mixed_precision': config['mixed_precision'],
        'selected_step': artifacts['selected_step'], 'metrics': metrics,
        'latency_summary': {k: v for k, v in latency.items() if k not in ('batch_seconds', 'data_read_guard')},
        'artifact_path': artifacts['weight_path'], 'artifact_sha256': ARTIFACT_SHA,
        'test_access': 'SEALED', 'secondary_dataset_access': 'NOT_ACCESSED',
        'decision': 'KEEP_AS_W3_BASELINE',
        'decision_reason': 'First actual BEEP baseline with full validation completed and reproducible source/config evidence. Retained for W3 baseline and handoff; further model/policy comparison remains future work.',
        'dependency_lock_sha256': source['ai/requirements-w3.lock.txt'],
        'baseline_config_sha256': source['ai/configs/w3_baseline.json'],
        'environment_reference': 'ai/artifacts/reports/w3_baseline/environment.json',
    }
    registry = ROOT / 'ai/experiments/registry.jsonl'
    registry.parent.mkdir(parents=True, exist_ok=True)
    if registry.exists():
        existing = [json.loads(line) for line in registry.read_text(encoding='utf-8').splitlines() if line.strip()]
        if existing != [entry]:
            raise ValueError('Refuse to replace differing registry history')
    registry.write_text(json.dumps(entry, ensure_ascii=False, allow_nan=False) + '\n', encoding='utf-8', newline='\n')
    model_config = read(str(Path(artifacts['weight_path']).parent / 'config.json'))
    manifest = {
        'manifest_type': 'ACTUAL_TRAINED_MODEL', 'manifest_version': 'model-manifest/1',
        'run_id': RUN_ID, 'model_id': config['model_id'], 'model_revision': config['model_revision'],
        'tokenizer_id': config['tokenizer_id'], 'tokenizer_revision': config['tokenizer_revision'],
        'trust_remote_code': False, 'architecture': model_config['architectures'][0],
        'parameter_count': artifacts['parameter_count'], 'artifact_type': 'safetensors',
        'artifact_sha256': ARTIFACT_SHA, 'dataset_name': config['primary_dataset'],
        'dataset_revision': config['dataset_revision'], 'split_seed': config['seed'],
        'preprocessing_version': config['preprocessing_version'], 'native_classes': config['native_labels'],
        'label2id': config['label2id'], 'exposed_score_keys': config['exposed_score_keys'],
        'reference_class': 'none', 'reference_class_is_policy_allow': False,
        'taxonomy_id': 'verimod-ko-beep-hate', 'taxonomy_version': '1',
        'score_semantics': 'UNCALIBRATED', 'score_to_ppm_rule': PPM_RULE,
        'max_length': config['max_length'],
        'truncation_rule': 'verimod-ko-text-v1: 500 Unicode code point HEAD, then tokenizer right truncation to 128 tokens including special tokens; longest-in-batch padding',
        'training_seed': config['seed'], 'evaluation_split': 'validation', 'evaluation_n': 1255,
        'evaluation_metrics': {k: str(metrics[k]) for k in ('macro_f1', 'micro_f1', 'accuracy')},
        'evaluation_metric_encoding': 'Exact decimal strings from metrics.json; shared canonical profile permits only safe integer JSON numbers',
        'evaluation_provenance': reports + '/metrics.json',
        'execution_base_head': BASE_HEAD, 'source_commit_at_execution': None,
        'source_snapshot_commit': SOURCE_SNAPSHOT, 'provenance_status': 'PASS_WITH_DOCUMENTED_LIMITATION',
        'dependency_lock_sha256': source['ai/requirements-w3.lock.txt'],
        'baseline_config_sha256': source['ai/configs/w3_baseline.json'],
        'test_status': 'SEALED',
        'limitations': ['Validation evidence only; no TEST performance claim', 'TEST sealed and not accessed',
                       'Scores uncalibrated', 'No production fitness claim',
                       'Blockchain does not prove actual model execution',
                       'Source execution commit did not exist because R01 ran from dirty worktree',
                       limitation, 'No calibration, threshold selection, policy lock or cross-machine verification'],
    }
    path = f'ai/artifacts/manifests/{RUN_ID}.model_manifest.json'
    write(path, manifest)
    print(json.dumps({'registry': 'ai/experiments/registry.jsonl', 'manifest': path, 'artifact_sha256': ARTIFACT_SHA}))

if __name__ == '__main__':
    main()
