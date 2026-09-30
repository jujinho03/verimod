# DOC-12(A) — TEE / Inference Attestation W1 Note

- Status: **W1 research contribution only** — A 주진호의 T 설경민 전달용 요약.
- Recorded: **2026-09-30**, W1 late evidence closure. W1 nominal period(09/21~09/27)에 이미 존재한 문서로 소급하지 않는다.
- Audit baseline: `4531d35290894e912264cf1232dc48808a8e5e87`.
- Scope: 연구 요약 보존. 실제 TEE·inference signature 구현, provider 채택, schema/key/freeze 결정이 아니다. T의 별도 수신 확인·검토 승인 완료도 주장하지 않는다.

## T에게 전달할 한 문단 summary

`model_manifest_hash`는 기록된 모델·revision·설정 manifest를 대조하는 값이며 해당 모델이 실제로 입력을 처리했다는 실행 증명은 아니다([기존 repository 한계](../06-p1-backlog.md), §모델 manifest 관련 완료조건). Inference output signing은 신뢰하는 추론 서명자의 키와 서명 대상 결과를 연결하고 사후 변경을 검출하므로, 키·역할 분리가 전제되면 receipt 발급 계층만 믿는 범위를 줄일 수 있다. 그러나 이는 서명 원천/무결성 보장이지 모델 실행이나 판정 정답성 자체의 증명이 아니다[S1]. 추론 서버 침해로 공격자가 signing key 또는 서명 경로를 제어하면 거짓 결과도 정상 서명할 수 있어 software signing만으로는 그 한계를 없애지 못한다(VeriMod 위협 분석). 더 강한 production 방향으로는 TEE에서 추론·키 사용 경계를 보호하고 remote attestation의 측정값·endorsement·reference values를 verifier policy로 검증하는 방식을 검토할 수 있다[S2,S3]. 다만 hardware/platform trust root와 검증 정책을 신뢰해야 하며, 측정된 실행 환경을 특정 model/input/output 및 freshness에 연결하는 설계가 별도로 필요하다. Attestation 문서만으로 특정 추론의 실행·정확성을 자동 보장하지 않는다. W4 AI-14 inference signature는 최신 사용자 지시상 후속 구현 범위로 남기며, 이 W1 note는 그 보장과 한계를 전달할 뿐 W4 착수·TEE 채택을 뜻하지 않는다.

## 근거와 적용 경계

| Source | 확인한 의미 | VeriMod에 적용할 때의 경계 |
|---|---|---|
| [S1: NIST FIPS 186-5, Digital Signature Standard](https://csrc.nist.gov/pubs/fips/186-5/final) | digital signature의 데이터 변경 검출·서명자 인증 목적 | 서명 검증을 AI correctness 또는 실제 모델 실행 증명으로 확대하지 않음. 키/서명 경로 침해 영향은 위 위협 분석 |
| [S2: IETF RFC 9334, RATS Architecture §3, §7](https://www.rfc-editor.org/rfc/rfc9334.html) | Attester evidence, Verifier appraisal policy/reference values/endorsements, Relying Party 및 attestation 신뢰 관계 | 측정 근거와 신뢰 정책을 검증해야 함. 특정 VeriMod inference에 대한 결합 방식은 미설계 |
| [S3: AWS Nitro Enclaves — Cryptographic attestation](https://docs.aws.amazon.com/enclaves/latest/user/set-up-attestation.html) | enclave 측정값을 포함한 signed attestation document를 외부 서비스 정책으로 검증하는 공식 사례 | TEE 구현 사례일 뿐 AWS 도입 결정 아님. 일반 추론 서버의 서명과 환경 attestation을 구분 |

Sources accessed: **2026-09-30**. [I1 draft](../04-interface-contract-draft.md)의 `model_manifest_hash` 의미와 [기존 trust boundary](../01-domain-and-interfaces.md)의 actual inference attestation 범위 밖 설명을 함께 읽는다. 문서의 VeriMod 적용 부분은 연구 분석이며 source가 VeriMod를 검증했다는 뜻이 아니다.

DOC-12(A) = **PASS — W1 research summary evidence only**. T의 전체 DOC-12 또는 팀 보안 구현 완료가 아니다. TEE / inference signing / hardware trust root 구현: **NO**. 새로운 MUST·protocol field·final algorithm·provider 선택: **NO**.
