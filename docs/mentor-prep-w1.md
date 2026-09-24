# VeriMod — 1회차 멘토링 사전자료

## DOC-04 상태

2026-09-24 · **W1 사전자료 / DRAFT**. 사용자 확인에 따라 **멘토 수요조사 제출 완료**를 기록한다.
희망 1순위: **임명환 원장** · 희망 2순위: **금창섭 박사** · **실제 배정 멘토: 미확정**.

## 1. 프로젝트 한 줄 정의

VeriMod는 AI 콘텐츠 모더레이션 판정에 대해 이용자가 사후 변경 여부를 독립적으로 검증할 수 있는 **Decision Receipt / 투명성 프로토콜**이다. **Decide. Prove. Appeal.**

## 2. 현재 W1 위치

AI-01 dataset research와 AI-02 taxonomy mapping feasibility는 Command Center 검토 완료(PASS). AI-03 [I1 contract draft](04-interface-contract-draft.md)는 [PR #6](https://github.com/jujinho03/verimod/pull/6)으로 main 반영 완료다. **Primary dataset 미선택 · 최종 taxonomy 미확정 · 모델 학습 미시작 · TEST 미열람 · threshold 미확정**. 이는 연구·초안의 W1 상태이며 실제 AI·testnet 등 향후 구현 완료를 뜻하지 않는다.

## 3. 멘토링 핵심 목적

본선까지 약 7주 안에 실제 동작하는 MVP를 완성하도록 **MUST / SHOULD / WON’T** 범위를 확정하고, 기술 범위를 줄여도 핵심 가치가 유지되는지 검토받는다. 제출한 검토 대상은 **실제 AI 판정, Decision Receipt 발급, Merkle batching, EVM testnet anchoring, 이용자 독립 검증, APPEAL / REVIEW lifecycle**이다. 아래 선택지는 멘토 검토용이며 최종 결정이 아니다.

## 4. 결정 질문 3개

### Q1. MVP에서 어디까지 MUST인가?

- **A:** AI 판정 → Decision Receipt → Merkle batching → testnet anchoring → independent verification을 core MUST, APPEAL / REVIEW는 SHOULD로 둔다.
- **B:** 위 core flow와 APPEAL / REVIEW lifecycle까지 모두 MUST로 둔다.
- **C:** 시간 위험을 줄이기 위해 blockchain 또는 lifecycle 일부를 더 축소한다.

**잠정 판단:** A와 B 사이 검토가 필요하다. AI 판정 → Receipt → Merkle → external anchor → independent verification의 핵심 검증 loop는 MVP에서 제거하지 않는 방향이다. 본선 평가의 최소 구현 범위와 APPEAL / REVIEW의 MUST 여부를 멘토에게 확인한다.

### Q2. 비전공 심사위원에게 무엇을 핵심 가치로 보여줄 것인가?

- **A:** 블록체인 기술 자체를 전면에 둔다.
- **B:** “AI 판정 기록을 이용자가 독립적으로 검증한다”는 사용자 문제와 검증 가능성을 전면에 둔다.
- **C:** AI moderation 정확도를 전면에 둔다.

**잠정 판단: B.** 보장 범위는 AI 판정의 정답성 증명이 아니라 제공받은 기록의 무결성과 lifecycle linkage 검증이다. blockchain은 외부 기준점으로 설명한다. 기존 감사로그·전자서명·투명성 로그 대비 VeriMod가 왜 필요한지도 이 가치제안의 검토에 포함한다.

### Q3. 발표 스토리는 어떤 순서가 가장 설득력 있는가?

- **A:** AI / blockchain architecture를 먼저 설명한다.
- **B:** 이용자가 삭제·차단된 상황 → 왜 판정 근거를 믿기 어려운가 → Decision Receipt → 변조 검증 → appeal/review 순으로 설명한다.
- **C:** 스마트컨트랙트와 Merkle 구조를 먼저 설명한다.

**잠정 판단: B.** 기술 구조는 사용자 문제를 해결하는 근거로 뒤에서 제시한다. 스토리에 appeal/review를 포함하는 것이 Q1의 본선 MUST 여부를 확정하는 것은 아니다.

## 5. 멘토링 후 확정할 것

아래는 제출한 희망 결과이며 **아직 미확정**이다.

1. 본선 MUST / SHOULD / WON’T 기능
2. 삭제 또는 후순위 기능 최소 1개
3. 한 문장 가치제안
4. 7주 개발 우선순위

## 6. 보장 범위

**검증하려는 것:** 제공받은 Decision Receipt의 사후 변경 여부, 제공받은 lifecycle의 연결 규칙.
**현재 보증하지 않는 것:** AI 판정 자체의 정답성, 실제 모델 실행 여부, 플랫폼이 처음부터 거짓 score를 기록했는지, 숨겨진 기록의 completeness / freshness. Blockchain이 AI 판정의 정답성을 증명한다고 주장하지 않는다.
