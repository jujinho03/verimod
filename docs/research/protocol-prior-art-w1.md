# DOC-12(T) — Protocol 선행 사례와 신뢰 경계

## 상태

- 담당: T / 설경민
- W1 late evidence closure; 2026-10-01 기록.
- 조사 / 선행 사례 정리만 다룹니다. Protocol 구현, freeze 결정, 제공자 채택이 아닙니다.
- Receipt field, TrustProfile, ABI, witness quorum, TEE 제공자, production 아키텍처를 새로 도입하지 않습니다.

## 1. Sigstore Rekor

### 무엇인가

Rekor는 서명된 소프트웨어 metadata를 위한 Sigstore의 transparency log입니다. Sigstore는 이를 여러 당사자가 서명된 metadata를 기록하고 조회할 수 있는 불변·변조 저항 원장으로 설명하며, 기록된 소프트웨어가 올바르다는 일반적인 주장은 아닙니다.[^rekor-overview]

### 메커니즘

Entry는 Merkle tree에 누적됩니다. Rekor는 주기적으로 tree와 timestamp에 서명합니다. 검증자는 entry의 inclusion proof를 받아, 신뢰하는 log key material로 서명된 tree head(checkpoint / signed tree head)를 확인할 수 있습니다.[^sigstore-security][^rekor-cli]

### Inclusion / consistency

Inclusion proof는 특정 entry가 commit된 tree에 존재함을 입증합니다. Consistency 점검은 tree 상태들을 비교해 append-only 동작을 확인합니다. 즉 이전 entry가 바뀌거나 삭제되지 않고 남아 있어야 합니다. Rekor는 이를 entry 내용의 자동 의미 검증이 아니라 auditor의 책임으로 문서화합니다.[^rekor-overview]

### Witness / monitoring

Rekor 문서는 monitoring을 요구합니다. Auditor는 consistency를, identity 소유자는 자신의 identity를 monitoring할 수 있습니다. Sigstore는 제삼자 monitoring이 없으면 Rekor/Fulcio의 오작동이 탐지되지 않을 수 있다고도 밝힙니다.[^rekor-overview][^sigstore-security]

### Operator 신뢰 경계

Trust root는 Rekor 자료를 검증하지만, 서명된 log entry는 서명/기록 사건만 기록합니다. Log operator 서명, Merkle proof, checkpoint, monitor, 독립 검증자는 탐지되지 않는 equivocation 위험을 줄일 뿐, entry 안의 대상이 참이거나 안전하게 만들어 주지는 않습니다.

### 증명하는 것

암호학적 검증이 성공하고 설정된 trust root를 전제로 할 때, 특정 서명 entry가 특정 commit된 log 상태에 포함되었고 append-only 이력을 감사할 수 있다는 주장을 뒷받침할 수 있습니다.

### 증명하지 않는 것

Inclusion은 의미적 정확성이 아닙니다. Rekor entry는 해당 artifact가 무해하다는 것, 그 주장이 정확하다는 것, 서명자가 침해되지 않았다는 것, 그 artifact에 근거한 결정이 옳다는 것을 증명하지 않습니다.

## 2. Ethereum Witnessing 참고 사례 — su3.io

### 출처 정보

- 제목: *Witnessing Sigstore's transparency log from the Ethereum blockchain*
- 저자: Heyang Zhou
- 게시: 2024-08-25
- 접근: 2026-10-01
- 성격: 독립적인 기술 글이자 prototype 참고 자료이며, Sigstore 공식 Ethereum 아키텍처가 **아닙니다**.[^su3]

### 다루는 문제

이 글은 침해된 log의 split-view 공격, 즉 서로 다른 client에게 서로 다른 signed tree head를 보여 줄 수 있는 문제를 다룹니다. Tree head를 가져와 공동 서명하는 제삼자 witness를 완화책 중 하나로 제시하면서도, client가 정직한 witness에 닿아야 한다는 점을 짚습니다.[^su3]

### 설명된 메커니즘

Prototype은 Rekor tree head, operator 서명, Merkle consistency proof를 Scroll smart contract에 제출합니다. 이어 Scroll의 state trie root와 zero-knowledge 상태 전이 증명을 Ethereum에 commit하는 과정을 설명합니다. 검증자는 신뢰하지 않는 Ethereum, Scroll, Rekor 서비스에서 evidence를 모아, entry가 공개 state commitment까지 이어지는지 확인합니다.[^su3]

### Ethereum / L2의 역할

이 참고 사례에서 Scroll/Ethereum은 외부 공개 commitment / witness 지점을 제공하고, log는 여전히 Rekor입니다. 성능, 비용, 블록체인 보안에 대한 평가는 저자의 의견이며 VeriMod가 채택한 속성이 아닙니다.

### 강화할 수 있는 것

Inclusion, consistency, operator 서명, 외부 공개 commitment를 독립적으로 확인함으로써 log operator 하나에만 의존하는 정도를 줄이는 유용한 예시입니다.

### 증명하지 않는 것

서명된 artifact의 진실성이나 품질을 증명하지 않고, 모든 신뢰 가정을 없애지 않으며, Ethereum이 어디서나 최선의 witness라는 뜻도 아닙니다. 이 prototype이 Sigstore 표준이 되는 것도 아닙니다.

## 3. TEE / Inference Attestation

A 담당 노트는 [tee-inference-attestation-w1.md](tee-inference-attestation-w1.md)입니다.[^tee-note]

### Model manifest의 한계

`model_manifest_hash`는 기록된 model/revision/configuration manifest를 식별할 뿐, 그 모델이 특정 inference를 수행했다는 것을 증명하지 않습니다.

### 출력 서명과 서명자 침해

출력 서명은 출력을 서명자/key에 묶고 이후 변경을 드러낼 수 있습니다. 그러나 서명 서버, key, 서명 경로가 침해되면 잘못된 출력도 유효한 서명을 가질 수 있습니다.

### TEE / remote attestation과 정확성 경계

TEE와 remote attestation은 measurement, endorsement, verifier policy를 통해 실행 환경 신뢰를 강화하는 향후 방향입니다. W1에서 구현하거나 선정하지 않았으며, AI moderation 판단이 의미적으로 옳다는 것을 증명하지 않습니다.

## 4. 비교표

| 항목 | 주 대상 | Commitment / 검증 | 신뢰 / witness 모델 | 실행 attestation | 정확성 보장 | 개인정보 영향 | VeriMod 관련성 / 현재 상태 |
|---|---|---|---|---|---|---|---|
| Sigstore Rekor | 서명된 소프트웨어 metadata | Merkle inclusion, signed tree head, consistency audit | Sigstore trust root와 monitor/auditor | 없음 | artifact 의미적 정확성 보장 없음 | 공개 서명 metadata를 감사 가능 | 선행 사례만 |
| su3.io Ethereum witness 참고 사례 | Rekor tree head와 consistency proof | 공개 chain state commitment와 Rekor/operator 증명 | Prototype의 Ethereum/Scroll 및 검증자 가정 | 없음 | entry/artifact 정확성 보장 없음 | 공개 commitment/evidence가 관찰될 수 있음 | 선행 사례만; 채택하지 않음 |
| VeriMod W1 설계 | Decision Receipt epoch commitment | Receipt hash, 순서가 있는 Merkle 연결, 계획된 외부 anchor | TrustProfile working-assumption draft가 계획된 검증 기준; FRZ-01 대기 | 없음 | AI 판단 정확성 보장 없음 | 원본 콘텐츠/salt를 chain에 올리지 않음 | 설계 초안; VeriModAnchor 배포나 epoch anchor 없음 |
| TEE / remote attestation 향후 방향 | 측정된 inference/서명 환경 | Attestation evidence, endorsement, reference value, policy | Hardware/platform root와 verifier policy | 가능성 있음 | AI 의미적 정확성 보장 없음 | Attestation 자료가 platform metadata를 노출할 수 있음 | 조사만; 선정·구현하지 않음 |

## 5. VeriMod 설계 시사점

VeriMod의 블록체인 계층은 AI moderation 판단이 옳다는 것을 증명하지 **않습니다**. 의도한 범위는 Decision Receipt commitment, epoch/Merkle 연결, 외부 timestamp/anchor, 발급 이후 기록 무결성, 사용자 독립 검증입니다.

Rekor와 Ethereum witnessing 참고 사례는 inclusion, consistency, 외부 witnessing, 단일 operator 의존 완화와 관련이 있습니다. 이들이 새로운 VeriMod protocol 결정을 승인하지는 않습니다. TEE는 inference 실행 신뢰를 강화할 수 있는 향후 경로일 뿐, W1 구현이나 채택이 아닙니다.

## 6. 출처

[^rekor-overview]: [Rekor overview](https://docs.sigstore.dev/logging/overview/), Sigstore, 2026-10-01 접근.
[^sigstore-security]: [Security Model](https://docs.sigstore.dev/about/security/), Sigstore, 2026-10-01 접근.
[^rekor-cli]: [Rekor CLI](https://docs.sigstore.dev/logging/cli/), Sigstore, 2026-10-01 접근.
[^su3]: [Witnessing Sigstore's transparency log from the Ethereum blockchain](https://su3.io/posts/witnessing-sigstore-from-ethereum), Heyang Zhou, 2024-08-25, 2026-10-01 접근.
[^tee-note]: [DOC-12(A) — TEE / Inference Attestation W1 Note](tee-inference-attestation-w1.md), repository 조사 노트, 2026-09-30 기록, 2026-10-01 열람.
