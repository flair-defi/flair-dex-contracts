import {Deploy} from "../Deploy";
import {ethers} from "hardhat";
import {Verify} from "../../Verify";
import {Misc} from "../../Misc";
import {writeFileSync} from "fs";
import {MaticAddresses} from "../../addresses/MaticAddresses";
import {MaticTestnetAddresses} from "../../addresses/MaticTestnetAddresses";

async function main() {
    const signer = (await ethers.getSigners())[0];

    const library = await Deploy.deployLibrary(signer, "0xC734F630c3fCAb7Adb9c2f0813068A9E8482fde7");

    console.log(library.address);

    // await Verify.verify(core[2].address);
    // await Verify.verifyWithArgs(core[0].address, [core[2].address]);
    // await Verify.verifyWithArgs(core[1].address, [core[0].address, MaticAddresses.WMATIC_TOKEN]);

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
