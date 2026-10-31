# 실행·검증 증거

> **대상:** 멘토·검토자 · **목적:** 코드·CI·실행·담당자 보고·계획을 증거 수준별로 구분합니다.
>
> **기준:** 2026-10-31 문서 조사. 원본의 시각·실행 SHA·수치·제약은 각 증거 문서가 기준이며, 다른 실행의 성공으로 재사용하지 않습니다.

## 증거 수준과 현재 진입점

| 수준 | 의미 | 자료 |
| --- | --- | --- |
| `VERIFIED_CODE` | 명시된 SHA에서 코드 존재·경로를 확인 | [공유 프로토콜](../../shared/protocol/README.md) · [프런트엔드](../../frontend/README.md) |
| `VERIFIED_CI` | 해당 SHA의 GitHub job 결과 | [기준 main CI 41178415036](https://github.com/jujinho03/verimod/actions/runs/41178415036) |
| `VERIFIED_EXECUTION` | 문서에 명시된 환경과 시점의 실행 | [W4 공개 앵커](../handoffs/w4-anchored-epoch-public/20261020-r01/README.md) · [AI-19](w6-a-ai19-offline/ai19-final-assessment.md) |
| `OWNER_REPORTED` | 담당자 실행 보고; 원본 로그의 독립 확인은 별도 | [W6 F RPC 요약](w6-f/20261029/README.md) · [W7 LIVE 발급 보고](https://github.com/jujinho03/verimod/pull/42) |
| `SYNTHETIC` | 모의 입력·DB·RPC·원장으로 수행 | [F confirmation 회귀](w4-f-confirmation/20261017/README.md) |
| `PLANNED` | 실행 전 계획·목표 | [480초 리허설 시트](../handoffs/W6-W7-five-beat-rehearsal-20261029.md) |
| `NOT_VERIFIED` | 필요한 증거 또는 확인이 부족 | [멘토링·OPS-04 감사](../mentoring/w7-mentoring-evidence-audit-20261030.md) |

W4 공개 Receipt의 실제 앵커와 W7 새 R01 발급은 별도 사례입니다. W7 신규 Receipt는 기존 앵커에 포함됐다는 근거가 없으며 `PENDING_ANCHOR`로 보고됐습니다. `VERIFIED_EXECUTION`도 해당 문서에 기록된 범위만 뜻하며 다른 환경의 독립 재실행을 뜻하지 않습니다.

AI-19의 오프라인 실행은 공개 요약과 JSON에 기록돼 있지만 원본 HTTP 로그는 독립 확인되지 않았습니다. W6 F의 RPC 수치와 W7 발급 보고도 담당자 보고와 원본 독립 검증 여부를 구분해 읽습니다.

## W4 역사적 증거

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
