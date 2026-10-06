// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/// @notice Immutable, per-epoch commitment registry for VeriMod receipt Merkle roots.
/// @dev This is deliberately not a global log, head registry, or model-execution proof.
contract VeriModAnchor {
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

    constructor(address publisher_) {
        if (publisher_ == address(0)) revert NotPublisher();
        publisher = publisher_;
    }

    function registerEpoch(
        uint64 epochId,
        bytes32 root,
        uint32 count,
        uint16 protocolVersion
    ) external {
        if (msg.sender != publisher) revert NotPublisher();
        if (epochs[epochId].count != 0) revert EpochExists();
        if (count == 0) revert EmptyEpoch();
        if (root == bytes32(0)) revert ZeroRoot();

        epochs[epochId] = Epoch({root: root, count: count, protocolVersion: protocolVersion});
        emit EpochRegistered(epochId, root, count, protocolVersion);
    }
}
