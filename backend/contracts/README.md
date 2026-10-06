# Contracts

`VeriModAnchor.sol`은 epoch Merkle root, count, protocol version만 한 번 등록하는 최소 계약입니다. publisher 외 호출, duplicate epoch, empty epoch, zero root를 거부합니다. protocol version의 지원 여부는 verifier/TrustProfile 책임입니다.

`ToolchainCheck.sol`은 기존 툴체인 회귀 확인용으로 유지합니다. `^0.8.28` pragma는 설정된 solc 0.8.34를 허용합니다.

Base Sepolia 사전점검은 `npm run base:check`로 primary/backup RPC의 raw chain ID와 (설정된 경우) dedicated wallet 잔액을 확인합니다. `.env.example`을 `.env`로 복사하고 키와 publisher address를 설정한 뒤, 실제 배포가 승인된 경우에만 `npm run deploy:base-sepolia`을 실행합니다. 배포 주소·tx·block·explorer 증거 없이는 deployment 완료를 주장하지 않습니다.
