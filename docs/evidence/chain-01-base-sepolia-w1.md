# CHAIN-01 — Base Sepolia W1 Funding Evidence

## Metadata

- 담당: T / 설경민
- 실제 검증일: 2026-10-01
- 기준 main SHA: `e83ba3eba251e33b612af633b0e57b9bd26a5e80`
- 작업 브랜치: `docs/w1-t-final-closure`

## Wallet

- 공개 주소: [`0xd47675BE41eC3476F541C1d8d8a9F622c90182Ed`](https://sepolia.basescan.org/address/0xd47675BE41eC3476F541C1d8d8a9F622c90182Ed)
- VeriMod 전용 테스트 wallet: **YES**
- 과거 wallet 재사용: **YES**
- Private key 추적 여부: **NO**
- `.env` 추적 여부: **NO** (`git check-ignore -v backend/contracts/.env`가 repository `.gitignore`를 보고하며, `git ls-files`에서 추적 중인 `.env`가 없습니다.)

Private key는 읽거나, 출력하거나, 복사하거나, 이 문서에 추가하지 않았습니다.

## RPC 검증

기존의 무시된(ignored) 로컬 설정으로 `npm run base:check`를 실행했습니다. Script는 공개 주소만 도출해 출력합니다.

| Endpoint | Chain ID | 관측 block | 관측 잔액 |
|---|---:|---:|---:|
| Primary | 84532 | 47,528,918 | 0.0002 ETH |
| Backup | 84532 | 47,528,919 | 0.0002 ETH |

두 점검 모두 위의 같은 전용 공개 주소를 반환했습니다. Endpoint는 운영상의 전송 경로일 뿐 trust root가 아니므로 RPC URL은 여기에 기록하지 않습니다.

## Faucet과 공개 transaction evidence

- 제공자: Coinbase Developer Platform Base Sepolia faucet (공개 explorer에 `NativeTokenFaucet` 구현으로 표시됨)
- 실제 수령 시각: 2026-10-01T03:01:08Z
- 수령한 테스트 ETH: **0.0001 ETH** (`100000000000000` wei)
- 공개 transaction: [`0x904f8dd671132e236f206ddf61c82a3bdb88799f7cbdf640129f3ac3bce53884`](https://sepolia.basescan.org/tx/0x904f8dd671132e236f206ddf61c82a3bdb88799f7cbdf640129f3ac3bce53884)
- Network: Base Sepolia, chain ID 84532
- Transaction 상태: success (`0x1`)
- Transaction block: 47,527,690

최상위 transaction은 faucet proxy에 대한 금액 영(zero-value)의 `claim(address receiver,uint256 amount)` 호출입니다. Contract를 경유하는 faucet 수령에서는 예상되는 형태입니다. 공개 explorer로 internal transaction을 독립적으로 확인한 결과, 검증된 `NativeTokenFaucet` 구현에서 `0xd47675BE41eC3476F541C1d8d8a9F622c90182Ed`로 `100000000000000` wei를 보내는 internal `call`이 성공했습니다. 디코딩한 `receiver`와 `amount` 인자는 해당 internal 전송과 일치합니다.

보조 공개 확인: [Base Sepolia Blockscout transaction 기록](https://base-sepolia.blockscout.com/tx/0x904f8dd671132e236f206ddf61c82a3bdb88799f7cbdf640129f3ac3bce53884).

## 보안

- Private key 노출: **NO**
- Seed 노출: **NO**
- `.env` commit: **NO**
- 실제/mainnet ETH 사용: **NO**
- Bridge 사용: **NO**
- 유료 faucet 사용: **NO**

## 경계

- Wallet 충전: **YES**
- 잔액 검증: **YES**
- Outbound transaction: **NOT DONE**
- Contract 배포: **NOT DONE**
- VeriModAnchor 배포: **NOT DONE**
- Epoch anchoring: **NOT DONE**
- Mainnet: **NOT USED**
- Production 준비: **NO**

## 결과

**CHAIN-01 = PASS — W1 FUNDING / BALANCE EVIDENCE.** 테스트 wallet 충전과 읽기 전용 검증만 기록합니다. VeriMod contract 배포, anchor, production 준비 완료를 주장하지 않습니다.
