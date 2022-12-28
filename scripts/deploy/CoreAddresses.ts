import {
  BribeFactory,
  GaugeFactory,
  GovernanceTreasury,
  Ve,
  VeDist,
  Fldx,
  FldxFactory,
  FldxMinter,
  FldxRouter01,
  FldxVoter
} from "../../typechain";

export class CoreAddresses {

  readonly token: Fldx;
  readonly gaugesFactory: GaugeFactory;
  readonly bribesFactory: BribeFactory;
  readonly factory: FldxFactory;
  readonly router: FldxRouter01;
  readonly ve: Ve;
  readonly veDist: VeDist;
  readonly voter: FldxVoter;
  readonly minter: FldxMinter;
  readonly treasury: GovernanceTreasury;


  constructor(token: Fldx, gaugesFactory: GaugeFactory, bribesFactory: BribeFactory, factory: FldxFactory,
              router: FldxRouter01, ve: Ve, veDist: VeDist, voter: FldxVoter,
              minter: FldxMinter, treasury: GovernanceTreasury) {
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
