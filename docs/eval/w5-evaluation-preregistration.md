# W5 AI-12 평가 사전 준비 — 실제 TEST 실행 불가

상태: **AI-12-PREPARATION 준비 코드 구현 / 실제 AI-12 BLOCKED · TEST SEALED**.
이 문서는 평가 방법의 초안이며 실제 Model/Policy LOCK 또는 TEST 실행 승인이 아니다.

## 구현 범위와 경계

- `ai/src/verimod_ai/evaluation/w5_preregistration.py`: 기존 모델 지표, 정책 지표, bootstrap 함수를 연결한 고정 합성 fixture 평가와 승인 metadata 형식 검사.
- `ai/scripts/prepare_w5_evaluation.py`: `check-preparation`, `synthetic-dry-run`만 동작한다. `test-evaluate`는 항상 종료 코드 3으로 거부한다.
- 실제 데이터 경로 인자·데이터 로더·모델 로더·실제 추론·LOCK 파일 생성·Git 조작 기능은 없다.
- `--save-evidence`는 `ai/artifacts/reports/w5_ai12_preparation/<UTC+UUID>/preparation.json`을 새로 만든다. 기존 증거를 덮어쓰지 않는다.
- 합성 결과는 `SYNTHETIC_ONLY`, 합성 latency는 `SYNTHETIC_ONLY_NOT_MEASURED`로 표시한다. 이는 모델 성능이나 실제 추론 속도의 증거가 아니다.

## 고정 평가 설정

| 항목 | 사전 준비 값 |
|---|---|
| Bootstrap repetitions | 1,000 |
| Seed | 20260923 |
| Confidence level | 0.95 |
| Percentiles | 2.5 / 97.5 |
| 모델 지표 | Accuracy, Macro-F1, 클래스별 Precision/Recall/F1, confusion matrix |
| 정책 지표 | FRR, RP, HAR, HRR_TOTAL 및 각 분자·분모, action count |
| Latency 연결 | mean / p50 / p95, ms; 현재 값은 전부 합성 |

기존 `bootstrap.py`의 percentile 구현을 그대로 재사용한다. 정의된 bootstrap 통계량 k개를 정렬하여 lower는 `floor(alpha/2*k)`, upper는 `ceil((1-alpha/2)*k)-1` 인덱스를 사용한다. 이산 표본, 부동소수 alpha, 보간 방법에 따라 다른 라이브러리의 percentile과 차이가 있을 수 있으므로 최종 LOCK 전에 이 구현과 코드 hash를 고정해야 한다. 이번 작업은 기존 bootstrap 함수를 변경하지 않는다.

모델의 zero denominator는 기존 계약대로 `0.0`과 `*_defined=false`를 함께 반환한다. Macro-F1은 3개 선언 클래스를 모두 포함한다. 정책 zero denominator는 `null`이다. 개별 클래스 CI에서는 정의되지 않은 bootstrap 통계량을 제외하고 `n_undefined`를 기록한다. 모든 통계량이 undefined면 interval도 `null`이다. 이 경우 조건부로 정의된 표본의 CI라는 한계를 함께 보고해야 한다.

## 그룹과 독립 관측 가정

기본 합성 시험은 12행·6개 가상 article group을 사용하며 group 전체를 재표집한다. 별도의 item 모드는 iid 가정을 명시한 합성 대조 시험이다. 실제 평가 자료에 article/thread/source 등의 반복 구조가 있다면 행 독립성을 자동 가정하지 않는다. 원문 대신 사전에 정의된 group identifier를 평가기에 전달하는 계약을 LOCK 전에 정해야 한다. 실제 그룹 구조는 아직 확인하지 않았고, 합성 그룹 설정은 실제 자료에 대한 주장도 아니다.

실제 latency 프로토콜도 LOCK 이전에 batch size, CPU/GPU 및 소프트웨어 환경, warm-up 개수, 측정 경계(tokenization 포함 여부), 동기화 방식과 단위, 샘플 제외 규칙을 정해야 한다. 현재 p50/p95는 nearest-rank 요약 연결만 검증한다.

## 승인 및 LOCK 선행 guard 설계

현재 metadata 검사는 메모리에 전달한 기록의 형식만 검사한다. **서명, 사용자 승인 진위, Git 객체 존재, Manifest hash 일치 여부를 인증하지 않는다.** 형식 검사가 PASS여도 `execution_allowed=false`, `execution_status=BLOCKED`다. 이름이나 boolean 하나로 실제 실행을 허용하지 않는다.

별도로 승인받을 실제 평가기는 최초 데이터 접근 전에 다음을 검증해야 한다.

1. Validation으로 확정한 모델·전처리·calibration·threshold·정책·평가 코드와 지표 정의가 일치한다.
2. 팀장의 명시적인 X/B 및 Model/Policy 승인 기록이 있다.
3. 실제 LOCK commit과 기록 시각을 확인하고, Manifest·모델·평가 코드 hash를 그 commit에 결합한다. 현재 HEAD가 같다는 주장만으로 대체하지 않는다.
4. 별도 최초 TEST 실행 승인이 LOCK 이후 기록되며 정확한 LOCK SHA를 참조한다.
5. 승인된 동일 평가의 최초 1회 실행임을 영속적으로 보장하는 claim과 중단·재시작 정책을 갖춘다. 장애를 이유로 무승인 재평가하지 않는다.
6. 위 검증을 통과한 뒤에만 승인된 입력에 최초 접근한다. 이후 threshold 조정·모델 재선정·반복 튜닝을 허용하지 않는다.

현재 코드에는 실제 평가기가 없으며 위 항목이 충족되어도 이 준비 버전의 `test-evaluate`는 실행하지 못한다. 실제 구현 연결과 실행은 별도 구체적 승인 이후의 작업이다.

### 10/22 추가: Git 결합·1회 claim 준비 primitive (합성 범위)

[w5_execution_guard.py](../../ai/src/verimod_ai/evaluation/w5_execution_guard.py)는 위 3~5번 중 **데이터 없이 검사 가능한 부분만** 준비한다. 실제 평가기·데이터 로더·모델 로더·CLI는 없다.

- `exact_rate`: X/B를 `{numerator, denominator}` 정수 분수로만 받는다. float·bool·범위 밖·safe integer 초과를 거부해 `0.0585 < 32/547` 같은 반올림 오류를 막는다.
- `inspect_git_lock`: 호출자가 지정한 5개 역할(model/policy manifest, evaluation code, preregistration, approval record)의 **역할별 allowlist 경로**만 Git 객체에서 읽는다. 경로 검사와 승인 SHA 일치 검사는 Git·파일 접근 전에 수행한다. LOCK이 실제 commit인지, HEAD의 조상인지, `approved_at ≤ LOCK commit 시각 < 최초 평가 승인 시각` 순서인지, 잠긴 blob의 SHA-256과 HEAD의 바이트가 같은지, symlink/submodule이 아닌지를 확인한다. 모두 통과해도 `execution_allowed=false / BLOCKED / SEALED`를 반환한다.
- `reserve_campaign_claim`: LOCK SHA·run UUID와 무관한 고정 campaign 이름으로 배타적 디렉터리를 만든다. 빈·손상·실패·완료 claim 모두 재시도를 막으며, 메타데이터 기록 실패 시에도 예약을 지우지 않는다. TTL·force·삭제 경로는 없다.

`verimod.w5.lock-preflight.v1`은 **제안 schema이며 A/F가 채택한 LOCK 계약이 아니다.** 남은 한계: Git committer 시각은 사용자가 설정할 수 있어 승인 진위가 아니다. 승인 기록의 `source_sha256`은 형식만 검사한다. 바이트 일치는 정책 의미·승인 내용의 일치를 뜻하지 않는다. 가중치·tokenizer·환경·전이 의존 코드는 아직 결합하지 않았다. 임시 디렉터리 claim 시험은 운영 저장소의 권한·전원 장애·다중 호스트 내구성을 보장하지 않으며, 실제 고정 registry 위치는 별도로 확정해야 한다.

## 재현 명령

저장소 루트에서 실행하며 아래 명령은 실제 데이터에 접근하지 않는다.

```powershell
ai/.venv/Scripts/python.exe -B -m pytest -p no:cacheprovider -q ai/tests/test_w5_preregistration.py
ai/.venv/Scripts/python.exe -B ai/scripts/prepare_w5_evaluation.py check-preparation
ai/.venv/Scripts/python.exe -B ai/scripts/prepare_w5_evaluation.py synthetic-dry-run --save-evidence
ai/.venv/Scripts/python.exe -B ai/scripts/prepare_w5_evaluation.py test-evaluate
```

마지막 명령의 기대 결과는 **종료 코드 3 / BLOCKED / TEST SEALED**이며 실행 성공이 아니다. 합성 dry-run 성공은 AI-12 실제 평가 PASS 또는 G5-02 통과로 계산하지 않는다.

## 이번 구현에서 실행한 검증

- `test_w5_preregistration.py`: **24 passed**. 고정 설정, 합성 분자·분모, group/iid CI, 반복 재현성, undefined 분모, 잘못된 latency, 승인·LOCK 순서·digest 형식, 실제 실행 및 파일 쓰기 거부를 검사했다.
- 기존 `test_model_metrics.py`, `test_policy_metrics.py`, `test_bootstrap.py`: **20 passed**. 기존 함수는 수정하지 않았다.
- 합성 dry-run: **PASS**. 신규 증거는 [preparation.json](../../ai/artifacts/reports/w5_ai12_preparation/20261021T042306Z-b93a05853bc0/preparation.json)에 저장했다.
- `check-preparation`: 실제 승인 metadata가 없으므로 **BLOCKED / TEST SEALED**를 반환했다.
- `test-evaluate`: **BLOCKED / TEST SEALED**, Python 종료 코드 **3**을 확인했다. PowerShell에서 코드 보존이 필요하면 명령 다음 줄에서 `exit $LASTEXITCODE`를 사용한다.

- 10/22 실행 guard: `test_w5_execution_guard.py` **43 passed**를 포함한 W5 A 관련 8개 파일 **166 passed / 실패·오류·skip 0**. 합성 Git 저장소와 pytest 임시 디렉터리만 사용했다(8개 프로세스 동시 claim 중 1건만 성공 포함). 같은 시점 `test-evaluate`는 다시 **종료 코드 3 / BLOCKED**였다. [verification.json](../../ai/artifacts/reports/w5_ai12_execution_guard/20261022T062534Z-5d4c8800/verification.json)에 명령·소스 SHA-256·한계를 기록했다. 이 166건은 과거 102/128/61건과 중복되므로 합산하지 않는다.

위 검증에는 실제 모델 inference, 데이터·운영자료 열람, LOCK 생성, TEST 최초 평가가 포함되지 않는다. 최종 commit SHA는 상위 W5 통합 실행 기록에서 추적한다.
