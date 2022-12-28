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
    const router = await Router.attach("0x0F6089180CEDab618f14b09bc8FfC9657c7F8d7f");
    const deadline = "" + moment().add(600, "seconds").unix();

    const Token = await ethers.getContractFactory("Token");

    const mim = await Token.attach("0x49eBd4a0b8a4D498CA9b30Ee94111306cd71ac04");
    const usdt = await Token.attach("0xc299e3c09458C092081D885f85f545F800FCb85b");

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

addLiquidityMATIC()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });