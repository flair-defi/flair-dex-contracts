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

async function airdrop() {
    const airdropAddresses = [
        "0x6A60D50fd2DcacA4e80FeE92670512E008C03026",
        "0x02128783083CAc9631201b6c2A26b5a2ccAB0AFc",
        "0x59422340FDf7f8D9190f638740598D3428D15169",
        "0xbcF41a27C4C1eE63dF5798E71c1a17b70e5b1077",
        "0xD56DbE3206d4e56e052B2Bb96A342c06f5b3ef32",
        "0xEeDc763c7369AD976455fa6E0b62b1B4f743Edb8",
        "0x01D2862DA9d4fD9542D60bf9F769888435707176",
        "0x3655B7ffEe4d8C64c3Bf7F6332A110Dce74Abeb4",
        "0xAcedFC1ED2063249f6a5A4A98F375C3900d62046",
        "0x7A92502c0dD2fC77532021f759A7DB2e0f966cf9",
        "0x086A8184c9FbfB66D1eDf2406a5d20576911f5Fe"
    ]

    const amount = "50000000";
    const fldxAmount = "50000000000000000000";

    const usdc = await ethers.getContractFactory("Token");
    const usdcContract = await usdc.attach("0x5F38e748AeaBA58D54C1f6456118f974fE5dB0EF");

    const usdt = await ethers.getContractFactory("Token");
    const usdtContract = await usdt.attach("0x6bf11Da741e83f7D44D7fb04233397384587BcAf")

    const fldx = await ethers.getContractFactory("Fldx");
    const fldxContract = await fldx.attach("0x6A70C6c2a246B4ef170e8DD5eE3f2E965afAC265")

    for (let i=0; i < airdropAddresses.length; i++) {
        const address = airdropAddresses[i];
        await Misc.runAndWait(() => usdcContract.transfer(address, amount));
        console.log("Airdropped usdc:", address);
        await Misc.runAndWait(() => usdtContract.transfer(address, amount));
        console.log("Usdt Airdropped:", address);
        await Misc.runAndWait(() => fldxContract.transfer(address, fldxAmount));
        console.log("FLDX Airdropped:", address)
    }
}

airdrop()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });