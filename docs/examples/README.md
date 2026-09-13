# 공개 검증 예제

실제 이용자 자료가 아닌 **기존 frontend seed에서 추출한 synthetic PoC 예제**다. 원문·salt·appeal 본문을 포함하지 않는다. anchor의 주소·tx·block은 기존 seed의 합성 값이며 실제 네트워크 배포 증거가 아니다.

| 파일 | 변경 | 정상 seed 원장에서 예상하는 core 결과 |
|---|---|---|
| [01-valid.json](01-valid.json) | seed 원본 bundle | `VALID` |
| [02-tampered.json](02-tampered.json) | 원본의 `payload.inference.scores_ppm.violence`만 120000으로 변경 | `HASH_MISMATCH` |
| [03-rehashed.json](03-rehashed.json) | 위 변경 본문의 receipt hash도 재계산; proof·anchor 유지 | `INVALID_PROOF` |

경로의 `payload`는 `receipt_body` 아래다. 정상 파일을 검증할 때 RPC 장애 가정을 켜면 `RPC_UNAVAILABLE`이며 변조 실패와 다르다.

## 화면에서 확인

1. [실행 안내](../08-submission-guide.md)에 따라 frontend를 실행한다.
2. `/verify` → **파일 올리기**에서 JSON을 선택하거나, 파일 내용을 **JSON 붙여넣기**로 입력한다. GitHub에서 파일을 열고 Raw 내용 또는 다운로드 기능을 사용한다.
3. **검증하기**를 누르고 위 결과를 비교한다. 원장에는 앱의 기본 seed epoch #1이 있어야 한다.

새 브라우저 프로필의 기본 seed에서 바로 동작한다. 손상된 기존 저장 상태의 복구 안내가 보이면 먼저 기존 자료를 보존하고 별도 프로필에서 시연한다. 이 안내를 위해 기존 localStorage를 자동 삭제하지 않는다.

이 JSON만으로 독립된 실제 blockchain을 조회하는 것은 아니다. 검증기는 앱에 미리 설정된 trust config와 **로컬 합성 원장**을 사용한다. core `VALID`는 AI 판정의 정확성이 아니며, 원문 검사는 별도다. 원문을 제공하지 않는 자동 검사에서는 content가 `NOT_CHECKED`; 기본 seed 원문이 있는 브라우저에서는 content 검사도 수행될 수 있다.

## 출처와 재현 검사

- 원본 receipt ID: `a91d3c07-6e2b-4b58-9f14-2c7e8d0b5a63`.
- 원본 hash: `0x2dcaff4155a88bd14317e9b9969784b5d0ab5cbfc34cd2c21a00ab462e34687f`.
- [buildSeedState](../../frontend/src/store/seed.ts)의 receipt와 [locatorOf](../../frontend/src/store/ledger.ts)를 사용해 bundle을 만들었다. 새로운 contract 주소나 transaction을 만들지 않았다.
- [submission.test.ts](../../frontend/src/domain/submission.test.ts)는 공개 파일을 직접 읽고, seed와의 일치·명시한 필드만의 변경·세 결과·RPC 장애 구분을 검사한다. 합성 clock은 2026-09-14 UTC로 고정한다.

```bash
cd frontend
npm ci
npm test -- src/domain/submission.test.ts
```

fixture가 코드 변경으로 달라지면 CI가 실패한다. 기존 hash 규칙을 변경해 fixture만 무작정 재생성하지 말고 protocol compatibility를 먼저 검토한다.
