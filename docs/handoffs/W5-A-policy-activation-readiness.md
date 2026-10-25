# W5 A → F/T 정책 활성화 준비 점검 — 승인 전 인계안

기준일: 2026-10-22 KST · Owner: A / 주진호 · 상태: **PARTIAL / 활성화 BLOCKED**.
읽기 기준 SHA: `aa85897bac815283e41333fbb12c4542cd42fecb`. T/F 소스는 읽기만 했고 메시지 전송·구현·설정 변경·서비스 실행은 하지 않았다. 새 Manifest·정책 hash·실제 LOCK을 생성하지 않았다.

## 현재 실제 차단사항

| 근거 | 확인한 동작 | 새 정책에 미치는 영향 / 필요한 담당 |
|---|---|---|
| [inference.ts:147](../../backend/src/inference.ts#L147) `assertValidPolicy` | 출력 hash를 W4_PROVISIONAL_POLICY_HASH 한 개와 비교 | 새 hash의 정상 조치도 거부. F가 승인된 정책 identity에 결합한 검증을 지원해야 함 |
| [inference.ts:164](../../backend/src/inference.ts#L164) `assertTrustedPolicy` | W4 hash·canonical digest·정확한 threshold·W4_PROVISIONAL·team_approved=false·localW4E2E 검증 | threshold나 승인 metadata만 교체하면 거부됨. 기존 검증을 삭제하거나 false 승인 표시로 우회하지 않음 |
| [issuance.ts](../../backend/src/issuance.ts) `createDecision` | infer→assertValidInference→policy.evaluate→assertValidPolicy 이후 발급 | F의 정책 신뢰 연결과 영수증 발급의 결합을 함께 검증해야 함 |
| [server.ts:18](../../backend/src/server.ts#L18) | inference·policy·modelManifest 주입이 W4 local 플래그에 결합됨 | F의 명시적 신규 정책 로딩/활성화 경로가 필요. A가 환경값을 바꾸어 우회하지 않음 |
| [app.ts:120](../../backend/src/app.ts#L120) `/api/manifests` | LEGACY_SYNTHETIC_DEMO Manifest 목록 반환 | 새 실제 Manifest 공개·조회 경로와 브라우저 식별은 F/T 검토 필요. 공개 목록 등록 완료로 표시하지 않음 |
| [W4 parity 실행기](../../ai/scripts/w4_policy_parity.mts) | localW4E2E=true, F의 W4 hash 검증 사용 | 새 W5 Manifest용으로 그대로 재사용할 수 없음. 승인 후 별도 A harness와 F 지원 필요 |
| [canonical.ts:34](../../shared/protocol/src/canonical.ts#L34) | Number.isSafeInteger 외 숫자 거부 | X/B를 소수 number로 넣으면 canonicalization 실패. 정확한 표현을 A/F가 사전 합의해야 함 |

## 승인 후 새 산출물 경로 — 아직 파일 없음

다음은 **제안 경로**다. 기존 경로와 기존 W4 파일을 재사용하거나 덮어쓰지 않는다.

```text
ai/artifacts/manifests/w5_policy/<approved-policy-id>/<unique-run-id>/
  policy_manifest.json
  policy_manifest.canonical.json
  policy_hash.json

ai/artifacts/reports/w5_policy_release/<unique-run-id>/
  approval-evidence.json
  selection.json
  policy_vectors.json
  policy_parity.json
  fail_closed.json
  source_provenance.json

docs/eval/locks/<approved-lock-id>.json   # 별도 LOCK 승인 후에만 생성
```

승인 전에는 준비·민감도 보고서만 저장한다. 위 운영 Manifest/LOCK 파일을 이번에 만들지 않았다. Manifest metadata 상태명·버전·승인 기록 방식·배포 로더는 A/F가 확정해야 하며, 이 인계안이 schema 변경을 승인하지 않는다.

## A/F 인터페이스 판단

네 후보는 taxonomy, score keys hate/offensive, integer PPM, UNCALIBRATED, FULL/TRUNCATED, ANY_RESTRICT와 reason/action 의미를 유지한다. **I1 외부 점수 payload의 필드 추가 필요는 현재 확인되지 않았다.** 모델·전처리·calibration·R01 Model Manifest identity도 유지하는 준비안이다.

반면 정책 identity·승인 metadata·실행 프로필과 Manifest 제공 경로는 변경이 필요하다. F의 내부 config/검증 함수/발급 연계가 영향을 받는다. 기존 reason/rule ID의 W4 접두사를 의미가 같은 규칙에 유지할지 새 버전 ID로 바꿀지도 A/F 합의 후 결정한다. 새 ID를 A가 혼자 적용하지 않는다.

X/B는 **정확한 정수 분수 객체** `{numerator, denominator}` 또는 명시적으로 합의한 소수 문자열을 권장한다. 예컨대 팀이 X=6%를 승인하면 3/50으로 표현할 수 있다. 이것은 6% 승인 제안이나 확정이 아니다. 관측32/547을 5.85%로 반올림해 승인값을 조용히 바꾸지 않는다. rate 경계와 score PPM threshold는 별개다. Fraction 객체 방식은 합의 전이며 실제 Manifest에 넣지 않았다.

## Threshold 및 경계조건

| 후보 | hate review / restrict PPM | offensive review / restrict PPM |
|---|---:|---:|
| H50-90_O50-90 | 24495 / 887209 | 180483 / 828254 |
| H50-75_O50-90 | 24495 / 216950 | 180483 / 828254 |
| H50-75_O75-90 | 24495 / 216950 | 646501 / 828254 |
| H75-90_O75-90 | 216950 / 887209 | 646501 / 828254 |

네 후보 각각 기존 Python `boundary_vectors`로 21개, 총84개 **합성 경계 기대값**을 준비했다. threshold 4개 × -1/같음/+1, 0점, review/restrict 겹침·승리 band, 두 label의 최대 PPM, TRUNCATED override를 포함한다. 최대 PPM 동시 입력은 계약 경계 시험용 합성이며 실제 3-class softmax 출력 사례가 아니다.

실제 승인된 정책의 parity에서는 Node와 Python이 다음을 모두 일치시켜야 한다: action, 정렬·중복 없는 reason_codes/triggered_rule_ids, 정확한 **새** policy_manifest_hash, canonical bytes와 domain hash. 이번84개 준비 결과는 Node parity PASS가 아니다. 신규 manifest/hash 없이 hash 동등성 검증을 완료할 수 없다.

## Fail-closed 회귀 요구

기존 [F Manifest 경계 테스트](../../backend/test/w4-manifest-boundary.test.ts)와 [inference 테스트](../../backend/test/inference.test.ts)를 담당자가 승인된 새 정책에 맞춰 확장한다. A는 이번에 F 테스트를 실행하거나 수정하지 않았다.

| 부정 시나리오 | 요구 결과 |
|---|---|
| 정책/Manifest/모델 참조 누락, provider 정지·timeout·잘못된 envelope | 503 INFERENCE_UNAVAILABLE, 정상 조치·점수 fallback 없음 |
| 형식은 맞으나 미승인 model/policy hash, canonical bytes 변조, 새 threshold+옛 hash | 발급 거부, ALLOW fallback 없음 |
| config threshold와 Manifest 불일치, score key/PPM/semantics/status/taxonomy 변경 | 실패를 정상 정책 평가로 위장하지 않음 |
| 승인 metadata만 바꾸고 실제 승인된 profile/identity와 결합하지 않음 | 미승인 정책 거부. W4 local 플래그를 신규 승인 우회로 사용하지 않음 |
| 실제 F 발급 연계 부정 사례 | Receipt/anchor 후보 증가0, 콘텐츠·멱등 처리의 기대 영속 변화도 명세대로 확인 |
| 양성 FULL/TRUNCATED 및 재시도 | 승인된 hash를 담은 조치·영수증, TRUNCATED HUMAN_REVIEW, 기존 멱등·프라이버시 회귀 유지 |

실행은 승인된 격리 synthetic/임시 DB 환경에서 수행하고 실제 운영 DB·원문·키·체인에는 접근하지 않는다. W4 과거 테스트 수17 또는 parity21을 새 결과로 승계하지 않는다.

## Hash와 역사 보존

W4 historical policy hash는 **0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e**다. W4 Manifest/canonical/hash 파일 두 묶음6개를 읽기 전용으로 확인하고, 기존 canonical bytes의 `SHA256(ASCII('verimod:policy:v1') + 0x00 + canonical_bytes)`가 이 hash와 일치함을 재확인했다.

새 정책의 최종 canonical bytes가 정해진 후에만 T의 현재 canonical/domainHash 구현으로 새 hash를 계산한다. 새 hash는 현재 **null/미생성**이다. 네 후보 모두 W4와 threshold가 다르므로 옛 hash를 새 정책 identity로 사용할 수 없다. W4 Receipt·Epoch·Anchor·historical Manifest를 새 정책으로 소급 수정하지 않는다. 범위가 그대로인 R01 Model Manifest는 새 정책에 기존 정확한 model hash로 결합한다.

## 승인·코드·LOCK 순서

1. 팀장이 운영 근거가 있는 X/B와 최종 후보·채택/기각 사유를 결정한다. 전25개에서 공식 선택을 검증한다.
2. A/F가 정책 metadata·X/B encoding·rule ID·identity/profile·로딩/제공 경로에 합의하고, F 담당자가 자기 변경 범위를 승인한다. A가 F 코드를 대신 바꾸지 않는다.
3. 승인된 새 경로에 A 생성기/승인 기록·Manifest 패키지를 준비한다. **Manifest 확정 승인 전에는 최종 identity로 공표·적용하지 않는다.** 실제 canonical/hash와 Python/Node parity·fail-closed 결과 및 담당 SHA를 검토한다.
4. 모델·가중치/토크나이저·전처리·보정 여부·정책·승인·eval source/env·그룹/독립성·latency 측정 프로토콜·bootstrap 설정을 LOCK 후보 패키지에 결합한다. 준비 버전의 실제 평가 로더/영속1회 실행 claim이 미구현인 점도 해소해야 한다.
5. 팀장의 **별도 실제 LOCK 승인** 이후에만 LOCK 파일/commit을 만들고 SHA·시각·내용을 검증한다. 일반 A 코드 커밋과 구분한다.
6. 그 LOCK SHA에 묶인 팀장의 **별도 최초 TEST 평가 승인**을 받은 뒤 승인된 평가기를 단1회 실행한다. 현재 준비 CLI는 항상 실제 실행을 거부하며, 날짜 도달·문서 승인·일반 진행 지시는 개봉 승인이 아니다.

최종 TEST 설정은 repetitions1000, seed20260923, percentile2.5/97.5, 그룹 구조/독립성 가정, 분자/분모·undefined 처리·latency 규약을 고정한다. TEST 결과를 보고 threshold·모델을 재선정하지 않는다. push와 팀 GATE-5 최종 승인도 별도다.
