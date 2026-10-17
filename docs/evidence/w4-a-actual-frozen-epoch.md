# W4 A 실제 모델·평가·Frozen Epoch 증거 해설

2026-10-17 한국어 정리. 기존 실제 실행과 원본 보고서를 설명하며 이번에 모델이나 DB
테스트를 재실행한 결과는 아닙니다. 원문/예측 전체/DB/키는 공개하지 않습니다.

## 모델과 Validation

선정 run은 `AI07-BL-KLUE-RB-45126-R01`, 모델은 `klue/roberta-base`입니다.
선정 weight SHA-256은 `a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f`.
전처리는 `verimod-ko-text-v1`, HEAD 500 Unicode codepoints, tokenizer right truncation
128, native softmax와 PPM 반올림 한 번을 사용합니다. 외부 score는 hate/offensive만,
semantics는 UNCALIBRATED입니다. 정책/action은 AI가 생성하지 않습니다.

VALIDATION만 1,255건을 실제 추론했습니다. 라벨 건수는 hate 305/offensive 403/none 547이며
전부 FULL입니다. 데이터 파일 SHA-256은
`a92f81ed8eadb9fdb1950be542f9edac4fe778f3e7bd2d630cd1494ef031a26a`입니다.

| 정답 / 예측 | hate | offensive | none |
| --- | ---: | ---: | ---: |
| hate | 177 | 100 | 28 |
| offensive | 37 | 226 | 140 |
| none | 13 | 105 | 429 |

Macro-F1 `0.6524599868976999`, Accuracy `0.6629482071713148`로 W3와 차이 0입니다.
클래스별 F1은 hate `0.6654135338345865`, offensive `0.5419664268585132`, none `0.75`.
비공개 predictions SHA-256은 `74fcac005741574422edcd597dc1f78d8234b20e24e50f35d722d01fd927a400`.
TEST는 SEALED이며 열람/평가하지 않았습니다.

## 정책 후보와 parity

25개 실제 점수 후보를 비교했고 기술 연동 후보 `H50-75_O50-75`를 사용했습니다.

| score | review PPM | restrict PPM |
| --- | ---: | ---: |
| hate | 24495 | 216950 |
| offensive | 180483 | 646501 |

이 후보의 ALLOW/HUMAN_REVIEW/RESTRICT는 461/198/596건입니다.
FRR=91/547, RP=505/596, HAR=90/708, HRR_TOTAL=198/1255입니다. `none`은 NORMAL의
운영 proxy이며 플랫폼 정상 판정이나 ALLOW의 동의어가 아닙니다.
정식 FRR≤X/HRR_TOTAL≤B 선택은 X/B 미승인으로 수행하지 않았습니다.
정책 상태는 W4_PROVISIONAL_E2E_ONLY, team_approved=false입니다.

RESTRICT 우선, 다음 HUMAN_REVIEW, 나머지 ALLOW이며 TRUNCATED는 고점수여도
HUMAN_REVIEW입니다. Python/Node 21개 벡터에서 경계 -1/동일/+1, overlap,
TRUNCATED, 정렬된 reason/rule/hash가 일치했습니다.

## 최종 독립 E2E

F `2c99260c0eb6229d34b3f94191c2dab3238c1727`, T `fbcb3e9e99ae8dda2f9c70a32f35ec2c039b73de`
기준 재검증은 실제 R01 forward를 사용해 정상 2건과 실패 17건을 통과했습니다.
과거 valid-but-unapproved Model/Policy hash의 잘못된 201 발급은 503/신규 행 0으로 전환됐습니다.
17개 모두 Decision/Anchor Candidate/content_store/epoch/완료 idempotency 증가 0이며
가짜 점수/action을 응답하지 않았습니다. Issuer는 실제 F/Receipt/T 모듈에서 MATCH했습니다.

| 입력 | hate PPM | offensive PPM | 정책 결과 |
| --- | ---: | ---: | --- |
| FULL | 3364 | 12979 | ALLOW |
| TRUNCATED | 31479 | 102538 | HUMAN_REVIEW / INPUT_TRUNCATED / W4-TRUNCATED |

실제 E2E 55.004초, AI 회귀 152 tests+27 subtests, 당시 F 회귀 51개가 PASS였습니다.
[A 독립 재검증 원본](https://github.com/jujinho03/verimod/blob/9bcbec677d89d10364b327aae7e60955e2e4315d/docs/evidence/w4-a-final-revalidation.md)은
실행 당시 source/명령/실패 기록을 보존합니다. 이후 F의 192개 검사는 별도 결과입니다.

## 실제 발급·Freeze와 현재 DB

후속 실행은 F `f157b9aa7506093207e6695cc4b0ff7b83b69088`의 Windows 수정 도구를
사용했습니다. 실제 Python 호출 2회로 같은 점수의 FULL/TRUNCATED Receipt 각 1건을
발급했고 같은 새 SQLite에서 Epoch 1을 Freeze했습니다. replay/409, EMPTY_EPOCH 409,
독립 Merkle, SQLite 재개방을 확인했습니다.

[공개 원본 JSON 4개](../handoffs/w4-frozen-epoch-public/20261017-r01/README.md)는 바이트와
SHA-256을 유지했습니다. 원본 provenance의 F/T pin은 당시 실행 기준이며 최신 pin으로
덮어쓰지 않습니다. proof/anchor는 null, 실제 Epoch tx는 없습니다.

최신 F `c1f750ea3752037d749324f1535df051ce6b37f9`의 clean checkout에서 원본 DB
status를 한 번 실행한 결과 exit 0, 1.1127235초였습니다. 기존 snapshot과 DB bytes·
dev/ino·전체 epoch·member digest·행 수가 같았습니다. receipts 2, epoch_members 2,
epochs 1, content_store 2, idempotency_records 3, schema v2/journal delete입니다.
개인 경로와 identity 값은 비공개입니다. 설치/ACL/DB lifecycle을 변경하지 않았습니다.

## Manifest와 판정 경계

| 참조 | hash |
| --- | --- |
| Model | `0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1` |
| Policy | `0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e` |

현재 상태는 실제 로컬 발급/Freeze PASS이며 실제 온체인/GATE-4 전체 PASS가 아닙니다.
[다음 승인·연결 절차](../handoffs/W4-AFT-operations.md)를 따르고 W3 증거·실패 DB·TEST를 보존합니다.
