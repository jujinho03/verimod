# TrustProfile — W1 초안

상태: **WORKING ASSUMPTION** (W2 FRZ-01에서 동결). 소유: PROTOCOL. `TrustProfile`은 검증기의 신뢰 루트이며, receipt bundle·API·RPC endpoint가 제공한 locator는 신뢰 루트가 아니다.

```ts
type TrustProfile = {
  profile_id: 'BASE_SEPOLIA_DEMO' | 'LOCAL_HARDHAT_FALLBACK'
  chain_id: '84532' | '31337'
  contract_address: string // normalized 20-byte EVM address
  publisher: string        // on-chain publisher()와 일치해야 함
  issuer_id: 'verimod-demo-issuer'
  supported_protocol_version: 1
  min_confirmations: number
}
```

## CURRENT과 TARGET의 차이

| 항목 | CURRENT browser PoC | TARGET |
|---|---|---|
| 신뢰 설정 | `TrustConfig`, 합성 `31337` 원장 | build에 승인된 Base Sepolia/Hardhat 2개 profile만 내장 |
| 발급자 검증 | `issuer_id` + `issuer_commitment` | `issuer_id`; `issuer_commitment` 의존 제거 |
| 확인 수 | 전역 상수 12 | profile별 `min_confirmations`; Base 값은 멘토 결정 전 미정, Local은 1 |
| 원장 | 메모리 시뮬레이션 | RPC로 `chainId`, `publisher()`, `epochs()` 및 등록 event 조회 |

이 표는 migration 계획이다. 현 `TrustConfig`, `EpochRecord`, `REQUIRED_CONFIRMATIONS`를 지금 변경하거나 legacy synthetic fixture의 의미를 바꾸지 않는다.

## TARGET 내장 위치와 선택

2026-09-30 Stage 8C W1 draft completeness 보완. 근거는 최신 사용자 Stage 8C 지시와 [decision register](../02-decision-register.md)의 D13 승인 방향이다. 아래 위치·선택 설명은 **WORKING ASSUMPTION / W1 design draft**이며 D13의 방향 승인과 상세 구현·동결을 구분한다.

- **TARGET registry:** `shared/trust/profiles.ts`에 `BASE_SEPOLIA_DEMO`, `LOCAL_HARDHAT_FALLBACK` 두 승인 profile만 build에 내장한다. 이 경로는 현재 main에 구현된 파일이 아니다.
- Receipt bundle, API response, RPC response, AnchorLocator는 새 profile을 추가하거나 trusted contract address/publisher를 교체할 수 없다. locator는 lookup hint이며 trust authority가 아니다.
- **Backend TARGET:** `VERIMOD_PROFILE`로 내장 profile ID 중 하나를 선택한다. 임의 external profile이나 bundle locator를 활성 profile로 승격하지 않는다.
- **Browser/demo TARGET:** 기본값은 `BASE_SEPOLIA_DEMO`다. demo selector 또는 `?profile=` 방식을 사용하더라도 선택값은 내장된 승인 profile으로 제한한다. 어떤 UX를 실제 사용할지는 미확정이다. `LOCAL_HARDHAT_FALLBACK`은 “로컬 폴백 - 공개 체인 증거 아님” 표시를 유지한다.
- Base `contract_address`, `publisher`, `min_confirmations`, actual deployed contract, final profile switch UX와 frozen implementation details는 **UNRESOLVED**다. 상세 동결은 W2 FRZ-01, 실제 주소/publisher는 deployment evidence의 경계를 따른다. FRZ-01 pending / deployment pending을 유지한다.

TRUST-01 = **PASS — W1 DRAFT ONLY**는 내장 위치와 선택 규칙을 설명한 초안의 완전성 판정이다. profile 최종 동결이나 runtime 구현 완료를 뜻하지 않는다.

## 판정 규칙

1. `chain_id`는 `BigInt`로 정규화해 비교한다. 문자열 표현 자체를 비교하지 않는다.
2. `contract_address`, `publisher`는 20-byte EVM address 검증 후 lowercase로 비교한다.
3. body `issuer_id`가 활성 profile과 다르면 `UNTRUSTED_ANCHOR` / FAIL이다.
4. RPC `eth_chainId`가 profile과 다르거나 조회 불가면 `RPC_UNAVAILABLE` / PENDING이다. 변조 판정이 아니다.
5. `publisher()` 불일치면 `UNTRUSTED_ANCHOR` / FAIL이다.
6. zero root 또는 등록 block을 확인하지 못하면 `PENDING_ANCHOR` / PENDING이다. 지원하지 않는 protocol version은 `UNSUPPORTED_VERSION` / FAIL이다.
7. receipt proof tree size와 on-chain epoch count가 다르거나 root 재계산이 실패하면 `INVALID_PROOF` / FAIL이다.
8. `EpochRegistered` event와 `epochs(epochId)`의 epochId/root/count/protocolVersion이 모두 일치하고, receipt status=1 및 `to`가 trusted contract일 때만 등록 block으로 인정한다.
9. confirmations는 `currentBlock - registrationBlock + 1`이다. profile의 최소 수에 도달하기 전에는 VALID가 아니라 PENDING이다.

## 운영 경계

`rpc_urls`, explorer URL, API의 manifest 목록, bundle의 contract 주소는 조회 편의 정보일 뿐 authority가 아니다. `LOCAL_HARDHAT_FALLBACK`은 반드시 “로컬 폴백 - 공개 체인 증거 아님”으로 표시한다.
