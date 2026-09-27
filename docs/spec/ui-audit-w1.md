# FE-00: 기존 UI 정적 점검 결과

담당 노유신 · 2026-09-27 · 기준 commit `f807585dae3930e8c249c5975d0d4cb88b060cb4`.
원격 `no_usin`에서 읽은 소스 근거다. 아래 줄 번호는 이 commit 기준이다. 정적 코드 확인과 브라우저/통합 실행은 구분한다.

| 재사용 위치 | CURRENT 확인 | TARGET 차이 / 후속 작업 |
|---|---|---|
| frontend/src/main.tsx:33 | /, /check, /receipts, /receipts/:receiptId, /verify, /review, /protocol 및 404 | 기존 route 재사용; 새 scaffold 불필요 |
| pages/CheckPage.tsx:40, store/store.ts:38 | draftDecision이 runSyntheticInference를 호출하고 브라우저에서 발급; scores_ppm/정책/manifest 표시 | Node POST /api/decisions와 I1 실제 추론 연결, 503/멱등키/발급 응답 처리 필요 |
| domain/types.ts:16, domain/schema.ts | 고정 5-label ScoresPpm 및 현재 evidence 배열 | 최종 taxonomy 미정; I1 동결 후 지원 키 반영, 합성 5개 강제 금지 |
| features/TamperPanel.tsx:19 | 사본 body 변조, rehash 선택, 원본·사본 검증 및 diff 표시 | UI 재사용; 실제 Base seed/reader 연결은 TARGET. 현재 로컬 검증을 공개 체인 증거로 표시 금지 |
| features/VerifyReportView.tsx:23 | report.code/steps 및 manifest/content/lifecycle side-check 별도 표시 | 재사용; anchor 5상태·활성 TrustProfile·LOCAL 배지와 별도 표시 요구 |
| features/useVerify.ts:16, store/store.ts:186 | verifyReceipt가 로컬 createLedgerReader context 사용 | T의 실제 RPC reader와 내장 TrustProfile 연결 필요 |
| pages/VerifyPage.tsx:28, domain/verify.ts:8 | TrustConfig, 전역 REQUIRED_CONFIRMATIONS=12 | 두 TrustProfile/프로필별 확인 수; Base 12 자동 승계 금지 |
| store/state.ts:123 | window.localStorage에 receipt/원문/salt 포함 PoC 상태 보관 | 서버 SQLite/권한/공개 read model 분리; 원문 echo·salt public 노출 금지 |
| pages/ReceiptDetailPage.tsx:110 | 공개 bundle JSON 다운로드 | Private Package 5필드 저장/불러오기 기능은 src 검색에서 미발견; 별도 구현 필요 |
| domain/verify.ts:212 | 로컬 private content로 commitment side-check | Package id/copy 검증 및 verified body authority 유지 필요 |
| features/AppealForm.tsx:19, store/store.ts:215 | canAppeal 및 issueAppeal, 기존 이의 링크/중복 제어 | 서버 소유권·키·병렬 UNIQUE 검증 필요 |
| pages/ReviewPage.tsx:16, store/store.ts:296 | APPEAL의 UPHOLD/OVERTURN, DIRECT의 RESOLVED, 이미 검토 시 거절 | 서버 reviewer 역할·동시성 보장 필요. REVIEW 화면의 '팀 합의 전 임시 값'은 D08 ADOPTED와 어긋나는 문구로 기록 |
| store/ledger.ts:46 | ISSUED/BATCHED/SUBMITTED/CONFIRMING/ANCHORED 및 시간 기반 시뮬레이션 | D22의 FROZEN/SUBMITTING/SUBMITTED/CONFIRMED/FAILED는 잠정 목표, W1 코드 변경 없음 |
| backend/src/app.ts:7 | /api/health | 업무 API 8개와 DB 7테이블은 미구현 TARGET |

표에서 축약한 pages/features/store/domain 경로는 모두 frontend/src 아래다. 근거 재현: `rg -n 'runSyntheticInference|draftDecision|createLedgerReader' frontend/src/store/store.ts`, `rg -n 'package_version|private_package' frontend/src`, 각 파일 열람. Package 검색 0건은 해당 명칭 미발견이며 독립 실행 시험 결과가 아니다.

## 판정

- 기존 라우트·TamperPanel·VerifyReportView·AppealForm·ReviewPage 재사용 가능 위치 확인.
- API 연결·server persistence·authorization·idempotency·Private Package·실 RPC는 후속 TARGET.
- 실제 브라우저 screenshot·접근성·동작 QA는 미실행. 기존 docs/assets 이미지를 이번 실행 증거로 재사용하지 않음.
- 팀 결정은 docs/02-decision-register.md D01~17 ADOPTED 및 D18~28 WORKING ASSUMPTION을 따른다. T의 이번 API/DB 초안 리뷰는 아직 없음.
