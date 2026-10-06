# I4 Anchor ABI — W3 minimal implementation

상태: **IMPLEMENTED MINIMAL ABI; semantic freeze/GATE-2는 별도 PENDING.** `backend/contracts/contracts/VeriModAnchor.sol`과 이 ABI의 diff는 0이다. 이 구현은 I1 taxonomy/API consumer semantics의 freeze 또는 actual deployment를 뜻하지 않는다.

```solidity
struct Epoch {
    bytes32 root;
    uint32 count;
    uint16 protocolVersion;
}

address public immutable publisher;
mapping(uint64 => Epoch) public epochs;

event EpochRegistered(
    uint64 indexed epochId,
    bytes32 root,
    uint32 count,
    uint16 protocolVersion
);

error NotPublisher();
error EpochExists();
error EmptyEpoch();
error ZeroRoot();

function registerEpoch(
    uint64 epochId,
    bytes32 root,
    uint32 count,
    uint16 protocolVersion
) external;
```

## 의미

- `epochId`는 10진 bundle locator와 같은 논리 epoch를 가리킨다. 서버의 임의 문자열 ID를 그대로 ABI에 넣지 않는다.
- epoch는 한 번만 등록하며 root를 갱신하거나 삭제하는 함수는 두지 않는다.
- `count == 0`, `root == bytes32(0)`, publisher 외 호출, 이미 존재하는 epoch는 각각 거부한다.
- contract는 protocol version을 저장할 뿐 지원 여부를 판정하지 않는다. verifier가 활성 TrustProfile의 지원 version과 비교한다.
- 원문, salt, 개인정보, appeal 본문, model/policy 상세, receipt hash 개별값은 온체인에 저장하지 않는다.

## CURRENT과 구현 전제

`ToolchainCheck.sol`은 별도의 툴체인 확인용 회귀 파일로 남는다. `VeriModAnchor` constructor와 deployment script는 zero publisher를 거부한다. actual Base Sepolia contract address/publisher/tx/block은 배포 증거가 생길 때만 TrustProfile에 기록한다.
