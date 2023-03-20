// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.13;

/// ============ Imports ============

import {IFLDX} from "../../interface/IFLDX.sol";
import {IVe} from "../../interface/IVe.sol";
import {MerkleProof} from "./MerkleProof.sol";


/// @title MerkleClaim
/// @notice Claims FLDX for members of a merkle tree
/// @author Modified from Merkle Airdrop Starter (https://github.com/Anish-Agnihotri/merkle-airdrop-starter/blob/master/contracts/src/MerkleClaimERC20.sol)
contract MerkleVeNFTClaim {
    /// ============ Immutable storage ============
    IFLDX public immutable fldx;
    IVe public immutable ve;
    bytes32 public immutable merkleRoot;

    /// ============ Mutable storage ============

    /// @notice Mapping of addresses who have claimed tokens
    mapping(address => bool) public hasClaimed;
    address internal admin;
    bool public claimEnabled;

    /// ============ Constructor ============

    /// @notice Creates a new MerkleClaim contract
    /// @param _fldx address
    /// @param _merkleRoot of claimees
    constructor(address _fldx, address _ve, bytes32 _merkleRoot) {
        fldx = IFLDX(_fldx);
        merkleRoot = _merkleRoot;
        ve = IVe(_ve);
        admin = msg.sender;
    }

    /// ============ Functions ============

    function setClaimEnabled() external {
        require(msg.sender == admin, 'NOT_ADMIN');
        claimEnabled = true;
        admin = address(0);
    }

    /// @notice Allows claiming tokens if address is part of merkle tree
    /// @param to address of claimee
    /// @param lockedAmount amount of lock owed to claimee
    /// @param lockedDuration duration of lock in seconds
    /// @param proof merkle proof to prove address and amount are in tree
    function claim(
        address to,
        uint256 lockedAmount,
        uint256 lockedDuration,
        bytes32[] calldata proof
    ) external {
        require(claimEnabled == true, 'CLAIM_NOT_ENABLED');
        // Throw if address has already claimed tokens
        require(!hasClaimed[to], "ALREADY_CLAIMED");

        // Verify merkle proof, or revert if not in tree
        bytes32 leaf = keccak256(abi.encodePacked(to, lockedAmount, lockedDuration));
        bool isValidLeaf = MerkleProof.verify(proof, merkleRoot, leaf);
        require(isValidLeaf, "NOT_IN_MERKLE");

        // Set address to claimed
        hasClaimed[to] = true;

        // Claim veNFT
        fldx.claim(address(this), lockedAmount);
        fldx.approve(address(ve), type(uint).max);
        ve.createLockFor(lockedAmount, lockedDuration, to);
    }
}