# CHAIN-01 — Base Sepolia W1 Funding Evidence

## Metadata

- Owner: T / 설경민
- Actual verification date: 2026-10-01
- Base main SHA: `e83ba3eba251e33b612af633b0e57b9bd26a5e80`
- Working branch: `docs/w1-t-final-closure`

## Wallet

- Public address: [`0xd47675BE41eC3476F541C1d8d8a9F622c90182Ed`](https://sepolia.basescan.org/address/0xd47675BE41eC3476F541C1d8d8a9F622c90182Ed)
- Dedicated VeriMod test wallet: **YES**
- Historical wallet reused: **YES**
- Private key tracked: **NO**
- `.env` tracked: **NO** (`git check-ignore -v backend/contracts/.env` reports the repository `.gitignore`; `git ls-files` finds no tracked `.env`.)

The private key was not read, printed, copied, or added to this document.

## RPC Validation

`npm run base:check` was executed with the existing ignored local configuration. The script derives and prints only the public address.

| Endpoint | Chain ID | Block observed | Balance observed |
|---|---:|---:|---:|
| Primary | 84532 | 47,528,918 | 0.0002 ETH |
| Backup | 84532 | 47,528,919 | 0.0002 ETH |

Both checks returned the same dedicated public address above. RPC URLs are not recorded here because endpoints are operational transport, not a trust root.

## Faucet and public transaction evidence

- Provider: Coinbase Developer Platform Base Sepolia faucet (`NativeTokenFaucet` implementation shown by the public explorer)
- Actual claim time: 2026-10-01T03:01:08Z
- Claimed test ETH: **0.0001 ETH** (`100000000000000` wei)
- Public transaction: [`0x904f8dd671132e236f206ddf61c82a3bdb88799f7cbdf640129f3ac3bce53884`](https://sepolia.basescan.org/tx/0x904f8dd671132e236f206ddf61c82a3bdb88799f7cbdf640129f3ac3bce53884)
- Network: Base Sepolia, chain ID 84532
- Transaction status: success (`0x1`)
- Transaction block: 47,527,690

The top-level transaction is a zero-value `claim(address receiver,uint256 amount)` call to the faucet proxy. This is expected for a contract-mediated faucet claim. Independent public explorer inspection of its internal transactions shows a successful internal `call` from the verified `NativeTokenFaucet` implementation to `0xd47675BE41eC3476F541C1d8d8a9F622c90182Ed` for `100000000000000` wei. The decoded `receiver` and `amount` arguments match that internal transfer.

Secondary public inspection: [Base Sepolia Blockscout transaction record](https://base-sepolia.blockscout.com/tx/0x904f8dd671132e236f206ddf61c82a3bdb88799f7cbdf640129f3ac3bce53884).

## Security

- Private key exposed: **NO**
- Seed exposed: **NO**
- `.env` committed: **NO**
- Actual/mainnet ETH used: **NO**
- Bridge used: **NO**
- Paid faucet used: **NO**

## Boundary

- Wallet funded: **YES**
- Balance verified: **YES**
- Outbound transaction: **NOT DONE**
- Contract deployment: **NOT DONE**
- VeriModAnchor deployment: **NOT DONE**
- Epoch anchoring: **NOT DONE**
- Mainnet: **NOT USED**
- Production readiness: **NO**

## Result

**CHAIN-01 = PASS — W1 FUNDING / BALANCE EVIDENCE.** This records test-wallet funding and read-only verification only. It does not claim a VeriMod contract deployment, anchor, or production readiness.
