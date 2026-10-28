# W7 5-Beat 시연 준비도 (8분 발표 기준)

작성: A / 주진호 · 2026-10-27 KST · PRELIMINARY · **리허설 0회이므로 480초 안에 실행 가능하다고 주장하지 않는다.**

라벨: **LIVE_READY** 현장 라이브 실행 근거 있음 / **LOCAL_READY** 시뮬레이션·로컬로만 가능 / **RECORDED_READY** 녹화본 있음 / **BLOCKED** 선행조건 미충족 / **NOT_VERIFIED** 근거 부족

## 1. Beat별 준비도

| Beat | 내용 | 현재 라벨 | 근거 | 남은 조건 |
|---|---|---|---|---|
| 1. AI Decide | 실제 R01 `/infer`에 새 입력 | **LIVE_READY** (추론) | AI-19 물리 오프라인 실측. 기동 약 20초 → 시연 전 미리 기동 | 새 Receipt 발급(F `/api/decisions` + 실제 모델)은 W6에서 **NOT_VERIFIED**. 새 Receipt는 앵커 전 **PENDING**이며 W4 Epoch 1에 넣지 않는다 |
| 2. Blockchain Prove | W4 receipt를 Base Sepolia 공개 RPC로 VALID | **NOT_VERIFIED (반복 안정성)** | A 실측: VALID 2회 성공, 연속 10회 중 2회. 1회 약 48초 | 공개 RPC 안정화(B-02) 또는 사전 검증 화면 녹화 |
| 3. Body Tamper | body 변경 → HASH_MISMATCH | **LIVE_READY** | A 실측 PASS. **RPC 없이 판정**되므로 네트워크와 무관 | 없음 |
| 4. Proof Tamper | rehash·proof 불일치 → INVALID_PROOF | proof sibling 변형: **NOT_VERIFIED (반복)** / rehash 변형: **BLOCKED** | A 실측 sibling 변형 1회 PASS(1.6분, 호출 578회). rehash는 F BLOCKED 보고 | rehash 1회 성공 증거 또는 sibling 변형으로 대체 결정. 라이브 1.6분은 시간 부담 |
| 5. RPC Recovery | VALID → 두 RPC 차단 → RPC_UNAVAILABLE → 해제 → 같은 receipt VALID | **NOT_VERIFIED** | T Desktop·F 1회 성공 보고(원본 없음). T Mobile timeout | F `w6.spec.ts`·로그 원본, 반복 성공 |

**현재 5/5 LIVE가 아니다.** 라이브 근거가 있는 것은 Beat 1(추론)과 Beat 3이다.

## 2. 3단 Fallback

| Tier | 조건 | 실제 사용 가능한 seed | 화면 표시 문구 (코드 확인) | 주장 수준 | 상태 |
|---|---|---|---|---|---|
| 1. BASE | 시연 직전 사전 검증 1회 VALID | W4 Epoch 1 receipt-0, receipt-1 bundle (`docs/handoffs/w4-anchored-epoch-public/20261020-r01/`, proof·anchor 포함) | `BASE_SEPOLIA_DEMO` 배지, VALID 시 "L2 Confirmed · Base Sepolia · N blocks (기준 ≥12) · L1 finality 보장 아님" | 공개 체인 검증 | 동작은 하지만 반복 성공률 낮음(2/10) |
| 2. LOCAL | BASE 사전 검증 실패 또는 현장 1회 재시도 실패 | 브라우저 내 생성 synthetic receipt | "SYNTHETIC_LOCAL · Mock 원장 (공개 체인 증거 아님)" | **공개 체인 증거 아님.** 검증 로직 시연일 뿐 | LOCAL_READY (시뮬레이션 원장). 실제 Hardhat 31337 노드를 읽는 경로는 main에 없음 |
| 3. RECORDED | LOCAL도 불가 | 사전 녹화 BASE 성공 화면 | "RECORDED — 2026-xx-xx 녹화" (발표자가 구두·자막으로 표시) | 과거 실행 기록 | **RECORDED_READY=false** (녹화본 없음. W4 스크린샷 7장은 녹화본이 아님) |

전환 순서: BASE 사전 검증 → (실패 시) 현장 "다시 검증" 1회 → (실패 시) LOCAL 또는 RECORDED. 전환할 때는 화면 배지와 구두 설명을 함께 바꾼다.

## 3. 시간 예산 (실측 기반 추정, 리허설 아님)

| 단계 | 실측 소요 | 비고 |
|---|---|---|
| Beat 2 VALID 1회 | 약 48초 | A BASE 실측 성공 2회 평균 |
| Beat 4 INVALID_PROOF 1회 | 약 96초 | A proof live 1회 |
| Beat 5 | VALID 48초 + 장애 + VALID 48초 이상 | 원본 없음 |
| Beat 3 | 수 초 | RPC 없음 |

공개 RPC 대기만 3~4분이 될 수 있다. 8분 안에 Beat 2·4·5를 모두 라이브로 하면 시간이 부족할 위험이 크다. **권고:** Beat 3은 라이브로, Beat 2는 발표 직전에 사전 검증한 결과 화면으로, Beat 4·5는 녹화본(확보 후)으로 진행한다. 최종 배분은 리허설로 정한다.

## 4. 480초 리허설 통과 조건

1. 실제 발표 PC·네트워크·브라우저로 1회 이상 실행하고 시작·종료 시각을 기록한다
2. 각 Beat에서 화면에 나온 판정 코드와 배지를 기록한다(LIVE/LOCAL/RECORDED 구분)
3. Fallback 전환을 1회 이상 연습한다
4. BASE 성공 화면 전체를 녹화해 RECORDED tier를 확보한다
5. 발표 문구가 [팩트시트](README.md)의 허용 범위를 벗어나지 않는지 확인한다
