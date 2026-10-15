"""AI-21 validation only. Private row outputs and safe public aggregates are separate."""
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'ai/src'))
from verimod_ai.inference.service import SelectedModel, Settings, MANIFEST_HASH
from verimod_ai.inference.w3_handoff import RUN_ID, REVISION
from verimod_ai.training.dataset import load_split
from verimod_ai.training.metrics import score_array
from verimod_ai.evaluation.metrics import model_report
from verimod_ai.data.taxonomy import NATIVE_TARGET
from verimod_ai.evaluation.w4_policy import summarize


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8', newline='\n')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--splits-dir', required=True)
    parser.add_argument('--private-dir', required=True)
    parser.add_argument('--public-dir', required=True)
    args = parser.parse_args()
    start = time.perf_counter()
    split_dir = Path(os.path.abspath(args.splits_dir))
    allowed = split_dir / 'validation.jsonl'
    def guard(event, values):
        if event in ('os.listdir', 'os.scandir') and values and 'verimod-local-data' in str(values[0]).lower():
            raise PermissionError('No dataset enumeration')
        if event == 'open' and isinstance(values[0], (str, bytes, os.PathLike)):
            path = Path(os.path.abspath(os.fsdecode(values[0])))
            if path.is_relative_to(split_dir) and path != allowed:
                raise PermissionError('VALIDATION is the only allowed data file')
    sys.addaudithook(guard)
    private, public = Path(args.private_dir), Path(args.public_dir)
    # A private ignored directory is mandatory; never write raw predictions to a public path.
    import subprocess
    if subprocess.run(['git', 'check-ignore', '-q', str(private / 'predictions.jsonl')], cwd=ROOT).returncode != 0:
        raise PermissionError('Private output must be ignored by Git')
    if (private / 'predictions.jsonl').exists() or (public / 'validation.json').exists():
        raise FileExistsError('Preserve existing experiment evidence')
    os.environ['HF_HUB_OFFLINE'] = os.environ['TRANSFORMERS_OFFLINE'] = '1'
    cfg = json.loads((ROOT / 'ai/configs/w3_baseline.json').read_text())
    dc = json.loads((ROOT / 'ai/configs/w2_dataset.json').read_text())
    rows = load_split(split_dir, 'validation', training=False, baseline=cfg, dataset_config=dc)
    engine = SelectedModel(Settings())
    native_logits = []
    hook = engine.model.register_forward_hook(lambda _module, _inputs, output: native_logits.append(output.logits.detach().cpu().numpy()))
    predictions = []
    for index, row in enumerate(rows):
        # Exact AI-09 path and batch size 1, including preprocessing and PPM conversion.
        ppm, status = engine.predict(row['text'])
        logits = native_logits.pop()
        native = score_array(logits)[0]
        predictions.append({'local_row': index, 'native_truth': row['label'],
                            'native_prediction': NATIVE_TARGET[int(native.argmax())],
                            'native_scores': {k: float(native[j]) for j, k in enumerate(NATIVE_TARGET)},
                            'raw_logits': [float(x) for x in logits[0]], 'scores_ppm': ppm,
                            'input_status': status})
        if (index + 1) % 100 == 0:
            print(json.dumps({'processed': index + 1, 'total': len(rows)}), flush=True)
    hook.remove()
    report = model_report([r['native_truth'] for r in predictions], [r['native_prediction'] for r in predictions])
    report['accuracy'] = report['micro_f1']
    official = json.loads((ROOT / f'ai/artifacts/reports/w3_baseline_run/{RUN_ID}/metrics.json').read_text())
    comparison = {'official_macro_f1': official['macro_f1'], 'macro_f1_delta': report['macro_f1'] - official['macro_f1'],
                  'official_accuracy': official['accuracy'], 'accuracy_delta': report['accuracy'] - official['accuracy'],
                  'confusion_matrix_equal': [[report['confusion_matrix'][t][p] for p in NATIVE_TARGET] for t in NATIVE_TARGET] == official['confusion_matrix']}
    if not comparison['confusion_matrix_equal']:
        # Diagnostic W3 batch=8 path, same selected weights and preprocessing. No training.
        import torch
        from verimod_ai.data.preprocessing import preprocess_text
        batch_predictions = []
        for offset in range(0, len(rows), 8):
            texts = [preprocess_text('diagnostic', r['text']).processed_text for r in rows[offset:offset+8]]
            encoded = engine.tokenizer(texts, padding=True, truncation=True, max_length=128, return_tensors='pt')
            with torch.inference_mode():
                logits = engine.model(**encoded).logits.cpu().numpy()
            batch_predictions.extend(NATIVE_TARGET[int(i)] for i in logits.argmax(axis=1))
        diagnostic = model_report([r['label'] for r in rows], batch_predictions)
        comparison['batch8_diagnostic'] = diagnostic
        comparison['batch1_batch8_prediction_disagreements'] = sum(p['native_prediction'] != b for p, b in zip(predictions, batch_predictions))
    private.mkdir(parents=True, exist_ok=True)
    raw = ''.join(json.dumps(p, ensure_ascii=False, allow_nan=False, separators=(',', ':')) + '\n' for p in predictions).encode('utf-8')
    (private / 'predictions.jsonl').write_bytes(raw)
    digest = hashlib.sha256(raw).hexdigest()
    provenance = {'run_id': RUN_ID, 'dataset_revision': cfg['dataset_revision'], 'split': 'validation',
                  'split_count': len(rows), 'split_sha256': cfg['split_provenance']['validation']['sha256'],
                  'predictions_sha256': digest, 'prediction_rows': len(predictions),
                  'prediction_location': 'LOCAL_PRIVATE_GIT_IGNORED', 'original_text_in_predictions': False,
                  'model_artifact_sha256': engine.artifact_sha256, 'model_manifest_hash': MANIFEST_HASH,
                  'tokenizer_id': 'klue/roberta-base', 'tokenizer_revision': REVISION,
                  'preprocessing': 'verimod-ko-text-v1', 'codepoint_head': 500,
                  'tokenizer_truncation_side': 'right', 'max_length': 128, 'padding': 'longest_in_batch',
                  'device': 'cpu', 'dtype': 'float32', 'batch_size': 1, 'torch_threads': 4, 'torch_interop_threads': 1,
                  'score_semantics': 'UNCALIBRATED', 'ppm_rule': 'floor(score * 1000000 + 0.5), once per exposed score',
                  'versions': {p: importlib.metadata.version(p) for p in ('torch', 'transformers', 'numpy')},
                  'created_at': datetime.now(timezone.utc).isoformat(), 'elapsed_seconds': time.perf_counter() - start,
                  'test_accessed': False, 'training_executed': False}
    save(public / 'validation.json', {'status': 'PASS' if comparison['confusion_matrix_equal'] else 'MISMATCH_RECORDED',
         'provenance': provenance, 'metrics': report, 'w3_comparison': comparison,
         'input_status_counts': dict(Counter(r['input_status'] for r in predictions))})
    # Empirical nearest-rank PPM quantiles on FULL validation only; no imported demo constants.
    full = [p for p in predictions if p['input_status'] == 'FULL']
    import math
    quantiles = {label: {str(q): sorted(r['scores_ppm'][label] for r in full)[math.ceil(len(full) * q / 100) - 1]
                         for q in (25, 50, 75, 90)} for label in ('hate', 'offensive')}
    bands = [(25, 50), (25, 75), (50, 75), (50, 90), (75, 90)]
    candidates = []
    for hr, hx in bands:
        for or_, ox in bands:
            config = {'hate': {'review': quantiles['hate'][str(hr)], 'restrict': quantiles['hate'][str(hx)]},
                      'offensive': {'review': quantiles['offensive'][str(or_)], 'restrict': quantiles['offensive'][str(ox)]}}
            candidates.append({'candidate_id': f'H{hr}-{hx}_O{or_}-{ox}', **summarize(predictions, config)})
    selected = next(c for c in candidates if c['candidate_id'] == 'H50-75_O50-75')
    if not all(selected['actions'][a] > 0 for a in ('ALLOW', 'HUMAN_REVIEW', 'RESTRICT')):
        raise ValueError('Provisional candidate does not exercise all three actions')
    save(public / 'policy_candidates.json', {'status': 'PROVISIONAL', 'X': None, 'B': None, 'team_approved': False,
        'formal_selection': 'NOT_EXECUTED_X_B_UNAPPROVED',
        'formal_rule': 'FRR<=X and HRR_TOTAL<=B, then min HAR, max RP, min HRR_TOTAL',
        'normal_proxy': 'native none is an operational NORMAL proxy, not platform policy approval or ALLOW',
        'harmful_proxy': ['hate', 'offensive'], 'eligible': len(predictions),
        'quantile_population': 'FULL validation scores', 'quantile_method': 'nearest rank ceil(n*q/100)-1',
        'quantiles_ppm': quantiles, 'candidates': candidates,
        'technical_candidate_id': selected['candidate_id'], 'technical_usage': 'W4_PROVISIONAL_E2E_ONLY',
        'technical_selection_reason': 'Predeclared median review / upper-quartile restrict; validation confirms all three actions. No X/B feasibility or optimality claim.',
        'predictions_sha256': digest})
    print(json.dumps({'status': 'COMPLETE', 'n': len(predictions), 'macro_f1': report['macro_f1'],
                      'accuracy': report['accuracy'], 'w3_comparison': comparison, 'predictions_sha256': digest,
                      'elapsed_seconds': time.perf_counter() - start}), flush=True)


if __name__ == '__main__':
    main()
