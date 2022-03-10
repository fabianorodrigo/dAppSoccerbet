import {ethers, upgrades} from "hardhat";

function getContractddress(): string {
  throw new Error("Calculator address not defined");
}

async function main() {
  const [deployer, addr1, addr2] = await ethers.getSigners();

  console.log("Upgrading Calculator with the account:", deployer.address);

  //upgrade the deployed instance to a new version. The new version can be a different
  // contract (such as BetTokenV2), or you can just modify the existing BetToken contract
  //and recompile it - the plugin will note it changed.

  // While this plugin keeps track of all the implementation contracts you have deployed per
  // network, in order to reuse them and validate storage compatibilities, it does not keep
  // track of the proxies you have deployed. This means that you will need to manually keep
  // track of each deployment address, to supply those to the upgrade function when needed.

  // The plugin will take care of comparing new version of Contract to the previous one to
  // ensure they are compatible for the upgrade, deploy the new version implementation contract
  // (unless there is one already from a previous deployment), and upgrade the existing proxy to the new implementation.

  const CONTRACT_ADDRESS = getContractddress();
  const Calculator = await ethers.getContractFactory("CalculatorUpgradeable");
  await upgrades.upgradeProxy(CONTRACT_ADDRESS, Calculator);
  console.log("Calculator upgraded at: ", CONTRACT_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });