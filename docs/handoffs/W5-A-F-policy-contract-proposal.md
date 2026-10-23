# W5 A → F 정책 인터페이스 계약 제안 (PROPOSED)

기준일: 2026-10-22 KST · 작성: A / 주진호 · 수신: F / 노유신 (검토 참여: T / 설경민) · 상태: **PROPOSED — A/F 합의 전**.

이 문서는 [연구·시연 정책 S1/S2/S3](../eval/w5-research-policy-scenarios.md) 중 하나가 승인될 때 F가 안전하게 적용할 수 있도록 준비한 인터페이스 제안이다. 현재 차단 코드 위치, 산출물 제안 경로, fail-closed 표는 [기존 활성화 인계안](W5-A-policy-activation-readiness.md)을 따른다.

A는 F/T 코드를 수정하지 않았다. 아래 표시는 다음과 같이 구분한다.
- **PROPOSED:** A의 제안이며 합의 전이다.
- **FIXED:** 이미 W4 코드와 Manifest에 존재하는 사실이다.

## 1. 바뀌지 않는 것 (FIXED)

- I1 점수 payload를 유지한다: score key는 `hate`/`offensive`, 정수 PPM, `UNCALIBRATED`, `FULL`/`TRUNCATED`.
- taxonomy `verimod-ko-beep-hate/1`을 유지한다. native `none`은 reference class이며 ALLOW가 아니다.
- R01 Model Manifest hash `0x96b33780…ad0b7c1`을 유지한다.
- 결정 규칙을 유지한다. 비교는 `>=`이고, 우선순위는 `TRUNCATED_HUMAN_REVIEW → ANY_RESTRICT → ANY_REVIEW → ALLOW`다. 승리한 band의 모든 label을 ASCII 정렬·중복 제거해 reason/rule을 만든다.
- W4 historical policy hash `0xa4559132…2299a1e`와 W4 Manifest·Receipt·Epoch는 변경하지 않는다. 새 정책은 새 hash를 갖는다.

**후보별 threshold (PPM):**

| 후보 | hate review / restrict | offensive review / restrict |
|---|---:|---:|
| S1 H50-90_O50-90 | 24495 / 887209 | 180483 / 828254 |
| S2 H50-75_O50-90 | 24495 / 216950 | 180483 / 828254 |
| S3 H50-75_O75-90 | 24495 / 216950 | 646501 / 828254 |

후보에 따라 바뀌는 것은 threshold 4개뿐이다. 판정 코드는 바꿀 필요가 없다.

## 2. Policy Manifest identity와 metadata (PROPOSED)

W4 Manifest 구조(`policy-manifest/1`)를 유지하고 다음 값만 바꾸는 방안을 제안한다.

| 필드 | W4 값 | 제안 |
|---|---|---|
| `policy_status` | `W4_PROVISIONAL` | `W5_RESEARCH_DEMO` |
| `usage` | `W4_PROVISIONAL_E2E_ONLY` | `W5_RESEARCH_DEMO_ONLY` |
| `team_approved` | `false` | **`false`로 유지.** 운영 승인을 뜻하는 이 필드를 연구 승인에 재사용하지 않는다 |
| `approval_status` | `PENDING_X_B_AND_TEAM_REVIEW` | `RESEARCH_DEMO_APPROVED`. 승인란이 완료된 경우에만 쓴다 |
| `approval_scope` (신규) | — | `RESEARCH_DEMO` |
| `validation.candidate_id` | `H50-75_O50-75` | 승인된 후보 |
| `validation.X` / `validation.B` | `null` | 정확한 분수 객체 (§3) |
| `validation.selection_basis` | 사전 선언 분위수 | 공식 규칙과 승인 기록 참조 |

필드 추가는 Manifest schema 변경이므로 F와 T가 리뷰해야 한다. 추가 대신 `approval_status` 문자열 하나로 구분하는 안도 가능하다.

## 3. X/B 데이터 타입 (PROPOSED)

```json
"X": {"numerator": 3, "denominator": 50},
"B": {"numerator": 3, "denominator": 10}
```

- 제약: 두 값 모두 정수(safe integer)여야 하고, `denominator > 0`, `0 ≤ numerator ≤ denominator`.
- Canonical Profile v1은 정수가 아닌 number를 거부한다([canonical.ts:29](../../shared/protocol/src/canonical.ts#L29)). 그래서 `0.06` 같은 소수는 쓸 수 없다.
- 소수 문자열(`"0.06"`)도 가능하지만, 비교 시 별도 파싱 규약이 필요하다. 분수 객체를 권장한다.
- 표시값을 승인값으로 쓰지 않는다. 예를 들어 FRR 표시 `5.85%`를 X로 쓰면 `0.0585 < 32/547`이 되어 25개 후보 전부가 INFEASIBLE이 된다.
- X/B는 **기록용 metadata**이며 런타임 판정에는 쓰이지 않는다. 런타임은 threshold PPM만 사용한다.
- A의 Python 준비 구현은 `exact_rate`([w5_execution_guard.py](../../ai/src/verimod_ai/evaluation/w5_execution_guard.py))에 있다.

## 4. reason_codes / triggered_rule_ids (PROPOSED — 결정 필요)

W4 Manifest에서 reason code는 `SCORE_{HATE|OFFENSIVE}_{REVIEW|RESTRICT}`와 `INPUT_TRUNCATED`이고, rule ID는 `W4-*` 접두사를 쓴다(FIXED). 두 가지 선택지가 있다.

- **(a) reason code와 rule ID를 모두 유지한다.** 의미가 같은 규칙이므로 Receipt 비교가 쉽다. 다만 W5 Receipt에 `W4-` 접두사가 남아 혼동될 수 있다.
- **(b) reason code는 유지하고 rule ID만 `W5-*`로 바꾼다.** 어느 정책이 판정했는지 Receipt만 보고 알 수 있다. 대신 F 검증 코드와 테스트가 함께 바뀐다.

A는 **(b)**를 제안한다. 정책 identity는 hash로도 구별되지만, 사람이 읽는 Receipt에서도 구분되는 편이 시연 설명에 유리하기 때문이다. 단 F 변경량이 크면 (a)를 수용한다.

## 5. Python/Node parity (PROPOSED)

- A가 별도 harness `ai/scripts/w5_policy_parity.mts`(제안)를 만든다. W4 harness는 `localW4E2E`와 W4 hash에 고정되어 있어 재사용하지 않는다.
- 승인 후보의 21개 경계 벡터를 사용한다. 경계 벡터는 threshold 4개 × (-1/같음/+1), 0점, 겹침, 최대 PPM, TRUNCATED override로 구성된다. 이 벡터에 대해 Node와 Python이 다음을 모두 똑같이 내야 한다:
  - action
  - 정렬된 reason_codes와 triggered_rule_ids
  - **새** policy_manifest_hash
  - canonical bytes
- 현재 준비된 84개 Python 기대값(후보 4개 × 21)은 Node parity PASS가 아니다.
- 실행 조건: F의 고정 SHA와 T의 canonical/hash 구현을 기준으로, 격리된 합성 환경에서만 실행한다.

## 6. Fail-closed와 책임 (PROPOSED)

| 책임 | 담당 |
|---|---|
| 승인 기록, 공식 선정 재현, Manifest 생성기, parity harness, 경계 벡터 | A |
| 신규 정책 identity 검증(`assertTrustedPolicy`·`assertValidPolicy` 확장), 서버 로딩 경로, 발급 연계, F 회귀 | F |
| Manifest schema 변경 리뷰, canonical/hash, `/api/manifests` 공개와 브라우저 Manifest 표시 연계 | T(+F) |

fail-closed 요구는 [기존 인계안의 표](W5-A-policy-activation-readiness.md#fail-closed-회귀-요구)를 따른다. 여기에 다음 두 가지를 추가로 제안한다.

- **W4/W5 identity 혼합 거부:** 새 threshold에 W4 hash가 붙은 경우, 또는 W4 threshold에 새 hash가 붙은 경우 발급을 거부해야 한다.
- **승인 범위 불일치 거부:** `approval_scope`(또는 `approval_status`)가 허용 목록에 없으면 거부해야 한다. `team_approved` 값만 바꿔 우회할 수 없어야 한다.

## 7. 연구 정책을 서비스 기본값으로 쓰는 문제 (PROPOSED)

현재 서버는 W4 local 플래그로 정책을 주입한다([server.ts:17](../../backend/src/server.ts#L17)). 이 구조를 다음과 같이 바꿀 것을 제안한다.

- 연구·시연 정책은 **명시적 프로필**(예: `VERIMOD_POLICY_PROFILE=W5_RESEARCH_DEMO`)일 때만 로딩한다. 기본값이 되지 않게 한다.
- 프로필이 없거나 알 수 없으면 503 fail-closed로 처리한다. 조용히 W4나 W5로 대체하지 않는다.
- 발급되는 Receipt와 UI에 `RESEARCH_DEMO` 정책임을 표시한다. 발표 화면에서 운영 정책처럼 보이지 않게 하기 위해서다.
- W4 historical 정책은 기존 Receipt 검증용으로만 남긴다. 새 발급에 쓸지는 F가 결정한다.

## 8. F에 요청하는 결정

1. §2의 metadata 방식(신규 `approval_scope` 필드 추가 또는 `approval_status`만 사용).
2. §4의 rule ID 방식((a) 또는 (b)).
3. §7의 프로필 로딩 방식, 그리고 F 변경 범위·예상 일정(GATE-5: 10/25 21:00).
4. F 회귀 결과를 SHA와 함께 제공하는 형식.

합의 전에는 A가 Manifest를 확정하지 않고, F 코드도 바꾸지 않는다.
