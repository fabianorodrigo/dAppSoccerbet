import {ethers, upgrades} from "hardhat";

async function main() {
  const [deployer, addr1, addr2] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  //This will automatically check that the Box contract is upgrade-safe,
  //set up a proxy admin (if needed), deploy an implementation contract
  //for the Box contract (unless there is one already from a previous deployment),
  //create a proxy, and initialize it
  const ERC20BetToken = await ethers.getContractFactory("BetTokenUpgradeable");
  const erc20BetToken = await upgrades.deployProxy(ERC20BetToken);
  await erc20BetToken.deployed();
  console.log("BetToken deployed to:", erc20BetToken.address);

  const Calculator = await ethers.getContractFactory("CalculatorUpgradeable");
  const calculator = await upgrades.deployProxy(Calculator);
  await calculator.deployed();
  console.log("Calculator deployed to:", calculator.address);

  const GameFactory = await ethers.getContractFactory("GameFactoryUpgradeable");
  const gameFactory = await upgrades.deployProxy(
    GameFactory,
    [erc20BetToken.address, calculator.address],
    {initializer: "initialize"}
  );
  await gameFactory.deployed();
  console.log("GameFactory deployed to:", gameFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
