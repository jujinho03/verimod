# AI-19 판정 — 2026-10-27

Owner: A / 주진호 · 사전 점검 2026-10-27 14:26:52~14:27:22 KST · 물리 오프라인 실측 2026-10-27 15:44:24~15:44:59 KST (06:44:24~06:44:59 UTC) · 브랜치 `jujinho` HEAD `44842f78` (원격과 동일, 추적 파일 변경 0)

## 판정: **AI-19: PASS — VERIFIED PHYSICAL OFFLINE INFERENCE** (기술 판정, 2026-10-27 A 독립 감사)

사용자가 직접 네트워크를 끊고 `physical-offline` 모드를 1회 실행했다(`physical-offline-result.json`). `classification=OK`, `isolation_verdict=PHYSICAL_OFFLINE_VERIFIED`(5개 check 모두 true)이고, 서버 종료 후 재확인(`network_after`)도 `PHYSICAL_OFFLINE_VERIFIED`다. 아래 "최종 독립 감사" 12개 항목이 모두 충족되어 PASS_CANDIDATE를 PASS로 확정했다.

**이 PASS의 범위:** R01 모델이 외부 네트워크 없이 이 PC에서 실제로 추론한다는 기술 판정이다. 정책 승인, LOCK 승인, TEST 승인, E6 전체 PASS를 뜻하지 않는다.

## PASS 조건별 상태

| 조건 | 결과 | 근거 |
|---|---|---|
| R01 가중치 존재 | PASS | `selected_model/model.safetensors`, 442,505,820 bytes |
| 가중치 SHA-256 일치 | PASS | `a8288baf…9e5f` = 기대값 |
| config·Manifest 파일 hash | PASS | 서비스 고정값(CRLF 정규화)과 일치. Manifest hash `0x96b33780…ad0b7c1` |
| Tokenizer 고정·로딩 | PASS | revision `02f94ba5…` snapshot 존재, `local_files_only=True`로 로딩(/healthz 200의 전제). 파일 4개 SHA-256 수집 |
| 의존성 | PASS | service lock 18개, W3 lock 32개 고정 버전과 불일치 0. `pip check` 정상 |
| 실행 환경 | 기록 | Windows 11 10.0.26200, CPython 3.12.14, torch 2.14.1+cpu(CUDA 없음), transformers 4.57.6, tokenizers 0.22.2, fastapi 0.143.0, uvicorn 0.54.0 |
| `HF_HUB_OFFLINE=1` | PASS | launcher가 강제, 검증기도 설정 |
| **물리 네트워크 차단** | **PASS** | 외부 DNS 2건·TCP 3건 모두 실패, Internet 프로필 0, 물리 어댑터 Up 0(Wi-Fi Disconnected), Up 어댑터의 기본 경로 0, 어댑터 조회 성공. Up 상태는 Tailscale(기본 경로 없음, LocalNetwork)과 VMnet1/8뿐. 라우팅 테이블에 남은 Wi-Fi 기본 경로는 어댑터가 Disconnected라 실패 사유가 아니다 |
| `/healthz` | PASS (물리 오프라인) | 200, ready=true, 시작 20.5초 (온라인 사전 점검 18.5초) |
| `/infer` | PASS (물리 오프라인) | 200. 무해한 새 한국어 문장 → `hate 3401 / offensive 10902`, `FULL`(온라인 사전 점검과 동일). 첫 호출 884ms, 이후 5회 74~80ms |
| 출력 계약 | PASS | 10개 항목 + 기존 `validate_i1` 통과(manifest hash, UNCALIBRATED, taxonomy, score key 2개, 범위, commitment 반환) |
| Fail-closed | PASS | 공백 입력 → 400 `EMPTY_INPUT`, inference 객체 없음 |
| 결정적 재현 | 참고 | 같은 입력의 점수가 W4 AI-09 기록(2026-10-14)과 동일 |
| 서버 정리 | PASS | 검증기가 띄운 프로세스만 종료(`server_exit_code=1`은 Windows terminate의 정상값). 실행 후 포트 8099 비어 있음, 잔존 프로세스 없음 |
| W4 산출물 불변 | PASS | W4 범위의 추적 파일 변경 0(`ba8b7bc` 기준). 미추적 W4 디렉터리 1개는 기존부터 있던 것 |

**지연시간은 참고값이다.** 이 PC 1대, CPU, batch 1, 표본 6건이다. 성능 주장에 쓰지 않는다.

## 확인한 공백 (변경하지 않음)

- 서비스는 tokenizer 파일 hash를 검사하지 않는다. 이번에 수집한 hash는 증거용이다. W5 runtime binding 구현이나 LOCK이 아니다.
- HF 캐시 snapshot에는 base 모델 가중치(`model.safetensors`)도 있다. 서비스는 이것을 쓰지 않고 `selected_model` 경로의 R01만 로드한다(SHA 검증).

## 발표 주장 범위

**AI-19 PASS(확정) — 허용:** "인터넷 없이 로컬 R01 모델로 실제 추론합니다(LOCAL MODEL — LIVE INFERENCE)."

**AI-19 PASS 이전(PARTIAL) 기준 표현 — 참고로 보존:**
- "같은 R01 모델을 로컬에서 실제로 추론합니다. 외부 AI API를 호출하지 않으며, HF 오프라인 모드로 실행합니다."
- 물리 오프라인 여부는 "검증 예정"이라고 말한다.

**금지:**
- 이 PC 1회 실측을 넘어 "어느 환경에서나 오프라인 동작 보장"이라고 말하는 것
- 새 추론 결과를 W4 Epoch 1에 포함된 것처럼 말하는 것
- 발급하지 않은 Receipt를 발급했다고 말하는 것
- 점수를 확률이라고 부르는 것(UNCALIBRATED)
- AI 추론 성공을 블록체인 무결성이나 판정 정확성의 증거처럼 말하는 것

## 2026-10-27 감사 반영

- **물리 오프라인 판정 기준 보강:** DNS/TCP 실패만으로 판정하지 않는다. 어댑터 상태(물리 어댑터 Up 여부), VPN을 포함한 기본 경로, Internet 연결 프로필, 어댑터 조회 성공 여부를 함께 요구한다(README 판정 규칙 5개). 보강한 검사를 현재 온라인 상태에서 실행한 결과는 `ONLINE_EXTERNAL_REACHABLE`이었다. 물리 어댑터 `Wi-Fi`가 Up이고 기본 경로를 가진 것을 정확히 실패로 잡았고, `Tailscale`과 `VMware VMnet1/8`은 기본 경로가 없는 가상 어댑터로 분류했다. 판정 로직만 바꿨으며 추론 경로는 바꾸지 않았다.
- **Tokenizer hash 공백:** Model Card 한계 문서에 기록했다. 이번에 runtime binding이나 LOCK을 구현하지 않는다.
- **W6 Engineering Exit 연계 (최종 실행계획 기준, 감사자 확인):**
  - E6(Base seed·LOCAL·Offline·Recording 준비): AI-19가 **Offline 항목만** 기여한다. AI-19가 PASS해도 E6 전체가 PASS되는 것은 아니다. Base seed는 W4 Epoch 1로 확보돼 있고, LOCAL·RECORDING Fallback 실증이 남았다(2026-10-27 사전 판정 E6 PARTIAL).
  - E7(Data Card·Model Card·README·Evidence 정합): AI-19 증거가 Evidence 일부로 기여한다.

## 물리 오프라인 실측 기록 (2026-10-27)

- 결과 파일: `physical-offline-result.json`, 서버 로그 `server-physical-offline-20261027T064424Z.log`. 검증기 SHA-256 `46193fafb3599294b8d829a17510237b632dd33cf0d22762928c37005a9db090`(감사 반영본과 동일).
- 같은 폴더에 `server-physical-offline-20261027T064322Z.log`(15:43 KST)가 하나 더 있다. 서버 기동 로그만 있고 결과 JSON이 없으므로, 결과 파일을 쓰기 전에 중단된 실행이다(검증기는 정상 종료 시에만 JSON을 쓴다). 이 실행은 판정에 쓰지 않으며, 삭제하지 않고 그대로 둔다. 판정 근거는 15:44 실행 1회뿐이다.
- 이번 결과는 W6 신규 실측이다. W4 결과를 재집계한 것이 아니다.

## 최종 독립 감사 (2026-10-27, PHASE 1)

| # | 검사 | 결과 | 근거 |
|---|---|---|---|
| 1 | 실행 당시 검증기 SHA | PASS | `ai19_probe.py` SHA-256 `46193fafb3599294b8d829a17510237b632dd33cf0d22762928c37005a9db090`. 파일 수정 시각 14:34 KST(감사 반영 직후)로 실행(15:44) 이전이며 이후 변경 없음 |
| 2 | 결과 JSON 입력·출력·검증 | PASS | 입력 `PROBE`(무해한 한국어 1문장, commitment `0xab…ab`), `HF_HUB_OFFLINE=1`·`TRANSFORMERS_OFFLINE=1`, 출력 `scores_ppm`·계약 10개·`validate_i1` true |
| 3 | PASS_CANDIDATE 로직 | PASS | `ai19_verdict=PASS_CANDIDATE`는 `classification=OK`일 때만 나온다. physical-offline 모드에서 `isolation_verdict≠PHYSICAL_OFFLINE_VERIFIED`이면 `classify()`가 `NETWORK_ISOLATION_NOT_VERIFIED`를 반환하므로 OK가 될 수 없다 |
| 4 | 물리 오프라인 조건 5개 | PASS | DNS·TCP 5건 전부 실패 / Internet 프로필 0 / 물리 어댑터 Up 0 / Up 어댑터 기본 경로 0 / 어댑터 조회 5개 성공 |
| 5 | Wi-Fi·기타 외부 연결 | PASS | Wi-Fi(유일한 `HardwareInterface=true`) Disconnected, Bluetooth PAN Disconnected. Up은 Tailscale(IPv4 등급 3=LocalNetwork, 기본 경로 없음)과 VMnet1/8뿐 |
| 6 | 모델 artifact hash | PASS | 가중치 `a8288baf…9e5f`, config·Manifest(LF) 기대값 일치, Manifest hash `0x96b33780…ad0b7c1` |
| 7 | `/healthz`·`/infer` | PASS | 200/ready, 200/FULL, warm 5회 모두 200, 공백 입력 400 `EMPTY_INPUT` |
| 8 | W4 AI-09 기록과 일치 | PASS | [ai/AI09.md](../../../ai/AI09.md) `korean_short`와 입력 문장·commitment가 같고 점수 `hate 3401 / offensive 10902`가 같다(2026-10-14 기록) |
| 9 | `server_exit_code=1` | 정상 | 검증기의 `finally`가 서버가 살아 있을 때만 `proc.terminate()`를 호출한다. Windows에서 `Popen.terminate()`는 `TerminateProcess(handle, 1)`이므로 종료 코드 1이 의도된 값이다. 강제 종료라 로그에 shutdown 줄이 없다. JSON의 `server_pid`(26944)는 venv 실행기, 로그의 PID(31112)는 실행기가 띄운 실제 인터프리터다 |
| 10 | 잔여 프로세스·포트 | PASS | 감사 시점 포트 8099 비어 있음, `serve_w4_inference` 프로세스 0개 |
| 11 | 중단 로그 분리 | PASS | 아래 실행 목록 참조 |
| 12 | 실제 실행만 증거 포함 | PASS | 판정 근거는 15:44 실행 1회. 온라인 사전 점검은 `OFFLINE_CONFIG_ONLY`로 별도 표시. W4 결과를 재집계하지 않음 |

**발견한 공백(변경하지 않음):** 서비스는 tokenizer 파일 hash를 검사하지 않는다(W6 A4 미구현). 이번 증거는 tokenizer 파일 4개의 hash를 수집했을 뿐 binding이 아니다.

### 실행 목록

| 시각 (KST) | 모드 | 파일 | 분류 | 판정 사용 |
|---|---|---|---|---|
| 14:26:52~14:27:22 | online-config | `online-offline-config-smoke.json`, `server-online-config-20261027T052652Z.log` | OFFLINE_CONFIG_ONLY (네트워크 연결 상태) | 사전 점검만 |
| 15:43:22 | physical-offline | `server-physical-offline-20261027T064322Z.log` (결과 JSON 없음) | **ABORTED / NOT_USED_FOR_PASS** | 사용 안 함 |
| 15:44:24~15:44:59 | physical-offline | `physical-offline-result.json`, `server-physical-offline-20261027T064424Z.log` | OK / PHYSICAL_OFFLINE_VERIFIED | **판정 근거** |

15:43 실행은 서버 기동 로그만 남았다. 검증기는 일반 예외가 나도 결과 JSON을 쓰므로, JSON이 없다는 것은 프로세스가 사용자 중단(Ctrl+C) 또는 창 닫기 등으로 끝났다는 뜻이다. 정확한 원인은 기록이 없어 확인하지 못했다. 15:44 실행이 포트 8099를 비어 있는 상태로 찾았으므로(사용 중이면 `SERVER_START_FAILED`) 그 서버는 이미 종료돼 있었다. 로그는 삭제하지 않았다.

## Beat 1 연계

- AI 추론 성공과 F의 authoritative Receipt 발급은 **별도 조건**이다. Beat 1에서 새 Receipt를 보여주려면 F의 `/api/decisions` 경로와 서버 검증을 따로 확인해야 하며, 앵커 전에는 PENDING이다.
- AI-19가 PARTIAL로 남으면 발표에서는 "로컬 실제 추론(온라인 환경)" 또는 기록된 결과(RECORDED)로 표시한다.
