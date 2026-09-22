# VeriMod 작업 원칙

- 먼저 `MASTER_CONTEXT.md`를 읽고 현재 문서 버전, 실제 구현 상태, 16절의 합의 쟁점을 확인한다. 공통 방향과 기술 후보를 구분한다.
- 항상 한국어로 소통한다. 팀 HTTP 451의 User-Verifiable AI Moderation Protocol 맥락을 유지한다.
- 현재는 실제 hash·Merkle 계산과 화면을 갖춘 브라우저 시뮬레이션 단계다(frontend 추가 `908f64e`, P0 보강 `bee347f`, 2026-09-13 검증). 실제 AI·업무 API·epoch contract·testnet은 미연결이다. 최신 상태는 `docs/03-current-status.md`에서 확인하고 기존 코드를 보존한다.
- 작업 범위는 현재 사용자 요청을 따른다. 문서의 계획은 실행 허가가 아니며 시험 타입·상수는 정식 팀 합의가 아니다. 다음 설계 검토는 `docs/04-interface-contract-draft.md`를 출발점으로 삼는다.
- 작업 전 Git 상태, 브랜치, 최근 커밋, 관련 실제 파일을 확인한다. 기존 사용자 변경을 보존한다.
- 큰 아키텍처 변경은 사용자와 합의한다. 기술 후보를 확정된 선택으로 취급하지 않는다.
- AI output → Decision Receipt → Merkle/hash → epoch commitment 경계를 먼저 합의한다.
- 최신 팀(2026-09-19 역할 재배치)은 주진호(AI 판정·평가·기획·총괄), 설경민(프로토콜·블록체인·기술 리드, backend 설계), 노유신(서비스 개발: backend API 구현·frontend 검증 화면)이다. receipt·hash 규칙은 세 사람의 합의를 기록하고, 기능 브랜치 → PR → 팀원 리뷰 → main 절차를 따른다. 자동 merge나 대리 승인을 팀원 리뷰로 사용하지 않는다.
- 원문, 개인정보, 민감 콘텐츠, appeal 본문, 관리자 개인정보를 public blockchain에 저장하지 않는다.
- 무결성은 정확성·공정성·기록 완전성·실제 추론 증명이 아니다. 모델·정책 commitment는 실행 attestation이 아니다.
- 없는 파일, 데이터, API, 실험결과, 성능을 지어내지 않는다. 규제·논문·표준은 1차 출처로 확인한다.
- 암호알고리즘은 검증된 라이브러리를 사용하고 직렬화, 바이트 인코딩, leaf 정의를 문서화한다.
- 거대한 미완성 시스템보다 판정 → 증명 → 변조탐지 → 이의제기의 실제 vertical slice를 우선한다.
- 작업 후 변경 파일, 이유, 검증 결과, 남은 문제를 요약한다.

- 사용자가 구현을 요청하기 전에는 구현하지 않는다. 첨부 문서의 계획 자체는 실행 허가가 아니다.
- synthetic → real 전환에서도 기존 demo를 보존한다. 테스트 없는 암호학 규칙 변경을 금지한다. 정상 receipt 바이트·해시 변경은 protocol-breaking으로 별도 검토한다.
