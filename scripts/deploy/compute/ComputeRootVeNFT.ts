import { getAddress, parseUnits, solidityKeccak256 } from "ethers/lib/utils"; // Ethers utils
import fs from "fs/promises"; // Filesystem
import keccak256 from "keccak256"; // Keccak256 hashing
import {claimList} from "../../addresses/claim";
import {writeFileSync} from "fs";
import {MerkleTree} from "merkletreejs";
import {veNFTClaimList} from "../../addresses/veNFTClaim";
import {address} from "hardhat/internal/core/config/config-validation"; // MerkleTree.js


function generateLeaf(address: string, amount: string, duration: string): Buffer {
    return Buffer.from(
        // Hash in appropriate Merkle format
        solidityKeccak256(["address", "uint256", "uint256"], [address.toLowerCase(), amount, duration])
            .slice(2),
        "hex"
    );
}

async function main(): Promise<void> {
    console.log("Generating Merkle tree.");
    // Generate merkle tree
    const leaves =  veNFTClaimList.map((val) => {
        return generateLeaf(val[0], val[1], val[2]);
    });

    const merkleTree = new MerkleTree(
        leaves,
        keccak256,
        { sortPairs: true }
    );

    // Collect and log merkle root
    const merkleRoot = merkleTree.getHexRoot();
    console.log(`Generated Merkle root: ${merkleRoot}`);

    // Collect and save merkle tree + root
    writeFileSync('tmp/veNFTMerkleTree.txt', JSON.stringify({
        root: merkleRoot,
        tree: merkleTree
    }));
    console.log("Generated merkle tree and root saved to merkle.json.");
}



main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });