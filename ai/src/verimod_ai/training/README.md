# training

W3 frozen baseline runner를 구현했습니다. 기준 config는 `ai/configs/w3_baseline.json`이며
TRAIN/VALIDATION만 로드합니다. TEST 및 alias 요청은 path resolve/stat/open 전에 거부합니다.

주진호의 공식 FULL run 승인으로 `AI07-BL-KLUE-RB-45126-R01`의 3-epoch 학습과
full VALIDATION 평가를 완료했습니다. 결과는 `docs/evidence/w3-a-ai07-baseline-run.md`에 기록했습니다.
I1 consumer 정렬은 이번 runner가 변경하지 않습니다.

- `dataset.py`: 기존 internal split provenance, preprocessing, canonical native mapping, deterministic smoke subset.
- `reproducibility.py`: seed/thread controls; bitwise reproducibility 보장 없음.
- `metrics.py`: 기존 metric skeleton의 Trainer adapter 및 one-vs-rest FPR/FNR.
- `runner.py`: pinned source, TrainingArguments, Trainer, best checkpoint, result export, throughput estimate.

Repository root에서 승인된 smoke 명령:

```powershell
$env:PYTHONHASHSEED = '45126'
& ai/.venv/Scripts/python.exe -B ai/scripts/train_w3_baseline.py --config ai/configs/w3_baseline.json --splits-dir ../verimod-local-data/w2/beep-splits --smoke --offline
```

SMOKE_ONLY는 각 split 32건 및 optimizer update 2회로 제한합니다. Model-only checkpoint는
`ai/artifacts/smoke/w3_runner/<UTC run>/`의 ignored 경로에 저장하며 resume용 optimizer state는 저장하지 않습니다.
정식 R01은 epoch 평가/저장과 optimizer state를 사용했습니다. `--run-id`는 공식 실행을 식별하며
기존 run ID와 artifact 경로의 덮어쓰기를 거부합니다. 추가 학습은 별도 승인 대상입니다.
명령에서 `--smoke`를 빼면 정식 실행 경로이므로 smoke 검증에 사용하지 마세요.

상세 실행·한계: `docs/evidence/w3-a-runner-smoke.md`.
