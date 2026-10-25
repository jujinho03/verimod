# W5 모델 런타임 결합 설계안 — tokenizer 파일 hash와 서비스 dependency lock

기준일: 2026-10-22 KST · Owner: A / 주진호 · 상태: **DESIGN PROPOSED / 미구현 / LOCK 아님**.

이 문서는 [LOCK 사전점검표](w5-lock-preflight-checklist.md)에서 발견한 두 공백을 메우는 A 소유 설계안이다. 이번 작업에서 코드 변경, 로컬 tokenizer·가중치 파일 열람, hash 계산은 하지 않았다.

## 현재 사실 (코드 확인)

- [service.py](../../ai/src/verimod_ai/inference/service.py)의 `verify_artifacts`는 시작할 때 세 파일의 SHA-256을 고정값과 대조한다: `model.safetensors`, `config.json`, R01 Manifest 파일.
- tokenizer는 `AutoTokenizer.from_pretrained('klue/roberta-base', revision=REVISION, cache_dir=…, local_files_only=True)`로 **HF 캐시에서 revision 기준으로만** 불러온다. **tokenizer 파일 bytes는 검증하지 않는다.** 캐시가 손상되거나 교체돼도 감지할 수 없다.
- [R01 Model Manifest](../../ai/artifacts/manifests/AI07-BL-KLUE-RB-45126-R01.model_manifest.json)의 `dependency_lock_sha256`(`8b61fa68…`)은 학습용 `ai/requirements-w3.lock.txt`와 일치한다.
- 추론 서비스용 `ai/requirements-w4-service.lock.txt`(`a2966194…`)는 어디에도 결합되어 있지 않다.

## 설계 원칙

**R01 Model Manifest는 수정하지 않는다.** 필드를 추가하면 Model Manifest hash `0x96b33780…`가 바뀐다. 그 hash는 W4 Receipt·Epoch 1·Policy Manifest가 참조하는 역사적 identity라서, 바뀌면 W4 증거와의 연결이 끊어진다. 따라서 Manifest는 그대로 두고, 이를 참조하는 **별도 런타임 결합 기록**을 둔다.

## 제안: `model_runtime_binding.json` (PROPOSED)

```json
{
  "schema": "verimod.w5.model-runtime-binding.v1",
  "model_manifest_hash": "0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1",
  "model_artifact_sha256": "<R01 Manifest의 artifact_sha256와 같아야 함>",
  "tokenizer": {
    "id": "klue/roberta-base",
    "revision": "02f94ba5e3fcb7e2a58a390b8639b0fac974a8da",
    "files": {"<snapshot 기준 상대경로>": "<sha256>"},
    "files_digest": "<sha256(정렬된 '경로\\0sha256\\n' 연결)>"
  },
  "service_dependency_lock": {"path": "ai/requirements-w4-service.lock.txt", "sha256": "<LF 정규화 bytes의 sha256>"},
  "python_version": "<실행 Python, 예: 3.12.14>",
  "training_dependency_lock_sha256": "8b61fa68c369af1d447f3d7458fccffb2cebf361b382198c2e35bc91ad12bdde"
}
```

- **tokenizer 파일 목록:** HF snapshot 디렉터리에서 tokenizer 로딩에 쓰이는 파일 전부를 대상으로 한다(예: `tokenizer.json`, `tokenizer_config.json`, `special_tokens_map.json`, `vocab.txt`). 실제 목록은 생성 시점에 확인하며, 문서가 파일명을 미리 가정하지 않는다. 경로는 ASCII 정렬하고, symlink는 실제 대상 bytes를 hash한다(HF 캐시는 blob symlink 구조를 쓴다).
- **lock 파일 hash:** 기존 `verify_artifacts`와 같은 방식으로 CRLF→LF 정규화 후 계산한다. 이렇게 해야 Windows checkout에서도 값이 같다.
- **저장 위치(제안):** `ai/artifacts/manifests/w5_model/<binding-id>.json`. 이 경로는 AI-12 guard의 `model_manifest` 역할 allowlist(`ai/artifacts/manifests/w5_model/…`)와 이미 맞는다. 따라서 LOCK에 별도 schema 변경 없이 결합할 수 있다.
- **Canonical 호환:** 정수와 문자열만 사용한다. 소수 number가 없다.

## 실행 시 검증 (구현 단계 제안)

1. 평가기와 `/infer`는 모델을 로딩하기 전에 binding 기록을 읽는다. tokenizer 파일, 서비스 lock, Python 버전을 대조하고 하나라도 다르면 중단한다(fail-closed).
2. `/infer` 서비스에 같은 검사를 넣는 일은 A 소유 코드 변경이다. 다만 W4 런타임 동작이 바뀌므로 승인된 W5 범위로 제한하고, 기존 W4 E2E 회귀와 함께 실행한다.
3. binding 기록의 생성·검증 도구는 A 소유 신규 스크립트로 만들고, 합성 디렉터리로 테스트한다. 실제 HF 캐시를 hash하는 작업은 LOCK 패키지를 준비하는 단계에서 1회 수행해 기록한다.

## 남은 결정

- 실제 HF 캐시를 열람해 hash하는 시점: LOCK 패키지 준비 단계를 제안한다. 지금은 하지 않는다.
- `/infer` 런타임 검사를 W5에 넣을지, 평가기에만 넣을지: 일정상 **평가기에만 먼저** 넣는 것을 제안한다.
- binding의 schema 이름과 위치는 T 리뷰를 받는다. canonical/hash 규약 때문이다.
