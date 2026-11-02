# Mentor 5 — 모델 독립성과 모듈화 검토

기준 코드 `7a6aa2ad27ad58d0454b39f28a07d069ac4e93b1`. 아래는 구현 경계의 감사이며 완성된 범용 SDK 제품 세 개를 의미하지 않는다.

| 경계 | 현재 구현 | 새 모델을 연결할 때 필요한 검토 |
| --- | --- | --- |
| 추론 어댑터 | `backend/src/inference.ts`의 `InferenceAdapter.infer({text, contentCommitment})`와 `PolicyEvaluator.evaluate(inference)`가 분리. HTTP 어댑터는 실패·timeout을 fail-closed 처리 | I1 envelope·입력 처리·실패 및 지연 동작을 새 adapter가 만족해야 함 |
| 검증 및 정책 | `trustedModelHash`는 R01 run ID, taxonomy, score keys, semantics, 해시를 고정. `assertValidInference`, `assertValidPolicy`와 threshold evaluator 역시 W4의 필드·해시·규칙을 고정 | 승인된 새 manifest, taxonomy, 점수 의미, 정책, 검증 규칙과 보안 테스트가 필요. 환경변수만 바꾸어 일반 모델을 임의 연결할 수 없음 |
| 모델 실행 | `ai/src/verimod_ai/inference/service.py`는 R01 artifact 및 metadata hash, tokenizer revision, label mapping을 검증하고 로컬 추론한다 | 새 artifact provenance, preprocessing, scores와 오류 계약을 별도로 설계·검증 |
| 영수증 발급 | `backend/src/issuance.ts`가 adapter 추론, 검증, 정책, canonical receipt hash 및 저장을 호출한다. 원본 text·salt는 별도 저장하며 새 영수증은 proof/anchor가 null | Decision payload 자체가 I1·정책 필드에 결합되어 있다. 범용 입력의 의미와 호환성은 승인된 프로토콜 설계 후 검토 |
| Epoch / 검증기 | `backend/src/epochs.ts`는 저장된 receipt hash를 freeze하고 확인된 경우 bundle에 proof/anchor를 채운다. `frontend/src/domain/verify.ts`는 독립적인 공개 commitment 검증을 수행 | issuer·anchor 신뢰 정책과 관측 가능한 공개 기록을 유지해야 함. Epoch와 verifier의 분리가 완성된 독립 서비스/SDK 제품을 뜻하지 않음 |

현재 `backend/src/server.ts`는 W4 provisional 모드·로컬 추론 endpoint가 명시되지 않으면 unavailable adapter를 쓴다. 모델 독립성은 경계 분리가 있는 수준이며 실제 다중 모델·다중 고객 설정은 미구현이다. 향후 Decision Receipt 발급 SDK, Epoch 등록 서비스, 독립 검증기를 분리하는 방안은 제품 방향으로만 기록한다. 이번 검토는 코드·프로토콜·승인 상태를 변경하지 않았다.
