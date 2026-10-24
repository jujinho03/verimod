> **2026-10-24 최신 F 통합 기록:** T main `639030b3`을 일반 merge한 소스로 Frontend 250/250, Backend 203/203, 기본 browser 1/1, W5 Desktop/Mobile 각 12/12가 통과했습니다. Live RPC 6건은 SKIP입니다. 아래 이전 기록은 당시 이력이며, 현재 통합 증거는 [최종 통합 결과](../evidence/w5-f/integration-20261024/README.md)를 참조하세요. PR #29는 Draft이며 최종 F SHA의 T 독립 리뷰가 필요합니다.
# W5 — 노유신(F) 수행 결과

이 문서는 F 전용 기록이다. A의 팀 진행 문서 `W5.md`를 생성하거나 덮어쓰지 않는다.
아래 최초 구현 결과(240/203/7)와 SAFE PUSH 재검증 결과는 서로 다른 실행이다.

최신 감사: [SAFE PUSH 및 서비스 인계](../evidence/w5-f/safe-push-20261022/README.md).

SAFE PUSH 재실행: Frontend 243/243 (단일 워커), Backend 203/203 (단일 워커·테스트 러너 30초),
typecheck/build/lint PASS. 기본 제한에서의 선행 timeout과 브라우저 환경 BLOCKED는 감사 문서에 보존했다.

기록일: 2026-10-22 KST. 범위: F 서비스 구현·회귀 및 T 공동 QA 준비.
전체 GATE-5: **PARTIAL**. 브라우저 QA·담당자 리뷰·팀 승인 증거가 남아 있다.

## 문서 전체를 읽고 정리한 역할

49쪽 실행 문서의 공통 규칙, W5 개정(p.18/32/33/44), Package 불변식(p.46)을 적용했다.
이전 주차의 목표·예산·완료 숫자는 실제 이번 실행 결과와 구분한다.

| 담당 | W5 소유 업무 | 이번 F 실행 경계 |
| --- | --- | --- |
| A / 주진호 | Validation 정책 후보 비교, X/B 팀 승인, 승인 후 LOCK, 별도 승인된 최초 TEST, 오류 분석 | F는 정책·threshold·LOCK·TEST에 접근하거나 승인하지 않음 |
| T / 설경민 | Synthetic 연결·전이 계약, W4 증거 보존, RPC/가스 및 서비스 QA | 기존 shared/ABI/TrustProfile 보존. F 변경에 대한 T 리뷰 대기 |
| F / 노유신 | FE-03 Synthetic Timeline, FE-07 Private Package, SEC-03 기존 권한·멱등성, Manifest/RPC/모드 UX | 아래 구현 및 실제 실행 로그로 보고 |

최신 팀 협업 규칙의 F 브랜치는 `nohyusin`이다. 작업 전 fetch했고,
`origin/main`과 `origin/nohyusin`이 모두 `8d0580a7ef6a7e88c2314e6f5f30ff5f08f693ab`임을 확인했다.
기존 F W4 `c1f750ea3752037d749324f1535df051ce6b37f9`는 해당 기준의 조상이다.
그 기준으로 기존 저장소에서 `nohyusin`으로 전환했다. 별도 worktree는 만들지 않았다.

## F 수행 내용

| 업무 | 구현·검증 결과 | 남은 완료 조건 |
| --- | --- | --- |
| FE-07 | 소유자 자료 다운로드, 로컬 파일 가져오기, 정확한 5필드/version/id 검사, shared content commitment 재계산, Core VALID 후 Content 확인. LIVE 자동 평문 캐시 제거, 메모리 보관·지우기 제공 | T 계약 리뷰, 실제 브라우저 다운로드/가져오기 QA |
| FE-03 | 고정 Synthetic DECISION/APPEAL/REVIEW 별도 ID/hash/previous Timeline. 정상·금지 전이·누락·미확정·RPC 실패·잘못된 참조 사례. 최초 Decision 보존, Mock/공개 Base 구분 | 브라우저·모바일 화면 캡처, T RCPT-05 독립 검토 |
| SEC-03 | 기존 principal/role·403·키 누락·409·같은 키 재전송·동시 발급·재시작·공개 정보 경계 회귀. 다른 demo principal에 다른 receipt/salt 발급 확인 | demo 헤더는 신원 인증이 아님. 운영 RBAC는 NOT_IMPLEMENTED |
| 상태 UX | Base/Synthetic/Service 배너 분리, 공개 Manifest 부재=NOT_CHECKED, 알려진 문서의 재계산 불일치=FAILED, Core/Content/Lifecycle 분리, L2 확인과 L1 finality 구분 | 실제 Base UI 및 모바일/데스크톱 QA |
| RPC | 요청당 5초 abort, 두 endpoint 실패 시 PENDING 오류 보존. 잘못된 RPC chain은 RPC_UNAVAILABLE, bundle의 잘못된 locator는 UNTRUSTED_ANCHOR 유지 | 실제 브라우저 네트워크 차단·복구 QA |

API-05/06 운영형 Appeal/Review는 여전히 501 NOT_IMPLEMENTED / POST-MVP다.
브라우저 합성 기능은 실제 접수·사람 심사·게시물 복구를 의미하지 않는다.

## 실제 실행 결과

- Frontend: **240/240**, 23개 파일, 실패·skip 0. 기존 202건 보존 + 신규 38건.
- Backend: **203/203**, 12개 파일, 실패·skip 0. 최신 main 197건 보존 + SEC-03 신규 6건. 과거 F 192건 포함.
- Frontend build/lint/W5 tools typecheck: PASS. lint의 기존 경고 2건은 남아 있으며 오류 0건.
- Backend typecheck/W4 tools typecheck/build: PASS.
- 새 Node 공개 RPC 읽기 전용 smoke: **7/7 PASS**, 142회 읽기 전용 RPC 호출.
  등록 블록 48358039, 관측 head 48665772, 확인 수 307734. 공개 원본 bundle의 SHA-256 보존.
- **브라우저·모바일 QA: BLOCKED**. 30개 시도 모두 Edge launch 직후 종료되어 테스트 본문에 진입하지 못했다.
  `browserType.launch: Target page, context or browser has been closed`, Crashpad named-pipe 종료.
  앱 브라우저의 별도 로컬 서버 접근도 `net::ERR_CONNECTION_TIMED_OUT`이었다.
  개발 서버는 종료했다. W5 화면 캡처·브라우저 RPC 성공·실제 다운로드 성공을 주장하지 않는다.

Node smoke는 실제 RPC에서 한 번 관측한 Epoch/getter/event/receipt와 head를 같은 실행 안의
음성 사본 검증에 재사용한다. 브라우저별 실시간 7/7의 재실행으로 표현하지 않는다.
기존 [W4 브라우저 7/7 원본](../handoffs/w4-anchored-epoch-public/20261020-r01/browser/browser-verification.json)은 역사 증거로 보존한다.

실행·파일별 소스 hash: [W5 증거](../evidence/w5-f/20261022/README.md).
Package 계약·재실행 명령·T 인계: [W5 F 인계](../handoffs/W5-F-service-qa.md).
작업 SHA는 이 문서를 포함한 로컬 커밋과 최종 전달 보고서에서 확인한다.
이번 실행은 로컬 검증이며 신규 GitHub CI 실행은 없다.

## GATE-5 판정과 담당 의존성

| 항목 | 이번 기록 |
| --- | --- |
| G5-01/02 | A의 X/B·LOCK·별도 TEST 승인/평가 증거 미확인. F 작업 중 TEST 경로 조회·stat·open·평가 없음 |
| G5-03 | W4 공개 원본 보존 + W5 Node RPC 관측 PASS. 실제 authoritative SQLite 접근·변경 없음 |
| G5-04 | 합성 연결/오류 단위 회귀 PASS, 브라우저 QA 및 T 독립 RCPT-05 검토 대기 |
| G5-05 | Package·민감정보·기존 권한/멱등 단위 회귀 PASS, 브라우저 UX/T 리뷰 대기 |
| G5-06 | 상태 구분 코드/SSR/단위 회귀 PASS. 실제 네트워크 차단·복구 브라우저 검증 BLOCKED |
| G5-07 | 로컬 소스 hash/테스트 증거 기록. 신규 CI, DOC-09, 전원 확인 및 팀장 최종 Gate 판정 대기 |

정책 `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false` 유지.
서명·broadcast·새 Epoch·실제 DB 전환·정책 LOCK·TEST·W6 이후 작업을 수행하지 않았다.
