import {Deploy} from "../Deploy";
import {ethers} from "hardhat";
import {writeFileSync} from "fs";
import {TestnetAddresses} from "../../addresses/TestnetAddresses";
import {GovernanceTreasury, WETH} from "../../../typechain";

async function main() {
    const signer = (await ethers.getSigners())[0];

    const core = await Deploy.deployContract(signer, 'WETH') as WETH;

    console.log(core.address);
    writeFileSync('tmp/weth.txt', core.address);

    // await Misc.wait(5);
    //
    // await Verify.verify(core[2].address);
    // await Verify.verifyWithArgs(core[0].address, [core[2].address]);
    // await Verify.verifyWithArgs(core[1].address, [core[0].address, TestnetAddresses.WXDC_TOKEN]);

}

main()
.then(() => process.exit(0))
.catch(error => {
console.error(error);
process.exit(1);
});
