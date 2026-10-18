"""Prepare fresh W4 evidence without dataset access or manifest regeneration."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'ai/src'))
from verimod_ai.evaluation.w4_policy import boundary_vectors

A = 'b8c44dff37ce20dfdae6c74fb96e6062d8b72553'
F = '2c99260c0eb6229d34b3f94191c2dab3238c1727'
T = 'fbcb3e9e99ae8dda2f9c70a32f35ec2c039b73de'
WEIGHT = 'a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f'


def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def git(*args, cwd=ROOT):
    return subprocess.check_output(['git', *args], cwd=cwd)


def main():
    parser = argparse.ArgumentParser()
    for name in ('public-dir', 'private-dir', 'f-worktree', 't-worktree'):
        parser.add_argument('--' + name, required=True)
    args = parser.parse_args()
    public, private, froot, troot = [Path(v).resolve() for v in vars(args).values()]
    start = time.perf_counter()
    assert not public.exists() and not private.exists(), 'Never overwrite an evidence run'
    for root, commit in ((ROOT, A), (froot, F), (troot, T)):
        assert git('rev-parse', 'HEAD', cwd=root).decode().strip() == commit
    for root in (froot, troot):
        assert not git('diff', 'HEAD', '--name-only', cwd=root).strip()
    subprocess.run(['git', 'merge-base', '--is-ancestor',
                    '60600d50174749f24f54b87b5f9d4a7b79775304', T], cwd=ROOT, check=True)
    subprocess.run(['git', 'check-ignore', '-q', str(private / 'guard')], cwd=ROOT, check=True)
    frozen = {}
    for path in ('ai/requirements-w3.lock.txt', 'ai/configs/w3_baseline.json', 'ai/configs/w2_dataset.json',
                 'ai/experiments/registry.jsonl', 'ai/fixtures/w3_real_model_i1_fixture.json',
                 'ai/artifacts/manifests/AI07-BL-KLUE-RB-45126-R01.model_manifest.json'):
        current = (ROOT / path).read_bytes()
        assert current.replace(b'\r\n', b'\n') == git('show', A + ':' + path).replace(b'\r\n', b'\n')
        frozen[path] = sha(ROOT / path)
    weight = ROOT / 'ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model/model.safetensors'
    assert sha(weight) == WEIGHT
    original = ROOT / 'ai/artifacts/reports/w4_a_validation/20261016'
    old_inventory = json.loads((ROOT / 'ai/.venv/w4-revalidation-prep-20261016/preservation.json').read_text(encoding='utf-8-sig'))
    for entry in old_inventory['files']:
        assert sha(ROOT / entry['path']) == entry['sha256'], entry['path']
    public.mkdir(parents=True)
    private.mkdir(parents=True)
    for name in ('policy_manifest.json', 'policy_manifest.canonical.json', 'policy_hash.json'):
        shutil.copyfile(original / name, public / name)
    (public / '.gitattributes').write_text('policy_manifest.json -text\npolicy_manifest.canonical.json -text\n', encoding='utf-8')
    manifest = json.loads((public / 'policy_manifest.json').read_text())
    policy_hash = json.loads((public / 'policy_hash.json').read_text())['policy_manifest_hash']
    vectors = {'policy_manifest_hash': policy_hash, 'vectors': boundary_vectors(manifest['thresholds_ppm'], policy_hash)}
    assert vectors == json.loads((original / 'policy_vectors.json').read_text())
    (public / 'policy_vectors.json').write_text(json.dumps(vectors, indent=2) + '\n', encoding='utf-8')
    source_hashes = {p: sha(ROOT / p) for p in ('ai/scripts/verify_w4_af_e2e.mts',
        'ai/scripts/w4_policy_parity.mts', 'ai/scripts/prepare_w4_revalidation.py',
        'ai/scripts/check_w4_a_release.py', 'ai/scripts/serve_w4_inference.py',
        'ai/src/verimod_ai/inference/service.py', 'ai/src/verimod_ai/evaluation/w4_policy.py')}
    report = {'status': 'PASS', 'a_base_commit': A, 'f_commit': F, 't_commit': T,
              'a_harness_source_sha256': source_hashes, 'weight_sha256': WEIGHT,
              'frozen_file_sha256': frozen, 'old_evidence_unchanged': len(old_inventory['files']),
              'python_reference_vectors_recomputed': len(vectors['vectors']),
              'policy_bytes_preserved': True, 'policy_manifest_hash': policy_hash,
              'policy_usage': manifest['usage'], 'team_approved': manifest['team_approved'],
              'test_accessed': False, 'elapsed_seconds': time.perf_counter() - start}
    (public / 'preflight.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'preflight': 'PASS', 'preserved_files': len(old_inventory['files']), 'vectors': len(vectors['vectors'])}))


if __name__ == '__main__':
    main()
