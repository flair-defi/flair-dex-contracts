import {Deploy} from "../Deploy";
import {ethers} from "hardhat";
import {BigNumber} from "ethers";
import {TestnetAddresses} from "../../addresses/TestnetAddresses";
import {writeFileSync} from "fs";


const voterTokens = [
  "0xD0d692287EA897a11eBE5b011a006D5d7ffC43fC",
  "0x49eBd4a0b8a4D498CA9b30Ee94111306cd71ac04",
  "0x777c400c02cbb0899a0823f77aa7F3FaC376901b",
  "0xc299e3c09458C092081D885f85f545F800FCb85b",
  "0xbb5095446C2C47e3F9aBEBc39daaEF5b51265251",
  TestnetAddresses.WXDC_TOKEN
];

const claimants = [
  "0xd5511d493ac0493ff3167347ab23b8cc9d836832",
  "0x6F0e5192dc85391231341383712F9fFc4A063385"
];

const claimantsAmounts = [
  BigNumber.from("100000000000000000000000"),
  BigNumber.from("237658800000000000000000")
];

const FACTORY = '0x346D87A4672A729E24B6a1b5Da5768730e84aae3';
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
    TestnetAddresses.WXDC_TOKEN,
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
