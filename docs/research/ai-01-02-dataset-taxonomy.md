# AI-01 / AI-02 — Korean Moderation Dataset Evidence

- Status: **W1 RESEARCH EVIDENCE**
- Recorded / sources accessed: **2026-09-30**
- History: **W1 late evidence closure — 2026-09-30**. W1 nominal period는 2026-09-21~09-27이며, 이 보고서가 그 기간에 repository에 존재했다고 주장하지 않는다.
- Scope: dataset research + mapping feasibility only. Dataset adoption, Primary selection, final taxonomy, training, evaluation 결과가 아니다.
- Repository baseline: `0b0c3fdc3d1be6f0773bf303c503ebd11b1ff8d1`. Stage 8A의 AI-01 MISSING / AI-02 PARTIAL을 source-backed 문서로 보완한다.

## Decision boundary

[Decision register](../02-decision-register.md)의 D01~D17 = ADOPTED, D18~D28 = WORKING ASSUMPTION을 유지한다. D02는 native labels → mapping feasibility → supported taxonomy 순서이며 misinformation을 제외한다. D28의 Primary 하나 / Secondary 기본 training 비병합·외부 평가 SHOULD는 WORKING ASSUMPTION이다. Row-25 / Row-32는 UNRESOLVED다.

CURRENT demo/test의 `hate / profanity / sexual / spam / violence`는 비교 대상일 뿐 TARGET taxonomy가 아니다. ADOPTED ≠ implemented, DRAFT ≠ final contract. Primary dataset / final supported taxonomy / exact required keys는 UNRESOLVED이며 Gate-2 / FRZ-01은 pending이다.

## Dataset comparison

모두 한국어 텍스트 후보다. 아래 수치는 README·논문·공식 metadata의 **공표 수치**이며 dataset 파일을 내려받거나 레코드를 세어 얻은 EDA 결과가 아니다. source ID는 [Sources](#sources)의 고정 URL과 claim scope로 연결된다. `UNKNOWN`은 확인한 공식 자료가 값을 확정하지 못한다는 뜻이며, 값이 없다는 추정이 아니다.

| Dataset | Official source | Paper / publication | Revision / version evidence | Total sample count | Official split counts | Native label system | Multi-label | Annotation guideline | Collection platform / domain | Collection period | Group metadata | License | Commercial use boundary | Research use boundary | Primary / Secondary role | Verification note |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| K-MHaS | [adlnlp/K-MHaS][K1] | Lee et al., COLING 2022 [K2] | main `ec7a7e7…`; Git tag 없음 [R1] | 109,692 [K1,K2] | train 78,977 / validation 8,776 / test 21,939 [K1,K2] | binary Hate Speech / Not Hate Speech; fine-grained Origin, Physical, Politics, Profanity, Age, Gender, Race, Religion + Not Hate Speech [K1,K2] | hate 쪽 1~4 labels [K1,K2] | 논문 §2 instructions/process [K2]; 별도 완전한 작업자 manual 공개 여부 UNKNOWN | Korean online news comments [K1,K2] | 2018-01~2020-06 [K1,K2] | target-category labels 있음; 실제 작성자/피해자 demographic metadata 공개 여부 UNKNOWN | **UNKNOWN** — 확인한 repo/논문에서 dataset license 명시 못 찾음 | UNKNOWN; 공개 접근을 사용 허가로 간주하지 않음 | UNKNOWN; 연구용 사용 권한도 추정하지 않음 | Primary/Secondary 검토 후보, 배정 미정 | 8개 hate subtype과 negative를 구분; 사용 권한 확인 필요 |
| BEEP! Korean HateSpeech | [kocohub/korean-hate-speech][B1] | Moon, Cho, Lee, SocialNLP 2020 [B2] | master `f8d05dc…`; Git tag 없음 [R2] | labeled 9,381 [B1] | train 7,896 / validation 471 / test 974 [B1,B2] | hate axis: hate / offensive / none; bias axis: gender / others / none; contain_gender_bias 별도 [B1,B3] | 각 축은 single-label; 서로 다른 두 축을 평면 multi-label taxonomy로 합치지 않음 [B2,B3] | repo English guideline [B3], paper Appendix A [B2] | Korean entertainment news comments [B1,B2] | 원천 기사의 발행 범위 2018-01-01~2020-02-29 [B2 §3]; 개별 댓글 수집일 범위 UNKNOWN | bias labels/flag와 news_title 있음 [B1]; 작성자 demographic metadata 여부 UNKNOWN | CC BY-SA 4.0 [B1,B4] | 상업 이용도 허용하되 attribution·변경 표시·ShareAlike 조건 [L1] | 같은 조건 적용; 연구라는 이유로 조건 면제 아님 [L1] | Primary/Secondary 검토 후보, 배정 미정 | TEST 정답 비공개; unlabeled corpus를 9,381에 합산하지 않음 [B1] |
| Korean UnSmile | [Smilegate AI repo][U1]; [official HF metadata][U2] | official README-cited related paper: Kang et al. (2022), arXiv:2204.03262 [U3] | GitHub main `569ab5f…`; 파일명 v1.0; HF `6ef17c2…`, metadata version null [R3,U2,U4] | 18,742 [U1] | train 15,005 / valid 3,737; 별도 test 미기재 [U1,U2] | 여성/가족, 남성, 성소수자, 인종/국적, 연령, 지역, 종교, 기타혐오; 악플/욕설; clean [U1,U2] | hate categories multi-label [U1] | README §1.2~1.4 정의·태깅 기준 [U1] | 댓글 문장 [U1]; 현재 release의 정확한 platform별 구성 UNKNOWN | 현재 18,742 release의 수집 기간 UNKNOWN | target labels + 개인지칭 attribute [U1,U2]; 작성자 demographic metadata 여부 UNKNOWN | Dataset **CC BY-NC-ND 4.0**; code/baseline model **Apache 2.0** [U1] | Dataset NC; 상업 사용은 공식 연락처 문의 안내 [U1,L2] | 비상업 조건·출처 표시·변경 material 재배포 제한 [L2]; 학습/model 배포의 포괄적 허가로 해석하지 않음 | Primary/Secondary 검토 후보, 배정 미정 | HF README/card 없음; metadata로 split/schema 교차 확인. license는 GitHub README 근거 |

### Revision and access evidence

GitHub API로 default branch와 아래 SHA를 확인했고 세 repo의 tags 응답은 모두 빈 배열이었다. semantic release tag는 확인되지 않았다. UnSmile 파일명 `v1.0`은 별도 version 단서이며 Git tag나 HF semantic version과 동일시하지 않는다.

| Source | Verified revision | Access result / limit |
|---|---|---|
| K-MHaS main | `ec7a7e775d650b825872f6f538fc717822cdfc1a` | README와 COLING 원문 접근 성공; 논문은 메모리에서 읽음, dataset 미접근 |
| BEEP! master | `f8d05dce2b22007bb149e5139c0060c68ad8f94b` | README, guideline, LICENSE, 원 논문 확인; TEST 파일/정답 미접근 |
| UnSmile GitHub main | `569ab5f495e046911898805d3bee92469988dcd9` | README 확인; TSV 파일 미접근 |
| UnSmile HF main | `6ef17c27881aa44b0d74e9fe29e8d031b40ba07f` | official API에 cardData 없음, README 요청 404. `dataset_infos.json`의 schema/count만 읽음; parquet 미접근 |

### Annotation, reliability and release caveats

- **K-MHaS:** 논문 §2는 원어민 작업자 5명, uncertain 사례 공동 검토·다수결과 후속 검수, 평균 Cohen's kappa 0.892를 보고한다. §3/Table 2의 negative 54.3%, Table 3의 드문 Race/Religion은 imbalance 검토 근거다. annotation 정의는 hate-target 중심이며 일반 political discussion 자체를 Politics로 정의하지 않는다. 별도 evidence span annotation은 확인한 설명에서 확인되지 않았다. [K2]
- **BEEP!:** 논문 §4는 작업자 32명 중 댓글마다 3명 배정·다수결을 보고한다. bias/hate Krippendorff's alpha는 각각 0.492/0.496이다. §3의 downvote 기반 표집과 연예 뉴스 문맥은 domain 편향 위험이다. 제목이 제공되지만 본문은 제공하지 않는다는 README 설명과 TEST 정답 비공개 때문에 향후 재현 경로 검토가 필요하다. 현재 leaderboard 동작 여부는 UNKNOWN이며 시험 제출하지 않았다. 별도 evidence span annotation은 확인되지 않았다. [B1,B2]
- **UnSmile:** README는 문장당 3명 분류, 전문가 5명 최종 검수를 설명한다. 현재 release에 대응하는 agreement 값은 UNKNOWN이다. `개인지칭`은 식별 가능한 특정 인물 대상 여부의 추가 attribute이며 별도 hate class로 승격하지 않는다. overview 악플/욕설 **3,929**와 label table **3,932**의 불일치를 보존하며 원인은 **UNKNOWN**이다. [U1,U2]
- **Related paper caveat:** Kang et al. 논문은 약 35K 구성을 설명한다: online comments 24K + Wikipedia neutral 2.2K + human-in-the-loop 1.7K + rule-generated neutral 7.1K. 공식 README가 직접 인용하는 관련 논문이지만 **현재 UnSmile 18,742 release와 1:1 동일 corpus라고 단정하지 않는다**. 논문의 alpha 0.713을 현재 release agreement로 옮기지 않는다. README citation의 제목 문구와 arXiv 현재 제목도 다르므로 arXiv 식별자로 연결한다. [U1,U3]

세 후보의 target-group label은 실제 작성자·피해자의 신원/인구통계를 입증하지 않는다. 개인정보 제거의 완전성도 UNKNOWN이다. 이 문서는 댓글 원문·sample text를 복사하지 않는다. 공개 자료라는 이유로 privacy 검토가 완료됐다고 주장하지 않는다.

### Candidate roles and constraints

다음은 source 사실에 따른 **연구상 검토 의견**이며 순위·점수·winner가 아니다.

| Candidate | Strength / label-fit | Risk / license constraint |
|---|---|---|
| K-MHaS | 세부 target와 동시 label 관계를 검토할 자료 | 다중 label을 하나로 축소할 때 정보 손실; 세부 class 불균형; license UNKNOWN |
| BEEP! | native hate/offensive/none과 별도 bias 축으로 coarse 구조 검토 가능 | offensive ≠ profanity, annotation 경계 주관성; TEST 정답 접근/재현 경로; BY-SA 조건 |
| UnSmile | 한국어 group-target와 악플/욕설 구분 및 개인지칭 attribute 검토 가능 | 악플/욕설의 넓은 의미; release/논문 대응 불확실성·count 차이; dataset NC/ND와 code/model Apache 구분 |

**Primary: UNRESOLVED. Secondary: UNRESOLVED.** 후보별 최종 역할을 배정하지 않는다. D28을 ADOPTED로 승격하거나 서로의 training 데이터를 합치지 않는다.

## Mapping feasibility

아래 `DIRECT-CANDIDATE / COARSE-CANDIDATE / UNSUPPORTED / NEGATIVE-LABEL / AMBIGUOUS`는 **이 연구 표의 분류**이며 새 protocol enum이나 policy rule이 아니다. Possible semantic relation과 information loss는 공식 native 정의를 대상으로 한 feasibility 분석이다. TARGET이 미정이므로 어떤 행도 최종 exact mapping을 승인하지 않는다.

### Native-label review

| Dataset | Native label | Possible semantic relation | Exact mapping possible? | Information loss | Status | Notes |
|---|---|---|---|---|---|---|
| K-MHaS | Origin | 출신/identity 기반 hate의 coarse 후보 | 미확정 | 출신 target 구분 | COARSE-CANDIDATE | [K2 §2] |
| K-MHaS | Physical | 외모/장애 관련 hate의 coarse 후보 | 미확정 | 외모와 장애 구분 | COARSE-CANDIDATE | 일반 physical/violence가 아님 [K2] |
| K-MHaS | Politics | 정치 성향 기반 hate의 coarse 후보 | 미확정 | 정치 target 문맥 | COARSE-CANDIDATE | 정치 콘텐츠 자체를 제한 대상으로 바꾸지 않음 [K2] |
| K-MHaS | Profanity | 기존 profanity concept와 근접한 후보 | 정확 동일성 미확정 | 포괄적 hate 부분을 순수 욕설로 축소할 위험 | DIRECT-CANDIDATE | 정의에 swearing 등과 다른 범주로 특정되지 않은 hate 포함 [K2] |
| K-MHaS | Age | 연령 기반 hate의 coarse 후보 | 미확정 | 연령 target 구분 | COARSE-CANDIDATE | [K2] |
| K-MHaS | Gender | 성별/성적 지향 관련 hate의 coarse 후보 | 미확정 | 서로 다른 target를 통합 | COARSE-CANDIDATE | label 존재를 reason_code로 변환하지 않음 [K2] |
| K-MHaS | Race | ethnicity 기반 hate의 coarse 후보 | 미확정 | 인종 target 및 드문 class 정보 | COARSE-CANDIDATE | [K2] |
| K-MHaS | Religion | 종교 기반 hate의 coarse 후보 | 미확정 | 종교 target 및 드문 class 정보 | COARSE-CANDIDATE | [K2] |
| K-MHaS | Not Hate Speech | native annotation의 negative | ALLOW와 동일 mapping 불가 | 측정하지 않은 위험을 안전으로 오인 | NEGATIVE-LABEL | [K1,K2] |
| BEEP! hate axis | hate | generic hate concept의 후보 | 정확 동일성 미확정 | target별 구분 미제공 | DIRECT-CANDIDATE | 강한 모욕/공격도 정의에 포함 [B3] |
| BEEP! hate axis | offensive | offensive 의미 검토; profanity와 일부만 겹침 | profanity로 자동 mapping 불가 | sarcasm/무례함/간접 공격 의미 | AMBIGUOUS | 욕설 유무만으로 분리할 수 없음 [B3] |
| BEEP! hate axis | none | hate/offensive 축의 negative | ALLOW와 동일 mapping 불가 | 다른 policy 위반 여부는 미측정 | NEGATIVE-LABEL | [B3] |
| BEEP! bias axis | gender | gender-related bias의 별도 축 | hate와 동일 mapping 불가 | bias와 공격성 차이 | AMBIGUOUS | hate/offensive/none과 합치지 않음 [B3] |
| BEEP! bias axis | others | 기타 social bias의 별도 축 | hate와 동일 mapping 불가 | 다양한 bias 대상 구분 | AMBIGUOUS | [B3] |
| BEEP! bias axis | none | bias 축의 negative | hate-none/ALLOW와 동일 mapping 불가 | 축의 의미 소실 | NEGATIVE-LABEL | [B3] |
| BEEP! auxiliary | contain_gender_bias | gender bias 여부의 보조값 | 새 moderation class로 mapping 안 함 | hate 축과 혼합 시 왜곡 | AMBIGUOUS | label set과 구분 [B1] |
| UnSmile | 여성/가족 | group-target hate의 coarse 후보 | 미확정 | 여성/가족 target | COARSE-CANDIDATE | [U1 §1.2] |
| UnSmile | 남성 | group-target hate의 coarse 후보 | 미확정 | 남성 target | COARSE-CANDIDATE | [U1] |
| UnSmile | 성소수자 | group-target hate의 coarse 후보 | sexual로 mapping 불가 | 성소수자 target | COARSE-CANDIDATE | sexual-content supervision과 구분 [U1] |
| UnSmile | 인종/국적 | group-target hate의 coarse 후보 | 미확정 | 인종/국적 구분 | COARSE-CANDIDATE | [U1] |
| UnSmile | 연령 | group-target hate의 coarse 후보 | 미확정 | 연령 target | COARSE-CANDIDATE | [U1] |
| UnSmile | 지역 | group-target hate의 coarse 후보 | 미확정 | 지역 target | COARSE-CANDIDATE | [U1] |
| UnSmile | 종교 | group-target hate의 coarse 후보 | 미확정 | 종교 target | COARSE-CANDIDATE | [U1] |
| UnSmile | 기타혐오 | 나머지 group-target hate의 coarse 후보 | 미확정 | 기타 target 구분 | COARSE-CANDIDATE | HF field 표기는 `기타 혐오` [U1,U2] |
| UnSmile | 악플/욕설 | abusive/profanity 계열과 부분 관계 | profanity와 정확 동일시 불가 | 비하·불쾌감·음란성 등 넓은 의미 | AMBIGUOUS | [U1 §1.2] |
| UnSmile | clean | native annotation의 negative | ALLOW와 동일 mapping 불가 | 전체 moderation coverage로 과장 | NEGATIVE-LABEL | [U1] |
| UnSmile auxiliary | 개인지칭 | 특정 개인 대상 여부 attribute | 별도 hate class로 mapping 안 함 | target 종류와 공격성 혼동 | AMBIGUOUS | [U1 §1.3,U2] |

### Unsupported dimensions and cross-dataset limits

| CURRENT demo concept | K-MHaS | BEEP! | UnSmile | Interpretation |
|---|---|---|---|---|
| sexual | UNSUPPORTED | UNSUPPORTED | UNSUPPORTED | 세 후보에 독립 sexual native label 없음. 성소수자 target 또는 음란성/성희롱을 포함하는 넓은 정의와 별도 supervision을 혼동하지 않음 |
| spam | UNSUPPORTED | UNSUPPORTED | UNSUPPORTED | 독립 spam native label 없음 |
| violence | UNSUPPORTED | UNSUPPORTED | UNSUPPORTED | 독립 violence native label 없음 |

위 세 차원은 **UNSUPPORTED BY THESE CANDIDATES**, 즉 native supervised label unavailable이다. 실제 원문에 해당 위험이 없다는 뜻은 아니다. native inventories의 근거는 [K1,K2,B1,B3,U1,U2]다. misinformation은 [D02](../02-decision-register.md)에 따라 scope 제외이며, guideline에 rumor가 언급되어도 misinformation class를 추가하지 않는다.

### Candidate shapes and information loss

최종 label 이름/수를 만들지 않고 native 구조를 비교한다.

| 검토 방향 | Dataset support | Merge / information loss | Multi-label / I1 implication |
|---|---|---|---|
| BEEP! native coarse 구조 보존 | hate / offensive / none | hate axis 내부 merge 불필요; bias는 별도 축. 다른 두 dataset에서 동등한 offensive 분리를 보장하지 않음 | 축별 single-label이며 이것이 VeriMod final 3-class라는 뜻은 아님 |
| Native target detail 보존 | K-MHaS 또는 UnSmile 각각의 native labels | 서로 다른 granularity를 억지 통합하지 않음; cross-dataset 직접 비교가 제한됨 | 복수 target/score의 공존을 보존할 필요 검토; scores의 합·key 수는 미정 |
| Target categories의 coarse hate 통합 가능성 | 두 multi-label 후보의 target-specific labels | target·intersectionality·rare-class 성능 차이를 잃음; Profanity/악플을 분리할지는 미정 | hate와 욕설이 공존할 수 있어 단일 class 우선순위를 임의 생성하면 안 됨 |

현재 demo 5-label과 native supervision은 완전 정렬되지 않는다. D02의 Gate-2에서 source-backed supported dimensions를 유지하거나 5→3을 포함한 축소를 검토할 수 있다는 fallback만 재확인한다. **최종 3 labels·승자·Primary를 이번에 결정하지 않는다.**

### I1 handoff questions — unresolved

- Coarse 또는 detailed output, single-label 또는 multi-label 의미 중 무엇을 합의할 것인가? 정보 보존과 consumer 복잡도의 trade-off가 있다.
- Negative label을 output에 포함할 것인가? 포함하더라도 policy ALLOW와 분리해야 한다.
- Profanity / offensive / 악플을 어떤 의미로 보존할 것인가? 동일 이름처럼 취급하면 native 정의를 훼손할 수 있다.
- Taxonomy identity와 scores_ppm required-key 집합을 무엇으로 고정할 것인가? 지금 label 수·key·score 합계를 확정하지 않는다.
- Unsupported를 어떻게 표현할 것인가? 지원되지 않는 class에 가짜 0점을 채우는 것은 이번 연구에서 승인하지 않는다.
- Dataset label과 reason_codes / triggered_rule_ids의 policy 평가 관계는 무엇인가? 모델 label에서 policy reason/action을 자동 생성하는 새 규칙은 없다.
- Evidence span / attribution은 D03 SHOULD다. 확인된 sentence-level label 설명을 span supervision으로 간주하지 않으며 없는 evidence를 생성하지 않는다.

## Unknowns and closure limits

- K-MHaS: dataset license와 상업/연구 사용 권한, 별도 전체 annotation manual 공개 여부 UNKNOWN.
- BEEP!: 개별 댓글 수집일 범위와 현재 TEST 평가 서비스 접근 가능성 UNKNOWN. TEST 데이터나 정답을 열람하지 않았다.
- UnSmile: 현재 release별 수집 platform/기간, release agreement, 35K paper corpus와 정확한 대응, 3,929/3,932 차이의 원인 UNKNOWN. HF card 본문 부재를 license 부재로 오해하지 않는다.
- 세 후보: 실제 사람의 demographic metadata 제공 여부 및 완전한 de-identification 여부 UNKNOWN. group-target labels와 구분한다.
- License를 확인한 것과 특정 training/공개 demo/model 배포 workflow의 권한 판단은 별개다. UnSmile ND를 모든 학습 금지 또는 모든 학습 허용으로 단정하지 않는다. [L2]

AI-01 = **PASS (dataset comparison evidence)**. AI-02 = **PASS (W1 mapping feasibility draft only)**. 위 UNKNOWN을 숨기지 않은 연구 evidence의 완료이며 dataset usability/adoption 승인이나 W1 전체 종료 선언이 아니다. DOC-01은 [W1 progress](../progress/W1.md)의 이 연구 링크 범위만 보완한다. TRUST-01 / SEC-01 / CHAIN-01 / OPS-01 / OPS-02 및 DOC-01 전체 final linkage는 이번 task로 닫지 않는다.

Dataset download / TEST access / record inspection / EDA / preprocessing / training / inference / Primary selection / taxonomy finalization / FRZ-01 / W2: **NO**. README·논문에 실린 예제/통계와 metadata 설명만 검토했으며 데이터 파일·dataset viewer는 사용하지 않았다.

## Sources

모든 source의 accessed date는 **2026-09-30**이다. 아래 README/guideline은 확인한 commit에 고정한다. 숫자·license·label 사실은 아래 source 범위, mapping 의견은 위 분석 범위를 따른다.

| ID | Source title / publisher | Claim scope |
|---|---|---|
| K1 | [K-MHaS README — adlnlp][K1] | 수·split·period·native labels·binary/multi-label |
| K2 | [Lee et al. (2022), K-MHaS, COLING pp.3530–3538 — ACL Anthology][K2] | §2 collection/annotation/definitions, §3 Tables 2–3 distribution, §4 split |
| B1 | [Korean HateSpeech README — kocohub][B1] | labeled count/split·별도 bias·TEST 정답 비공개·title 제공·license |
| B2 | [Moon, Cho, Lee (2020), BEEP!, SocialNLP pp.25–31 — ACL Anthology][B2] | §3 원천 기사 기간/표집, §4 annotation/IAA, §5 release, Appendix A |
| B3 | [Annotation Guideline (English) — kocohub][B3] | 두 축의 정의와 hate/offensive 경계 |
| B4 | [LICENSE.md — kocohub][B4] | CC BY-SA 4.0 표기 |
| U1 | [Korean UnSmile README — Smilegate AI][U1] | release 정의·labels·개인지칭·annotation·count 차이·논문 citation·dataset/code/model license 구분 |
| U2 | [dataset_infos.json — smilegate-ai official HF dataset][U2] | train/valid count, field names, version null; data records 아님 |
| U3 | [Kang et al. (2022), Korean Online Hate Speech Dataset for Multilabel Classification: How Can Social Science Improve Dataset on Hate Speech? — arXiv:2204.03262v2][U3] | related paper의 35K 구성과 24K subset agreement; 현재 release와 동일성 주장 아님 |
| U4 | [Official HF repository metadata — smilegate-ai/kor_unsmile][U4] | repo revision, README/card 부재; README retrieval 404와 대조 |
| L1 | [CC BY-SA 4.0 — Creative Commons][L1] | 상업/연구 사용 조건, attribution/ShareAlike |
| L2 | [CC BY-NC-ND 4.0 — Creative Commons][L2] | NC·attribution·modified material 재배포 제한 |
| R1 | [K-MHaS GitHub metadata][R1], [tags][RT1] | default branch/태그 확인 |
| R2 | [BEEP! GitHub metadata][R2], [tags][RT2] | default branch/태그 확인 |
| R3 | [UnSmile GitHub metadata][R3], [tags][RT3] | default branch/태그 확인 |

[K1]: https://github.com/adlnlp/K-MHaS/blob/ec7a7e775d650b825872f6f538fc717822cdfc1a/README.md
[K2]: https://aclanthology.org/2022.coling-1.311.pdf
[B1]: https://github.com/kocohub/korean-hate-speech/blob/f8d05dce2b22007bb149e5139c0060c68ad8f94b/README.md
[B2]: https://aclanthology.org/2020.socialnlp-1.4.pdf
[B3]: https://github.com/kocohub/korean-hate-speech/blob/f8d05dce2b22007bb149e5139c0060c68ad8f94b/guideline/annotation_guideline_en.md
[B4]: https://github.com/kocohub/korean-hate-speech/blob/f8d05dce2b22007bb149e5139c0060c68ad8f94b/LICENSE.md
[U1]: https://github.com/smilegate-ai/korean_unsmile_dataset/blob/569ab5f495e046911898805d3bee92469988dcd9/README.md
[U2]: https://huggingface.co/datasets/smilegate-ai/kor_unsmile/blob/6ef17c27881aa44b0d74e9fe29e8d031b40ba07f/dataset_infos.json
[U3]: https://arxiv.org/abs/2204.03262v2
[U4]: https://huggingface.co/api/datasets/smilegate-ai/kor_unsmile
[L1]: https://creativecommons.org/licenses/by-sa/4.0/
[L2]: https://creativecommons.org/licenses/by-nc-nd/4.0/
[R1]: https://api.github.com/repos/adlnlp/K-MHaS
[RT1]: https://api.github.com/repos/adlnlp/K-MHaS/tags
[R2]: https://api.github.com/repos/kocohub/korean-hate-speech
[RT2]: https://api.github.com/repos/kocohub/korean-hate-speech/tags
[R3]: https://api.github.com/repos/smilegate-ai/korean_unsmile_dataset
[RT3]: https://api.github.com/repos/smilegate-ai/korean_unsmile_dataset/tags
