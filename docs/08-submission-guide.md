# VeriMod — 심사위원용 실행 안내

STATUS: CURRENT (W7 Option B 안내; 실행 결과는 각 세션에서 별도 확인)

HTTP 451 · BLOCK AI 2026 · **Decide. Prove. Appeal.**

> **대상:** 발표자·심사위원 · **목적:** 실행 전 준비와 화면별 결과의 출처를 확인합니다.
>
> **함께 읽기:** [멘토링 한눈에 보기](mentoring/mentor-brief-20261031.md) · [W7 인계](handoffs/W7-core-demo-approved-handoff-20261030.md) · [Data Card](data-card.md) · [Model Card](model-card.md). 아래 9월 제출 자료는 당시 기록입니다.

## 무엇을 확인할 수 있나요?

VeriMod는 판정 기록의 Decision Receipt hash와 Merkle 포함 증명을 이용해 사후 기록 무결성을 대조합니다. 기록이 일치하더라도 AI 판정의 정확성·실제 모델 실행·원문 진실성·플랫폼의 모든 기록의 완전성을 증명하지는 않습니다. 원문·salt·개인정보는 온체인에 올리지 않습니다.

- **기본 브라우저 Lifecycle — SYNTHETIC_LOCAL:** 판정 점수·원장·Appeal/Review는 합성 데모이며 실제 운영 이의제기 백엔드는 Post-MVP입니다. 해시와 Merkle 계산은 실제로 수행합니다.
- **HISTORICAL_W4_EVIDENCE / LIVE_BASE_SEPOLIA:** 2026-10-20의 기존 W4 Epoch 1은 실제 Base Sepolia에 등록됐습니다. 공개 Receipt는 승인 profile의 공개 RPC로 읽기 전용 재검증합니다. 체인 ID `84532`, L2 확인 기준 12블록이며 L1 finality 보장은 아닙니다. [W4 공개 증거](handoffs/w4-anchored-epoch-public/20261020-r01/README.md).
- **LIVE_MODEL_INFERENCE:** 로컬 R01 모델 서비스의 새 추론은 위 과거 W4 Receipt와 별개입니다. 새 추론이 기존 앵커에 포함됐다거나 새 AI→Receipt→Epoch→Anchor가 완료됐다고 주장하지 않습니다. 점수는 **UNCALIBRATED**입니다. [AI-19 과거 오프라인 결과](evidence/w6-a-ai19-offline/ai19-final-assessment.md), [Data Card](data-card.md), [Model Card](model-card.md).

## 실행 전 준비

저장소와 실제 실행 SHA를 확인하고 Node 및 의존성을 준비합니다. clone만으로 비공개 R01 가중치·tokenizer cache 또는 과거 원본 DB가 제공되지는 않습니다. 실제 추론에는 승인된 로컬 모델과 의존성이 필요합니다. 다른 모델을 내려받아 대체하지 않습니다.

```sh
git clone https://github.com/jujinho03/verimod.git
cd verimod/frontend
npm ci
npm run dev
```

로컬 주소를 열고 `/verify`에서 **승인 프로필** `BASE_SEPOLIA_DEMO`를 명시적으로 선택합니다. 환경 변수 또는 build에 승인된 주소·publisher·RPC 설정이 없다면 해당 모드는 비활성일 수 있습니다. 실제 출처와 설정은 [프런트엔드 안내](../frontend/README.md)와 [공개 증거](handoffs/w4-anchored-epoch-public/20261020-r01/README.md)를 대조하세요. RPC는 읽기 전용이며 새 거래를 보내지 않습니다. 주소·publisher·프로필을 임의로 바꾸지 않습니다.

W4용 프런트엔드 설정은 `frontend/.env.local`에 아래 **공개 값**을 넣고 개발 서버를 재시작해 반영합니다. 이 값은 W4 읽기 전용 profile이며 비밀키를 포함하지 않습니다. RPC 가용성은 매번 달라질 수 있습니다.

```dotenv
VITE_BASE_SEPOLIA_CONTRACT_ADDRESS=0xd17ba590b23e984e3f3408bcdc3529be9868ec50
VITE_BASE_SEPOLIA_PUBLISHER=0xd47675be41ec3476f541c1d8d8a9f622c90182ed
VITE_BASE_SEPOLIA_RPC_URLS=https://base-sepolia-rpc.publicnode.com,https://sepolia.base.org
VITE_BASE_SEPOLIA_DEPLOYMENT_BLOCK=48012271
VITE_BASE_SEPOLIA_MIN_CONFIRMATIONS=12
```

R01은 적합한 Python 환경과 고정 가중치·tokenizer cache를 준비한 뒤 저장소 루트에서 `python ai/scripts/serve_w4_inference.py`로 사전 기동하고 `http://127.0.0.1:8099/healthz`의 `ready`를 확인합니다. 기동 실패나 ready=false를 READY로 표시하지 않습니다. 구체적인 모델과 hash 경계는 [AI 안내](../ai/README.md), [실제 추론 계약](../ai/src/verimod_ai/inference/service.py)을 확인하세요. `/infer` 요청에는 text, content_commitment, 선택적 request_id가 필요합니다. Python 서비스만 성공한 것은 브라우저→Node 발급 통합을 검증했다는 뜻이 아닙니다. 브라우저 LIVE 발급에는 추가 Node backend·비운영 DB·명시적 환경 설정이 필요하며 새 Receipt는 앵커 전 `PENDING_ANCHOR`입니다.

Windows PowerShell에서 서비스를 사전 기동한 **뒤** 다음은 무해한 예시 요청입니다. zero commitment는 API 계약 테스트용 placeholder이며 실제 원문 commitment 또는 신규 Receipt가 아닙니다.

```powershell
Invoke-RestMethod http://127.0.0.1:8099/healthz
$demoRequest = @{ text = '오늘은 좋은 날입니다.'; content_commitment = ('0x' + ('0' * 64)); request_id = 'w7-demo-example' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8099/infer -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($demoRequest))
```

브라우저 LIVE 발급은 `VITE_VERIMOD_LIVE_ENABLED=true`가 필요합니다. 개발 서버에서 `VITE_VERIMOD_API_URL`을 비워두면 같은 origin의 `/api`를 Vite가 로컬 Node 서버에 proxy합니다. 별도 origin 주소를 지정하면 현재 backend에는 CORS middleware가 없어 브라우저 요청이 차단될 수 있습니다. Node 서버에는 `VERIMOD_DB_PATH`, `VERIMOD_W4_PROVISIONAL_E2E_ONLY`, `VERIMOD_INFERENCE_URL`, `VERIMOD_MODEL_MANIFEST_PATH`, `VERIMOD_POLICY_MANIFEST_PATH`, `VERIMOD_POLICY_MANIFEST_HASH`와 hate/offensive review/restrict PPM 네 값이 필요합니다. 이 경로는 추가 환경 및 브라우저 origin 경계 검증이 필요하므로 현재 추천 경로는 준비된 로컬 R01 직접 추론입니다. 원본 DB나 승인되지 않은 정책값은 사용하지 않습니다. [backend 안내](../backend/README.md)를 참고하세요.

> **이후 확인 — PR #42:** 격리 Windows 환경에서 브라우저→Node→R01 발급의 `201 / PENDING_ANCHOR`, 모델 중단 시 `503` 및 복구 후 재발급이 보고됐습니다. [PR 실행 요약](https://github.com/jujinho03/verimod/pull/42)은 이전 실행의 근거이며, 이번 발표 PC와 세션에서 경로가 준비됐다는 보장은 아닙니다. 원본 DB를 사용하거나 새 앵커를 만들지 않습니다.

### 발표 직전 준비 상태

각 값은 실제 확인한 이번 실행에서만 기록합니다. 하나라도 확인하지 못하면 해당 항목은 READY가 아닙니다.

| 항목 | 확인 기준 |
| --- | --- |
| MODEL_READY | R01 서비스 `/healthz`가 실제 200과 ready를 반환; 모델·tokenizer 로드 실패는 READY 아님 |
| FRONTEND_READY | 발표 브라우저에서 로컬 `/verify` 화면과 버튼이 실제로 열림 |
| BACKEND_READY / NOT_REQUIRED_FOR_SELECTED_FLOW | Python 직접 `/infer` 경로에는 Node backend가 필요 없음. 브라우저 발급을 택하면 별도 테스트 DB와 API·모델 연결을 확인; Node 생존 응답만으로 발급 준비를 단정하지 않음 |
| BASE_PROFILE_READY | 위 승인 W4 값과 설정이 일치하고 W4 샘플 탭이 활성화됨. 이는 RPC 가용성이나 `VALID` 보장이 아님 |
| W4_FIXTURE_READY | 공개 샘플을 로드하고 출처와 원본 Receipt를 확인. 검증 결과는 실제 실행 후에만 표시 |

## 재현 경로와 결과 읽기

1. 실제 R01 서비스가 준비됐을 때 무해한 입력으로 추론합니다. 새 추론과 과거 AI-19 결과를 구분합니다.
2. `/verify`에서 **W4 공개 검증 샘플 불러오기**를 선택합니다. 승인된 W4 profile이 정확히 구성됐을 때만 탭이 활성화되며 `BASE_SEPOLIA_DEMO`가 자동 선택됩니다. **검증하기**를 눌러 실제 해시·proof·epoch·confirmation 검증의 관측 결과를 확인합니다. 기대 `VALID`는 보장된 결과가 아닙니다. [receipt-0.bundle.json](handoffs/w4-anchored-epoch-public/20261020-r01/receipt-0.bundle.json)을 직접 불러오는 방법도 있습니다.
3. **본문 변경 · 기존 해시 유지**를 누른 뒤 **검증하기**로 `HASH_MISMATCH`를 확인합니다. **본문 변경 · 해시 재계산**은 별도 사본의 body를 바꾸고 canonical hash를 재계산하며 기존 proof/root를 유지합니다. 다시 **검증하기**를 눌러 `INVALID_PROOF`를 관측합니다. **W4 원본 복원**으로 원래 입력을 복원할 수 있습니다. proof sibling 변경은 별개 사례이며 W4 원본 파일은 변경하지 않습니다.
4. RPC 오류는 `RPC_UNAVAILABLE`이며 변조 실패나 `VALID`로 바꾸지 않습니다. 장애·복구 실험에서 Playwright route abort는 브라우저 요청 차단이며 실제 물리 네트워크 장애가 아닙니다. 복구는 같은 Receipt·profile의 실제 결과를 확인합니다.
5. LIVE가 실패하면 명시적으로 `SYNTHETIC_LOCAL`과 별개의 합성 Receipt로 전환할 수 있습니다. 이를 공개 체인 성공으로 세지 않습니다. 전체 녹화의 존재·재생·무결성 검증 전에는 `RECORDED_READY=false`, 실제 Hardhat LOCAL은 `NOT_VERIFIED`입니다.

## 제한과 승인 경계

[W7 승인 인계](handoffs/W7-core-demo-approved-handoff-20261030.md)의 Option B는 새 연구 정책 S1/S2, 신규 A/F 계약·Manifest parity·Runtime Binding, F2, LOCK·TEST, 새 Epoch/송신을 필수 데모에서 제외합니다. 미완료 항목을 구현·승인으로 바꾸지 않습니다. W4는 provisional 정책, S1은 `PENDING_APPROVAL`, TEST는 `SEALED`입니다. 공개 RPC는 429/413 등으로 실패할 수 있고, 백업의 전체 Event 검증은 입증되지 않았습니다. 480초 공동 리허설·전체 영상은 별도 실제 확인이 필요합니다. 과거 W4·W6 보고와 현재 세션의 성공 여부를 섞지 않습니다.

---

아래는 2026-09-14 제출 당시 기록입니다. 아래의 `현재`, `후속 구현 대상`, 저장 경계 및 실행 결과는 그 당시 관점이며 위 W7 안내보다 우선하지 않습니다.

# 2026-09-14 제출 안내 — 역사 기록

STATUS: HISTORICAL (아래의 당시 synthetic PoC 안내는 현재 구현 전체를 설명하지 않음)

HTTP 451 · BLOCK AI 2026 · **Decide. Prove. Appeal.**

VeriMod는 AI 판정 기록을 이용자가 직접 재계산하고, 원본 판정을 덮어쓰지 않는 이의제기 이력으로 연결하는 protocol을 목표로 한다. **현재 결과물은 frontend synthetic protocol PoC**다. Hash·Merkle proof 계산은 실제 수행하며 moderation score와 ledger/anchor는 simulation이다.

## 30초 안에 확인할 근거

| 질문 | 근거 |
|---|---|
| 무엇이 구현됐나? | [현재 구현 표](03-current-status.md#gate-4-조건) |
| 실제 화면이 있나? | [홈](assets/p0-home-2026-09-13.jpg) · [판정](assets/p0-check-2026-09-13.jpg) · [변조 실패](assets/p0-tamper-2026-09-13.jpg) |
| 직접 검증 가능한가? | [정상·변조 JSON 3개](examples/README.md), 아래 실행 순서 |
| 테스트를 실행했나? | [실행 기록](07-validation-2026-09-13.md) · [GitHub CI](https://github.com/jujinho03/verimod/actions/workflows/ci.yml) |
| 다음 실제 통합 계획은? | [P1 backlog](06-p1-backlog.md) |

## 실행 준비

Node 24.19.0 / npm 12.0.2에서 검증했다. 아래 명령은 제출용 main 브랜치를 가져온다. 검증과 반영 이력은 [PR #1](https://github.com/jujinho03/verimod/pull/1)의 P0 hardening, [PR #2](https://github.com/jujinho03/verimod/pull/2)의 repository quality pass, 그리고 [GitHub Actions](https://github.com/jujinho03/verimod/actions/workflows/ci.yml)에서 확인한다. 2026-09-14 당시 제출 기준 main은 `f1e4384ef9f024b127db20ba97e4fd54e642ee50`이었다(historical baseline). CURRENT는 `git fetch origin` 후 최신 `origin/main`과 해당 SHA의 GitHub CI를 확인한다. 과거 실행 결과를 현재 성공 증거로 재사용하지 않는다.

```bash
git clone --branch main https://github.com/jujinho03/verimod.git
cd verimod/frontend
npm ci
npm run dev
```

터미널에 표시된 localhost 주소를 연다. 기본값은 `http://localhost:5173`이며 포트가 이미 사용 중이면 달라질 수 있다. Web Crypto는 localhost 또는 HTTPS에서 사용한다. 이 PoC 실행에 backend, wallet, RPC key, DB는 필요하지 않다. 공개 웹앱 배포나 testnet 배포를 완료한 결과물이 아니다.

## 정상 → 변조 → 재해싱 확인

1. `/verify`에서 [01-valid.json](examples/01-valid.json)을 붙여넣거나 파일로 선택해 **검증하기**를 누른다. 기본 seed 원장에서는 `VALID`가 나온다.
2. 같은 방식으로 [02-tampered.json](examples/02-tampered.json)을 검증한다. violence 점수만 바뀌어 `HASH_MISMATCH`가 나온다.
3. [03-rehashed.json](examples/03-rehashed.json)은 수정한 본문의 해시까지 다시 썼지만 원래 root에 포함되지 않아 `INVALID_PROOF`가 나온다.
4. 정상 파일로 돌아가 **RPC 장애 가정**을 켜고 검증하면 `RPC_UNAVAILABLE`이 나온다. 확인 후 토글을 끈다.

세 JSON 모두 기본 seed의 합성 epoch #1을 사용한다. 다른 브라우저에서 새로 발급한 임의의 bundle은 원래 브라우저 원장까지 전달하지 않으므로 동일한 결과를 보장하지 않는다. 최초 실행 또는 별도 브라우저 프로필로 시연하면 기존 작업 자료를 초기화할 필요가 없다.

## 새 판정 → 이의제기 → 검토 확인

1. `/check`에서 다음 **합성 검증용 문장**을 입력한다: `무료 당첨 이벤트! 지금 바로 클릭하고 할인코드를 받으세요 http://example.com`
2. synthetic 결과와 정책의 RESTRICT를 확인하고 영수증을 발급한다.
3. 상세 화면에서 batch·합성 confirmation 완료를 기다린다. 발급 직후에는 `PENDING_ANCHOR`일 수 있으며, 최신 봉인 상태로 다시 불러와 검증한다.
4. 이 새 판정에 검증용 이의제기를 제출한다. `/review`에서 해당 건을 골라 검토 결과를 기록한다.
5. `/receipts`와 상세 이력에서 DECISION → APPEAL → REVIEW를 확인한다. 최초 DECISION body를 변경한 결과가 아니다.

기본 seed의 영화 문장 판정은 이미 appeal·OVERTURN 이력이 있으므로 새 appeal 시연에는 새 판정을 사용한다. REVIEW의 `HUMAN_REVIEWER` 표시는 인증된 사람의 검토 증명이 아니다. 실제 사용자 사건이나 민감한 원문을 시연에 넣지 않는다.

## 검증의 의미

- **입증하는 범위:** 제한형 canonical bytes·SHA-256·Merkle inclusion 계산, 고정된 합성 root에 대한 사본 변경 탐지, 제공된 기록의 연결 규칙.
- **입증하지 않는 범위:** AI 정확성·공정성·실제 모델 실행, 실제 blockchain transaction, 모든 moderation 기록의 완전성, 실제 사람의 검토 신원.
- **저장 경계:** raw text·salt·appeal 본문은 localStorage에 평문으로 남는 PoC 편의 저장이다. production 보안 저장소가 아니다.
- **남은 항목:** 실제 AI·업무 backend·DB·epoch contract·testnet, contract 개발 의존성 audit 항목, LICENSE 결정. [감사 보고](05-protocol-audit.md)를 참고한다.

## 제출 문구

> VeriMod는 Decision Receipt의 hash와 Merkle proof를 이용해 판정 기록의 사후 변경을 직접 확인하고, 이의제기·검토 결과를 연결하는 frontend synthetic protocol PoC입니다. 브라우저에서 암호학 계산과 변조 탐지를 수행합니다. 현재 moderation score와 blockchain anchor는 simulation이며, 실제 AI와 backend·EVM testnet 통합은 후속 구현 대상입니다.

첨부 기획서는 보존한 reference다. 현재 구현 여부는 README·실행 기록이 우선하며 기획서의 향후 목표를 구현 완료로 읽지 않는다.
