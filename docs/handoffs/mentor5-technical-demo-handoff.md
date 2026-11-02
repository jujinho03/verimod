# Mentor 5 — 기술 시연 인계

2026-11-02 작성. 기준 main은 `7a6aa2ad27ad58d0454b39f28a07d069ac4e93b1`이며 개발 브랜치의 최종 실행 SHA·CI는 [개발 결과](../mentoring/mentor5-development-implementation.md)를 따른다. 이 문서는 기술적 근거 및 현장 확인 사항만 기록하며 시연 실행 기록이 아니다.

## W4와 W7의 관계

- **HISTORICAL W4:** 2026-10-16의 영수증 두 건을 2026-10-20 Base Sepolia Epoch 1에 등록한 과거 실증이다. [원본 공개 증거](w4-anchored-epoch-public/20261020-r01/README.md). `receipt-0`과 `receipt-1`의 본문 hash와 파일 digest를 이번에 재계산했다.
- 두 W4 영수증의 모델 manifest hash는 `0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1`, 정책 manifest hash는 `0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e`이다. 저장소의 현재 W4 모델·provisional 정책 manifest를 재계산한 값 및 백엔드 고정 상수와 일치한다. [검사 근거](../evidence/mentor5-model-policy-hash-verification.md).
- **W7 신규 LIVE 발급:** 기존 PR #42 담당자 보고는 `HTTP 201 / PENDING_ANCHOR`, proof·anchor null 및 모델 중단 시 `503`·미발급이다. 그 실행의 실제 receipt는 이번에 확보하지 못해 W4와의 동적 해시 비교는 **NOT_VERIFIED**다. W7 신규 영수증이 W4 Epoch 1에 들어간 것은 아니다.
- 해시가 일치하더라도 특정 모델이 실제로 실행됐거나 AI 판정이 정확하다는 암호학적 증명은 아니다. W4 정책은 provisional이며 S1 `PENDING_APPROVAL`, 모델/정책 LOCK `NOT_EXECUTED`, TEST `SEALED`를 유지한다.

## 검증 화면과 예상 결과

화면 단계는 실제 코드의 순서에 맞춰 **형식 → 로컬 본문 해시 → 로컬 신뢰 앵커 → 선택한 원장의 epoch/root 조회 → 포함 증명 → L2 확인 수**로 표시하도록 변경했다. 조회가 실패하면 포함 증명은 실행되지 않으며 `SKIPPED`로 표시한다. 선택한 원장이 합성인지 공개 RPC인지 화면의 모드와 함께 확인한다. [검증 순서와 회귀](../evidence/mentor5-verification-order-regression.md).

| 입력과 상황 | 기대되는 상태 | 의미 |
| --- | --- | --- |
| W4 원본, 승인된 공개 RPC 조회와 모든 검증 성공 | `VALID` | 해당 실행에서 제공된 영수증과 공개 commitment 일치 |
| 본문만 변경하고 기존 receipt hash 유지 | `HASH_MISMATCH` | 로컬에서 결정; RPC가 장애여도 동일 |
| 본문과 hash를 함께 변경하고 기존 proof 유지, 정상 RPC | `INVALID_PROOF` | 조회한 root에 대한 포함 불일치 |
| 본문과 hash를 함께 변경하거나 정상 원본을 사용하고 RPC가 장애 | `RPC_UNAVAILABLE` | RPC 조회가 되지 않아 포함 증명 미실행; 변조 여부를 판정한 결과가 아님 |
| proof와 anchor 없음 | `PENDING_ANCHOR` | 아직 공개 anchor를 확인할 수 없음 |
| 미승인 체인 또는 컨트랙트 | `UNTRUSTED_ANCHOR` | 승인 profile과 불일치 |

변조는 별도 사본에서 수행하고 W4 원본 파일은 보존한다. 단위 테스트의 mock 원장 결과와 현재 공개 RPC 실측을 구분한다. 장애 복구를 주장할 때는 동일 원본·profile을 다시 검증하고 실제 결과를 기록한다. Playwright `route.abort('internetdisconnected')`는 통제된 브라우저 요청 차단이며 PC 인터넷 회선의 물리적 단절이 아니다. [장애·복구 검토](../evidence/mentor5-failure-recovery-verification.md).

## RPC 지연과 대체 경로

2026-11-02 01:39–01:40 UTC, 수정 전 RPC 코드와 W4 receipt-0을 사용한 읽기 전용 공개 RPC **1회**는 `VALID`였고 총 **28,528 ms**, RPC **222회**(`eth_getLogs` 106회), HTTP 429·413 및 timeout은 각각 0회였다. 개별 요청 평균 124.48 ms, 중앙값 104 ms, p95 245 ms, 최대 1,679 ms다. 단일 전체 검증 측정으로 성공률이나 지연 분포를 추정할 수 없다. 10회 연속 성공을 입증하지 못했으며 과거 2026-10-29 수치와 합산하지 않는다. [실측 기준](../evidence/mentor5-rpc-baseline.md).

별도 읽기 전용 실행에서 본문과 해시를 변경한 사본은 기존 proof에 대해 `INVALID_PROOF`였으며 28,353 ms, 222회 요청이 걸렸다. 이는 최적화 후 측정이 아니다. [변조 실측](../evidence/mentor5-rpc-invalid-proof.md).

24초는 현장의 **수동 대체 경로 판단 기준**이다. 개별 RPC 요청 timeout은 5초지만 전체 검증 24초 deadline이나 실제 요청 취소 기능이 구현된 것은 아니다. 24초 이내 성공을 보장하지 않는다. 시간이 지났거나 실패하면 현재 결과와 출처를 정확히 남기고 사용자가 W4 과거 공개 증거를 선택할 수 있다. 저장된 과거 증거를 이번 LIVE 성공으로 표시하지 않는다. 합성 모드는 사용자 선택과 출처 표시가 필요하며 공개 RPC 성공으로 자동 대체하지 않는다.

거래 locator 중심의 짧은 조회는 기존 전체 구간 중복 이벤트 탐지와 보안 의미가 같지 않아 이번에 기존 엄격 검증을 대체하지 않았다. 성능 개선율 및 최적화 후 실측은 없다. [보안 및 후보 분석](../evidence/mentor5-rpc-optimization.md).

## 실행 전 및 현장 확인

1. 실제 실행 브랜치·SHA와 해당 CI를 기록한다. 실행용 프런트엔드, Node 및 승인 profile·공개 RPC 설정은 [실행 안내](../08-submission-guide.md)의 현재 설정을 확인한다. Base Sepolia chain ID는 `84532`, 기준은 12 L2 confirmations이며 L1 finality와 같지 않다.
2. 실제 R01 추론을 사용할 경우 승인된 로컬 가중치·tokenizer와 Python 환경, `/healthz` 준비 상태 및 backend 연결을 사전에 확인한다. 모델 가중치·원본 DB는 clone에 포함된다고 가정하지 않으며 원문·salt·키를 공개하지 않는다.
3. W4 원본을 불러와 승인 profile과 실제 모드, 검증 실행 시각·소요 시간·상태를 기록한다. RPC 장애 및 복구는 매 현장에서 재확인한다. `RPC_UNAVAILABLE`을 `INVALID_PROOF`나 `VALID`로 바꾸지 않는다.
4. 기존 W6 Engineering Exit는 `PARTIAL`, BASE 연속 10회 기존 보고는 `NOT_MET`, 실제 Hardhat LOCAL은 `NOT_VERIFIED`, 물리 모바일은 `NOT_EXECUTED`다. 새로운 증거로 과거 시점 기록을 소급 수정하지 않는다.

검증의 범위는 발급된 영수증의 무결성과 공개 commitment 대조다. 발급자 최초 진실성, 전체 사건 누락 여부, 실제 모델 실행 및 RPC 응답의 독립적 진실성은 별도 한계가 있다. [신뢰 한계](../security/mentor5-trust-limitations.md).
