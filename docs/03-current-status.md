# 최신 구현 상태와 기획서 정정 목록

갱신일: 2026-09-13 (9월 12일 기획서·frontend 추가 반영) · 검증한 P0 코드: `bee347f00f1795d47063aac281411195ee322346` ([PR #1](https://github.com/jujinho03/verimod/pull/1), main 병합 전)

확인 사실과 실행 범위를 기록한다. 기술 채택은 [결정 기록](02-decision-register.md), 전체 맥락은 [MASTER_CONTEXT](../MASTER_CONTEXT.md), 다음 설계는 [계약 초안](04-interface-contract-draft.md)을 따른다.

## 확인 기준

- 원격 main/dev가 모두 `908f64e`임을 `git ls-remote`로 확인했다. 깨끗한 로컬 main `3e86a32`를 `git pull --ff-only origin main`으로 동기화했다.
- 문서 변경은 `docs/current-context-and-interface-draft` 브랜치에서 진행한다. 제품 기준 커밋과 문서 변경 커밋을 구분한다. 최종 업로드·병합 상태는 Git/PR에서 확인한다.
- [최신 기획서](references/project-proposal-2026-09-12.pptx)는 사용자가 제공한 `VeriMod______.pptx` 14장 원본 사본이다. 앞선 분석에서 본문·발표자 노트를 읽었다. 슬라이드나 노트를 수정한 판본이 아니다.
- 2026-09-12 인수인계 문서, AGENTS·MASTER·01·02·README·CLAUDE·00 및 domain/store/pages/backend/contracts 소스를 대조했다.
- 2026-09-11 PDF들은 과거 사본으로 보존한다. 최신 공식 행사 공지, 규제·경쟁 서비스, 별도 배포 환경은 이번에 재검증하지 않았다.

## 확정·시험·미정

| 분류 | 내용 | 근거 |
|---|---|---|
| 기록된 사용자 선택 | frontend/backend 분리, contracts는 backend 하위, Node.js·TypeScript·Express 5 | 02 결정 기록 |
| 최신 기획 방향 | HTTP 451, 한국어 텍스트 moderation, epoch 등록, 연결된 appeal/review, 접근 통제 오프체인 저장, 공개 IPFS 미채택 | PPTX 1·6·7·8·10·14장 |
| 최신 팀 | 주진호: 서비스·총괄, 노유신: AI·정책, 설경민: 코어·블록체인 | PPTX 10장 본문 |
| 시험 구현 | schema·합성 라벨/threshold·RESOLVED·제한 직렬화·Merkle·TrustConfig·시뮬레이션 원장 | 제품 코드 908f64e |
| 미정 | 실제 모델·데이터·평가, 정식 schema/manifest·수치/Unicode 규칙, ABI·체인·finality·키, DB·권한·보존 | 02 기록, 04 초안 |

## 실제 코드와 미연결 목표

| 영역 | 실제 구현 | 아직 충족하지 않는 목표 |
|---|---|---|
| UI | `/`, `/check`, `/receipts`, `/receipts/:receiptId`, `/verify`, `/review`, `/protocol` | 실제 업무 API 연결 |
| AI·정책 | 키워드/hash 합성 점수, 5라벨, ppm 정수, 예시 threshold, code point evidence | 실제 모델/LLM, 성능·오탐·calibration 평가 |
| Receipt | DECISION/APPEAL/REVIEW 생성, body/bundle 분리, schema 검사 | 서버 불변 저장·정식 프로토콜 승인 |
| 계산 | Web Crypto SHA-256, salted commitment, receipt hash, ordered CT Merkle root/proof·검증 | 전체 프로토콜의 다중 런타임 상호운용, 외부 원장 신뢰 기준점 |
| 직렬화 | 안전 정수·문자열·불리언·null·배열·일반 객체, 키 정렬 | RFC 8785 전체 호환 입증 |
| 앵커 | 로컬 epoch·배치·가상 블록·확인 횟수 | epoch contract·실제 tx·RPC·reorg |
| 수명주기 | 제한 판정 appeal, HUMAN_REVIEW 직접 종료, 새 REVIEW | 인증·권한·서버 멱등성·동시성 |
| 저장 | localStorage의 receipt·원장·원문·appeal 본문·salt | 접근 통제 DB/스토리지 |
| Backend | GET `/api/health` | moderation·receipt·appeal·review 업무 API |
| Contract | ToolchainCheck.ping | epoch 등록·조회·권한·중복 방지·event |

시험 값: hate/profanity/sexual/spam/violence, 500 code point, 6초 배치, 12회 확인, chain ID 31337, 합성 contract/publisher/tx/block hash. 실제 배포·정확도·가스비 증거로 사용하지 않는다.

검증 순서는 schema → hash → trust → epoch → inclusion → finality다. core VALID와 manifest/content/lifecycle side check는 별개다. 원문·salt 없이도 개별 inclusion은 검증할 수 있고, 선행 기록 누락은 lifecycle INCOMPLETE_HISTORY다. RPC 장애·미확정은 변조 확정이 아니다.

## 제안 명세와 시험 코드의 차이

아래는 2026-09-13 P0 수정 후 남은 경계다. 최초 정적 관찰과 이후 보강을 구분하며 상세 근거는 [protocol audit](05-protocol-audit.md)에 있다.

1. P0에서 raw JSON 중복 키·escaped 중복 키·1 MiB/64단계 입력 제한을 추가했다. 이미 JSON.parse된 객체에서 원래 중복 키를 복원할 수는 없다.
2. scorer는 evidence를 정렬하지만 schema는 배열 정렬·완전 중복 금지를 검사하지 않는다. 원문 범위·전처리 매핑의 검증 책임도 필요하다.
3. `verify.ts`의 content 검사는 원래 콘텐츠 commitment만 재계산한다. 별도 appeal 본문 검사는 없다.
4. LedgerReader는 epoch/현재 블록 번호를 제공한다. 실제 RPC chain 확인, locator의 tx/block hash·reorg 검증은 추가 설계가 필요하다.
5. receipt와 원장이 같은 브라우저 저장소에 있다. 고정한 시뮬레이션 root에 대한 사본 변조 시연과 외부 원장의 독립성 보장은 다르다.
6. 로컬 중복 검사·역할 문자열은 서버 소유권·reviewer 권한·동시 요청 원자성 보장이 아니다.

## 최신 PPTX 정정 목록

원본은 출처 사본으로 보존한다. 발표용 새 판본을 만들 때 아래 정정 사항을 본문·노트에 함께 반영한다.

| 장 | 원본 표현 | 정정 기준 |
|---|---|---|
| 5 | 공개 DB를 집계 열람·반영으로 일반화 | 1차 출처 확인 후 개별 사유 제공과 사본 무결성 대조를 구분 |
| 5 | 비용 절감·이력 미삭제·원장만으로 표본 감사 | 기대효과로 표시. 확보한 receipt/proof와 자료 가용성 조건 명시 |
| 6 노트 | 4단계 | 본문 5단계: 판정·발급·고정·검증·이의 |
| 7 노트 | 4계층 | 본문 6계층: AI·정책·영수증·앵커·저장·검증 |
| 8 | 같은 의미면 같은 bytes | 명세가 정한 동일 데이터와 직렬화 규칙일 때 같은 bytes |
| 9 | 9월 말~10월 말 7주 | 날짜·주차 정합성과 공식 공지 확인 후 확정 |
| 10 노트 | 2인 팀 | 본문 주진호·노유신·설경민 3인 팀 |
| 12 | 연결 누락이면 inclusion 실패 | 개별 포함 검증, 연결 규칙 실패, 불완전 이력 구분 |
| 13 | receipt/Merkle 구현 전 | 계산·화면·시뮬레이션 존재, 실제 AI·업무 API·epoch contract/testnet 미연결 |
| 13 | 모든 증거 공개 | 안전한 코드·명세·합성 예시·재현 증거. 비공개 원문·salt·개인정보·키 제외 |

## 다음 단계와 실행 증거

[04 계약 초안](04-interface-contract-draft.md)은 출력·오류, 상태·권한·중복, body/bundle, bytes/proof, ABI·신뢰 범위의 구체적 검토안이다. C01~C08은 모두 PROPOSED이고 팀 승인 기록은 없다. 채택 시 01·02를 함께 갱신한다.

앞선 문서 인수인계에 이어 이번 사용자 요청의 P0 제품 보강을 적용했다. 정상 hash 바이트·body·ABI를 바꾸지 않고 validation·저장 복구·경합·simulation disclosure·CI를 보강했다. 실제 테스트/lint/build/브라우저 결과는 [검증 기록](07-validation-2026-09-13.md)을 따른다. 모델 평가와 testnet은 실행하지 않았다.

수정 전 frontend 테스트는 7파일 54건이었다. P0에서 부정 입력·경합·복구·독립 Node crypto Merkle reference·기존 seed 해시 검사를 추가했다. 파일 존재와 실행 성공을 구분하며, 00 문서의 과거 팀원 보고를 이번 결과로 재사용하지 않는다.
