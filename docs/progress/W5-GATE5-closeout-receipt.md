# W5 GATE-5 마감 영수증 — 판정 초안 (2026-10-25, 21:00 KST 판정용)

작성: A / 주진호(팀장) · 기준 main: **`efce466d`** · 상태: **판정 초안. 최종 판정은 팀장이 21:00에 확정한다.**

이 문서는 main에 들어간 이후의 후속 기록이며 `jujinho` 브랜치에만 있다. 이 문서를 넣기 위해 main에 추가 커밋을 하지 않았다.

## 1. 통합 이력

| PR | Head | Merge commit | 독립 리뷰 | CI |
|---|---|---|---|---|
| T #28 | `cd5b1c53` | `639030b3` | `ysn-0215` APPROVED (`cd5b1c53`). 이전 head에는 CHANGES_REQUESTED가 있었고 수정 후 해소 | head #250/#251, main #252 SUCCESS |
| F #29 | `19be2b79` | `03296595` | `k0ng-min` APPROVED (`19be2b79`) | head #258/#259, main #264 SUCCESS |
| A #30 | `98c6f3b0` | **`efce466d`** | `ysn-0215` APPROVED (`98c6f3b0`) | head #265/#266, main **#267 SUCCESS** |

- **최종 main:** `efce466df24c916fb2be1bf075176137fd4c4332`. 부모는 `03296595`와 `98c6f3b0`이다.
- **최종 main CI #267 (push):** frontend·backend·contracts 모두 success.
- **포함 확인:** T(`cd5b1c53`), SEC(`baf8b36b`), F(`19be2b79`), A(`98c6f3b0`, `c4945ab6`)가 모두 main의 조상이다.
- **최종 main 트리 = 승인된 A head `98c6f3b0` 트리.** merge가 파일을 바꾸지 않았다는 뜻이다.
- 모든 merge는 일반 Merge Commit으로 했고, head SHA를 고정했다. squash·rebase·force는 쓰지 않았다.

## 2. 테스트 증거 — 출처별로 구분, 합산하지 않음

| 증거 | 결과 | 기준 SHA | 출처 |
|---|---|---|---|
| A Python 전체 | 307 passed + 27 subtests, 0 fail/error | `c4945ab6` (이후 `98c6f3b0`·`efce466d`까지 코드 변경 0) | [A verification](../../ai/artifacts/reports/w5_final_integration/20261025-c4945ab6/verification.json) |
| AI-12 `test-evaluate` | exit 3 = **EXPECTED_BLOCK** | `c4945ab6` | 같은 증거 |
| GitHub CI | frontend/backend/contracts SUCCESS | `efce466d` (#267) | GitHub Actions |
| Frontend 단위 | 250 PASS | F 기준 SHA | F 증거 (`docs/evidence/w5-f/`) |
| Backend Windows | 153 PASS / **53 SKIP** | F 기준 SHA | F 증거 |
| Backend Linux | 199 PASS / **7 SKIP** | F 기준 SHA | F 증거 |
| Desktop / Mobile | 12 PASS / 12 PASS. **Mobile은 emulation이며 실기기가 아님** | F 기준 SHA | F 증거 |
| LIVE-RPC 브라우저 | **0 PASS / 6 SKIP (미실행)** | — | F 증거 |
| W4 무결성 (A 범위) | 45개 파일, `ba8b7bc` 이후 변경 0 | `c4945ab6` | A 증거 |
| W4 무결성 (F 범위) | 53개 파일 SHA-256 일치 | F 기준 SHA | `docs/evidence/w5-f/integration-20261024/w4-sha256.json` |

A 45개와 F 53개는 점검 범위가 서로 달라서 합산하지 않는다. SKIP은 PASS가 아니다.

## 3. 보안 — SEC-W5-01

- **위험 동작 차단:** direct-path 재열기 패치는 어느 브랜치에도 들어가지 않았다. main에는 `baf8b36` fail-closed가 들어 있다. Windows에서 승인된 writable callback DB를 열면 `WINDOWS_WRITABLE_NO_CREATE_UNSUPPORTED`로 거부한다.
- **정상 기능 미지원:** Windows의 승인된 writable callback은 **UNSUPPORTED**다. A의 Windows 노트북(authoritative DB 위치)에서는 F callback을 실행할 수 없다.
- 상태: **OPEN** (W6). [SEC-W5-01](../security/sec-w5-windows-sqlite-reopen-hold.md)

## 4. 정책·평가 경계

S1은 RECOMMENDED / **PENDING_APPROVAL**이다(X=3/50, B=9/20, H50-90_O50-90 추천). 그 외 상태는 다음과 같다:
- `team_approved=false`
- 신규 Policy Manifest/hash 미생성
- A/F 정책 계약 PROPOSED
- Python/Node parity 미실행
- Model/Policy LOCK 미실행
- **TEST SEALED**

## 5. G5-01~G5-07 판정 초안 (최종 main `efce466d` 기준)

| Gate | 판정 초안 | 근거 | 미충족 |
|---|---|---|---|
| G5-01 | **BLOCKED** | Validation 비교와 S1 초안은 완료 | 팀장 X/B·후보 승인, Manifest, LOCK. 코드 통합으로는 충족되지 않는다 |
| G5-02 | **BLOCKED** | Guard 합성 PASS, EXPECTED_BLOCK | LOCK, 별도 최초 TEST 승인, 1회 평가 |
| G5-03 | **PASS 후보** | W4 원본 증거 불변(A 45 / F 53, 범위별), T TEST-05 공개 RPC 재확인 | — |
| G5-04 | **PASS 후보** | T lifecycle 연결·전이(+UUID/hash 우회 수정)와 F Synthetic UI가 main에 있음. 독립 리뷰 APPROVED, main CI SUCCESS | 발표 화면의 SYNTHETIC 표기 최종 확인 |
| G5-05 | **PASS 후보 (제약 명시)** | F Private Package·legacy storage 명시적 정리·SEC fail-closed가 main에 있음 | Windows writable callback UNSUPPORTED. 기능 미지원이며 PASS 범위 밖으로 기록 |
| G5-06 | **PARTIAL** | RPC 상태 분리 코드, Desktop/Mobile emulation 24 PASS | LIVE-RPC 6 SKIP, 실기기 QA 미실행 |
| G5-07 | **PARTIAL** | A/T/F 최종 main CI #267 SUCCESS, A Python 307 | DOC-09 PARTIAL(2회차 원문 미확인), 리허설 미실시, G5-01/02 미충족 |

**종합 초안: PARTIAL.** 코드 통합과 CI는 완료됐지만 승인 절차(G5-01/02)와 실측 QA(G5-06)가 남았다. 미통과 규칙에 따라 SHOULD=0, 신규 기능=0을 유지하고 W6 초반에 남은 MUST부터 처리한다.

## 6. W6 이월 MUST

1. S1 X/B·후보 승인 → A/F 정책 계약 합의 → Manifest·parity·fail-closed → LOCK → 별도 TEST 승인 → 1회 평가
2. LIVE-RPC 공개 RPC 브라우저 실측(읽기 전용), 실기기 Mobile QA
3. SEC-W5-01: Windows callback 실행 방안 또는 비 Windows 실행 환경 결정(새 Epoch·SEED-01 전제)
4. 모델 런타임 binding(tokenizer 파일 hash, 서비스 lock) 구현
5. DOC-09 2회차 원문 확보 또는 "미확인" 유지, 8분 리허설

## 7. 팀장 결정 사항

1. **21:00 GATE-5 최종 판정:** 위 초안(PARTIAL)을 채택할지 결정
2. **S1 승인 여부:** X=3/50, B=9/20, H50-90_O50-90 그대로 갈지, S2로 갈지, W6로 미룰지
3. **SEC-W5-01 실행 환경:** W6에서 새 Epoch가 필요하면 어디서 실행할지

## 8. 최종 판정 반영 — 2026-10-25 20:23 KST

§5의 판정 초안 중 G5-03·04는 PASS, G5-05는 원래 요구사항(권한/멱등)과 대조해 **PARTIAL**로 확정했다(Windows 53 SKIP). **종합 PARTIAL** (PASS 2 / PARTIAL 3 / BLOCKED 2). 확정 시각·판정자·사유는 [판정 기록 §3](W5-GATE5-decision-record.md)에 있다.

**W5: CLOSED — GATE-5 PARTIAL / W6 MUST CARRYOVER.** 기준 main `efce466d`, CI #267 SUCCESS. 이 영수증의 §4(정책·평가 경계)는 그대로 유효하다.
