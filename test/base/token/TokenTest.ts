import {Token} from "../../../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ethers} from "hardhat";
import chai from "chai";
import {Deploy} from "../../../scripts/deploy/Deploy";
import {TimeUtils} from "../../TimeUtils";
import {TestHelper} from "../../TestHelper";
import {BigNumber, utils} from "ethers";
import {CoreAddresses} from "../../../scripts/deploy/CoreAddresses";
import {Misc} from "../../../scripts/Misc";

const {expect} = chai;

describe("token tests", function () {

  let snapshotBefore: string;
  let snapshot: string;

  let owner: SignerWithAddress;
  let owner2: SignerWithAddress;
  let owner3: SignerWithAddress;
  let core: CoreAddresses;
  let ust: Token;
  let mim: Token;
  let dai: Token;
  let wmatic: Token;


  before(async function () {
    snapshotBefore = await TimeUtils.snapshot();
    [owner, owner2, owner3] = await ethers.getSigners();
    wmatic = await Deploy.deployContract(owner, 'Token', 'WMATIC', 'WMATIC', 18, owner.address) as Token;

    [ust, mim, dai] = await TestHelper.createMockTokensAndMint(owner);
    await ust.transfer(owner2.address, utils.parseUnits('100', 6));
    await mim.transfer(owner2.address, utils.parseUnits('100'));
    await dai.transfer(owner2.address, utils.parseUnits('100'));

    await ust.transfer(owner3.address, utils.parseUnits('100', 6));
    await mim.transfer(owner3.address, utils.parseUnits('100'));
    await dai.transfer(owner3.address, utils.parseUnits('100'));

    core = await Deploy.deployCore(
      owner,
      wmatic.address,
        [wmatic.address, ust.address, mim.address, dai.address],
      2
    );
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

  it("set minter reject", async function () {
    await expect(core.token.setMinter(Misc.ZERO_ADDRESS)).revertedWith('FLDX: Not minter')
  });

  it("set merkle claim reject", async function () {
    await expect(core.token.connect(owner2).setMerkleClaim(wmatic.address)).revertedWith('FLDX: Not Minter')
  });

  it("set merkle NFT claim reject", async function () {
    await expect(core.token.connect(owner2).setMerkleNFTClaim(wmatic.address)).revertedWith('FLDX: Not Minter')
  });

  it("mint to zero address reject", async function () {
    const minter = await Misc.impersonate(await core.token.minter());
    await expect(core.token.connect(minter).mint(Misc.ZERO_ADDRESS, 1)).revertedWith('FLDX: Mint to the zero address')
  });

  it("transfer to zero address reject", async function () {
    await expect(core.token.transfer(Misc.ZERO_ADDRESS, 1)).revertedWith('FLDX: Transfer to the zero address')
  });

  it("transfer to too much reject", async function () {
    await expect(core.token.transfer(owner2.address, Misc.MAX_UINT)).revertedWith('FLDX: Transfer amount exceeds balance')
  });

  it("transfer from to too much reject", async function () {
    const minter = await Misc.impersonate(await core.token.minter());
    expect(await core.token.balanceOf(owner.address)).eq(BigNumber.from('48000000000000000000000000'));
    await core.token.connect(minter).mint(owner2.address, 100);
    await core.token.connect(owner2).approve(owner.address, 100);
    await core.token.transferFrom(owner2.address, owner.address, 100);
    expect(await core.token.balanceOf(owner.address)).eq(BigNumber.from('48000000000000000000000100'));
    expect(await core.token.balanceOf(owner2.address)).eq(0);
    await expect(core.token.transferFrom(owner2.address, owner.address, 1)).revertedWith('FLDX: Insufficient allowance')
  });

  it("mint from not minter reject", async function () {
    await expect(core.token.mint(Misc.ZERO_ADDRESS, 1)).revertedWith('FLDX: Not minter')
  });

});
