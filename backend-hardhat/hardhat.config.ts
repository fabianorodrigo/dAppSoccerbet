import {task} from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-gas-reporter";

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
export default {
  solidity: "0.8.9",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
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
    outputFile: "eth-gas-reporter.txt",
  },
};
