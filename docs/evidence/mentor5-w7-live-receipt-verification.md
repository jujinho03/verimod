# Mentor 5 후속 — W7 경로 신규 LIVE Receipt 검증

**PASS — 새 로컬 W7 경로 발급 2건, 두 W4 공개 Receipt와 모델·정책 해시 일치.** 2026-11-02 새 실행이며 과거 PR #42에서 보고한 원본 Receipt를 확보하거나 소급 검증한 것은 아니다. 영수증은 기존 W4 Epoch에 포함되지 않았다. 테스트는 온체인 전송 없이 격리한 새로운 비운영 SQLite DB를 사용했다.

## 실행 근거와 환경

- 작업 기준 HEAD `e540c7a1e26e445f64cda9f676059479b2c4830f`, Windows 11, Node v24.10.0, Python 3.12.14, Playwright 1.63.0, headless Chromium. 실행 중 별도 검증기 후속 변경 때문에 worktree는 dirty였다. 본 발급에 사용한 Node backend `src`, Python inference 소스와 실행 스크립트, `CheckPage.tsx`, frontend API 및 Vite 설정은 기준 HEAD 대비 변경되지 않았음을 `git diff --name-only`로 확인했다. 따라서 완성될 후속 PR HEAD 전체가 이 실행 시점에 존재했다고 주장하지 않는다.
- 실행자는 로컬 R01 Python `/healthz`가 최초·재기동 후 모두 HTTP 200, `ready: true`, run `AI07-BL-KLUE-RB-45126-R01`, CPU를 반환했고 Node `/api/health`가 HTTP 200이었다고 당시 수동 관측을 보고했다. 브라우저 기록 스크립트는 health endpoint를 호출하지 않았으므로 원시 health 응답의 독립 확인은 **NOT_VERIFIED**다. 발급 결과의 상태·ID·hash는 별도 원시 JSON과 격리 DB를 대조했다. 코드상 로더는 선정된 가중치 및 고정 config·manifest digest를 검증하고 고정 revision tokenizer를 로컬에서 불러온다. 이 실행 관측과 코드 경로는 추론 실행의 암호학적 증명이 아니다.
- 실제 브라우저 `/check`의 LIVE 모드에서 무해한 합성 문장을 입력해 Vite proxy → Node `/api/decisions` → 로컬 Python R01 `/infer` → Node provisional 정책 및 발급 경로를 실행했다. 해당 경로는 fixture 또는 mock 응답이 아니다. 사용한 provisional 정책은 로컬 W4 E2E 범위이며 S1 승인이나 LOCK이 아니다.
- 각 행의 시각은 민감정보를 제외한 로컬 결과 기록 파일의 UTC 기록 시각으로, 정확한 HTTP 시작 시각이나 독립 타임스탬프가 아니다. 입력 원문·salt·인증정보·로컬 비공개 경로·DB 및 가중치는 공개하지 않았다. 임시 DB는 비공개 위치에 남겼고 기존 W4 DB를 열지 않았다.

| 구분 | 결과 기록 시각 UTC | POST | Receipt ID | Receipt hash | 상태 |
| --- | --- | --- | --- | --- | --- |
| 최초 실제 발급 | 2026-11-02T02:31:26.987Z | 201 | `81278b71-5fc1-4ab5-aa67-8974b3cae6c1` | `0xf57e711724eac55b8bfde4c89ee474743cd75171e715ff0813ec24d3db0934d6` | `PENDING_ANCHOR`; proof·anchor null |
| R01 서비스 중단 | 2026-11-02T02:31:47.758Z | 503 / `INFERENCE_UNAVAILABLE` | 발급 없음 | 해당 없음 | UI 오류 표시 |
| R01 재기동 후 | 2026-11-02T02:33:00.652Z | 201 | `32251096-5644-4d13-83dc-3b65a0a6a582` | `0xaa70a645d32ba5443e6872de0a6b18f5d3384515d695f62ccc90af265466964b` | `PENDING_ANCHOR`; proof·anchor null |

최초 및 복구 발급 각각에 대해 `GET /api/receipts/:id`와 `GET /api/receipts/:id/bundle`은 모두 HTTP 200이었고 응답 receipt hash가 POST 결과와 일치했다. 사용자가 브라우저에서 신규 발급을 시작했으며 두 GET은 같은 브라우저 테스트의 API 요청으로 확인했다.

2026-11-02 02:35 UTC 별도 로컬 검사에서 격리 DB의 두 `canonical_body`와 `receipt_hash`를 읽기 전용으로 가져오고, 앞선 POST에서 관측한 null proof·anchor로 bundle을 재구성해 실제 프런트엔드 `verifyReceipt`에 전달했다. 두 건 모두 본문 해시 재계산 일치, **`PENDING_ANCHOR`**였다. schema·hash `PASSED`, anchor `PENDING`, epoch·inclusion·finality `SKIPPED`, 원장 호출 0회였다. 이는 위 발급 API의 상태 표기와 구별되는 verifier 코드 실행이며, 공개 체인 검증이나 proof 확인을 뜻하지 않는다. 해당 verifier·receipt·schema 소스는 기준 HEAD 대비 변경되지 않았다.

## 장애 시 DB 전후 비교

독립 DB를 읽기 전용 연결해 각 시점의 테이블 행 수를 확인했다. 성공 첫 발급 전→후는 receipts `0→1`, content_store `0→1`, epochs 및 epoch_members 각각 `0→0`, idempotency_records `0→1`이었다. **실제 모델 서비스 중단 요청 전→후**는 receipts `1→1`, content_store `1→1`, epochs 및 epoch_members `0→0`, idempotency_records `1→1`로 신규 발급이 없었다. 모델 재기동·복구 발급은 receipts `1→2`, content_store `1→2`, epochs 및 epoch_members `0→0`, idempotency_records `1→2`였다. 이 행 수는 격리 DB에 한정된다.

## 해시 대조

| 출처 | Model Manifest Hash | Policy Manifest Hash | 결과 |
| --- | --- | --- | --- |
| W4 receipt-0 | `0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1` | `0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e` | 기준 |
| W4 receipt-1 | 동일 | 동일 | MATCH |
| 새 LIVE 최초 발급 및 복구 발급 | 동일 | 동일 | MATCH |
| 현행 backend manifest를 기존 canonical 규칙으로 재계산, backend 고정 상수 | 동일 | 동일 | MATCH |

W4 공개 파일 두 개와 새 결과에서 필드를 읽고, manifest 도메인 분리 해시를 독립 계산해 세 쌍과 backend 상수를 비교했다. 기존 W4 파일 digest 및 receipt hash 검사는 [기존 해시 검토](mentor5-model-policy-hash-verification.md)를 따른다. 동일 해시는 새 Receipt의 W4 거래 포함, 모델이 실제 실행됐다는 암호학적 증명, AI 판정의 정확성, 발급자의 정직성이나 모든 발급 사건의 완전성을 뜻하지 않는다. TEST SEALED, S1 PENDING_APPROVAL, Model/Policy LOCK NOT_EXECUTED를 변경하지 않았다.
