"""Actual loopback HTTP/selected-model verification; authored synthetic text only."""
import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import importlib.metadata
import json
import os
from pathlib import Path
import platform
import socket
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'ai/src'))
import httpx
import numpy as np
from verimod_ai.inference.service import MANIFEST, MANIFEST_HASH, Settings, verify_artifacts
from verimod_ai.inference.w3_handoff import validate_i1


def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8')


@contextmanager
def server(directory, name, extra_env=None, ready=True):
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    env = dict(os.environ, HF_HUB_OFFLINE='1', TRANSFORMERS_OFFLINE='1', PYTHONUTF8='1')
    env.pop('VERIMOD_MODEL_DIR', None)
    env.pop('VERIMOD_INFERENCE_TIMEOUT_SECONDS', None)
    env.update(extra_env or {})
    command = [sys.executable, '-B', 'ai/scripts/serve_w4_inference.py', '--port', str(port)]
    started = time.perf_counter()
    with (directory / f'{name}.log').open('wb') as log:
        process = subprocess.Popen(command, cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT,
                                   creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
        try:
            with httpx.Client(base_url=f'http://127.0.0.1:{port}', timeout=30, trust_env=False) as client:
                deadline = time.monotonic() + 120
                while True:
                    if process.poll() is not None:
                        raise RuntimeError(f'{name} exited; inspect server log')
                    try:
                        health = client.get('/healthz')
                        assert health.status_code == (200 if ready else 503), health.text
                        assert health.json()['ready'] is ready
                        break
                    except httpx.ConnectError:
                        if time.monotonic() >= deadline:
                            raise TimeoutError(f'{name} startup exceeded 120s')
                        time.sleep(0.1)
                yield client, {'command': command, 'startup_ms': (time.perf_counter() - started) * 1000,
                               'health': health.json()}
        finally:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=10)


def failure(response, code, status):
    value = response.json()
    assert response.status_code == status, value
    assert set(value) == {'ok', 'request_id', 'error'} and value['ok'] is False
    assert set(value['error']) == {'code', 'retryable'} and value['error']['code'] == code
    assert isinstance(value['request_id'], str) and value['request_id']
    assert type(value['error']['retryable']) is bool
    return {'http_status': response.status_code, 'response': value}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-dir', required=True)
    parser.add_argument('--warmup', type=int, default=5)
    parser.add_argument('--repetitions', type=int, default=50)
    args = parser.parse_args()
    if args.warmup < 1 or args.repetitions < 20:
        parser.error('Use >=1 warm-up and >=20 repetitions')
    directory = ROOT / args.output_dir
    directory.mkdir(parents=True, exist_ok=False)  # preserve prior evidence
    artifact_sha = verify_artifacts(Settings())
    report = {'scope': 'AI-09 ONLY', 'run_at': datetime.now(timezone.utc).isoformat(),
              'input_source': 'AI_AUTHORED_SYNTHETIC', 'dataset_accessed': False,
              'test_accessed': False, 'model_artifact_sha256': artifact_sha,
              'model_manifest_hash': MANIFEST_HASH, 'success_responses': [], 'failure_tests': {}}
    base = {'text': '오늘은 날씨가 좋아서 친구와 함께 산책했어요.',
            'content_commitment': '0x' + 'ab' * 32, 'request_id': 'ai09-synthetic'}
    # Commitment is deliberately caller-supplied, never recomputed in Python.
    cases = [('korean_short', base['text'], 'FULL'),
             ('korean_other', '서로 다른 의견도 차분히 듣고 존중하면 좋겠습니다.', 'FULL'),
             ('codepoints_500', ' ' * 499 + '가', 'FULL'),
             ('codepoints_501', ' ' * 499 + '가나', 'TRUNCATED'),
             ('token_truncation_under_500', '가 ' * 200, 'TRUNCATED'),
             ('astral_codepoints_501', '😀' * 501, 'TRUNCATED')]
    with server(directory, 'actual') as (client, startup):
        report['startup'] = startup
        for name, text, status in cases:
            request = {**base, 'text': text, 'request_id': name}
            response = client.post('/infer', json=request)
            assert response.status_code == 200, response.text
            value = response.json()
            validate_i1(value)
            assert value['inference']['input_status'] == status
            assert value['inference']['content_commitment'] == request['content_commitment']
            report['success_responses'].append({'case': name, 'request': request, 'response': value})
        for name, body, code in [('empty', {**base, 'text': ''}, 'EMPTY_INPUT'),
                                  ('invalid_type', {**base, 'text': 1}, 'INVALID_INPUT'),
                                  ('invalid_commitment', {**base, 'content_commitment': 'bad'}, 'INVALID_INPUT')]:
            report['failure_tests'][name] = failure(client.post('/infer', json=body), code, 400)
        report['failure_tests']['malformed_json'] = failure(client.post('/infer', content='{',
            headers={'content-type': 'application/json'}), 'INVALID_INPUT', 400)
        report['failure_tests']['invalid_unicode'] = failure(client.post('/infer',
            content=json.dumps({**base, 'text': '\ud800'}), headers={'content-type': 'application/json'}), 'INVALID_INPUT', 400)
        # Fixed short Korean input; batch=1, concurrency=1, keep-alive connection.
        for _ in range(args.warmup):
            response = client.post('/infer', json=base)
            assert response.status_code == 200
            validate_i1(response.json())
        samples = []
        for _ in range(args.repetitions):
            start = time.perf_counter()
            response = client.post('/infer', json=base)
            samples.append((time.perf_counter() - start) * 1000)
            assert response.status_code == 200
            validate_i1(response.json())
        report['latency'] = {'p50_ms': float(np.percentile(samples, 50)),
                             'p95_ms': float(np.percentile(samples, 95)), 'samples_ms': samples,
                             'percentile_method': 'numpy.percentile linear', 'warmup_requests': args.warmup,
                             'prior_functional_forward_requests': len(cases), 'repetitions': args.repetitions,
                             'device': 'cpu', 'gpu_used': False, 'batch_size': 1, 'concurrency': 1,
                             'torch_num_threads': 4, 'torch_num_interop_threads': 1,
                             'transport': 'loopback HTTP keep-alive, full request/response; no load test',
                             'input_text': base['text'], 'startup_included': False}
    with tempfile.TemporaryDirectory(prefix='ai09-missing-') as temp:
        with server(directory, 'missing', {'VERIMOD_MODEL_DIR': temp}, ready=False) as (client, startup):
            report['failure_tests']['missing_model'] = failure(client.post('/infer', json=base), 'INFERENCE_UNAVAILABLE', 503)
            report['failure_tests']['missing_model']['startup'] = startup
        (Path(temp) / 'model.safetensors').write_bytes(b'AI-09 synthetic corrupt artifact')
        with server(directory, 'corrupt', {'VERIMOD_MODEL_DIR': temp}, ready=False) as (client, _):
            report['failure_tests']['hash_mismatch'] = failure(client.post('/infer', json=base), 'INFERENCE_UNAVAILABLE', 503)
    with server(directory, 'timeout', {'VERIMOD_INFERENCE_TIMEOUT_SECONDS': '0.000001'}) as (client, _):
        report['failure_tests']['actual_forward_timeout'] = failure(client.post('/infer', json=base), 'INFERENCE_TIMEOUT', 504)
        report['failure_tests']['busy_after_timeout'] = failure(client.post('/infer', json=base), 'INFERENCE_UNAVAILABLE', 503)
    report['environment'] = {'platform': platform.platform(), 'processor': platform.processor(),
        'python': sys.version, 'logical_cpu_count': os.cpu_count(),
        'versions': {p: importlib.metadata.version(p) for p in ('torch', 'transformers', 'numpy', 'fastapi', 'uvicorn', 'httpx', 'pydantic', 'starlette')}}
    report['status'] = 'PENDING_NODE_VALIDATION'
    save(directory / 'api_verification.json', report)
    command = ['node', 'backend/node_modules/tsx/dist/cli.mjs', 'ai/scripts/check_w4_i1.mts',
               str(directory / 'api_verification.json'), str(MANIFEST)]
    node = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, encoding='utf-8', check=True)
    report['node_consumer_validation'] = json.loads(node.stdout)
    report['status'] = 'PASS'
    save(directory / 'api_verification.json', report)
    print(json.dumps({'status': 'PASS', 'output': str(directory),
                      'p50_ms': report['latency']['p50_ms'], 'p95_ms': report['latency']['p95_ms'],
                      'actual_success_cases': len(cases), 'failure_cases': len(report['failure_tests'])}))


if __name__ == '__main__':
    main()
