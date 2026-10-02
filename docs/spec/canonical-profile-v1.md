# Canonical Profile v1 — W2 검증 후보

상태: **D11 Canonical Profile v1 방향은 ADOPTED**. W2의 shared runtime·Node/browser·독립 golden 검증은 완료 후보 근거이며, FRZ-01과 Team GATE-2는 아직 pending이다. 소유: PROTOCOL. 이 문서는 [결정 등록부](../02-decision-register.md)의 D11 및 [계약 초안 C04](../04-interface-contract-draft.md)를 따른다.

## 목적과 범위

`ReceiptBody`만 canonical bytes로 만든다. receipt hash, Merkle proof, epoch locator, transaction 정보와 검증 상태는 body 밖 `VerificationBundle`에 둔다. 이 규칙은 AI 판정의 정확성이나 실제 추론 수행을 증명하지 않는다.

## CURRENT — `frontend/src/domain/canonical.ts`

| 항목 | 실제 동작 |
|---|---|
| 허용 값 | `null`, boolean, safe integer, string, array, plain object |
| 숫자 | parsed numeric value는 JavaScript safe integer여야 한다. 비정수 값, `NaN`, `Infinity`, unsafe integer는 값 기준으로 거부한다. 원본 JSON lexical notation(예: exponent notation)을 canonicalizer가 별도로 보존·검사하는 것은 아니다 |
| 객체 키 | JavaScript `sort()`의 UTF-16 code-unit 오름차순 |
| 문자열 | `JSON.stringify` 이스케이프, lone surrogate 거부, NFC 등 정규화 없음 |
| 배열 | 입력 순서 보존 |
| 출력 | 공백 없는 JSON 문자열의 UTF-8 bytes |

현재 구현은 RFC 8785 전체 적합성을 주장하지 않는다. full JCS migration은 BACKLOG이며 이번 초안에서 채택하지 않는다. 외부 JSON은 `frontend/src/domain/json.ts`의 `parseUniqueJson`으로 파싱하며, 중복 키, 1 MiB 초과 입력, 64단계 초과 중첩을 거부한다. bundle 형식 검증은 `frontend/src/domain/schema.ts`에 있다. `verify.ts`는 canonical bytes를 receipt hash 재계산 경로에서 소비한다.

## TARGET — FRZ-01 동결 후보

1. 위 CURRENT bytes 규칙을 기존 fixture와 함께 보존한다.
2. frontend 외부 JSON parser가 이미 수행하는 중복 키 거부, 최대 1 MiB, 최대 깊이 64 guards를 protocol/shared profile로 동결하고 cross-runtime regression vector로 검증한다. 이는 기존 CURRENT guard의 공통화·동결 목표이며 W2에서 처음 구현한다는 뜻이 아니다.
3. 숫자는 전체 프로토콜에서 정수만 사용한다. 점수는 `scores_ppm`이며 소수의 canonicalization은 허용하지 않는다.
4. 텍스트 전처리와 Unicode 정규화는 AI 입력 단계의 책임이다. canonical body에서는 정규화하지 않는다.
5. Node와 browser, 독립 Python golden 구현이 같은 input bytes/hash를 산출해야 한다. 이는 RFC 8785 적합성 인증이 아니다.

D11의 UTF-8 / SHA-256 / domain separation / ordered Merkle 방향과 기존 PoC byte semantics를 보존한다. 이 문서에서 새 protocol rule이나 migration을 승인하지 않는다.

## Hash 경계

receipt hash는 `SHA-256(ASCII("verimod:receipt:v1") || 0x00 || canonical_body_utf8)`이다. `receipt_hash`는 32 raw bytes로 leaf 단계에 넘기며, hex 문자열의 UTF-8 bytes를 leaf 입력으로 사용하지 않는다.

## W2 전 확인 항목

- DECISION/APPEAL/REVIEW의 required, null, unknown-field 행렬을 schema에 고정한다.
- 기존 3종 fixture의 canonical bytes와 receipt hash를 회귀 벡터로 고정한다.
- 한글, astral key, null-vs-omitted, safe-integer 경계, duplicate key를 포함한 golden vector를 추가한다.

## W2 검증 결과

외부 JSON 숫자는 native JSON parser가 1e3과 1.0을 각각 정수 1000과 1로 만든 뒤 canonicalize한다. duplicate key는 escape 해제 후 같은 key도 거부한다. 이 lexical 정책을 PROTOCOL freeze candidate로 유지한다.

Node와 Chromium에서 정상3·키순서3·Unicode3·null/누락3·정수경계3·중복키2·시간형식3의 20개 회귀가 모두 통과했다. Python 표준 라이브러리 독립 구현은 canonical golden 6/6과 공개 ReceiptBody domain hash 3/3을 확인했다.
