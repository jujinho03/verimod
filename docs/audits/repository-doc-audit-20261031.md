# 저장소 Markdown 감사 목록 — 2026-10-31

> **목적:** 멘토링·개발 문서의 위치와 확인 범위를 추적합니다. **기준 main:** `f6ad522513dcb198d520c70f98c1cc5e98748f51` · **대상:** 추적 Markdown 167개와 이 작업의 신규 감사·스타일 문서 4개, 총 171개.
>
> **주의:** 모든 파일을 자동으로 열어 제목·문자 인코딩·일부 Markdown 링크를 구조 검사했습니다. 이는 모든 문장의 사실관계나 모든 링크 문법을 검증했다는 뜻이 아닙니다. 코드와 선별 대조한 문서는 해당 범위만 `MATCH`이며, 나머지는 `NOT_VERIFIED`입니다. `Last Verified`의 구조 날짜는 역사적 실행이나 승인 날짜가 아닙니다.

## 검사 방식과 한계

- `Formatting`은 H1 한 개와 파일 끝 개행만 확인한 기계 판정입니다. 역사 문서의 `NEEDS_FIX`는 보존 사유가 될 수 있으며 전체 렌더 품질 검증이 아닙니다.
- `Links`는 코드 펜스를 제외한 일반 Markdown 상대 경로, 일부 reference와 Markdown 제목 anchor를 점검합니다. 이미지·대소문자도 존재하는 경로의 구성 요소를 확인합니다. HTML·복잡한 중첩 구문 및 GitHub 렌더 차이는 별도 수동 확인이 필요합니다.
- 링크 후보 0건: {}. 외부 URL 113개는 query·인증정보·로컬 주소를 제외하고 HEAD로 조사했습니다. 응답 분포: `{'200': 98, 'EXTERNAL_NOT_VERIFIED': 7, 'EXTERNAL_NOT_VERIFIED:403': 8}`. 403·429·네트워크 오류는 `EXTERNAL_NOT_VERIFIED`이며, 외부 링크가 있는 문서의 최종 링크 판정은 보수적으로 `NOT_VERIFIED`입니다.
- `PRESERVE`는 내용을 최신 상태로 인정한다는 뜻이 아니라 원본 보존 또는 추가 검토 전제입니다. `MATCH`는 개별 문서의 모든 규격·결과를 재검증했다는 뜻이 아닙니다.
- Mermaid 실제 GitHub 렌더와 비공개 외부 제출·원본 실행 로그는 `NOT_VERIFIED`입니다. [정합성 보고](documentation-consistency-report-20261031.md)에 관련 제한을 정리했습니다.

## 파일별 목록

| Path | Type | Last Verified | Code Match | Formatting | Links | Action | Priority | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [`CONTRIBUTING.md`](../../CONTRIBUTING.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`README.md`](../../README.md) | GUIDE | 2026-10-31 (구조) | MATCH | PASS | NOT_VERIFIED | UPDATE | P0 | f6ad522 기준; 선별 코드·상태 대조 |
| [`ai/AI09.md`](../../ai/AI09.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`ai/README.md`](../../ai/README.md) | GUIDE | 2026-10-31 (구조) | MATCH | PASS | NOT_VERIFIED | UPDATE | P0 | f6ad522 기준; 선별 코드·상태 대조 |
| [`ai/artifacts/README.md`](../../ai/artifacts/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`ai/configs/README.md`](../../ai/configs/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`ai/data/README.md`](../../ai/data/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`ai/experiments/README.md`](../../ai/experiments/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`ai/fixtures/README.md`](../../ai/fixtures/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`ai/notebooks/README.md`](../../ai/notebooks/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`ai/src/verimod_ai/training/README.md`](../../ai/src/verimod_ai/training/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`backend/README.md`](../../backend/README.md) | GUIDE | 2026-10-31 (구조) | MATCH | PASS | NOT_VERIFIED | UPDATE | P0 | f6ad522 기준; 선별 코드·상태 대조 |
| [`backend/contracts/README.md`](../../backend/contracts/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/00-repository-audit.md`](../../docs/00-repository-audit.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/01-domain-and-interfaces.md`](../../docs/01-domain-and-interfaces.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/02-decision-register.md`](../../docs/02-decision-register.md) | DECISION | 2026-10-31 (구조) | MATCH | PASS | NOT_VERIFIED | PRESERVE | P0 | f6ad522 기준; 선별 코드·상태 대조 |
| [`docs/03-current-status.md`](../../docs/03-current-status.md) | CURRENT | 2026-10-31 (구조) | MATCH | PASS | NOT_VERIFIED | UPDATE | P0 | f6ad522 기준; 선별 코드·상태 대조 |
| [`docs/04-interface-contract-draft.md`](../../docs/04-interface-contract-draft.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/04-merkle-spec.md`](../../docs/04-merkle-spec.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/05-protocol-audit.md`](../../docs/05-protocol-audit.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/06-p1-backlog.md`](../../docs/06-p1-backlog.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/07-validation-2026-09-13.md`](../../docs/07-validation-2026-09-13.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/08-submission-guide.md`](../../docs/08-submission-guide.md) | GUIDE | 2026-10-31 (구조) | MATCH | PASS | NOT_VERIFIED | UPDATE | P0 | f6ad522 기준; 선별 코드·상태 대조 |
| [`docs/README.md`](../../docs/README.md) | GUIDE | 2026-10-31 (구조) | MATCH | PASS | PASS | UPDATE | P0 | f6ad522 기준; 선별 코드·상태 대조 |
| [`docs/audits/documentation-consistency-report-20261031.md`](../../docs/audits/documentation-consistency-report-20261031.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/audits/github-sync-report-20261031.md`](../../docs/audits/github-sync-report-20261031.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/audits/repository-doc-audit-20261031.md`](../../docs/audits/repository-doc-audit-20261031.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/data-card.md`](../../docs/data-card.md) | CURRENT | 2026-10-31 (구조) | MATCH | PASS | NOT_VERIFIED | UPDATE | P0 | f6ad522 기준; 선별 코드·상태 대조 |
| [`docs/deployments.md`](../../docs/deployments.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/doc-14-conflict-audit.md`](../../docs/doc-14-conflict-audit.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/documentation-style-guide.md`](../../docs/documentation-style-guide.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/eval/threshold-rationale.md`](../../docs/eval/threshold-rationale.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/eval/w5-evaluation-preregistration.md`](../../docs/eval/w5-evaluation-preregistration.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/eval/w5-gate5-presentation.md`](../../docs/eval/w5-gate5-presentation.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/eval/w5-lock-preflight-checklist.md`](../../docs/eval/w5-lock-preflight-checklist.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/eval/w5-model-card-limitations.md`](../../docs/eval/w5-model-card-limitations.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/eval/w5-model-runtime-binding-design.md`](../../docs/eval/w5-model-runtime-binding-design.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/eval/w5-policy-decision-memo.md`](../../docs/eval/w5-policy-decision-memo.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/eval/w5-research-policy-scenarios.md`](../../docs/eval/w5-research-policy-scenarios.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/eval/w5-validation-error-analysis.md`](../../docs/eval/w5-validation-error-analysis.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/README.md`](../../docs/evidence/README.md) | EVIDENCE | 2026-10-31 (구조) | MATCH | PASS | NOT_VERIFIED | PRESERVE | P0 | f6ad522 기준; 선별 코드·상태 대조 |
| [`docs/evidence/chain-01-base-sepolia-w1.md`](../../docs/evidence/chain-01-base-sepolia-w1.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/fe-00-browser-qa-w1.md`](../../docs/evidence/fe-00-browser-qa-w1.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w3-a-ai07-baseline-run.md`](../../docs/evidence/w3-a-ai07-baseline-run.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w3-a-baseline-spec.md`](../../docs/evidence/w3-a-baseline-spec.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w3-a-final.md`](../../docs/evidence/w3-a-final.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w3-a-r01-source-provenance.md`](../../docs/evidence/w3-a-r01-source-provenance.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w3-a-reproducibility-handoff.md`](../../docs/evidence/w3-a-reproducibility-handoff.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w3-a-runner-smoke.md`](../../docs/evidence/w3-a-runner-smoke.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w3-team-integration.md`](../../docs/evidence/w3-team-integration.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w4-a-actual-frozen-epoch.md`](../../docs/evidence/w4-a-actual-frozen-epoch.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w4-a-final-revalidation.md`](../../docs/evidence/w4-a-final-revalidation.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w4-a-validation-policy.md`](../../docs/evidence/w4-a-validation-policy.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w4-f-callback/20261017/README.md`](../../docs/evidence/w4-f-callback/20261017/README.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w4-f-confirmation/20261017/README.md`](../../docs/evidence/w4-f-confirmation/20261017/README.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w4-f-final-integration/20261016-r01/README.md`](../../docs/evidence/w4-f-final-integration/20261016-r01/README.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w4-f-windows-esm/20261016-r01/README.md`](../../docs/evidence/w4-f-windows-esm/20261016-r01/README.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w5-f/20261022/README.md`](../../docs/evidence/w5-f/20261022/README.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w5-f/final-delivery-20261023/README.md`](../../docs/evidence/w5-f/final-delivery-20261023/README.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w5-f/integration-20261024/README.md`](../../docs/evidence/w5-f/integration-20261024/README.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w5-f/revalidation-20261022/README.md`](../../docs/evidence/w5-f/revalidation-20261022/README.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w5-f/safe-push-20261022/README.md`](../../docs/evidence/w5-f/safe-push-20261022/README.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w5-f/sec-integration-20261025/README.md`](../../docs/evidence/w5-f/sec-integration-20261025/README.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w5-model-training-audit.md`](../../docs/evidence/w5-model-training-audit.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w5-t-issuer-seq-fix-20261023.md`](../../docs/evidence/w5-t-issuer-seq-fix-20261023.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w5-t-test-05-20261022.md`](../../docs/evidence/w5-t-test-05-20261022.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-ai19-offline/README.md`](../../docs/evidence/w6-a-ai19-offline/README.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-ai19-offline/ai19-final-assessment.md`](../../docs/evidence/w6-a-ai19-offline/ai19-final-assessment.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-closeout/README.md`](../../docs/evidence/w6-a-closeout/README.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-closeout/e1-e8-matrix.md`](../../docs/evidence/w6-a-closeout/e1-e8-matrix.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-closeout/f-w6-pr-prep.md`](../../docs/evidence/w6-a-closeout/f-w6-pr-prep.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-closeout/github-integration-plan.md`](../../docs/evidence/w6-a-closeout/github-integration-plan.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-closeout/tf-final-execution-requests.md`](../../docs/evidence/w6-a-closeout/tf-final-execution-requests.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-closeout/w6-final-blockers.md`](../../docs/evidence/w6-a-closeout/w6-final-blockers.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-closeout/w6-final-integration-report.md`](../../docs/evidence/w6-a-closeout/w6-final-integration-report.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-closeout/w6-merge-ledger.md`](../../docs/evidence/w6-a-closeout/w6-merge-ledger.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-closeout/w6-owner-feedback-final.md`](../../docs/evidence/w6-a-closeout/w6-owner-feedback-final.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-closeout/w6-three-owner-github-audit.md`](../../docs/evidence/w6-a-closeout/w6-three-owner-github-audit.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-closeout/w6-three-owner-integration.md`](../../docs/evidence/w6-a-closeout/w6-three-owner-integration.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-closeout/w7-demo-readiness.md`](../../docs/evidence/w6-a-closeout/w7-demo-readiness.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-gap-closure-20261029.md`](../../docs/evidence/w6-a-gap-closure-20261029.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-security-closure-20261029/README.md`](../../docs/evidence/w6-a-security-closure-20261029/README.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-a-security-closure-20261029/mentoring-brief-20261030.md`](../../docs/evidence/w6-a-security-closure-20261029/mentoring-brief-20261030.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-aft-post-merge-audit-20261029.md`](../../docs/evidence/w6-aft-post-merge-audit-20261029.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-f/20261027/README.md`](../../docs/evidence/w6-f/20261027/README.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-f/20261029/README.md`](../../docs/evidence/w6-f/20261029/README.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-t-execution-receipt-20261027.md`](../../docs/evidence/w6-t-execution-receipt-20261027.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-t-integration-evidence-20261028.md`](../../docs/evidence/w6-t-integration-evidence-20261028.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-t-review-nohyusin-1620f82-20261028.md`](../../docs/evidence/w6-t-review-nohyusin-1620f82-20261028.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-t-rpc-independent-review-20261027.md`](../../docs/evidence/w6-t-rpc-independent-review-20261027.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/evidence/w6-w7-core-demo-scope-proposal-20261030.md`](../../docs/evidence/w6-w7-core-demo-scope-proposal-20261030.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/examples/README.md`](../../docs/examples/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/README.md`](../../docs/handoffs/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W4-A-revalidation-plan.md`](../../docs/handoffs/W4-A-revalidation-plan.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W4-A-to-FT.md`](../../docs/handoffs/W4-A-to-FT.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W4-AFT-operations.md`](../../docs/handoffs/W4-AFT-operations.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W4-F-actual-host-run-request.md`](../../docs/handoffs/W4-F-actual-host-run-request.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W4-F-durable-callback-runner.md`](../../docs/handoffs/W4-F-durable-callback-runner.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W4-F-prebroadcast-durability.md`](../../docs/handoffs/W4-F-prebroadcast-durability.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W4-F-trusted-confirmation.md`](../../docs/handoffs/W4-F-trusted-confirmation.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W4-T-epoch-handoff.md`](../../docs/handoffs/W4-T-epoch-handoff.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W5-A-F-policy-contract-proposal.md`](../../docs/handoffs/W5-A-F-policy-contract-proposal.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W5-A-policy-activation-readiness.md`](../../docs/handoffs/W5-A-policy-activation-readiness.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W5-A-to-F-contract-request.md`](../../docs/handoffs/W5-A-to-F-contract-request.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W5-F-integration-after-T-merge.md`](../../docs/handoffs/W5-F-integration-after-T-merge.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W5-F-service-qa.md`](../../docs/handoffs/W5-F-service-qa.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W5-to-W6-carryover-decision-20261022.md`](../../docs/handoffs/W5-to-W6-carryover-decision-20261022.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W6-F-independent-review-b72720d.md`](../../docs/handoffs/W6-F-independent-review-b72720d.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W6-MUST-plan.md`](../../docs/handoffs/W6-MUST-plan.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W6-T-to-F-service-qa.md`](../../docs/handoffs/W6-T-to-F-service-qa.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W6-W7-five-beat-rehearsal-20261029.md`](../../docs/handoffs/W6-W7-five-beat-rehearsal-20261029.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W6-transition-handoff.md`](../../docs/handoffs/W6-transition-handoff.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/W7-core-demo-approved-handoff-20261030.md`](../../docs/handoffs/W7-core-demo-approved-handoff-20261030.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/w4-anchored-epoch-public/20261020-r01/README.md`](../../docs/handoffs/w4-anchored-epoch-public/20261020-r01/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/handoffs/w4-frozen-epoch-public/20261017-r01/README.md`](../../docs/handoffs/w4-frozen-epoch-public/20261017-r01/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/history/03-current-status-before-w4-update.md`](../../docs/history/03-current-status-before-w4-update.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/mentor-prep-session3.md`](../../docs/mentor-prep-session3.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/mentor-prep-w1.md`](../../docs/mentor-prep-w1.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/mentoring/README.md`](../../docs/mentoring/README.md) | GUIDE | 2026-10-31 (구조) | MATCH | PASS | PASS | UPDATE | P0 | f6ad522 기준; 선별 코드·상태 대조 |
| [`docs/mentoring/mentor-brief-20261031.md`](../../docs/mentoring/mentor-brief-20261031.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/mentoring/session-03-20261020-lee-jaewon.md`](../../docs/mentoring/session-03-20261020-lee-jaewon.md) | EVIDENCE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/mentoring/w5-mentoring-traceability.md`](../../docs/mentoring/w5-mentoring-traceability.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/mentoring/w7-mentoring-evidence-audit-20261030.md`](../../docs/mentoring/w7-mentoring-evidence-audit-20261030.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/model-card.md`](../../docs/model-card.md) | CURRENT | 2026-10-31 (구조) | MATCH | PASS | PASS | UPDATE | P0 | f6ad522 기준; 선별 코드·상태 대조 |
| [`docs/progress/README.md`](../../docs/progress/README.md) | HISTORY | 2026-10-31 (구조) | MATCH | PASS | PASS | PRESERVE | P0 | f6ad522 기준; 선별 코드·상태 대조 |
| [`docs/progress/W1.md`](../../docs/progress/W1.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | NEEDS_FIX | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/progress/W2-F.md`](../../docs/progress/W2-F.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/progress/W2.md`](../../docs/progress/W2.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | NEEDS_FIX | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/progress/W3-A.md`](../../docs/progress/W3-A.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/progress/W3.md`](../../docs/progress/W3.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/progress/W4-A.md`](../../docs/progress/W4-A.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/progress/W4-F-manifest-fix.md`](../../docs/progress/W4-F-manifest-fix.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/progress/W4.md`](../../docs/progress/W4.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/progress/W5-A-closeout.md`](../../docs/progress/W5-A-closeout.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/progress/W5-F.md`](../../docs/progress/W5-F.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/progress/W5-GATE5-closeout-receipt.md`](../../docs/progress/W5-GATE5-closeout-receipt.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/progress/W5-GATE5-decision-record.md`](../../docs/progress/W5-GATE5-decision-record.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/progress/W5-T-closeout.md`](../../docs/progress/W5-T-closeout.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/progress/W5-T.md`](../../docs/progress/W5-T.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/progress/W5.md`](../../docs/progress/W5.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/progress/W6-F.md`](../../docs/progress/W6-F.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/progress/W6.md`](../../docs/progress/W6.md) | HISTORY | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/research/README.md`](../../docs/research/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/research/ai-01-02-dataset-taxonomy.md`](../../docs/research/ai-01-02-dataset-taxonomy.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/research/protocol-prior-art-w1.md`](../../docs/research/protocol-prior-art-w1.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/research/tee-inference-attestation-w1.md`](../../docs/research/tee-inference-attestation-w1.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/research/w2-a-readiness.md`](../../docs/research/w2-a-readiness.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/research/w2-eda.md`](../../docs/research/w2-eda.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/research/w2-evaluation-skeleton.md`](../../docs/research/w2-evaluation-skeleton.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/research/w2-preprocessing.md`](../../docs/research/w2-preprocessing.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/research/w2-primary-dataset-decision.md`](../../docs/research/w2-primary-dataset-decision.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/research/w2-split-leakage.md`](../../docs/research/w2-split-leakage.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/research/w2-taxonomy-decision.md`](../../docs/research/w2-taxonomy-decision.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/security/sec-01-dependency-audit.md`](../../docs/security/sec-01-dependency-audit.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | NOT_VERIFIED | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/security/sec-w5-01-negative-test-audit-20261029.md`](../../docs/security/sec-w5-01-negative-test-audit-20261029.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/security/sec-w5-windows-sqlite-reopen-hold.md`](../../docs/security/sec-w5-windows-sqlite-reopen-hold.md) | CURRENT | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/spec/README.md`](../../docs/spec/README.md) | SPEC | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/spec/api-db-contract.md`](../../docs/spec/api-db-contract.md) | SPEC | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/spec/architecture-review.md`](../../docs/spec/architecture-review.md) | SPEC | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/spec/backend-architecture-w1.md`](../../docs/spec/backend-architecture-w1.md) | SPEC | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/spec/canonical-profile-v1.md`](../../docs/spec/canonical-profile-v1.md) | SPEC | 2026-10-31 (구조) | MATCH | PASS | PASS | ADD_NAV | P0 | f6ad522 기준; 선별 코드·상태 대조 |
| [`docs/spec/i4-anchor-abi.md`](../../docs/spec/i4-anchor-abi.md) | SPEC | 2026-10-31 (구조) | MATCH | PASS | PASS | ADD_NAV | P0 | f6ad522 기준; 선별 코드·상태 대조 |
| [`docs/spec/merkle-spec.md`](../../docs/spec/merkle-spec.md) | SPEC | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/spec/screen-requirements.md`](../../docs/spec/screen-requirements.md) | SPEC | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`docs/spec/trust-profile.md`](../../docs/spec/trust-profile.md) | SPEC | 2026-10-31 (구조) | MATCH | PASS | NOT_VERIFIED | ADD_NAV | P0 | f6ad522 기준; 선별 코드·상태 대조 |
| [`docs/spec/ui-audit-w1.md`](../../docs/spec/ui-audit-w1.md) | SPEC | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`frontend/README.md`](../../frontend/README.md) | GUIDE | 2026-10-31 (구조) | MATCH | PASS | PASS | UPDATE | P0 | f6ad522 기준; 선별 코드·상태 대조 |
| [`scripts/README.md`](../../scripts/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`shared/README.md`](../../shared/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`shared/protocol/README.md`](../../shared/protocol/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |
| [`tools/README.md`](../../tools/README.md) | GUIDE | 2026-10-31 (구조) | NOT_VERIFIED | PASS | PASS | PRESERVE | P2 | f6ad522 기준; 구조 자동검사만 |

## 자동 검사에서 발견한 상대 링크 후보

자동 검사 범위에서 누락·대소문자·anchor 후보는 발견되지 않았습니다. 검출되지 않는 복잡한 구문은 여전히 수동 확인이 필요합니다.
