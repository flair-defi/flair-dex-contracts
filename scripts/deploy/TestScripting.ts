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
    await Misc.runAndWait(() => router.addLiquidityAVAX(mim.address,
        true,
        "100000000000000000000",
        "98000000000000000000",
        "9800000000000000000",
        "0xD5511d493ac0493Ff3167347AB23B8Cc9d836832",
        deadline
    ));
}

async function changeFees() {
    const Factory = await ethers.getContractFactory("FldxFactory");
    const factory = await Factory.attach("0xC1371d3ed9D6251F20Ab5d107eC6Bc84a6dAE9BE");

    console.log(await factory.getFees(true));
    // await factory.setFee(false, 15);
    // console.log(await factory.getFees(false));
    // console.log(await factory.volatileFee());
}


async function changeAdmin() {
    const [owner, owner2] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("FldxFactory");
    const factory = await Factory.attach("0xC1371d3ed9D6251F20Ab5d107eC6Bc84a6dAE9BE");

    console.log(await factory.admin());
    await factory.setAdmin(owner2.address);
    console.log(await factory.pendingAdmin());
    await factory.connect(owner2).acceptAdmin();
    console.log(await factory.admin());
}

async function changePartnerSetter() {
    const [owner, owner2] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("FldxFactory");
    const factory = await Factory.attach("0xC1371d3ed9D6251F20Ab5d107eC6Bc84a6dAE9BE");

    console.log(await factory.partnerSetter());
    await factory.connect(owner2).setPartnerSetter(owner2.address);
    console.log(await factory.partnerSetter());
}

async function changePartner() {
    const [owner, owner2] = await ethers.getSigners();

    const Pair = await ethers.getContractFactory("FldxPair");
    const pair = await Pair.attach("0x0ee2266f321dd63e31ab8b35b61242a2a21ccd26");

    console.log(await pair.partner());
    await pair.connect(owner2).setPartner(owner2.address);
    console.log(await pair.partner());
}

async function getFees() {
    const Treasury = await ethers.getContractFactory("GovernanceTreasury");
    const treasury = await Treasury.attach("0x15Bf2C85c32B3B4A2C43615a28fA8E4F5a76C88A");

    const USDC = await ethers.getContractFactory('Token');
    const usdc = await USDC.attach("0x7b233e29721C82A961d816Dec044ccbeF827ea84");

    const USDT = await ethers.getContractFactory('Token');
    const usdt = await USDT.attach("0x842dB8e9e4465177eEb894Fbd93BA0BBfF62019a");

    console.log(await usdt.balanceOf(treasury.address));
    console.log(await usdc.balanceOf(treasury.address));
    console.log(await usdc.balanceOf("0x93FF343f0c00096e25d77BF137339c6dE5A51b5E"))

}

async function claimFees() {
    const Treasury = await ethers.getContractFactory("GovernanceTreasury");
    const treasury = await Treasury.attach("0x15Bf2C85c32B3B4A2C43615a28fA8E4F5a76C88A");

    const USDC = await ethers.getContractFactory('Token');
    const usdc = await USDC.attach("0x7b233e29721C82A961d816Dec044ccbeF827ea84");

    const USDT = await ethers.getContractFactory('Token');
    const usdt = await USDT.attach("0x842dB8e9e4465177eEb894Fbd93BA0BBfF62019a");

    console.log(await usdt.balanceOf(treasury.address));
    await treasury.claim(["0x842dB8e9e4465177eEb894Fbd93BA0BBfF62019a"]);
    console.log(await usdt.balanceOf(treasury.address));
}

async function tokenUri() {
    const Ve = await ethers.getContractFactory('Ve');
    const ve = await Ve.attach('0x62916C826a01D3ebD4b483ea7c84c4815d696948');

    console.log(await ve.tokenURI(1));
}

async function setMinterTreasury() {
    const [owner, owner2] = await ethers.getSigners();

    const Minter = await ethers.getContractFactory('FldxMinter');
    const minter = await Minter.attach('0x2CeCd67143C0df9671107896BB364ccec3bC1714');

    console.log(await minter.treasury());
    await minter.connect(owner2).setTreasury(owner.address);
    await minter.connect(owner).acceptTreasury();
    console.log(await minter.treasury());
}

async function setNFTContract() {
    const [owner, owner2] = await ethers.getSigners();

    const Minter = await ethers.getContractFactory('FldxMinter');
    const minter = await Minter.attach('0x2CeCd67143C0df9671107896BB364ccec3bC1714');

    await minter.connect(owner2).setNftStakingContract(owner.address);
}

setNFTContract()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });