// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @notice 컴파일·배포·테스트 툴체인 연결 확인용 임시 컨트랙트.
/// VeriMod 판정 기록 컨트랙트가 아니며, 실제 컨트랙트를 구현할 때 삭제한다.
contract ToolchainCheck {
    function ping() external pure returns (string memory) {
        return "verimod-contracts";
    }
}
