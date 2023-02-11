import {ethers} from "hardhat";
import {Deploy} from "../Deploy";
import {TestnetAddresses} from "../../addresses/TestnetAddresses";
import {writeFileSync} from "fs";
import {Misc} from "../../Misc";
import {readContractAddress} from "../Helper";
import moment from "moment";
import {Controller, Multicall2} from "../../../typechain";

async function addLiquidity() {

    const Router = await ethers.getContractFactory("FldxRouter01");
    const router = await Router.attach("0xf37088c9393bF3fE4743C161681570331B65C69A");
    const deadline = "" + moment().add(600, "seconds").unix();

    const Token = await ethers.getContractFactory("Token");

    const mim = await Token.attach("0xa5832D975070EDADD68Bdbba2b21E327417312Df");
    const usdt = await Token.attach("0x6bf11Da741e83f7D44D7fb04233397384587BcAf");

    await Misc.runAndWait(() => mim.approve(router.address, "10000000000000000000000000"));
    await Misc.runAndWait(() => usdt.approve(router.address, "1000000000000000000"));

    await Misc.runAndWait(() => router.addLiquidity(mim.address,
        usdt.address,
        true,
        "100000000000000000000",
        "100000000",
        "100000000000000000000",
        "100000000",
        "0x6F0e5192dc85391231341383712F9fFc4A063385",
        deadline
    ));
}

async function multicall() {
    const signer = (await ethers.getSigners())[0];
    const Multicall =  await Deploy.deployContract(signer, 'Multicall2') as Multicall2;
    console.log(Multicall.address);
}

async function addLiquidityMATIC() {
    const Router = await ethers.getContractFactory("FldxRouter01");
    const router = await Router.attach("0x0F6089180CEDab618f14b09bc8FfC9657c7F8d7f");
    const deadline = "" + moment().add(600, "seconds").unix();

    const Token = await ethers.getContractFactory("Token");
    const mim = await Token.attach("0x49eBd4a0b8a4D498CA9b30Ee94111306cd71ac04");
    await Misc.runAndWait(() => router.addLiquidityMATIC(mim.address,
        true,
        "100000000000000000000",
        "98000000000000000000",
        "9800000000000000000",
        "0xD5511d493ac0493Ff3167347AB23B8Cc9d836832",
        deadline
    ));
}

async function findDetails() {
    const Factory = await ethers.getContractFactory("FldxFactory");
    const contract = await Factory.attach("0xdFF63E319f1FF3F99A58E975924105c59cF07Fc3");
    const txReceipt = await contract.provider.getTransactionReceipt("0xe2ac5f4128005d18756acc0808b73fbeee9b1f0f2e12ad5d63e48c6574dd2140");
    console.log(txReceipt.blockNumber);
}

async function updatePeriod() {
    const FldxMinter = await ethers.getContractFactory("FldxMinter");
    const contract = await FldxMinter.attach("0x03232D934D18E2369AFc63e7CB0A5EEe72EE65D9");

    const response = await contract.updatePeriod();
    console.log(response);
}

updatePeriod()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });