"""Run guarded regressions; publish only host/path-free aggregate evidence."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--private-dir', required=True)
    parser.add_argument('--public-dir', required=True)
    args = parser.parse_args()
    private, public = Path(args.private_dir), Path(args.public_dir)
    xml_path = private / 'w4-a-regression.xml'
    def guard(event, values):
        if event in ('open', 'os.listdir', 'os.scandir') and values and 'verimod-local-data' in str(values[0]).lower():
            raise PermissionError('Unit regressions cannot access real datasets')
    sys.addaudithook(guard)
    start = time.perf_counter()
    import pytest
    code = pytest.main(['ai/tests', '-q', '-o', 'faulthandler_timeout=30', f'--junitxml={xml_path}'])
    tree = ET.parse(xml_path)
    suites = list(tree.iter('testsuite'))
    frozen_paths = ['ai/requirements-w3.lock.txt', 'ai/configs/w3_baseline.json', 'ai/configs/w2_dataset.json',
        'ai/experiments/registry.jsonl', 'ai/artifacts/manifests/AI07-BL-KLUE-RB-45126-R01.model_manifest.json',
        'ai/fixtures/w3_real_model_i1_fixture.json']
    preservation = {}
    for path in frozen_paths:
        committed = subprocess.check_output(['git', 'show', 'dd1031ae042d384da8600d26310a671f398f68c4:' + path], cwd=ROOT)
        current = (ROOT / path).read_bytes()
        assert committed.replace(b'\r\n', b'\n') == current.replace(b'\r\n', b'\n')
        preservation[path] = hashlib.sha256(current).hexdigest()
    report = {'status': 'PASS' if code == 0 else 'FAIL', 'pytest_exit_code': int(code),
        'testcase_count': len(list(tree.iter('testcase'))), 'tests_including_subtests': sum(int(s.get('tests')) for s in suites),
        'failures': sum(int(s.get('failures')) for s in suites), 'errors': sum(int(s.get('errors')) for s in suites),
        'counts_by_class': dict(Counter(t.get('classname') for t in tree.iter('testcase'))),
        'elapsed_seconds': time.perf_counter() - start, 'test_accessed': False,
        'w3_frozen_preserved': True, 'preserved_file_sha256': preservation,
        'raw_log_location': 'LOCAL_PRIVATE_GIT_IGNORED', 'public_hostnames_or_absolute_paths': False}
    (public / 'regression.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8', newline='\n')
    raise SystemExit(code)


if __name__ == '__main__':
    main()
