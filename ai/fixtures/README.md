# W3 실제 모델 출력 fixture

`w3_synthetic_inputs.json`에는 인터페이스 시험용으로 AI가 새로 작성한 한국어 예시 3건이 있습니다.
일반 문장, 개인 모욕, 집단 대상 혐오입니다. 유해 예시는 시험 입력일 뿐 프로젝트가 지지하는 표현이
아닙니다. BEEP이나 다른 데이터셋에서 복사하지 않았습니다.

`w3_real_model_i1_fixture.json`은 오프라인에서 실행한 선정 모델의 실제 출력을 기록합니다. 기대 라벨을
강제하지 않습니다. 종류는 REAL_MODEL_OUTPUT_FIXTURE / OFFLINE_SELECTED_MODEL / live_inference=false입니다.
native score 3개는 UNCALIBRATED이며, `none`은 참조 클래스이지 ALLOW가 아닙니다.
I1 envelope으로는 hate/offensive ppm만 노출합니다. Python이 독립적으로 반올림(half-up)을 한 번 적용하며
합계를 보정하지 않습니다. evidence가 비어 있는 것은 근거 표시(attribution)를 만들지 않았다는 뜻입니다.

공개된 결정적 salt와 content commitment는 합성 fixture 자료일 뿐입니다. commitment는 T 소유의
`contentCommitment`로 계산했으며, 실제 발급자는 자체 commitment와 salt를 만듭니다.
이 인계에서는 authoritative Receipt를 발급하지 않았고 앵커도 만들지 않았습니다.

독립된 CPU 프로세스 두 개가 logits, score, ppm, class, status를 정확히 같게 만들었습니다.
이것이 다른 장치 간 bit 단위 재현성이나 모델 성능을 입증하지는 않습니다.

W3 당시 공유 Receipt 스키마는 실제 taxonomy를 거부했습니다. F 검증기
`e5f2bdcc49a5182d25ba9cfb96f6d591d44ca0a4`는 envelope 3개를 모두 통과시켰지만 그 브랜치는 main에 없었습니다.
당시 상태: A_OUTPUT_READY_CONSUMER_ALIGNMENT_REQUIRED.

> 이후 경과: 2026-10-18 main 병합으로 T/F의 BEEP 스키마가 main에 들어왔고, 이 fixture는
> `frontend/src/domain/w3-actual-schema.test.ts`와 `backend/test/w3-joint.test.ts`에서 계속 검사합니다.
