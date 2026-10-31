# 담당 간 인계 문서

> **대상:** A·F·T 및 멘토 · **읽기 기준:** W7 인계와 과거 W4 운영 기록을 분리합니다. 각 문서의 작성 시점과 기준 SHA를 확인하세요.

## W7 데모 인계

| 자료 | 목적 |
| --- | --- |
| [W7 Core Demo 인계](W7-core-demo-approved-handoff-20261030.md) | Option B 범위·역할·남은 조건 |
| [5-Beat 리허설 계획](W6-W7-five-beat-rehearsal-20261029.md) | 480초 목표 배분과 실행 후 기록할 항목 |
| [멘토링 한눈에 보기](../mentoring/mentor-brief-20261031.md) | 현재 근거·한계·멘토 질문 |
| [심사위원용 실행 안내](../08-submission-guide.md) | 실제 및 합성 모드의 실행 경로 |

## W4 역사적 인계

A(AI)·F(서비스)·T(체인) 사이에 무엇을 넘기고 어떤 조건을 지켜야 하는지 적은 문서입니다. 처음 보신다면 **[운영 절차와 다섯 승인](W4-AFT-operations.md)** 부터 읽으면 전체 흐름이 잡힙니다.

| 문서 | 방향 | 내용 |
| --- | --- | --- |
| [W4-AFT-operations.md](W4-AFT-operations.md) | 팀 전체 | 두 노트북 운영 구조, 승인 1~5단계와 현재 상태, 복구 원칙 |
| [w4-anchored-epoch-public/](w4-anchored-epoch-public/20261020-r01/README.md) | 공개 | **실제 Base Sepolia에 등록된 Epoch 1**: tx, proof/anchor 포함 영수증 2건, 브라우저 검증 화면 |
| [w4-frozen-epoch-public/](w4-frozen-epoch-public/20261017-r01/README.md) | 공개 | 송신 전 동결 시점의 Epoch 1과 영수증 2건(proof/anchor null)과 SHA-256 |
| [W4-T-epoch-handoff.md](W4-T-epoch-handoff.md) | T | 블록체인 송신 전후 규칙 (송신 전 F 확인, 같은 bytes만 송신) |
| [W4-F-durable-callback-runner.md](W4-F-durable-callback-runner.md) | F → T | 송신 전 원본 DB에 먼저 기록하는 callback 연결 안내 |
| [W4-F-trusted-confirmation.md](W4-F-trusted-confirmation.md) | F | 블록체인 등록을 12회 확인 후 CONFIRMED로 인정하는 계약 |
| [W4-F-prebroadcast-durability.md](W4-F-prebroadcast-durability.md) | F → T | 송신 전 SQLite 경계의 원래 설계와 과거 결함 기록 |
| [W4-A-to-FT.md](W4-A-to-FT.md) | A → F/T | A가 발견한 manifest·issuer 문제와 수정 요청 (해소됨) |
| [W4-A-revalidation-plan.md](W4-A-revalidation-plan.md) | A | F/T 수정 후 A 재검증 절차 |
| [W4-F-actual-host-run-request.md](W4-F-actual-host-run-request.md) | A ↔ F | 실제 모델 호스트에서 발급·고정을 실행한 요청서 |
| `W4-F-frozen-epoch.schema.json` | F | Frozen Epoch 인계 JSON 스키마 |
