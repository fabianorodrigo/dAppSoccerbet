import "@nomiclabs/hardhat-waffle";
import * as fs from "fs";
import {task} from "hardhat/config";
import {
  ProxiesAddresses,
  PROXIES_ADDRESSES_FILENAME,
} from "../scripts/ProxiesAddresses";
import {BetDTO} from "../test/model";

task("listGames", "List games on the Ganache network").setAction(
  async (taskArgs, hre) => {
    //const utils = new TestUtils();
    const accounts = await hre.ethers.getSigners();
    // The owner is gonna be sent by 1º account
    //When using the hardhat-ethers plugin ContractFactory and Contract instances are connected to the FIRST signer by default.
    const owner = accounts[0];
    const bettorA = accounts[1];
    const bettorB = accounts[2];
    const bettorC = accounts[3];
    const bettorD = accounts[4];
    const bettorE = accounts[5];

    const proxiesAddresses = getProxyAddresses();

    //Calculator contract
    const Calculator = await hre.ethers.getContractFactory(
      "CalculatorUpgradeable"
    );
    const calc = Calculator.attach(proxiesAddresses.CALCULATOR_PROXY_ADDRESS);
    //Token contract
    const ERC20BetToken = await hre.ethers.getContractFactory(
      "BetTokenUpgradeable"
    );
    const erc20BetToken = await ERC20BetToken.attach(
      proxiesAddresses.BETTOKEN_PROXY_ADDRESS
    );
    //GameFactory contract
    const GameFactory = await hre.ethers.getContractFactory(
      "GameFactoryUpgradeable"
    );
    const gameFactory = await GameFactory.attach(
      proxiesAddresses.GAMEFACTORY_PROXY_ADDRESS
    );

    //catching GameCreated event
    const Game = await hre.ethers.getContractFactory("Game");
    const filter = gameFactory.filters.GameCreated();

    const games = await gameFactory.queryFilter(filter, 0, "latest");
    if (games.length == 0) {
      throw new Error(`GameCreated event not found`);
    }

    games.forEach((g) => {
      console.log(g.address);
    });
    // const gameContract = Game.attach(
    //   (games[games.length - 1].args as Result).addressGame
    // );
  }
);

function getProxyAddresses(): ProxiesAddresses {
  const proxyAddresses = JSON.parse(
    fs.readFileSync(`./${PROXIES_ADDRESSES_FILENAME}`).toString()
  );
  return proxyAddresses;
}

/**
 * Follow the process of buying Bet Tokens, aprove for GameContract and bet using the parameters informed
 *
 * @param {Game} gameContract Game contract where the bets will happen
 * @param {address} owner Owner of Game contract
 * @param {Array} bets Array of objects with 'bettorAddress', 'score' and 'tokenAmount' properties
 */
async function makeBets(
  ethers: any,
  erc20BetToken: any,
  gameContract: any,
  owner: any,
  bets: BetDTO[]
) {
  let totalStake = ethers.constants.Zero;
  //Game is initially closed for betting
  const receiptOpen = await gameContract.connect(owner).openForBetting();
  await receiptOpen.wait();

  let betCount = 0;
  for (let bet of bets) {
    ////////////////// BETTOR HAS TO BUY SOME BET TOKENS
    const receiptBuyToken = await bet.bettor.sendTransaction({
      to: erc20BetToken.address,
      value: bet.tokenAmount,
    });
    await receiptBuyToken.wait();

    //////////////// BETTOR ALLOWS {gameContract} SPENT THE VALUE OF THE BET IN HIS NAME
    const receiptApprove = await erc20BetToken
      .connect(bet.bettor)
      .approve(gameContract.address, bet.tokenAmount);
    await receiptApprove.wait();
    //////////////// BETTOR MAKES A BET IN THE VALUE OF {betTokenAmount}
    const receiptBet = await gameContract
      .connect(bet.bettor)
      .bet(bet.score, bet.tokenAmount);

    //https://github.com/indutny/bn.js/
    //Prefix "i":  perform operation in-place, storing the result in the host
    //object (on which the method was invoked). Might be used to avoid number allocation costs
    totalStake = totalStake.add(bet.tokenAmount);
    betCount++;
  }
}

function getRandomBetween(min: number, max: number): number {
  const r = Math.floor(Math.random() * (max - min) + min);
  return r;
}
