import {
  Token,
  TokenWithFee, FldxFactory, FldxPair__factory, FldxRouter01
} from "../../../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ethers} from "hardhat";
import chai from "chai";
import {Deploy} from "../../../scripts/deploy/Deploy";
import {TimeUtils} from "../../TimeUtils";
import {TestHelper} from "../../TestHelper";
import {BigNumber, utils} from "ethers";
import {parseUnits} from "ethers/lib/utils";
import {Misc} from "../../../scripts/Misc";

const {expect} = chai;

describe("router tests", function () {

  let snapshotBefore: string;
  let snapshot: string;

  let owner: SignerWithAddress;
  let owner2: SignerWithAddress;
  let factory: FldxFactory;
  let router: FldxRouter01;

  let weth: Token;
  let ust: Token;
  let mim: Token;
  let dai: Token;
  let tokenWithFee: TokenWithFee;


  before(async function () {
    snapshotBefore = await TimeUtils.snapshot();
    [owner, owner2] = await ethers.getSigners();
    weth = await Deploy.deployContract(owner, 'Token', 'WETH', 'WETH', 18, owner.address) as Token;
    await weth.mint(owner.address, parseUnits('1000'));
    factory = await Deploy.deployFldxFactory(owner, owner.address);
    router = await Deploy.deployFldxRouter01(owner, factory.address, weth.address);

    [ust, mim, dai] = await TestHelper.createMockTokensAndMint(owner);
    await ust.transfer(owner2.address, utils.parseUnits('100', 6));
    await mim.transfer(owner2.address, utils.parseUnits('100'));
    await dai.transfer(owner2.address, utils.parseUnits('100'));

    tokenWithFee = await Deploy.deployContract(owner, 'TokenWithFee', 'TWF', 'TWF', 18, owner.address) as TokenWithFee;
    await tokenWithFee.mint(owner.address, utils.parseUnits('1000000000000'));
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

  it("quoteAddLiquidity on empty pair", async function () {
    await router.quoteAddLiquidity(
      mim.address,
      ust.address,
      true,
      parseUnits('1'),
      parseUnits('1', 6),
    );
  });

  it("quoteAddLiquidity on exist pair", async function () {
    await TestHelper.addLiquidity(
      factory,
      router,
      owner,
      mim.address,
      ust.address,
      utils.parseUnits('1'),
      utils.parseUnits('1', 6),
      true
    );

    await router.quoteAddLiquidity(
      mim.address,
      ust.address,
      true,
      parseUnits('1'),
      parseUnits('10', 6),
    );
  });

  it("quoteAddLiquidity on exist pair2", async function () {
    await TestHelper.addLiquidity(
      factory,
      router,
      owner,
      mim.address,
      ust.address,
      utils.parseUnits('1'),
      utils.parseUnits('1', 6),
      true
    );

    await router.quoteAddLiquidity(
      mim.address,
      ust.address,
      true,
      parseUnits('10'),
      parseUnits('1', 6),
    );
  });

  it("quoteRemoveLiquidity on empty pair", async function () {
    await router.quoteRemoveLiquidity(
      mim.address,
      ust.address,
      true,
      parseUnits('1'),
    );
  });

  it("addLiquidityETH test", async function () {
    await mim.approve(router.address, parseUnits('1'));
    await router.addLiquidityETH(
      mim.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('10')}
    );
  });

  it("removeLiquidityETH test", async function () {
    await mim.approve(router.address, parseUnits('1'));
    await router.addLiquidityETH(
      mim.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('10')}
    );

    const pairAdr = await factory.getPair(mim.address, weth.address, true);

    await FldxPair__factory.connect(pairAdr, owner).approve(router.address, parseUnits('1111'));
    await router.removeLiquidityETH(
      mim.address,
      true,
      parseUnits('0.1'),
      0,
      0,
      owner.address,
      99999999999,
    );
  });


  it("removeLiquidityWithPermit test", async function () {
    await mim.approve(router.address, parseUnits('1'));
    await router.addLiquidityETH(
      mim.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('10')}
    );

    const pairAdr = await factory.getPair(mim.address, weth.address, true);
    const pair = FldxPair__factory.connect(pairAdr, owner);

    const {
      v,
      r,
      s
    } = await TestHelper.permitForPair(owner, pair, router.address, parseUnits('0.1'));

    await router.removeLiquidityWithPermit(
      mim.address,
      weth.address,
      true,
      parseUnits('0.1'),
      0,
      0,
      owner.address,
      99999999999,
      false, v, r, s
    );
  });

  it("removeLiquidityETHWithPermit test", async function () {
    await mim.approve(router.address, parseUnits('1'));
    await router.addLiquidityETH(
      mim.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('10')}
    );

    const pairAdr = await factory.getPair(mim.address, weth.address, true);
    const pair = FldxPair__factory.connect(pairAdr, owner);

    const {
      v,
      r,
      s
    } = await TestHelper.permitForPair(owner, pair, router.address, parseUnits('0.1'));

    await router.removeLiquidityETHWithPermit(
      mim.address,
      true,
      parseUnits('0.1'),
      0,
      0,
      owner.address,
      99999999999,
      false, v, r, s
    );
  });

  it("swapExactTokensForTokensSimple test", async function () {
    await mim.approve(router.address, parseUnits('10'));

    await router.addLiquidityETH(
      mim.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('10')}
    );

    await router.swapExactTokensForTokensSimple(
      parseUnits('0.1'),
      0,
      mim.address,
      weth.address,
      true,
      owner.address,
      99999999999
    );
  });

  it("swapExactTokensForETH test", async function () {
    await mim.approve(router.address, parseUnits('10'));

    await router.addLiquidityETH(
      mim.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('10')}
    );

    await router.swapExactTokensForETH(
      parseUnits('0.1'),
      0,
      [{
        from: mim.address,
        to: weth.address,
        stable: true,
      }],
      owner.address,
      99999999999
    );
  });

  it("UNSAFE_swapExactTokensForTokens test", async function () {
    await mim.approve(router.address, parseUnits('10'));

    await router.addLiquidityETH(
      mim.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('10')}
    );

    await router.UNSAFE_swapExactTokensForTokens(
      [parseUnits('0.1'), parseUnits('0.1')],
      [{
        from: mim.address,
        to: weth.address,
        stable: true,
      }],
      owner.address,
      99999999999
    );
  });

  it("swapExactETHForTokens test", async function () {
    await mim.approve(router.address, parseUnits('10'));

    await router.addLiquidityETH(
      mim.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('10')}
    );

    await router.swapExactETHForTokens(
      0,
      [{
        from: weth.address,
        to: mim.address,
        stable: true,
      }],
      owner.address,
      99999999999,
      {value: parseUnits('0.1')}
    );
  });

  it("add/remove liquidity with fee token test", async function () {
    await tokenWithFee.approve(router.address, parseUnits('10'));
    const ethBalance = await owner.getBalance();
    const tokenBalance = await tokenWithFee.balanceOf(owner.address);

    await router.addLiquidityETH(
      tokenWithFee.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('1')}
    );

    const pairAdr = await factory.getPair(tokenWithFee.address, weth.address, true);
    const pair = FldxPair__factory.connect(pairAdr, owner);
    const pairBal = await pair.balanceOf(owner.address);

    const {
      v,
      r,
      s
    } = await TestHelper.permitForPair(owner, pair, router.address, pairBal);

    await router.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
      tokenWithFee.address,
      true,
      pairBal,
      0,
      0,
      owner.address,
      99999999999,
      false, v, r, s
    );

    const ethBalanceAfter = await owner.getBalance();
    const tokenBalanceAfter = await tokenWithFee.balanceOf(owner.address);
    TestHelper.closer(ethBalanceAfter, ethBalance, parseUnits('0.1'));
    TestHelper.closer(tokenBalanceAfter, tokenBalance, parseUnits('0.3'));
  });


  it("swapExactTokensForTokensSupportingFeeOnTransferTokens test", async function () {
    await tokenWithFee.approve(router.address, parseUnits('10'));

    await router.addLiquidityETH(
      tokenWithFee.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('1')}
    );

    const ethBalance = await owner.getBalance();
    const tokenBalance = await tokenWithFee.balanceOf(owner.address);

    await router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      parseUnits('0.1'),
      0,
      [{from: tokenWithFee.address, to: weth.address, stable: true}],
      owner.address,
      99999999999
    );

    const ethBalanceAfter = await owner.getBalance();
    const tokenBalanceAfter = await tokenWithFee.balanceOf(owner.address);
    TestHelper.closer(ethBalanceAfter, ethBalance, parseUnits('11'));
    TestHelper.closer(tokenBalanceAfter, tokenBalance, parseUnits('0.5'));
  });

  it("swapExactETHForTokensSupportingFeeOnTransferTokens test", async function () {
    await tokenWithFee.approve(router.address, parseUnits('10'));

    await router.addLiquidityETH(
      tokenWithFee.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('1')}
    );

    const ethBalance = await owner.getBalance();
    const tokenBalance = await tokenWithFee.balanceOf(owner.address);

    await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      [{to: tokenWithFee.address, from: weth.address, stable: true}],
      owner.address,
      99999999999,
      {value: parseUnits('0.1')}
    );

    const ethBalanceAfter = await owner.getBalance();
    const tokenBalanceAfter = await tokenWithFee.balanceOf(owner.address);
    TestHelper.closer(ethBalanceAfter, ethBalance, parseUnits('2'));
    TestHelper.closer(tokenBalanceAfter, tokenBalance, parseUnits('0.1'));
  });

  it("swapExactTokensForETHSupportingFeeOnTransferTokens test", async function () {
    await tokenWithFee.approve(router.address, parseUnits('10'));

    await router.addLiquidityETH(
      tokenWithFee.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('1')}
    );

    const ethBalance = await owner.getBalance();
    const tokenBalance = await tokenWithFee.balanceOf(owner.address);

    await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      parseUnits('0.1'),
      0,
      [{from: tokenWithFee.address, to: weth.address, stable: true}],
      owner.address,
      99999999999,
    );

    const ethBalanceAfter = await owner.getBalance();
    const tokenBalanceAfter = await tokenWithFee.balanceOf(owner.address);
    TestHelper.closer(ethBalanceAfter, ethBalance, parseUnits('2'));
    TestHelper.closer(tokenBalanceAfter, tokenBalance, parseUnits('0.2'));
  });

  it("getExactAmountOut test", async function () {
    expect(await router.getExactAmountOut(
      parseUnits('0.1'),
      tokenWithFee.address,
      weth.address,
      true,
    )).is.eq(0);

    await tokenWithFee.approve(router.address, parseUnits('10'));

    await router.addLiquidityETH(
      tokenWithFee.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('1')}
    );

    expect(await router.getExactAmountOut(
      parseUnits('0.1'),
      tokenWithFee.address,
      weth.address,
      true,
    )).is.not.eq(0);
  });

  it("deadline reject", async function () {
    await expect(router.addLiquidityETH(
      mim.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      1,
      {value: parseUnits('10')}
    )).revertedWith('FldxRouter: EXPIRED');
  });

  it("sort tokens identical address", async function () {
    await expect(router.sortTokens(
      mim.address,
      mim.address,
    )).revertedWith('FldxRouter: IDENTICAL_ADDRESSES');
  });

  it("sort tokens zero address", async function () {
    await expect(router.sortTokens(
      mim.address,
      Misc.ZERO_ADDRESS,
    )).revertedWith('FldxRouter: ZERO_ADDRESS');
  });

  it("getAmountOut for not exist pair", async function () {
    expect((await router.getAmountOut(
      0,
      mim.address,
      dai.address,
    ))[0]).eq(0);
  });

  it("receive eth not from weth reject", async function () {
    await expect(owner.sendTransaction({value: 1, to: router.address})).revertedWith("FldxRouter: NOT_WETH");
  });

  it("getReserves", async function () {
    await TestHelper.addLiquidity(
      factory,
      router,
      owner,
      mim.address,
      ust.address,
      utils.parseUnits('1'),
      utils.parseUnits('1', 6),
      true
    );
    await router.getReserves(mim.address, ust.address, true);
  });

  it("getAmountsOut wrong path", async function () {
    await expect(router.getAmountsOut(0, [])).revertedWith('FldxRouter: INVALID_PATH');
  });

  it("quoteLiquidity zero amount", async function () {
    await expect(router.quoteLiquidity(0, 0, 0)).revertedWith('FldxRouter: INSUFFICIENT_AMOUNT');
  });

  it("quoteLiquidity IL", async function () {
    await expect(router.quoteLiquidity(1, 0, 0)).revertedWith('FldxRouter: INSUFFICIENT_LIQUIDITY');
  });

  it("getAmountsOut with not exist pair", async function () {
    expect((await router.getAmountsOut(0, [{
      from: weth.address,
      to: mim.address,
      stable: false
    }]))[0]).eq(0);
  });

  it("add liquidity amount desired check", async function () {
    await expect(router.addLiquidityETH(
      mim.address,
      true,
      parseUnits('1'),
      parseUnits('100'),
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('10')}
    )).revertedWith('FldxRouter: DESIRED_A_AMOUNT');
    await expect(router.addLiquidityETH(
      mim.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1000'),
      owner.address,
      99999999999,
      {value: parseUnits('10')}
    )).revertedWith('FldxRouter: DESIRED_B_AMOUNT');
  });


  it("add liquidity IA check", async function () {
    await TestHelper.addLiquidity(
      factory,
      router,
      owner,
      mim.address,
      weth.address,
      utils.parseUnits('1'),
      utils.parseUnits('1'),
      true
    );

    await expect(router.addLiquidityETH(
      mim.address,
      true,
      parseUnits('0.037'),
      parseUnits('0.037'),
      parseUnits('0.77'),
      owner.address,
      99999999999,
      {value: parseUnits('0.77')}
    )).revertedWith('FldxRouter: INSUFFICIENT_B_AMOUNT');

    await expect(router.addLiquidityETH(
      mim.address,
      true,
      parseUnits('0.037'),
      parseUnits('0.037'),
      parseUnits('0.01'),
      owner.address,
      99999999999,
      {value: parseUnits('0.01')}
    )).revertedWith('FldxRouter: INSUFFICIENT_A_AMOUNT');
  });


  it("addLiquidityETH send back dust", async function () {
    await TestHelper.addLiquidity(
      factory,
      router,
      owner,
      mim.address,
      weth.address,
      utils.parseUnits('1'),
      utils.parseUnits('1'),
      true
    );

    await mim.approve(router.address, parseUnits('10'));
    await router.addLiquidityETH(
      mim.address,
      true,
      parseUnits('1'),
      0,
      0,
      owner.address,
      99999999999,
      {value: parseUnits('10')}
    );
  });


  it("remove Liquidity IA test", async function () {
    await mim.approve(router.address, parseUnits('1'));
    await router.addLiquidityETH(
      mim.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('10')}
    );

    const pairAdr = await factory.getPair(mim.address, weth.address, true);

    await FldxPair__factory.connect(pairAdr, owner).approve(router.address, parseUnits('1111'));
    await expect(router.removeLiquidity(
      mim.address,
      weth.address,
      true,
      parseUnits('0.1'),
      parseUnits('0.1'),
      0,
      owner.address,
      99999999999,
    )).revertedWith('FldxRouter: INSUFFICIENT_A_AMOUNT');
    await expect(router.removeLiquidity(
      mim.address,
      weth.address,
      true,
      parseUnits('0.1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
    )).revertedWith('FldxRouter: INSUFFICIENT_B_AMOUNT');
  });

  it("removeLiquidityETHSupportingFeeOnTransferTokens test", async function () {
    await tokenWithFee.approve(router.address, parseUnits('1'));
    await router.addLiquidityETH(
      tokenWithFee.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('10')}
    );

    const pairAdr = await factory.getPair(tokenWithFee.address, weth.address, true);

    await FldxPair__factory.connect(pairAdr, owner).approve(router.address, parseUnits('1111'));
    await router.removeLiquidityETHSupportingFeeOnTransferTokens(
      tokenWithFee.address,
      true,
      parseUnits('0.1'),
      0,
      0,
      owner.address,
      99999999999,
    );
  });

  it("swapExactTokensForTokensSimple IOA test", async function () {
    await expect(router.swapExactTokensForTokensSimple(
      parseUnits('0.1'),
      parseUnits('0.1'),
      mim.address,
      weth.address,
      true,
      owner.address,
      BigNumber.from('999999999999999999'),
    )).revertedWith('FldxRouter: INSUFFICIENT_OUTPUT_AMOUNT');
  });

  it("swapExactTokensForTokens IOA test", async function () {
    await expect(router.swapExactTokensForTokens(
      parseUnits('0.1'),
      parseUnits('0.1'),
      [{
        from: mim.address,
        to: weth.address,
        stable: true
      }],
      owner.address,
      BigNumber.from('999999999999999999'),
    )).revertedWith('FldxRouter: INSUFFICIENT_OUTPUT_AMOUNT');
  });


  it("swapExactETHForTokens IOA test", async function () {
    await expect(router.swapExactETHForTokens(
      parseUnits('0.1'),
      [{
        to: mim.address,
        from: weth.address,
        stable: true
      }],
      owner.address,
      BigNumber.from('999999999999999999'),
    )).revertedWith('FldxRouter: INSUFFICIENT_OUTPUT_AMOUNT');
  });

  it("swapExactETHForTokens IP test", async function () {
    await expect(router.swapExactETHForTokens(
      parseUnits('0.1'),
      [{
        from: mim.address,
        to: weth.address,
        stable: true
      }],
      owner.address,
      BigNumber.from('999999999999999999'),
    )).revertedWith('FldxRouter: INVALID_PATH');
  });

  it("swapExactTokensForETH IOA test", async function () {
    await expect(router.swapExactTokensForETH(
      parseUnits('0.1'),
      parseUnits('0.1'),
      [{
        from: mim.address,
        to: weth.address,
        stable: true
      }],
      owner.address,
      BigNumber.from('999999999999999999'),
    )).revertedWith('FldxRouter: INSUFFICIENT_OUTPUT_AMOUNT');
  });

  it("swapExactTokensForETH IP test", async function () {
    await expect(router.swapExactTokensForETH(
      parseUnits('0.1'),
      parseUnits('0.1'),
      [{
        to: mim.address,
        from: weth.address,
        stable: true
      }],
      owner.address,
      BigNumber.from('999999999999999999'),
    )).revertedWith('FldxRouter: INVALID_PATH');
  });

  it("swapExactTokensForTokensSupportingFeeOnTransferTokens IOA test", async function () {
    await tokenWithFee.approve(router.address, parseUnits('1'));
    await router.addLiquidityETH(
      tokenWithFee.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('10')}
    );

    await weth.approve(router.address, parseUnits('1000'));
    await expect(router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      parseUnits('0.1'),
      parseUnits('0.1'),
      [{
        to: tokenWithFee.address,
        from: weth.address,
        stable: true
      }],
      owner.address,
      BigNumber.from('999999999999999999'),
    )).revertedWith('FldxRouter: INSUFFICIENT_OUTPUT_AMOUNT');
  });

  it("swapExactETHForTokensSupportingFeeOnTransferTokens IP test", async function () {
    await tokenWithFee.approve(router.address, parseUnits('1'));
    await router.addLiquidityETH(
      tokenWithFee.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('10')}
    );

    await weth.approve(router.address, parseUnits('1000'));
    await expect(router.swapExactETHForTokensSupportingFeeOnTransferTokens(
      parseUnits('0.1'),
      [{
        from: tokenWithFee.address,
        to: weth.address,
        stable: true
      }],
      owner.address,
      BigNumber.from('999999999999999999'),
      {value: parseUnits('0.1')}
    )).revertedWith('FldxRouter: INVALID_PATH');
  });

  it("swapExactETHForTokensSupportingFeeOnTransferTokens IOA test", async function () {
    await tokenWithFee.approve(router.address, parseUnits('1'));
    await router.addLiquidityETH(
      tokenWithFee.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('10')}
    );

    await weth.approve(router.address, parseUnits('1000'));
    await expect(router.swapExactETHForTokensSupportingFeeOnTransferTokens(
      parseUnits('0.1'),
      [{
        to: tokenWithFee.address,
        from: weth.address,
        stable: true
      }],
      owner.address,
      BigNumber.from('999999999999999999'),
      {value: parseUnits('0.1')}
    )).revertedWith('FldxRouter: INSUFFICIENT_OUTPUT_AMOUNT');
  });

  it("swapExactTokensForETHSupportingFeeOnTransferTokens IOA test", async function () {
    await tokenWithFee.approve(router.address, parseUnits('100'));
    await router.addLiquidityETH(
      tokenWithFee.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('1')}
    );

    await weth.approve(router.address, parseUnits('1000'));
    await expect(router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      parseUnits('0.1'),
      parseUnits('0.1'),
      [{
        from: tokenWithFee.address,
        to: weth.address,
        stable: true
      }],
      owner.address,
      BigNumber.from('999999999999999999'),
    )).revertedWith('FldxRouter: INSUFFICIENT_OUTPUT_AMOUNT');
  });

  it("swapExactTokensForETHSupportingFeeOnTransferTokens IP test", async function () {
    await tokenWithFee.approve(router.address, parseUnits('100'));
    await router.addLiquidityETH(
      tokenWithFee.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('1')}
    );

    await weth.approve(router.address, parseUnits('1000'));
    await expect(router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      parseUnits('0.1'),
      parseUnits('0.1'),
      [{
        to: tokenWithFee.address,
        from: weth.address,
        stable: true
      }],
      owner.address,
      BigNumber.from('999999999999999999'),
    )).revertedWith('FldxRouter: INVALID_PATH');
  });

  it("router with broken eth should revert", async function () {
    const brokenEth = await Deploy.deployContract(owner, 'BrokenWETH', 'WETH', 'WETH', 18, owner.address)
    const routerWithBrokenEth = await Deploy.deployFldxRouter01(owner, factory.address, brokenEth.address);

    await mim.approve(routerWithBrokenEth.address, parseUnits('10'));

    await routerWithBrokenEth.addLiquidityETH(
      mim.address,
      true,
      parseUnits('1'),
      0,
      parseUnits('1'),
      owner.address,
      99999999999,
      {value: parseUnits('1')}
    );

    await mim.approve(routerWithBrokenEth.address, parseUnits('1000'));
    await expect(routerWithBrokenEth.swapExactTokensForETH(
      parseUnits('0.01'),
      0,
      [{
        to: brokenEth.address,
        from: mim.address,
        stable: true,
      }],
      owner.address,
      99999999999
    )).revertedWith('FldxRouter: ETH_TRANSFER_FAILED');
  });

});
