import {Deploy} from "../Deploy";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";
import {Addresses} from "../../addresses/Addresses";
import {writeFileSync} from "fs";

const voterTokens = [
    "0x8b146d71a2b075407F1C4e8f2092f4FFe6d626B8",
    "0x8f7CE78Efd713811cB9327F233dCBcae0C43F062",
    "0x41fF64E47E35d9eC56Def353E15FBE3A27bec5eA",
    "0xa03cc635595F0607622222cD15822cf4f1Bcd411",
    "0xEB7B885CF774aAB4C658123fB2bDC1096ee3B175",
    Addresses.WAVAX
];
const WARMING = 0;

async function main() {
    const signer = (await ethers.getSigners())[0];

    const [
        controller,
        token,
        gaugesFactory,
        bribesFactory,
        ve,
        veDist,
        voter,
        minter,
    ] = await Deploy.deployFldxSystem(
        signer,
        Addresses.WAVAX,
        voterTokens,
        Addresses.FACTORY,
        2
    );

    const data = ''
        + 'controller: ' + controller.address + '\n'
        + 'token: ' + token.address + '\n'
        + 'gaugesFactory: ' + gaugesFactory.address + '\n'
        + 'bribesFactory: ' + bribesFactory.address + '\n'
        + 've: ' + ve.address + '\n'
        + 'veDist: ' + veDist.address + '\n'
        + 'voter: ' + voter.address + '\n'
        + 'minter: ' + minter.address + '\n'

    console.log(data);
    writeFileSync('tmp/core.txt', data);

    // await Misc.wait(50);
    //
    // await Verify.verify(controller.address);
    // await Verify.verify(token.address);
    // await Verify.verify(gaugesFactory.address);
    // await Verify.verify(bribesFactory.address);
    // await Verify.verifyWithArgs(ve.address, [token.address, controller.address]);
    // await Verify.verifyWithArgs(veDist.address, [ve.address]);
    // await Verify.verifyWithArgs(voter.address, [ve.address, FACTORY, gaugesFactory.address, bribesFactory.address]);
    // await Verify.verifyWithArgs(minter.address, [ve.address, controller.address, WARMING]);

}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
