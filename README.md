# VeriMod

**사용자가 직접 검증하는 AI 모더레이션 프로토콜 · Decide. Prove. Appeal.**

팀 HTTP 451 · BLOCK AI 2026 (Web3 시대의 블록체인 AI 융합 해커톤, 트랙 1)

[![CI](https://github.com/jujinho03/verimod/actions/workflows/ci.yml/badge.svg?branch=main&event=push)](https://github.com/jujinho03/verimod/actions/workflows/ci.yml?query=branch%3Amain)

## 한눈에 보기

**문제.** 플랫폼이 AI로 게시물을 제한할 때, 이용자는 판정 이유를 받더라도 그 기록이 나중에 바뀌었는지 플랫폼 밖에서 확인할 방법이 없습니다.

**해결.** VeriMod는 AI 판정마다 **판정 영수증(Decision Receipt)** 을 발급하고, 영수증 묶음의 지문(Merkle root)을 **공개 블록체인(Base Sepolia)** 에 고정합니다. 이용자는 받은 영수증을 공개 기준점과 직접 대조해, 판정 기록이 발급 후 바뀌지 않았는지 스스로 확인하고 이의제기할 수 있습니다.

| VeriMod가 확인해 주는 것 | VeriMod가 주장하지 않는 것 |
| --- | --- |
| 받은 영수증이 블록체인에 고정된 기록과 일치하는지 | AI 판정이 객관적으로 옳은지 |
| 영수증의 해시·포함 증명이 변조됐는지 | 실제로 그 모델이 실행됐는지 |
| 어떤 모델·정책 버전으로 판정했는지 (hash로 결합) | 발급자가 처음부터 진실하게 기록했는지 |

블록체인에는 최소 정보(epoch 번호, Merkle root, 건수, 버전)만 올립니다. 게시물 원문, salt, 개인정보는 올리지 않습니다.

## 동작 흐름과 현재 위치

```mermaid
flowchart LR
  A[한국어 게시물] --> B[AI 판정<br/>KLUE RoBERTa]
  B --> C[정책 적용<br/>허용/검토/제한]
  C --> D[판정 영수증 발급<br/>SQLite 저장]
  D --> E[영수증 묶음 고정<br/>Merkle Epoch]
  E --> F[블록체인 등록<br/>Base Sepolia]
  F --> G[이용자 브라우저에서<br/>독립 검증]
  classDef done fill:#d8f3dc,stroke:#2d6a4f,color:#1b4332
  class A,B,C,D,E,F,G done
```

모든 단계를 실제 모델·실제 데이터·실제 Base Sepolia로 실행했습니다(2026-10-20).

## 현재 진행 상황 (2026-10-20)

| 단계 | 상태 | 설명 |
| --- | --- | --- |
| AI 모델 학습·평가 | 완료 | BEEP! 한국어 혐오표현 데이터, VALIDATION Macro-F1 0.6525 |
| 실제 추론 API | 완료 | 학습한 모델로 실제 추론하는 FastAPI 서비스 |
| 판정 영수증 발급 | 완료 | 실제 추론 결과로 영수증 2건 발급, 실패 시 발급하지 않음(17개 실패 시나리오 통과) |
| 영수증 묶음 고정 | 완료 | Epoch 1에 영수증 2건을 고정, 독립 재계산으로 root 일치 확인 |
| 스마트 컨트랙트 | 배포 완료 | [Base Sepolia 컨트랙트](https://sepolia.basescan.org/address/0xd17bA590b23E984e3F3408bcdC3529BE9868EC50) |
| 두 노트북 간 보안 연결 | 완료 | 송신 노트북 → 원본 DB 호스트 사설 SSH, 허용된 동작만 가능함을 실제 확인 |
| 블록체인에 Epoch 등록 | **완료** | [tx `0x175b3c1a…7286`](https://sepolia.basescan.org/tx/0x175b3c1ad237a087984b17b47c0343fedfd314a5eb1c34ba7a22511b5cc67286), 블록 48,358,039. 송신 전에 원본 DB에 먼저 기록 |
| 원본 DB 확정 | **완료** | 12회 이상 확인·이벤트·getter 검증 후 CONFIRMED와 확인 증거 기록 |
| 이용자 브라우저 독립 검증 | **완료** | 실제 브라우저·공개 RPC로 정상 VALID, 변조 3종 탐지, 불완전 bundle 거부 (7/7) |

전체 단계 판정(W4 GATE-4)은 **통과(PASS, 기술 조건 14/14)** 입니다. 정책 기준값은 시험용(provisional)이며 팀 확정 전이고, 이번 등록은 테스트넷 시연입니다. 시험 데이터(TEST)는 정책 확정 전까지 봉인해 두었습니다.

## 멘토님께: 먼저 읽을 자료

1. [3회차 멘토링 사전자료](docs/mentor-prep-session3.md): 성과·한계·여쭙고 싶은 질문 4가지
2. [W4 팀 통합 현황](docs/progress/W4.md): 담당별 결과, 실제 등록·확정·브라우저 검증
3. [실제 등록 공개 증거](docs/handoffs/w4-anchored-epoch-public/20261020-r01/README.md): tx, 블록, proof/anchor 포함 영수증 2건, 브라우저 검증 화면
4. [현재 상태 요약](docs/03-current-status.md): 항목별 상태표
5. [전체 문서 안내](docs/README.md)

## 구성과 담당

| 경로 | 담당·책임 |
| --- | --- |
| [ai/](ai/README.md) | A / 주진호 (팀장): 데이터·모델 학습·추론 API·평가·정책 후보 |
| [backend/](backend/README.md) | F / 노유신: API·SQLite·영수증 발급·Epoch 고정·확인 절차 |
| [backend/contracts/](backend/contracts/README.md) | T / 설경민: 스마트 컨트랙트·배포·블록체인 송신 |
| [frontend/](frontend/) | 서비스 화면과 브라우저 검증기 |
| [shared/protocol/](shared/protocol/) | 영수증 직렬화·hash·Merkle 공통 규칙 |
| [docs/](docs/README.md) | 결정 기록·주차별 진행·증빙·멘토링 자료 |

## 직접 실행해 보기

브라우저 데모는 합성 점수와 모의 원장으로 동작합니다. 실제 모델 가중치와 원본 DB는 저장소에 없으므로, clone만으로 실제 W4 환경이 구성되지는 않습니다.

```sh
git clone https://github.com/jujinho03/verimod.git
cd verimod/frontend
npm ci
npm run dev
```

터미널에 나온 localhost 주소를 엽니다. 전체 회귀 검사는 저장소 루트에서 `node scripts/check-all.mjs`입니다. [데모 안내](docs/08-submission-guide.md)를 참고하세요.

## 검증 세부 결과

| 항목 | 결과와 한계 |
| --- | --- |
| AI-09 실제 추론 | PASS. 선정 R01 가중치·고정 tokenizer로 실제 forward. 점수는 확률 보정 전(UNCALIBRATED) |
| AI-21 VALIDATION | PASS. 1,255건, Macro-F1 **0.6524599868976999**, Accuracy **0.6629482071713148** |
| 실제 A/F E2E | FULL/TRUNCATED 정상 2건, Fail Closed **17/17**, Python/Node 정책 parity **21/21** |
| 실제 발급·Freeze | Receipt 2건, Epoch 1, version 1, 독립 Merkle·SQLite 재개방 PASS |
| 원본 DB 상태 | FROZEN, tx_hash=null. 시험 전후 DB 내용 불변 |
| 실제 T → A SSH status 왕복 | PASS. 공개키 인증·고정 조회만 허용, 셸/PTY/포워딩/SFTP/다른 계정 차단 |
| F confirmation 회귀 | **192/192 PASS**. 합성 DB/RPC stub 기반이며 실제 체인 검증은 아님 |
| main 통합 회귀 | frontend 200, browser 1, backend 197, contracts 18, 각 build PASS (CI 통과) |
| 실제 Epoch 등록 | PASS. tx `0x175b…7286`, 블록 48,358,039, 이벤트·EIP-1898 getter 일치, tx 1건 |
| 원본 F DB 확정 | PASS. SUBMITTING → SUBMITTED → CONFIRMED, 확인 339회, 확인 증거 원자적 기록 |
| 브라우저 실제 검증 | PASS 7/7. VALID 2, HASH_MISMATCH, INVALID_PROOF, UNTRUSTED_ANCHOR 2, PENDING_ANCHOR |

실제 고정된 Epoch 1 root:

```text
0x32bf54ab91c8727e476bd4aaa13dacc6af4eaa8273656317ce7f331e29a29f82
```

AI는 `hate / offensive / none` 3개 클래스를 예측하고, 외부에는 `hate / offensive` 점수만 냅니다. `none`이 곧 허용(ALLOW)을 뜻하지 않으며, 허용/검토/제한은 별도 정책이 결정합니다.

[실행 근거와 수치 해설](docs/evidence/w4-a-actual-frozen-epoch.md) · [F 검사 범위](docs/evidence/w4-f-confirmation/20261017/README.md) · [운영 절차와 승인 구분](docs/handoffs/W4-AFT-operations.md)

## 통합한 소스

2026-10-18에 세 담당의 W4 작업을 main에 병합했습니다. 아래 고정 커밋은 실제 실행 증거가 가리키는 기준입니다.

| 영역 | 고정 커밋 | 범위 |
| --- | --- | --- |
| W3 공동 통합 | `1401e03931f76ed8405454081adb9478339bae67` | 실제 모델 출력 fixture, backend 발급, 공유 규격 |
| A: AI·평가·연동 | [`3a8993b`](https://github.com/jujinho03/verimod/tree/3a8993bfaf36642d2a67d0a147da9086008bd912) | 실제 추론, VALIDATION 평가, 정책 비교/parity, A/F E2E |
| F: 서비스·검증 | [`c1f750e`](https://github.com/jujinho03/verimod/tree/c1f750ea3752037d749324f1535df051ce6b37f9) | HTTP adapter, Manifest 검증, SQLite Freeze·durable ACK·confirmation |
| T: 프로토콜·체인 | [`7534907`](https://github.com/jujinho03/verimod/tree/7534907fa3ad66cc6ed29cfbee2efd8c2c75369e) | Issuer·승인 프로필, F ACK 후 송신, SUBMITTED/CONFIRMED 분리 |

## 신뢰와 공개 범위

- 원문·salt·private package·서명키·DB 경로는 공개하지 않습니다.
- 실제 두 영수증의 proof/anchor는 원본 DB가 12회 이상 확인 후 CONFIRMED가 된 뒤에만 공개했습니다(2026-10-20). 그 전 동결 시점 자료(proof/anchor null)도 보존합니다.
- 해시·Merkle·앵커는 AI의 정확성·공정성, 실제 모델 실행, 전체 기록의 완전성을 증명하지 않습니다.
- 과거 실패 증거와 W3 원본은 지우지 않고 보존합니다.
