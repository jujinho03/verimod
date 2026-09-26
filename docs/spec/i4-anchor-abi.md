# I4 Anchor ABI — W1 초안

상태: **WORKING ASSUMPTION**. FRZ-01 동결 전까지 구현 계약으로 사용하지 않는다.

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

현재 `backend/contracts/contracts/ToolchainCheck.sol`은 툴체인 확인용이며 이 ABI를 구현하지 않는다. W3의 `CHAIN-04`는 FRZ-01 동결 ABI와 diff 0일 때만 시작한다. deployment script는 zero publisher를 거부해야 한다.

