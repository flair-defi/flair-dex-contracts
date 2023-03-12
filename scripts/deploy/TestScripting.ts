import {ethers} from "hardhat";
import {Deploy} from "./Deploy";
import {Addresses, TestnetAddresses} from "../addresses/Addresses";
import {writeFileSync} from "fs";
import {Misc} from "../Misc";
import {readContractAddress} from "./Helper";
import moment from "moment";
import {Controller, Multicall2} from "../../typechain";

async function addLiquidity() {

    const Router = await ethers.getContractFactory("FldxRouter01");
    const router = await Router.attach("0xA5aC8E17CF45c9b103b2bdea7B703B4E7DC93a74");
    const deadline = "" + moment().add(600, "seconds").unix();

    const Token = await ethers.getContractFactory("Token");

    const mim = await Token.attach("0x8f7CE78Efd713811cB9327F233dCBcae0C43F062");
    const usdt = await Token.attach("0xa03cc635595F0607622222cD15822cf4f1Bcd411");

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

async function creatUSDCWAVAXPair() {

    const Factory = await ethers.getContractFactory("FldxFactory");
    const factory = await Factory.attach("0xf37088c9393bF3fE4743C161681570331B65C69A");
    const deadline = "" + moment().add(600, "seconds").unix();

    await factory.createPair('0x8b146d71a2b075407F1C4e8f2092f4FFe6d626B8', Addresses.WAVAX,
        false);
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

creatUSDCWAVAXPair()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });