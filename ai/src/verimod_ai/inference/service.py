"""AI-09: local selected W3 model, actual forward, and fail-closed I1 HTTP API."""
from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import logging
import math
import os
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, StrictStr, field_validator
from starlette.exceptions import HTTPException

from verimod_ai.data.preprocessing import preprocess_text
from verimod_ai.data.taxonomy import NATIVE_TARGET, SCORE_KEYS, TAXONOMY_ID, TAXONOMY_VERSION
from verimod_ai.inference.w3_handoff import ARTIFACT_SHA, REVISION, RUN_ID, score_to_ppm, validate_i1

ROOT = Path(__file__).resolve().parents[4]
SELECTED = ROOT / 'ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model'
MANIFEST = ROOT / f'ai/artifacts/manifests/{RUN_ID}.model_manifest.json'
MANIFEST_HASH = '0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1'
# Normalize CRLF only for portable Git checkout verification, never for inference text.
MANIFEST_FILE_SHA = '0163a8bc1d06e12d248fda7abdf7c940bb246bdcf91cebac05dd33b8bafc76a2'
CONFIG_FILE_SHA = '757e8a080d4620e6b9b109e3a59cfeb2bf5383811721513e2eb1a3c8095814e6'
LOG = logging.getLogger(__name__)


class InvalidModelOutput(ValueError):
    pass


@dataclass(frozen=True)
class Settings:
    model_dir: Path = SELECTED
    cache_dir: Path = ROOT / 'ai/.venv/hf-cache'
    timeout_seconds: float = 10.0

    def __post_init__(self):
        if not math.isfinite(self.timeout_seconds) or self.timeout_seconds <= 0:
            raise ValueError('timeout_seconds must be finite and positive')

    @classmethod
    def from_env(cls):
        return cls(
            model_dir=Path(os.environ.get('VERIMOD_MODEL_DIR', str(SELECTED))),
            cache_dir=Path(os.environ.get('VERIMOD_HF_CACHE', str(ROOT / 'ai/.venv/hf-cache'))),
            timeout_seconds=float(os.environ.get('VERIMOD_INFERENCE_TIMEOUT_SECONDS', '10')),
        )


class InferRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    text: StrictStr
    content_commitment: StrictStr = Field(pattern=r'^0x[0-9a-f]{64}$')
    request_id: StrictStr = Field(default_factory=lambda: str(uuid4()), min_length=1, max_length=128,
                                 pattern=r'^[A-Za-z0-9._:-]+$')

    @field_validator('text')
    @classmethod
    def valid_unicode(cls, value):
        value.encode('utf-8', errors='strict')
        return value


def verify_artifacts(settings: Settings):
    with (settings.model_dir / 'model.safetensors').open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    if digest != ARTIFACT_SHA:
        raise ValueError('Selected model SHA-256 mismatch')
    for path, expected in ((settings.model_dir / 'config.json', CONFIG_FILE_SHA),
                           (MANIFEST, MANIFEST_FILE_SHA)):
        if hashlib.sha256(path.read_bytes().replace(b'\r\n', b'\n')).hexdigest() != expected:
            raise ValueError(f'Pinned metadata mismatch: {path.name}')
    return digest


class SelectedModel:
    def __init__(self, settings: Settings):
        self.artifact_sha256 = verify_artifacts(settings)
        import torch
        from transformers import AutoModelForSequenceClassification, AutoTokenizer

        torch.set_num_threads(4)
        torch.set_num_interop_threads(1)
        self.tokenizer = AutoTokenizer.from_pretrained(
            'klue/roberta-base', revision=REVISION, cache_dir=str(settings.cache_dir),
            local_files_only=True, trust_remote_code=False, use_fast=True,
        )
        self.tokenizer.truncation_side = 'right'
        self.tokenizer.padding_side = 'right'
        self.model, loading = AutoModelForSequenceClassification.from_pretrained(
            settings.model_dir, local_files_only=True, trust_remote_code=False,
            use_safetensors=True, output_loading_info=True,
        )
        if any(loading.get(key) for key in ('missing_keys', 'unexpected_keys', 'mismatched_keys', 'error_msgs')):
            raise ValueError('Incomplete selected model load')
        if (self.model.config.id2label != dict(enumerate(NATIVE_TARGET))
                or self.model.config.label2id != {label: i for i, label in enumerate(NATIVE_TARGET)}):
            raise ValueError('Selected model label mapping mismatch')
        self.model.to('cpu').eval()

    def predict(self, text: str):
        import torch
        from verimod_ai.training.metrics import score_array

        processed = preprocess_text('api', text)
        length = len(self.tokenizer(processed.processed_text, truncation=False,
                                    add_special_tokens=True)['input_ids'])
        encoded = self.tokenizer([processed.processed_text], padding=True, truncation=True,
                                 max_length=128, add_special_tokens=True, return_tensors='pt')
        with torch.inference_mode():
            logits = self.model(**encoded).logits.cpu().numpy()
        try:
            scores = score_array(logits)
            if scores.shape != (1, 3):
                raise ValueError('Expected one native output')
            # Convert only exposed native scores, exactly once, with W3 half-up rule.
            ppm = {label: score_to_ppm(float(scores[0, NATIVE_TARGET.index(label)])) for label in SCORE_KEYS}
        except (ValueError, TypeError, IndexError) as exc:
            raise InvalidModelOutput('Invalid native model output') from exc
        status = 'TRUNCATED' if processed.input_status == 'TRUNCATED' or length > 128 else 'FULL'
        return ppm, status


def failure(request_id, code, status, retryable=False):
    return JSONResponse(status_code=status, content={
        'ok': False, 'request_id': request_id, 'error': {'code': code, 'retryable': retryable},
    })


def create_app(settings: Settings | None = None, *, loader=SelectedModel):
    settings = settings or Settings.from_env()

    @asynccontextmanager
    async def lifespan(app):
        app.state.engine = None
        app.state.pending = None
        executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix='verimod-infer')
        app.state.executor = executor
        try:
            # Startup remains not-ready until the full hash and local model load finish.
            app.state.engine = await asyncio.get_running_loop().run_in_executor(executor, loader, settings)
            LOG.info('Selected model ready: run=%s sha256=%s device=cpu batch=1', RUN_ID, ARTIFACT_SHA)
        except Exception as exc:
            LOG.error('Selected model unavailable (%s)', type(exc).__name__)
        try:
            yield
        finally:
            executor.shutdown(wait=False, cancel_futures=True)

    app = FastAPI(title='VeriMod AI-09', lifespan=lifespan)

    @app.middleware('http')
    async def request_context(request: Request, call_next):
        request.state.request_id = str(uuid4())
        try:
            return await call_next(request)
        except Exception as exc:
            LOG.error('Inference request failed (%s)', type(exc).__name__)
            return failure(request.state.request_id, 'INFERENCE_UNAVAILABLE', 503, True)

    @app.exception_handler(RequestValidationError)
    async def invalid_request(request, _exc):
        return failure(request.state.request_id, 'INVALID_INPUT', 400)

    @app.exception_handler(HTTPException)
    async def http_error(request, exc):
        return failure(request.state.request_id, 'INVALID_INPUT', exc.status_code)

    @app.get('/healthz')
    async def health():
        ready = app.state.engine is not None
        return JSONResponse(status_code=200 if ready else 503, content={
            'ready': ready, 'run_id': RUN_ID, 'model_manifest_hash': MANIFEST_HASH,
            'artifact_sha256': ARTIFACT_SHA if ready else None,
            'device': 'cpu', 'batch_size': 1, 'torch_num_threads': 4, 'torch_num_interop_threads': 1,
        })

    @app.post('/infer')
    async def infer(body: InferRequest, request: Request):
        request.state.request_id = body.request_id
        if not body.text.strip():
            return failure(body.request_id, 'EMPTY_INPUT', 400)
        if app.state.engine is None or (app.state.pending is not None and not app.state.pending.done()):
            return failure(body.request_id, 'INFERENCE_UNAVAILABLE', 503, True)
        future = app.state.executor.submit(app.state.engine.predict, body.text)
        app.state.pending = future
        wrapped = asyncio.wrap_future(future)
        # A timeout/disconnect cannot cancel a running native forward. Keep its slot
        # occupied until completion; discard its result and consume late exceptions.
        wrapped.add_done_callback(lambda f: None if f.cancelled() else f.exception())
        try:
            ppm, status = await asyncio.wait_for(asyncio.shield(wrapped), settings.timeout_seconds)
            result = {'ok': True, 'request_id': body.request_id, 'inference': {
                'output_version': 'inference/1', 'inference_id': str(uuid4()),
                'content_commitment': body.content_commitment, 'model_manifest_hash': MANIFEST_HASH,
                'taxonomy_id': TAXONOMY_ID, 'taxonomy_version': TAXONOMY_VERSION,
                'scores_ppm': ppm, 'score_semantics': 'UNCALIBRATED', 'input_status': status,
                'evidence': [], 'inferred_at': datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00', 'Z'),
            }}
            try:
                validate_i1(result)
            except (ValueError, TypeError, KeyError) as exc:
                raise InvalidModelOutput('Invalid I1 output') from exc
            return result
        except TimeoutError:
            return failure(body.request_id, 'INFERENCE_TIMEOUT', 504, True)
        except InvalidModelOutput:
            return failure(body.request_id, 'INVALID_MODEL_OUTPUT', 503)
        except Exception as exc:
            LOG.error('Model forward failed (%s)', type(exc).__name__)
            return failure(body.request_id, 'INFERENCE_UNAVAILABLE', 503, True)

    return app
