# W3 A 재현성과 인계

## 공식 실행

- 실행: `AI07-BL-KLUE-RB-45126-R01`.
- 판정: KEEP_AS_W3_BASELINE; 추가 모델/정책 비교는 이후 과제로 남습니다.
- 등록부: `ai/experiments/registry.jsonl` (공식 항목 1건).
- 패키징 중 R01은 다시 실행하지 않았습니다. 합성 입력 3건만 두 번 추론했습니다.

## 소스

- execution_base_head: `09d72598dcd1d6744d4c80b99af0721d4c1efedc`.
- source_commit_at_execution: **null**; R01은 dirty tree에서 실행했습니다.
- source_snapshot_commit: `f6b39d3b7c5637b68e18c2b1b59ee91890c059f0` (실행 후 snapshot).
- 출처: PASS_WITH_DOCUMENTED_LIMITATION. 실행 시점 pyproject SHA는 기록되지 않았으며,
  현재 hash를 과거 값으로 채우면 안 됩니다. 실행 lock/config hash와 런타임 목록은 보존했습니다.
  [소스 출처](w3-a-r01-source-provenance.md)를 봅니다.
- 검증기는 이 commit에서 기록된 LF/CRLF bytes를 메모리에서 복원해 과거 hash 12개를 모두 검증합니다.
  소스 파일을 다시 쓰지 않습니다. 줄바꿈이 정규화된 Git blob과 원래 실행 byte hash는 서로 다릅니다.

## 환경

- Windows 11 x64; Python 3.12.14; PyTorch 2.14.1+cpu; Transformers 4.57.6.
- Intel Core i5-1035G4 CPU; RAM 16,930,271,232 bytes; CUDA 없음; mixed precision NONE.
- 고정 seed 45126; torch intra-op thread 4, inter-op thread 1.
- 로컬 JS 검사: Node 24.10.0 / npm 11.6.1. 저장소 CI는 Node 24.19.0 / npm 12.0.2로 고정합니다.
- 과거 패키지 목록: `ai/artifacts/reports/w3_baseline/environment.json`.

## 설치

history에 source snapshot이 있고 마감 파일이 있는 깨끗한 checkout을 씁니다.
아래 명령은 저장소 루트 기준이며, 먼저 CPython 3.12.14 x64를 설치합니다.

```powershell
python -m venv ai/.venv
& ai/.venv/Scripts/python.exe -m pip install -r ai/requirements-w3.lock.txt
& ai/.venv/Scripts/python.exe -m pip install -e ai --no-deps
& ai/.venv/Scripts/python.exe -m pip install pytest==9.1.1
npm --prefix backend ci
```

lock은 CPU torch wheel 출처와 정확한 하위 패키지를 명시합니다. 장치 전체 pip freeze로 바꾸거나
몰래 CUDA 빌드로 바꾸지 않습니다.

오프라인 fixture 재생 전에 고정 tokenizer cache를 준비합니다.

```powershell
& ai/.venv/Scripts/python.exe -c "from huggingface_hub import snapshot_download; snapshot_download('klue/roberta-base', revision='02f94ba5e3fcb7e2a58a390b8639b0fac974a8da', cache_dir='ai/.venv/hf-cache', allow_patterns=['config.json','tokenizer*','special_tokens_map.json','vocab.txt'])"
```

선정된 학습 가중치/config는 승인된 비공개 채널로 따로 전달해야 하며 Git에 없습니다. 쓰기 전에
hash를 검사합니다. base pretrained cache만으로는 선정 모델이 아닙니다.

## 데이터셋 준비

새 split을 만들지 않고 이미 만든 내부 split 산출물을 씁니다. `ai/configs/w2_dataset.json`이
데이터셋 revision/split 의미의 출처입니다. 과거 준비 구현은 `ai/scripts/prepare_w2_dataset.py`이며,
이 인계를 위해 원시 source 준비를 다시 실행하거나 TEST를 재생성/재개방하지 않습니다.
논리 splits 디렉터리에는 `train.jsonl`과 `validation.jsonl`만 비공개로 준비합니다.

| Split | N | SHA-256 |
|---|---:|---|
| TRAIN | 5857 | fc9a70cdffc2dad297d37e1724d8011e070e17dd251f2d061ec40f7ea2d89a2b |
| VALIDATION | 1255 | a92f81ed8eadb9fdb1950be542f9edac4fe778f3e7bd2d630cd1494ef031a26a |

데이터셋 revision: `f8d05dce2b22007bb149e5139c0060c68ad8f94b`; split seed 45126.
`training/dataset.py`는 train/validation만 허용하며, 건수/hash/label을 검증하고 경로를 해석하기 전에
TEST를 거부합니다. metadata 검증이나 합성 fixture 재생에는 TEST가 필요 없습니다.

## 학습

과거 공식 명령(기록용일 뿐 마감 중 다시 실행하지 않음):

```powershell
& ai/.venv/Scripts/python.exe -B ai/scripts/train_w3_baseline.py --config ai/configs/w3_baseline.json --splits-dir ../verimod-local-data/w2/beep-splits --run-id AI07-BL-KLUE-RB-45126-R01 --offline
```

R01을 덮어쓰거나 재사용하지 않습니다. 따로 승인된 이후 재현에는 빈 산출물 작업 공간, 다른 run ID,
오프라인 학습용 고정 base 모델 cache가 필요합니다. 동결 config는 바꾸지 않습니다. 이 마감은 추가 학습
실행을 승인하지 않습니다. 원래 config의 `training_status: NOT_STARTED`는 실행 전 동결 상태이며,
실제 R01 완료는 run_identity/registry에 기록돼 있습니다.

## 기대 Validation 기준값

Macro-F1 **0.6524599868976999**; Micro-F1 **0.6629482071713148**; Accuracy **0.6629482071713148**.
보존된 R01 전체 VALIDATION 결과이며, TEST나 합성 fixture 성능이 아닙니다.
하드웨어/드라이버/라이브러리 조합이 다르면 bit 단위로 같은 가중치가 나온다고 보장하지 않습니다.

## 선정 산출물

- 경로: `ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model/model.safetensors`.
- SHA-256: `a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f`.
- Best step: 1101; 구조 RobertaForSequenceClassification; 파라미터 수 110620419.
- Manifest: `ai/artifacts/manifests/AI07-BL-KLUE-RB-45126-R01.model_manifest.json`.

## Manifest hash 계산

Canonical hash: `0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1`.

```powershell
node backend/node_modules/tsx/dist/cli.mjs ai/scripts/w3_protocol_bridge.mts ai/artifacts/manifests/AI07-BL-KLUE-RB-45126-R01.model_manifest.json
```

bridge는 `shared/protocol/src/canonical.ts`의 T 소유 `canonicalBytes`와
`shared/protocol/src/hash.ts`의 `domainHash(DOMAINS.model, ...)`를 호출합니다.
`shared/protocol/src/manifests.ts:manifestHashes`가 쓰는 방식과 정확히 같습니다. Domain: `verimod:model:v1`; protocol: `verimod/1`.
Python canonicalization, 프로토콜 hash, Merkle 구현은 추가하지 않았습니다.

공유 canonical profile은 안전한 정수 JSON 숫자만 받습니다. Manifest 지표 값은 원래 숫자 지표 보고서에서
복사한 명시적 10진수 문자열이며 정확한 값을 유지합니다. 일반 `manifest_file_sha256`은 별도의 byte 출처이며
줄바꿈/형식에 따라 달라질 수 있으므로, model_manifest_hash 대신 쓰지 않습니다.

## Fixture 재현

원래 fixture와 독립 프로세스 재생에 실제로 실행한 명령:

```powershell
& ai/.venv/Scripts/python.exe -B ai/scripts/generate_w3_fixture.py
& ai/.venv/Scripts/python.exe -B ai/scripts/generate_w3_fixture.py --output ai/artifacts/results/AI07-BL-KLUE-RB-45126-R01/handoff_repeat.json --compare ai/fixtures/w3_real_model_i1_fixture.json
```

이후 검증에서는 `--output`으로 쓰지 않은 새 경로를 고르고, 커밋된 fixture와의 `--compare`는 유지합니다.
기존 출력 파일은 덮어쓰기에서 보호됩니다.
AI가 작성한 한국어 합성 입력 3건을 verimod-ko-text-v1(code point 500개 HEAD)로 전처리한 뒤,
고정 tokenizer로 128 token에서 오른쪽을 자릅니다. 선정 CPU 모델 점수는
`floor(score * 1_000_000 + 0.5)`로 한 번 반올림하며 ppm 합계를 보정하지 않습니다. native 점수는 모두 증거로
남고, I1에는 hate/offensive만 노출합니다. `none`은 ALLOW가 아닙니다. 기대 label이나 attribution을 꾸며내지 않습니다.

실제 독립 프로세스 2회 실행에서 logits, score, ppm, 예측 클래스, 입력 상태, manifest 참조가 허용 오차 없이
정확히 일치했습니다. timestamp는 다르며 결정적 출력이 아닙니다.
보고서: `ai/artifacts/reports/w3_handoff/fixture_reproducibility.json`.

**CROSS_MACHINE_VERIFICATION = NOT_EXECUTED.** 로컬 반복은 다른 PC 검증이 아닙니다.

## 단일 검증 명령

```powershell
& ai/.venv/Scripts/python.exe -B ai/scripts/verify_w3_handoff.py --model-dir ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model
```

등록부, manifest, fixture/I1 형태, 공유 manifest hash, source snapshot, 모델 bytes를 검사합니다.
추론은 하지 않습니다. `--model-dir` 없이 실행하면 `METADATA_VERIFIED_ARTIFACT_UNVERIFIED`를 명시적으로
보고하며, 지정한 가중치가 없으면 모델 PASS가 아니라 NOT_AVAILABLE을 보고합니다.
이 부분 모드는 로컬에서 시험했으며 다른 장치 증거가 아닙니다.

## 계약

상태: **A_OUTPUT_READY_CONSUMER_ALIGNMENT_REQUIRED** (W3 당시).

- A 검증기는 `ai/src/verimod_ai/inference/contract.py`의 정확한 TypedDict key와 기존 A taxonomy를 재사용합니다.
- fixture envelope 3개는 모두 원격 commit `e5f2bdcc49a5182d25ba9cfb96f6d591d44ca0a4`(`backend/src/inference.ts`)의
  실제 F `assertValidInference`를 통과합니다. bridge는 그 Git blob을 읽어 기존 esbuild로 TS 타입을 지우고,
  hash import를 실제 공유 module에 묶습니다. 검증기 본문을 다시 구현하지 않았습니다. `--consumer-ref` 뒤에
  그 SHA를 붙여 재현합니다.
- 당시 main/공유 Receipt 스키마는 실제 taxonomy를 INVALID_SCHEMA로 거부했습니다. T 브랜치
  `0b6622cdcca843a7ec0638a6cf84fcf31f01ba87`도 같은 과거 공유 schema/types/manifest 코드였습니다.
- 처음 fetch했을 때 origin/main은 아직 `09d72598dcd1d6744d4c80b99af0721d4c1efedc`였고, T/F W3 작업은
  별도 브랜치에 있었습니다. 확인만 했으며, 병합 승인이 없어 병합하지 않았습니다.
- 공유 스키마 검사에는 추론 검증기에 도달하기 위한 합성 placeholder 정책 필드만 있습니다. 정책 결정이나
  발급 receipt가 아닙니다. authoritative 발급, Merkle epoch, registerEpoch, 외부 앵커는 실행하지 않았습니다.
  앵커 상태는 **PENDING_ANCHOR**입니다.
- 과거 5개 라벨로의 가짜 변환은 없습니다. shared/backend/frontend 소스 계약을 바꾸지 않았습니다.
- 당시 main에는 F W3 발급 서비스가 없었습니다. 이는 검증기 수준의 인계 증거이며 런타임 E2E가 아닙니다.

검증 보고서: `ai/artifacts/reports/w3_handoff/verification.json`.

> 이후 경과: W3 공동 통합은 main `1401e03`에서 이루어졌고, 2026-10-18 main 병합으로 T/F의 W4
> BEEP 스키마와 발급 서비스가 main에 들어왔습니다. 이 fixture는 `backend/test/w3-joint.test.ts`에서
> F W4 발급 경로로 계속 검사합니다.

## 경계

TEST 봉인; Primary만; native 3-class; 점수 uncalibrated; 운영 적합성 주장 없음;
threshold lock, 정책 lock, calibration, secondary 평가, W4 서비스 구현 없음.
추론 실패는 Receipt 상태와 분리돼야 합니다. 의도한 unavailable 경계는 Decision Receipt 0건의
503 INFERENCE_UNAVAILABLE입니다. 여기에는 가짜 점수나 ALLOW 대체 경로를 추가하지 않았습니다.
