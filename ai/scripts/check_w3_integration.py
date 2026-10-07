"""Run AI unit tests with a real-dataset I/O guard; no training/inference entrypoint."""
import contextlib
from datetime import datetime, timezone
import io
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
attempts = []
def guard(event, args):
    if event in ('open', 'os.listdir', 'os.scandir') and args and 'verimod-local-data' in str(args[0]).lower():
        attempts.append(event)
        raise PermissionError('Integration AI tests may not access actual datasets')
sys.addaudithook(guard)
sys.path.insert(0, str(ROOT / 'ai/src'))
import pytest

capture = io.StringIO()
with contextlib.redirect_stdout(capture), contextlib.redirect_stderr(capture):
    result = pytest.main(['-q', '-p', 'no:cacheprovider', '-c', str(ROOT / 'ai/pyproject.toml'), str(ROOT / 'ai/tests')])
summary = re.search(r'(\d+ passed, \d+ subtests passed in [\d.]+s)', capture.getvalue())
if result or attempts or not summary:
    print(capture.getvalue())
    raise SystemExit(result or 1)
report = {'command':'ai/.venv/Scripts/python.exe -B ai/scripts/check_w3_integration.py',
          'executed_at_utc':datetime.now(timezone.utc).isoformat(), 'exit_code':0,
          'summary':summary.group(1), 'actual_dataset_access_attempts':attempts,
          'test_accessed':False, 'secondary_accessed':False, 'new_training_executed':False}
path = ROOT / 'docs/evidence/w3-team/ai-tests.json'
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8', newline='\n')
print(json.dumps(report))
