# VeriMod R01 — W5 Model Card limitations 초안

기준일: 2026-10-22 KST. Owner: A / 주진호. 상태: **PASS — W5 한계 초안 준비 범위**.
이 문서는 W5 Validation 근거로 작성한 한계 초안이다. **W6 최종 Model Card, 운영 정책 승인, TEST 성능 보고가 아니다.**

## 확인한 모델·평가 범위

- 모델: R01 `AI07-BL-KLUE-RB-45126-R01`, `klue/roberta-base`. 데이터: BEEP! Korean HateSpeech.
- Native 분류: hate / offensive / none. 노출 score key: hate / offensive. Score semantics: **UNCALIBRATED**.
- 기존 Validation: 1,255건, hate 305 / offensive 403 / none 547. Accuracy 832/1255 = 66.29%, Macro-F1 0.6524599868976999.
- 기존 provenance가 기록한 전처리: `verimod-ko-text-v1`, codepoint head 500, tokenizer right truncation, max_length 128. 현재 분석은 이 전처리를 새로 실행하지 않았다.
- 근거: [공개 Validation 원보고서](../../ai/artifacts/reports/w4_a_validation/20261016/validation.json), [W5 집계 재검증](../../ai/artifacts/reports/w5_ai13/20261021T042241Z-b4f973ba/analysis.json), [AI-13 오류 분석](w5-validation-error-analysis.md).

## 성능·해석 한계

| 항목 | 확인된 사실 | 허용되지 않는 해석 |
|---|---|---|
| Native label과 정책 | none은 정상성의 운영 proxy이고, 정책은 score/threshold로 action을 결정 | native none = ALLOW, native hate/offensive = 자동 RESTRICT |
| 점수 | UNCALIBRATED | score 0.8 = 실제 유해 확률 80% |
| 분류 성능 | offensive F1 0.541966로 3클래스 중 최저; FP 205, FN 177 | 전체 Accuracy만으로 offensive 검출 품질이나 자동 제한 안전성 보증 |
| 정상 proxy 오류 | native none 118/547을 hate/offensive로 분류; 원행 대조상90건은 RESTRICT,28건은 REVIEW. native none 정답 예측 중1건도 RESTRICT | 이118건과 정책 오제재91건이 같은 집합이라고 단정 |
| W4 시연 정책 | H50-75_O50-75: FRR 91/547, RP 505/596, HAR 90/708, HRR_TOTAL 198/1255 | 승인된 운영 정책, 또는 신규 W5 최종 채택 정책 |
| 검토 경로 | 시연 후보가 198건을 HUMAN_REVIEW로 라우팅 | 198건을 실제 사람이 정확하게 판정·구제했다는 주장 |
| 검증 분포 | 기존 Validation 한 분포에서 평가·후보 비교 | untouched TEST·외부 플랫폼·하위집단 성능으로 일반화 |
| 긴 입력 | 이 Validation의 TRUNCATED 실제 관측 0건 | 긴 입력 fail-closed 회귀 통과와 실제 긴 입력 분류 성능이 같다는 주장 |

## 오류 원인과 공정성

클래스 불균형은 support 305·403·547로 확인된다. 실제 오제재10건의 점수/규칙과 제한된 표면 특징을 확인했지만, annotation ambiguity, 문맥·인용·반어, 도메인 차이는 가능한 설명이며 의미·라벨 재판정 또는 인과 실험으로 확인하지 않았다. 개인·집단 속성별 정밀도·재현율·오제재 격차도 이번 분석으로 평가할 수 없다. 공정성 또는 모든 집단에 대한 안전성 PASS를 표시하지 않는다.

Validation 후보 25개를 같은 집계로 비교하므로 정책 선정 결과에는 선택 편향 가능성이 있다. 신규 정책의 미관측 데이터 성능을 보증하지 않는다. 승인된 모델·전처리·calibration 여부·정책·평가 스크립트의 LOCK과 별도 최초 TEST 승인이 필요하며, TEST 이후 튜닝은 허용하지 않는다.

## 운영 및 프로토콜 한계

정상 proxy 오제재의 비용, 유해 proxy 자동 허용의 비용, 검토 인력의 처리량은 서로 다르다. X/B는 A가 임의 확정하지 않는다. 25개 후보의 최소 관측 FRR은 32/547 = 5.85%지만, 그 값 자체가 허용 가능한 운영 위험이라는 의미는 아니다. 검토량을 낮추면 유해 proxy 허용이 증가할 수 있으며 검토 지연·인적 오류도 별도 관리해야 한다.

Receipt·hash·Merkle·anchor 검증은 기록의 정합성을 검증하는 프로토콜 근거다. AI 판정의 도덕적·정책적 정확성을 증명하지 않는다. 기존 W4 Core E2E PASS를 W5 정책의 안전성 또는 TEST PASS로 전환해 해석하지 않는다. Synthetic Lifecycle은 실제 appeal/review backend 운영이나 구제 성과의 증거가 아니며, 실제 backend는 POST-MVP 범위다.

## 데이터·프라이버시와 남은 검증

10/22 사용자가 지정한 predictions와 Validation split의 기대 해시·각1,255행 스키마·행 대응이 일치했다. [원행 재검증](../../ai/artifacts/reports/w5_validation_rows/20261021T231440Z-aa90617c/revalidation.json)에서 25후보와 모델 지표가 W4 집계와 일치했고, 실제 정상 proxy 제한10건을 비식별 점수/규칙/가설 형태로 분석했다. 원문·뉴스 제목·record ID·행 번호·텍스트 해시는 공개하지 않았으며 새 비공개 대응표에도 원문을 저장하지 않았다. 목적 표본이므로10건의 비율을 전체 오류 유형 비율로 일반화하지 않는다.

중복·그룹 독립성, 사람의 의미·라벨 재판정, 공개 원문 권한은 여전히 미확인이다. 검증된 입력을 확보했다고 calibrated probability나 원인의 인과적 설명을 획득한 것은 아니다.

W6 최종 Model Card에는 팀 승인된 정책·모델 manifest와 LOCK 기록, 별도 승인 후 최초 TEST 결과(실행된 경우), 불확실성·그룹/독립 관측 가정, 운영 검토 계획, 허용된 사례 분석 및 문서 버전을 실제 증거에 맞춰 반영해야 한다. 현재 TEST는 SEALED이며 이 초안에는 TEST 결과가 없다.
