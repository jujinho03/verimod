# VeriMod 협업 규칙

## 리뷰

- protocol bytes, I1~I4 schema, Merkle 규칙, TrustProfile, ABI 변경은 담당자 외 1명 이상이 검토한다.
- 테스트·lint·build 결과와 변경한 문서를 PR 설명에 함께 적는다.
- CURRENT 구현, TARGET 계획, WORKING ASSUMPTION을 섞어 쓰지 않는다.

## 작업 영역 담당

- `ai/**` 변경의 primary reviewer는 A / 주진호다.
- `ai/` 변경이 I1 등 protocol interface에 영향을 주면 T / 설경민 검토가 필요하다.
- frontend가 소비하는 계약에 영향을 주면 F / 노유신 검토가 필요하다.
- 영역별 담당은 [README Code map](README.md#코드-구성)을 따른다.

## FRZ-01 이후 protocol 변경

동결 뒤 변경은 별도 spec-change 기록을 먼저 만든다. 기록에는 변경 이유, canonical/hash/fixture/ABI/migration 영향, 호환성, 필요한 golden·회귀 테스트, 승인자를 포함한다. 동결된 bytes 또는 ABI를 코드만으로 우회 변경하지 않는다.

## 비밀값과 개인정보

`.env`와 전용 테스트 지갑을 사용한다. private key, RPC secret, salt, 원문, appeal 본문은 커밋·로그·issue·screenshot에 넣지 않는다. `signed_tx`는 서명된 거래이지 개인키가 아니다.
