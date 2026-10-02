# FE-00 — W1 Browser / Routing Evidence

## Metadata
- 담당: 노유신 / F
- 실제 검증일: 2026-09-30, 20:11–20:24 KST (UTC+09:00)
- 사용한 최신 main SHA: `19f77a2079f118e71a1a7c3ef83dd469c99e2b48`
- 브랜치: `evidence/w1-f-browser-closure`
- OS: Windows, build 10.0.26200
- Node: v24.16.0
- npm: 11.13.0
- 브라우저: Codex In-app Browser(실제 브라우저 탭). 지원되는 browser API로는 정확한 engine 버전을 확인할 수 없었고, 내부 버전 페이지 접근은 차단됐습니다. 설치된 다른 브라우저로부터 버전을 추정하지 않았습니다.
- 로컬 URL: `http://127.0.0.1:5179/`
- 실행: `npm run dev -- --host 127.0.0.1 --port 5179 --strictPort`
- 사전 점검: origin URL 확인; working tree clean; fetch한 main이 예상 SHA와 일치. origin/main에서 새 브랜치를 만들었습니다. 과거 no_usin 브랜치는 merge하거나 cherry-pick하지 않았습니다.

## Build / Test
명령은 frontend에서 workspace 로컬 npm cache로 실행했습니다. 모든 종료 코드는 0이었습니다.

| 명령 | 결과 | 주요 출력 |
|---|---|---|
| npm ci | PASS (0) | package 55개 추가; 56개 감사; 보고된 취약점 0 |
| npm test | PASS (0) | test 파일 10개, test 104개; 시작 20:12:23 KST; 6.72s |
| npm run lint | PASS (0) | oxlint 완료, 진단 없음 |
| npm run build | PASS (0) | TypeScript + Vite 8.3.0; module 86개; 1.62s에 build |

이는 frontend 실행 결과이며, 보안 인증이나 API/DB/AI/chain 통합 evidence가 아닙니다.

## Route Matrix
Route는 frontend/src/main.tsx에서 다시 읽었습니다. 실제 브라우저의 DOM/접근성 관찰로 페이지 내용과 공통 Layout/navigation을 확인했습니다. Navigation link는 Enter로 활성화했습니다. Wildcard는 직접 열었습니다. 세션 동안 console warning/error 로그를 확인했고 비어 있었습니다. 앱 fatal error나 error overlay는 관찰되지 않았습니다. 이는 범위를 정한 smoke check이며 브라우저 전체 계측이 아닙니다.

| Route | 렌더링 | Fatal Error | 관찰한 UI | 결과 | 비고 |
|---|---|---|---|---|---|
| / | YES | 관찰되지 않음 | VeriMod heading, navigation, Prototype mode, demo link | PASS | 직접 로드 |
| /check | YES | 관찰되지 않음 | 판정할 글, 빈 입력, synthetic 경고, 예시 버튼 | PASS | Footer 판정 요청 link; screenshot |
| /receipts | YES | 관찰되지 않음 | 발급받은 영수증과 봉인 상태, synthetic seed 다섯 개, filter | PASS | 내 영수증 link; screenshot |
| /receipts/a91d3c07-6e2b-4b58-9f14-2c7e8d0b5a63 | YES | 관찰되지 않음 | 판정 영수증, anchor 단계, synthetic 요약, 검증 control | PASS | 기존 seed link; fixture/코드 수정 없음 |
| /verify | YES | 관찰되지 않음 | 받은 영수증을 직접 다시 계산합니다, selector, 검증 결과 | PASS | 영수증 검증 link; VALID 이후 RPC_UNAVAILABLE |
| /review | YES | 관찰되지 않음 | 대기 중인 이의제기와 검토 보류 건, queue, 검토 form | PASS | 검토 콘솔 link; 검토 제출 안 함 |
| /protocol | YES | 관찰되지 않음 | 영수증을 만들고 검증하는 규칙, implemented/simulated/next 섹션 | PASS | 영수증 형식 link에서 /protocol#receipt로 이동 |
| /w1-route-not-found | YES | 관찰되지 않음 | 404, 페이지를 찾지 못했습니다, home/receipts link | PASS | Wildcard route |

관찰된 한계: /review에는 정적 감사에서 이미 지적한 과거 문구 “RESOLVED는 팀 합의 전 임시 값”이 아직 남아 있습니다. 렌더링 PASS는 이 문구를 승인하거나 D08을 대체하지 않습니다. 제품 코드는 바꾸지 않았습니다.

Keyboard 활성화 후 브라우저 캡처가 쓸모없는 scroll 위치에 남는 경우가 있었습니다. Ctrl+Home으로 캡처 viewport를 복원했습니다. Screenshot을 확인해 사용할 수 없던 초기 badge 캡처를 교체했으며, 이것이 모든 브라우저의 scroll 동작에 대한 일반적 주장은 아닙니다.

## Status / Badge Matrix
frontend/src/ui/bits.tsx의 기존 component를 확인했으며, 새 component는 만들지 않았습니다.

| Component/상태 | 관찰 위치 | 실제 렌더링 결과 | 경계 |
|---|---|---|---|
| AnchorBadge -> StatusBadge(pass) | /receipts와 seed 상세 | 앵커 확인 표시; 목록 screenshot에 초록 badge 포함 | 모의 원장이며 Base Sepolia 아님 |
| SyntheticPill | /receipts와 상세 | 합성 시드 / 합성 점수 표시 | 내장 synthetic 데이터 |
| VerifyReportView VALID | /verify, 기본 REVIEW seed | 초록 VALID / 기록 일치와 통과 단계 | 모의 원장을 대상으로 한 실제 로컬 hash/proof 계산 |
| VerifyReportView RPC_UNAVAILABLE | /verify, 기존 RPC 장애 가정 checkbox | 원장 조회 불가, 대기/skipped 단계; 변조 주장 없음 | 모의 장애 control이며 실제 RPC 장애 아님 |
| CodeBadge | /protocol#codes | 기존 code 표 DOM에 VALID, HASH_MISMATCH, INVALID_PROOF, PENDING_ANCHOR, RPC_UNAVAILABLE, INVALID_SCHEMA 포함 | 정적 참조 표; 나열된 모든 code의 runtime 실행을 주장하지 않음; 별도 시각 캡처는 확보하지 못함 |

정상 검증에는 내장 REVIEW seed 0f6a9e3b-4d2c-4a17-b8e5-7c1d2f6a9e30을 사용했습니다. 실제 사용자 입력, 이의제기, package, network anchor, 인증된 검토자 동작은 사용하지 않았습니다.

## Screenshots
이번 closure 중 2026-09-30에 새로 만든 브라우저 콘텐츠 전용 캡처:

- [Routing](../assets/w1-fe-routing-2026-09-30.png): /check heading, 공통 navigation, Prototype mode, 빈 입력.
- [Verification status](../assets/w1-fe-status-badges-2026-09-30.png): /verify, 초록 VALID 결과와 명시적 simulation banner.
- [Anchor badges](../assets/w1-fe-anchor-badges-2026-09-30.png): /receipts, 내장 seed pill과 기존 AnchorBadge/StatusBadge 렌더링.

Seed 영수증 안의 날짜는 fixture timestamp이며 screenshot 날짜가 아닙니다. 예전 screenshot을 재사용하지 않았습니다. 시각 콘텐츠를 합성하거나 보정하지 않았습니다.

## Security / Privacy Check
- 비밀정보 노출: NO
- 개인정보 노출: NO
- 실제 비공개 영수증 데이터: NO
- 이번 W1 closure 중 생성한 screenshot: YES
- 원본 salt 값, 비공개 package, 인증 token, 계정 UI, 실제 사용자 텍스트는 screenshot 세 장 어디에도 없습니다. 공개 synthetic demo field만 나옵니다.

## Scope Boundary
- 정적 frontend skeleton과 브라우저 렌더링 evidence만 해당합니다.
- API 구현 완료 evidence가 아닙니다.
- SQLite 통합 evidence가 아닙니다.
- 실제 AI inference 통합 evidence가 아닙니다.
- 실제 Base Sepolia anchoring evidence가 아닙니다.
- Production 브라우저 QA 완료 선언이 아닙니다.
- W2 구현은 시작하지 않았습니다.
- 기존 FE-00a/b/c와 화면 요구사항을 보존했으며, 새 scaffold는 필요하지 않았습니다.
- docs/progress/W1.md와 docs/03-current-status.md는 수정하지 않았습니다. 팀 전체 tracker 연결은 팀장의 후속 작업으로 남습니다.

## Final Result
FE-00 W1 BROWSER / ROUTING EVIDENCE = PASS

범위: 위에서 관찰한 route와 상태, 브라우저 세션 하나 기준. 정확한 browser engine 버전은 미확인으로 남습니다. PR/CI 승인과 팀 전체 W1 closure는 이 로컬 렌더링 결과와 별개입니다.
