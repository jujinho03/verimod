# shared — 팀 공통 규칙

frontend, backend, 컨트랙트 송신기가 **같은 바이트·같은 hash**를 쓰도록 공통 코드를 한곳에 둡니다.

| 폴더 | 내용 |
| --- | --- |
| [protocol/](protocol/README.md) | 영수증 직렬화(canonical JSON)·hash·Merkle·스키마 검증 TypeScript 패키지 `@verimod/protocol` |
| `vectors/` | 언어·환경이 달라도 같은 결과가 나오는지 확인하는 회귀 벡터(`receipt-regression-v1.json`)와 golden 결과 |

Python 쪽 독립 검증은 [tools/golden](../tools/README.md)에 있습니다.
