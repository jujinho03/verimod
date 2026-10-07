"""Verify package metadata, shared hash/schema, and optionally local model bytes."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'ai/src'))
from verimod_ai.inference.w3_handoff import RUN_ID, SOURCE_SNAPSHOT, ARTIFACT_SHA, validate_package

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model-dir', help='Directory containing selected model.safetensors; omitted means metadata-only verification')
    parser.add_argument('--consumer-ref', help='Optional immutable F branch SHA; validates its exact inference.ts Git blob')
    parser.add_argument('--report', help='Repository-relative output report')
    args = parser.parse_args()
    registry = [json.loads(line) for line in (ROOT / 'ai/experiments/registry.jsonl').read_text(encoding='utf-8').splitlines() if line.strip()]
    manifest_path = f'ai/artifacts/manifests/{RUN_ID}.model_manifest.json'
    fixture_path = 'ai/fixtures/w3_real_model_i1_fixture.json'
    manifest = json.loads((ROOT / manifest_path).read_text(encoding='utf-8-sig'))
    fixture = json.loads((ROOT / fixture_path).read_text(encoding='utf-8-sig'))
    validate_package(registry, manifest, fixture)
    source_exists = subprocess.run(['git', 'cat-file', '-e', SOURCE_SNAPSHOT + '^{commit}'], cwd=ROOT, capture_output=True).returncode == 0
    if not source_exists: raise ValueError('Source snapshot commit unavailable')
    snapshot = json.loads(subprocess.run(['git', 'show', SOURCE_SNAPSHOT + ':' +
        f'ai/artifacts/reports/w3_baseline_run/{RUN_ID}/source_snapshot.json'], cwd=ROOT,
        capture_output=True, check=True).stdout)
    restored_sources = []
    for item in snapshot['git_byte_preservation']['source_files']:
        blob = subprocess.run(['git', 'show', SOURCE_SNAPSHOT + ':' + item['path']], cwd=ROOT,
                              capture_output=True, check=True).stdout
        restored = blob.replace(b'\n', b'\r\n') if item['execution_line_endings'] == 'CRLF' else blob
        if hashlib.sha256(restored).hexdigest() != item['execution_sha256']:
            raise ValueError('Snapshot source cannot restore execution bytes: ' + item['path'])
        restored_sources.append(item['path'])
    model_status = 'NOT_CHECKED_NO_MODEL_PATH'
    if args.model_dir:
        weight = Path(args.model_dir) / 'model.safetensors'
        if not weight.is_file():
            model_status = 'NOT_AVAILABLE'
        else:
            with weight.open('rb') as file:
                if hashlib.file_digest(file, 'sha256').hexdigest() != ARTIFACT_SHA:
                    raise ValueError('Model artifact mismatch')
            model_status = 'SHA256_MATCH'
    command = ['node', 'backend/node_modules/tsx/dist/cli.mjs', 'ai/scripts/w3_protocol_bridge.mts', manifest_path, fixture_path]
    if args.consumer_ref: command.append(args.consumer_ref)
    process = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, encoding='utf-8', check=True)
    protocol = json.loads(process.stdout)
    shared_ok = all(row['validation']['ok'] for row in protocol['shared_receipt_schema_probes'])
    report = {
        'run_id': RUN_ID, 'source_snapshot_commit': SOURCE_SNAPSHOT,
        'metadata_validation': 'PASS', 'a_python_i1': 'PASS', 'model_artifact': model_status,
        'execution_source_files_restorable': restored_sources,
        'status': 'VERIFIED_LOCAL_PACKAGE' if model_status == 'SHA256_MATCH' else 'METADATA_VERIFIED_ARTIFACT_UNVERIFIED',
        'model_manifest_hash': protocol['model_manifest_hash'],
        'manifest_file_sha256': hashlib.sha256((ROOT / manifest_path).read_bytes()).hexdigest(),
        'shared_protocol': protocol,
        'handoff_status': 'I1_HANDOFF_READY' if shared_ok else 'A_OUTPUT_READY_CONSUMER_ALIGNMENT_REQUIRED',
        'integration_blocker': None if shared_ok else 'HANDOFF_CONTRACT_MISMATCH: shared receipt schema requires legacy taxonomy/5-label scores',
        'authoritative_receipt_issuance_executed': False, 'anchor_state': 'PENDING_ANCHOR',
        'cross_machine_verification': 'NOT_EXECUTED',
        'test_accessed': False, 'secondary_accessed': False, 'training_executed': False,
        'model_inference_executed': False,
    }
    if args.report:
        path = ROOT / args.report
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == '__main__': main()
