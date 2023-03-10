import {Token, FldxFactory, FldxPair__factory} from "../../../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ethers} from "hardhat";
import chai from "chai";
import {Deploy} from "../../../scripts/deploy/Deploy";
import {TimeUtils} from "../../TimeUtils";
import {Misc} from "../../../scripts/Misc";

const {expect} = chai;

describe("factory tests", function () {

  let snapshotBefore: string;
  let snapshot: string;

  let owner: SignerWithAddress;
  let owner2: SignerWithAddress;
  let factory: FldxFactory;
  let wmatic: Token;
  let usdc: Token;


  before(async function () {
    snapshotBefore = await TimeUtils.snapshot();
    [owner, owner2] = await ethers.getSigners();
    wmatic = await Deploy.deployContract(owner, 'Token', 'WMATIC', 'WMATIC', 18, owner.address) as Token;
    usdc = await Deploy.deployContract(owner, 'Token', 'USDC', 'USDC', 6, owner.address) as Token;
    factory = await Deploy.deployFldxFactory(owner, owner.address);
  });

  after(async function () {
    await TimeUtils.rollback(snapshotBefore);
  });


  beforeEach(async function () {
    snapshot = await TimeUtils.snapshot();
  });

  afterEach(async function () {
    await TimeUtils.rollback(snapshot);
  });

  it("set admin", async function () {
    await factory.setAdmin(owner2.address);
    await factory.connect(owner2).acceptAdmin();
    expect(await factory.admin()).is.eq(owner2.address);
  });

  it("set admin only from admin", async function () {
    await expect(factory.connect(owner2).setAdmin(owner2.address)).revertedWith("Not Admin");
  });

  it("accept admin only from existing admin", async function () {
    await factory.setAdmin(owner2.address);
    await expect(factory.connect(owner).acceptAdmin()).revertedWith("FldxFactory: Not pending admin");
  });

  it("set PartnerSetter", async function () {
    await factory.setPartnerSetter(owner2.address);
    expect(await factory.partnerSetter()).eq(owner2.address);
  });

  it("pause", async function () {
    await factory.setPause(true);
    expect(await factory.isPaused()).is.eq(true);
  });

  it("pause only from admin", async function () {
    await expect(factory.connect(owner2).setPause(true)).revertedWith("FldxFactory: Not admin");
  });

  it("set fee stable", async function () {
    await factory.setFee(true, 10);
    expect(await factory.getFees(true)).is.eq(10);
    expect(await factory.getFees(false)).is.eq(20);
  });

  it("set fee volatile", async function () {
    await factory.setFee(false, 30);
    expect(await factory.getFees(false)).is.eq(30);
    expect(await factory.getFees(true)).is.eq(2);
  });

  it("set fee only from admin", async function() {
    await expect(factory.connect(owner2).setFee(true, 5)).revertedWith("not admin");
  });

  it("set fees to zero", async function() {
    await expect(factory.setFee(true, 0)).revertedWith("fee must be nonzero");
  });

  it("set stable fees too high", async function() {
    await expect(factory.setFee(true, 100)).revertedWith("fee too high");
  });

  it("set volatile fees too high", async function() {
    await expect(factory.setFee(true, 100)).revertedWith("fee too high");
  });

  it("create pair revert with the same tokens", async function () {
    await expect(factory.createPair(wmatic.address, wmatic.address, true)).revertedWith('IDENTICAL_ADDRESSES');
  });

  it("create pair revert with the zero token", async function () {
    await expect(factory.createPair(wmatic.address, Misc.ZERO_ADDRESS, true)).revertedWith('ZERO_ADDRESS');
  });

  it("check created pair variables", async function () {
    await factory.createPair(wmatic.address, usdc.address, true);
    await expect(factory.createPair(wmatic.address, usdc.address, true)).revertedWith('PAIR_EXISTS');
    const pairAdr = await factory.getPair(wmatic.address, usdc.address, true);
    const pair = FldxPair__factory.connect(pairAdr, owner);
    expect(await pair.factory()).eq(factory.address);
    expect(await pair.treasury()).eq(owner.address);
    expect(await pair.fees()).not.eq(Misc.ZERO_ADDRESS);
    expect(await pair.stable()).eq(true);
  });


});
