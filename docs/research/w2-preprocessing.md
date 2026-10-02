# AI-05 — Deterministic preprocessing v1

상태: **W2 A-owner evidence, 2026-10-01.** 이 문서는 tokenizer 이전 단계의 모델 입력 텍스트 표현을 정의합니다. Tokenizer나 모델 선택이 아니며 성능에 대한 주장도 하지 않습니다.

코드: [`ai/src/verimod_ai/data/preprocessing.py`](../../ai/src/verimod_ai/data/preprocessing.py). 테스트: [`ai/tests/test_preprocessing.py`](../../ai/tests/test_preprocessing.py).

## 계약

| 항목 | v1 |
|---|---|
| `PREPROCESSING_VERSION` | `verimod-ko-text-v1` |
| 길이 단위 | Unicode code point(Python `str` 길이). UTF-16 단위나 byte가 아님 |
| 경계 | `MAX_CODE_POINTS = 500`, W2 v1 경계. 최종 tokenizer/모델 context 길이가 아님 |
| `FULL` | `len(text) <= 500` → `processed_text = text` |
| `TRUNCATED` | `len(text) > 500` → `processed_text = text[:500]` (앞부분 유지) |
| 원본 텍스트 | 절대 수정하지 않음. 출력은 새 값 |

출력 field: `sample_id`, `processed_text`, `input_status`, `original_length_codepoints`, `processed_length_codepoints`, `preprocessing_version`, 선택적 `source_dataset`. Policy action, reason code, receipt hash, Merkle, chain 데이터, 점수는 포함하지 않습니다.

Code point 기준 앞부분 truncation은 기존 synthetic demo manifest(`max_code_points: 500`, `truncation: HEAD`, `unicode_normalization: NONE`)와 일치합니다. Demo는 synthetic 예시로 남으며, 이 문서는 demo의 policy rule을 채택하지 않습니다.

## 보존하는 것 (변환 없음)

대소문자, 문장부호, 이모지(500 미만의 multi-code-point sequence 포함), 반복되거나 섞인 공백과 줄바꿈, 분해형 또는 호환 문자, 비속어와 맞춤법.

## 제외하는 변환

소문자화, 문장부호나 이모지 제거, 비속어 masking, 맞춤법 교정, 공백 압축, NFC/NFKC 등 모든 Unicode 정규화, 강제 자모 변환, 불용어 제거, stemming과 형태소 단위 재작성.

AI-15 leakage key(`w2-leakage-nfc-whitespace-v1`: NFC와 공백 압축)는 중복 탐지를 위한 비교 전용 key입니다. 모델 전처리가 **아닙니다**.

## 알려진 한계

- Truncation은 ZWJ 이모지나 분해형 한글 같은 multi-code-point grapheme을 500 위치에서 자를 수 있습니다. v1은 이를 보정하지 않습니다.
- 빈 입력이나 잘못된 입력은 여기서 거부하지 않습니다. 이는 inference 경계의 몫입니다(`EMPTY_INPUT` / `INVALID_INPUT`은 C01 PROPOSED 후보).
- Tokenizer/모델 truncation(subword 한도)은 W3 사안입니다. 추가로 잘릴 수 있으며, 그 경우 별도로 기록해야 합니다.

## Primary 데이터 관찰

[AI-20 EDA](w2-eda.md): TRAIN과 VALIDATION에서 500 code point 초과 record는 **0**건입니다(최대 135). 따라서 모든 Primary record는 `FULL`입니다. `TRUNCATED` 동작은 **synthetic test로만** 검증했습니다: 정확히 500 → FULL; 501 → 길이 500으로 TRUNCATED; supplementary plane 이모지는 code point 하나로 셈.

## 경계

- DEPENDENCY — upstream/downstream content commitment handled outside AI preprocessing. Receipt는 `processed_text`가 아니라 원본 콘텐츠에 commit합니다. A는 commitment나 hashing을 정의하지 않습니다.
- Policy가 `TRUNCATED`를 어떻게 다룰지(예: demo의 `TRUNCATED → HUMAN_REVIEW`)는 policy 계층 rule이며 PROPOSED로 남습니다.
- 향후 model manifest는 `preprocessing_version`을 기록해야 합니다. Manifest 생성은 범위 밖입니다.
- Sealed TEST: 열지 않음. 학습: NO.
