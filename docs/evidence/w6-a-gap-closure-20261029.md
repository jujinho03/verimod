# W6 기술 공백 — 최신 main 기준 A 감사

기준: 2026-10-29 확인한 main `f7c84f27ff964d114cacc8c5c181b4df8b9f766b`. 이 문서는 수행할 작업과 기존 증거를 구분하는 **판정 제안**이며 팀장의 공식 Exit 판정이나 Scope Cut 승인이 아니다. [기존 E1~E8 매트릭스](w6-a-closeout/e1-e8-matrix.md)는 PR 병합 전의 역사적 스냅샷으로 보존한다. F `#31` merge `780f2cf5559212460b1aa283db537e172a4373d9`, T `#32` merge `0f0531cf0c621c446c6f5ee12d928d1cf617ec6c`, A `#33` merge `f7c84f27ff964d114cacc8c5c181b4df8b9f766b` 및 각 병합 후 CI 성공은 [사후 통합 기록 PR #34](https://github.com/jujinho03/verimod/pull/34)의 별도 기록 대상이다. #34는 이 문서 작성 시 OPEN이며 승인은 확인되지 않았다.

공통 경계: 읽기 전용 공개 RPC 검증만 허용한다. W4 증거 수정, 신규 체인 송신, TEST 접근, 운영 DB 변경, S1 확정, Model/Policy LOCK과 RPC 검증 완화는 이 작업의 범위가 아니다. 로컬 보고·과거 실측·CI·실기기 결과를 서로 대체하지 않고 SKIP을 PASS로 계산하지 않는다. 성공 기준은 실제 로그와 실행 SHA를 확인한 후에만 적용한다.

| Gate | 기존 권고 → 현재 제안 | 충족된 조건 | 미충족 조건 |
|---|---|---|---|
| E1 | PASS 권고 → **PASS 권고** | W4 tree `1911f46c9e19000d25a7ffb5f86f1c2ba781a1ee` 불변. W6 A의 동일 공개 receipt VALID 2회 기록 | 공식 팀장 판정 별도. BASE 10회 안정성은 E6에서 미충족 |
| E2 | PARTIAL → **PARTIAL** | 원본 VALID, body 변조 HASH_MISMATCH, proof sibling 변조 INVALID_PROOF 기록 | body 변경 후 hash 재계산과 기존 proof를 결합한 신규 INVALID_PROOF 실측 미완료 |
| E3 | PARTIAL → **PARTIAL** | F의 Desktop `VALID → RPC_UNAVAILABLE → VALID` 1회 보고; route abort 주입 | 원본 로그 독립 대조, 반복 안정성, mobile 복구 및 physical mobile 실측. T mobile은 100초 timeout |
| E4 | PARTIAL → **Git 통합 PASS 후보** | #31/#32/#33 독립 승인, 일반 merge, 각 병합 후 main CI 성공 | 팀장 최종 판정. Git 통합 성공은 전체 Exit 성공이 아님 |
| E5 | PARTIAL → **PARTIAL** | Windows no-create/fail-closed 경계와 UNSUPPORTED 유지 | SEC-W5-01 8종 assertion·실행 근거 완결 미확인; Windows 53 SKIP 유지 |
| E6 | PARTIAL → **PARTIAL** | W4 BASE seed 및 AI-19 물리 오프라인 R01 추론 1회 | BASE 연속 10회 NOT_MET, 실제 Hardhat LOCAL NOT_VERIFIED, 녹화본 RECORDED_READY=false |
| E7 | PARTIAL → **PARTIAL** | Data/Model Card와 T 정정 문서가 main에 존재 | README·새 main 문서 정합성 검토, DOC-09/OPS-04 원문 대조. 각 source가 없으면 NOT_VERIFIED |
| E8 | PARTIAL → **PARTIAL** | 일부 Beat의 과거 실측 기록 존재 | 실제 3인 480초 리허설, 검증된 녹화 및 Beat 5 안정성 근거 |

## 실행·책임·승인·대체 경로

### E1 — W4 core 재현

- **Owner:** T(체인), F(검증 UI), A(감사). **근거:** main `f7c84f27`, W4 tree 위 값, [기존 매트릭스 E1](w6-a-closeout/e1-e8-matrix.md), [W4 공개 자료](../handoffs/w4-anchored-epoch-public/20261020-r01/README.md). W6 A 실측 코드는 `44842f78`, 2 VALID / 8 RPC_UNAVAILABLE·SKIP이다.
- **작업/명령:** `git rev-parse HEAD:docs/handoffs/w4-anchored-epoch-public/20261020-r01`로 tree 확인. 별도 재현이 필요한 경우 프런트엔드에서 승인된 공개 RPC 읽기 전용 `W5_LIVE_RPC=true`와 `npx playwright test -c playwright.w5.config.ts --project desktop --grep "live public RPC receipt-0"`를 실행하고 결과·SHA를 기록한다. PowerShell에서는 환경 변수를 `$env:W5_LIVE_RPC='true'`로 설정한다.
- **승인:** 읽기 전용 재검증 자체에 신규 송신 승인은 필요하지 않다. **성공:** 동일 W4 seed VALID와 동일 tree를 확인. 10회 KPI는 별도다. **실패 시:** 과거 W4 성공 증거로 전환하고 과거 실행임을 명시한다. **예상 파일:** 재현 요약 증빙만 별도 추가; W4 원본은 변경하지 않는다.

### E2 — 변조 판정

- **Owner:** F 실행, T 리뷰, A 통합. **근거:** `44842f78`의 A 기록과 main `f7c84f27`의 [F 실행 기록](../progress/W6-F.md). proof sibling 변조와 rehash 변형은 서로 다른 입력이다.
- **작업/명령:** F가 W4 receipt body를 변경하고 새 receipt hash를 계산한 뒤 기존 proof/anchor를 유지해 공개 RPC 읽기 전용으로 검증한다. 기존 `frontend/e2e/w6.spec.ts`와 `npm run w6:browser`의 해당 테스트를 확인하고 대상 테스트·환경·입력 hash·출력·SHA를 기록한다. 실패나 SKIP도 그대로 기록한다.
- **승인:** 신규 체인 송신 없이 진행. rehash 대신 sibling 변조를 Beat 4로 발표하는 선택은 팀장의 명시적 범위 결정이 필요하다. **성공:** 변경 body·재계산 hash·기존 proof/anchor를 확인하고 새 실행에서 INVALID_PROOF 관측. **실패 시:** 승인되면 기존 proof sibling 변형을 별도 방식으로 정확히 표시하거나 기존 기록으로 전환. **예상 파일:** F의 실행 증빙 및 필요 시 독립 리뷰 기록; W4 원본 불변.

### E3 — RPC 장애와 복구

- **Owner:** F 실행, T 독립 검토, A 감사. **근거:** F head `1620f82c6cf523d7796273f7f816ed022e50953f`의 [RPC 요약](w6-f/20261027/rpc-recovery-review.json)과 T head `681e3743f38a505be680a195232b1aef3d0fa997`의 [실행 영수증](w6-t-execution-receipt-20261027.md). 원본 로그는 아직 A가 직접 검증한 것으로 취급하지 않는다.
- **작업/명령:** F/T는 동일 receipt hash·실행 SHA·승인된 endpoint·차단 및 해제 시각을 기록하고 `npm run w6:rpc-recovery`로 재측정한다. 라우트 차단은 물리 네트워크 차단이 아니다. mobile emulation과 실제 기기를 구분한다.
- **승인:** 기존 읽기 전용 절차와 승인된 RPC만 사용; 코드 최적화·검증 완화는 별도 승인과 T 보안 리뷰 필요. **성공:** 같은 receipt로 VALID→RPC_UNAVAILABLE→VALID 순서와 원본 로그, 반복 결과 및 실기기 범위를 증명. **실패 시:** RPC_UNAVAILABLE을 그대로 표시하고 모드가 명시된 synthetic 또는 확인된 녹화 경로로 전환. **예상 파일:** F/T 결과 요약 및 독립 리뷰, 필요 시 별도 승인된 코드 PR.

### E4 — Git 통합

- **Owner:** A 통합, T/F 독립 리뷰. **근거:** main `f7c84f27`, 병합 #31 `780f2cf5`, #32 `0f0531cf`, #33 `f7c84f27`; 최종 main [CI run 40785603829](https://github.com/jujinho03/verimod/actions/runs/40785603829). 기존 PRELIMINARY 매트릭스의 merge 0은 당시 기록이다.
- **작업/명령:** `git merge-base --is-ancestor 780f2cf5559212460b1aa283db537e172a4373d9 HEAD`와 `git merge-base --is-ancestor 0f0531cf0c621c446c6f5ee12d928d1cf617ec6c HEAD`, GitHub PR 리뷰·main CI를 확인한다.
- **승인:** 각 PR의 독립 승인과 팀장 Exit 판정은 별개. **성공:** 세 PR의 해당 HEAD 승인·일반 merge·main CI 세 job 성공 확인. **실패 시:** 불일치를 기록하고 통합 완료 판정을 보류. **예상 파일:** 별도 통합 기록 PR; 병합된 A HEAD 및 역사 기록은 수정하지 않는다.

### E5 — 보안 회귀

- **Owner:** T 구현·증거, F 경계 검토. **근거:** main `f7c84f27`, [T 실행 보고](w6-t-execution-receipt-20261027.md), [Windows hold](../security/sec-w5-windows-sqlite-reopen-hold.md). 보고의 테스트 숫자는 원본 로그를 확인하지 않은 로컬 보고다.
- **작업/명령:** T가 삭제 경쟁·교체·identity·symlink/reparse·미승인 DB·header/schema·no-create·durability 8종마다 테스트 경로, assertion, SHA, OS, PASS/FAIL/SKIP 원본을 제시한다. 비 Windows 환경에서 가능한 항목은 해당 환경별 명령과 로그를 별도로 기록한다.
- **승인:** T1 실행 환경은 팀장 결정, 코드 변경은 별도 PR 및 독립 리뷰. 운영 DB나 실제 개인정보는 사용하지 않는다. **성공:** 8종 각각에 해당하는 assertion과 실행 증거 확보; SKIP은 미완료 유지. **실패 시:** 미검증 항목과 Windows writable callback UNSUPPORTED를 발표 범위에서 명시. **예상 파일:** T 보안 테스트와 증빙·리뷰 PR.

### E6 — BASE / LOCAL / Offline / RECORDED

- **Owner:** F/T BASE 및 LOCAL, A Offline, 전원 녹화. **근거:** `44842f78`의 [BASE 기록](w6-a-closeout/base-kpi-a-local-20261027.json)과 [AI-19 판정](w6-a-ai19-offline/ai19-final-assessment.md); 최종 main `f7c84f27`.
- **작업/명령:** E1 공개 RPC 테스트를 기존 매트릭스의 `--repeat-each 10` 조건으로 실행해 전 결과와 SHA를 기록한다. 실제 LOCAL은 Hardhat 노드와 그 노드를 읽는 검증 경로를 입증한 후 3회 검증한다. 녹화는 파일 존재·재생·모드·촬영 시점·증거 SHA와 민감정보 비노출을 확인한다.
- **승인:** 실제 Hardhat 경로 개발이나 데모 범위 변경은 팀장 결정과 별도 리뷰가 필요하다. **성공:** BASE 10회, 실제 LOCAL 3회, 안전하게 재생되는 RECORDED와 별도 offline 증거가 각자 충족. **실패 시:** `SYNTHETIC_LOCAL`은 브라우저 모의 원장으로만 표시하고 녹화가 없으면 RECORDED를 준비됐다고 주장하지 않는다. **예상 파일:** F/T 실행 요약과 전원 녹화 검증 기록; 영상에 원문·salt·키·DB·비밀 경로를 넣지 않는다.

### E7 — 카드·README·근거 정합성

- **Owner:** A. **근거:** main `f7c84f27`의 [Data Card](../data-card.md), [Model Card](../model-card.md), [AI-19](w6-a-ai19-offline/ai19-final-assessment.md), 정정된 [T 색인](w6-t-integration-evidence-20261028.md). AI-19는 R01 오프라인 추론 1회이며 새 AI→Receipt→anchor 전체 경로를 증명하지 않는다. tokenizer hash 수집은 runtime binding이 아니다.
- **AI-19 기록 불일치:** `physical-offline-result.json`의 당시 전체 `git.tracked_changes`에는 `M docs/eval/w5-model-card-limitations.md` 1건이 있으나 판정 문서 서두는 추적 변경 0으로 기술한다. probe의 해당 필드는 전체 추적 작업 트리를 조회하며 `w4_scope_changed_since_ba8b7bc=[]`는 별도 W4 범위 검사다. 두 기술의 정의·시점 차이 및 해당 변경의 추론 영향 여부는 아직 확인되지 않았다. JSON 원본을 보존하고 추가 대조 전 전체 작업 트리가 깨끗했다고 주장하지 않는다.
- **AI-19 재감사 범위:** 결과 JSON은 실행 당시 코드 `44842f78fdc8102507b9f3aeeed5d0eda8e9eeaf`, `/healthz`·`/infer` 200 및 물리 오프라인 확인을 기록한다. 공개 probe의 Git blob(LF) SHA-256 `46193fafb3599294b8d829a17510237b632dd33cf0d22762928c37005a9db090`을 재계산해 일치 확인했다. Windows 체크아웃은 줄바꿈이 바뀌므로 raw 파일 hash는 다를 수 있다. 기존 artifact 기록의 Manifest LF SHA-256 `0163a8bc1d06e12d248fda7abdf7c940bb246bdcf91cebac05dd33b8bafc76a2`는 예상값과 일치하며, tokenizer 4파일의 hash는 수집 기록일 뿐 서비스의 hash 검증이 아니다. 서버 원본 로그는 공개 Git에 없고 로컬 로그는 서버 기동만 보여 주므로 HTTP·격리 결과는 JSON 기록에 근거한다. 이번 감사에서 추론을 재실행하지 않았다.
- **DOC-09 원문 대조:** 로컬 1회차 PDF(13쪽, SHA-256 `bcf51a61614c6ea707e03adcd8b8dc95cf75c283a0f6f208149cfb6ceba658bb`)와 3회차 피드백 PDF(3쪽, `9a69a1ea8343e5a109823067d67ff27c20592b63367507b3d007fbc3af96abab`)를 [멘토링 추적표](../mentoring/w5-mentoring-traceability.md) 및 [3회차 기록](../mentoring/session-03-20261020-lee-jaewon.md)과 대조했다. 무결성과 AI 정확성 구분, L2 확인과 L1 finality 구분, RPC 장애 구분, 합성 Appeal의 범위는 원문 권고와 부합한다. 3회차 정책 수치는 권고 예시이며 X/B 승인 기록이 아니다. 새 입력→발급→앵커→검증은 멘토 권고 목표이지 신규 전체 라이브 실행 증거가 아니다. 2·4회차 원문은 확인한 로컬 자료에서 발견되지 않았다(기존 보유 보고는 SOURCE_AVAILABLE_BUT_NOT_LOCALLY_VERIFIED). DOC-09 전체는 PARTIAL이다. CNU MATE 사용 매뉴얼과 활동 일지는 제출·수신 증빙이 아니므로 OPS-04는 NOT_VERIFIED다. 원문은 저장소에 추가하지 않았다.
- **작업/명령:** `git ls-tree -r --name-only HEAD` 및 문서 내 상대 링크를 확인하고 `ai/README.md`와 필요한 루트 README만 현재 상태로 갱신한다. DOC-09/OPS-04는 실제 원문을 찾은 경우에만 대조한다.
- **승인:** 문서 PR 독립 리뷰. **성공:** 최신 SHA 및 실행 범위가 일치하고 링크가 유효하며 DOC-09/OPS-04 원문과 대조 완료. 원문이 없으면 SOURCE_NOT_AVAILABLE 또는 NOT_VERIFIED를 유지. **실패 시:** 확인 가능한 근거만 제시하고 미확인 사항을 명시. **예상 파일:** `ai/README.md`, 필요 최소한의 `README.md`, 새 감사 문서. 과거 W4/W5 기록은 덮어쓰지 않는다.

### E8 — 480초 5-Beat 리허설

- **Owner:** A 주관, F/T 공동 실행. **근거:** [W7 준비도](w6-a-closeout/w7-demo-readiness.md), main `f7c84f27`. 기존 표의 시간은 추정이며 리허설 결과가 아니다.
- **작업/명령:** 실제 발표 PC·브라우저·네트워크에서 3인이 다섯 Beat와 fallback 전환을 1회 이상 수행하고 시작·종료 시각, 각 상태·모드·SHA를 기록한다. 녹화가 있으면 재생과 민감정보 노출을 별도 점검한다.
- **승인:** rehash 대신 proof sibling 시연 선택과 synthetic 범위는 팀장 결정. **성공:** 실제 480초 내 완료, 각 화면 출처 및 fallback 확인, 재생 가능한 안전한 녹화 확보. **실패 시:** 확인된 과거 W4 증거 또는 실제 준비된 모드로 전환하고 실행하지 않은 단계는 미실행으로 밝힌다. **예상 파일:** A의 리허설 시트와 실행 후 실제 결과 기록; 녹화물 공개 여부는 민감정보 점검 후 별도 판단.

## 정책 선택 — 결정 전

- **Option A / FULL:** S1 또는 S2 후보 승인 → A/F 계약 → Manifest·Python/Node parity와 F 정책 로딩 → runtime binding → 각각 별도의 LOCK 및 TEST 승인 순서. 승인·구현·독립 리뷰가 필요하며 코드 동결 전 일정과 W4 hash 경계 위험이 크다. 성공해도 실제 실행 전 TEST 성능을 주장할 수 없다.
- **Option B / CORE DEMO SCOPE CUT (A 권고, 미승인):** 기존 W4 provisional 정책·검증된 Epoch 1과 AI-19를 사용하고 신규 연구 정책·LOCK·TEST·신규 Epoch·runtime binding은 이번 릴리스에서 제외한다. RPC·보안 공백, 녹화·리허설은 여전히 남는다. 발표는 실제 추론과 기존 Receipt의 독립된 증거 및 무결성에 한정한다.
- 팀장의 명시적 결정 전 어떤 옵션도 확정하지 않는다. 승인 시에만 결정 ID·범위·사유·승인자·승인 시각을 별도로 기록한다. Option B는 A1~A5·F2의 미완료를 삭제하거나 PASS로 바꾸지 않으며 S1 PENDING_APPROVAL, TEST SEALED를 유지한다.
