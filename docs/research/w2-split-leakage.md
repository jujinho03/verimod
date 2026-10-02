# AI-04 / AI-15 — deterministic split, leakage 점검, TEST seal

상태: **W2 A-owner 실행 evidence, 2026-09-30**. 입력은 [AI-04 확보 문서](w2-primary-dataset-decision.md)에서 고정한 공식 BEEP! labeled train+dev 8,367건입니다. 모델 학습, TEST 평가, EDA, inference용 전처리, 최종 taxonomy 선정은 수행하지 않았습니다.

## Split 전 중복 및 group 점검

Leakage 정규화 버전: `w2-leakage-nfc-whitespace-v1`. Unicode NFC를 적용하고, CRLF/CR을 LF로 바꾸며, 연속된 Unicode 공백을 ASCII 공백 하나로 합치고, 양끝 공백을 제거합니다. 저장된 입력을 바꾸거나, 문장부호/이모지를 제거하거나, 자모를 변환하거나, 비속어를 치환하거나, 맞춤법을 교정하지는 **않습니다**. Exact duplicate는 원본 댓글 문자열을 비교하고, normalized duplicate는 leakage key만 비교합니다.

| Split 전 결과 | 건수 |
|---|---:|
| Exact duplicate 초과분 | 0 |
| Normalized duplicate 초과분 | 0 |
| 제거한 동일 label 중복 행 | 0 |
| 격리(quarantine)한 label 충돌 행 | 0 |

Normalized duplicate의 label이 충돌하면, 코드는 다수결 없이 해당 cluster 전체를 격리합니다. 동일 label 중복은 가장 앞선 stable source ID를 남깁니다. 이 경로들은 synthetic unit fixture로 검증했습니다.

정규화한 `news_title`은 기사 ID나 작성자 ID가 아니라 **group proxy**입니다. 정렬은 통과했고 빈 제목은 0건입니다. 고유한 title proxy 값은 1,480개이고, 그중 1,460개는 두 번 이상 등장합니다. 조건을 충족한 near-duplicate 연결을 추가한 뒤 atomic group은 1,479개입니다. Group 크기 중앙값 = 6, 95th percentile = 9, 최대 = 13. 반복되는 제목은 split을 넘나들 수 없습니다. 다만 서로 다른 제목이 같은 기사를 가리킬 수 있으며, 식별자가 없으므로 작성자 leakage는 배제할 수 없습니다.

## Near duplicate 점검

방법: 정규화한 댓글에 대한 character 3-gram set Jaccard. Threshold **≥0.90은 W2 heuristic**입니다. 대상 텍스트 길이는 최소 12자입니다. Inverted trigram index가 posting 방문 4,909,653회를 검사했고(상한 15,000,000 이내), 조건을 충족한 record 쌍 2개를 찾았습니다. 해당 record는 같은 atomic split group으로 묶었고, 자동 삭제한 것은 없습니다. **짧은 텍스트 857건은 건너뛰었으므로**, 이 점검은 부분적이며 비슷한 짧은 텍스트를 모두 찾았다는 주장이 아닙니다. 흔한 짧은 구절과 Jaccard false positive는 한계로 남습니다.

## Deterministic allocator와 결과

Seed `45126`; 목표 train/validation/test 비율 `0.70/0.15/0.15`. 알고리즘 `group-greedy-class-aware-v1`, Python **3.14.7 standard library**로 구현했습니다(외부 split library 없음). Stable source ID는 `train` 다음 `dev` 순서이며, 1부터 시작하는 zero-padding 행 번호를 붙입니다. Group은 크기 내림차순으로 정렬하고, 동점이면 seed와 가장 작은 source ID의 SHA-256을 tie key로 씁니다. 각 group은 class 분포 제곱오차 증가분이 가장 작은 split에 통째로 배정하고, 그다음 전체 크기 제곱오차 증가분, 그다음 seed 기반 SHA-256 tie key 순으로 결정합니다. Group 원자성과 leakage 점검이 정확한 목표 비율보다 우선합니다. 이 seed는 여러 값을 시도해 조정한 것이 아닙니다.

| Internal split | 건수 | 실제 비율 | hate | offensive | none | Atomic group |
|---|---:|---:|---:|---:|---:|---:|
| train | 5,857 | 0.700012 | 1,423 | 1,882 | 2,552 | 1,154 |
| validation | 1,255 | 0.149994 | 305 | 403 | 547 | 162 |
| TEST | 1,255 | 0.149994 | 305 | 403 | 547 | 163 |

이 표는 허용된 유일한 seal 전 집계이며, TEST 성능이나 행 단위 확인이 아닙니다.

자동화된 seal 전 assertion은 모두 통과했습니다: stable record ID overlap **0**, exact comment overlap **0**, normalized comment overlap **0**, normalized title proxy overlap **0**, atomic near/group cluster overlap **0**. 위에서 설명한 대상 텍스트 기준 near-duplicate 한계는 여전히 적용됩니다.

## TEST seal

- 로컬 전용 경로: `../verimod-local-data/w2/beep-splits/test.jsonl`.
- 형식: UTF-8, LF, JSONL, field와 행 순서 고정. Field는 모델 입력, native label, W5에 필요한 stable metadata이며, 이 artifact는 Git 밖에 있습니다.
- 건수: **1,255**.
- Raw-file-byte SHA-256: `ba9b87bde42e5eba8b3c5ca5f2423553a2f913400fd202d30b9e4bd00eb8138e`.
- Seal 시각: `2026-09-30T14:18:41.863208+00:00` (2026-09-30 23:18:41 KST).
- Script/버전: `ai/scripts/prepare_w2_dataset.py`, `w2-dataset-prep-v1`; source revision과 seed는 위와 같습니다.

Script는 모든 overlap assertion을 통과한 뒤에만 TEST를 기록했고, **생성 시점에 한 번** raw byte를 읽어 seal을 계산했습니다. 이번 실행은 그 뒤 sealed TEST를 다시 열거나, 미리 보거나, EDA를 돌리거나, 평가하지 않았습니다. 이후 점검은 집계 evidence JSON과 synthetic fixture를 사용했습니다. Script는 이미 존재하는 split artifact를 읽거나 덮어쓰기를 거부합니다. Hash는 파일 변경을 탐지할 뿐, 아무도 파일을 읽지 않았다는 것을 암호학적으로 증명하지는 않습니다.

첫 CLI 실행은 artifact 생성과 evidence 기록까지 마친 뒤, Unicode 상태 label을 출력하다가 Windows `cp949` console 인코딩 오류를 냈습니다. Console 출력 인코딩만 수정했습니다. 실제 실행은 sealed 디렉터리를 대상으로 **반복하지 않았습니다**. 수정 후 synthetic unit test 열한 개가 통과했습니다. TEST hash 재현은 실제 TEST를 다시 열지 않고 synthetic fixture로만 테스트했습니다.

## 대기 중인 경계

`BLOCKED — Secondary dataset not yet adopted`. 따라서 Primary↔Secondary overlap은 점검하지 않았고, Secondary record를 다운로드하거나 학습 데이터에 합치지 않았습니다. 공식 BEEP! hidden-label TEST와 공식 benchmark 평가는 사용하지 않았습니다. 최종 supported taxonomy는 AI-20/AI-02 소관이며, FRZ-01과 Team GATE-2는 대기 상태입니다.
