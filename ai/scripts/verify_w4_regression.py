"""Run AI unit regressions with a guard against local dataset access."""
import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]


def guard(event, values):
    if event in ('open', 'os.listdir', 'os.scandir') and values:
        path = str(values[0]).lower().replace('\\', '/')
        if 'verimod-local-data' in path or any(f'/ai/data/{part}' in path for part in ('raw', 'processed', 'cache', 'downloads')):
            raise PermissionError('Regression may use synthetic fixtures only')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-dir', required=True)
    args = parser.parse_args()
    output = ROOT / args.output_dir
    output.mkdir(parents=True, exist_ok=True)
    if (output / 'regression.json').exists():
        raise FileExistsError('Preserve previous regression evidence')
    sys.addaudithook(guard)
    import pytest
    result = pytest.main(['ai/tests', '-q', '-o', 'faulthandler_timeout=30', f'--junitxml={output / "pytest.xml"}'])
    lock = ROOT / 'ai/requirements-w3.lock.txt'
    unchanged = subprocess.check_output(['git', 'diff', '--name-only', 'HEAD', '--', 'ai'], cwd=ROOT, text=True).strip()
    versions = {}
    for line in lock.read_text(encoding='utf-8').splitlines():
        if '==' in line and not line.startswith('#'):
            name, version = line.split('==')
            actual = importlib.metadata.version(name)
            assert actual == version, (name, version, actual)
            versions[name] = actual
    assert importlib.metadata.version('torch') == '2.14.1+cpu'
    report = {'pytest_exit_code': int(result), 'status': 'PASS' if result == 0 else 'FAIL',
              'test_accessed': False, 'real_dataset_accessed': False,
              'w3_lock_sha256': hashlib.sha256(lock.read_bytes()).hexdigest(),
              'w3_pinned_versions_match': True, 'w3_versions': versions,
              'modified_existing_tracked_ai_files': unchanged.splitlines()}
    (output / 'regression.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    raise SystemExit(result)
