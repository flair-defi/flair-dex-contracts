import {Deploy} from "../Deploy";
import {ethers} from "hardhat";
import {Verify} from "../../Verify";
import {Misc} from "../../Misc";
import {BigNumber} from "ethers";
import {TestnetAddresses} from "../../addresses/TestnetAddresses";
import {writeFileSync} from "fs";


const voterTokens = [
  "0xA0b777d20C2eF1E3E46837Cfa66A48676B6eA7B1",
  "0x96b8a833794Bfc0d50CfA6260f03e6582E632cD5",
  "0x1269Bc25DC9457cc5c207A26798A3561F55514f6",
  "0xcDCEDa3C39C3089E6211Fde0a3835531760F7C00",
  "0x34C9DF2b2da601Ff5d9056206124f194Adaa8dC9",
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

const FACTORY = '0x9197393d2Be4A686f337bF036238E7839f62e71c';
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

  await Misc.wait(50);

  await Verify.verify(controller.address);
  await Verify.verify(token.address);
  await Verify.verify(gaugesFactory.address);
  await Verify.verify(bribesFactory.address);
  await Verify.verifyWithArgs(ve.address, [token.address, controller.address]);
  await Verify.verifyWithArgs(veDist.address, [ve.address]);
  await Verify.verifyWithArgs(voter.address, [ve.address, FACTORY, gaugesFactory.address, bribesFactory.address]);
  await Verify.verifyWithArgs(minter.address, [ve.address, controller.address, WARMING]);

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
