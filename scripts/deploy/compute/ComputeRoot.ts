import { getAddress, parseUnits, solidityKeccak256 } from "ethers/lib/utils"; // Ethers utils
import fs from "fs/promises"; // Filesystem
import keccak256 from "keccak256"; // Keccak256 hashing
import {claimList} from "../../addresses/claim";
import {writeFileSync} from "fs";
import {MerkleTree} from "merkletreejs"; // MerkleTree.js


function generateLeaf(address: string, value: string): Buffer {
    return Buffer.from(
        // Hash in appropriate Merkle format
        solidityKeccak256(["address", "uint256"], [address.toLowerCase(), value]).slice(2),
        "hex"
    );
}

async function main(): Promise<void> {
    console.log("Generating Merkle tree.");
    // Generate merkle tree
    const leaves = claimList.map((val) => {
            const address = val[0];
            const value = val[1];
            return generateLeaf(address, value);
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
    writeFileSync('tmp/merkleTree.txt', JSON.stringify({
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