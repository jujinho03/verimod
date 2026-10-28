# W6 AI-19 — R01 오프라인 추론 검증 증거

Owner: A / 주진호 · Ticket: AI-19 · 기준 브랜치 `jujinho` `44842f78` (main `efce466d`) · 상태: **PASS — VERIFIED PHYSICAL OFFLINE INFERENCE** (물리 오프라인 실측 2026-10-27 15:44 KST, A 독립 감사 완료). 정책·LOCK·TEST 승인이나 E6 전체 PASS가 아니다

## 파일

| 파일 | 내용 | 상태 |
|---|---|---|
| `ai19_probe.py` | 독립 실행형 검증기. 외부 서비스나 에이전트 없이 실행된다. 네트워크 설정을 바꾸지 않는다. 자기가 띄운 서버만 정리한다 | 작성·실행 완료 |
| `run-offline-ai19.ps1` | 위 검증기를 `physical-offline` 모드로 호출하는 얇은 실행기 | 작성. 실행 정책이 허용하는 경우에만 사용 |
| `online-offline-config-smoke.json` | 사전 점검 원본 결과(2026-10-27 14:26 KST). 네트워크 **연결** 상태 + HF offline 설정 | 실행됨 |
| `server-online-config-*.log` | 위 실행의 서버 로그 | 실행됨 |
| `preflight.json`, `environment.json`, `artifact-verification.json` | 위 원본 결과를 항목별로 나눈 것(값 복사이며 재측정 아님) | 생성됨 |
| `physical-offline-result.json` | 물리 네트워크 차단 상태 실행 결과 | 실행됨(사용자 수동). `OK` / `PHYSICAL_OFFLINE_VERIFIED` |
| `server-physical-offline-*.log` | 위 실행의 서버 로그. `064424Z`가 판정 근거, `064322Z`는 결과 JSON 없이 중단된 실행 — **ABORTED / NOT_USED_FOR_PASS** | 실행됨 |
| `ai19-final-assessment.md` | 판정, 최종 독립 감사 12항목, 실행 목록, 발표 주장 범위 | 작성 |

## 물리 오프라인 실행 방법 (사용자 수동, 1회)

1. Wi-Fi, 유선 Ethernet, 휴대폰 테더링을 모두 끈다. Tailscale 같은 VPN은 끄지 않아도 된다(외부 연결이 끊기면 함께 끊긴다).
2. 저장소 루트에서 PowerShell을 열고 아래 **한 줄**을 실행한다. 실행 정책을 바꾸거나 우회할 필요가 없다.
   ```powershell
   & .\ai\.venv\Scripts\python.exe -B .\docs\evidence\w6-a-ai19-offline\ai19_probe.py --mode physical-offline
   ```
3. 약 1분 뒤 `[AI-19] ... classification=... verdict=...`가 출력되면 인터넷을 다시 연결한다.

결과는 이 폴더의 `physical-offline-result*.json`과 `server-physical-offline-*.log`에 저장된다. 실패해도 원인이 함께 기록된다.

## 판정 규칙 (검증기 내부)

- 물리 오프라인 인정(`PHYSICAL_OFFLINE_VERIFIED`)은 아래 `isolation_checks` 5개가 **모두** 참일 때만이다. `HF_HUB_OFFLINE=1`만으로는 인정하지 않는다.
  1. `external_dns_tcp_all_failed`: 외부 DNS 2건과 TCP 3건(1.1.1.1:443, 8.8.8.8:53, huggingface.co:443)이 모두 실패
  2. `no_internet_connectivity_profile`: Windows 연결 프로필 중 Internet 상태인 것이 없음
  3. `no_physical_adapter_up`: 물리 어댑터(Wi-Fi·Ethernet·USB/Bluetooth 테더링, `HardwareInterface=True`) 중 Up인 것이 없음
  4. `no_default_route_on_up_adapter`: Up 상태 어댑터(VPN 포함) 중 기본 경로(0.0.0.0/0, ::/0)를 가진 것이 없음
  5. `adapter_query_succeeded`: 어댑터 조회가 실제로 성공함(조회 실패를 오프라인으로 오인하지 않기 위함)
- `isolation_detail`에 Up인 물리·VPN·가상 어댑터를 나눠 기록한다. 기본 경로가 없는 가상 어댑터(VMware 등)가 Up인 것은 실패 사유가 아니다. VPN(Tailscale 등)은 기본 경로를 가졌거나 외부 프로브가 성공했을 때만 실패 사유가 된다.
- 실패 분류(감사용이며 API 오류 코드가 아님): `MODEL_NOT_FOUND`, `ARTIFACT_HASH_MISMATCH`, `TOKENIZER_NOT_CACHED`, `DEPENDENCY_MISMATCH`, `SERVER_START_FAILED`, `INFERENCE_TIMEOUT`, `INFERENCE_UNAVAILABLE`, `CONTRACT_MISMATCH`, `NETWORK_ISOLATION_NOT_VERIFIED`
- 포트 8099가 이미 사용 중이면 기존 프로세스를 종료하지 않고 `SERVER_START_FAILED`로 기록한다.
- 사설 게이트웨이 IP는 기록하지 않는다(`REDACTED_GATEWAY`).

## 하지 않은 것

새 학습, calibration, Policy Manifest, LOCK, TEST 데이터 접근, 체인 송신, 운영 DB 쓰기, T/F 소스 변경, 서비스 코드 변경, Git commit·push를 하지 않았다.
