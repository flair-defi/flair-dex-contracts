import {Deploy} from "../Deploy";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";
import {TestnetAddresses} from "../../addresses/TestnetAddresses";
import {writeFileSync} from "fs";


const voterTokens = [
  "0x5F38e748AeaBA58D54C1f6456118f974fE5dB0EF",
  "0xa5832D975070EDADD68Bdbba2b21E327417312Df",
  "0x850eC3D75aeaDbF288a7cFFC46c5116f47ed2033",
  "0x6bf11Da741e83f7D44D7fb04233397384587BcAf",
  "0x5089fFFCb6a238B4ff3cd9c1A8Ae540A65002078",
  TestnetAddresses.WETH
];

const claimants = [
  "0xd5511d493ac0493ff3167347ab23b8cc9d836832",
  "0x6F0e5192dc85391231341383712F9fFc4A063385"
];

const claimantsAmounts = [
  BigNumber.from("100000000000000000000000"),
  BigNumber.from("237658800000000000000000")
];

const FACTORY = '0xdFF63E319f1FF3F99A58E975924105c59cF07Fc3';
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
  ] = await Deploy.deployFldxSystem(
    signer,
    TestnetAddresses.WETH,
    voterTokens,
    claimants,
    claimantsAmounts,
    minterMax,
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
