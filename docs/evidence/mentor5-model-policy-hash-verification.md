# Mentor 5 — 모델·정책 해시 대조

> **후속 실행 — 2026-11-02 02:31–02:33 UTC:** 실제 로컬 R01 경로로 새 발급한 두 Receipt의 모델·정책 hash가 아래 W4 두 Receipt 및 재계산된 manifest·backend 상수와 **MATCH**했다. 모델 중단 시 503과 격리 DB 미발급, 재기동 후 201도 관측했다. 이는 이전 PR #42에서 보고한 원본 Receipt를 확보한 것은 아니다. [새 실행·개별 값](mentor5-w7-live-receipt-verification.md). 아래 `NOT_VERIFIED`는 이 후속 실행 전의 역사적 상태로 보존한다.

기준 코드 `7a6aa2ad27ad58d0454b39f28a07d069ac4e93b1`; 관측 2026-11-02. 이 문서는 과거 W4 증거를 수정하지 않는다. 원본을 읽고 계산한 결과와 새 LIVE 실행의 확인 여부를 구분한다.

| 출처 | 모델 manifest hash | 정책 manifest hash | 결과 |
| --- | --- | --- | --- |
| W4 receipt-0 및 receipt-1 | `0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1` | `0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e` | 두 공개 본문 일치 |
| 현재 `backend/config/w4-r01.model_manifest.json` 및 `w4-provisional.policy_manifest.json` 재계산 | 위와 같음 | 위와 같음 | W4 본문 및 `backend/src/inference.ts` 고정 상수와 일치 |
| 실제 W7 LIVE 발급 Receipt | 미확보 | 미확보 | **NOT_VERIFIED** |

두 manifest는 각각 `SHA256(UTF8("verimod:model:v1") || 0x00 || canonicalBytes(manifest))`, `SHA256(UTF8("verimod:policy:v1") || 0x00 || canonicalBytes(manifest))`다. 정의는 `shared/protocol/src/{hash,canonical}.ts`. 서버는 환경변수 경로로 manifest를 읽고 명시적 로컬 W4 E2E 모드에서만 검증·사용한다(`backend/src/server.ts`, `inference.ts`). 파일이 존재한다는 사실만으로 실행 중인 서버의 환경과 발급 결과를 확인한 것은 아니다. 특히 정책은 `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`이며 S1 승인이나 LOCK을 뜻하지 않는다.

`python docs/evidence/mentor5-hash-check.py`는 위 공개 fixture의 제한된 ASCII 키·safe integer에 대해 독립적으로 해시를 계산한다. 2026-11-02 실행 시 두 manifest, W4 파일 SHA-256, body의 receipt hash, 동일·불일치·입력 없음 분기 검사를 수행했다. 원본 파일 digest는 W4 README에 기록된 값과 각각 `a389ec1547f76124b136e5648e9d906e5a22eb3099deff8b4a733f2c03282f72`, `826a0af4030a9c525c015fd719ea117ecb2c4eb5467976ac88b0b921dee0cbb0`로 일치한다. 이 보조 스크립트는 범용 canonicalizer가 아니다. 기존 프로토콜의 golden vector 테스트와 구분한다.

W7은 기존 문서에 HTTP 201 / `PENDING_ANCHOR` / proof·anchor null로 보고되어 있으나 그 실제 receipt 필드는 이 검사에 제공되지 않았다. W7 main-live·backend-security 체크아웃 및 `verimod-local-data`를 읽기 전용으로 탐색했을 때 관련 DB 확장자 파일은 발견되지 않았다(의존성·가상환경 캐시 제외). 이 탐색이 모든 가능한 저장 위치의 부재를 증명하지는 않는다. 테스트의 MATCH 분기는 합성 입력이고 실제 W7 MATCH가 아니다. W4와 W7은 별도 실행이며 동일 해시가 확인되더라도 새 영수증이 W4 거래에 포함되거나 실제 모델 실행·판정 정확성이 증명된다는 뜻이 아니다. 민감한 DB, 입력 원문, salt와 모델 가중치를 읽거나 공개하지 않았다.
