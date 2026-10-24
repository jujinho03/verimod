# W5 F SAFE PUSH 감사 및 인계

기준 F: `1085240368a2109dcbc5be245d6485004be27cb7`.
fetch 확인: main/nohyusin `8d0580a7ef6a7e88c2314e6f5f30ff5f08f693ab`,
T `f8cec268d1baccc65035336a5cc232d22f9f5546` (요청서의 `51227128f32660f9f62ab645a7c651832c08ae73` 이후 문서 커밋 포함).

## 필요한 보완

- F 진행 기록을 `docs/progress/W5-F.md`로 분리했다. 원격 기준에 없는 F 작성 파일만 이동했고 A 팀 문서를 덮어쓰지 않는다.
- 합성 Store도 사용자의 실제 입력을 받을 수 있다. 자동 저장 시 `contents`와 `appeals`를 빈 map으로 직렬화하여
  새 원문·salt·이의 본문은 메모리에만 남긴다. 공개 receipt/ledger 상태는 재시작 후에도 유지한다.
- W4 LIVE 비공개 캐시의 자동 삭제를 제거했다. 기존 자료는 자동으로 읽거나 삭제하지 않고 소유자가 버튼으로 직접 지울 수 있다.
- 홈·프로토콜 화면의 저장 설명을 실제 메모리/공개 저장 경계에 맞췄다.
- 원문·salt 미저장, 새 사용자 입력·이의 본문 미저장, 저장 실패 오류의 비밀값 미노출 회귀 3건을 추가했다.

## 감사 범위

Package 생성/다운로드는 버튼 동작, 가져오기는 파일 선택과 검증 동작으로만 수행한다.
Package의 version/id/원문+salt/commitment copy를 검사하고 Core VALID 전에는 Content PASSED로 표시하지 않는다.
공개 body/hash/Merkle/Bundle에는 비공개 자료를 합치지 않고 가져온 파일을 RPC/API로 전송하지 않는다.
다운로드·가져오기 실패 메시지는 고정 문구이며 파일명·내용·salt를 echo하지 않는다.

Synthetic는 Mock ledger 범위를 명시한다. 기존 RESTRICT→APPEAL→REVIEW와
HUMAN_REVIEW→직접 REVIEW/RESOLVED 규칙은 보존한다. 이력 누락은 INCOMPLETE_HISTORY,
미확정/RPC 가용성 실패는 NOT_CHECKED/PENDING이며 global completeness/freshness를 보증하지 않는다.
Manifest 미등재는 NOT_CHECKED, 알려진 문서의 실제 hash 불일치는 FAILED다.
Base/Mock/Service를 구분하고 L2 Confirmed를 L1 finality로 표시하지 않는다.

T의 RCPT-05 issuer_seq 검사는 아직 병합하지 않았다. T의 별도 구현을 F 검증 통과로 주장하지 않는다.
T PR이 main에 병합된 후에만 일반 merge 및 `verify.ts` 양쪽 회귀 보존 검토가 필요하다.
shared/ABI/TrustProfile/issuer/운영 Backend/W4 원본 Evidence·Manifest·Receipt·root는 변경하지 않았다.
원격 main 병합·force push·reset/rebase·체인 송신·실제 DB 전환·TEST 접근 없음.

## 검증 증거

최종 재실행·소스 hash·변경 파일·Git 안전 조건은 [audit.json](audit.json)에 기록한다.
처음 Frontend 기본 병렬 실행은 기존 Merkle 테스트 1건이 5초 제한에 걸렸다.
제한·assertion을 변경하지 않은 단일 워커 재실행은 **243/243 PASS**다 (최초 W5 240 + 신규 개인정보 회귀 3).
Frontend build/lint/W5 typecheck PASS, lint 기존 경고 2건·오류 0건.
Backend 결과는 audit.json의 이번 재실행을 기준으로 읽으며 과거 203/203과 혼동하지 않는다.
Backend 최종 전체 회귀는 **203/203 PASS**, 12개 파일, skip 0건이다.
명령: `npm test -- --maxWorkers=1 --testTimeout=30000` (default/json reporter, 원시 로그 보관).
앞선 기본 병렬 실행은 199/203, 단일 워커·기본 제한 실행은 202/203이었다. CLI 자식 프로세스의
테스트 실행 제한 초과가 발생해 최종 러너 예산을 30초로 두었다. 테스트 assertion과 기능 내부 timeout은 변경하지 않았다.
Backend typecheck/build도 PASS다. 기본 `npm test`가 이 Windows 환경에서 안정적으로 통과했다고 주장하지 않는다.

`npm run test:browser -- --max-failures=1`은 Chromium 실행 파일 부재로 테스트 본문 진입 전 실패했다.
공식 Chromium 설치도 작업 전용 캐시에서 EPERM realpath 및 다운로드 timeout으로 실패했다.
브라우저/모바일 QA는 **BLOCKED**다. 원시 로그는 무시된 `private-data/w5-safe-push/`에 보관한다.
과거 Node RPC 7/7은 보존된 읽기 전용 Node 관측이며 이번 브라우저 사용자 흐름의 7/7이 아니다.
이 SAFE PUSH 감사에서는 원본 RPC 증거를 덮어쓰거나 새 체인 동작을 수행하지 않았다.

전체 W5 Gate PASS 및 서비스 통합 PASS를 주장하지 않는다. T 공동 계약 리뷰·실제 브라우저/모바일 QA·A 승인·신규 CI는 별도다.
