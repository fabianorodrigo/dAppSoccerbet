const {ethers} = require("hardhat");

async function main() {
  const [deployer, addr1, addr2] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // We get the contracts to deploy
  const BetToken = await ethers.getContractFactory("BetToken");
  const betToken = await BetToken.deploy();
  console.log("BetToken deployed to:", betToken.address);
  const Calculator = await ethers.getContractFactory("Calculator");
  const calculator = await Calculator.deploy();
  console.log("Calculator deployed to:", calculator.address);
  const GameFactory = await ethers.getContractFactory("GameFactory");
  const gameFactory = await GameFactory.deploy(
    betToken.address,
    calculator.address
  );
  console.log("GameFactory deployed to:", gameFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
