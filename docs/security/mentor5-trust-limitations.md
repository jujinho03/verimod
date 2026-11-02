# Mentor 5 — 누락과 RPC 신뢰의 한계

기준 코드 `7a6aa2ad27ad58d0454b39f28a07d069ac4e93b1`. 현 검증은 제공된 Receipt의 무결성과 공개 commitment에 대한 포함을 다룬다. 판정의 객관적 정확성, 최초 기록의 정직성, 실제 모델 실행, 전체 판정의 완전성을 보증하지 않는다.

## 발급 및 등록 누락

`shared/protocol/src/epoch.ts`와 `docs/spec/merkle-spec.md`의 issuer sequence 검사는 freeze 대상 epoch 내부의 연속성을 다룬다. `backend/src/epochs.ts`는 해당 DB에서 아직 epoch에 포함되지 않은 receipt를 모은다. 이 조건만으로 모든 플랫폼 사건이나 비공개 전체 발급 이력이 관찰 가능한 것은 아니다.

| 경우 | 현재 외부 관찰 가능성 |
| --- | --- |
| 발급받은 Receipt가 아직 등록되지 않음 | 소유자가 자신의 Receipt를 대조할 수 있으나 지연과 영구 누락 구분에는 별도 기한·감사 규칙 필요 |
| 발급자는 사건을 처리했으나 Receipt 자체를 만들지 않음 | 발급 기록만으로 사건 존재를 알 수 없음. 독립적인 사건 증거 필요 |
| 일부 발급 이력 또는 sequence 범위 자체를 공개하지 않음 | epoch 내부 연속성만으로 숨겨진 범위를 완전하게 검증할 수 없음 |

후속 후보는 발급 시 서명된 receipt 및 수신자 보관, 외부 감사자가 관찰 가능한 issuer sequence 구간 commitment, epoch 간 연속성 검증, 발급자와 감사자의 역할 분리 및 소유자 대조다. 단일 발급자가 서명과 sequence를 모두 통제하면 아예 기록하지 않은 사건까지 증명하지 못한다. 이 문서는 새 서명, 프로토콜 버전 또는 누락 탐지 기능을 구현하거나 승인하지 않는다.

## RPC 응답

승인 profile의 체인·컨트랙트·publisher, event/getter, 거래와 confirmation 검사에도 브라우저는 읽은 RPC 응답을 관찰 자료로 사용한다. 두 endpoint는 장애 시 대체 경로이지 양쪽 합의가 검증 성공의 필수조건은 아니다. 악의적 또는 잘못 동기화된 공급자가 상호 일관된 거짓 응답을 제공하면 이 검증만으로 진실한 체인 상태를 독립적으로 보증할 수 없다. 12회 L2 confirmation은 L1 finality가 아니다.

후속 후보는 운영적으로 독립적인 다중 공급자의 동일 block hash 기준 결과 비교, 불일치 시 fail-closed, 신뢰할 수 있는 시점의 블록 기준점, 검증 가능한 상태·receipt 증명 및 별도 consensus/light-client 검토다. 두 응답 일치만으로 암호학적 독립 증명이 되지는 않으며 공통 upstream, 공통 장애·같은 거짓 응답 가능성을 포함해야 한다. 현재 trust profile을 완화하거나 다중 RPC 합의가 이미 구현됐다고 주장하지 않는다.
