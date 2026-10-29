# W6 A Acting Protocol Security Review — 2026-10-29 KST

> 역사적 스냅샷: 아래 본문은 2026-10-29 18:02 KST의 판단과 당시 PR·CI·실측 상태를 보존한다. 이후 #34·#35는 독립 승인 후 병합됐고, #37의 수정 HEAD `16880b45`는 코드 범위 승인과 별도로 E6 수용 판단을 기다린다. 수정 후보의 F 보고는 BASE 8/10이며 원본 로그는 독립 확인하지 않았다. 현재 main과 시연 상태는 [5회차 멘토링 기술 보고](mentoring-brief-20261030.md) 및 GitHub에서 확인한다.

- 작성: A / 주진호 (`jujinho03`). T(설경민, `k0ng-min`)가 외부 일정으로 리뷰할 수 없어 A가 임시로 보안 리뷰를 맡았다. **T 전문 리뷰는 수행되지 않았다.**
- 조회 시점: 2026-10-29 18:02 KST, main `f08b7208ec8dd82e57535523b256844858f5cd6a`(push CI [#291](https://github.com/jujinho03/verimod/actions/runs/40819711197) frontend·backend·contracts SUCCESS)
- 실행 환경: Windows, 격리 git worktree 3개(main `f08b7208`, PR #37 `7fcbc6c0`, 수정 후보 = `7fcbc6c0` + [pr37-chainid-fix.patch](pr37-chainid-fix.patch)). 원본 작업 트리는 변경하지 않았다.
- 범위 밖: 신규 transaction, 운영 DB, TEST, LOCK, S1, W4 원본 수정. 공개 RPC는 읽기 전용 메서드만 호출했다.
- 이 문서는 판정 제안이다. 팀장의 공식 Exit 판정이나 Scope Cut 결정이 아니다.

## 1. PR #37 chain ID 회귀 — 독립 재현

### 원인
`frontend/src/domain/rpcLedger.ts`(PR blob `c66ad888`)의 `checkedChains`/`checkChain`은 endpoint별 최초 `eth_chainId` 성공을 reader 수명 동안 재사용한다. 캐시에서 지우는 경우는 chain 확인 자체가 실패했을 때뿐이다. 따라서 다음 경우 같은 URL의 chain 전환이 감지되지 않는다.
- 오류 없이 chain이 바뀐 경우
- 일반 RPC 오류 뒤에 chain이 바뀐 경우
- 이미 검증된 backup으로 failover한 경우
- 동시 호출이 하나의 확인 결과를 공유하는 경우

main(blob `47675007`)은 논리 RPC마다 chain을 다시 확인한다.

### 합성 재현 결과 ([테스트 원문](a-independent.rpcLedger.test.ts.txt), sha256 `49b085e3…`)

| ID | 입력 | 기대 | main `f08b7208` | PR `7fcbc6c0` | 수정 후보 |
|---|---|---|---|---|---|
| C01 | 정상 84532, head 125,000, event 105,000 | VALID 레코드 | PASS | PASS | PASS |
| C02 | 처음부터 chain 1 | RpcUnavailableError | PASS | PASS | PASS |
| C03 | 84532·head 122 성공 → 같은 URL이 chain 1·head 9999 | 거부 | PASS | **FAIL: 9999 수용** | PASS |
| C04 | blockNumber RPC 오류 1회 → chain 1·9999 | 거부 | PASS | **FAIL: 9999 수용** | PASS |
| C05a | primary 503 → 미검증 backup chain 1 | 거부 | PASS | PASS | PASS |
| C05b | primary 장애, backup 84532로 검증됨 → backup chain 1 | 거부 | PASS | **FAIL: 9999 수용** | PASS |
| C06 | reader A 검증 후 chain 전환, 새 reader B | 거부 | PASS | PASS | PASS |
| C07 | 다른 TrustProfile(다른 URL) chain 1 | 거부 | PASS | PASS | PASS |
| C08 | 동시 2호출, 첫 chain 확인 실패 | 실패 공유 후 재확인 | PASS | PASS | PASS |
| C08b | 동시 2호출, 첫 확인 직후 chain 전환 | 두 번째 호출 독립 확인 | PASS | **FAIL: chainId 1회만** | PASS |
| C09 | 6.5초 지연 응답 | 5초 abort → RpcUnavailable | PASS | PASS | PASS |
| C10 | 응답 없음 | abort → RpcUnavailable | PASS | PASS | PASS |
| C11 | result 누락, error 객체, 비 JSON, 숫자 chainId | RpcUnavailable | PASS | PASS | PASS |
| C12 | 첫 getLogs 창 이후 chain 1로 전환, 위조 event가 60,000에 위치 | 거부 | PASS | **FAIL: anchored_block 60,000 수용** | PASS |

- **main:** 37개 중 32 PASS. 실패 5건(W01·W02·W03·W11·W12)은 main이 10,000-block 창을 쓰기 때문에 50,000 전용 기대값과 맞지 않는 것이다. 보안 결함이 아니다.
- **PR:** 32 PASS. 실패 5건은 모두 chain ID 회귀다.
- **수정 후보:** 37/37 PASS.

### 영향 범위
- 재현된 것은 다른 chain의 `eth_blockNumber`와 `eth_getLogs`/receipt를 검증 없이 수용하는 동작이다.
- `verify.ts:203`은 `block - anchored_block + 1`로 confirmation을 계산한다. 그래서 잘못된 head를 받으면 아직 확정되지 않은 Receipt가 finality gate를 통과할 수 있다.
- C12에서는 다른 chain의 event 위치(anchored_block)가 섞였다. root·count·version은 정상 chain getter와 교차 검증되므로, root를 위조한 완전한 Receipt가 VALID로 판정되는 경우는 재현하지 않았다.
- 같은 endpoint가 응답 사이에 chain을 바꾸는 상황은 RPC 공급자가 악의적이거나 오설정됐다는 가정이다.

### 최소 패치 ([pr37-chainid-fix.patch](pr37-chainid-fix.patch), sha256 `16a95c47…`, `7fcbc6c0`에 `git apply --check` 통과)
- `checkedChains` 캐시를 제거하고, 매 논리 RPC 직전에 `eth_chainId`를 확인하도록 되돌린다. 이는 main의 동작과 같다.
- 50,000-block 창은 유지한다. 수정 후보와 main의 차이는 `LOG_RANGE_BLOCKS` 상수와 helper 함수 추출뿐이다.
- 회귀 테스트 4개를 추가하고, 기존 호출 순서 테스트를 매 호출 앞 chainId 형태로 갱신한다.
  - 추가 테스트: 성공 후 전환, 오류 후 전환, backup failover 후 전환, 창 scan 중 전환
  - 이 5개 테스트는 PR HEAD에서 모두 FAIL이고 수정 후보에서 PASS다.
- 수정 후보 전체 검사 결과(A 실행)
  - frontend unit 23 files / 255 tests PASS
  - lint PASS(기존 경고 2)
  - `w5:typecheck` PASS
  - build PASS
- 실행 중 vitest가 스냅샷 2개의 줄바꿈만 바꿨다. 내용 변경은 0이고, 패치에서 제외했다.

### 남는 위험 (수정 후에도)
- **TOCTOU:** `eth_chainId`와 데이터 호출은 별개 HTTP 요청이다. 그 사이의 chain 전환은 탐지할 수 없다(RESIDUAL 테스트에서 모든 구현이 수용). JSON-RPC batch로 묶는 방식은 공급자 지원 여부를 확인해야 하므로 별도 검토 대상이다.
- **endpoint 혼합:** 한 `getEpoch` 안에서 논리 호출마다 다른 endpoint가 응답할 수 있다. 이 구조는 PR 전에도 있었다.
- **호출 수 증가:** 회당 호출이 79에서 160으로 늘어난다. 기존 경로 740 대비로는 여전히 약 78% 감소다.

## 2. 50,000-block 창 검증

| ID | 검증 | main | PR | 수정 후보 |
|---|---|---|---|---|
| W01 | head−deploy+1 = 50,000 → 창 1개 `[0,49999]` | N/A(10k) | PASS | PASS |
| W02 | 50,001블록 → `[0,49999],[50000,50000]` | N/A | PASS | PASS |
| W03 | deploy 100, head 150,150 → 연속·무중복·마지막 부분 창 | N/A | PASS | PASS |
| W04 | deploy = head → 1블록 | PASS | PASS | PASS |
| W05 | event 49,999 / 50,000 경계 | PASS | PASS | PASS |
| W06 | 서로 다른 창의 중복 event 거부 | PASS | PASS | PASS |
| W07 | event 누락 거부 | PASS | PASS | PASS |
| W08 | event root ≠ getter 거부 | PASS | PASS | PASS |
| W09 | receipt blockNumber·blockHash·status·to 불일치 거부 | PASS | PASS | PASS |
| W10 | 중간 창이 모든 endpoint에서 실패 → fail-closed | PASS | PASS | PASS |
| W11 | 중간 창 HTTP 429 → backup이 같은 창을 처리 | N/A | PASS | PASS |
| W12 | 모든 endpoint가 50,000 범위 거부 → fail-closed | N/A | PASS | PASS |
| W13 | head < deploy, `removed:true` 거부 | PASS | PASS | PASS |
| W14 | publisher 불일치 → UNTRUSTED | PASS | PASS | PASS |

**실제 공급자 읽기 전용 확인 (2026-10-29 17:5x KST, 각 1회)**
- **`base-sepolia-rpc.publicnode.com`:** chainId `0x14a34`. 50,000·50,001블록 `eth_getLogs` 모두 HTTP 200(결과 0건, 배포 블록 시작 구간).
- **`sepolia.base.org`(backup):** chainId `0x14a34`. 그러나 50,000·10,000·2,000블록 `eth_getLogs`가 모두 HTTP 413, `-32614 eth_getLogs is limited to a 200 range`로 거부된다.
  - backup은 main의 10,000 창과 PR의 50,000 창 어느 쪽에서도 Event 조회를 대신할 수 없다.
  - 현재 동작은 RPC_UNAVAILABLE fail-closed라 Event를 누락한 성공은 없다.
  - 전체 범위(약 365만 블록)를 200 창으로 나누면 약 18,000 요청이 필요하므로 현실적인 대체 경로가 아니다.
  - **E3/E6에서 "backup RPC 복구"라고 표현하지 않는다.** F의 recovery는 두 host를 route abort했다가 해제한 뒤 primary로 복귀한 결과다.
- 합성 테스트 PASS는 모든 공급자가 같은 범위를 지원한다는 증거가 아니다.

## 3. 보안 불변조건 (PR #37 + 수정 후보)

| 불변조건 | 상태 |
|---|---|
| chain 84532 | PR: **약화**(C03·C04·C05b·C08b·C12). 수정 후보: main 수준으로 복원 |
| 승인 RPC / TrustProfile | `baseSepoliaProfileFromEnv`는 주소·URL·정수 **형식만** 검증한다. 승인 상수와 같은지는 강제하지 않는다. `approvedProfiles.ts`의 고정 profile과는 구분해야 한다(변경 없음) |
| publisher, `epochs()` root/count/version | 유지(W14, C01) |
| deployment→head 전체 Event, 중복 거부, Event/getter 교차 | 유지(W01~W08) |
| receipt status / to / blockNumber / blockHash | 유지(W09). **독립 canonical block 조회는 main에도 없다.** Event와 receipt의 block hash·number 일치 확인만 있다. PR 본문의 "canonical block binding"은 이 범위로 한정해야 한다 |
| confirmation gate, Merkle inclusion, HASH_MISMATCH, INVALID_PROOF | `verify.ts`·`merkle.ts` 변경 없음. A 실측 §4 |
| RPC_UNAVAILABLE fail-closed | 유지(C09~C11, W10, W12) |
| 기존부터 있던 관찰(이번 PR이 원인 아님) | OBS1: `log.address`를 승인 contract와 비교하지 않음. OBS2: 요청 창 밖 blockNumber의 log를 수용함. main에서도 같다. 서버 쪽 필터와 receipt.to 검사가 일부 보완하지만, 후속 보강 PR을 권고한다 |

## 4. 실행 증거 감사

| 항목 | 분류 | 근거 |
|---|---|---|
| F BASE 10/10, 평균 21.150초, 79회 | **OLD_CANDIDATE_MEASUREMENT / REPORT_ONLY** | 실행 커밋 `d241f79a…`·`f68e6aca…`는 GitHub에 없다(API 422). private 로그 미제공. 공개 JSON 내부 정합성은 확인했다: 회차 합 211,504ms, 평균 21,150, 최소 17,542 / 최대 30,173, 790 = 79×10 |
| W4 Receipt identity | **교차 확인** | F `input_sha256 0b73aa52…`, receipt_hash `0x96684f06…`가 A 실측과 같다 |
| F Rehash INVALID_PROOF, Desktop 17.064초 / Mobile emulation 18.088초 recovery | OLD_CANDIDATE_MEASUREMENT / REPORT_ONLY | route abort 주입이며 물리 차단이 아니다. 원본 미검증 |
| 최초 DNS 실패 0/10 | 보존(JSON `fresh_environment_failures_retained`) | — |
| A 수정 후보 실측 (18:0x KST) | **A_FIXED_CANDIDATE_MEASUREMENT** (PR HEAD 아님, 미커밋 패치) | VALID 3/3(16,868 / 16,064 / 16,204ms), 회당 160회(chainId 80, eth_call 2, blockNumber 2, getLogs 75, receipt 1), 429·timeout 0, 전부 publicnode. HASH_MISMATCH 1/1(RPC 0). INVALID_PROOF 1/1(rehash `0xe61eb203…` ≠ 원본 `0x96684f06…`, 기존 proof/root 유지, 160회) |
| 수정된 F HEAD의 BASE 10회·recovery | **NOT_EXECUTED** | F 재실측 필요 |

수정된 코드에서 F가 재실측하기 전에는 79회/attempt와 10/10을 수정본의 결과로 재사용하지 않는다.

## 5. PR #36 — POST-MERGE INDEPENDENT SECURITY AUDIT — A

**사후 감사다.** PR #36(`188e3c4f`, 작성자 k0ng-min)은 2026-10-29 13:47 KST에 작성자 본인이 병합했다(merge `f08b7208`). 병합 전 GitHub 독립 리뷰는 0건이다. 이 감사는 병합 전 승인을 대신하지 않는다.

- 독립 재실행(main `f08b7208`, Windows, 합성 fixture)
  - `backend: vitest run test/durability-callback.test.ts`: 8 passed / 53 skipped
  - `backend: vitest run`: 12 files, 158 passed / 53 skipped
  - `backend: typecheck`: PASS
  - T 보고와 같다.
- `durabilityCallback.ts:94`가 `database_path`를 평가하기 전에 `process.platform !== 'win32'`를 요구한다. 따라서 Windows의 모든 경로는 경로·identity·header 검사 이전에 차단된다.

| # | 분류 | Windows 결과 | 근거 수준 |
|---|---|---|---|
| 1 | 삭제 경쟁 | PASS (fail-closed) | 플랫폼 gate. 비 Windows 경쟁 harness NOT_EXECUTED |
| 2 | 파일 교체 | PASS (fail-closed) | gate만 검증. 비 Windows identity 테스트는 Windows에서 SKIP |
| 3 | identity 변경 | PASS (fail-closed) | gate만 검증 |
| 4 | symlink / reparse | **NOT_EXECUTED** | reparse fixture 없음 |
| 5 | 미승인 DB 생성 | PASS (no file created) | `existsSync(missing) === false` |
| 6 | header / schema | PASS (fail-closed); schema opener NOT_EXECUTED | 참고: `unsupported schema fixture`는 변경하지 않은 DB를 그대로 사용하므로 schema 변조 입력이 아니다(명칭 보정 권고, LOW) |
| 7 | no-create | PASS | 원본 bytes 불변, missing 파일 미생성 |
| 8 | durability / ACK | 거부 PASS, writable ACK **SKIP** | 53 SKIP 유지 |

- **판정:** 중대한 문제는 없다. Windows fail-closed PASS는 **writable callback 운영 지원이 아니다(UNSUPPORTED 유지).**
- 행 2·3·6은 개별 검사 로직이 아니라 플랫폼 gate를 검증한 것이다(문서에도 명시돼 있음).
- 비 Windows 실행이 필요한 항목: symlink/reparse, header/schema opener, writable ACK.

## 6. A PR #34 · #35

| PR | HEAD | base(작성 시) | 현재 main 대비 | CI | 독립 리뷰 |
|---|---|---|---|---|---|
| [#34](https://github.com/jujinho03/verimod/pull/34) | `45768744` | `f7c84f27` | 충돌 0 | [#284](https://github.com/jujinho03/verimod/actions/runs/40785920057) SUCCESS (구 base) | **0건**, 요청 리뷰어 없음 |
| [#35](https://github.com/jujinho03/verimod/pull/35) | `cf3405c8` | `f7c84f27` | 충돌 0, #34 다음 순차 병합도 충돌 0 | [#287](https://github.com/jujinho03/verimod/actions/runs/40818327252) SUCCESS (구 base) | **0건**, 요청 리뷰어 k0ng-min |

- 두 PR 모두 A가 작성했으므로 A는 승인하지 않는다. 대체 리뷰어는 F(`ysn-0215`)다.
- F가 APPROVED하기 전에는 OPEN을 유지한다.
- 두 PR의 CI는 #36 병합 전 base에서 돌았다. 병합 전에 새 main 기준으로 mergeable 상태와 CI를 다시 확인해야 한다.

## 7. E1~E8 (권고, 팀장 공식 판정 별도)

| Gate | 권고 | 근거 / 남은 조건 |
|---|---|---|
| E1 | **PASS 권고** | W4 tree `1911f46c` 불변(main·#34·#35·#37). 공개 W4 receipt VALID: A 수정 후보 3/3 |
| E2 | **PARTIAL** (상향 근거 생김) | 신규 rehash INVALID_PROOF를 A가 수정 후보에서 1/1 실측했다. 다만 PR HEAD가 아니고 F 수정 HEAD의 재실측이 필요하다. F 결과는 OLD_CANDIDATE |
| E3 | **PARTIAL** | Desktop·Mobile emulation recovery는 F 보고뿐이다(old candidate, route abort). 반복 안정성 미확인, physical mobile NOT_EXECUTED. backup은 getLogs를 지원하지 않는다 |
| E4 | **PARTIAL** | #31·#32·#33은 독립 승인과 main CI SUCCESS 확인. #36은 **병합 전 독립 리뷰가 없었고**, 사후 감사만 있다(§5). #34·#35는 리뷰 0건이고, #37은 CHANGES_REQUESTED |
| E5 | **PARTIAL** | 8종 중 Windows fail-closed 6종 PASS, symlink/reparse NOT_EXECUTED, writable ACK SKIP, 53 SKIP, writable callback UNSUPPORTED |
| E6 | **PARTIAL** | BASE 10회: 수정 HEAD 기준 NOT_EXECUTED(A 수정 후보 3/3만). 실제 Hardhat LOCAL NOT_VERIFIED. SYNTHETIC_LOCAL은 브라우저 mock. RECORDED는 desktop recovery 클립만 있고 전체 발표 영상은 NOT_PRODUCED |
| E7 | **PARTIAL** | #35(README, ai/README) 미병합. DOC-09 PARTIAL(2·4회차 원문 없음), OPS-04 NOT_VERIFIED |
| E8 | **PARTIAL** | 480초 공동 리허설, 전체 녹화, Beat 5 근거 모두 미실행 |

GitHub 병합이 Engineering Exit PASS를 뜻하지 않는다. 다음 상태는 그대로다: S1 PENDING_APPROVAL, A/F 계약 미확정, A3·A4 미완료, LOCK 미실행, TEST SEALED, Scope Cut(Option B) 미승인.

## 8. 5회차 멘토링 기술 상태표

| 항목 | 상태 |
|---|---|
| W6 F/T/A 최초 통합 | 완료: #31 `780f2cf5`, #32 `0f0531cf`, #33 `f7c84f27`, 각 main CI SUCCESS |
| SEC-W5-01 | #36 병합(`f08b7208`). Windows fail-closed 회귀 보강. writable callback UNSUPPORTED. 병합 전 독립 리뷰 없음, A 사후 감사 완료 |
| RPC 안정화 후보 | F 보고 10/10 VALID(구 후보, 원본 미검증). chain ID 캐시 회귀를 발견하고 수정안을 검증했다(A 37/37). F 반영 대기 |
| Rehash INVALID_PROOF | A 수정 후보 1/1 실측. F 수정 HEAD 재실측 대기 |
| Recovery | Desktop / Mobile emulation: F 보고(route abort). Physical mobile NOT_EXECUTED |
| 실제 Hardhat LOCAL | NOT_VERIFIED |
| 정책 / LOCK / TEST | S1 미승인, LOCK 미실행, TEST SEALED |
| 480초 리허설 · 전체 발표 영상 | 미실행 / 없음 |
| main | `f08b7208`, CI #291 SUCCESS |

**멘토에게 구분할 점:** 블록체인 검증은 "기록된 Receipt가 변조되지 않았고 앵커와 일치한다"는 무결성만 증명한다. AI 판정의 정확성은 Model Card·평가 지표의 영역이며, TEST는 SEALED로 아직 주장하지 않는다.

**질문 후보**
1. 공개 RPC 공급자 사이 chain 전환·응답 혼합(TOCTOU)을 MVP 위협 모델에 포함해야 하는가? 매 호출 재확인(호출 2배)과 JSON-RPC batch 중 어느 쪽이 적절한가?
2. backup RPC가 `eth_getLogs`를 200블록으로 제한한다. 시연 안정성을 위해 인덱싱된 epoch 블록 번호(TrustProfile 고정값)를 쓰고 전체 범위 scan은 별도 감사 경로로 분리하는 설계가 허용 가능한가?
3. 정책 Scope Cut Option B(W4 provisional 정책 + AI-19)로 발표 범위를 한정할 때 심사에서 어떤 근거를 추가로 요구할 것으로 보는가?
4. Windows writable callback을 UNSUPPORTED로 두고 Linux 실행 환경 결과로 E5를 보완하는 방식이 충분한가?
5. Physical mobile 없이 mobile emulation과 녹화본으로 대체할 때 표기 기준은 무엇이 적절한가?
