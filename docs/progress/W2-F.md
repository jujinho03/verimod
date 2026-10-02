# W2 — F / 노유신 실행·검증 기록

상태: **F W2 mock UI 및 component 회귀 작업 완료; 팀 리뷰 / FRZ-01 대기.**

## 기준과 범위

- 사용자: PDF 전체 검토 후 노유신 담당 작업 실행, 범위는 **W2만**으로 확인.
- PDF: `VeriMod_3인_7주_실행_프롬프트_W2_UPDATE_20260930.pdf`, 총 49페이지 전체 검토. p.3·14 이미지 페이지도 확인. F의 W2 업무는 p.41.
- 검증일: 2026-10-01 KST. 최종 기준 main: `ee92cc53a26abcbe2e69b92331586e9267622b33`, PR #25의 T 공통 프로토콜·벡터 통합 후 재검증.
- 작업 브랜치: `f-fe00d-w2-wireframes`. 기존 checkout 재사용.
- 초기 b380ee2 기준 검증 후 최신 main으로 재배치했다. 아래 제출 캡처는 최신 shared protocol 기준으로 갱신했다.
- Windows / Node 24.16.0 / npm 11.13.0 / Vite 8.3.0 / Vitest 5.0.0. 브라우저: Codex in-app browser, 최종 캡처 기본 viewport 1265px 폭. 엔진 정확한 버전은 확인하지 않았다.

## PDF 전체 요약과 세 사람의 역할

프로젝트는 AI 판정 기록을 영수증으로 발급하고, 해시·Merkle 증명으로 기록 무결성을 확인하며 이의제기·검토 기록을 연결한다. 무결성 확인은 모델 정확성·공정성·실제 모델 실행이나 기록 전체의 완전성을 증명하지 않는다.

| 담당 | 7주 역할 | W2 핵심 |
|---|---|---|
| A / 주진호 | 데이터·모델·평가·기획·발표 | Primary/split/leakage, EDA·taxonomy, preprocessing/evaluation skeleton |
| T / 설경민 | 공유 프로토콜·직렬화·hash/Merkle·schema·chain | shared package, body schema, 20 vectors, 바이트 일치, Merkle 규칙 |
| F / 노유신 | UI·서비스 API 구현·연동·사용자 검증 흐름 | 판정 카드, 영수증 상세·상태, 검증/변조 패널, T 벡터 UI 스냅샷 |

흐름: W1 계약·audit → W2 데이터/바이트/화면 뼈대 → W3 baseline·API 준비 → W4 실제 연동 → W5 평가·이의/검토 → W6 동결·검증·E2E → W7 QA·발표. W3 이후는 이번 실행 범위에서 제외했다.

PDF의 구버전 고정 5라벨·full JCS·확장 기능 설명을 새 승인으로 취급하지 않았다. 최신 decision register와 실제 main을 우선한다. 현재 5라벨은 `verimod-example-ko/0` **합성 demo**다. A의 `hate/offensive`, reference `none` 및 taxonomy ID/version은 **PROPOSED FOR GATE-2**이며, unsupported 라벨을 0으로 채우거나 none을 ALLOW로 매핑하지 않는다. T가 이번 main에 통합한 `issuer_seq`를 그대로 소비하며 독자적으로 schema를 변경하지 않았다.

## 티켓 결과

| 작업 | F 결과 | 근거 |
|---|---|---|
| FE-00d (계획 4h) | COMPLETE — 현재 합성 계약의 mock UI | CheckPage의 결과를 DecisionResult 표시 컴포넌트로 분리. ALLOW/HUMAN_REVIEW/RESTRICT, 점수, evidence, reason_codes, triggered_rule_ids, 입력 상태, manifest/commitment 표시. 입력 변경·처리 중 발급 차단 유지 |
| FE-00e (계획 4h) | COMPLETE — mock UI | ReceiptDetailPage body 전문과 AnchorBadge 재사용. PENDING_ANCHOR, VALID, HASH_MISMATCH, RPC_UNAVAILABLE 표시 확인. 앵커 전 통과 오표시 없음 |
| 검증/변조 패널 (계획 2h) | COMPLETE — 기존 동작 재사용·표시 개선 | VerifyReportView 단계 상태를 색·아이콘뿐 아니라 글자로 표시. TamperPanel 변경 필드/전후값, HASH_MISMATCH, 재해시 INVALID_PROOF 확인 |
| T 20건 UI snapshot (계획 1h) | COMPLETE — 아래 범위 20/20 | 실제 shared JSON 두 파일의 ID 집합·개수 검사, 모든 입력에 VerifyReportView 렌더. 유효한 DECISION body 6건은 카드까지 렌더 |

시간은 PDF 계획치이며 실제 투입 시간 측정값이 아니다. F 구현 완료는 팀 승인·FRZ-01·Gate-2 완료와 다르다.

## 재사용 위치와 필드 연결

- `frontend/src/pages/CheckPage.tsx` → `features/DecisionResult.tsx`: 기존 `DecisionDraft.inference`, `.policy`, `.text` 소비. salt는 렌더하지 않음.
- `features/ScoreBars.tsx`: 현 합성 taxonomy의 ppm·threshold 표시 재사용.
- `features/EvidenceText.tsx`: 기존 span 표시 재사용. 구간은 키워드 위치이며 인과 설명이 아님을 표시.
- `pages/ReceiptDetailPage.tsx`: `receipt.body` 전문. `issuer_seq` 포함 최신 shared schema를 기존 JSON 뷰로 표시.
- `features/ReceiptParts.tsx`: 원문이 로컬에 없을 때 표시 불가 안내 유지, 근거 해석 한계 추가.
- `features/VerifyReportView.tsx`: 실제 `VerifyReport.code`와 steps.state 소비. PASSED/FAILED/PENDING/SKIPPED를 통과/실패/대기/건너뜀으로 표시.
- `features/TamperPanel.tsx`: 기존 사본 변조·원본 보존·필드 차이 표시 재사용.
- `ui/bits.tsx`: AnchorBadge는 ANCHORED 전 pending, CodeBadge는 결과별 tone. 기존 상태 의미 유지.

## T 벡터 20건의 정확한 소비 범위

입력: `shared/vectors/receipt-regression-v1.json`, `receipt-regression-results.json` 및 그 안에서 참조하는 `docs/examples/01-valid.json`, `02-tampered.json`, `03-rehashed.json`.

T의 20건은 **20개의 정상 영수증이 아니다**. normal 3, key order 3, Unicode 3, null/missing 3, integer 3, duplicate 2, time 3의 혼합 matrix다.

- 20/20: F `w2-shared-vectors.test.tsx`가 ID를 읽어 실제 verifier 결과와 UI snapshot을 검증.
- 6/20: 스키마에 맞는 DECISION body는 실제 카드까지 표시. normal-valid, normal-tampered-body, normal-rehashed, key-receipt-body, null-required, time-valid.
- 14/20: canonical 전용 object/scalar/raw duplicate JSON 또는 invalid receipt는 INVALID_SCHEMA 보고서를 표시. 이를 정상 영수증으로 강제 변환하지 않음.
- 정상·변조·재해시는 각각 VALID / HASH_MISMATCH / INVALID_PROOF. 카드가 렌더됐다는 것이 무결성 성공을 뜻하지 않음.
- 이는 **React server-rendered component snapshot** 검사다. T의 Node↔Chromium byte 20/20 검사나 20건 browser screenshot을 이번 F 실행에서 재수행했다고 주장하지 않는다.

## 실행 검증

최신 main 통합 후:

```text
npm ci --cache <workspace>/work/npm-cache
  59 packages added; 0 vulnerabilities
npm test
  14 files passed; 172 tests passed
npm run lint
  PASS
npm run build
  PASS; 96 modules transformed
```

F가 추가한 테스트 37개: UI 상태 회귀 16개, T matrix ID guard 1개, 실제 벡터 소비 20개. Snapshot 32개(12 + 20). 생성 후 update 옵션 없는 npm test로 다시 통과 확인.

브라우저 수동 검증: 3조치 카드, 발급 후 body 상세와 PENDING_ANCHOR, 확정 후 VALID, RPC 장애 토글 RPC_UNAVAILABLE, 사본 변경 HASH_MISMATCH, 재해시 INVALID_PROOF. 최종 새 탭 경고·오류 로그 0건. 실제 RPC·AI API 호출 검증은 아님.

## 화면 증거

아래 7개는 2026-10-01 최신 ee92cc5 기반 소스 + 이 F UI 변경에서 촬영했다. `http://127.0.0.1:5180`의 합성 예시만 사용. 각 원본 PNG는 전체 페이지이며 확대해서 볼 수 있다.

| 파일 | 확인한 내용 |
|---|---|
| [decision-allow.png](../assets/w2-f/decision-allow.png) | ALLOW, NO_THRESHOLD_REACHED, optional evidence 없음 |
| [decision-review.png](../assets/w2-f/decision-review.png) | HUMAN_REVIEW, 사유·규칙·span |
| [decision-restrict.png](../assets/w2-f/decision-restrict.png) | RESTRICT, ppm, 사유·규칙·span |
| [receipt-before-anchor.png](../assets/w2-f/receipt-before-anchor.png) | body 전문·issuer_seq, 블록 확인 부족 PENDING_ANCHOR |
| [receipt-rpc-pending.png](../assets/w2-f/receipt-rpc-pending.png) | 검증기 RPC_UNAVAILABLE, 대기와 건너뜀 (파일명은 초기 캡처 분류 유지) |
| [verify-valid-tamper-fail.png](../assets/w2-f/verify-valid-tamper-fail.png) | VALID와 사본 HASH_MISMATCH, 바뀐 점수 필드·전후값 |
| [tamper-rehash.png](../assets/w2-f/tamper-rehash.png) | 해시는 통과, 포함 증명은 INVALID_PROOF, 후속 건너뜀 |

개인 사용자 원문·salt·키·토큰·지갑 정보·계정 화면은 포함하지 않았다. 표시된 텍스트·해시·주소는 저장소의 합성 예시 및 이 QA에서 발급한 합성 기록이다.

## 공동 검토 / FRZ-01 인수인계

1. A+T+F: I1 `hate/offensive`와 none reference의 최종 계약·policy 기준 확정. 현재 소비자는 5-label demo이므로 새 taxonomy를 넣기 전에 shared schema, manifest, policy, UI를 함께 변경해야 한다.
2. T+F: 이번 `issuer_seq`와 20 matrix 소비 결과 리뷰. 현재 프로토콜 bytes·shared 원본 변경 없음.
3. A: 최종 taxonomy ID/version, threshold, calibration 상태 전달. UI에서 미보정 값을 확률이라 부르지 않음.
4. T: 실제 Base Sepolia TrustProfile, RPC reader·배포 정보는 후속 의존성. 현재 12 confirmations는 합성 원장 기준으로만 표시.
5. 팀 리뷰: mock UI DoD와 증거를 확인한 뒤 FRZ-01/Team Gate-2 별도 판정. 팀원 확인·회의·승인을 대신 작성하지 않음.

현재 소비 계약의 mock UI 작업은 완료했으나, 새 taxonomy 실연동·실제 AI/API/chain 통합·W3 이후 구현은 미완/범위 밖이다.
