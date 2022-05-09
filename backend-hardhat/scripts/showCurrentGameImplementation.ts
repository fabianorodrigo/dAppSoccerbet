import * as fs from "fs";
import {
  GameFactoryUpgradeable,
  GameFactoryUpgradeable__factory,
} from "../typechain-types";
import {ProxiesAddresses, PROXIES_ADDRESSES_FILENAME} from "./ProxiesAddresses";
const {ethers} = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

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
  // const receipt = await gameFactory.setGameImplementation(
  //   "0x970e8f18ebfEa0B08810f33a5A40438b9530FBCF"
  // );
  // await receipt.wait();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
