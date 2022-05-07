import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import {HardhatUserConfig, task} from "hardhat/config";
import "solidity-coverage";
import "./tasks/populateTestData";
import "./tasks/listGames";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    hardhat: {
      //Hardhat node will mine each 10 seconds
      mining: {
        auto: false,
        interval: 10000,
      },
    },
  },
  mocha: {
    reporter: "mocha-multi-reporters",
    reporterOptions: {
      configFile: "./mocha-reporter-config.json",
    },
  },
  gasReporter: {
    currency: "BRL",
    coinmarketcap: process.env.COINMARKETCAP_API_TOKEN,
    showTimeSpent: true,
    outputFile: "reports/eth-gas-reporter.txt",
    enabled: true,
  },
};

export default config;
