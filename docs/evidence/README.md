# 실행·검증 증거

실제로 실행한 결과와 그 근거 파일입니다. 숫자·hash는 원본 JSON과 함께 보존합니다. **실제 실행, 합성 데이터 시험, 로컬 전용 시험을 각 문서에서 구분해 적었습니다.**

## W4 (최신)

| 문서 | 내용 |
| --- | --- |
| [w4-a-actual-frozen-epoch.md](w4-a-actual-frozen-epoch.md) | **실제 모델 → 영수증 2건 → Epoch 1 고정까지의 해설** (먼저 읽기 권장) |
| [w4-a-final-revalidation.md](w4-a-final-revalidation.md) | F/T 수정 후 A의 독립 E2E 재검증 (정상 2건, 실패 17건) |
| [w4-a-validation-policy.md](w4-a-validation-policy.md) | VALIDATION 1,255건 기반 정책 후보 25개 비교 |
| [w4-f-confirmation/](w4-f-confirmation/20261017/README.md) | F 블록체인 확인 절차 로컬 회귀 192건 (합성 DB·RPC stub) |
| [w4-f-callback/](w4-f-callback/20261017/README.md) | 송신 전 durable callback Windows 검증 |
| [w4-f-final-integration/](w4-f-final-integration/20261016-r01/README.md) | F 통합 준비 실행 기록 |
| [w4-f-windows-esm/](w4-f-windows-esm/20261016-r01/README.md) | Windows 실행 오류 수정과 smoke 검증 |
| `w4-mentor-docs-update/` | 멘토 문서 갱신 검증 기록 (JSON) |

## W3

| 문서 | 내용 |
| --- | --- |
| [w3-team-integration.md](w3-team-integration.md) | A/T/F 팀 통합과 로컬 Hardhat 공동 checkpoint |
| [w3-a-ai07-baseline-run.md](w3-a-ai07-baseline-run.md) | AI 공식 baseline 학습 결과 (Macro-F1 0.6525) |
| [w3-a-baseline-spec.md](w3-a-baseline-spec.md) | baseline 실행 명세 |
| [w3-a-runner-smoke.md](w3-a-runner-smoke.md) | 학습 runner smoke 시험 |
| [w3-a-r01-source-provenance.md](w3-a-r01-source-provenance.md) | 학습 소스 출처와 hash 대조 |
| [w3-a-reproducibility-handoff.md](w3-a-reproducibility-handoff.md) | 재현 방법과 인계 |
| [w3-a-final.md](w3-a-final.md) | W3 A 최종 마감 |
| `w3-team/` | 공동 checkpoint·회귀·보안 원본 JSON |

## W1

| 문서 | 내용 |
| --- | --- |
| [chain-01-base-sepolia-w1.md](chain-01-base-sepolia-w1.md) | Base Sepolia 테스트넷 자금 준비 |
| [fe-00-browser-qa-w1.md](fe-00-browser-qa-w1.md) | 브라우저 라우팅·화면 점검 |
