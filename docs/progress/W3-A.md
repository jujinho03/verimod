# W3 — A / 주진호

상태: **W3_A_COMPLETE_WITH_INTEGRATION_BLOCKER**. [최종 마감](../evidence/w3-a-final.md)에 적힌
최종 commit/push 확인을 조건으로 합니다. 이 문서는 A 담당 범위만 기록합니다.

| 티켓 | A 상태 | 근거 |
|---|---|---|
| AI-07 | COMPLETE | [공식 baseline R01](../evidence/w3-a-ai07-baseline-run.md) |
| AI-21 | COMPLETE | `ai/experiments/registry.jsonl`, KEEP_AS_W3_BASELINE |
| AI-08 | COMPLETE | 실제 Model Manifest + 공유 canonical hash |
| AI-16 | COMPLETE — A 패키지 | [재현성/인계](../evidence/w3-a-reproducibility-handoff.md), 실제 모델 합성 입력 fixture, 생성기/검증기 |

Source snapshot: `f6b39d3b7c5637b68e18c2b1b59ee91890c059f0`. 과거 pyproject hash 한계는
승인·문서화했습니다. TEST는 봉인 상태이며 Secondary, calibration, threshold, 정책 LOCK은 없습니다.
다른 장치에서의 검증은 NOT_EXECUTED입니다. 로컬 fixture 재생은 두 프로세스에서 정확히 일치했습니다.

W3 당시 F 브랜치 검증기는 실제 harmful score key 두 개를 통과시켰지만, main/공유 Receipt 스키마는 실제
taxonomy를 여전히 거부했습니다. 당시 가져온 origin/main은 W3 이전 기준이었고 F/T 작업은 별도 브랜치에
있었습니다. F/T의 W3 전체 상태는 A 테스트로 추론하지 않았고, 승인된 main 동기화 외의 브랜치 병합은 하지
않았습니다. 실제 authoritative Receipt / Hardhat / 외부 앵커 연동은 미실행이며 PENDING_ANCHOR입니다.

W4 작업은 시작하지 않았습니다.

> 이후 경과: W3 공동 통합은 main `1401e03`에서, W4 A/F/T 코드 통합은 2026-10-18 main 병합에서
> 이루어졌습니다. 최신 상태는 [W4 현황](W4.md)을 봅니다.
