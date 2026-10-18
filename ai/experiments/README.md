# W3 실험 등록부

`registry.jsonl`에는 공식 실행 1건 `AI07-BL-KLUE-RB-45126-R01`만 들어 있습니다.
판정은 `KEEP_AS_W3_BASELINE`이며 FINAL_MODEL, PRODUCTION_READY, LOCKED_FOR_TEST가 아닙니다.
Smoke 실행과 합성 fixture 재생은 공식 학습 실험이 아닙니다.

실행 기준 HEAD, 실행 시점 source commit(null), 이후의 source snapshot commit은 서로 다른 필드입니다.
실행 시점 pyproject hash가 없는 것은 승인·문서화된 한계입니다.
과거 lock hash, 런타임 목록, config/source hash, 선정 산출물 hash는 보존합니다.

`package_w3_baseline.py`는 보존된 보고서로 이 항목을 만듭니다. 기존 등록부와 내용이 다르면 거부하며,
학습하거나 데이터셋에 접근하지 않습니다. 점수는 UNCALIBRATED이고 TEST는 봉인 상태입니다.

[재현성과 인계](../../docs/evidence/w3-a-reproducibility-handoff.md)를 참고합니다.
