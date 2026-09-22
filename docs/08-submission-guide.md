# VeriMod — 심사위원용 실행 안내

STATUS: CURRENT

HTTP 451 · BLOCK AI 2026 · **Decide. Prove. Appeal.**

VeriMod는 AI 판정 기록을 이용자가 직접 재계산하고, 원본 판정을 덮어쓰지 않는 이의제기 이력으로 연결하는 protocol을 목표로 한다. **현재 결과물은 frontend synthetic protocol PoC**다. Hash·Merkle proof 계산은 실제 수행하며 moderation score와 ledger/anchor는 simulation이다.

## 30초 안에 확인할 근거

| 질문 | 근거 |
|---|---|
| 무엇이 구현됐나? | [현재 구현 표](../README.md#current-implementation) |
| 실제 화면이 있나? | [홈](assets/p0-home-2026-09-13.jpg) · [판정](assets/p0-check-2026-09-13.jpg) · [변조 실패](assets/p0-tamper-2026-09-13.jpg) |
| 직접 검증 가능한가? | [정상·변조 JSON 3개](examples/README.md), 아래 실행 순서 |
| 테스트를 실행했나? | [실행 기록](07-validation-2026-09-13.md) · [GitHub CI](https://github.com/jujinho03/verimod/actions/workflows/ci.yml) |
| 다음 실제 통합 계획은? | [P1 backlog](06-p1-backlog.md) |

## 실행 준비

Node 24.19.0 / npm 12.0.2에서 검증했다. 아래 명령은 제출용 main 브랜치를 가져온다. 검증과 반영 이력은 [PR #1](https://github.com/jujinho03/verimod/pull/1)의 P0 hardening, [PR #2](https://github.com/jujinho03/verimod/pull/2)의 repository quality pass, 그리고 [GitHub Actions](https://github.com/jujinho03/verimod/actions/workflows/ci.yml)에서 확인한다. 현재 제출 기준 main은 `f1e4384ef9f024b127db20ba97e4fd54e642ee50`이다.

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
