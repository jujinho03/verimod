# VeriMod W3 팀 통합

## 상태

**TEAM_W3_INTEGRATION_PASS**. 로컬 수용 검사와 회귀가 통과했습니다.
main 공개는 검증된 fast-forward/push 후에만 완료로 봅니다. commit SHA 자기 참조를 피하려고 push 후 기록은
Git에서 제외된 `ai/artifacts/results/w3-team-integration/post-push.json`에 둡니다.

## 통합한 소스

- A main/source: `c5df2c51cb2d4b0ed7ec70af7da25a03711a8da2`; source snapshot `f6b39d3b7c5637b68e18c2b1b59ee91890c059f0`이 조상으로 남아 있습니다.
- R01 실행 기준은 `09d72598dcd1d6744d4c80b99af0721d4c1efedc`이며, 실행 source commit은 계속 null입니다.
- 실행 시점 pyproject byte hash는 기록되지 않았고, 과거 hash를 사후에 채우지 않습니다.
- 기록된 실행 핵심 파일 hash 12개가 모두 여전히 일치합니다. 승인된 지표, manifest, fixture, 가중치 참조는 바뀌지 않았습니다.
- T/F가 보고한 최신 SHA는 fetch한 원격 SHA와 일치합니다. F가 보고한 로컬 `a57bb1734d218fac6f9e12077834e3f78d8f193d`는 cherry-pick하지 않았고, 아래 정확한 원격 source commit을 썼습니다.
- T 최신 `0b6622c`는 증거 기록만 담고 있어 단독 계약 구현이 아닙니다. W3 commit 5개가 필요합니다.
- F 최신 `e5f2bdc`는 줄바꿈만 바꿉니다. 기능/문서/UI commit 8개를 선택했고 EOL 전용 commit 3개는 제외했습니다.
- 텍스트 충돌 3개는 의미에 따라 해결했습니다. contracts README는 ToolchainCheck 경계와 새 앵커 구현을, backend README는 독립 합성 데모 범위와 새 발급을, W3 progress는 갱신된 공동 상태 아래 A/T/F 과거 담당 기록을 보존합니다.
- 브랜치 전체 병합, rebase, reset, clean, force push, source 브랜치 재작성은 없었습니다.

| 담당 | 원래 source SHA | 통합 cherry-pick SHA |
|---|---|---|
| T | `cd5a0c14f2a1a15154683b2aeceed6a939e670b3` | `7ce02c0d5a93d89099f3ea3cb437b96fc4b468b7` |
| T | `64de5a3b52341a853e5c3cba575d050e941de6fb` | `6efec62d45ae64a2658eb4286aa67bad49aa5434` |
| T | `db8741ef9d830a4e6f16ace3f2606bb52a6e755c` | `9303866e0f626f1302a31c93454ff8c74b037745` |
| T | `2c7e7ef0e304f3efbcb8f2c364f93abb04391dbc` | `bc8748025b27f05d0bddb077d98848f5bc070576` |
| T | `0b6622cdcca843a7ec0638a6cf84fcf31f01ba87` | `8f1ff4b30bf0f68ea6ad83b48c0e2baac3c4513c` |
| F | `cd7a7d52cda5c971e8d426a686cb2c42a0d56b4a` | `8ce4888eab0d61d7865543cc70b071703d32f245` |
| F | `cb1b942fcdc1cfcce5cc3e7fc65437f923f10ccc` | `652a70f19591466ffb332c4e85917e887553e0f7` |
| F | `e0c07f721f909a150cc8165bf92c5dc8ef0b9c49` | `20c54f9fb793420c6bf27067af3d6978b0bed3f1` |
| F | `42c0bdfae7440896ec94d9e3f2992496f07f1d37` | `91f058e14f5c457b930948c2aa12900d6e745488` |
| F | `8d0530a3964f9e4c25315b8f406db2d2b2e960f7` | `9ee6f6d66268d844b9ef9ca079aceef909e2b8b8` |
| F | `44f0d85dd1c5e5c15753a867b1a6fb7751278c44` | `c617b948dd8f3edd9e9a941c2934dcb0e454c08b` |
| F | `d44a0ec5e90280cf7c1c8bfd5bfc94582b2420a8` | `c510f020daceaf577979db1fb18da3034a36d0d9` |
| F | `79bab8bc3cc73d0daa1e3b99d215b5080880bbc6` | `952fb3a611d1d6987748bf0a9b8e9b4e43baf21a` |

### 브랜치 전용 commit 전체 감사

전체 경로와 정확한 SHA는 [branch-audit.json](w3-team/branch-audit.json)에 있습니다. 아래 Message 열은 원래 commit 메시지를 그대로 옮겼습니다.

### T

| Commit | Message | 변경 경로 | W3 관련? | 필요? |
|---|---|---|---|---|
| `6c62e42` | docs: add W1 protocol and Base Sepolia setup | CONTRIBUTING.md, backend/, docs/ (전체 목록은 branch-audit.json) | NO — 이전 주차 | NO |
| `27e125b` | Merge remote-tracking branch 'origin/main' into seolkyeongmin | merge 이력 | NO — 이전 주차 | NO |
| `e62062d` | feat(protocol): complete W2 shared vectors and golden tests | .github/, .gitignore, backend/, docs/, frontend/, scripts/, shared/, tools/ (전체 목록은 branch-audit.json) | NO — 이전 주차 | NO |
| `072eff2` | test(protocol): close W2 golden and browser evidence gaps | frontend/e2e/protocol.spec.ts, shared/vectors/receipt-regression-results.json, tools/golden/receipt_golden.py | NO — 이전 주차 | NO |
| `06a454b` | Merge remote-tracking branch 'origin/main' into seolkyeongmin | merge 이력 | NO — 이전 주차 | NO |
| `10e8769` | feat(protocol): freeze W2 issuer sequence epochs | docs/, frontend/, shared/, tools/ (전체 목록은 branch-audit.json) | NO — 이전 주차 | NO |
| `a954d07` | merge: sync latest main into seolkyeongmin | merge 이력 | NO — 이전 주차 | NO |
| `cd5a0c1` | feat(chain): add W3 VeriMod anchor smoke path | .github/, backend/, docs/ (전체 목록은 branch-audit.json) | YES | YES |
| `64de5a3` | docs: record W3 anchor freeze evidence | docs/progress/W3.md | YES | YES |
| `db8741e` | docs: reconcile W3 trust deployment evidence | docs/spec/trust-profile.md | YES | YES |
| `2c7e7ef` | ci: run Hardhat 3 checks on Node 24 | .github/workflows/ci.yml, docs/progress/W3.md | YES | YES |
| `0b6622c` | docs: record green W3 contract CI evidence | docs/progress/W3.md | YES | YES |

### F

| Commit | Message | 변경 경로 | W3 관련? | 필요? |
|---|---|---|---|---|
| `cd7a7d5` | feat: add W3 issuance service | backend/src/app.ts, backend/src/database.ts, backend/src/inference.ts, backend/src/issuance.ts, backend/src/server.ts | YES | YES |
| `cb1b942` | docs: update W3 backend status | backend/README.md | YES | YES |
| `e0c07f7` | test: cover W3 issuance and persistence | backend/test/database.test.ts, backend/test/decisions.test.ts | YES | YES |
| `42c0bdf` | docs: record F W3 execution | docs/progress/W3.md | YES | YES |
| `8d0530a` | feat: add W3 API client preparation | frontend/src/api/client.test.ts, frontend/src/api/client.ts, frontend/src/api/types.ts | YES | YES |
| `44f0d85` | feat: add W3 verification details | frontend/src/features/FalsePositiveCasePreview.tsx, frontend/src/features/VerificationStagePanel.test.tsx, frontend/src/features/VerificationStagePanel.tsx, frontend/src/features/verificationStages.ts | YES | YES |
| `d44a0ec` | feat: integrate W3 review and verify panels | frontend/src/pages/ReviewPage.tsx, frontend/src/pages/VerifyPage.tsx | YES | YES |
| `79bab8b` | style: add W3 verification layouts | frontend/src/styles/pages.css | YES | YES |
| `35dd9f1` | chore: preserve backend source line endings | backend/src/server.ts | YES | NO |
| `a0dd6d7` | chore: preserve W3 page line endings | frontend/src/pages/ReviewPage.tsx, frontend/src/pages/VerifyPage.tsx | YES | NO |
| `e5f2bdc` | chore: preserve W3 style line endings | frontend/src/styles/pages.css | YES | NO |

## 계약 정렬

- 별도 통합 수정: `1e0e68402d1faa583d6e390b0ba2705934c06a29` (`fix(protocol): align actual BEEP taxonomy for W3 integration`).
- 실제 profile: `verimod-ko-beep-hate/1`; native class hate/offensive/none; 노출 harmful key는 정확히 hate/offensive.
- none은 참조 클래스이지 ALLOW가 아닙니다. 실제 점수는 UNCALIBRATED이며, 하위 단계에서 변환하거나 다시 반올림하지 않습니다.
- 과거 `verimod-example-ko/0`은 5개 라벨 합성 스키마와 이전 벡터를 유지합니다. 실제와 과거의 key/version/evidence label은 섞을 수 없습니다.
- TypeScript 구분 추론 타입과 스키마 profile 분기는 공유됩니다. 과거 합성 scorer/정책은 명시적으로 legacy 타입을 씁니다.
- 실제 점수 UI는 합성 threshold 표시를 적용하지 않습니다. threshold나 정책 선택은 하지 않았습니다.
- F는 hash/저장 전에 공유 Receipt 전체를 검증합니다. 호환되지 않는 스키마를 감싸던 이중 타입 변환은 제거했습니다.
- F 테스트 전용 taxonomy version `w3-fixture-1`을 실제 version `1`로 맞췄고, 형식 오류 version 테스트는 fail-closed 거부를 명시적으로 확인합니다.
- F API decoder는 실제 발급에서 PENDING_ANCHOR를 받아들이고 요구하며, 과거 2개 필드 합성 fixture도 유지합니다. 알 수 없거나 거짓으로 ANCHORED라고 하는 실제 응답은 실패합니다.
- A Model Manifest hash 변경 없음: `0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1`.

> 이후 경과(2026-10-18): main 병합 시 T/F의 W4 BEEP 구현(`BEEP_SCORE_IDS`)이 위 W3 타입 이름을 대체했습니다.
> 실제 발급 응답의 PENDING_ANCHOR 허용은 통합 수정 commit에서 W4 client에 다시 반영했습니다.

## A → F 인계

REAL_MODEL_OUTPUT_FIXTURE 기록 3건이 주입 adapter와 메모리 SQLite DB를 통해 실제 Express POST /api/decisions
route로 들어갑니다. F가 새 receipt ID, issuer_seq, 비공개 salt/commitment를 만듭니다. 전송용 content_commitment만
F의 새 비공개 salt에 다시 묶고, 기록된 모델 점수, semantic 상태, model_manifest_hash는 보존합니다. 새 모델 추론은 없습니다.

발급 3건, 공개 receipt/bundle 조회, 실제 manifest 조회, 멱등 replay가 모두 통과했습니다.
공개 응답과 커밋된 보고서에는 원문이나 issuer salt가 없습니다. 비공개 자료는 기존 데모 principal 경계를 통한
발급/replay에서만 반환하며 공동 증거에 복사하지 않습니다.
고정 HUMAN_REVIEW 정책은 공유 hash 테스트 manifest를 쓰는 테스트 의존성일 뿐이며 운영 정책 주장이 아닙니다.

> 이후 경과(2026-10-18): W4 F는 승인된 provisional 정책 hash만 발급에 허용하므로, `backend/test/helpers/w3-joint.ts`는
> F 회귀 테스트와 같은 `W4_PROVISIONAL_E2E_ONLY` threshold 평가기를 쓰도록 바뀌었습니다.

backend 회귀는 충돌 payload 409, key 없음 400, 동시 중복 요청 통합, 동시 서로 다른 issuer_seq, 재시작 지속성,
rollback도 다룹니다. 503 provider/잘못된 출력 경로는 receipts, content_store, epoch_members, idempotency 기록을
비워 둡니다. 추가 필드/라벨, 잘못된 taxonomy version, profile이 섞인 evidence는 저장 전에 거부합니다.

## F → T 프로토콜

객체 key 순서를 바꿔도 canonical bytes는 같고, 반복 계산한 receipt hash가 저장된 hash와 일치합니다.
공유 `freezeEpoch`는 기존 receipt_id 순서를 쓰며, 입력 순서를 뒤집어도 같은 root, member, proof가 나옵니다.
공유 Merkle 포함 증명 3개가 모두 통과합니다. UUID/salt가 새로 생성되므로 별도 발급 실행은 hash/root가 다릅니다.
결정성은 동일하게 발급된 body에 대한 주장이지, 발급 실행 간 주장이 아닙니다.

## 로컬 앵커

**LOCAL HARDHAT — 공개 체인 증거 아님**

| 필드 | 관측 값 |
|---|---|
| Network / chain ID | LOCAL HARDHAT / 31337 |
| Contract | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| Epoch | 1 |
| Count | 3 |
| Root | `0xcde3523e0ad12e1d4601ee53fe27441763df60d643af32b28d0438369cbd5237` |
| 등록 트랜잭션 | `0x2c6be71416ad1c899c1ae2e82e222ce945a67c8ad335c226b702ec6bae2390fa` |
| 등록 block / status | 2 / 1 |
| Getter 재조회 | MATCH (root/count/version) |
| 권한 / 중복 방지 | PASS / PASS |

공개 정보만 담은 receipt/hash/leaf/proof/checkpoint 전체 보고서는 [joint-checkpoint.json](w3-team/joint-checkpoint.json)입니다.
로컬 등록은 공개 서비스 앵커 상태를 바꾸지 않으므로 receipt는 PENDING_ANCHOR로 남습니다.
T의 과거 Base Sepolia 배포/시험 epoch 증거는 과거 합성 증거로 보존하며, 이 실제 모델 fixture의 외부 앵커로
재검증하거나 재사용하지 않았습니다. 이 통합에서 새 Base 배포, RPC preflight, 지갑 준비, 공개 체인 트랜잭션은 없었습니다.

저장소 루트에서 로컬 공동 테스트를 재현합니다(Node/패키지 설치가 이미 되어 있어야 합니다).

```powershell
npm --prefix backend ci
npm --prefix backend/contracts ci
npm --prefix backend/contracts test -- --grep "W3 A/F/T joint checkpoint"
```

공개 전용 로컬 checkpoint JSON을 의도적으로 갱신할 때만 `W3_TEAM_REPORT=1`을 설정합니다.
replay마다 새 in-process Hardhat network와 메모리 SQLite DB를 씁니다.

## 테스트

| Suite | 결과 |
|---|---|
| AI 보호 전체 테스트 | 95 passed, 27 subtests passed, 31.00s |
| Frontend 전체 | 192 passed / 18 files |
| Shared/domain 대상 | 134 passed, 실제 경계 사례 11개 포함 |
| Browser | 1 passed, 20/20 matrix |
| Backend | 20 passed / 5 files; typecheck/build PASS |
| Hardhat | 10 passed (T 원래 9개 + 실제 공동 테스트); build PASS |
| 독립 canonical / Receipt hash golden | 6/6, 5/5 PASS |
| 전체 check-all | exit 0 |

증거: [regression.json](w3-team/regression.json), [ai-tests.json](w3-team/ai-tests.json).
의존성 업그레이드나 lock 변경은 없습니다. 기존 npm 결과는 그대로입니다. frontend high 1,
backend high 1 + critical 1, contracts low 9 + moderate 1 + high 2. audit autofix는 하지 않았습니다.

## 남은 W4 경계

- 운영 요청/principal 인증과 request-hash 계약; 현재의 정확한 {text} / 데모 header는 결정적 시험 전송일 뿐입니다.
- 다중 프로세스 멱등성 lease; 현재 구현은 단일 프로세스 PoC입니다.
- 실제 모델/정책 adapter(기본값은 안전한 503), appeals/reviews, 운영 epoch freeze worker(현재 route는 501).
- 실제 RPC/TrustProfile 활성화와 정확한 min_confirmations; 실제 런타임 receipt의 공개 앵커링.
- 다른 장치 AI 검증 NOT_EXECUTED.

## 경계

TEST와 Secondary는 건드리지 않았습니다. 새 AI 학습, 데이터셋 추론, calibration, threshold, 정책 lock은 없습니다.
원시 BEEP, 가중치, checkpoint, 전체 예측, 비공개 issuer salt를 내보내지 않았습니다. 이 공동 checkpoint의 공개 Base
앵커는 없습니다. PENDING_ANCHOR. 블록체인은 AI의 정확성, 실제 모델 실행, 생성 시점의 진실성, 전역 로그 완전성/최신성을
증명하지 않습니다.
