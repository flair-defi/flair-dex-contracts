import {Deploy} from "../Deploy";
import {ethers} from "hardhat";
import {Verify} from "../../Verify";
import {Misc} from "../../Misc";
import {BigNumber} from "ethers";
import {MaticTestnetAddresses} from "../../addresses/MaticTestnetAddresses";
import {writeFileSync} from "fs";
import {parseUnits} from "ethers/lib/utils";
import {MaticAddresses} from "../../addresses/MaticAddresses";


const voterTokens = [
  "0xA7Aca6419dE5b689e2FB445854b6f009E3B4F9Ba",
  "0xdFF63E319f1FF3F99A58E975924105c59cF07Fc3",
  "0xf37088c9393bF3fE4743C161681570331B65C69A",
  "0xA5aC8E17CF45c9b103b2bdea7B703B4E7DC93a74",
  "0x792296e2a15e6Ceb5f5039DecaE7A1f25b00B0B0",
];

const claimants = [
  "0x6F0e5192dc85391231341383712F9fFc4A063385",
  "0x00000000000000000000000000000000000000FF"
];

const claimantsAmounts = [
  BigNumber.from("100000000000000000000000"),
  BigNumber.from("237658800000000000000000")
];

const FACTORY = '0x8f7CE78Efd713811cB9327F233dCBcae0C43F062';
const WARMING = 0;

async function main() {
  const signer = (await ethers.getSigners())[0];

  let minterMax = BigNumber.from("0");

  for (const c of claimantsAmounts) {
    minterMax = minterMax.add(c);
  }

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
    MaticTestnetAddresses.WMATIC_TOKEN,
    voterTokens,
    claimants,
    claimantsAmounts,
    minterMax,
    FACTORY,
    0
  );

  const data = ''
    + 'controller: ' + controller.address + '\n'
    + 'token: ' + token.address + '\n'
    + 'gaugesFactory: ' + gaugesFactory.address + '\n'
    + 'bribesFactory: ' + bribesFactory.address + '\n'
    + 've: ' + ve.address + '\n'
    + 'veDist: ' + veDist.address + '\n'
    + 'voter: ' + voter.address + '\n'
    + 'minter: ' + minter.address + '\n'

  console.log(data);
  writeFileSync('tmp/core.txt', data);

  // await Misc.wait(50);
  //
  // await Verify.verify(controller.address);
  // await Verify.verify(token.address);
  // await Verify.verify(gaugesFactory.address);
  // await Verify.verify(bribesFactory.address);
  // await Verify.verifyWithArgs(ve.address, [token.address, controller.address]);
  // await Verify.verifyWithArgs(veDist.address, [ve.address]);
  // await Verify.verifyWithArgs(voter.address, [ve.address, FACTORY, gaugesFactory.address, bribesFactory.address]);
  // await Verify.verifyWithArgs(minter.address, [ve.address, controller.address, WARMING]);

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
