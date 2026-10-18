"""Preserve provisional manifest and prepare parity against pinned F/T Git sources."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'ai/src'))
from verimod_ai.evaluation.w4_policy import boundary_vectors

F_REF = 'a58230e897111eee8c981c4d734294201651b952'
T_REF = '3054b112e9be09501c8f21c66a861212e7975db2'


def save(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--public-dir', required=True)
    parser.add_argument('--private-dir', required=True)
    parser.add_argument('--f-worktree', required=True)
    args = parser.parse_args()
    public, private, froot = (Path(v).resolve() for v in (args.public_dir, args.private_dir, args.f_worktree))
    assert subprocess.check_output(['git', '-C', str(froot), 'rev-parse', 'HEAD']).decode().strip() == F_REF
    assert not subprocess.check_output(['git', '-C', str(froot), 'diff', 'HEAD', '--name-only']).strip()
    troot = private / 't-protocol'
    troot.mkdir(parents=True, exist_ok=True)
    (troot / 'package.json').write_text('{"type":"module"}\n')
    source_hashes = {}
    for name in ('canonical.ts', 'hash.ts'):
        source = 'shared/protocol/src/' + name
        blob = subprocess.check_output(['git', 'show', T_REF + ':' + source], cwd=ROOT)
        (troot / name).write_bytes(blob)
        source_hashes[source] = hashlib.sha256(blob).hexdigest()
        assert blob == subprocess.check_output(['git', 'show', F_REF + ':' + source], cwd=ROOT)
    profile_path = 'frontend/src/domain/approvedProfiles.ts'
    profile = subprocess.check_output(['git', 'show', T_REF + ':' + profile_path], cwd=ROOT)
    (troot / 'approvedProfiles.ts').write_bytes(profile)
    source_hashes[profile_path] = hashlib.sha256(profile).hexdigest()
    comparison = json.loads((public / 'policy_candidates.json').read_text())
    validation = json.loads((public / 'validation.json').read_text())
    selected = next(c for c in comparison['candidates'] if c['candidate_id'] == comparison['technical_candidate_id'])
    manifest = {
        'manifest_type': 'VALIDATION_THRESHOLD_POLICY', 'manifest_version': 'policy-manifest/1',
        'policy_status': 'W4_PROVISIONAL', 'usage': 'W4_PROVISIONAL_E2E_ONLY',
        'team_approved': False, 'approval_status': 'PENDING_X_B_AND_TEAM_REVIEW',
        'taxonomy_id': 'verimod-ko-beep-hate', 'taxonomy_version': '1',
        'model_manifest_hash': validation['provenance']['model_manifest_hash'],
        'score_semantics': 'UNCALIBRATED', 'score_keys': ['hate', 'offensive'],
        'native_reference_class': 'none', 'reference_class_is_policy_allow': False,
        'thresholds_ppm': selected['thresholds_ppm'], 'comparison': 'greater_than_or_equal',
        'precedence': ['TRUNCATED_HUMAN_REVIEW', 'ANY_RESTRICT', 'ANY_REVIEW', 'ALLOW'],
        'truncated': {'action': 'HUMAN_REVIEW', 'overrides_high_scores': True,
                      'reason_codes': ['INPUT_TRUNCATED'], 'triggered_rule_ids': ['W4-TRUNCATED']},
        'score_rules': [{'label': label, 'band': band.lower(),
                        'action': 'RESTRICT' if band == 'RESTRICT' else 'HUMAN_REVIEW',
                        'reason_code': f'SCORE_{label.upper()}_{band}',
                        'rule_id': f'W4-{label.upper()}-{band}'}
                       for label in ('hate', 'offensive') for band in ('REVIEW', 'RESTRICT')],
        'matched_rules': 'all labels in winning band only, ASCII sorted unique',
        'allow': {'reason_codes': [], 'triggered_rule_ids': []},
        'validation': {'n': 1255, 'predictions_sha256': comparison['predictions_sha256'],
                       'candidate_id': selected['candidate_id'], 'X': None, 'B': None,
                       'selection_basis': comparison['technical_selection_reason']},
        'evaluator_source': {'git_commit': F_REF, 'path': 'backend/src/inference.ts'},
    }
    save(public / 'policy_manifest.json', manifest)
    save(public / 'source_provenance.json', {'a_ai09_commit': 'dd1031ae042d384da8600d26310a671f398f68c4',
        'f_commit': F_REF, 't_commit': T_REF, 't_source_sha256': source_hashes,
        'f_t_canonical_hash_sources_identical': True, 'test_accessed': False})
    command = ['node', str(froot / 'backend/node_modules/tsx/dist/cli.mjs'),
               str(ROOT / 'ai/scripts/w4_policy_parity.mts'), str(froot), str(troot), str(public)]
    subprocess.run(command + ['hash'], cwd=ROOT, check=True)
    policy_hash = json.loads((public / 'policy_hash.json').read_text())['policy_manifest_hash']
    save(public / 'policy_vectors.json', {'policy_manifest_hash': policy_hash,
         'vectors': boundary_vectors(selected['thresholds_ppm'], policy_hash)})
    subprocess.run(command + ['parity'], cwd=ROOT, check=True)


if __name__ == '__main__':
    main()
