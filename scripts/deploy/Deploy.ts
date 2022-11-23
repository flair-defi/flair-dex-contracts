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
  SwapLibrary,
  Token,
  Ve,
  VeDist,
  Vesw,
  VeswFactory, VeswMinter, VeswRouter01, VeswVoter
} from "../../typechain";
import {Misc} from "../Misc";
import {CoreAddresses} from "./CoreAddresses";

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

  public static async deployVesw(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, 'Vesw')) as Vesw;
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

  public static async deployVeswFactory(signer: SignerWithAddress, treasury: string) {
    return (await Deploy.deployContract(signer, 'VeswFactory', treasury)) as VeswFactory;
  }

  public static async deployGovernanceTreasury(signer: SignerWithAddress) {
    return (await Deploy.deployContract(signer, 'GovernanceTreasury')) as GovernanceTreasury;
  }

  public static async deployVeswRouter01(
    signer: SignerWithAddress,
    factory: string,
    networkToken: string,
  ) {
    return (await Deploy.deployContract(signer, 'VeswRouter01', factory, networkToken)) as VeswRouter01;
  }

  public static async deployLibrary(
      signer: SignerWithAddress,
      router: string,
  ) {
    return (await Deploy.deployContract(signer, 'SwapLibrary', router)) as SwapLibrary;
  }

  public static async deployVe(signer: SignerWithAddress, token: string, controller: string) {
    return (await Deploy.deployContract(signer, 'Ve', token, controller)) as Ve;
  }

  public static async deployVeDist(signer: SignerWithAddress, ve: string) {
    return (await Deploy.deployContract(signer, 'VeDist', ve)) as VeDist;
  }

  public static async deployVeswVoter(
    signer: SignerWithAddress,
    ve: string,
    factory: string,
    gauges: string,
    bribes: string,
  ) {
    return (await Deploy.deployContract(
      signer,
      'VeswVoter',
      ve,
      factory,
      gauges,
      bribes,
    )) as VeswVoter;
  }

  public static async deployVeswMinter(
    signer: SignerWithAddress,
    ve: string,
    controller: string,
    warmingUpPeriod: number
  ) {
    return (await Deploy.deployContract(
      signer,
      'VeswMinter',
      ve,
      controller,
      warmingUpPeriod,
    )) as VeswMinter;
  }

  public static async deployCore(
    signer: SignerWithAddress,
    networkToken: string,
    voterTokens: string[],
    minterClaimants: string[],
    minterClaimantsAmounts: BigNumber[],
    minterSum: BigNumber,
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
    ] = await Deploy.deployVeswSystem(
      signer,
      networkToken,
      voterTokens,
      minterClaimants,
      minterClaimantsAmounts,
      minterSum,
      baseFactory.address,
      warmingUpPeriod,
    );

    return new CoreAddresses(
      token as Vesw,
      gaugesFactory as GaugeFactory,
      bribesFactory as BribeFactory,
      baseFactory as VeswFactory,
      router as VeswRouter01,
      ve as Ve,
      veDist as VeDist,
      voter as VeswVoter,
      minter as VeswMinter,
      treasury as GovernanceTreasury
    );
  }


  public static async deployDex(
    signer: SignerWithAddress,
    networkToken: string,
  ) {
    const treasury = await Deploy.deployGovernanceTreasury(signer);
    const baseFactory = await Deploy.deployVeswFactory(signer, treasury.address);
    const router = await Deploy.deployVeswRouter01(signer, baseFactory.address, networkToken);
    const library = await Deploy.deployLibrary(signer, router.address);

    return [baseFactory, router, treasury, library];
  }

  public static async deployVeswSystem(
    signer: SignerWithAddress,
    networkToken: string,
    voterTokens: string[],
    minterClaimants: string[],
    minterClaimantsAmounts: BigNumber[],
    minterSum: BigNumber,
    baseFactory: string,
    warmingUpPeriod: number,
  ) {
    const controller = await Deploy.deployContract(signer, 'Controller') as Controller;
    const token = await Deploy.deployVesw(signer);
    const ve = await Deploy.deployVe(signer, token.address, controller.address);
    const gaugesFactory = await Deploy.deployGaugeFactory(signer);
    const bribesFactory = await Deploy.deployBribeFactory(signer);


    const veDist = await Deploy.deployVeDist(signer, ve.address);
    const voter = await Deploy.deployVeswVoter(signer, ve.address, baseFactory, gaugesFactory.address, bribesFactory.address);

    const minter = await Deploy.deployVeswMinter(signer, ve.address, controller.address, warmingUpPeriod);

    await Misc.runAndWait(() => token.setMinter(minter.address));
    await Misc.runAndWait(() => veDist.setDepositor(minter.address));
    await Misc.runAndWait(() => controller.setVeDist(veDist.address));
    await Misc.runAndWait(() => controller.setVoter(voter.address));

    await Misc.runAndWait(() => voter.initialize(voterTokens, minter.address));
    await Misc.runAndWait(() => minter.initialize(
      minterClaimants,
      minterClaimantsAmounts,
      minterSum
    ));

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
