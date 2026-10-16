# Deployments

## W4 Base Sepolia actual anchor contract

This is the W4 deployment used by `BASE_SEPOLIA_DEMO`. It is separate from the W3 historical synthetic-smoke contract and has no synthetic epoch registered against it.

| field | observed value |
|---|---|
| chain ID | `84532` (Base Sepolia) |
| contract | [`0xd17bA590b23E984e3F3408bcdC3529BE9868EC50`](https://sepolia.basescan.org/address/0xd17bA590b23E984e3F3408bcdC3529BE9868EC50) |
| deployment tx | [`0xd80cdfe4f726b7902f11c35cb0565e19296dc4f012c3cdab3dcbaa15f08b6d1b`](https://sepolia.basescan.org/tx/0xd80cdfe4f726b7902f11c35cb0565e19296dc4f012c3cdab3dcbaa15f08b6d1b) |
| deployment block | `48012271` |
| immutable publisher | `0xd47675be41ec3476f541c1d8d8a9f622c90182ed` |
| post-deploy public RPC check | `eth_chainId=0x14a34`; `publisher()` returned the value above; deployed code length `1493` bytes |
| deployer/publisher balance before deployment | `0.000197227365088957 ETH` |
| balance after deployment check | `0.000194947587088037 ETH` |

The publisher key is a dedicated Base Sepolia EOA. The sender runs server-side with that key; a browser never receives it.

## Approval boundary

`frontend/src/domain/approvedProfiles.ts` contains the only selectable profiles: `BASE_SEPOLIA_DEMO` (the deployment above) and `LOCAL_HARDHAT_FALLBACK`. Local 31337 is explicitly not public-chain evidence. A bundle's locator is lookup evidence only; it cannot change the profile's chain, contract, publisher, issuer, or supported protocol version.

W4's team-approved authoritative issuer is `verimod-example-platform`. Both selectable profiles reference the protocol's `ISSUER_ID`; its issuer commitment is `0xf33ae051ff115acdd407db30a10b64b680621b2a2967871a48bcc30b9aa16fd5`. This aligns the verifier with F's receipt issuer without changing the Base Sepolia deployment boundary.

## Actual epoch status

**PENDING F freeze handoff.** No W3 synthetic root was sent to this W4 contract. Once F supplies its atomically frozen `epochId`, root, count, and protocol version, run `npm run epoch:register` in `backend/contracts`. The sender writes raw signed transaction/hash/nonce before broadcast, rejects existing mismatched roots as `ROOT_CONFLICT`, then verifies receipt success, destination, `EpochRegistered`, and `epochs(epochId)` before recording `CONFIRMED`.
