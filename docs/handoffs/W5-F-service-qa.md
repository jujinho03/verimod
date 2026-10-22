# W5 F → T/A 서비스 QA 인계

작성: 노유신(F), 2026-10-22. 상태: 구현/단위/Node RPC 검증 완료, 브라우저 QA 및 T 승인 대기.

후속 SAFE PUSH의 수정·재실행·제약은 [최신 감사 기록](../evidence/w5-f/safe-push-20261022/README.md)을 따른다.
T 최신 확인 SHA는 `f8cec268d1baccc65035336a5cc232d22f9f5546`이며 현재 F에 병합하지 않았다.

## Package 계약 — F 구현, T 리뷰 요청

기존 발급 응답과 실행 문서의 계약을 재사용한다. 새 HTTP endpoint는 없다.

| 필드 | 규칙 |
| --- | --- |
| package_version | 정확히 `verimod-private/1` |
| receipt_id | lowercase UUID v4, Core VALID의 ReceiptBody.receipt_id와 일치 |
| original_text | 원문 그대로의 문자열. trim/NFC/줄바꿈 변환 없음. lone surrogate 거부 |
| content_salt | 기존 owner issuance material과 같은 0x 없는 lowercase hex 64자 |
| content_commitment | 0x 포함 lowercase bytes32. 복사본이며 독립 신뢰 근거 아님 |

다섯 필드 이외·누락·미지원 버전·raw JSON 중복 키·1 MiB 초과 파일을 거부한다.
`shared contentCommitment('0x' + salt, original_text)`를 재사용하고 프로토콜 바이트를 바꾸지 않는다.
Core VALID → Package ID 비교 → Package commitment copy와 검증된 body 비교 → 원문+salt 재계산값과 body 비교.
일치 PASSED, 형식/내용 불일치 FAILED, 자료 부재/미확정 Core NOT_CHECKED.
Core와 Content 결과는 독립 표시한다. Content 실패가 Core의 기록 무결성 결과를 덮어쓰지 않는다.

다운로드는 명시적 사용자 동작이다. 가져온 파일은 React 메모리에만 보관하고 본문·salt·파일명을 화면/로그에 표시하지 않는다.
RPC·플랫폼 API에 전송하지 않고 public Bundle에도 합치지 않는다. 화면의 지우기 또는 이탈로 해제한다.
LIVE 신규 자료는 localStorage에 읽거나 쓰지 않는다. 기존 W4 LIVE 캐시는 자동 삭제하지 않고 소유자가 화면의 버튼으로 직접 지울 수 있다.
SAFE PUSH 감사에서 Synthetic Store의 자동 저장 경로도 보완했다. 공개 receipt/ledger만 저장하고
contents/appeals는 빈 map으로 직렬화한다. 원문·salt·이의 본문은 메모리에만 남고 페이지 재시작 후에는 Package가 필요하다.
기존 Synthetic 예시는 메모리에 존재하며 운영용 secure storage 또는 실제 소유자 인증으로 주장하지 않는다.
실제 W4 소유자 원문/salt에 접근하지 않았으므로 해당 W4 Content는 **NOT_CHECKED**다.

## 검증·신뢰 변경 범위

- Canonical/hash/Merkle/ABI/approved profile/issuer/backend Manifest 검증/CONFIRMED release gate는 보존했다.
- 공개 Manifest 목록에 없는 해시는 NOT_CHECKED. 알려진 hash에 대응하는 공개 문서가 있으면
  shared domain hash를 재계산하며 불일치는 FAILED. invalid/unavailable 문서는 NOT_CHECKED.
  기본 합성 Manifest 목록은 저장소의 원본에서 계산한 hash만 포함한다.
- RPC chain 불일치는 endpoint 설정/가용성 문제로 RPC_UNAVAILABLE.
  bundle chain/contract/issuer 또는 승인 publisher 불일치는 기존 UNTRUSTED_ANCHOR 의미를 유지한다.
- 브라우저 reader의 요청당 abort는 5초. 프로필 변경으로 PENDING을 조용히 VALID로 바꾸지 않는다.
- F CONFIRMED verifier는 EIP-1898 hash-bound 조회를 유지한다. 브라우저 reader는 기존 `latest` getter와
  event/receipt 확인을 사용한다. 다중 호출 사이 reorg/일관성 위험이 남아 있으며 같은 보증 수준으로 주장하지 않는다.
  T의 snapshot/hash-bound 보강은 별도 검토 대상이다. 이번에 확인 기준을 낮추지 않았다.
- 모든 Synthetic Timeline은 Mock ledger, 공개 Base 증거 아님을 표시한다. 일부 이력만으로 global completeness/freshness를 주장하지 않는다.
  사례의 issuer_seq 2/4/5는 제공된 부분 이력이다. T의 RCPT-05 단조 증가·중복·역순 독립 검토는 대기한다.

## 재실행

저장소 root에서 Backend와 Frontend 의존성이 설치돼 있어야 한다. Node 24.16.0/Windows에서 단위·빌드를 검증했다.
샌드박스 임시 디렉터리가 불안정하면 무시된 작업 디렉터리로 TEMP/TMP를 지정한다.

```powershell
Set-Location backend
$env:TEMP = Join-Path (Get-Location) 'private-data/w5-temp'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
npm test
npm run typecheck
npm run w4:typecheck
npm run build

Set-Location ../frontend
$env:TEMP = Join-Path (Get-Location) 'private-data/w5-temp'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
npm test
npm run build
npm run lint
npm run w5:typecheck
npm run w5:rpc-smoke
```

`w5:rpc-smoke`는 공개 RPC의 읽기 메서드 다섯 개만 허용하며 새 W5 증거 JSON을 쓴다.
이 도구의 고정 20261022 증거 디렉터리는 후속 실행 시 덮어쓰므로 기록을 보존한 별도 체크아웃에서 재실행한다.
실제 DB/키/모델 가중치/TEST를 열지 않는다. 기존 W4 public bundle은 읽고 hash만 대조한다.

## T/F 실제 브라우저 재검증 필요

브라우저 실행 가능한 환경에서 다음을 수행한다. 자동 테스트는 Edge, desktop 1440×1000 / mobile 390×844 두 프로젝트다.
Playwright 지원 브라우저가 설치된 경우 `W5_BROWSER_CHANNEL`로 선택할 수 있다.

```powershell
$env:W5_LIVE_RPC = 'true'
npm run w5:browser
```

실행할 항목: 두 RPC 차단·offline·복구, Base/Mock 모드, L2 확인 문구, Manifest 미등재,
Synthetic 6개 사례, 본인 합성 Package 다운로드→가져오기→ID 오류→지우기,
W4 7개 케이스의 실제 공개 RPC 브라우저 재실행. 스크린샷은 공개/합성 결과만 저장한다.
실제 소유자 Package/원문/salt는 screenshot/Git/원격 전송 금지다.
현재 호스트의 30개 시도는 모두 **browser launch BLOCKED**, 테스트 본문 실행 0개다.
Node 공개 RPC 7/7과 기존 W4 브라우저 7/7을 W5 브라우저 통과로 합산하지 않는다.

남은 확인자: T의 Package/상태 계약 리뷰와 RCPT-05, T/F 화면 QA, A의 DOC-09 및 전체 GATE-5 판정.
X/B/LOCK/TEST 승인 대기, 정책 PROVISIONAL 유지. 실제 송신·실제 DB 전환 없음.
