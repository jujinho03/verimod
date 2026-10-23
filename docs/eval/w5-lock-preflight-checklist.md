# W5 AI-12 LOCK 사전점검표 — 실제 LOCK 아님

기준일: 2026-10-22 KST · Owner: A / 주진호 · 상태: **사전점검 PARTIAL / LOCK 미실행 / TEST SEALED**.

이 표는 실제 Model/Policy LOCK을 요청하기 전에 무엇이 준비됐고 무엇이 남았는지 정리한 것이다.

- AI-12 guard는 합성 준비 범위에서 PASS다([검증 기록](../../ai/artifacts/reports/w5_ai12_execution_guard/20261022T062534Z-5d4c8800/verification.json), 166 passed). 그 결과를 재사용했으며 새로 실행하지 않았다.
- guard는 모든 검사를 통과해도 `execution_allowed=false`를 반환한다. 이번 작업에서 이 값을 해제하지 않았다.
- LOCK 파일을 만들지 않았고, TEST 경로도 조회하지 않았다.

## 점검 결과

| 항목 | 현재 근거 | 상태 | LOCK 전 남은 일 |
|---|---|---|---|
| 정확한 LOCK SHA 결합 | `inspect_git_lock`: commit 객체 여부, HEAD 조상 여부, 승인 SHA 일치를 합성 Git으로 검증 | 합성 PASS | 실제 LOCK commit에 대해 실행 (LOCK 승인 후) |
| LOCK 파일 불변 | HEAD의 LOCK blob이 잠긴 bytes와 같은지, 5개 역할 artifact의 SHA-256과 HEAD bytes가 같은지 검사 | 합성 PASS | 제안 schema `verimod.w5.lock-preflight.v1`을 A/F가 채택해야 함 |
| 모델 가중치 identity | [R01 Model Manifest](../../ai/artifacts/manifests/AI07-BL-KLUE-RB-45126-R01.model_manifest.json): `artifact_sha256`(safetensors), model revision `02f94ba5…` | Manifest에 기록됨 | 실제 실행 직전에 로컬 가중치 bytes와 이 hash를 대조하는 단계가 평가기에 없음 |
| tokenizer identity | `tokenizer_revision`(HF revision)만 있음 | **공백** | 로컬 tokenizer 파일 bytes의 hash를 결합해야 함. 오프라인 캐시가 바뀌어도 감지할 수 없기 때문. 설계안: [런타임 결합](w5-model-runtime-binding-design.md) |
| 전처리 identity | `preprocessing_version=verimod-ko-text-v1`, max_length 128, truncation rule | Manifest에 기록됨 | 전처리 소스 파일 hash를 LOCK의 evaluation_code 역할 등에 결합 |
| 평가 코드 고정 | guard는 evaluation_code 역할의 **단일 파일**만 결합 | 부분 | 평가기가 import하는 모든 모듈(metrics, policy, bootstrap)을 결합하는 방식 결정 |
| 실행 환경 고정 | Manifest의 `dependency_lock_sha256`은 학습용 `requirements-w3.lock.txt`(`8b61fa68…`)와 일치 | 부분 | 추론 환경 `requirements-w4-service.lock.txt`(`a2966194…`)는 결합 안 됨. 평가에 쓸 lock과 Python 버전(로컬 3.12.14)을 확정해야 함. 설계안: [런타임 결합](w5-model-runtime-binding-design.md) |
| 정책 identity | 새 Policy Manifest/hash 미생성 | **BLOCKED** | 정책 승인 → A/F 합의 → Manifest 확정 ([계약 제안](../handoffs/W5-A-F-policy-contract-proposal.md)) |
| 1회 claim 영속 위치 | `reserve_campaign_claim`은 임시 디렉터리에서만 시험. 고정 campaign 이름 사용, TTL·삭제 경로 없음 | 합성 PASS | 운영 위치 결정 필요. 저장소 checkout 밖의 고정 경로를 제안하며, Git-ignored 경로는 checkout을 교체하면 사라짐 |
| 중복 실행·실패 처리 | 빈·손상·실패·완료 claim 모두 재시도를 차단. 기록 실패 시에도 예약 유지 | 합성 PASS | 실패 시 재평가는 "사유 기록 + commit 후 팀장 별도 승인"으로만 허용(D27). 자동 복구 경로 없음 |
| 그룹·latency·bootstrap | 합성 group bootstrap 1000회, seed 20260923, 2.5/97.5 | 설정 고정 | 실제 그룹 식별자 계약과 latency 측정 규약(batch, warm-up, 측정 경계) 확정 |
| 실제 평가기 | `test-evaluate`는 항상 종료코드 3으로 거부. 데이터 로더 없음 | 미구현(의도적) | LOCK 승인 이후 별도 구현·검토 |

## 승인 구분 — 혼동 금지

| 승인 | 범위 | 포함하지 않는 것 |
|---|---|---|
| 연구 방향 승인 (10/22 받음) | S1/S2/S3 연구·시연 정책을 비교하는 것 | X/B 최종값, 후보 채택, Manifest, LOCK, TEST |
| RESEARCH_DEMO 정책 승인 (대기) | [승인란](w5-research-policy-scenarios.md#5-팀장-승인란--research_demo-범위)의 X/B·후보 | Manifest 확정, F 변경, LOCK, TEST |
| LOCK 승인 (미요청) | LOCK 파일 생성·commit | TEST 개봉 |
| 최초 TEST 평가 승인 (미요청) | 정확한 LOCK SHA에 묶인 1회 평가 | 재평가, threshold 재조정 |

guard가 검사하는 `authorization.scope`는 `FIRST_TEST_EVALUATION`만 허용한다. 연구 방향 승인이나 정책 승인 기록으로는 통과할 수 없는 구조다.
