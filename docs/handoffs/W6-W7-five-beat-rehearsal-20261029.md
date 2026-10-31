# W6 → W7 5-Beat 공동 리허설 준비 시트

> **대상:** 발표자·진행자 · **목적:** 5개 시연 구간의 계획과 실제 결과를 구분합니다. 최신 읽기 순서는 [멘토링 안내](../mentoring/README.md)를 참조하세요.

기준: 통합 main `f7c84f27ff964d114cacc8c5c181b4df8b9f766b` · 작성 2026-10-29 · **계획 / NOT_EXECUTED**. 이 시트는 3인의 실제 리허설, 녹화, Scope Cut 승인을 증명하지 않는다. 실제 시작·종료, 결과와 증거를 아래 빈 기록란에 수행 후에만 적는다. 과거 실행과 새로운 측정을 섞지 않는다.

근거: [W7 기존 준비도](../evidence/w6-a-closeout/w7-demo-readiness.md), [AI-19 판정](../evidence/w6-a-ai19-offline/ai19-final-assessment.md), [F 공개 실행 요약](../evidence/w6-f/20261027/README.md), [T 통합 증빙](../evidence/w6-t-integration-evidence-20261028.md), [W6 MUST](W6-MUST-plan.md). 이 근거들의 날짜와 실행 SHA는 각 문서의 값이며 현재 main에서 새로 실행했다는 뜻이 아니다.

## 모드와 발표 경계

- **LIVE Base Sepolia**: W4 Epoch 1 공개 receipt를 승인된 공개 RPC로 읽기 전용 검증한다. `BASE_SEPOLIA_DEMO`와 관측한 판정·L2 확인을 표시한다. 새 transaction을 보내지 않고 L1 finality를 보장한다고 말하지 않는다.
- **SYNTHETIC_LOCAL**: 브라우저 모의 원장과 synthetic receipt를 이용한 검증 로직 시연이다. 실제 공개 체인·W4 anchor 검증 성공으로 합산하지 않는다.
- **LOCAL_HARDHAT**: 실제 Hardhat 노드의 데이터로 검증한 별도 경로다. 현재 확인된 main의 브라우저 synthetic 경로를 Hardhat 성공이라고 부르지 않는다. 실제 경로와 실측은 NOT_VERIFIED.
- **RECORDED**: 실재 녹화의 촬영일·모드·증거 SHA·재생 가능성을 확인한 뒤에만 사용한다. 현재 확인된 자료 기준 `RECORDED_READY=false`; 스크린샷은 녹화가 아니다. 녹화에서 원문·salt·API 키·로컬 DB·비밀 경로가 보이지 않아야 한다.
- 원본 작업공간의 `docs/evidence`, `docs/handoffs`, `output`에서 영상 확장자만 검색해 0개를 확인했다. 검색 범위 밖의 부재는 확인하지 않았고 영상 재생 검증도 하지 않았다.
- **과거 W4 vs 새 W6/W7**: W4의 공개 성공 근거는 과거 anchor의 증거다. 이후 실측은 시각·기준 SHA·입력·판정·환경을 새로 기록한다. 과거 성공을 새 실행 성공으로 세지 않는다.
- Beat 1의 새 AI 추론과 Beat 2의 기존 W4 receipt는 **별개**다. 새 AI 출력이 W4 Epoch 1에 등록됐거나 새 온체인 거래가 발행된 것처럼 연결하지 않는다. 새 receipt 발급 및 AI→Receipt 전체 경로는 별도 검증 대상이며 앵커되지 않은 receipt는 `PENDING`이다. AI 분류 정확성과 블록체인 무결성은 서로 다른 주장이다.
- W4 provisional 정책과 Validation 연구 정책을 구분한다. 미승인 연구 정책은 운영 승인 상태가 아니며 S1·LOCK·TEST 상태를 바꾸지 않는다.

## 실행 전 체크

A는 발표 PC의 R01 로컬 서비스와 무해한 입력을 준비한다. 과거 물리 오프라인 1회 성공은 해당 당시·해당 PC의 추론 증거이고, 이번 현장의 오프라인 여부를 자동으로 보장하지 않는다. F/T는 W4 공개 bundle과 BASE profile, 두 승인 RPC, 표시 문구 및 합의한 장애 주입 수단을 확인한다. BASE에서 재시도해도 실패하면 `RPC_UNAVAILABLE`을 그대로 보여주고 synthetic으로 전환하거나 확인 가능한 과거 W4 근거를 별도 표시한다. 녹화본이 없으면 녹화 fallback을 실행하지 않는다. 모든 입력은 공개 가능한 seed만 사용하며 W4 원본을 수정하지 않는다.

## 480초 예산 — 목표 배분, 측정치 아님

| 구간 | 목표 누적 | 담당 | 입력과 화면 | 순서와 성공 상태 | 실패 및 즉시 전환 |
|---|---:|---|---|---|---|
| 도입 40초 | 00:40 | A | 발표 화면: 모드·별도 증거 범위 | 로컬 AI / 기존 W4 receipt가 독립된 사례임을 설명 | 정보가 불명확하면 해당 주장 보류 |
| Beat 1: 추론 80초 | 02:00 | A, F 보조 | R01 서비스·무해한 새 입력, `/healthz`와 `/infer` 결과 화면. 서비스는 시작 전 준비 | 서비스 ready 확인 → 새 입력 추론 → `LOCAL MODEL — LIVE INFERENCE` 및 실제 응답 표시. 물리 오프라인은 그 세션에서 확인된 경우에만 표시 | 기동/추론 실패 시 과거 AI-19의 2026-10-27 물리 오프라인 1회 결과를 **과거 증거**로 설명. 새 실행 성공 주장 금지 |
| Beat 2: 공개 검증 75초 | 03:15 | F, T 확인 | 공개 W4 receipt-0 bundle, 검증 화면 `/verify?profile=BASE_SEPOLIA_DEMO` | 공개 JSON 입력 → 검증 → 같은 receipt의 `VALID` 및 Base Sepolia/L2 배지 확인 | `RPC_UNAVAILABLE`이면 1회 재시도 후 실패 결과 유지. `SYNTHETIC_LOCAL`로 전환하거나 과거 W4 성공 근거를 과거 자료로 제시. 두 결과를 혼합하지 않음 |
| Beat 3: 본문 변조 55초 | 04:10 | F, T 확인 | W4 bundle의 별도 복사본·검증 화면 | 원본과 별도 복사한 body의 `policy.action`만 변경하고 기존 hash 유지 → `HASH_MISMATCH` 관측. W4 원본 파일은 변경하지 않음 | 기대 판정이 나오지 않으면 그 결과를 기록하고 다음 Beat로 이동. RPC 없이 판정되는 테스트라는 범위만 설명 |
| Beat 4: proof 불일치 90초 | 05:40 | F 실행, T 확인 | 별도 W4 bundle 복사본·검증 화면 | 목표는 body 수정·receipt hash 재계산·기존 proof 유지 후 `INVALID_PROOF`. 승인된 동일 profile에서 읽기 전용 검증 | RPC 불가 시 `BLOCKED`/`RPC_UNAVAILABLE`로 남김. **proof sibling 변조**로 대체할지는 팀장 명시 범위 결정을 먼저 받는다. 대체 시 proof 경로 변조라고 표시하고 rehash 성공으로 세지 않는다. 과거 sibling 1회는 새 실측 아님 |
| Beat 5: RPC 복구 100초 | 07:20 | F 실행, T 증거·상태 확인 | 같은 W4 receipt 및 hash·BASE profile, 두 승인 RPC 대상 차단 도구 | `VALID` → 두 endpoint Playwright route abort → `RPC_UNAVAILABLE` → 차단 해제 → **동일 receipt** `VALID`. 차단 수단은 브라우저 요청 차단이라고 명시 | 초기 또는 복구에서 실패하면 관측 상태와 시각을 남기고 PARTIAL/BLOCKED로 전환. 물리 네트워크 장애, 모바일 실기기 또는 반복 안정성 성공으로 주장하지 않음 |
| 마무리 40초 | 08:00 | A, F/T 보조 | 표시된 판정과 한계 | 실제 모드, 검증 성공·미완료, 정책 미승인 설명 | 시간 초과나 실패도 실제대로 기록 |

합계 480초는 **목표**다. 과거 BASE 성공 1회 평균 약 48초, proof sibling 사례 약 96초, F Desktop 복구 1회 약 247.5초로, 예산은 검증된 완주 시간이 아니다. 사전 검증 또는 녹화 준비가 실제로 이뤄지지 않으면 해당 근거로 표시하지 않는다. W5 브라우저 테스트의 복구 단계는 proof/anchor를 제거한 `PENDING_ANCHOR`이므로 Beat 5의 동일 receipt 복구 근거가 아니다.

## 공동 리허설 기입란 — 아직 실행되지 않음

| 기록 항목 | 실제 결과 기입 |
|---|---|
| 날짜·시작·종료·총 소요 | 미기록 — 실제 실행 후 기입 |
| 참석 A/F/T 및 각 역할 | 미기록 |
| 실행 main SHA / 관련 코드 SHA | 미기록 |
| 발표 PC·브라우저·네트워크 / physical mobile 여부 | 미기록 |
| Beat 1 입력 공개 가능 여부·서비스·추론 응답 / 오프라인 검증 범위 | 미기록 |
| Beat 2 receipt 식별·profile·판정·시각 | 미기록 |
| Beat 3 변경 필드·판정 | 미기록 |
| Beat 4 변조 유형(rehash 또는 sibling)·승인·판정 | 미기록 |
| Beat 5 동일 입력 hash·차단 방식·상태 순서·판정 | 미기록 |
| 각 Beat 소요 / 실패 / fallback 전환·모드 | 미기록 |
| 녹화 파일 존재·재생 검증·시각·SHA·공개 가능 여부 | 미기록 — 확인 전 RECORDED_READY=false |
| F/T 검토와 팀장 판정 | 미기록 |

## 정책 범위 결정 요청 — 미승인 제안

| 기준 | Option A — FULL W6 MUST | Option B — CORE DEMO SCOPE CUT (권고) |
|---|---|---|
| 범위 | A1 S1 또는 S2 결정, A2 A/F 계약, A3 Manifest·Python/Node parity, A4 runtime binding, A5 별도 LOCK·TEST 승인 및 F2 연구 정책 로딩 | W4 provisional 정책·기존 Epoch 1 검증과 별도의 AI-19 추론 증거로 데모. 미승인 연구 정책, 신규 LOCK·TEST·Epoch·runtime binding은 이번 데모 릴리스에서 제외 |
| 일정·기술 위험 | 승인과 계약, 새 구현·독립 리뷰·CI가 선행·연쇄되므로 동결 전 지연과 변경 위험이 크다 | 신규 정책 기능 부담을 줄이나 공개 RPC 불안정·변조 실측·녹화·리허설은 그대로 남는다 |
| 필수 승인 | S1/S2, 계약, Manifest, LOCK, TEST 등 각각 별도 명시 승인 및 관련 리뷰 | 팀장의 명시적 Scope Cut 결정 및 후속 PR 독립 리뷰. 정책·LOCK·TEST를 승인하는 결정이 아님 |
| 발표 효과 | 모두 검증·승인되면 연구 정책 적용과 해당 범위의 평가를 추가로 설명 가능 | 실제 로컬 추론, 기존 공개 체인 무결성, 변조/장애 구분을 근거 수준에 맞게 설명. TEST 성능·연구 정책 운영 승인 주장 불가 |

**권고: Option B. 결정 상태: PENDING — 팀장 명시 승인 전 확정 아님.** 승인 시에만 별도 결정 ID·정확한 범위·사유·승인자·승인 시각을 기록한다. 어느 선택도 S1 `team_approved=true`, LOCK, TEST 접근을 자동 승인하지 않으며 Option B도 A1~A5와 F2의 원래 미완료 기록을 삭제하거나 PASS로 올리지 않는다. Beat 4 sibling 대체와 SYNTHETIC_LOCAL 채택도 발표 범위 결정을 명확히 한다.

## F/T 인계 메시지 초안 — 미발송

**F / 노유신:** W7 검토용으로 실행 코드·기준 commit SHA·환경·시각이 포함된 공개 가능한 증거를 부탁합니다. ① RPC 원인 분석과 호출 수·rate limit/환경 구분 ② BASE 10회 반복의 각 판정과 SKIP 포함 결과 ③ 동일 W4 seed body 변조·rehash 후 기존 proof의 `INVALID_PROOF` 실측 또는 정확한 blocker ④ 같은 receipt의 Desktop/Mobile emulation 및 실기기 복구 결과와 장애 주입 방식 ⑤ 각 데모 fallback의 실제 실행·화면·입력 hash. 기존 W4 파일, 승인 경계, 신규 체인 송신 금지와 제품 검증 강도를 유지해 주세요.

**T / 설경민:** 독립 검증용으로 기준 commit SHA·실행 환경·원본 또는 공개 가능한 요약을 부탁합니다. ① SEC-W5-01 부정 검증 8종의 각 assertion·PASS/FAIL/SKIP/미구현 ② Windows 제약 및 실제 비 Windows 실행 결과 ③ RPC 최적화 변경 원본에 대한 보안 독립 리뷰와 미완료 사유 ④ TrustProfile·Event·Getter·Receipt·Merkle 불변 확인 ⑤ 실제 Hardhat LOCAL 지원 경로와 실측 여부. 기존 browser 30/30, synthetic, mobile emulation과 실기기 및 새로운 반복 측정은 분리해 주세요.
