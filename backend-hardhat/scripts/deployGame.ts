import {
  Game,
  GameFactoryUpgradeable,
  GameFactoryUpgradeable__factory,
  Game__factory,
} from "../typechain-types";
import {ProxiesAddresses, PROXIES_ADDRESSES_FILENAME} from "./ProxiesAddresses";
import * as fs from "fs";
const {ethers} = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contract Game with the account:", deployer.address);

  // We get the contracts to deploy
  const Game: Game__factory = await ethers.getContractFactory("Game");
  const game: Game = await Game.deploy();
  console.log("Game deployed to:", game.address);

  const proxyAddresses: ProxiesAddresses = JSON.parse(
    fs.readFileSync(`./${PROXIES_ADDRESSES_FILENAME}`).toString()
  );

  const GameFactory: GameFactoryUpgradeable__factory =
    await ethers.getContractFactory("GameFactoryUpgradeable");
  const gameFactory: GameFactoryUpgradeable = GameFactory.attach(
    proxyAddresses.GAMEFACTORY_PROXY_ADDRESS
  );
  console.log(
    `Previous Game implementation: ${await gameFactory.getGameImplementation()}`
  );
  const receipt = await gameFactory
    .connect(deployer)
    .setGameImplementation(game.address);
  console.log(
    `Transaction to change implementation sent. Waiting for confirmation ...`
  );
  await receipt.wait();
  console.log(
    `New Game implementation: ${await gameFactory.getGameImplementation()}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
