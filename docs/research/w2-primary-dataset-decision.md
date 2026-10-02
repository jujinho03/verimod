# AI-04 — W2 Primary dataset 확보

상태: **W2 A-owner evidence, 2026-09-30**. Primary 선정은 Command Center가 승인했습니다. 이 문서는 고정(pinned)된 확보 내역을 기록하며, 최종 VeriMod taxonomy, 모델 학습, 공식 benchmark 평가, Team GATE-2/FRZ-01 완료를 주장하지 않습니다.

## 결정과 사용 경계

- Primary: **BEEP! Korean HateSpeech**, 공식 repository [`kocohub/korean-hate-speech`](https://github.com/kocohub/korean-hate-speech).
- 고정한 Git revision: `f8d05dce2b22007bb149e5139c0060c68ad8f94b`.
- Dataset 라이선스: [CC BY-SA 4.0](https://github.com/kocohub/korean-hate-speech/blob/f8d05dce2b22007bb149e5139c0060c68ad8f94b/LICENSE.md). 저작자 표시, 라이선스 링크, 변경 고지가 필요하며, 변형한 라이선스 자료를 배포하면 ShareAlike 조건이 적용됩니다. 이 repository는 원본 댓글이나 기사 제목을 재배포하지 않습니다. 개인정보·퍼블리시티권 등 다른 권리는 여전히 문제가 될 수 있습니다.
- 공식 [README](https://github.com/kocohub/korean-hate-speech/blob/f8d05dce2b22007bb149e5139c0060c68ad8f94b/README.md)는 labeled train 7,896 / dev 471 / hidden-label test 974건을 보고합니다. **VeriMod pool은 train+dev만 사용합니다(8,367건)**. 공식 test, unlabeled corpus, 기타 dataset은 제외했습니다.
- 그 결과 만들어진 TEST는 공식 benchmark test의 재현이 아니라 **VeriMod internal holdout**입니다.

Native `hate` 축은 `hate / offensive / none` single-label입니다. `hate`와 `offensive`는 유해 native class이고, `none`은 negative/reference class이며 **자동 ALLOW가 아닙니다**. 별도의 `bias` 축과 `contain_gender_bias` flag는 로컬 metadata로만 보존합니다. 이는 확보 대상일 뿐 **최종 supported taxonomy가 아닙니다**. 정의는 [공식 annotation guideline](https://github.com/kocohub/korean-hate-speech/blob/f8d05dce2b22007bb149e5139c0060c68ad8f94b/guideline/annotation_guideline_en.md)을 따릅니다.

## 고정 파일 무결성

여섯 개 경로 모두 고정한 공식 Git tree에 있음을 확인했습니다. 다운로드한 byte는 해당 tree의 Git blob ID 및 아래 SHA-256 값과 일치했습니다. 파일은 Git repository 밖의 `../verimod-local-data/w2/beep/`에 있습니다. 행 텍스트는 문서나 로그에 출력하지 않았습니다.

| 고정 revision 기준 원본 경로 | Raw-byte SHA-256 | 행 수 | 파싱 / 무결성 |
|---|---|---:|---|
| `labeled/train.tsv` | `ebebacdcd023af2c4acc8c0a37695fb6433ac04fc009feff8f222724e303a5a9` | 7,896 | PASS; 필수 column과 native domain 확인 |
| `labeled/dev.tsv` | `232b615d6e359a9d31dfb8370f32e1733dc5bb3f9c5430d34d7fcc7ba4b7e8ef` | 471 | PASS; 필수 column과 native domain 확인 |
| `news_title/train.news_title.txt` | `80fcb349633ddf38062c17363f18e62b3e533640c2a31ba50468963ff5db1492` | 7,896 | PASS; 1:1 행 정렬 |
| `news_title/dev.news_title.txt` | `5332b771458697677396a6bae8de0f590be9b4b8718592d6e1a92b6592b5d47f` | 471 | PASS; 1:1 행 정렬 |
| `README.md` | `12d2668b0c23b048b16da8ccc5bd3b8f2e940b305a12324d22c330d1705c8fee` | N/A | SHA-256/Git blob 검증 |
| `LICENSE.md` | `87a816969906840bf7af8d4d01cdfad4741b18946365e1f286007935509f2edb` | N/A | SHA-256/Git blob 검증 |

Labeled header는 `comments`, `contain_gender_bias`, `bias`, `hate`입니다. 제목 파일은 labeled 행마다 한 줄씩입니다. 이번 고정 확보에서 필수 값 누락/형식 오류, 인식할 수 없는 hate/bias 값, 빈 제목 줄, 행 수 불일치는 모두 **0**건이었습니다. 중복 제거 전 native `hate` 분포: train `hate` 1,911 / `offensive` 2,499 / `none` 3,486; dev `hate` 122 / `offensive` 189 / `none` 160. 이는 무결성 집계이며 EDA나 성능 결과가 아닙니다.

확보/config 코드: `ai/configs/w2_dataset.json`, `ai/scripts/prepare_w2_dataset.py`. Script는 여섯 개의 고정 hash를 요구하며, 이미 존재하는 split artifact를 읽거나 덮어쓰기를 거부합니다. 원본 확보에는 허용 목록의 여섯 개 경로만 사용했고, 공식 TEST 파일은 열지 않았습니다.
