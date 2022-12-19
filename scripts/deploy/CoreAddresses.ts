import {
  BribeFactory,
  GaugeFactory,
  GovernanceTreasury,
  Ve,
  VeDist,
  Vesw,
  VeswFactory,
  VeswMinter,
  VeswRouter01,
  VeswVoter
} from "../../typechain";

export class CoreAddresses {

  readonly token: Vesw;
  readonly gaugesFactory: GaugeFactory;
  readonly bribesFactory: BribeFactory;
  readonly factory: VeswFactory;
  readonly router: VeswRouter01;
  readonly ve: Ve;
  readonly veDist: VeDist;
  readonly voter: VeswVoter;
  readonly minter: VeswMinter;
  readonly treasury: GovernanceTreasury;


  constructor(token: Vesw, gaugesFactory: GaugeFactory, bribesFactory: BribeFactory, factory: VeswFactory,
              router: VeswRouter01, ve: Ve, veDist: VeDist, voter: VeswVoter,
              minter: VeswMinter, treasury: GovernanceTreasury) {
    this.token = token;
    this.gaugesFactory = gaugesFactory;
    this.bribesFactory = bribesFactory;
    this.factory = factory;
    this.router = router;
    this.ve = ve;
    this.veDist = veDist;
    this.voter = voter;
    this.minter = minter;
    this.treasury = treasury;
  }
}
