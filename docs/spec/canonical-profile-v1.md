# Canonical Profile v1 — W1 초안

상태: **WORKING ASSUMPTION** (FRZ-01 전). 소유: PROTOCOL. 이 문서는 W1에서 확인한 browser PoC의 현재 바이트 동작과 W2 동결 대상의 차이를 분리한다.

## 목적과 범위

`ReceiptBody`만 canonical bytes로 만든다. receipt hash, Merkle proof, epoch locator, transaction 정보와 검증 상태는 body 밖 `VerificationBundle`에 둔다. 이 규칙은 AI 판정의 정확성이나 실제 추론 수행을 증명하지 않는다.

## CURRENT — `frontend/src/domain/canonical.ts`

| 항목 | 실제 동작 |
|---|---|
| 허용 값 | `null`, boolean, safe integer, string, array, plain object |
| 숫자 | JavaScript safe integer만 허용. 소수, 지수 표기, `NaN`, `Infinity`, 범위 밖 정수는 거부 |
| 객체 키 | JavaScript `sort()`의 UTF-16 code-unit 오름차순 |
| 문자열 | `JSON.stringify` 이스케이프, lone surrogate 거부, NFC 등 정규화 없음 |
| 배열 | 입력 순서 보존 |
| 출력 | 공백 없는 JSON 문자열의 UTF-8 bytes |

현재 구현은 RFC 8785 전체 적합성을 주장하지 않는다. 외부 JSON은 `frontend/src/domain/json.ts`의 `parseUniqueJson`으로 파싱하며, 중복 키, 1 MiB 초과 입력, 64단계 초과 중첩을 거부한다. bundle 형식 검증은 `frontend/src/domain/schema.ts`에 있다. `verify.ts`는 canonical bytes를 receipt hash 재계산 경로에서 소비한다.

## TARGET — FRZ-01 동결 후보

1. 위 CURRENT bytes 규칙을 기존 fixture와 함께 보존한다.
2. 외부 JSON 파서 경계에서는 중복 키 거부, 최대 1 MiB, 최대 깊이 64를 적용한다. 이 항목은 W2 구현/회귀 대상이며 CURRENT 기능으로 표기하지 않는다.
3. 숫자는 전체 프로토콜에서 정수만 사용한다. 점수는 `scores_ppm`이며 소수의 canonicalization은 허용하지 않는다.
4. 텍스트 전처리와 Unicode 정규화는 AI 입력 단계의 책임이다. canonical body에서는 정규화하지 않는다.
5. Node와 browser, 독립 Python golden 구현이 같은 input bytes/hash를 산출해야 한다. 이는 RFC 8785 적합성 인증이 아니다.

## Hash 경계

receipt hash는 `SHA-256(ASCII("verimod:receipt:v1") || 0x00 || canonical_body_utf8)`이다. `receipt_hash`는 32 raw bytes로 leaf 단계에 넘기며, hex 문자열의 UTF-8 bytes를 leaf 입력으로 사용하지 않는다.

## W2 전 확인 항목

- DECISION/APPEAL/REVIEW의 required, null, unknown-field 행렬을 schema에 고정한다.
- 기존 3종 fixture의 canonical bytes와 receipt hash를 회귀 벡터로 고정한다.
- 한글, astral key, null-vs-omitted, safe-integer 경계, duplicate key를 포함한 golden vector를 추가한다.
