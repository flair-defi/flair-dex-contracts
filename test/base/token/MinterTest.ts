import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ethers} from "hardhat";
import chai from "chai";
import {Deploy} from "../../../scripts/deploy/Deploy";
import {TimeUtils} from "../../TimeUtils";
import {BigNumber, utils} from "ethers";
import {CoreAddresses} from "../../../scripts/deploy/CoreAddresses";
import {Controller, FldxPair, Gauge, Gauge__factory, Token} from "../../../typechain";
import {TestHelper} from "../../TestHelper";
import {parseUnits} from "ethers/lib/utils";
import {Misc} from "../../../scripts/Misc";

const {expect} = chai;

describe("minter tests", function () {

  let snapshotBefore: string;
  let snapshot: string;

  let owner: SignerWithAddress;
  let owner2: SignerWithAddress;
  let core: CoreAddresses;
  let wmatic: Token;
  let ust: Token;
  let mim: Token;
  let dai: Token;
  let pair: FldxPair;
  // let gauge: Gauge;


  before(async function () {
    snapshotBefore = await TimeUtils.snapshot();
    [owner, owner2] = await ethers.getSigners();
    wmatic = await Deploy.deployContract(owner, 'Token', 'WMATIC', 'WMATIC', 18, owner.address) as Token;
    [ust, mim, dai] = await TestHelper.createMockTokensAndMint(owner);
    core = await Deploy.deployCore(
      owner,
      wmatic.address,
      [wmatic.address, ust.address, mim.address, dai.address],
      2
    );

    // ------------- setup gauges and bribes --------------

    pair = await TestHelper.addLiquidity(
      core.factory,
      core.router,
      owner,
      mim.address,
      ust.address,
      parseUnits('1'),
      parseUnits('1', 6),
      true
    );
    const minter = await Misc.impersonate(core.minter.address);
    await core.token.connect(minter).mint(owner.address, parseUnits('100'));
    await core.token.approve(core.ve.address, BigNumber.from("1500000000000000000000000"));
    await core.ve.createLock(100, 7*60*60*1000);
    // await core.voter.createGauge(pair.address);
    // const gaugeMimUstAddress = await core.voter.gauges(pair.address);
    // gauge = Gauge__factory.connect(gaugeMimUstAddress, owner);
    // await TestHelper.depositToGauge(owner, gauge, pair, parseUnits('0.001', 6), 0);
    // await core.voter.vote(1, [pair.address], [100]);
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

  it("set treasury unauthorized", async function() {
    expect(await core.minter.connect(owner2.address).setTreasury(owner2.address)).revertedWith("Not treasury");
  });

  it("initial circulating_supplypost deployment test", async function () {
    expect(await core.minter.circulatingSupply()).is.eq(BigNumber.from('0'));
  });

  it("weekly_emission test", async function () {
    expect(await core.minter.weeklyEmission()).is.eq(BigNumber.from('2000000000000000000000000'));
  });

  it("circulating_emission test", async function () {
    expect(await core.minter.circulatingEmission()).is.not.eq(BigNumber.from('0'));
  });

  it("wrong total amount test", async function () {
    const controller = await Deploy.deployContract(owner, 'Controller') as Controller;
    const treasury = await Deploy.deployGovernanceTreasury(owner);
    const gaugesFactory = await Deploy.deployGaugeFactory(owner);
    const bribesFactory = await Deploy.deployBribeFactory(owner);
    const baseFactory = await Deploy.deployFldxFactory(owner, treasury.address);
    const token = await Deploy.deployContract(owner, 'Token', 'VE', 'VE', 18, owner.address) as Token;
    const ve = await Deploy.deployVe(owner, token.address, controller.address);
    const veDist = await Deploy.deployVeDist(owner, ve.address);
    const voter = await Deploy.deployFldxVoter(owner, ve.address, baseFactory.address, gaugesFactory.address, bribesFactory.address);
    await controller.setVeDist(veDist.address)
    await controller.setVoter(voter.address)
    const minter = await Deploy.deployFldxMinter(owner, ve.address, controller.address, 1);
    console.log((await minter.activePeriod()).toString());
  });


  it("reach first threshold", async function () {
    await TimeUtils.advanceBlocksOnTs(60 * 60 * 24 * 7 * 2)
    let numEpoch = 0;
    while (true) {
      numEpoch += 1
      await core.minter.updatePeriod();
      await TimeUtils.advanceBlocksOnTs(60 * 60 * 24 * 7)
      if (numEpoch === 52) {
        expect(await core.minter.weeklyEmissionDecrease()).eq(9950);
      }
    }
  });

  it("don't mint token if enough", async function () {
    await TimeUtils.advanceBlocksOnTs(60 * 60 * 24 * 7 * 2)
    const minter = await Misc.impersonate(core.minter.address);
    await core.token.connect(minter).mint(core.minter.address, parseUnits('9999999999'));
    const supply = await core.token.totalSupply()
    await core.minter.updatePeriod();
    expect(await core.token.totalSupply()).eq(supply);
  });

});
