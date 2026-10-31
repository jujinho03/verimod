# VeriMod — 5회차 멘토링 한눈에 보기

> **대상:** 멘토·팀원 · **목적:** W7 데모의 구현 범위와 남은 기술 질문을 함께 검토합니다.
>
> **기준:** 2026-10-31 확인 main `f6ad522513dcb198d520c70f98c1cc5e98748f51`. [GitHub main CI 41178415036](https://github.com/jujinho03/verimod/actions/runs/41178415036)은 Frontend·Backend·Contracts 성공입니다. CI는 실시간 RPC 성공이나 발표 리허설을 보증하지 않습니다.

## 프로젝트와 검증 범위

**VeriMod — User-Verifiable AI Moderation Protocol**은 판정 기록을 사용자가 직접 검증하도록 돕는 프로젝트입니다. AI는 콘텐츠를 분류하고 점수를 제공하며, 블록체인은 발급된 Decision Receipt의 commitment에 대한 외부 기준점을 제공합니다.

해시·Merkle proof·앵커 검증은 **발급된 기록의 무결성**을 확인합니다. AI 판정의 정답성, 실제 모델 실행 여부, 원문 진실성 또는 플랫폼 기록 전체의 완전성을 증명하지 않습니다. 원문·salt·민감정보는 온체인에 올리지 않습니다.

## 확인된 근거와 발표 경계

| 구분 | 확인 가능한 내용 | 발표 시 주의할 점 |
| --- | --- | --- |
| W4 공개 앵커 | 2026-10-20 Epoch 1을 Base Sepolia에 등록한 [공개 증거](../handoffs/w4-anchored-epoch-public/20261020-r01/README.md)가 있습니다. | 과거 공개 Receipt의 검증입니다. L2 확인 수는 L1 finality 보장이 아닙니다. |
| R01 AI | [AI-19](../evidence/w6-a-ai19-offline/ai19-final-assessment.md)에 과거 물리 오프라인 추론 1회가 기록돼 있습니다. [Data Card](../data-card.md)와 [Model Card](../model-card.md)에 데이터·평가 한계가 있습니다. | 새 추론은 당시 AI-19 결과 및 과거 W4 Receipt와 별개입니다. 점수는 `UNCALIBRATED`입니다. |
| 검증 화면 | [실행 안내](../08-submission-guide.md)에서 W4 공개 샘플과 본문 변조, rehash 변조, RPC 실패 경로를 설명합니다. | `VALID`, `HASH_MISMATCH`, `INVALID_PROOF`, `RPC_UNAVAILABLE`은 구분합니다. LIVE 실패를 합성 성공으로 바꾸지 않습니다. |
| 통합·보안 | PR [#41](https://github.com/jujinho03/verimod/pull/41) 데모 개선과 [#42](https://github.com/jujinho03/verimod/pull/42) Backend 의존성 패치가 기준 main에 포함됐습니다. | 이 기준 SHA의 CI 결과이며 모든 보안 위험이나 공개 RPC 가용성의 보장은 아닙니다. |
| 멘토링 기록 | [DOC-09 / OPS-04 감사](w7-mentoring-evidence-audit-20261030.md)에 1~4회 권고와 근거 수준이 있습니다. | 원문 확인, 팀 결정, 코드·실측, CNU MATE 제출·접수는 각각 따로 확인합니다. |

## W7 데모에서 보여줄 범위

팀장 결정 [D-W6A-20261030-01](../evidence/w6-w7-core-demo-scope-proposal-20261030.md)의 Option B는 실제 R01 추론, 기존 W4 공개 Receipt 검증, 두 변조 사례, RPC 장애·복구, 증거 설명을 포함합니다. 실제 동작과 모드는 발표 세션에서 다시 확인합니다.

신규 연구 정책 적용, 새 Manifest parity·Runtime Binding 완성, LOCK·TEST, 새 Epoch 발급은 이 데모의 필수 범위에서 제외하고 미완료 상태로 이월합니다. 실제 Hardhat LOCAL과 물리 모바일은 필수 데모에서 제외됐으며 각각 `NOT_VERIFIED`, `NOT_EXECUTED`입니다. 신규 추론이 기존 W4 Receipt에 앵커된 하나의 새 E2E 거래라고 설명하지 않습니다.

## 남은 한계와 멘토에게 여쭐 질문

| 주제 | 현재 기록된 한계 | 검토 질문 |
| --- | --- | --- |
| 공개 RPC | 이전 수정 후보 보고는 8 VALID / 2 RPC_UNAVAILABLE, 연속 10회 성공 `NOT_MET`. Primary 429와 backup 413·범위 제한이 있었습니다. | LIVE 실패 시 합성 전환을 관객이 혼동하지 않도록 어떤 설명이 적절한가요? |
| 신뢰 검증 | chain ID 확인과 데이터 요청 사이 TOCTOU, 독립 canonical block 조회 및 T 전문 리뷰 공백이 남습니다. | 본선 PoC에 필요한 위험 설명과 이후 우선 보완은 무엇인가요? |
| AI·정책 | S1 `PENDING_APPROVAL`, LOCK `NOT_EXECUTED`, TEST `SEALED`; 모델 점수와 정책 위험은 별개입니다. | UNCALIBRATED 점수와 사람 검토의 한계를 어떻게 전달하면 좋을까요? |
| 증거·시연 | DOC-09 `PARTIAL`, OPS-04 `NOT_VERIFIED`. 마지막 기록 기준 실제 480초 공동 리허설과 전체 녹화가 확인되지 않았습니다. | 데모 증거와 멘토링 제출·접수 기록의 최소 확인 수준은 무엇인가요? |

W6는 수용된 위험을 동반해 조건부 종료됐고, 원래 Engineering Exit와 E6은 `PARTIAL`입니다. 이 문서는 새로운 테스트·리허설·승인을 기록하지 않습니다. 발표 직전 [최신 실행 안내](../08-submission-guide.md)와 [5-Beat 계획](../handoffs/W6-W7-five-beat-rehearsal-20261029.md)의 실제 실행 결과를 별도로 확인하세요.

[멘토링 자료 안내](README.md) · [전체 문서 안내](../README.md) · [결정 기록](../02-decision-register.md)
