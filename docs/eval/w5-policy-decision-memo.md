# W5 최종 정책 선택지와 남은 승인 — 2026-10-22

Owner: A / 주진호. **AI-11 원행 재계산 PASS, AI-13 W5 비식별 사례 분석 PASS. 최종 정책은 미승인**이다. X/B=null, team_approved=false, 실제 LOCK 없음, TEST SEALED를 유지한다.

## 새로 해결한 근거

사용자가 지정한 predictions와 Validation split의 실제 바이트 SHA-256이 각각 W4 기대값과 일치했다. 두 파일 각1,255행의 스키마·라벨·순차 행 대응·native argmax·PPM 반올림·FULL 상태를 확인했다. 디렉터리 검색이나 다른 데이터 경로 조회는 하지 않았다.

[원행 보고서](../../ai/artifacts/reports/w5_validation_rows/20261021T231440Z-aa90617c/revalidation.json)는 기존 25후보의 분위수·threshold·action/status 건수·FRR/RP/HAR/HRR_TOTAL 분자·분모와 모델 지표를 독립 재계산했다. **W4 공개 집계와 차이0건**, 기존 Python 평가기와 **31,375회 조치 대조·불일치0건**이다. 새 모델 추론 또는 Node parity 실행은 아니다.

W4 시연 후보의 정상 proxy 제한91건을 원행으로 확인했다. 이 중 native prediction은 offensive77·hate13·none1건이다. 실제10건을 원문 없이 점수·규칙·오류 유형·원인 가설·사용자 위험·개선 가설로 분석했다. native-none 제한1건은 정책 ALLOW와 모델 none의 차이를 직접 보여 준다. 자세한 [오류 분석](w5-validation-error-analysis.md)과 [40개 사례별 후보 비교](../../ai/artifacts/reports/w5_validation_rows/20261021T231440Z-aa90617c/case-policy-comparison.json)를 참고한다. 의미/라벨 재판정과 인과 설명은 미실시다.

신규·기존 관련 회귀는 **128 passed, 실패/오류/skip0**이며 W4 공개 증거 해시4/4가 일치했다. [검증 기록](../../ai/artifacts/reports/w5_validation_rows/20261021T231440Z-aa90617c/verification-final.json)에 실행 명령·코드 해시·당시 base SHA를 남겼다. 보호 운영자료·원문·뉴스 제목·record ID·원행 번호는 공개 결과나 일반 로그에 남기지 않았다.

## 정책 비교 — 어느 안도 채택하지 않음

공식 순서는 **FRR≤X AND HRR_TOTAL≤B → HAR 최소 → RP 최대 → HRR_TOTAL 최소**다. 아래 X/B는 해당 후보의 관측 경계 비율을 가정한 시뮬레이션이다. 실제 허용 상한은 오류비용·검토역량에 근거해 팀장이 별도로 정해야 한다. 실제 승인값이 표의 값과 같을 필요는 없다.

| 비교안 | 가정 X / B | FRR | RP | HAR | HRR_TOTAL | 검토/1,000건 |
|---|---|---:|---:|---:|---:|---:|
| A: H50-90_O50-90 | 32/547 / 542/1255 | 32/547 · 5.85% | 220/252 · 87.30% | 90/708 · 12.71% | 542/1255 · 43.19% | 431.87 |
| B: H50-75_O50-90 | 53/547 / 354/1255 | 53/547 · 9.69% | 387/440 · 87.95% | 90/708 · 12.71% | 354/1255 · 28.21% | 282.07 |
| C: H75-90_O75-90 | 32/547 / 344/1255 | 32/547 · 5.85% | 220/252 · 87.30% | 203/708 · 28.67% | 344/1255 · 27.41% | 274.10 |
| D: H50-75_O75-90 | 53/547 / 229/1255 | 53/547 · 9.69% | 387/440 · 87.95% | 158/708 · 22.32% | 229/1255 · 18.25% | 182.47 |
| W4 시연 기준: H50-75_O50-75 | 91/547 / 198/1255 | 91/547 · 16.64% | 505/596 · 84.73% | 90/708 · 12.71% | 198/1255 · 15.78% | 157.77 |

비교 결과:

- **A 대 B:** HAR는90/708로 같고, A가 정상 proxy 제한을21건 줄이는 대신 검토188건을 추가한다. FRR 우선이고43.19% 검토를 수용할 근거가 있다면 A 우선 검토가 타당하다.
- **B 대 C:** 검토량 차이는10건(0.80%p)이다. C는 정상 proxy 제한을21건 줄이지만 유해 proxy ALLOW를113건 늘린다. C를 단순히 검토량이 적다는 이유로 택하지 않는다.
- **B 대 D:** FRR·RP·RESTRICT 수는 같고, B가 검토125건을 추가하여 ALLOW를 줄인다. 그 중 유해 proxy는68건, none proxy는57건이다. HUMAN_REVIEW가 실제 올바른 결정을 내렸다는 효과 측정은 아니다.
- 현25후보 최소 FRR는32/547=5.8501%다. **X<32/547이면 INFEASIBLE**다. q90/q90보다 높은 restrict threshold가 후보군에 없으므로 현재 후보 선택만으로 이 제한32건을 제거할 수 없다. 새 규칙·threshold 탐색은 승인된 별도 정책 검토 사항이다.

검토/1,000건은 Validation과 같은 클래스·점수 구성이라는 가정이다. 실제 트래픽, TRUNCATED 비중, 건당 검토시간, 검토자 정확도는 측정하지 않았다. 시간·인원·비용을 임의로 만들지 않으며 `일 입력량 × HRR_TOTAL × 건당 분 / 60`으로 용량을 확인해야 한다. 점수는 UNCALIBRATED이고, native none은 정상성 proxy다. TEST·운영 성능 또는 공정성 보증이 아니다.

## 요청할 최종 결정과 정확한 후속 범위

| 결정/입력 | 현재 상태 | 결정 후 수행할 범위 |
|---|---|---|
| 허용 FRR 상한 X·검토 예산 B | **BLOCKED — 미승인** | 실제 승인값·승인자·시각·오류비용/용량 근거를 기록하고 공식 feasible/infeasible 집합을 계산 |
| 최종 후보 채택/기각 | **BLOCKED — 미승인** | 승인된 X/B 아래 공식 순서의 결과와 동률·채택/기각 사유를 기록. ANY_RESTRICT 변경은 자동 포함하지 않음 |
| 운영 Model/Policy Manifest 확정 | **BLOCKED — 미승인** | 최종 threshold·모델/전처리/calibration 경계를 A/F와 확인하고 새 Manifest/hash 및 Python/Node parity·fail-closed 근거 준비 |
| 실제 Model/Policy LOCK | **BLOCKED — 별도 승인 필요** | 준비 자료 검토 후에만 LOCK 파일/commit 생성, SHA·시각 검증. 일반 코드 커밋과 구분 |
| 최초 TEST 접근·평가 | **BLOCKED / SEALED** | 실제 LOCK SHA 검증 이후 별도의 명시적 최초 평가 승인 필요. 이번 실행은 승인에 해당하지 않음 |
| 원격 push/merge·팀 GATE-5 | **BLOCKED — 별도 승인/증거 필요** | 원격 전달과 T/F 증거 검증·최종 Gate 판정을 개별 처리 |

권장 다음 결정은 **검토역량 근거를 포함한 X/B와 후보 채택**이다. 정책 선택 이후에도 Manifest 확정·실제 LOCK·TEST 승인을 하나의 일반 진행 승인으로 묶지 않는다. [전체25후보·LOCK 준비](threshold-rationale.md), [W5 진행 기록](../progress/W5.md)을 함께 검토한다. MUST 이전 SHOULD·외부평가·재학습·기능 확대를 시작하지 않는다.
