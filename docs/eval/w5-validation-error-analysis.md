# W5 AI-13 — Validation 오제재·오류 분석

기준일: 2026-10-21 KST. Owner: A / 주진호. 상태: **PARTIAL**.
집계 재검증은 **PASS**, 실제 행 단위 사례 분석은 **BLOCKED**다. TEST는 SEALED다.

## 근거와 재현 범위

새 [분석 보고서](../../ai/artifacts/reports/w5_ai13/20261021T042241Z-b4f973ba/analysis.json)는 기존 공개 [Validation 집계](../../ai/artifacts/reports/w4_a_validation/20261016/validation.json)와 [25후보 집계](../../ai/artifacts/reports/w4_a_validation/20261016/policy_candidates.json)만 사용했다. 모델 재추론·학습·원행 열람·TEST 접근은 수행하지 않았다. 기존 W4 파일을 변경하지 않았다.

- 데이터 집계: R01 / BEEP! Korean HateSpeech / Validation 1,255건. Native labels: hate / offensive / none.
- 두 공개 보고서의 predictions SHA-256 표기는 `74fcac005741574422edcd597dc1f78d8234b20e24e50f35d722d01fd927a400`으로 일치한다. 실제 비공개 prediction 파일의 위치·바이트 해시는 이번 작업에서 확인하지 못했다.
- 입력 파일 SHA-256: Validation `a3a2d9a68dd06f26520fb74d30f393eeb79bf0f075fe55b3881de6c5b94bd9bb`, 후보 `ca4e79ca850384a434fcb6ffdc5b4f091f0bef9e118610414deae3b00d7f0ff1`.
- 실행 시 base Git SHA: `8d0580a7ef6a7e88c2314e6f5f30ff5f08f693ab`. 신규 스크립트는 당시 미커밋 상태이며, 실행한 바이트의 SHA-256은 분석 JSON에 별도 기록했다.
- 재검증: 혼동행렬 합계, 클래스별 support·Precision·Recall·F1, Accuracy·Macro-F1·Micro-F1, 후보 25개 각각의 metric 분자·분모·비율·action count·proxy/action 교차표 정합성. **집계 내부 정합성 검증이며 원행 재평가 증거는 아니다.**

## 모델 분류 오류

행은 실제 native label, 열은 모델의 native prediction이다. 정책 action이 아니다.

| Ground truth | 예측 hate | 예측 offensive | 예측 none | Support |
|---|---:|---:|---:|---:|
| hate | 177 | 100 | 28 | 305 |
| offensive | 37 | 226 | 140 | 403 |
| none | 13 | 105 | 429 | 547 |

| 클래스 | 모집단 비중 | Precision | Recall | F1 | False positive | False negative |
|---|---:|---:|---:|---:|---:|---:|
| hate | 305/1255 · 24.30% | 177/227 · 77.97% | 177/305 · 58.03% | 0.665414 | 50 | 128 |
| offensive | 403/1255 · 32.11% | 226/431 · 52.44% | 226/403 · 56.08% | 0.541966 | 205 | 177 |
| none | 547/1255 · 43.59% | 429/597 · 71.86% | 429/547 · 78.43% | 0.750000 | 168 | 118 |

Accuracy는 832/1255 = **66.29%**, Macro-F1은 **0.6524599868976999**다. 서로 배타적인 분류 오류 423건은 다음과 같이 나뉜다.

| 관측한 오류 | 분자/관련 모집단 | 확인 가능한 의미 |
|---|---:|---|
| none → hate/offensive | 118/547 · 21.57% | 정상 proxy의 native 분류 오류. 자동 제한 비율 FRR과 다름 |
| hate/offensive → none | 168/708 · 23.73% | 유해 proxy를 native none으로 분류. 정책 ALLOW와 같지 않음 |
| hate ↔ offensive | 137/708 · 19.35% | 두 유해 클래스 간 혼동. 어떤 정책 action으로 갔는지는 이 행렬만으로 알 수 없음 |

offensive는 세 클래스 중 F1이 가장 낮다. 실제 offensive 403건 중 140건이 none, 37건이 hate로 분류됐다. 반대로 offensive 예측 431건 중 100건은 hate, 105건은 none이다. 따라서 offensive의 낮은 성능은 유해 클래스 간 경계와 none 경계 양쪽에서 관측된다. 클래스별 support가 305·403·547로 다르다는 사실은 확인되지만, 이 불균형이 오류를 유발했다는 인과관계는 집계만으로 입증되지 않는다.

## 정책 오제재와 HUMAN_REVIEW

현재 W4 기술 시연 후보 H50-75_O50-75는 승인된 운영 정책이 아니다. 이 후보의 정책 교차표를 공개 metric에서 수학적으로 복원하면 다음과 같다.

| Ground truth proxy | ALLOW | HUMAN_REVIEW | RESTRICT | 합계 |
|---|---:|---:|---:|---:|
| none | 371 | 85 | 91 | 547 |
| hate + offensive | 90 | 113 | 505 | 708 |
| 전체 | 461 | 198 | 596 | 1255 |

계산식은 `none_RESTRICT=FRR 분자`, `harmful_RESTRICT=RP 분자`, `harmful_ALLOW=HAR 분자`, `none_ALLOW=전체 ALLOW−harmful_ALLOW`, 각 proxy의 `HUMAN_REVIEW=proxy 총수−ALLOW−RESTRICT`다. 25개 후보 모두 비음수·행/열 합계가 맞는지 확인했다. 실제 개별 행을 복원한 것은 아니다.

- 정상 proxy 자동 제한은 **91/547 = 16.64%**다. Native none 분류 오류 118건과 중복되는 사례 수는 알 수 없다.
- 검토 대기 198건에는 none proxy **85건**, hate/offensive proxy **113건**이 있다. 이 198건은 자동 제한 또는 자동 허용 대신 검토로 보낸 양이다. 실제 검토자가 올바르게 처리했거나 이의제기가 구제됐다는 증거는 아니다.
- HUMAN_REVIEW는 자동 처리의 완충 경로지만 정상 게시물도 대기 지연을 겪는다. 검토 인력·처리시간·품질이 없으면 HRR_TOTAL 비율만으로 운영 가능성을 주장할 수 없다.

아래 비교는 기존 후보 간 집계 차이이며 후보 채택이나 운영 효과 실험이 아니다.

| 후보 | none 제한 | none 검토 | 유해 proxy 허용 | 유해 proxy 검토 | 전체 검토량 |
|---|---:|---:|---:|---:|---:|
| H50-75_O50-75 | 91 | 85 | 90 | 113 | 198/1255 · 15.78% |
| H50-90_O50-90 | 32 | 144 | 90 | 398 | 542/1255 · 43.19% |
| H75-90_O75-90 | 32 | 59 | 203 | 285 | 344/1255 · 27.41% |

H50-90_O50-90은 W4 시연 후보보다 none 자동 제한이 59건 적고, 검토량은 344건 많다. 검토 임계값을 높인 H75-90_O75-90은 이 후보보다 검토량이 198건 적지만, 유해 proxy 자동 허용은 113건 많다. FRR만 낮추는 것으로 모든 운영 위험이 최소화되지는 않는다. X/B는 팀 미승인 상태이므로 feasible 판정·정식 선정은 [AI-11 의사결정 자료](threshold-rationale.md)의 승인 관문에 남긴다.

## 관측과 원인 가설의 구분

| 관측 / 한계 | 사용자 위험 | 가능한 원인 가설 — 미검증 | 개선 가설 / 검증할 내용 |
|---|---|---|---|
| none → offensive 105건 | 정상 proxy의 과도한 경고·제한·검토 지연 가능 | 인용·맥락·어휘 단서에 민감할 가능성 | 허가된 Validation 행을 검토해 오류 유형별 분류; 현재는 어떤 사례에도 원인 확정 불가 |
| offensive → none 140건 | 유해 proxy 누락 가능 | 은유·반어·맥락 의존 표현 또는 라벨 경계 모호성 가능 | 행 자료와 annotation 근거 확인 후 가설 평가 |
| hate ↔ offensive 137건 | 클래스 설명 및 정책 해석 혼동 | 두 native 범주의 의미 경계 또는 annotation ambiguity 가능 | 독립된 검토 기준으로 사례 감사; 라벨 수정·모델 변경은 별도 승인 |
| Support 305·403·547 | 일부 클래스의 평가 정밀도·노출 비중 차이 | 데이터 불균형이 학습·성능에 영향을 줬을 가능성 | train 분포·클래스별 불확실성을 별도 근거로 확인; 이 분석은 원인 실험이 아님 |
| BEEP! Validation 한 분포에서만 관측 | 실제 플랫폼·신조어·하위집단에서 성능 변화 가능 | 운영 도메인과의 분포 차이 가능 | MUST 완료 뒤 외부 평가 고려; 현재 외부·하위집단 성능을 주장하지 않음 |
| UNCALIBRATED scores | 점수를 유해 확률로 오해할 위험 | calibration 오차 규모 자체는 미측정 | 현재 점수 의미를 명시; calibration 변경은 재승인·새 평가 필요 |
| FULL 1255 / TRUNCATED 0 | 긴 입력에서 품질이 보장되지 않음 | truncation은 이 Validation 오류의 확인된 원인이 아님 | 긴 입력은 별도 승인된 회귀/평가 근거로 검증; 실제 관측 성능과 구분 |

## 실제 사례 분석 차단사항

요구된 최대 10건의 실제 정상 proxy 오제재 사례는 **0건 검증 / BLOCKED**다. 정확한 Validation prediction 파일 위치와 접근 가능한 provenance가 없으므로, 경로를 탐색하거나 행을 추정하지 않았다. 공개 원문 노출 권한도 미확인이다. Synthetic 문장을 실제 사례처럼 넣지 않았다.

차단 해소 후 각 검증 가능한 사례에 `비식별 case ID / Ground truth / Model prediction / exposed scores / 사용 candidate 및 Policy action / Error category / Possible cause(가설) / Risk to users / Improvement hypothesis / 공개 권한`을 기록한다. Scores·action은 동일 provenance의 실제 행에서 확인해야 한다. 원문 공개가 허가되지 않으면 공개 산출물에는 비식별 설명만 남긴다. 해당 단계에서도 TEST는 접근하지 않는다.

## 실행 및 완료조건

저장소 루트에서 실제 실행:

```powershell
.\ai\.venv\Scripts\python.exe -B -m pytest -p no:cacheprovider ai/tests/test_w5_validation_analysis.py -q
.\ai\.venv\Scripts\python.exe -B ai/scripts/analyze_w5_validation.py
```

결과: Synthetic 단위 테스트 **18 passed**. 공개 집계 분석 **PASS (25후보)**. 테스트는 분모·불일치 집계·음수 복원 셀·NaN·bool count·Validation 이외 split·provenance 불일치·0분모 RP·출력 덮어쓰기/경로 이탈 거부를 검증했다. 새 실행은 고유 run ID 디렉터리를 생성하며 기존 결과가 있으면 실패한다.

AI-13의 집계 분석과 [W5 Model Card limitations 초안](w5-model-card-limitations.md)은 완료했다. 실제 사례 분석과 원문 공개 범위 확인이 남아 있으므로 티켓 전체는 PARTIAL이다. W6 Model Card 최종 완료를 의미하지 않는다.
