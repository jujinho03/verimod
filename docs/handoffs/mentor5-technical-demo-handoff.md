# Mentor 5 — 기술 시연 인계

## 1. 목적과 검증 기준

이 문서는 VeriMod의 검증 화면과 실제 실행 근거를 기술 담당자에게 인계한다. **화면 코드 점검 기준:** 2026-11-03 확인 main `91477e8d652e903075324c2903b2f2f44835353f`. 2026-11-02의 W7 발급 및 RPC 수치는 각각 당시 실행 SHA·환경을 유지한다. 이후 코드나 CI가 달라질 수 있으므로 시연 전 다시 확인한다. 이 문서 자체는 본선 현장의 실행 기록이 아니다. [PR #45](https://github.com/jujinho03/verimod/pull/45)의 작업 경과와 과거 상태는 [개발 기록](../mentoring/mentor5-development-implementation.md)에 보존한다.

## 2. 현재 구현과 확인된 실행

- **과거 W4:** 2026-10-20 Base Sepolia Epoch 1에 공개 Receipt 2건을 등록했다. [W4 공개 증거](w4-anchored-epoch-public/20261020-r01/README.md)는 당시 실행이다.
- **신규 W7 경로:** 2026-11-02 기존 `frontend/`의 `/check`에서 격리 DB를 사용해 브라우저→Node→실제 R01 발급 2건을 확인했다. 신규 Receipt는 모두 `PENDING_ANCHOR`이고 proof·anchor는 null이었다. 모델 중단 시 `503 / INFERENCE_UNAVAILABLE` 및 해당 DB의 Receipt 수 `1→1`, 재기동 후 발급 복구와 `1→2`가 기록됐다. 실행 당시 기준 HEAD는 `e540c7a`였고 검증기 후속 변경으로 worktree가 dirty였다. 발급 관련 소스는 해당 HEAD와 일치했다고 기록됐지만 현재 Redesign 전체를 그때 재현한 것은 아니다. Python `/healthz` 200·ready는 당시 수행자의 수동 관측이며 원시 응답의 독립 확인은 `NOT_VERIFIED`다. [실행 증거](../evidence/mentor5-w7-live-receipt-verification.md).
- 신규 W7 Receipt가 W4 Epoch에 포함되거나 공개 체인에 등록됐다는 근거는 없다. 두 사례는 각각 별도 실행이다. PR #42 당시의 원본 Receipt를 이번에 소급 검증한 것도 아니다.
- **화면 구분:** 저장소 루트의 현재 기본 앱은 Redesign이며, 이전 검증 화면은 별도 `frontend/` 앱으로 보존돼 있다. 두 화면은 같은 검증 코어를 사용하지만 24초 안내·요청 취소는 기존 `frontend/`에서 확인한 기능이다. 현재 Redesign의 동일 UX는 아래 §5와 같이 별도 확인이 필요하다.

## 3. W4·W7 모델·정책 해시

| 비교 출처 | Model Manifest Hash | Policy Manifest Hash |
| --- | --- | --- |
| W4 공개 Receipt 0·1 | `0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1` | `0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e` |
| 신규 W7 최초·복구 발급 | 위와 일치 | 위와 일치 |
| 저장소 manifest 재계산 및 Backend 고정 상수 | 위와 일치 | 위와 일치 |

실행별 값과 원본의 해시 재계산은 [신규 발급 검증](../evidence/mentor5-w7-live-receipt-verification.md)과 [모델·정책 해시 검토](../evidence/mentor5-model-policy-hash-verification.md)를 따른다. 이 일치는 같은 manifest 식별값을 사용했다는 근거이며, 특정 모델이 실제 실행됐다는 암호학적 증명이나 AI 판정의 정확성 보증은 아니다. R01 실행은 별도의 로컬 코드·실행 관측이다. W4 정책은 provisional이며 S1 `PENDING_APPROVAL`, Model/Policy LOCK `NOT_EXECUTED`, TEST `SEALED`를 유지한다.

## 4. 검증 순서와 상태 코드

검증 순서는 **스키마 → 로컬 본문 해시 → 신뢰 앵커 → 선택한 원장 epoch/root 조회 → Merkle 포함 증명 → 확인 수**다. 원장 조회에 실패하면 포함 증명은 `SKIPPED`이며, 선택한 원장이 공개 RPC인지 합성 원장인지 화면의 모드와 함께 확인한다. [검증 순서와 회귀](../evidence/mentor5-verification-order-regression.md).

| 입력·상황 | 결과 | 해석 |
| --- | --- | --- |
| W4 원본과 승인 RPC가 모든 검증을 통과 | `VALID` | 해당 실행에서 Receipt와 공개 commitment가 일치 |
| 본문만 변경하고 기존 hash 유지 | `HASH_MISMATCH` | RPC 가용성과 무관한 로컬 해시 불일치 |
| 본문·hash 변경, 기존 proof 유지, 정상 원장 조회 | `INVALID_PROOF` | 조회한 root에 대한 포함 불일치 |
| 정상 원본 또는 본문·hash 변경본의 RPC 조회 실패 | `RPC_UNAVAILABLE` | 포함 증명 미실행; 변조 여부 판정 아님 |
| proof·anchor 없는 신규 Receipt | `PENDING_ANCHOR` | 아직 공개 anchor에 대한 포함을 확인할 수 없음 |
| 미승인 체인·컨트랙트 | `UNTRUSTED_ANCHOR` | 검증기의 승인 profile과 불일치 |
| 기존 `frontend/`에서 사용자가 검증 중단 | 결과 없음 | 중단한 실행은 성공·변조·앵커 부재로 판정하지 않음; 기본 Redesign에 동일한 버튼이 있다는 뜻은 아님 |

변조 실험은 W4 원본이 아닌 사본에서 수행한다. 통제된 원장·mock 테스트, 공개 RPC 실행과 이력 자료의 결과를 구분한다.

## 5. 24초 안내와 취소 — 화면별 차이

**기존 `frontend/` 앱:** PR #45의 [useVerify](../../frontend/src/features/useVerify.ts)와 [VerifyPage](../../frontend/src/pages/VerifyPage.tsx)는 24초가 지나면 지연 안내와 **계속 기다리기**, **검증 중단**, **기존 공개 실증 자료 확인** 선택지를 제공한다. 24초는 soft deadline이므로 강제 실패가 아니다. 사용자가 중단하거나 입력·profile을 바꾸거나 페이지를 떠나면 이전 실행을 무효화하고 RPC fetch에 취소 신호를 전달하도록 구현돼 있다. Chromium native fetch와 로컬 지연 HTTP 서버 시험에서 요청 중단 시 서버 측 연결 종료가 확인됐다. 이는 공개 RPC의 실제 회선 장애 실측이 아니다. [장애·복구 기록](../evidence/mentor5-failure-recovery-verification.md).

**현재 기본 Redesign 앱:** [ReceiptPage](../../src/pages/ReceiptPage.tsx)는 [runVerification](../../src/verify/verifier.ts)을 직접 호출한다. 기준 코드에서 기존 `useVerify`의 24초 안내·검증 중단 버튼 및 RPC 취소 signal 전파는 연결돼 있지 않다. 입력·영수증 변경 시 늦은 결과가 남을 가능성은 코드 검토 사항이며, 경합 재현은 `NOT_VERIFIED`다. 기존 `frontend/`의 테스트 통과를 이 화면의 동작 확인으로 사용하지 않는다. 두 화면 모두 개별 RPC 요청의 5초 timeout과 24초 안내는 서로 다른 개념이다.

시연에서 24초는 **발표자가 수동으로 과거 자료로 전환할지 판단하는 기준**으로 사용할 수 있다. 기본 Redesign에 전환·취소 버튼이 있거나 진행 중 요청이 실제 중단된다고 가정하지 않는다. [W4 공개 자료](w4-anchored-epoch-public/20261020-r01/README.md)를 제시할 때는 2026-10-20의 역사적 검증 기록이라고 밝힌다. 과거 자료나 합성 원장의 결과를 현재 공개 RPC의 `VALID`로 표시하지 않는다.

## 6. 공개 RPC 실측

| 실행 | 시각 UTC | 결과 | 소요 | RPC 요청 |
| --- | --- | --- | ---: | ---: |
| W4 원본 기준 reader | 2026-11-02 01:39–01:40 | `VALID` 1회 | 28,528ms | 222 (`eth_getLogs` 106) |
| W4 원본 후속 reader | 2026-11-02 02:33–02:34 | `VALID` 1회 | 22,910ms | 224 (`eth_getLogs` 107) |
| 본문·hash 변경 사본, 기존 proof | 2026-11-02 01:47 | `INVALID_PROOF` 1회 | 28,353ms | 222 |

각 측정은 읽기 전용 단일 실행이며 각각 HTTP 429·413·timeout은 0건이었다. 측정 시점과 블록 범위가 달라 최적화 전후 개선율로 해석하지 않는다. [기준 실측](../evidence/mentor5-rpc-baseline.md), [후속 실측](../evidence/mentor5-followup-rpc-valid.md), [변조 실측](../evidence/mentor5-rpc-invalid-proof.md). 24초 이내 성공과 10회 연속 성공은 보장되지 않는다.

## 7. 장애 시 상태 구분

`RPC_UNAVAILABLE`은 원장 조회를 완료하지 못한 상태다. 이를 `INVALID_PROOF`나 `VALID`로 바꾸지 않는다. 본문만 변경해 기존 hash가 일치하지 않으면 원장 조회 전에 `HASH_MISMATCH`가 결정된다. 본문과 hash를 함께 변경한 사례는 root를 조회한 뒤 기존 proof와 대조해야 하므로, RPC 장애 중에는 변조 여부를 판단하지 않는다.

Playwright `route.abort('internetdisconnected')`는 브라우저 요청의 통제된 차단이며 PC 회선의 물리적 단절과 다르다. 실제 공개 RPC 장애 이후 같은 원본의 복구 `VALID`는 별도 실측이 필요하다. [장애·복구 기록](../evidence/mentor5-failure-recovery-verification.md).

## 8. 실행 환경과 현장 점검

1. 실제 코드 SHA·CI와 승인된 Base Sepolia profile을 확인한다. chain ID는 `84532`, 기준은 12 L2 confirmations이며 L1 finality와 같지 않다. profile 설정과 실행 방법은 [실행 안내](../08-submission-guide.md)를 따른다.
2. R01 발급을 사용할 경우 고정 로컬 가중치·tokenizer와 Python 환경, `/healthz`, Node Backend 연결 및 별도 비운영 DB를 확인한다. 2026-11-02 발급 근거는 기존 `frontend/` 앱의 실행이며 현재 기본 Redesign이나 현장 환경의 재현 결과가 아니다. 당시 health 성공은 수행자 수동 관측이고 원시 응답 독립 확인은 `NOT_VERIFIED`다. clone에 비공개 모델이나 과거 원본 DB가 포함된다고 가정하지 않는다.
3. 실행할 입력의 출처와 모드를 확인하고 W4 원본 검증의 결과·시각·소요 시간을 새로 기록한다. 무해한 합성 입력을 사용하며 원문·salt·키·DB를 공개하지 않는다.
4. RPC 장애나 지연이 발생하면 실제 표시된 결과를 기록한다. 과거 공개 증거를 선택하면 그 출처와 현재 LIVE 결과의 부재를 구분한다.

## 9. 아직 검증되지 않은 사항과 신뢰 한계

현재 기본 Redesign에서 실제 R01 재발급, 24초 안내·취소와 stale 경합 회귀, 실제 공개 RPC 장애 후 복구, BASE 연속 10회 성공 및 물리 모바일은 이번 근거로 입증되지 않았다. 기존 W6 Engineering Exit는 `PARTIAL`, BASE 연속 10회 기존 보고는 `NOT_MET`, 실제 Hardhat LOCAL은 `NOT_VERIFIED`, 물리 모바일은 `NOT_EXECUTED`다. 현재 RPC reader는 공급자가 반환한 로그 필터 결과에 의존하며 두 endpoint는 독립 합의가 아닌 장애 대체 경로다. 전체 로그 검색을 제거하는 최적화는 채택하지 않았다. [RPC 보안 분석](../evidence/mentor5-rpc-optimization.md).

검증 범위는 발급된 Receipt의 무결성과 공개 commitment의 일치다. 발급자의 최초 정직성, 플랫폼 전체 사건의 누락 여부, AI 판정의 정확성 및 RPC 응답의 독립적 진실성은 증명하지 않는다. [신뢰 한계](../security/mentor5-trust-limitations.md).

## 10. 기술 근거 및 GitHub

- [프로젝트 README](../../README.md) · [실행 안내](../08-submission-guide.md)
- [PR #45 및 최신 CI](https://github.com/jujinho03/verimod/pull/45) · [개발·검증 기록](../mentoring/mentor5-development-implementation.md)
- [W4 공개 증거](w4-anchored-epoch-public/20261020-r01/README.md) · [실제 R01 신규 발급](../evidence/mentor5-w7-live-receipt-verification.md) · [공개 RPC 후속 실측](../evidence/mentor5-followup-rpc-valid.md)
- [A 담당 주장–증거 매트릭스와 오프라인 검증 범위](../evidence/a-scope-claim-evidence-matrix-20261103.md)
