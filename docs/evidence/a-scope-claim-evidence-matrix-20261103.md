# VeriMod A-Scope — 본선 주장과 증거 대조

기준: 2026-11-03 확인 원본 main `91477e8d652e903075324c2903b2f2f44835353f`. 이 문서의 점검 시점과 아래에 인용한 실행의 시점·코드 SHA는 서로 다르다. 이 문서 작성은 새로운 모델 추론, RPC 검증, DB 조회 또는 체인 전송이 아니다. 본선 장비에서의 실행 결과도 아니다.

상태: **VERIFIED**는 명시한 범위의 기존 실행 증거 또는 별도 기술한 오프라인 계산을 뜻한다. **IMPLEMENTED**는 코드 존재를 뜻하며 실행 성공을 보증하지 않는다. **NOT_VERIFIED**는 해당 근거가 부족하거나 재실행하지 않은 상태다. **BLOCKED**는 승인 또는 선행조건이 필요한 상태다. 성공한 과거 실행을 현재 실행으로, mock·합성 결과를 실제 결과로 바꾸지 않는다.

## 고정 사실과 증거의 한계

- [Model Card](../model-card.md)·[Data Card](../data-card.md): R01은 한국어 BEEP! Korean HateSpeech의 `TRAIN 5,857`, `VALIDATION 1,255`를 사용했다. VALIDATION Macro-F1은 `0.6524599868976999`이며 같은 VALIDATION으로 체크포인트를 선택하고 성능도 보고해 낙관적 선택 편향이 가능하다. 단일 seed·split, 연예 뉴스 댓글 중심의 도메인 한계가 있다. TEST는 봉인 전 집계상 1,255건이며 **SEALED**, TEST 성능은 없다. `scores_ppm`은 **UNCALIBRATED**다.
- W4 정책은 `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`인 테스트넷 실증용이며 운영 정책이 아니다. S1은 별도 연구 후보 `PENDING_APPROVAL`; Model/Policy LOCK은 `NOT_EXECUTED`. W4 후보의 VALIDATION FRR proxy 91/547(16.64%)와 S1 후보 32/547(5.85%)는 서로 다른 정책·같은 validation에 대한 proxy이며 운영 성능 보장이 아니다.
- [W4 공개 증거](../handoffs/w4-anchored-epoch-public/20261020-r01/README.md): 2026-10-20 Base Sepolia Epoch 1, R01 기반 Receipt 2건, 블록 `48358039`, 공개 거래 [`0x175b3c1ad237a087984b17b47c0343fedfd314a5eb1c34ba7a22511b5cc67286`](https://sepolia.basescan.org/tx/0x175b3c1ad237a087984b17b47c0343fedfd314a5eb1c34ba7a22511b5cc67286). GATE-4는 당시 기술 조건 14/14 PASS다. 해당 거래의 실제 브라우저 검증은 그 시점의 기록이다.
- [W7 신규 발급 기록](mentor5-w7-live-receipt-verification.md): 2026-11-02 02:31–02:33 UTC, 기존 `frontend/`의 브라우저 → Node → 실제 R01 경로에서 HTTP 201 두 건. 발급 시 두 Receipt는 `PENDING_ANCHOR`, proof·anchor는 null이었다. 모델 중단 시 HTTP 503 / `INFERENCE_UNAVAILABLE`과 격리 DB Receipt 수 `1→1`, 재기동 후 `1→2`가 기록됐다. 기준 HEAD `e540c7a1e26e445f64cda9f676059479b2c4830f`에 검증기 후속 미커밋 변경이 있었으며 실행 관련 backend·AI·기존 frontend 파일은 기준과 동일했다고 기록돼 있다. 당시 `/healthz` 200은 실행자 수동 관측이고 원시 응답의 독립 확인은 **NOT_VERIFIED**다. 현재 Redesign 또는 본선 환경에서 재실행한 증거가 아니다.
- W4 공개 두 Receipt와 W7 신규 두 Receipt가 같은 Model Manifest Hash `0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1`, Policy Manifest Hash `0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e`를 갖는다는 결과는 위 W7의 **과거 실행 기록**이다. 해시 동일성은 신규 Receipt가 W4 Epoch에 속하거나 특정 모델 실행·AI 판단의 정확성이 암호학적으로 증명됐다는 뜻이 아니다.
- 2026-11-03 읽기 전용 감사에서 기준 `91477e8` Git blob의 W4 공개 Receipt 2건에 대해 파일 SHA·본문 hash·manifest hash·2-leaf Merkle root 및 정적 사본 blob을 대조했다. 이는 해당 fixture의 오프라인 계산이며 현재 공개 RPC 조회나 범용 canonicalization 증명은 아니다.
- 이 후속 작업의 Windows `core.autocrlf=true` 신규 worktree에서는 정적 사본에만 CRLF가 적용돼 Git blob이 같아도 작업 파일 바이트가 달랐다. [정적 사본의 Git 속성](../../public/evidence/.gitattributes)으로 두 파일의 체크아웃 변환을 방지하고 이 별도 worktree의 사본을 Git 원본 바이트로 복원했다. W4 원본 디렉터리와 Git에 저장된 사본 내용은 바꾸지 않았다. 이후 [오프라인 검사](mentor5-hash-check.py)는 W4 원본·manifest와 정적 사본 2건의 바이트 일치를 확인했으며, [회귀 테스트](test_mentor5_hash_check.py)는 정상·사본 변조·사본 누락·원본과 사본 동시 변조·Python 최적화 모드 5건을 통과했다. W7 실제 Receipt는 이 검사에 입력되지 않았고 재검증 상태는 `NOT_VERIFIED`다. 이 작업은 이전 main의 CI 결과에 포함되지 않는다.

## 주장–증거 매트릭스

| 주장·구현 | 출처 | 상태와 사용 가능한 표현 | 사용하면 안 되는 표현 / 잔여 위험 | 담당 |
| --- | --- | --- | --- | --- |
| 실제 R01 추론과 발급 | [W7 기록](mentor5-w7-live-receipt-verification.md), [AI 서비스](../../ai/src/verimod_ai/inference/service.py) | **VERIFIED**, 11/2 격리 실행 범위: “실제 R01로 신규 판정서를 발급한 실행이 있습니다.” | “현재 Redesign·현장에서 항상 성공합니다.” 새 환경 재확인 필요 | A·F |
| 점수와 정책 | [Model Card](../model-card.md), [W4 provisional manifest](../../backend/config/w4-provisional.policy_manifest.json) | **VERIFIED**, validation 및 코드 범위: “보정 전 위험 신호와 시험 정책으로 triage합니다.” | “유해 확률”, “운영 정책 승인”; 분류와 정책 오제재는 다른 지표 | A |
| 신규 Decision Receipt | [W7 기록](mentor5-w7-live-receipt-verification.md) | **VERIFIED**, 과거 실행: “발급 후 공개 등록 전 상태였습니다.” | “새 Receipt가 W4 거래에 포함됐습니다.” proof·anchor null | A·F |
| 모델·정책 hash | [W7 대조](mentor5-w7-live-receipt-verification.md), [해시 검토](mentor5-model-policy-hash-verification.md) | **VERIFIED**, 과거 W4/W7 대조: “각 사례에 기록된 manifest 식별값이 일치합니다.” | “동일 hash가 모델 실행이나 정답을 증명합니다.” | A |
| W4 등록 | [W4 공개 증거](../handoffs/w4-anchored-epoch-public/20261020-r01/README.md) | **VERIFIED**, 10/20 기록: “두 판정서의 commitment를 공개 테스트넷에 등록했습니다.” | “새 발급과 같은 새 거래입니다.” | T |
| Merkle 포함 증명 | [W4 bundle](../handoffs/w4-anchored-epoch-public/20261020-r01/), [규격](../spec/merkle-spec.md) | **VERIFIED**, W4에 한정: “제공된 Receipt와 공개 root의 포함 일치를 확인합니다.” | “기록되지 않은 사건까지 빠짐없이 검증합니다.” | T |
| 독립 브라우저 검증 | [W4 브라우저 기록](../handoffs/w4-anchored-epoch-public/20261020-r01/README.md), [후속 VALID 실측](mentor5-followup-rpc-valid.md) | **VERIFIED**, 당시 실행: “브라우저가 공개 원장과 직접 대조했습니다.” | “공개 RPC가 언제나 정확·가용합니다.” 새 현장 검증 별도 | F·T |
| 본문 변조 | [검증 순서 회귀](mentor5-verification-order-regression.md) | **VERIFIED**, 명시된 시험 범위: “본문만 바꾸면 로컬 `HASH_MISMATCH`입니다.” | “RPC 장애에서도 모든 종류의 변조가 확정됩니다.” | F·T |
| 본문·hash 재계산 변조 | [공개 RPC INVALID_PROOF](mentor5-rpc-invalid-proof.md) | **VERIFIED**, 11/2 1회 28,353ms: 정상 RPC 조회 후 기존 proof 불일치 | “원장 조회 전에 `INVALID_PROOF`입니다.” RPC 장애 시 proof는 미실행 | F·T |
| RPC 장애 | [장애·복구 기록](mentor5-failure-recovery-verification.md) | **IMPLEMENTED / VERIFIED**, 통제된 브라우저 차단 범위: “원장 조회 불가와 변조를 구별합니다.” | “RPC_UNAVAILABLE은 변조 확정”; 물리 회선 장애 및 공개 RPC 복구 실측과 구별 | F·T |
| Appeal·Review | [Backend API](../../backend/src/app.ts), [범위 결정](w6-w7-core-demo-scope-proposal-20261030.md) | **IMPLEMENTED**, 합성 lifecycle 범위: “이의·재검토의 사용자 가치를 합성 흐름으로 설명합니다.” | “운영 백엔드에서 실제 접수·재검토했습니다.” API는 501 | F |
| 신규 자동 Epoch | 신규 실제 E2E 완료 기록 미확인 | **NOT_VERIFIED / BLOCKED**: “자동 등록은 조건부 후속 작업입니다.” | “신규 발급→자동 등록→확인 완료”; 승인과 연결 증거 필요 | T·F |
| YouTube 외부 분석 | [Redesign 인계](../handoffs/redesign-import.md), [수집 코드](../../server/providers/youtube.ts) | **IMPLEMENTED**, 코드 범위: “외부 콘텐츠를 별도로 분석하는 선택 기능입니다.” | “YouTube 플랫폼의 실제 제재 기록을 입증합니다.” 이번 외부 호출 실측 없음 | T·F |
| B2B API·SDK | [모듈화 검토](../architecture/mentor5-modularization-review.md) | **IMPLEMENTED** 일부 / 상용 제품 **NOT_VERIFIED**: “발급·등록·검증 부품으로 확장하는 방향입니다.” | “완성된 세 가지 상용 SDK가 판매 중입니다.” | A |

## 검증 상태와 화면 구분

검증 core는 schema → 로컬 receipt hash → 신뢰 anchor → 원장 epoch/root 조회 → Merkle inclusion → confirmation 순서다. `HASH_MISMATCH`는 로컬에서 결정될 수 있다. 본문과 hash를 함께 바꾼 기존 proof는 정상 원장 root를 얻은 뒤 `INVALID_PROOF`이며, RPC 조회가 실패하면 `RPC_UNAVAILABLE`이고 inclusion은 미실행이다. `UNTRUSTED_ANCHOR`와 `PENDING_ANCHOR`도 별도로 표시한다. 12 L2 confirmations는 L1 finality가 아니다. 현재 두 RPC는 대체 경로이지 독립 공급자의 응답 합의가 아니다.

PR #45의 `frontend/` 기존 화면은 24초 soft deadline, 사용자 중단, AbortController 및 stale 결과 억제 기능이 있다. 현재 기본 Redesign은 같은 core를 호출하지만 [ReceiptPage](../../src/pages/ReceiptPage.tsx)와 [verifier](../../src/verify/verifier.ts)에서 기존 hook을 연결하거나 RPC signal을 전달하지 않는다. **기본 Redesign의 24초 안내·요청 취소는 NOT_VERIFIED/미연결**이며, ID·입력 전환 중 오래된 결과 경합은 코드상 위험으로서 실제 재현은 NOT_VERIFIED다. [기술 시연 인계](../handoffs/mentor5-technical-demo-handoff.md)를 실행 화면과 함께 확인한다.

Redesign의 세션 owner는 원본 `/api`의 인가를 대신하지 않는다. 신규 영수증의 “공개” 및 “누구와 공유” 표현은 원문·salt가 bundle에 없더라도 판정 정보 공개 정책과 함께 확인해야 한다. `publicText=true`인 공개 세션은 발급 또는 합성 판정된 선택 댓글의 원문을 표시할 수 있다. 공개 데모 접근 권한·동의·보관 정책은 별도 인수조건이다.

## 8분 기술 시연 기준과 대체 경로

| 시간 | 기술 동선 |
| --- | --- |
| 0:00–0:45 | 플랫폼 판정 이유와 발급 후 기록 무결성이라는 고객 문제 |
| 0:45–2:00 | 사전 확인된 경우 무해한 입력으로 실제 R01 신규 발급. `PENDING_ANCHOR` 표시; 실패하면 11/2 기록을 과거 실행으로 제시 |
| 2:00–3:30 | W4 공개 영수증과 승인 RPC로 독립 검증을 최대 한 번 시작. 신규 W7과 별도 실행임을 표시 |
| 3:30–4:30 | 본문만 바꾼 사본의 로컬 hash 불일치. 재해시 proof 오류는 기존 실제 실행 기록으로 설명 |
| 4:30–5:15 | UNCALIBRATED 점수·triage·이의 필요성. 실제 운영 이의처리 아님을 표시 |
| 5:15–6:15 | 초기 고객 가설과 발급·등록·독립 검증 제품 방향 |
| 6:15–7:30 | 누락, 최초 정직성, RPC 신뢰, L2/L1 및 AI 판단 한계 |
| 7:30–8:00 | 대기 및 전환 여유 |

24초는 강제 실패 시간이 아니다. 현장에서 RPC가 지연되면 발표자가 수동으로 [10/20 W4의 역사적 검증 기록](../handoffs/w4-anchored-epoch-public/20261020-r01/README.md)을 표시하고 현재 LIVE 결과가 아직 없음을 구분한다. 기본 Redesign에서 24초 버튼 또는 실제 취소가 작동한다고 가정하지 않는다. 과거 공개 RPC `VALID` 22,910ms와 `INVALID_PROOF` 28,353ms는 각각 별도의 1회 실행이며 성능 개선이나 연속 성공의 증거가 아니다. [정상 기록](mentor5-followup-rpc-valid.md) · [변조 기록](mentor5-rpc-invalid-proof.md)

## F/T 인수조건과 최종 판정

| 이슈 | 담당 | 인수조건 | 본선 |
| --- | --- | --- | --- |
| Redesign 24초 안내·취소·stale | T·F | 24초 전후, 계속 대기 후 정상 결과, 실제 fetch abort·fallback 중단, 입력·ID·프로필·이탈 경합 | 안정화 필수 |
| `/svc` owner와 `/api` 인가 | F·T | 두 세션의 Receipt 접근·replay·salt 격리, 위조 operator·직접 경로 우회 거부 | 공개 배포 전 필수 |
| 공개/비공개 Receipt와 원문 | F·T | owner·명시적 공개 승인·W4 정적 공개 자료의 경계 및 동의 확인 | 공개 시 필수 |
| 실제 R01과 synthetic 구분 | A·F·T | 실제 추론·미등록 Receipt·합성 점수의 표시 및 오류 시 미발급 | 필수 |
| 신규 자동 Epoch | T·F | 승인된 같은 신규 Receipt·epoch·TX·confirmation·proof·독립 검증 연결과 실패·재시도 근거 | 조건부 선택 |
| YouTube 해석 | T·F | 제3자 분석과 플랫폼 제재 이력 구분; 미사용 시 수동 입력 가능 | 선택 |

Option B는 **조건부 GO**다. W4 역사 실증과 W7 역사 발급을 분리해서 사용할 수 있으나 본선 기기에서 실제 R01·RPC·화면과 리허설을 다시 확인해야 한다. 현재 Redesign의 LIVE E2E·공개 RPC 장애 후 복구·BASE 10회 연속 성공·물리 모바일은 **NOT_VERIFIED**다. 신규 자동 온체인 E2E와 공개 HTTPS 서비스는 필요한 증거·승인 및 보안 조건이 충족될 때까지 **NO-GO**다.
