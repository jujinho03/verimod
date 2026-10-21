# W5 AI-13 — Validation 오제재·오류 분석

기준일: 2026-10-22 KST. Owner: A / 주진호. 상태: **PASS — W5 Validation 재검증·비식별 사례10건·한계 초안 범위**.
원인 설명은 검증된 점수/규칙과 제한된 표면 특징에 근거한 가설이다. 사람의 의미·라벨 재판정과 인과 검증은 수행하지 않았다. TEST는 SEALED다.

## 근거와 재현 범위

초기 [집계 분석](../../ai/artifacts/reports/w5_ai13/20261021T042241Z-b4f973ba/analysis.json)은 공개 보고서 두 개만 사용했다. 이후 사용자 지시로 정확한 Validation predictions와 split을 확인하여 [원행 재검증·실제 사례 보고서](../../ai/artifacts/reports/w5_validation_rows/20261021T231440Z-aa90617c/revalidation.json)를 별도 생성했다. 모델 재추론·학습·TEST 접근은 수행하지 않았고 기존 W4·W5 실행 산출물은 변경하지 않았다.

- 데이터 집계: R01 / BEEP! Korean HateSpeech / Validation 1,255건. Native labels: hate / offensive / none.
- 실제 predictions 바이트 SHA-256 `74fcac005741574422edcd597dc1f78d8234b20e24e50f35d722d01fd927a400`, split 바이트 SHA-256 `a92f81ed8eadb9fdb1950be542f9edac4fe778f3e7bd2d630cd1494ef031a26a`가 각각 W4 기대값과 일치했다. 두 파일 각1,255행의 스키마와 순차 local_row·라벨 전체 대응을 확인했다. 대응 근거는 고정 split 해시와 W4 emitter의 행 순서이며, 새 모델 실행 증거가 아니다.
- 입력 파일 SHA-256: Validation `a3a2d9a68dd06f26520fb74d30f393eeb79bf0f075fe55b3881de6c5b94bd9bb`, 후보 `ca4e79ca850384a434fcb6ffdc5b4f091f0bef9e118610414deae3b00d7f0ff1`.
- 초기 집계 실행 base SHA는 `8d0580a7ef6a7e88c2314e6f5f30ff5f08f693ab`, 이번 원행 실행 base는 `1d782f649e243e952d10250fdd0c4ea3dce44e3b`다. 신규 실행 코드의 바이트 SHA-256을 새 JSON에 기록했다. 코드 변경 커밋과 실행 당시 base를 혼동하지 않는다.
- 원행으로 혼동행렬·클래스별 지표·Accuracy/Macro-F1과 25후보 분위수·threshold·분자/분모·action/status 건수를 독립 재계산하여 공개 W4 보고서와 **차이 0건**을 확인했다. 기존 Python 정책 평가기와 **31,375회** 조치 대조도 불일치 0건이다.

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

- 정상 proxy 자동 제한은 **91/547 = 16.64%**다. 원행 대조 결과 native none 분류 오류118건 중 **90건**이 RESTRICT, 나머지28건이 HUMAN_REVIEW다. native none을 맞게 예측한429건 중에도 **1건**은 RESTRICT다. 따라서 분류 오류와 정책 오제재는 같은 집합이 아니다.
- 검토 대기 198건에는 none proxy **85건**, hate/offensive proxy **113건**이 있다. 이 198건은 자동 제한 또는 자동 허용 대신 검토로 보낸 양이다. 실제 검토자가 올바르게 처리했거나 이의제기가 구제됐다는 증거는 아니다.
- HUMAN_REVIEW는 자동 처리의 완충 경로지만 정상 게시물도 대기 지연을 겪는다. 검토 인력·처리시간·품질이 없으면 HRR_TOTAL 비율만으로 운영 가능성을 주장할 수 없다.

아래 비교는 기존 후보 간 집계 차이이며 후보 채택이나 운영 효과 실험이 아니다.

| 후보 | none 제한 | none 검토 | 유해 proxy 허용 | 유해 proxy 검토 | 전체 검토량 |
|---|---:|---:|---:|---:|---:|
| H50-75_O50-75 | 91 | 85 | 90 | 113 | 198/1255 · 15.78% |
| H50-75_O50-90 | 53 | 123 | 90 | 231 | 354/1255 · 28.21% |
| H50-90_O50-90 | 32 | 144 | 90 | 398 | 542/1255 · 43.19% |
| H75-90_O75-90 | 32 | 59 | 203 | 285 | 344/1255 · 27.41% |

H50-90_O50-90은 W4 시연 후보보다 none 자동 제한이 59건 적고, 검토량은 344건 많다. 검토 임계값을 높인 H75-90_O75-90은 이 후보보다 검토량이 198건 적지만, 유해 proxy 자동 허용은 113건 많다. FRR만 낮추는 것으로 모든 운영 위험이 최소화되지는 않는다. X/B는 팀 미승인 상태이므로 feasible 판정·정식 선정은 [AI-11 의사결정 자료](threshold-rationale.md)의 승인 관문에 남긴다.

## 관측과 원인 가설의 구분

| 관측 / 한계 | 사용자 위험 | 가능한 원인 가설 — 미검증 | 개선 가설 / 검증할 내용 |
|---|---|---|---|
| none → offensive 105건 | 정상 proxy의 과도한 경고·제한·검토 지연 가능 | 인용·맥락·어휘 단서에 민감할 가능성 | 원행 대응·점수/규칙·표면 특징을 검증했으나 의미·라벨 재판정 및 인과적 원인 확정은 미실시 |
| offensive → none 140건 | 유해 proxy 누락 가능 | 은유·반어·맥락 의존 표현 또는 라벨 경계 모호성 가능 | 행 자료와 annotation 근거 확인 후 가설 평가 |
| hate ↔ offensive 137건 | 클래스 설명 및 정책 해석 혼동 | 두 native 범주의 의미 경계 또는 annotation ambiguity 가능 | 독립된 검토 기준으로 사례 감사; 라벨 수정·모델 변경은 별도 승인 |
| Support 305·403·547 | 일부 클래스의 평가 정밀도·노출 비중 차이 | 데이터 불균형이 학습·성능에 영향을 줬을 가능성 | train 분포·클래스별 불확실성을 별도 근거로 확인; 이 분석은 원인 실험이 아님 |
| BEEP! Validation 한 분포에서만 관측 | 실제 플랫폼·신조어·하위집단에서 성능 변화 가능 | 운영 도메인과의 분포 차이 가능 | MUST 완료 뒤 외부 평가 고려; 현재 외부·하위집단 성능을 주장하지 않음 |
| UNCALIBRATED scores | 점수를 유해 확률로 오해할 위험 | calibration 오차 규모 자체는 미측정 | 현재 점수 의미를 명시; calibration 변경은 재승인·새 평가 필요 |
| FULL 1255 / TRUNCATED 0 | 긴 입력에서 품질이 보장되지 않음 | truncation은 이 Validation 오류의 확인된 원인이 아님 | 긴 입력은 별도 승인된 회귀/평가 근거로 검증; 실제 관측 성능과 구분 |

## 실제 정상 proxy 오제재 사례 10건 — 원문 비공개

모든 행의 Ground truth는 **native none**, 적용 정책은 미승인 W4 시연 후보 **H50-75_O50-75**, 조치는 **RESTRICT**다. 아래는 실제 행의 점수·조치이며 Synthetic 사례가 아니다. 공개 ID는 새 분석용 ID이고 원래 행 번호·record ID가 아니다. 대응표는 새 Git 제외 로컬 파일에 원문 없이 보관했다. 원문·뉴스 제목·개인정보·텍스트 해시는 공개 결과나 로그에 저장하지 않았다.

선정 방식은 native prediction/제한 trigger 조합별 round robin이며 각 조합 내 최대 restrict 초과 점수 내림차순이다. 희귀한 native-none 제한 사례를 포함해 규칙 차이를 보려는 목적 표본이고 91건의 대표 표본이 아니다. 특히 높은 점수 사례가 많이 포함되어 비율을 일반화하면 안 된다.

| Case | Native prediction | hate PPM | offensive PPM | 제한 trigger | 오류 유형 | 관측 표면 특징 |
|---|---|---:|---:|---|---|---|
| VFP-01 | hate | 965152 | 28177 | hate | G1 | 선정한 표면 패턴 없음 |
| VFP-02 | none | 289002 | 145353 | hate | G2 | 선정한 표면 패턴 없음 |
| VFP-03 | offensive | 489165 | 493480 | hate | G3 | 선정한 표면 패턴 없음 |
| VFP-04 | offensive | 226965 | 747985 | hate, offensive | G4 | 선정한 표면 패턴 없음 |
| VFP-05 | offensive | 44945 | 921085 | offensive | G5 | 선정한 표면 패턴 없음 |
| VFP-06 | hate | 952680 | 35725 | hate | G1 | 선정한 표면 패턴 없음 |
| VFP-07 | offensive | 427257 | 538573 | hate | G3 | 반복 자모 표면 패턴 |
| VFP-08 | offensive | 242927 | 739630 | hate, offensive | G4 | 선정한 표면 패턴 없음 |
| VFP-09 | offensive | 49162 | 916205 | offensive | G5 | 선정한 표면 패턴 없음 |
| VFP-10 | hate | 895112 | 92638 | hate | G1 | 부정형 문자열·물음표 패턴 |

PPM은 UNCALIBRATED 점수다. 표면 패턴 없음은 문맥·개인정보·유해표현이 없다는 의미가 아니다. 정해진 소수 regex가 탐지하지 않았다는 뜻이다. 부정형 문자열은 실제 부정 의미/범위를 확인한 것이 아니고, 반복 자모를 반어·조롱으로 해석하지 않았다.

| 유형 / 연결 사례 | 확인된 제한 메커니즘 | Possible cause — 미검증 가설 | 사용자 위험 / 개선 가설 |
|---|---|---|---|
| G1: 01·06·10 | native hate이면서 hate restrict 상한 초과 | 문맥/라벨 모호성 또는 고점수 분류 오류 가능. 10의 부정 범위 영향은 미확인 | 정상 proxy 자동 제한. 기존25개 중 가장 높은 restrict 상한에서도 제한되므로 threshold 선택만으로 해결을 약속하지 않음; 비공개 의미·라벨 감사 필요 |
| G2: 02 | native none argmax인데 hate 289002≥216950으로 제한 | 정책 threshold와 native argmax의 불일치가 확인된 규칙 원인. 내용의 정상성은 독립 재판정하지 않음 | none을 ALLOW로 오해하면 제한을 설명하지 못함. H50-90_O50-90/H75-90_O75-90 비교에서는 HUMAN_REVIEW로 이동 |
| G3: 03·07 | native offensive지만 더 낮은 hate 점수가 hate 제한 기준을 넘음 | 라벨별 threshold 민감도, 07의 자모/문맥 영향 가능성은 미검증 | 정상 proxy에 교차 클래스 규칙으로 제한. 높은 hate restrict 상한의 두 후보는 HUMAN_REVIEW; 의미·맥락 가설은 별도 감사 |
| G4: 04·08 | hate/offensive 둘 다 W4 restrict 기준 초과 | 복수 점수 단서와 라벨 경계/맥락 모호성 가능, 원인 확정 불가 | 중복 규칙을 곧 높은 실제 유해 확률로 해석하지 않음. 비교 후보 중 q90/q90은 HUMAN_REVIEW |
| G5: 05·09 | native offensive 및 offensive 점수가 q90 restrict도 초과 | 고점수 분류 오류 또는 annotation/context 차이 가능 | 현재 후보군으로 제한이 유지됨. 공개 점수만으로 정당성을 결론내리지 말고 비공개 라벨/맥락 검토 |

실제 사람 검토·피해·이의제기 결과는 관측하지 않았다. 개별 결과의 전체 필드와 가설·위험·개선 항목은 새 JSON의 `case_analysis.public_cases`에 있다.

[동일 10건의 후보별 조치 비교](../../ai/artifacts/reports/w5_validation_rows/20261021T231440Z-aa90617c/case-policy-comparison.json)는 새 모델 추론 없이 같은 점수에 다른 기존 threshold를 적용한 반사실적 정책 비교다. H50-90_O50-90과 H75-90_O75-90은 선정10건 중5건을 HUMAN_REVIEW로 보내며 나머지5건은 제한한다. H50-75_O50-90/H50-75_O75-90은 이 목적 표본10건을 모두 제한하지만 전체547 none에서는 제한이91→53건으로 감소한다. 표본 선택 편향 때문에 이10건만으로 후보의 전체 효능을 비교하지 않는다. 후보 채택은 하지 않았다.

## 실행 및 완료조건

저장소 루트에서 실제 실행:

```powershell
.\ai\.venv\Scripts\python.exe -B -m pytest -p no:cacheprovider ai/tests/test_w5_validation_analysis.py -q
.\ai\.venv\Scripts\python.exe -B ai/scripts/analyze_w5_validation.py
```

결과: Synthetic 단위 테스트 **18 passed**. 공개 집계 분석 **PASS (25후보)**. 테스트는 분모·불일치 집계·음수 복원 셀·NaN·bool count·Validation 이외 split·provenance 불일치·0분모 RP·출력 덮어쓰기/경로 이탈 거부를 검증했다. 새 실행은 고유 run ID 디렉터리를 생성하며 기존 결과가 있으면 실패한다.

10/22 후속 명령: `ai/.venv/Scripts/python.exe -B ai/scripts/revalidate_w5_rows.py`. 신규 synthetic 검사는 `ai/tests/test_w5_validation_rows.py` **26 passed**다. 해시 불일치 시 JSON 해석 전 거부, 순차 행/schema/PPM/argmax/라벨 대응, 독립 정책 경계·불일치 검출·개인정보 비공개·출력 덮어쓰기 거부를 검증했다. 초기 스키마 유효 버전 실행도 별도 고유 경로에 보존했고 최신 원행 결과는 위 링크를 기준으로 한다.

AI-13의 W5 집계·원행 검증·실제 비식별10건 및 [Model Card limitations 초안](w5-model-card-limitations.md) 준비를 완료했다. **W5 요구 범위 PASS**이며 원문 공개 권한, 사람의 의미/라벨 감사, 인과적 원인 검증과 W6 최종 Model Card 완료를 주장하지 않는다.
