# tools

| 폴더 | 내용 |
| --- | --- |
| `golden/` | TypeScript 구현과 별개로 Python으로 canonical 직렬화(`canonical_golden.py`)와 영수증 hash(`receipt_golden.py`)를 다시 계산해, 두 언어 결과가 같은지 확인하는 독립 검증 도구 |

```sh
python tools/golden/canonical_golden.py
python tools/golden/receipt_golden.py
```
