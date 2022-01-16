/**
 * Agregates testing for specific testing about business of Game contract
 */
const {expect} = require("chai");
// Import utilities from Test Helpers
const {BN, expectEvent, expectRevert} = require("@openzeppelin/test-helpers");

const BetToken = artifacts.require("BetToken");
const Calculator = artifacts.require("Calculator");
const Game = artifacts.require("Game");

contract("Game", (accounts) => {
  const DATETIME_20220716_170000_IN_MINUTES = new BN(
    new Date(2022, 6, 16, 17, 0, 0, 0).getTime() / 1000
  );
  // The owner is gonna be sent by 7º Ganache account
  const owner = accounts[6];
  const bettor = accounts[1];
  const bettorB = accounts[2];
  const bettorC = accounts[3];
  const bettorD = accounts[4];
  const bettorE = accounts[5];

  let erc20BetToken = null,
    calculator = null,
    gameContract = null;

  beforeEach(async function () {
    erc20BetToken = await BetToken.new({from: owner});
    calculator = await Calculator.new({from: owner});
    gameContract = await Game.new(
      owner,
      "SÃO PAULO",
      "ATLÉTICO-MG",
      DATETIME_20220716_170000_IN_MINUTES,
      erc20BetToken.address,
      calculator.address,
      new BN(10),
      {from: owner}
    );
  });
  afterEach(async function () {
    await gameContract.destroyContract({from: owner});
    await erc20BetToken.destroyContract({from: owner});
  });

  /**
   * PAYPRIZES
   */
  it(`Should refund 90% of stake to all bets if nobody matches the final score`, async () => {
    const bets = [
      {
        bettorAddress: bettor,
        tokenAmount: new BN(100),
        score: {home: "3", visitor: "1"},
      },
      {
        bettorAddress: bettorB,
        tokenAmount: new BN(1000),
        score: {home: "2", visitor: "2"},
      },
      {
        bettorAddress: bettorC,
        tokenAmount: new BN(10),
        score: {home: "1", visitor: "0"},
      },
      {
        bettorAddress: bettorD,
        tokenAmount: new BN(600),
        score: {home: "0", visitor: "1"},
      },
      {
        bettorAddress: bettorE,
        tokenAmount: new BN(215),
        score: {home: "0", visitor: "3"},
      },
    ];
    //make bets
    await makeBets(gameContract, owner, bets);
    //Closed for betting
    await gameContract.closeForBetting({from: owner});
    //Finalize the game
    await gameContract.finalizeGame({home: "7", visitor: "7"}, {from: owner});
    //Pay prizes
    await gameContract.payPrizes({from: owner});
    for (let bet of bets) {
      //the balance of bettokens should be equal 90% of each bet value
      //https://github.com/indutny/bn.js/
      //Postfix "n": the argument of the function must be a plain JavaScript Number. Decimals are not supported.
      expect(
        await erc20BetToken.balanceOf(bet.bettorAddress)
      ).to.be.bignumber.equal(bet.tokenAmount.muln(90).divn(100));
    }
  });

  /**
   * Follow the process of buying Bettokens, aprove for GameContract and bet using the parameters informed
   *
   * @param {Game} gameContract Game contract where the bets will happen
   * @param {address} owner Owner of Game contract
   * @param {Array} bets Array of objects with 'bettorAddress', 'score' and 'tokenAmount' properties
   */
  async function makeBets(gameContract, owner, bets) {
    let totalStake = new BN(0);
    //Game is initially closed for betting
    await gameContract.openForBetting({from: owner});

    for (let bet of bets) {
      ////////////////// BETTOR HAS TO BUY SOME BETTOKENS
      await erc20BetToken.sendTransaction({
        from: bet.bettorAddress,
        value: bet.tokenAmount,
      });
      // The BetToken balances of the Game contract is the tokenAmount value of BetTokens
      expect(
        await erc20BetToken.balanceOf(bet.bettorAddress)
      ).to.be.bignumber.equal(bet.tokenAmount);

      //////////////// BETTOR ALLOWS {gameContract} SPENT THE VALUE OF THE BET IN HIS NAME
      await erc20BetToken.approve(gameContract.address, bet.tokenAmount, {
        from: bet.bettorAddress,
      });
      //////////////// BETTOR MAKES A BET IN THE VALUE OF {betTokenAmount}
      await gameContract.bet(bet.score, bet.tokenAmount, {
        from: bet.bettorAddress,
      });
      //https://github.com/indutny/bn.js/
      //Prefix "i":  perform operation in-place, storing the result in the host
      //object (on which the method was invoked). Might be used to avoid number allocation costs
      totalStake.iadd(bet.tokenAmount);
      // The BetToken balances of the Game contract is 0 BetTokens
      expect(
        await erc20BetToken.balanceOf(bet.bettorAddress)
      ).to.be.bignumber.equal("0");
    }

    // The BETTOKEN balances of the Game contract is the sum of all bets
    expect(
      await erc20BetToken.balanceOf(gameContract.address)
    ).to.be.bignumber.equal(totalStake);
  }
});
