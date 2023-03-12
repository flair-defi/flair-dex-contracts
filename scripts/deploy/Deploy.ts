import {ethers, web3} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {Logger} from "tslog";
import logSettings from "../../log_settings";
import {BigNumber, ContractFactory, utils} from "ethers";
import {Libraries} from "hardhat-deploy/dist/types";
import {
  BribeFactory,
  Controller,
  GaugeFactory,
  GovernanceTreasury,
  Multicall2,
  SwapLibrary,
  Token,
  Ve,
  VeDist,
  Fldx,
  FldxFactory,
  FldxMinter,
  FldxRouter01,
  FldxVoter, MerkleClaim, MerkleVeNFTClaim
} from "../../typechain";
import {Misc} from "../Misc";
import {CoreAddresses} from "./CoreAddresses";
import fs from "fs";
import {Addresses} from "../addresses/Addresses";
import {sign} from "crypto";

const log: Logger = new Logger(logSettings);

const libraries = new Map<string, string>([
  ['', '']
]);

export class Deploy {

  // ************ CONTRACT CONNECTION **************************

  public static async deployContract<T extends ContractFactory>(
    signer: SignerWithAddress,
    name: string,
    // tslint:disable-next-line:no-any
    ...args: any[]
  ) {
    log.info(`Deploying ${name}`);
    log.info("Account balance: " + utils.formatUnits(await signer.getBalance(), 18));

    const gasPrice = await web3.eth.getGasPrice();
    log.info("Gas price: " + gasPrice);
    const lib: string | undefined = libraries.get(name);
    let _factory;
    if (lib) {
      log.info('DEPLOY LIBRARY', lib, 'for', name);
      const libAddress = (await Deploy.deployContract(signer, lib)).address;
      const librariesObj: Libraries = {};
      librariesObj[lib] = libAddress;
      _factory = (await ethers.getContractFactory(
        name,
        {
          signer,
          libraries: librariesObj
        }
      )) as T;
    } else {
      _factory = (await ethers.getContractFactory(
        name,
        signer
      )) as T;
    }
    const instance = await _factory.deploy(...args);
    log.info('Deploy tx:', instance.deployTransaction.hash);
    await instance.deployed();

    const receipt = await ethers.provider.getTransactionReceipt(instance.deployTransaction.hash);
    log.info('Receipt', receipt.contractAddress)
    return _factory.attach(receipt.contractAddress);
  }

  public static async deployFldx(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, 'Fldx')) as Fldx;
  }

  public static async deployToken(signer: SignerWithAddress, name: string, symbol: string, decimal: number) {
    return (await Deploy.deployContract(signer, 'Token', name, symbol, decimal, signer.address)) as Token;
  }

  public static async deployGaugeFactory(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, 'GaugeFactory')) as GaugeFactory;
  }

  public static async deployBribeFactory(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, 'BribeFactory')) as BribeFactory;
  }

  public static async deployFldxFactory(signer: SignerWithAddress, treasury: string) {
    return (await Deploy.deployContract(signer, 'FldxFactory', treasury)) as FldxFactory;
  }

  public static async deployGovernanceTreasury(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, 'GovernanceTreasury')) as GovernanceTreasury;
  }

  public static async deployFldxRouter01(
    signer: SignerWithAddress,
    factory: string,
    networkToken: string,
  ) {
    return (await Deploy.deployContract(signer, 'FldxRouter01', factory, networkToken)) as FldxRouter01;
  }

  public static async deployLibrary(signer: SignerWithAddress, router: string) {
    return (await Deploy.deployContract(signer, 'SwapLibrary', router)) as SwapLibrary;
  }

  public static async deployMultiCall(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, 'Multicall2')) as Multicall2;
  }

  public static async deployMerkleClaim(signer: SignerWithAddress, fldx: string, root: string) {
    return (await Deploy.deployContract(signer, 'MerkleClaim', fldx, root)) as MerkleClaim;
  }

  public static async deployMerkleVeNFTClaim(signer: SignerWithAddress, fldx: string, ve: string, root: string) {
    return (await Deploy.deployContract(signer, 'MerkleVeNFTClaim', fldx, ve, root)) as MerkleVeNFTClaim;
  }

  public static async deployVe(signer: SignerWithAddress, token: string, controller: string) {
    return (await Deploy.deployContract(signer, 'Ve', token, controller)) as Ve;
  }

  public static async deployVeDist(signer: SignerWithAddress, ve: string) {
    return (await Deploy.deployContract(signer, 'VeDist', ve)) as VeDist;
  }

  public static async deployFldxVoter(
    signer: SignerWithAddress,
    ve: string,
    factory: string,
    gauges: string,
    bribes: string,
  ) {
    return (await Deploy.deployContract(
      signer,
      'FldxVoter',
      ve,
      factory,
      gauges,
      bribes,
    )) as FldxVoter;
  }

  public static async deployFldxMinter(
    signer: SignerWithAddress,
    ve: string,
    controller: string,
    warmingUpPeriod: number
  ) {
    return (await Deploy.deployContract(
      signer,
      'FldxMinter',
      ve,
      controller,
      warmingUpPeriod,
    )) as FldxMinter;
  }

  public static async deployCore(
    signer: SignerWithAddress,
    networkToken: string,
    voterTokens: string[],
    warmingUpPeriod = 2
  ) {
    const [baseFactory, router, treasury] = await Deploy.deployDex(signer, networkToken);

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
      networkToken,
      voterTokens,
      baseFactory.address,
      warmingUpPeriod,
    );

    return new CoreAddresses(
      token as Fldx,
      gaugesFactory as GaugeFactory,
      bribesFactory as BribeFactory,
      baseFactory as FldxFactory,
      router as FldxRouter01,
      ve as Ve,
      veDist as VeDist,
      voter as FldxVoter,
      minter as FldxMinter,
      treasury as GovernanceTreasury
    );
  }


  public static async deployDex(
    signer: SignerWithAddress,
    networkToken: string,
  ) {
    const treasury = await Deploy.deployGovernanceTreasury(signer);
    const baseFactory = await Deploy.deployFldxFactory(signer, treasury.address);
    const router = await Deploy.deployFldxRouter01(signer, baseFactory.address, networkToken);
    const library = await Deploy.deployLibrary(signer, router.address);
    const multicall = await Deploy.deployMultiCall(signer);

    return [baseFactory, router, treasury, library, multicall];
  }

  public static async deployFldxSystem(
    signer: SignerWithAddress,
    networkToken: string,
    voterTokens: string[],
    baseFactory: string,
    warmingUpPeriod: number,
  ) {
    const controller = await Deploy.deployContract(signer, 'Controller') as Controller;
    const token = await Deploy.deployFldx(signer);
    // premint liquidity + team tokens + marketing + advisors + unallocated community tokens
    // 20M + 10M + 4M + 1M + 13M
    await Misc.runAndWait(() => token.mint(signer.address, '48000000000000000000000000'))

    const ve = await Deploy.deployVe(signer, token.address, controller.address);
    const gaugesFactory = await Deploy.deployGaugeFactory(signer);
    const bribesFactory = await Deploy.deployBribeFactory(signer);

    const veDist = await Deploy.deployVeDist(signer, ve.address);
    const voter = await Deploy.deployFldxVoter(signer, ve.address, baseFactory, gaugesFactory.address, bribesFactory.address);

    const minter = await Deploy.deployFldxMinter(signer, ve.address, controller.address, warmingUpPeriod);

    const merkleClaim = await Deploy.deployMerkleClaim(signer, token.address, Addresses.merkleRoot);
    const merkleVeNFTClaim = await Deploy.deployMerkleVeNFTClaim(signer, token.address, ve.address,
        Addresses.veNFTMerkleRoot);

    await Misc.runAndWait(() => token.setMerkleClaim(merkleClaim.address));
    await Misc.runAndWait(() => token.setMerkleNFTClaim(merkleVeNFTClaim.address));
    await Misc.runAndWait(() => token.setMinter(minter.address));
    await Misc.runAndWait(() => veDist.setDepositor(minter.address));
    await Misc.runAndWait(() => controller.setVeDist(veDist.address));
    await Misc.runAndWait(() => controller.setVoter(voter.address));

    await Misc.runAndWait(() => voter.initialize(voterTokens, minter.address));

    return [
      controller,
      token,
      gaugesFactory,
      bribesFactory,
      ve,
      veDist,
      voter,
      minter,
    ];
  }

}
