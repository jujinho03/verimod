# W5 F 실행 증거 — 2026-10-22

기준: `nohyusin` / `8d0580a7ef6a7e88c2314e6f5f30ff5f08f693ab`.
원본 PDF 49쪽을 읽고 p.44의 F W5 및 p.33/46의 Gate·프라이버시 경계를 구현했다.

- [실행 요약·소스 SHA-256](regression-summary.json): Windows 환경, 테스트 수, 명령·종료 코드, 파일별 출처.
- [실제 공개 RPC 관측](node-public-rpc.json): 새 W5 Node smoke 7/7, 호출 메서드/host, getter/event/receipt 관측 및 원본 보존 hash.
- [브라우저 차단 증거](browser-blocker.json): Edge 시작 실패 및 앱 브라우저 loopback timeout. W5 브라우저 PASS 아님.
- [F 진행 결과](../../../progress/W5.md), [Package 계약 및 T 인계](../../../handoffs/W5-F-service-qa.md).

최종 검증: Frontend 240/240 (23 files), Backend 203/203 (12 files), typecheck/build/lint 오류 0.
기존 lint 경고 2건은 `src/api/client.test.ts`의 optional chaining 경고다.
브라우저 30개 시도는 launch 실패로 테스트 본문 진입 0개, BLOCKED다.
공개 브라우저 성공·모바일 시각 QA·Package 실제 다운로드 결과를 이번 실행 완료로 주장하지 않는다.

원시 테스트/빌드/브라우저 로그는 무시된 `private-data/w5-*`에 보관한다.
공개 요약에는 실제 원문·salt·Package·DB 경로·키가 없다. 테스트의 Package 자료는 기존 합성 seed에서 메모리로 생성했다.
기존 [W4 공개 증거](../../../handoffs/w4-anchored-epoch-public/20261020-r01/README.md)는 변경하지 않았다.
실제 authoritative SQLite·TEST·서명·broadcast·새 Epoch·정책 LOCK 접근 없음.

전체 GATE-5는 PARTIAL이며 T 리뷰·실제 브라우저 QA·A 승인/평가 및 신규 CI 증거가 필요하다.
