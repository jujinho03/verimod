# BLOCK AI✳26 / HTTP 451 — VeriMod W5→W6 범위 이월 결정 기록

> 저장소 보존본: 팀장이 2026-10-22 제공한 `BLOCK_AI_VeriMod_W5_to_W6_이월_결정_20261022.md` 원문을 그대로 옮겼다. 결정 기록부 등록은 [02-decision-register.md](../02-decision-register.md)를 따른다.

- **결정일:** 2026-10-22 (KST)
- **결정 출처:** 프로젝트 사용자/팀장 주진호의 본 대화 명시 지시. 별도의 오프라인 팀 전체 합의나 F 본인 확인을 증명하는 기록이 아니다.
- **결정 상태:** `ADOPTED_BY_A_LEAD` — F의 일정 사유에 따른 W5 미완료 작업 W6 이월. 구체적인 W6 실행시간과 3인 담당자 수용 여부는 확인 필요.
- **이유:** F 담당 노유신의 시험기간 때문에 2026-10-25까지 F의 W5 잔여 작업을 완료할 수 없다는 최신 보고.
- **W5:** 2026-10-19~10-25. **GATE-5:** 2026-10-25(일) 21:00 KST.
- **W6:** 2026-10-26~11-01. **W7:** 2026-11-02~05. 기존 목표 11/04 코드 동결은 변경 승인된 바 없다.

## 결정 D-W5F-20261022-01

**노유신(F) W5 잔여 MUST를 W6 작업 대기열로 이월한다.** W5 완료·PASS로 표시하거나 다른 팀원 소유로 자동 이관하지 않는다. 기존 W6 F 범위(TEST-01/03, FE-04/05/06)와 추가 업무량 충돌을 W6 킥오프에서 정리하고, W6 초반의 MUST 회복/Scope Diet를 우선 고려한다. 실제 가능한 착수일은 시험 일정 확인 후 정한다.

W6로 이월하는 F 소유 잔여 범위(현행 W5 v2 기준):

1. `FE-03`: Synthetic DECISION→APPEAL→REVIEW Timeline UI 및 SYNTHETIC/LOCAL/BASE 출처 분리, 단정적인 실제 사람 심사 표현 금지.
2. `FE-07`: Private Receipt Package의 생성·가져오기, `package_version/receipt_id/original_text/content_salt/content_commitment` 검증, 개인 원문·salt 비공개 및 Core/Content 별도 상태.
3. `SEC-03`: 실제 존재하는 principal/role, 403/409, Idempotency-Key, 중복·동시성·복구 등 구현 기반 QA. 미구현 API/권한은 NOT_IMPLEMENTED.
4. Verifier UI/UX 회귀: `PROTOTYPE MODE` 정확화, W4 public Manifest 부재와 실제 mismatch 구별, L2 Confirmed와 L1 finality 구분, `RPC_UNAVAILABLE`/미확정/무결성 실패 구분, 모바일/데스크톱 QA.
5. `T/F JOINT SERVICE QA`: verified Receipt, Private Package, Synthetic UI, 브라우저/RPC 장애·회복 등의 실제 통합 QA. F 가용성 확보 전까지 미완료/대기.
6. `A/F policy activation`의 F 소유 구현·합의: 승인 범위 메타데이터, W5 rule IDs, 명시적 프로필 로딩/fail-closed 및 F Python/Node parity 지원. 이는 **신규 승인 정책**이 있을 때만 유효한 조건부 의존성이다.

## W5에서 계속 수행하는 작업과 판정

- **T(설경민)**: RCPT-05/Synthetic 연결·전이 및 CHAIN-09 로컬 완료 보고는 소스·테스트·SHA 확인 후 증거로 인정한다. 독립 가능한 `TEST-05` 공개 Base Sepolia RPC 읽기 전용 재검증과 실패 상태 기록은 W5 안에 계속 수행한다. F 공동 QA는 W6 이월, F 결과를 대신 구현하지 않는다.
- **A(주진호)**: 기존 W5 Validation·25후보·AI-13·DOC-09·8분 발표 근거·Policy Decision Memo의 독립 부분을 마무리한다. S1은 현재 `RECOMMENDED/PENDING_APPROVAL`이며, 사용자가 연구·시연 평가 **방향**을 채택한 사실만으로 S1 X=3/50, B=9/20 또는 후보 확정을 승인한 것으로 간주하지 않는다. A/F 공동 의존성은 W6로 인계한다.
- **AI-12**: TEST `SEALED`; 명시적인 X/B·Model/Policy 승인 → 유효한 LOCK commit/SHA/시각 → 별도 최초 TEST 승인 전에는 TEST 접근이나 실제 평가를 하지 않는다. F 시험기간은 TEST 우회 승인 사유가 아니다.
- **GATE-5**: 원래 기준을 보존한다. `G5-05(F)` 및 F 종속 `G5-04/G5-06/G5-07`은 실제 증거가 없으면 PASS 불가. G5-01/02가 승인 부족이면 PARTIAL/BLOCKED로 표시. **10/25 21:00 시점에 증거에 따라 PASS/PARTIAL/FAIL을 확정**한다. 미리 임의 판정하거나 Gate 규칙 자체를 수정하지 않는다.
- 미통과 시 원본 자동 action: `SHOULD=0`, `new feature=0`, 남은 MUST 우선, 필요한 scope cut은 팀장 승인, W6 초반 제한 복구. 기존 W6/7 원본 계획은 이 결정만으로 자동 변경하지 않으며 W6 작업계획 변경안에 반영해 검토한다.

## 안전·보존 경계

- W4 Base Sepolia Epoch 1, 실제 Receipt 2건, Contract/Publisher, root/tx, F CONFIRMED 및 공개 브라우저 7/7은 완료된 역사 증거. 수정·소급 재발급 금지.
- `VALID` ≠ AI 판정 정답성; Synthetic lifecycle PASS ≠ 운영형 이의신청/사람 검토 완료; Private Content PASSED ≠ Core VALID.
- 원문·salt·비공개 자료/키·운영 DB·민감 로그 비공개. RPC 읽기 전용 외 승인 없는 체인 송신·운영 연결·DB 쓰기 금지.
- 코드·문서·CI PASS는 실제 확인된 브랜치/SHA/실행 증거로만 주장한다.

## 원격 GitHub 상태 (2026-10-22 확인)

- `main` SHA: `8d0580a7ef6a7e88c2314e6f5f30ff5f08f693ab`
- 최신 확인 CI #237: SUCCESS (위 SHA)
- A/T W5 신규 로컬 커밋과 테스트 완료는 본 대화의 팀원/Claude Code 보고에 근거한다. 아직 원격에 반영·독립 재검증된 사실로 표시하지 않는다.
