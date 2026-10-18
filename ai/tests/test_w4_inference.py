"""AI-09 fault/boundary tests. Doubles here are never real-forward evidence."""
import asyncio
import threading
from types import SimpleNamespace
from unittest.mock import patch

from fastapi.testclient import TestClient
import httpx
import pytest
import torch

from verimod_ai.inference.service import (
    InvalidModelOutput, SelectedModel, Settings, create_app, verify_artifacts,
)
from verimod_ai.inference.w3_handoff import score_to_ppm, validate_i1

PAYLOAD = {'text': '오늘은 함께 산책해요.', 'content_commitment': '0x' + 'ab' * 32, 'request_id': 'ai09-unit'}


def assert_failure(response, code, status):
    assert response.status_code == status
    value = response.json()
    assert set(value) == {'ok', 'request_id', 'error'}
    assert value['ok'] is False and value['request_id']
    assert set(value['error']) == {'code', 'retryable'}
    assert value['error']['code'] == code
    assert type(value['error']['retryable']) is bool


class BoundaryDouble:
    def predict(self, text):
        return {'hate': 0, 'offensive': 1_000_000}, 'FULL'


@pytest.mark.parametrize('score,expected', [
    (0, 0), (1, 1_000_000), (0.00000049, 0), (0.0000005, 1),
    (0.00000051, 1), (0.99999949, 999999), (0.9999995, 1000000),
])
def test_ppm_half_up(score, expected):
    assert score_to_ppm(score) == expected


@pytest.mark.parametrize('score', [-0.01, 1.000001, float('nan'), float('inf'), True, '0.5'])
def test_ppm_rejects_invalid(score):
    with pytest.raises(ValueError):
        score_to_ppm(score)


@pytest.mark.parametrize('body,code', [
    ({}, 'INVALID_INPUT'), ({**PAYLOAD, 'text': None}, 'INVALID_INPUT'),
    ({**PAYLOAD, 'text': 123}, 'INVALID_INPUT'), ({**PAYLOAD, 'text': ''}, 'EMPTY_INPUT'),
    ({**PAYLOAD, 'text': ' \n\t'}, 'EMPTY_INPUT'), ({**PAYLOAD, 'text': '\ud800'}, 'INVALID_INPUT'),
    ({**PAYLOAD, 'content_commitment': 'bad'}, 'INVALID_INPUT'),
    ({**PAYLOAD, 'request_id': ''}, 'INVALID_INPUT'),
    ({**PAYLOAD, 'action': 'ALLOW'}, 'INVALID_INPUT'),
    ({**PAYLOAD, 'content_commitment': PAYLOAD['content_commitment'] + '\n'}, 'INVALID_INPUT'),
    ([], 'INVALID_INPUT'),
])
def test_invalid_input(body, code):
    with TestClient(create_app(loader=lambda _: BoundaryDouble())) as client:
        import json
        response = client.post('/infer', content=json.dumps(body), headers={'content-type': 'application/json'})
        assert_failure(response, code, 400)


def test_malformed_json_and_success_envelope():
    with TestClient(create_app(loader=lambda _: BoundaryDouble())) as client:
        assert_failure(client.post('/infer', content='{', headers={'content-type': 'application/json'}), 'INVALID_INPUT', 400)
        value = client.post('/infer', json=PAYLOAD).json()
        assert validate_i1(value)
        assert value['inference']['content_commitment'] == PAYLOAD['content_commitment']
        assert value['request_id'] == PAYLOAD['request_id']


def test_missing_and_corrupt_artifact(tmp_path):
    with pytest.raises(FileNotFoundError):
        verify_artifacts(Settings(model_dir=tmp_path))
    with TestClient(create_app(Settings(model_dir=tmp_path))) as client:
        assert client.get('/healthz').status_code == 503
        assert_failure(client.post('/infer', json=PAYLOAD), 'INFERENCE_UNAVAILABLE', 503)
    (tmp_path / 'model.safetensors').write_bytes(b'synthetic-corruption-only')
    with pytest.raises(ValueError, match='SHA-256 mismatch'):
        verify_artifacts(Settings(model_dir=tmp_path))
    with TestClient(create_app(Settings(model_dir=tmp_path))) as client:
        assert_failure(client.post('/infer', json=PAYLOAD), 'INFERENCE_UNAVAILABLE', 503)


def test_loader_failure():
    def broken(_):
        raise RuntimeError('synthetic load failure')
    with TestClient(create_app(loader=broken)) as client:
        assert_failure(client.post('/infer', json=PAYLOAD), 'INFERENCE_UNAVAILABLE', 503)


@pytest.mark.parametrize('result', [
    ({'hate': -1, 'offensive': 0}, 'FULL'), ({'hate': 1000001, 'offensive': 0}, 'FULL'),
    ({'hate': True, 'offensive': 0}, 'FULL'), ({'hate': 0.5, 'offensive': 0}, 'FULL'),
    ({'hate': 0}, 'FULL'), ({'hate': 0, 'offensive': 0, 'none': 1}, 'FULL'),
    ({'hate': 0, 'offensive': 0}, 'UNKNOWN'),
])
def test_invalid_output(result):
    engine = SimpleNamespace(predict=lambda _: result)
    with TestClient(create_app(loader=lambda _: engine)) as client:
        assert_failure(client.post('/infer', json=PAYLOAD), 'INVALID_MODEL_OUTPUT', 503)


def test_forward_exception():
    def broken(_):
        raise RuntimeError('synthetic forward failure')
    with TestClient(create_app(loader=lambda _: SimpleNamespace(predict=broken))) as client:
        assert_failure(client.post('/infer', json=PAYLOAD), 'INFERENCE_UNAVAILABLE', 503)


@pytest.mark.parametrize('logits', [[[float('nan'), 0, 1]], [[float('inf'), 0, 1]], [[1, 2]], [[1, 2, 3], [1, 2, 3]]])
def test_invalid_native_logits(logits):
    engine = SelectedModel.__new__(SelectedModel)
    engine.tokenizer = lambda *_args, **_kwargs: {'input_ids': [1]}
    engine.model = lambda **_: SimpleNamespace(logits=torch.tensor(logits))
    with pytest.raises(InvalidModelOutput):
        engine.predict('합성 입력')


def test_preprocess_token_limit_softmax_and_single_rounding():
    seen = []
    class Tokenizer:
        def __call__(self, text, **kwargs):
            seen.append((text, kwargs))
            return {'input_ids': list(range(129))}
    engine = SelectedModel.__new__(SelectedModel)
    engine.tokenizer = Tokenizer()
    engine.model = lambda **_: SimpleNamespace(logits=torch.tensor([[0., 0., 0.]]))
    with patch('verimod_ai.inference.service.score_to_ppm', wraps=score_to_ppm) as convert:
        ppm, status = engine.predict('😀' * 501)
    assert seen[0][0] == '😀' * 500
    assert seen[1][0] == ['😀' * 500]
    assert seen[1][1]['max_length'] == 128 and seen[1][1]['truncation'] is True
    assert status == 'TRUNCATED' and ppm == {'hate': 333333, 'offensive': 333333}
    assert convert.call_count == 2  # once per exposed native score, no downstream rounding


def test_timeout_holds_slot_and_discards_late_failure():
    release = threading.Event()
    calls = []
    def slow(_):
        calls.append(1)
        release.wait(3)
        raise RuntimeError('late failure must be consumed')
    try:
        with TestClient(create_app(Settings(timeout_seconds=0.02), loader=lambda _: SimpleNamespace(predict=slow))) as client:
            assert_failure(client.post('/infer', json=PAYLOAD), 'INFERENCE_TIMEOUT', 504)
            assert_failure(client.post('/infer', json=PAYLOAD), 'INFERENCE_UNAVAILABLE', 503)
            assert len(calls) == 1
            release.set()
    finally:
        release.set()


def test_disconnect_does_not_release_running_forward_slot():
    async def scenario():
        entered, release = threading.Event(), threading.Event()
        def slow(_):
            entered.set()
            release.wait(3)
            return {'hate': 0, 'offensive': 0}, 'FULL'
        app = create_app(loader=lambda _: SimpleNamespace(predict=slow))
        try:
            async with app.router.lifespan_context(app):
                async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://unit') as client:
                    task = asyncio.create_task(client.post('/infer', json=PAYLOAD))
                    await asyncio.to_thread(entered.wait, 2)
                    assert entered.is_set()
                    task.cancel()
                    with pytest.raises(asyncio.CancelledError):
                        await task
                    assert_failure(await client.post('/infer', json=PAYLOAD), 'INFERENCE_UNAVAILABLE', 503)
        finally:
            release.set()
    asyncio.run(scenario())


@pytest.mark.parametrize('timeout', [0, -1, float('nan'), float('inf')])
def test_invalid_timeout_setting(timeout):
    with pytest.raises(ValueError):
        Settings(timeout_seconds=timeout)
