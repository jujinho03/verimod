# 규격 문서

영수증·hash·Merkle·체인 신뢰 기준과 API/화면 설계 문서입니다. 실제 동작 코드는 [shared/protocol](../../shared/protocol/README.md)과 [backend/contracts](../../backend/contracts/README.md)에 있습니다.

## 프로토콜·신뢰

| 문서 | 내용 |
| --- | --- |
| [canonical-profile-v1.md](canonical-profile-v1.md) | 영수증을 항상 같은 바이트로 만드는 직렬화 규칙 |
| [merkle-spec.md](merkle-spec.md) | Merkle leaf·root·포함 증명 규칙 |
| [trust-profile.md](trust-profile.md) | 검증기가 믿는 체인·컨트랙트·publisher·확인 횟수 기준 |
| [i4-anchor-abi.md](i4-anchor-abi.md) | 블록체인 앵커 컨트랙트 ABI |

## 서비스 설계 (W1 초안)

| 문서 | 내용 |
| --- | --- |
| [api-db-contract.md](api-db-contract.md) | API·DB 계약 초안 |
| [backend-architecture-w1.md](backend-architecture-w1.md) | backend 아키텍처 초안 |
| [architecture-review.md](architecture-review.md) | F → T 아키텍처 검토 |
| [screen-requirements.md](screen-requirements.md) | 화면 요구사항 |
| [ui-audit-w1.md](ui-audit-w1.md) | 기존 UI 점검 결과 |
