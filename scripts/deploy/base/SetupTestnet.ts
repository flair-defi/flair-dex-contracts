import {Deploy} from "../Deploy";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";
import {TestnetAddresses} from "../../addresses/TestnetAddresses";
import {writeFileSync} from "fs";


const voterTokens = [
  "0x2C6BCF9507A6a8dF60b5C0f25003982F4e631923",
  "0x779d4D3A8B0E75219E653Ab310DD76B01333e534",
  "0xcb4aA0C195100297a7A845832F2b4e6C743D8756",
  "0xDD437EbC9a0373e426CEF84680cc06Cb7d1F1645",
  "0x6782D826c0627e33980aF038dCa09cf7CDb0E6a2",
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

const FACTORY = '0xFf831c9742418cc9642016CC7Cb089eD70eD2BB7';
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
