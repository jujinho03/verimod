# VeriMod Backend — 한국어 실행·구현 안내

## 2026-10-30 W7 상태 업데이트

아래 W3/W4 문단은 병합 전 시점의 역사 기록입니다. W4 HTTP adapter·Freeze·confirmation 등의 코드는 이후 main에 통합됐고 W4 Epoch 1은 2026-10-20 Base Sepolia에 실제 등록됐습니다. [W4 공개 증거](../docs/handoffs/w4-anchored-epoch-public/20261020-r01/README.md)와 [현재 W7 실행 안내](../docs/08-submission-guide.md)를 참조하세요.

서버 기본값은 fail-closed이며 실제 R01 발급은 `VERIMOD_W4_PROVISIONAL_E2E_ONLY`, 로컬 inference URL 및 일치하는 모델·정책 manifest와 threshold 설정을 필요로 합니다. 데모에는 새 비운영 SQLite 경로를 명시하고 원본 운영 DB를 지정하지 않습니다. 이 서버는 loopback에 바인딩하며 브라우저가 다른 origin인 경우 별도의 검증된 same-origin proxy 또는 CORS 구성이 필요합니다. Python `/infer` 성공만으로 브라우저→Node 발급이 검증된 것은 아닙니다. 신규 발급은 새 앵커 전 `PENDING_ANCHOR`입니다. 연구 정책 승인·LOCK·TEST를 의미하지 않습니다.

## main의 구현 범위 — 역사 기록 (W3 시점)

main 실행 코드는 W3 영수증 발급 경계입니다. 실제 모델 출력 fixture를 재생하는 공동 테스트는 있지만 서버에 W4 실제 모델 HTTP adapter/정책/Freeze/confirmation을 병합한 상태는 아닙니다. 최신 구현은 [F c1f750e](https://github.com/jujinho03/verimod/tree/c1f750ea3752037d749324f1535df051ce6b37f9/backend), 실제 R01 환경은 A 브랜치를 확인합니다.

- SQLite 7테이블: receipts/content_store/epochs/epoch_members/appeals/reviews/idempotency_records.
- POST /api/decisions: demo principal, 필수 Idempotency-Key, 같은 요청 재생·다른 요청 409, private 발급 자료 분리.
- 공개 Receipt/미앵커 Bundle/Manifest 조회.
- 기본 adapter는 503 INFERENCE_UNAVAILABLE로 실패하며 영수증을 생성하지 않습니다.
- main의 appeal/review workflow와 epoch freeze는 후속 구현 전 501 경계입니다.

Demo header는 인증/신원 증명이 아닙니다.

```text
x-demo-principal: <데모 주체>
x-demo-role: DEMO_USER | DEMO_REVIEWER | DEMO_OPERATOR
```

main 공동 테스트는 A 선정 모델의 실제 출력 fixture를 별도로 재생합니다. fixture 재생을 새 실제 모델 호출로 계산하지 않습니다. Native 3-class와 외부 2-score profile을 legacy synthetic 5-score와 구별합니다. 테스트의 고정 HUMAN_REVIEW는 운영 정책/LOCK이 아닙니다.

[W3 통합 원본](../docs/evidence/w3-team-integration.md)을 보존합니다.

## W4의 별도 구현과 실행 증거 — 당시 기록

최신 F에는 실제 Python HTTP adapter, 승인 Model/Policy Manifest 내용/hash/threshold binding, SQLite Freeze, durable prepare ACK, trusted submitted/confirmed와 public release gate가 있습니다. 이는 F 소스의 구현 범위이며 main 배포가 아닙니다.

A의 실제 R01 연동은 정상 2건/Fail Closed 17건/parity 21건을 통과했고, 후속 실제 발급 2건을 Epoch 1로 Freeze했습니다. 최신 원본 DB status는 FROZEN/tx_hash=null입니다. 실제 Epoch 송신·F confirmation·외부 브라우저 결과는 없습니다.

- [W4 통합 현황](../docs/progress/W4.md)
- [실제 A 실행 해설](../docs/evidence/w4-a-actual-frozen-epoch.md)
- [F 192개 합성/RPC stub 검사](../docs/evidence/w4-f-confirmation/20261017/README.md)
- [사설 Callback/운영 승인](../docs/handoffs/W4-AFT-operations.md)

## main의 개발 명령

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```

VERIMOD_DB_PATH가 main의 개발 SQLite 위치를 선택하고 기본값은 ./data/verimod.sqlite입니다. **A의 원본 authoritative DB를 이 main 서버에 지정하지 마세요.** 일반 openDatabase 경로는 migration/중단 claim 정리를 수행할 수 있습니다. 기존 DB 운영은 고정 F Runner와 호스트 승인 config를 사용합니다.

## 공개·비공개 경계

원문·salt·private package·raw signed transaction·DB 경로는 공개 Bundle/로그/Git에 넣지 않습니다. 실제 원본 DB는 A에, Publisher 키는 T에 둡니다. 정책 provisional/team_approved=false와 TEST SEALED를 유지합니다. 이번 갱신은 문서이며 새 테스트·DB lifecycle·체인 요청을 실행하지 않았습니다.
