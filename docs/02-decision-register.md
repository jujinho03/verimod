# 확정 우선순위와 구현 진입 조건

모든 항목은 PROPOSED 상태다. 사용자의 검토 없이 아래 제안을 확정 사양으로 변경하지 않는다.

## 우선순위

| 순서 | 먼저 확정할 항목 | 제안 / 결정해야 하는 것 | 담당 제안 | 완료조건 |
|---|---|---|---|---|
| P0-1 | 판정 범위와 언어 | 한국어 텍스트, 실제 dataset label과 정책 범위 대응 | A + 공동 | 지원/미지원 라벨과 dataset 조사 조건 명시 |
| P0-2 | event/state 모델 | DECISION → APPEAL → REVIEW, ALLOW/RESTRICT/HUMAN_REVIEW | 공동 | 정상·직접 review·중복 appeal·오류 전이 표 합의 |
| P0-3 | AI → receipt | 정수 scores_ppm, model/policy manifest, typed inference errors | A 주도 | 라벨 누락·truncation·threshold 경계 처리 합의 |
| P0-4 | receipt bytes | body/bundle 분리, timestamp/null/Unicode/정수/JCS 규칙 | 공동 | 완전한 필드 목록과 사건별 required/null 규칙 합의 |
| P0-5 | hash → Merkle | SHA-256 domain, ordered CT tree, entry bytes, proof 방향 | B 주도 | 빈/단일/홀수 트리와 변조 처리 규칙 합의 |
| P0-6 | Merkle → contract | epoch_id/root/count/version, publisher, immutable 등록 | B 주도 | 논리적 register/get/event와 오류 목록 합의 |
| P0-7 | 독립 검증 | 신뢰 chain/contract/issuer, finality, RPC 오류, lifecycle | 공동 | VALID와 부분 검증/보류/실패 UI 의미 합의 |
| P1 | 구현 선택 | 실제 데이터·모델·threshold, Python/JS library, framework, chain | 각 담당 | P0 경계를 유지하고 선택 근거 기록 |
| P2 | 운영 선택 | 배치 시간/수, DB, 배포 환경, 키 보관, 재시도, 접근 통제 | B + 공동 | 실제 demo 환경에서 구현 전 필요한 설정 확정 |

P0-1에서는 서비스가 지원할 라벨의 의미를 정한다. 최종 모델 선정과 실제 threshold 수치 평가까지 이번 단계에서 끝내는 것은 아니다. 인증·원문 접근 통제는 기록 저장 및 appeal 구현 전 필수이며 선택적인 보안 부가기능이 아니다.

## 이번 설계 단계의 완료조건

- 네 인터페이스 생산자/소비자와 책임을 양쪽 팀원이 설명할 수 있다.
- model output과 policy action, receipt hash와 Merkle leaf, body와 anchor bundle을 구분한다.
- 제안서에 무결성과 정확성을 혼동하는 문구가 없다.
- 라벨·manifest·schema의 아직 미정인 세부 내용을 명시하고 합의할 순서를 정했다.
- 구현 시작은 사용자 요청 후 별도 단계로 진행한다.

## 다음 구현 단계에 들어갈 때 필요한 산출물

합의한 내용을 정식 JSON Schema와 manifest schema, 버전별 protocol 명세로 고정한다. 이는 이번에 생성하지 않는다.
이어 합성 입력임을 명시한 공통 테스트 벡터를 실제로 생성하여 두 언어에서 비교한다. 아래는 수행 계획이며 이미 통과한 결과가 아니다.

| 영역 | 필수 검증 |
|---|---|
| Receipt | 같은 body/key 순서 변경의 동일 hash, 필드 변경의 다른 hash, timestamp와 null 규칙, 중복 key/Unicode 오류 거부 |
| AI 계약 | 누락/범위 밖 점수 거부, 정수 threshold 바로 아래/같음/바로 위, TRUNCATED 우선순위, 모델 실패의 가짜 ALLOW 금지 |
| Merkle | n=1/2/3/5, 모든 index, 변경 leaf, wrong root, 누락/추가 proof, 잘못된 count/index, duplicate receipt, empty epoch |
| 상호운용 | Python과 TypeScript의 canonical bytes/receipt hash/root/proof 일치 |
| Contract | 정상 등록/조회/event, 중복·권한 없는 호출·지원 안 되는 version·0 count·수정 시도 거부 |
| Verification | 다른 chain/contract/issuer, RPC 오류, 미확정 tx, reorg, 독립 조회 root 비교 |
| Appeal | 각 선행 receipt hash와 inclusion, 누락 기록, issuer/content 불일치, 허용 안 되는 상태 전이 |
| Integration | 실제 AI → receipt → batch → testnet anchor → 독립 검증 → 복사본 변조 실패 → appeal/review 연결 |

공통 벡터가 통과하기 전에는 “상호운용 가능한 protocol이 구현됐다”고 주장하지 않는다. 실제 testnet transaction이 없으면 “온체인 검증 완료”라고 쓰지 않는다.

## 유지할 미확정 사항

데이터셋 라이선스·split·라벨, base model, 모델 성능, calibration 방식과 threshold 수치, 정확한 manifest schema, 기술 스택, testnet, finality 정책, batch 설정, 저장/배포 방식, 사용자 인증 및 reviewer 권한 설계, 재심 확장. 새로운 선택은 기존 문서를 수정하고 변경 이유를 기록한다.
