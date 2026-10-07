# W3 AI-07 Baseline Execution Spec

## Repository

- 기준일: 2026-10-06. 실행 시간은 아래 JSON의 UTC timestamp로 기록한다.
- Repository: `verimod`, branch `main`.
- HEAD: `09d72598dcd1d6744d4c80b99af0721d4c1efedc`.
- origin: `https://github.com/jujinho03/verimod.git`.
- 착수 시 tracked clean, 기존 untracked `output/` 존재. 완료 시 이 spec 작업으로 dirty이며 commit/push하지 않았다. 기존 `output/`는 수정하지 않았다.
- 우선순위: 주진호의 이번 명시적 실행 spec 결정 > 실제 repository > 기존 문서. W3 전체 구현으로 확대하지 않는다.

## Dataset

- Primary: BEEP! Korean HateSpeech, `kocohub/korean-hate-speech`.
- Revision: `f8d05dce2b22007bb149e5139c0060c68ad8f94b`.
- 기존 config: [`ai/configs/w2_dataset.json`](../../ai/configs/w2_dataset.json), 변경 없음.
- Split seed: `45126`; algorithm: `group-greedy-class-aware-v1`.
- 학습 target: single-label `hate / offensive / none`, label IDs `0 / 1 / 2`.
- 노출 harmful score keys: `hate / offensive`. `none`은 reference class이며 ALLOW와 같지 않다. 정책 action은 별도 policy layer가 결정한다.

| Internal split | N | hate | offensive | none | 이번 단계 접근 |
|---|---:|---:|---:|---:|---|
| TRAIN | 5,857 | 1,423 | 1,882 | 2,552 | 해시·개수 검증 및 tokenizer 분석 |
| VALIDATION | 1,255 | 305 | 403 | 547 | 해시·개수 검증 및 tokenizer 분석 |
| TEST | 1,255 | 미조회 | 미조회 | 미조회 | SEALED, 미열람 |

TRAIN SHA-256: `fc9a70cdffc2dad297d37e1724d8011e070e17dd251f2d061ec40f7ea2d89a2b`.

VALIDATION SHA-256: `a92f81ed8eadb9fdb1950be542f9edac4fe778f3e7bd2d630cd1494ef031a26a`.

TEST의 1,255행 및 seal `ba9b87bde42e5eba8b3c5ca5f2423553a2f913400fd202d30b9e4bd00eb8138e`는 **이전 Audit 기록 인용**이다. 이번에 TEST 파일을 읽거나 해시를 다시 계산하지 않았다. 공식 raw train/dev는 internal TEST를 포함할 수 있어 이번 분석에서 읽지 않았다.

실제 분석은 allowlist의 `train.jsonl`, `validation.jsonl`만 읽고, 읽은 bytes의 해시와 행·클래스 수가 위 기록과 일치하지 않으면 중단한다. dataset 경로는 `VERIMOD_BEEP_SPLITS` 또는 analyzer 인자로 제공하며 committed 실행 config에 로컬 절대 경로를 넣지 않는다.

## Model

- Model/tokenizer: `klue/roberta-base`.
- 동일 immutable revision: `02f94ba5e3fcb7e2a58a390b8639b0fac974a8da`.
- 공개 접근 가능, gated/private/disabled 모두 false. [고정 HF metadata](https://huggingface.co/api/models/klue/roberta-base/revision/02f94ba5e3fcb7e2a58a390b8639b0fac974a8da)와 [고정 model card](https://huggingface.co/klue/roberta-base/blob/02f94ba5e3fcb7e2a58a390b8639b0fac974a8da/README.md)를 확인했다.
- 원 checkpoint: `RobertaForMaskedLM`, model_type `roberta`; layers 12, hidden 768, attention heads 12, intermediate 3,072, vocab 32,000, max_position_embeddings 514. 약 110M 규모.
- HF safetensors metadata: F32 parameter 항목 110,651,648; I64 항목 514는 buffer이므로 이를 학습 parameter 수로 합산하지 않는다.
- 실제 `AutoConfig` → `RobertaConfig`; `AutoModelForSequenceClassification` → `RobertaForSequenceClassification`의 pinned safetensors 로드 성공. 3-class classifier 포함 실제 객체 parameter 수: 110,620,419.
- tokenizer: `AutoTokenizer`, `use_fast=True` → **BertTokenizerFast**, special tokens 2개, model_max_length 512. 해당 model card의 BertTokenizer 안내와 일치한다.
- `trust_remote_code=False`로 config/tokenizer/model 로드 모두 성공. custom remote code 없음.
- sequence-classification head 4개 tensor는 새로 초기화되어 **UNTRAINED**이며 기존 LM head 항목은 미사용이다. loading mismatch/error는 없다. 로드 성공은 moderation 모델 학습 완료를 뜻하지 않는다.
- Source weight: `model.safetensors`, 442,635,012 bytes; SHA-256 `0833ea5b78f6d45cc713d097ebd8206d30c892ddbb46ae6c6122aae2efcb7c59`. **사전학습 source weight hash**이며 아직 존재하지 않는 fine-tuned artifact hash가 아니다.
- HF card에 license metadata field/별도 license 파일은 없다. card가 연결한 공식 KLUE repository는 CC BY-SA 4.0을 선언한다. [고정 upstream License.md](https://github.com/KLUE-benchmark/KLUE/blob/3efd98708a40ff49251fddde35453f8fbb11f536/License.md)를 근거로 기록하며 weight 전용 Hub license tag를 만들어 기록하지 않는다.
- Source/compatibility evidence: [`model_source.json`](../../ai/artifacts/reports/w3_baseline/model_source.json).

이 단계의 model load는 표준 API 호환성 확인만 수행했다. model forward, validation prediction, backward, optimizer step은 실행하지 않았다.

## Environment

| 항목 | 실제 확인값 |
|---|---|
| OS | Microsoft Windows 11 Home 10.0.26200, x64 |
| Python | CPython 3.12.14, MSC v.1944, AMD64 |
| CPU | Intel Core i5-1035G4 @ 1.10GHz, physical cores 4 / logical processors 8 |
| RAM | 16,930,271,232 bytes, 약 15.77 GiB |
| Display adapter | Intel Iris Plus Graphics; driver 27.20.100.8853 |
| NVIDIA GPU / VRAM / NVIDIA driver | 없음 / 해당 없음 / 해당 없음 |
| nvidia-smi | PATH 및 System32에서 없음 |
| 설치 전 torch | 미설치; version/CUDA/device 정보 없음 |
| 설치 후 torch.__version__ | `2.14.1+cpu` |
| torch.version.cuda | `None` |
| torch.cuda.is_available() | `False` |
| torch.cuda.get_device_name(0) | CUDA unavailable로 호출하지 않음, device name 없음 |
| Baseline device | `cpu`, mixed precision `none` |
| CPU thread spec | intra-op 4, inter-op 1 |

Intel display adapter의 AdapterRAM 값은 NVIDIA VRAM으로 해석하지 않는다. NVIDIA CUDA GPU가 확인되지 않았으므로 CPU wheel을 선택했다. OS/CPU/RAM/display inventory는 PowerShell CIM으로 실제 조회했으며 설치 전후 torch 확인은 [`environment.json`](../../ai/artifacts/reports/w3_baseline/environment.json)에 남겼다.

## Token Length Evidence

실행 script: [`analyze_w3_token_lengths.py`](../../ai/scripts/analyze_w3_token_lengths.py).

순서: 원문 → 기존 [`preprocess_text`](../../ai/src/verimod_ai/data/preprocessing.py), `verimod-ko-text-v1`의 500 code point HEAD truncation → pinned tokenizer. 기존 preprocessing에 Unicode 정규화나 공백 collapse를 추가하지 않았다. 분석 중에는 tokenizer padding/truncation 없이 special tokens를 포함한 길이를 측정했다.

Percentile은 nearest rank, `sorted(lengths)[ceil(q*N)-1]`다. Truncation 조건은 `length > max_length`; rate 분모는 해당 split 전체 N이다. Tokenization batch size는 256이며 학습 batch size와 무관하다. 두 split 모두 code point preprocessing에서 잘린 건수도 0이다.

| Split | N | P50 | P90 | P95 | P99 | Max |
|---|---:|---:|---:|---:|---:|---:|
| TRAIN | 5,857 | 20 | 48 | 57 | 70 | 81 |
| VALIDATION | 1,255 | 21 | 47 | 57 | 70 | 82 |

| max_length | TRAIN truncation | VALIDATION truncation |
|---:|---:|---:|
| 128 | 0 / 5,857 (0%) | 0 / 1,255 (0%) |
| 256 | 0 / 5,857 (0%) | 0 / 1,255 (0%) |
| 512 | 0 / 5,857 (0%) | 0 / 1,255 (0%) |

**Selected max_length: 128.** 관측된 최대 길이가 TRAIN 81, VALIDATION 82이므로 128은 후보 중 가장 작으면서 관측된 정보 손실이 없는 값이다. 256·512도 truncation 감소 이득이 없으므로 CPU 메모리·연산 상한을 높일 근거가 없다. 배치 내 longest padding을 사용하며 실제 moderation 입력이 더 길면 tokenizer도 right truncation으로 HEAD를 유지한다. 이 결정은 TRAIN·VALIDATION에 한정되며 TEST나 운영 전체의 길이 분포 및 성능을 추정하지 않는다.

원문·record ID·token ID 배열을 report에 저장하지 않았다. [`token_length_summary.json`](../../ai/artifacts/reports/w3_baseline/token_length_summary.json)은 aggregate와 split 해시만 포함한다.

## Training Spec

실행 spec: [`w3_baseline.json`](../../ai/configs/w3_baseline.json).

| 항목 | Frozen value |
|---|---|
| run_name | `beep-klue-roberta-base-w3-seed45126-cpu` |
| objective | single-label cross entropy, 3 classes |
| class weighting | NONE (`null`) |
| epochs | 3 |
| learning rate | 2e-5 |
| weight decay | 0.01 |
| warmup ratio | 0.10 |
| scheduler | linear |
| optimizer | PyTorch AdamW, Transformers `adamw_torch` |
| gradient clipping | max_grad_norm 1.0 |
| seed / data_seed | 45126 / 45126 |
| max_length / special tokens | 128 / include |
| truncation / padding | right HEAD / longest in batch, right padding |
| train / eval batch | 4 / 8 (single CPU process) |
| gradient accumulation | 4 |
| effective train batch | nominal 16; epoch 마지막 불완전 batch는 더 작을 수 있음 |
| mixed precision | none; fp16=false, bf16=false |
| dataloader | workers 0, pin_memory false |
| torch threads | intra-op 4 / inter-op 1 |
| gradient checkpointing | false |
| full_determinism | false |
| model selection | VALIDATION Macro-F1, greater_is_better true |
| checkpoint selection | VALIDATION Macro-F1, load_best_model_at_end true |
| evaluation / save strategy | epoch / epoch |
| save_total_limit | 2 |
| score semantics | UNCALIBRATED |
| score → ppm | `floor(score * 1000000 + 0.5)` at AI/Python boundary once; 이번 단계에는 변환 runtime 구현 없음 |

약 15.77 GiB RAM의 CPU 환경에서 작은 micro-batch 4와 accumulation 4를 선택했다. 학습 backward의 실제 peak RAM과 처리량은 아직 측정하지 않았고 OOM-free를 보장하지 않는다. eval은 backward가 없으므로 batch 8로 고정하되 latency 측정값으로 표현하지 않는다. CPU에서는 CUDA mixed precision의 이득·지원 근거가 없어 사용하지 않는다.

Pinned Transformers의 `TrainingArguments`로 위 설정의 API 호환성을 검증했다. loss/metrics/seed 적용 runner와 best-checkpoint 선택 실행은 다음 승인 단계에 구현한다. 따라서 **설정 검증 완료 ≠ 학습/모델 평가 완료**다.

- Data location: environment variable `VERIMOD_BEEP_SPLITS`; files `train.jsonl`, `validation.jsonl`만 allowlist.
- Fine-tuned artifact location (아직 없음): `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu`.
- Training result location (아직 없음): `ai/artifacts/reports/w3_baseline/beep-klue-roberta-base-w3-seed45126-cpu`.
- Source cache: `ai/.venv/hf-cache` (ignored).
- 이번 spec report location: `ai/artifacts/reports/w3_baseline/`.

## Reproducibility

Seed 45126을 Python `random`, NumPy, PyTorch CPU/CUDA, Trainer seed/data_seed 및 DataLoader에 동일하게 적용하는 runner를 다음 단계에 구현한다. 이번 source-load compatibility check에는 Python/NumPy/PyTorch seed를 적용했지만 학습 runner를 구현·실행했다고 주장하지 않는다. CUDA seed는 사용 가능한 CUDA device가 있을 때 적용하며 현재 CUDA 실행 검증은 없다.

Dependency lock: [`requirements-w3.lock.txt`](../../ai/requirements-w3.lock.txt), 실제 설치된 7개 runtime root와 그 recursive `Requires-Dist` closure 33개를 exact pin했다. marker는 현재 Windows/Python, optional extras 없음으로 평가했다. whole-venv `pip freeze`를 복사하지 않았고 editable package·test tool 등 무관한 package는 제외했다. 개발 테스트 도구는 별도 `pytest==9.1.1`을 사용했다.

| Direct runtime dependency | Actual installed version |
|---|---|
| torch | 2.14.1+cpu |
| transformers | 4.57.6 |
| accelerate | 1.15.0 |
| huggingface_hub | 0.36.2 |
| scikit-learn | 1.9.1 |
| numpy | 2.5.3 |
| safetensors | 0.8.0 |

Transformers는 조회 당시 최신 4.x patch `4.57.6`을 선택하여 5.x major 전환을 이번 보수적 baseline에 포함하지 않았다. CPU torch는 실제 cp312/win_amd64 wheel 설치·import·모델 로드로 확인했다. `tokenizers==0.22.2`, `scipy==1.18.1` 및 나머지 전이 dependency도 lock/environment에 기록했다. local JSONL과 표준 library로 읽을 수 있으므로 pandas/pyarrow/datasets/TensorFlow는 추가하지 않았다. PyYAML은 Transformers 전이 dependency이며 실행 config는 JSON이다.

설치 source: torch는 `https://download.pytorch.org/whl/cpu` index에서 설치했고 나머지는 `https://pypi.org/simple`을 사용했다. Lock의 torch entry는 설치 report가 기록한 공식 CPU wheel direct URL과 SHA-256으로 고정했다.

- Wheel: `torch-2.14.1+cpu-cp312-cp312-win_amd64.whl`.
- URL: `https://download-r2.pytorch.org/whl/cpu/torch-2.14.1%2Bcpu-cp312-cp312-win_amd64.whl`.
- Wheel SHA-256: `c52adc3bd526ff7fc5bdcc58fc4a76e6214d09951b646ffe5256ebd7ba60cef1`.

**재현 범위:** Windows x64 / CPython 3.12.14 / CPU. 다른 OS나 CUDA 환경은 이 wheel의 대상이 아니며 새 환경 evidence/lock 검증이 필요하다. 동일 seed도 다른 hardware/driver/library 조합에서 bitwise identical result를 보장하지 않는다. source/model/tokenizer revision, split hashes, preprocessing, runtime pin, 설정은 고정되어 있으나 training 결과·deterministic 연산 여부는 아직 검증하지 않았다. 동일 환경 tokenizer summary 재실행의 일치는 verification report에 기록한다.

Repository root에서 재현하는 PowerShell 명령 (Python 3.12.14 사전 준비):

```powershell
python -m venv ai/.venv
& ai/.venv/Scripts/python.exe -m pip install -r ai/requirements-w3.lock.txt
& ai/.venv/Scripts/python.exe -m pip install -e ai --no-deps
& ai/.venv/Scripts/python.exe -m pip install pytest==9.1.1
& ai/.venv/Scripts/python.exe -B -m pip check

# 첫 실행은 pinned tokenizer download, 다음 실행은 --offline 사용 가능.
# 이 경로는 현재 workspace layout 예시이며 committed config의 data path가 아니다.
& ai/.venv/Scripts/python.exe -B ai/scripts/analyze_w3_token_lengths.py --splits-dir ../verimod-local-data/w2/beep-splits
& ai/.venv/Scripts/python.exe -B -m pytest -q -p no:cacheprovider -c ai/pyproject.toml ai/tests
```

Python `random` seed와 별도로 프로세스의 hash seed까지 고정하려면 runner 실행 전에 `$env:PYTHONHASHSEED = '45126'`을 설정한다. 환경변수 설정은 runner 승인 후 실행 절차에 포함한다. 실제 training command는 runner 미구현이므로 아직 만들거나 실행하지 않았다.

## Verification

- Config JSON parse, native taxonomy/score keys/reference, immutable revisions, seed, preprocessing, UNCALIBRATED, SEALED, Primary-only 및 absolute path 배제를 검증한다.
- Unit test: [`test_w3_baseline_config.py`](../../ai/tests/test_w3_baseline_config.py). TEST/unknown/duplicate split 요청을 읽기 전에 거부하는 boundary test와 measured max_length 선택을 포함한다.
- 기존 AI 테스트 소스를 먼저 검토했다. 실제 sealed dataset을 읽는 테스트는 없으며 synthetic/temporary fixture만 사용하는 것을 확인했다. synthetic fixture의 `test.jsonl`은 실제 sealed TEST가 아니다.
- 최초 sandbox 실행은 temporary directory의 Windows 권한 오류로 `15 failed, 54 passed, 6 errors, 8 subtests passed`였다. 실행 환경 문제를 PASS로 덮지 않고 기록했다. 동일 guard를 유지한 sandbox 밖 재실행 결과와 실제 stdout은 [`verification.json`](../../ai/artifacts/reports/w3_baseline/verification.json)에 기록한다.
- 재실행 결과: **69 passed, 8 subtests passed in 0.84s**. 신규 config/boundary 테스트 10개와 기존 AI 테스트 59개 모두 통과했다. Config parse 및 실제 config의 `TrainingArguments` 검증 PASS, 33개 runtime pin 설치값 일치, `pip check`: `No broken requirements found.`
- 재실행 audit hook은 실제 external data directory의 open을 차단한다. tokenizer 재분석 구간만 TRAIN/VALIDATION 2개 파일을 허용하고 테스트 구간에는 실제 dataset 전체를 차단했다. 분석은 각 1회 open, 테스트는 실제 dataset open 0건, 차단 요청도 0건이었다. 동일 환경 tokenizer summary는 재실행에서도 일치했다. staged paths는 0건이었다.
- Model/tokenizer metadata 및 사전학습 source load check는 임시 검증 script로 수행했다. canonical/hash/Merkle/protocol/schema는 수정하지 않았다. report의 SHA-256은 file artifact provenance이며 protocol canonical hash를 구현한 것이 아니다.
- `ai/.gitignore`의 기존 reports allowlist로 작은 JSON report 4개는 추적 가능하다. ignore rule 변경 없이 raw dataset, source cache, model weights, checkpoint를 보호한다.
- `git diff --check`, tracked diff 및 신규 파일 내용을 검토한다. staged raw dataset/model weight/API token 0건; stage/commit/push 없음.

이번에 실제 실행한 주요 shell 명령:

```powershell
git status --short
git rev-parse HEAD
git branch --show-current
Get-CimInstance Win32_OperatingSystem
Get-CimInstance Win32_Processor
Get-CimInstance Win32_ComputerSystem
Get-CimInstance Win32_VideoController

& ai/.venv/Scripts/python.exe -B -m pip install torch==2.14.1+cpu --index-url https://download.pytorch.org/whl/cpu --cache-dir ai/.venv/pip-cache --report ai/.venv/w3-torch-install.json --retries 1 --timeout 30
& ai/.venv/Scripts/python.exe -B -m pip install transformers==4.57.6 accelerate huggingface_hub scikit-learn numpy safetensors --index-url https://pypi.org/simple --cache-dir ai/.venv/pip-cache --report ai/.venv/w3-runtime-install.json --retries 1 --timeout 30
& ai/.venv/Scripts/python.exe -B ai/scripts/analyze_w3_token_lengths.py --splits-dir ../verimod-local-data/w2/beep-splits --offline
git diff --check
git diff --stat
git diff --cached --name-only
```

임시 compatibility/guard 검증 script는 repository 밖의 현재 작업 visualization `tmp/`에 두고 `ai/.venv/Scripts/python.exe -B -u`로 실행했다. 지속 보관하는 결과는 위 4개 JSON이다. 실패한 최초 analyzer 실행은 Windows relative `..` path 해석 차이로 allowlist path guard가 파일을 읽기 전에 거부했다. `os.path.abspath`로 경로를 정규화한 뒤 동일 검사와 실제 해시 검증으로 성공했으며 dataset provenance는 달라지지 않았다.

## Scope Boundary

- Primary only, actual 3-class only. Secondary training 결합 없음; legacy synthetic five-label runtime 복원 없음.
- TEST 미열람, 모델 학습 미실행, validation model inference 미실행. Tokenization은 model inference가 아니다.
- threshold/policy tuning, real-model I1 fixture, training runner, actual Model Manifest, Experiment Registry, FastAPI /infer는 이번 단계 범위 밖이며 완료로 기록하지 않는다.
- Artifact/result location은 예정 경로이며 fine-tuned weights, 성능 metric, latency 결과는 아직 없다.
- UNCALIBRATED score를 probability로 표현하지 않는다. `none != ALLOW`.
- Model Manifest commitment가 actual model execution을 증명하지 않는다. Blockchain은 AI correctness, 최초 기록의 truthfulness, 전체 moderation log completeness/freshness를 증명하지 않는다.
- 이 단계에는 anchor 실행 없음. Actual external anchor 전 상태는 PENDING_ANCHOR다.
- CPU의 실제 fine-tuning peak memory/소요 시간은 다음 승인 단계의 확인 대상이다. Weight 재배포 전에는 HF license field 부재와 upstream CC BY-SA 선언의 provenance를 유지해 확인한다.
- 주진호의 다음 단계 승인 전 training으로 자동 진행하지 않는다.

STATUS: SPEC_FROZEN / TRAINING_NOT_STARTED
