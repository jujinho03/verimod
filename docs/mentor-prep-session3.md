# 3회차 멘토링 사전자료 — VeriMod / HTTP 451

작성일: 2026-10-17. 멘토링 일정·참석·답변·승인을 아직 기록하지 않습니다.
3회차 멘토링과 W3 주차는 다른 구분입니다. 이 자료는 W4까지의 진행을 설명합니다.

## 1분 요약

VeriMod는 AI 판정의 사후 무결성과 이의제기 이력을 사용자가 확인할 수 있게 하는
프로젝트입니다. 실제 한국어 R01 모델의 점수로 Node가 정책 판정과 영수증을 발급하고
SQLite에 저장하는 경로를 실행했습니다. 실제 Receipt 두 건을 Epoch 1로 고정했고 독립
Merkle 계산과 재개방도 일치했습니다.

아직 이 실제 Epoch를 Base Sepolia에 송신하지 않았습니다. A에는 원본 DB, T의 별도
노트북에는 승인 signer가 있어 인증 사설 Callback 채널이 필요합니다. 현재 A 운영자가
외부에 있어 Windows UAC를 직접 승인할 수 없는 것이 운영 차단입니다. GATE-4는 PARTIAL입니다.

## 멘토님이 확인할 자료

1. [W4 현황](progress/W4.md): 실행/구현/미완료 구분.
2. [실제 Frozen Epoch 원본 JSON 4개](handoffs/w4-frozen-epoch-public/20261017-r01/README.md): 해시·root·두 영수증.
3. [실제 AI/Node 실행 해설](evidence/w4-a-actual-frozen-epoch.md): Validation·정책·실패 테스트.
4. [F confirmation 검사](evidence/w4-f-confirmation/20261017/README.md): 192개 검사와 합성/RPC stub 경계.
5. [승인·최소 연결 절차](handoffs/W4-AFT-operations.md): 추가 개발 없이 마무리할 작업.

## 핵심 성과

| 영역 | 확인한 내용 |
| --- | --- |
| 모델 평가 | VALIDATION 1,255건, Macro-F1 0.6524599868976999. W3와 동일, TEST 미접근 |
| 정책 근거 | 실제 점수로 25개 후보 비교. provisional 1개로 기술 연결, 운영 승인 없음 |
| 언어 간 계약 | Python/Node parity 21/21. Manifest/threshold/action/reason/rule 일치 |
| 실제 연동 | 정상 2건 + Fail Closed 17건, 실패에서 503·신규 DB 행 0 |
| 실제 고정 | Receipt 2건, Epoch 1/count 2/version 1, 독립 Merkle·재개방 일치 |
| 신뢰된 confirmation | F 구현·192개 로컬 검사. 실제 RPC·실제 A DB CONFIRMED는 아직 아님 |

## 시연 가능한 것과 불가능한 것

지금 공개 JSON과 원본 SHA-256, canonical Receipt hash, leaf 순서와 root를 보여줄 수 있습니다.
기존 실제 모델/실패 테스트 증거를 설명할 수 있으며, 새 실행으로 표시하지 않습니다.
main의 브라우저 데모는 기존 합성 경로로 명시합니다. W4 코드/실행 자료는 고정 A/F/T
브랜치를 연결했습니다.

이번 멘토링에서 실제 체인 `VALID`, 새 epoch tx, F `CONFIRMED` 또는 정책 LOCK을
완료한 것처럼 시연하지 않습니다. 원문·salt·private DB·승인 config·키는 공개하지 않습니다.

## 확인받고 싶은 질문

1. **MVP 신뢰 경계:** Receipt/Merkle/외부 root가 보장하는 사후 무결성과 보장하지 못하는
   AI 실행·정확성·기록 완전성의 설명이 적절한가요?
2. **정책 승인:** FRR 상한 X와 사람 검토 예산 B를 어떤 사용자 위험·운영 용량에 근거해
   정해야 할까요? Validation의 `none`을 NORMAL proxy로 삼는 한계는 어떻게 제시할까요?
3. **현재 모델 품질:** Macro-F1 약 0.6525와 offensive F1 약 0.542의 실패를 MVP에서
   어떻게 설명하고 사람 검토와 연결해야 할까요? 이번에 TEST 개봉/재학습은 하지 않습니다.
4. **두 호스트 운영:** T 키와 A DB를 이동하지 않고 사설 SSH/강제 명령/durable ACK로
   연결하는 방식이 작은 팀의 데모 운영 범위에 적절한가요?
5. **확인과 재구성:** 12 confirmations, canonical receipt/event, EIP-1898 hash-bound getter,
   재검증 실패 시 public release 차단 경계가 충분히 명확한가요?
6. **GATE 종료 증빙:** 실제 동일 root의 tx/event/getter/F 확인/외부 브라우저 결과와
   조작 실패 사례 중 무엇을 최소 녹화·보고 범위로 삼는 것이 좋을까요?

## 최소 마무리 순서

관리자 UAC 접근 → ACL/비공개 백업 → 전용 계정·OpenSSH·사설 VPN → T 장치만 접근
→ status 왕복 → 승인 RPC EIP-1898 → 별도 Epoch 승인 → T 서명/F ACK/송신
→ A submitted/confirmed → 외부 브라우저 검증 → 팀 GATE 판정입니다.

멘토 답변을 받은 뒤 원문 요약·근거·담당·기한·결정 상태를 추가합니다. 아직 답변이나
진행 일정을 임의로 채우지 않습니다. W5 이후 과제·정책 LOCK은 이번 자료의 실행 범위가 아닙니다.
