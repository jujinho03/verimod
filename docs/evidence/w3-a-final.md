# VeriMod W3 A 최종 마감

## 상태

**W3_A_COMPLETE_WITH_INTEGRATION_BLOCKER** — A 산출물과 로컬 검사를 마쳤습니다.

공개 마감은 최종 커밋과 검증된 fast-forward push를 조건으로 합니다. 커밋된 문서는 자기 최종 SHA를
스스로 참조할 수 없습니다. push 후 로컬/원격 일치 여부는 Git에서 제외된
`ai/artifacts/results/AI07-BL-KLUE-RB-45126-R01/w3_closure_post_push.json`과 최종 실행 보고서에 따로 기록합니다.
그 검증이 있기 전까지 공개 상태는 성공으로 가정하지 않고 PENDING으로 둡니다.

## AI-07

- 공식 실행 `AI07-BL-KLUE-RB-45126-R01`: klue/roberta-base, 고정 revision
  `02f94ba5e3fcb7e2a58a390b8639b0fac974a8da`, 3 epoch, native hate/offensive/none.
- TRAIN 5857; VALIDATION 1255; best step 1101.
- Macro-F1 0.6524599868976999; Micro-F1/Accuracy 0.6629482071713148.
- 선정 산출물 SHA-256: `a8288baf73dc01df7e5a0e9141fe1315a683a7a609963ed823decb0b418c9e5f`.
- [공식 증거](w3-a-ai07-baseline-run.md)는 변경 없이 보존합니다. 학습이나 전체 데이터셋 추론을 다시 실행하지 않았습니다.

## AI-21

**COMPLETE** — `ai/experiments/registry.jsonl`, 공식 R01 항목 1건.
판정 KEEP_AS_W3_BASELINE; FINAL_MODEL / PRODUCTION_READY / LOCKED_FOR_TEST를 주장하지 않습니다.

## AI-08

**COMPLETE** — `ai/artifacts/manifests/AI07-BL-KLUE-RB-45126-R01.model_manifest.json`.
버전 `model-manifest/1`; 공유 canonical model hash
`0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1`.
공유 canonical/hash 구현을 재사용했고, 지표의 소수값은 문자열로 명시 인코딩했습니다.

## AI-16

**COMPLETE (A 패키지 범위)** — [재현성/인계](w3-a-reproducibility-handoff.md),
`ai/fixtures/w3_real_model_i1_fixture.json`, 생성기와 단일 검증기.
합성 입력 3건을 선정 실제 모델로 추론했고, CPU 프로세스 2회 실행이 정확히 일치했습니다.
**CROSS_MACHINE_VERIFICATION = NOT_EXECUTED.** 다른 PC에서의 검증은 주장하지 않습니다.

## 출처

- execution_base_head: `09d72598dcd1d6744d4c80b99af0721d4c1efedc`.
- source_commit_at_execution: null.
- source_snapshot_commit: `f6b39d3b7c5637b68e18c2b1b59ee91890c059f0`.
- PASS_WITH_DOCUMENTED_LIMITATION: pyproject의 과거 SHA는 기록되지 않았고 사후에 채우지 않습니다.
  실행 lock/config hash와 런타임 목록은 보존했으며, 기록된 실행 파일 12개가 모두 일치합니다.

## 인계

A Python과 F 브랜치 검증기는 실제 fixture envelope 3개를 모두 통과시킵니다. W3 당시 공유 Receipt 스키마는
여전히 과거 taxonomy/5개 라벨 형태를 요구했습니다. 상태 **A_OUTPUT_READY_CONSUMER_ALIGNMENT_REQUIRED**;
통합 이슈 **HANDOFF_CONTRACT_MISMATCH**. 동기화 시점에 F/T W3 브랜치는 아직 origin/main에 병합되지 않았습니다.

F 검증기는 변경 불가능한 Git blob에서 실행했으며, 실제 backend 서비스를 시작하거나 Receipt를 발급하지 않았습니다.
shared/backend/frontend 계약 변경, 가짜 라벨, authoritative Receipt, Merkle root, 로컬 registerEpoch,
외부 앵커는 주장하지 않습니다. **PENDING_ANCHOR**.

## 테스트

- AI: 95 passed, 27 subtests passed; 실제 데이터셋 접근 시도 0.
- 기존 저장소 `node scripts/check-all.mjs`: exit 0.
- Frontend/shared 테스트: 172 passed; 브라우저 회귀 1 passed (matrix 20/20); lint/build passed.
- Main backend: 3 passed; typecheck/build passed.
- Main Hardhat toolchain: 1 passed; build passed. main의 ToolchainCheck이며 T 브랜치 W3 registry 연동이 아닙니다.
- F 고정 브랜치 추론 검증기: fixture envelope 3/3 통과.
- 공유 스키마 실제 fixture 검사: 3/3이 INVALID_SCHEMA로 거부됨. 예상된 통합 차단으로 기록했습니다.
- 증거: `ai/artifacts/reports/w3_handoff/`.

Sandbox 안의 npm 설치는 실패했고, 같은 전체 검사가 승인된 일반 권한에서 통과했습니다. 기존 npm 의존성
audit 경고는 남아 있습니다. frontend high 1; backend high 1 + critical 1; contracts low 9 +
moderate 1 + high 2. 이 A 범위에서 의존성 autofix나 lock 갱신은 하지 않았습니다.

## TEST

**SEALED / NOT ACCESSED**. TEST의 resolve/stat/open/hash/추론, Secondary 접근 모두 없습니다.

## 미룬 항목

- T/F 브랜치 통합과 공유 실제 taxonomy Receipt 스키마 정렬.
- 다른 장치 검증; Secondary; 모델 비교; calibration; threshold 조정.
- TEST 평가; Model Card; 정책 LOCK; 운영 런타임 추론과 외부 앵커링.
- 기존 JS 의존성 audit 결과는 담당자 검토가 필요합니다.

## 보안 경계

VeriMod는 제시된 Decision Receipt가 승인된 앵커 commitment와 일치하는지 검증하고
발급 후 변조를 탐지합니다.

다음은 증명하지 **않습니다**.

- AI 판정이 객관적으로 옳다는 것.
- 실제 모델 실행이 있었다는 것.
- 최초 기록이 진실했다는 것.
- 플랫폼 로그가 전역적으로 완전하거나 최신이라는 것.
