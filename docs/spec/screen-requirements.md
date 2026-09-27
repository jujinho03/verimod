# FE-00: 화면 요구사항과 기존 UI audit

담당: 노유신 · 상태: 요구사항 초안 및 정적 코드 audit 완료. 브라우저 시각 점검은 미실행.
근거: PDF pp.6, 25, 33, 38–40, 43–47, 49. 저장소 f807585의 실제 소스를 확인했다. 아래 요구사항의 현재 구현 근거와 차이는 [UI audit](ui-audit-w1.md)에 기록한다. 브라우저 실행 화면은 이번에 확인하지 않았다.

## 1. 재사용 점검 결과

[정적 UI audit](ui-audit-w1.md)에 실제 route·컴포넌트·파일 위치·CURRENT/TARGET 차이를 기록했다. 기존 화면을 재사용하며 새 scaffold는 만들지 않는다.

## 2. 화면별 필드·행동 계약

| 화면/영역 | 표시·입력 | 근거/authority | 필수 상태·행동 |
|---|---|---|---|
| 판정 입력 | 원문, supported taxonomy에 따른 점수·action·reason_codes·triggered_rule_ids·model manifest hash | 입력 원문은 브라우저, 추론은 I1, 판정은 서버 receipt | fixture는 합성 표시; 503은 발급 실패; ALLOW 대체 금지 |
| 발급 receipt | body/hash, 앵커 대기 표시 | authoritative server issuance | fresh receipt는 PENDING; 원문 echo 불필요 |
| 검증 보고 | core code·PASS/FAIL/PENDING | shared verifier+T LedgerReader | 아래 상태 매핑, 재검증 제공 |
| chain 정보 | 활성 TrustProfile, chain ID, contract address | 승인된 빌드 내장 프로필 | LOCAL 고정 배지; 실제 tx_hash가 있을 때만 탐색기 링크 |
| Package | 저장/불러오기·content 결과 | verified body의 receipt_id/content_commitment | 브라우저 원문+material 조립; 공유 시 원문 노출 안내 |
| 이의 | 본인 RESTRICT 대상·이의 본문 | 원 DECISION+서버 권한/전이 | APPEAL 1건; 제출 중 중복 click 제어; 재시도 같은 key |
| 검토 | outcome/resulting_action/reason | reviewer role+허용 전이 | UPHOLD/OVERTURN/RESOLVED 구분; terminal 이후 비활성 |
| timeline | DECISION/APPEAL/REVIEW·각 core·연결/전이 결과 | 제공받은 receipt set | 원 판정 유지; '제공받은 기록 기준'; 최신/전체 보증 금지 |
| 변조 패널 | 원본·변조본, scores_ppm.<label> diff | 같은 사전 확정 seed | body 변조와 재hash 공격 별도 실행; 동일 verify 버튼 |
| epoch 운영 | freeze·5상태·실패 사유 | operator API, DB/sender 상태 | 빈 freeze 409; 재시도 같은 id/root |

불필요한 span UI는 SHOULD. label 5개나 Base confirmation=12를 고정하지 않는다. 새 필드를 ReceiptBody에 추가하지 않는다. 서버 상태와 검증 결과를 같은 변수로 표현하지 않는다.

## 3. core 상태 매핑

| code | 판정 | 사용자 표시 |
|---|---|---|
| VALID | PASS | 받은 기록의 무결성·신뢰 앵커·포함·확정 검증 성공 |
| HASH_MISMATCH | FAIL | 본문과 기록된 해시 불일치 |
| INVALID_PROOF | FAIL | 포함 증명이 신뢰 root/count와 불일치 |
| UNTRUSTED_ANCHOR | FAIL | 승인 프로필과 불일치 |
| UNSUPPORTED_VERSION | FAIL | 미지원 protocol version |
| RPC_UNAVAILABLE | PENDING | 네트워크/설정 문제로 검증 보류 |
| PENDING_ANCHOR | PENDING | 미등록·미확정·등록 block 확인 대기 |

anchor lifecycle은 FROZEN/SUBMITTING/SUBMITTED/CONFIRMED/FAILED로 별도 표시한다. content side-check는 PASSED/FAILED/NOT_CHECKED, lifecycle은 PASSED/FAILED/INCOMPLETE_HISTORY/NOT_CHECKED다. core VALID 옆에도 side-check 실패/미확인을 숨기지 않는다. 일부 선행 기록 누락은 현재 core FAIL의 근거가 아니다.

## 4. Package 검증·개인정보

정확한 파일 필드: package_version, receipt_id, original_text, content_salt, content_commitment.
먼저 core가 성공해야 한다. verified body의 id와 commitment를 authority로 삼는다. Package commitment는 복사본이다. 원문/salt/copy를 함께 바꿔도 verified body와 다르면 FAILED다. 자료 없음/core 미성공은 NOT_CHECKED다.

저장 버튼은 브라우저에 입력 원문과 정상 발급 material이 있을 때 활성화한다. 원문을 잃은 상태에서 public GET으로 복구할 수 있다고 안내하지 않는다. 공개 evidence에는 synthetic text만 쓴다. 발급 응답/log/error를 그대로 캡처해 salt를 공유하지 않는다.

## 5. W1에서 작성한 후속 검증 시나리오 (미실행)

1. fresh receipt: PENDING, tx_hash 없으면 tx link 없음.
2. RPC 장애·다른 chain 응답: PENDING, 변조 경고 아님.
3. bundle locator가 공격자 contract: UNTRUSTED_ANCHOR.
4. score만 변경: HASH_MISMATCH; 같은 seed 재hash: INVALID_PROOF.
5. Package 원문 1글자/salt/id/copy 각각 변경 및 원문+salt+copy 동시 변경: FAILED.
6. Package 자료 없음/core 미성공: NOT_CHECKED.
7. LOCAL 선택: '로컬 폴백 - 공개 체인 증거 아님' 고정 표시.
8. inference unavailable: 503, 새 DECISION 없음, 같은 키 재시도.
9. 원 판정이 ALLOW 또는 terminal REVIEW 존재: 허용되지 않는 lifecycle 제출 409.
10. 원 판정은 그대로, resulting_action만 최종 조치로 표시.

## 6. 증거 수집 기준

최신 commit·테스트 명령/로그·실제 route/파일 위치·안전 처리 screenshot을 W1.md에 연결한다. 기존 screenshot은 CURRENT 합성 PoC로 표시하되 실제 확인 날짜/commit을 함께 기록한다. 이번 문서에는 실행하지 않은 UI PASS나 screenshot 완료 주장이 없다.

