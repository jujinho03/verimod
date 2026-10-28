# W6 담당자별 최종 피드백

- 작성: A / 주진호
- 작성 시점: 2026-10-28 17:48 KST (병합 전)
- 근거: [GitHub 감사](w6-three-owner-github-audit.md), [merge ledger](w6-merge-ledger.md)

## T / 설경민

잘 된 점
- 증거를 T 소유 경로 4개 파일로만 올렸다. 제품 코드와 W4 원본을 건드리지 않았다.
- PASS, PARTIAL, NOT_MET, NOT_EXECUTED, BLOCKED를 섞지 않았다. Mobile 복구 미달과 실제 Hardhat LOCAL 미검증도 숨기지 않았다.
- F 리뷰를 SHA(`1620f82c`)와 비교 기준(`5bcfe0a2`)에 고정해 기록했다.

요청 (병합 전)
1. **PR #31에 GitHub 리뷰 Approve를 남겨 주세요.** 리뷰 대상 commit은 `1620f82c6cf523d7796273f7f816ed022e50953f`입니다. 저장소 문서 속 APPROVED는 GitHub 리뷰를 대신하지 못합니다.
2. `w6-t-integration-evidence-20261028.md`의 원본 문서 표기 `w6-w7-t-execution-receipt-20261027.md`를 실제 파일명 `w6-t-execution-receipt-20261027.md`로 고쳐 주세요(2곳).
3. `t-w6-evidence-main` → main PR을 만들어 주세요. 리뷰어는 F 또는 A입니다. F PR이 먼저 병합되면 새 main 기준으로 CI가 다시 도는지 확인합니다.
4. 62/111/44, 30/30은 로컬 실행 보고로 남깁니다. 원본 로그를 공개할 계획이 없다면 지금 문구 그대로 두면 됩니다.

## F / 노유신

잘 된 점
- CI 실패(#271)의 원인인 live RPC spec을 기본 config에서 분리했다(`1620f82c`). 수동 실측 도구는 전용 config와 `private-data/` 출력으로 격리했다.
- 장애 주입이 route abort라는 점, Mobile이 emulation이라는 점, rehash INVALID_PROOF가 BLOCKED라는 점을 문서에 정확히 적었다.
- 커밋 이력을 noreply 주소로 정리하고, 바뀐 SHA 대응표를 남겼다.

요청 (병합 전)
1. `npm run w5:typecheck` 결과를 PR #31 코멘트로 남겨 주세요. 명령 이름과 SHA를 함께 적어야 합니다. PR 본문의 "Typecheck: PASS"는 어떤 명령인지 알 수 없습니다. A가 `1620f82c`에서 직접 실행했을 때는 PASS였습니다.
2. PR #31의 head를 더 바꾸지 말아 주세요. push가 생기면 T 리뷰와 CI를 다시 받아야 합니다.
3. RPC 최적화 브랜치는 이 PR과 별도로 유지해 주세요. 별도 PR과 별도 독립 리뷰가 필요합니다.
4. `docs/progress/W6-F.md`의 E4 "BLOCKED"와 A 매트릭스의 E4 "PARTIAL"은 기준이 다릅니다. 팀 판정은 A 매트릭스를 따르므로 F 문서를 고칠 필요는 없습니다.

## A / 주진호 (자기 점검)

1. A W6 산출물은 `jujinho`에 커밋했다. W5 마감 3커밋이 함께 PR에 들어간다는 사실을 PR 본문에 명시한다.
2. A PR은 A가 직접 승인하지 않는다. T 또는 F의 GitHub 리뷰가 필요하다.
3. T PR은 A가 작성자가 아니므로 A가 독립 리뷰어가 될 수 있다. 이때 리뷰는 팀장이 GitHub에서 직접 남긴다.
4. `docs/eval/w5-model-card-limitations.md`의 미커밋 6줄은 W6 커밋에서 제외했다. 같은 내용은 Model Card와 AI-19 증거에 있다. 이 6줄을 버릴지 W5 정정으로 따로 커밋할지는 팀장이 정한다.
5. AI-19 서버 로그 3개는 공개 승인 전까지 커밋하지 않는다.
6. 남은 A 항목: A1(S1 승인 대기), A2·A3, A4(조건부), A5(LOCK/TEST), A7 리허설, DOC-09 원문 대조, OPS-04 증거.
