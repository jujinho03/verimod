"""Offline selected-model inference on exactly three authored synthetic inputs."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'ai/src'))
from verimod_ai.inference.w3_handoff import RUN_ID, SOURCE_SNAPSHOT, ARTIFACT_SHA, score_to_ppm, validate_i1
from verimod_ai.data.preprocessing import preprocess_text
from verimod_ai.data.taxonomy import NATIVE_TARGET, SCORE_KEYS, TAXONOMY_ID, TAXONOMY_VERSION
from verimod_ai.training.reproducibility import seed_runtime
from verimod_ai.training.metrics import score_array

def load(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default='ai/fixtures/w3_real_model_i1_fixture.json')
    parser.add_argument('--compare')
    args = parser.parse_args()
    def guard(event, values):
        if event in ('open', 'os.listdir', 'os.scandir') and values and 'verimod-local-data' in str(values[0]).lower():
            raise PermissionError('Synthetic fixture generator cannot access dataset')
    sys.addaudithook(guard)
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'
    import torch
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    cfg = load(ROOT / 'ai/configs/w3_baseline.json')
    selected = ROOT / cfg['artifact_path'] / 'selected_model'
    with (selected / 'model.safetensors').open('rb') as file:
        if hashlib.file_digest(file, 'sha256').hexdigest() != ARTIFACT_SHA:
            raise ValueError('Selected artifact SHA mismatch')
    manifest_rel = f'ai/artifacts/manifests/{RUN_ID}.model_manifest.json'
    input_rel = 'ai/fixtures/w3_synthetic_inputs.json'
    inputs = load(ROOT / input_rel)
    if len(inputs) != 3:
        raise ValueError('Exactly three synthetic fixtures required')
    cmd = ['node', 'backend/node_modules/tsx/dist/cli.mjs', 'ai/scripts/w3_protocol_bridge.mts', manifest_rel, input_rel]
    bridge = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, encoding='utf-8', check=True)
    protocol = json.loads(bridge.stdout)
    controls = seed_runtime(cfg)
    tokenizer = AutoTokenizer.from_pretrained(cfg['tokenizer_id'], revision=cfg['tokenizer_revision'],
        cache_dir=str(ROOT / cfg['source_cache_path']), local_files_only=True,
        trust_remote_code=False, use_fast=cfg['use_fast_tokenizer'])
    tokenizer.truncation_side = cfg['tokenizer_truncation_side']
    tokenizer.padding_side = cfg['padding_side']
    model = AutoModelForSequenceClassification.from_pretrained(selected, local_files_only=True, trust_remote_code=False).to('cpu').eval()
    if model.config.id2label != dict(enumerate(NATIVE_TARGET)) or model.config.label2id != cfg['label2id']:
        raise ValueError('Selected model label mapping mismatch')
    processed = [preprocess_text(row['fixture_id'], row['synthetic_text']) for row in inputs]
    lengths = [len(tokenizer(item.processed_text, truncation=False)['input_ids']) for item in processed]
    encoded = tokenizer([item.processed_text for item in processed], padding=True, truncation=True,
                        max_length=cfg['max_length'], return_tensors='pt')
    with torch.inference_mode():
        logits = model(**encoded).logits.cpu().numpy()
    scores = score_array(logits)
    now = datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z')
    results = []
    for i, (row, item) in enumerate(zip(inputs, processed)):
        native = {label: float(scores[i, j]) for j, label in enumerate(NATIVE_TARGET)}
        ppm = {label: score_to_ppm(value) for label, value in native.items()}
        status = 'TRUNCATED' if item.input_status == 'TRUNCATED' or lengths[i] > cfg['max_length'] else 'FULL'
        output = {'output_version': 'inference/1',
            'inference_id': f'4512600{i+1}-0000-4000-8000-00000000000{i+1}',
            'content_commitment': protocol['content_commitments'][i]['content_commitment'],
            'model_manifest_hash': protocol['model_manifest_hash'], 'taxonomy_id': TAXONOMY_ID,
            'taxonomy_version': TAXONOMY_VERSION, 'scores_ppm': {k: ppm[k] for k in SCORE_KEYS},
            'score_semantics': 'UNCALIBRATED', 'input_status': status, 'evidence': [], 'inferred_at': now}
        response = {'ok': True, 'request_id': row['fixture_id'], 'inference': output}
        validate_i1(response)
        results.append({**row, 'preprocessing_version': cfg['preprocessing_version'], 'input_status': status,
            'predicted_native_class': NATIVE_TARGET[int(scores[i].argmax())],
            'raw_logits': [float(x) for x in logits[i]], 'native_scores': native, 'native_scores_ppm': ppm,
            'score_semantics': 'UNCALIBRATED', 'token_length_before_truncation': lengths[i],
            'synthetic_public_salt': protocol['content_commitments'][i]['synthetic_public_salt'],
            'i1_response': response})
    fixture = {'fixture_type': 'REAL_MODEL_OUTPUT_FIXTURE', 'execution_mode': 'OFFLINE_SELECTED_MODEL',
        'live_inference': False, 'run_id': RUN_ID, 'source_snapshot_commit': SOURCE_SNAPSHOT,
        'model_artifact_sha256': ARTIFACT_SHA, 'model_manifest': manifest_rel,
        'model_manifest_hash': protocol['model_manifest_hash'], 'manifest_hash_mechanism': protocol,
        'manifest_file_sha256': hashlib.sha256((ROOT / manifest_rel).read_bytes()).hexdigest(),
        'score_semantics': 'UNCALIBRATED', 'generated_at': now, 'input_source': 'AI_AUTHORED_SYNTHETIC',
        'source_dataset': None, 'test_accessed': False, 'secondary_accessed': False,
        'supported_labels': list(SCORE_KEYS), 'native_classes': list(NATIVE_TARGET),
        'runtime': {'device': 'cpu', 'torch': torch.__version__, 'batch_size': 3,
                    'parameter_count': sum(p.numel() for p in model.parameters()), 'seed_controls': controls},
        'salt_boundary': 'Public deterministic salts for synthetic fixture only; F supplies a fresh commitment on real issuance',
        'results': results}
    if args.compare:
        prior = load(ROOT / args.compare)
        differences = []
        for old, new in zip(prior['results'], results):
            for key in ('predicted_native_class', 'native_scores_ppm', 'input_status', 'native_scores', 'raw_logits'):
                if old[key] != new[key]: differences.append([new['fixture_id'], key])
        if prior['model_manifest_hash'] != fixture['model_manifest_hash']: differences.append(['manifest'])
        if differences: raise ValueError('Same-environment fixture divergence: ' + repr(differences))
        report = {'run_id': RUN_ID, 'status': 'PASS', 'independent_process_runs': 2,
            'predicted_classes_equal': True, 'scores_ppm_equal': True, 'native_scores_exact_equal': True,
            'logits_exact_equal': True, 'input_status_equal': True, 'manifest_reference_equal': True,
            'tolerance_used': False, 'max_score_absolute_difference': 0,
            'cross_machine_verification': 'NOT_EXECUTED', 'test_accessed': False, 'secondary_accessed': False}
        report_path = ROOT / 'ai/artifacts/reports/w3_handoff/fixture_reproducibility.json'
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8', newline='\n')
    out = ROOT / args.output
    if out.exists(): raise FileExistsError('Preserve existing fixture; choose a different output')
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(fixture, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8', newline='\n')
    print(json.dumps({'output': args.output, 'model_manifest_hash': fixture['model_manifest_hash'],
                      'predicted': [row['predicted_native_class'] for row in results], 'repeat_match': bool(args.compare)}, ensure_ascii=False))

if __name__ == '__main__': main()
