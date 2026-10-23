# [A → F] W5 연구·시연 정책 적용 — 계약 질문 4개

수신: 노유신(F) · 참조: 설경민(T) · 발신: 주진호(A) · 2026-10-22 · 회신 요청: **10/23 중**(GATE-5 10/25 21:00)

## 상황 요약

- W5 연구·시연 정책으로 **S1(H50-90_O50-90)**을 추천했고, 팀장 승인을 기다리는 중이다.
- 바뀌는 것은 threshold 4개와 기록용 X/B·승인 metadata뿐이다. score payload, taxonomy, 판정 규칙(`>=`, TRUNCATED→ANY_RESTRICT→ANY_REVIEW→ALLOW), R01 모델은 그대로다.
- W4 정책 hash `0xa4559132…`와 W4 Receipt·Epoch·Anchor는 손대지 않는다. 새 정책은 새 hash를 갖는다.
- 현재 F 코드(`assertTrustedPolicy`·`assertValidPolicy`·`server.ts`의 local 플래그)는 W4 hash에 고정되어 있다. 그래서 F의 변경 없이는 새 정책이 동작하지 않는다.
- 상세 내용: [계약 제안 (PROPOSED)](W5-A-F-policy-contract-proposal.md), [정책 비교·결정 초안](../eval/w5-research-policy-scenarios.md)

## 답을 요청하는 4가지

**Q1. 승인 범위 표시 방식**
- A 제안: `team_approved`는 `false`로 그대로 두고, `policy_status=W5_RESEARCH_DEMO`, `approval_status=RESEARCH_DEMO_APPROVED`를 쓴다.
- 선택지: (a) 신규 필드 `approval_scope=RESEARCH_DEMO`를 추가한다 (Manifest schema 변경이므로 T 리뷰 필요). (b) 신규 필드 없이 `approval_status` 문자열만으로 구분한다.
- F 검증 코드에 어느 쪽이 더 쉬운가?

**Q2. rule ID**
- reason code(`SCORE_HATE_RESTRICT` 등)는 유지한다.
- triggered_rule_ids는 (a) `W4-*`를 그대로 쓰거나 (b) `W5-*`로 바꾼다.
- A는 Receipt만 보고도 정책을 구분할 수 있는 (b)를 선호한다. 다만 F 변경량이 크면 (a)를 수용한다.

**Q3. 정책 로딩 프로필**
- 연구 정책은 명시적 환경값(예: `VERIMOD_POLICY_PROFILE=W5_RESEARCH_DEMO`)이 있을 때만 로딩한다. 값이 없거나 알 수 없는 값이면 503 fail-closed로 처리한다.
- 추가로 요청하는 fail-closed 조건 2가지:
  - W4와 W5의 hash·threshold를 섞어 쓰면 거부한다.
  - 허용되지 않은 승인 상태는 거부한다.
- 새 발급에 W4 정책을 계속 허용할지는 F가 결정해 달라.

**Q4. 범위와 일정**
- 위 변경의 예상 범위(파일, 테스트)와 완료 가능한 날짜를 알려 달라.
- 회귀 결과를 주는 형식은 다음을 제안한다: F 커밋 SHA, 실행 명령, 통과/실패 수, 부정 사례(미승인 hash, 혼합 identity, 프로필 없음) 결과.
- 이 결과가 있어야 A가 Python/Node parity(21개 경계)를 실행할 수 있다.

## A가 하지 않는 것

- F/T 코드는 수정하지 않는다.
- 팀장 승인과 F 합의 전에는 Manifest·hash를 확정하지 않는다. LOCK과 TEST 개봉도 하지 않는다.
- X/B는 연구용 값이며 실제 검토 인력의 근거가 아니다. 서비스 문구에도 운영 정책처럼 표시하지 않도록 부탁한다.
