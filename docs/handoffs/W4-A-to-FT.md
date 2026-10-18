# W4 A → F/T 인계

최신 인계: [A 최종 독립 재검증](../evidence/w4-a-final-revalidation.md)에서 manifest/issuer
차단 해소를 확인했다. F/T 기술 인계 READY이며 실제 anchoring/RPC 및 팀 승인은 별도다.
아래는 이전 실패와 수정 요청을 보존한 기록이다.

상태: **공개 통합 BLOCKED**. A validation, provisional 정책, parity, 실제 로컬 발급 증거는
검증했다. A는 실제 체인 트랜잭션을 보내지 않았다.

고정 소스: A AI-09 `dd1031ae042d384da8600d26310a671f398f68c4`,
F `a58230e897111eee8c981c4d734294201651b952`,
T `3054b112e9be09501c8f21c66a861212e7975db2`.
F는 변경하지 않은 detached worktree에서 실행했다. A는 F/T를 병합·커밋·push하지 않았다.

## 1. F: 발급 전에 manifest identity를 강제

`backend/src/inference.ts:assertValidInference`는 model manifest의 hex32 형태만 검사하고
설정된 R01 identity와 비교하지 않는다. `createThresholdPolicyEvaluator`는 threshold와 함께
정책 hash를 받지만, 그 hash가 manifest에 묶여 있는지 검증하지 않는다.
그다음 `issuance.ts`가 이 형식 검사만 통과한 판정을 저장한다.

격리된 SQLite에서 실제 HTTP로 재현한 결과:

| 결함 | 기대 | 관측 |
| --- | --- | --- |
| hex32 형식은 맞지만 R01과 다른 model hash | 503, 판정 0, 후보 0 | 201, 판정 1, 후보 1 |
| hex32 형식은 맞지만 후보 manifest에 묶이지 않은 policy hash | 503, 판정 0, 후보 0 | 201, 판정 1, 후보 1 |

이는 정상 발급이 아니라 FAIL이다. 결함 proxy는 실제 Python 응답의 model hash만 바꾸고,
policy 결함은 같은 실제 후보 threshold 옆에 설정된 hash만 바꾼다. 꾸며낸 점수는 쓰지 않았다.
생성된 행은 모두 비공개 임시 테스트 DB에 있으며 절대 앵커링하면 안 된다.

F가 직접 해야 할 최소 변경:

1. 허용 model hash, taxonomy/version, 기대 score semantics를 설정된 실제 R01 Model Manifest에
   묶고, 저장 전에 identity를 강제한다.
2. 실제 정책 manifest를 로드해 canonical hash를 계산하고, threshold 4개와 우선순위/reason/rule 동작을
   도출하거나 비교하며, hash/설정이 맞지 않으면 거부한다. 정책의 provisional 상태를 지킨다.
   로컬 기술 시험을 켜는 것은 승인이 아니다.
3. manifest가 없거나, 형식이 틀리거나, 미승인이거나, 불일치하면 503 INFERENCE_UNAVAILABLE을
   반환하고 decisions/content_store/anchor 후보를 바꾸지 않는다.
4. 수정 후 A의 정상 경로, commitment, 21개 벡터 parity, 재시작 지속성, 멱등성, 실패 시나리오 8개를
   그대로 반복한다. 정책 hash는 그대로 두고 threshold만 바꾸는 변형으로 내용/hash 결합도 시험한다.

A는 F 검증기를 고치거나 이 결함을 가리는 A 측 wrapper를 설치하지 않았다.

## 2. F + T: issuer identity 하나로 합의

- 실제 저장된 ReceiptBody issuer: `verimod-example-platform`.
- T 승인 `BASE_SEPOLIA_DEMO` issuer: `verimod-demo-issuer`.
- 실제 호환성 시험: **MISMATCH**.
- 출처: 고정 revision의 F/T `shared/protocol/src/receipt.ts`와 T
  `frontend/src/domain/approvedProfiles.ts`.

F/T는 어떤 identity가 authoritative인지 합의하고, 소유한 설정/코드를 바꾼 뒤 정렬 후 새 합성
실제 모델 receipt를 다시 발급해야 한다. 저장된 canonical receipt를 그 자리에서 고치지 않는다.
issuer identity는 hash의 일부다. T의 승인 profile이나 canonical 인코딩을 몰래 바꾸지 않는다.
회귀 테스트는 receipt/body hash, issuer commitment, 승인 profile issuer 검사, bundle 검증,
불일치 거부를 포함해야 한다. 체인 freeze/송신과 공개 검증은 F/T 책임으로 남는다.

## 3. 팀: X/B와 정책 승인 결정

validation 후보는 **W4_PROVISIONAL_E2E_ONLY**이며 채택되거나 LOCK되지 않았다.
FRR은 91/547 (16.64%), HRR_TOTAL은 198/1255 (15.78%)다.
X/B는 미정이다. A는 25개 비교 전체와 정식 선택 규칙을 제공했으며,
운영 가능성이나 최적성은 주장하지 않는다.

Model hash: `0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1`.

Policy hash: `0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e`.

기술 threshold: hate review/restrict `24495 / 216950`, offensive review/restrict
`180483 / 646501`. TRUNCATED는 높은 점수보다 우선해 HUMAN_REVIEW가 된다. 그 밖에는
RESTRICT가 REVIEW보다, REVIEW가 ALLOW보다 우선한다. 이긴 구간의 reason/rule은 F와 정확히
일치한다. 이 값을 승인된 운영 기본값으로 로드하지 않는다.

## 증거 전달

- [A 상태와 재현 명령](../progress/W4-A.md)
- [25개 후보 trade-off 표](../evidence/w4-a-validation-policy.md)
- [정확한 정책 manifest](../../ai/artifacts/reports/w4_a_validation/20261016/policy_manifest.json)
- [Canonical manifest bytes](../../ai/artifacts/reports/w4_a_validation/20261016/policy_manifest.canonical.json)
- [정책 parity](../../ai/artifacts/reports/w4_a_validation/20261016/policy_parity.json)
- [실제 A/F E2E와 실패 시 변화량](../../ai/artifacts/reports/w4_a_validation/20261016/af_e2e.json)

salt, private package, 말뭉치 원문, 비공개 행 식별자, 비공개 가중치, 서명 키, 토큰은 포함하지 않았다.
TEST는 SEALED 상태를 유지한다. W5–W7 작업은 하지 않았다.
