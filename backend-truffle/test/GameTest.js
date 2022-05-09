/**
 * Agregates testing for specific testing about business of Game contract
 */
const {expect} = require("chai");
// Import utilities from Test Helpers
const {BN, expectEvent, expectRevert} = require("@openzeppelin/test-helpers");
const {web3} = require("@openzeppelin/test-helpers/src/setup");

const BetToken = artifacts.require("BetToken");
const Calculator = artifacts.require("Calculator");
const Game = artifacts.require("Game");
const TestingAuxiliar = artifacts.require("TestingAuxiliar");

contract("Game", (accounts) => {
  let trace = false;
  const DATETIME_20220716_170000_IN_SECONDS = new BN(
    new Date(2022, 6, 16, 17, 0, 0, 0).getTime() / 1000
  );
  // The owner is gonna be sent by 7º Ganache account
  const owner = accounts[6];
  const bettor = accounts[1];
  const bettorB = accounts[2];

  let erc20BetToken = null,
    calculator = null,
    gameContract = null,
    testingAuxiliar = null;

  beforeEach(async function () {
    erc20BetToken = await BetToken.new({from: owner});
    calculator = await Calculator.new({from: owner});
    gameContract = await Game.new(
      owner,
      "SÃO PAULO",
      "ATLÉTICO-MG",
      DATETIME_20220716_170000_IN_SECONDS,
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

  it(`Should have the initial state accordingly`, async () => {
    // Game attributes
    expect(await gameContract.homeTeam()).to.equal("SÃO PAULO");
    expect(await gameContract.visitorTeam()).to.equal("ATLÉTICO-MG");
    expect(await gameContract.datetimeGame()).to.be.bignumber.equal(
      DATETIME_20220716_170000_IN_SECONDS
    );
    //when the game is created, is initially closed for betting
    expect(
      await gameContract.open(),
      "When created, the game is initially closed for betting"
    ).to.be.false;
    //when the game is created, is initially not finalized
    expect(
      await gameContract.finalized(),
      "When created, the game can't be finalized"
    ).to.be.false;
  });

  /**
   * OPENFORBETTING
   */

  it(`Should open closed game for betting`, async () => {
    //Game is initially closed for betting
    const receiptOpen = await gameContract.openForBetting({from: owner});
    expect(await gameContract.open()).to.be.true;
    expectEvent(receiptOpen, "GameOpened", {
      addressGame: gameContract.address,
      homeTeam: "SÃO PAULO",
      visitorTeam: "ATLÉTICO-MG",
      datetimeGame: DATETIME_20220716_170000_IN_SECONDS,
    });
  });

  it(`Should revert if try open for betting an already open game`, async () => {
    //Game is initially closed for betting
    await gameContract.openForBetting({from: owner});
    await expectRevert(
      gameContract.openForBetting({from: owner}),
      "The game is not closed"
    );
  });

  it(`Should revert if someone different from owner try open a game for betting`, async () => {
    await expectRevert(
      gameContract.openForBetting({from: bettor}),
      "Ownable: caller is not the owner"
    );
  });

  /**
   * CLOSEFORBETTING
   */
  it(`Should close open game for betting`, async () => {
    //Game is initially closed for betting
    await gameContract.openForBetting({from: owner});
    const receiptClose = await gameContract.closeForBetting({from: owner});
    expect(await gameContract.open()).to.be.false;
    expectEvent(receiptClose, "GameClosed", {
      addressGame: gameContract.address,
      homeTeam: "SÃO PAULO",
      visitorTeam: "ATLÉTICO-MG",
      datetimeGame: DATETIME_20220716_170000_IN_SECONDS,
    });
  });

  it(`Should revert if try close for betting an closed game`, async () => {
    //Game is initially closed for betting
    await expectRevert(
      gameContract.closeForBetting({from: owner}),
      "The game is not open"
    );
  });

  it(`Should revert if someone different from owner try close a game for betting`, async () => {
    await expectRevert(
      gameContract.closeForBetting({from: bettor}),
      "Ownable: caller is not the owner"
    );
  });

  /**
   * FINALIZEGAME
   */
  it(`Should finalize a closed game`, async () => {
    //TODO: discover why the struct returned in getFinalScore() turns uint8 into string
    const score = {home: "3", visitor: "1"};
    const receiptFinalize = await gameContract.finalizeGame(score, {
      from: owner,
    });
    expect(await gameContract.open()).to.be.false;
    expect(await gameContract.finalized()).to.be.true;
    const finalScore = await gameContract.finalScore();
    expect(finalScore.home).to.be.bignumber.equal(score.home);
    expect(finalScore.visitor).to.be.bignumber.equal(score.visitor);
    expectEvent(receiptFinalize, "GameFinalized", {
      addressGame: gameContract.address,
      homeTeam: "SÃO PAULO",
      visitorTeam: "ATLÉTICO-MG",
      datetimeGame: DATETIME_20220716_170000_IN_SECONDS,
      score: Object.values(score), //had to to this in order to expectEvent work properly
    });
  });

  it(`Should revert if try to finalize an open game`, async () => {
    const score = {home: "3", visitor: "1"};
    //Game is initially closed for betting
    await gameContract.openForBetting({from: owner});
    await expectRevert(
      gameContract.finalizeGame(score, {from: owner}),
      "The game is still open for bettings, close it first"
    );
    expect(await gameContract.finalized()).to.be.false;
    const finalScore = await gameContract.finalScore();
    expect(finalScore.home).to.be.bignumber.equal("0");
    expect(finalScore.visitor).to.be.bignumber.equal("0");
  });

  it(`Should revert if try to finalize an already finalized game`, async () => {
    const score = {home: "3", visitor: "1"};
    await gameContract.finalizeGame(score, {from: owner});
    await expectRevert(
      gameContract.finalizeGame(score, {from: owner}),
      "The game has been already finalized"
    );
  });

  it(`Should revert if someone different from owner try finalize a game`, async () => {
    const score = {home: "3", visitor: "1"};
    await expectRevert(
      gameContract.finalizeGame(score, {from: bettor}),
      "Ownable: caller is not the owner"
    );
  });

  /**
   * BET
   */
  it(`Should make a bet on an open game`, async () => {
    const score = {home: "3", visitor: "1"};
    const betTokenAmount = new BN(1001);
    //Game is initially closed for betting
    await gameContract.openForBetting({from: owner});
    ////////////////// BETTOR HAS TO BUY SOME BETTOKENS
    await erc20BetToken.sendTransaction({
      from: bettor,
      value: betTokenAmount,
    });
    // The ETHER balance of BetToken contract is now 1001 WEI
    expect(
      await web3.eth.getBalance(erc20BetToken.address)
    ).to.be.bignumber.equal("1001");
    // The BETTOKEN balance of the bettor is now 1001 BETTOKENs
    expect(await erc20BetToken.balanceOf(bettor)).to.be.bignumber.equal("1001");
    //////////////// BETTOR ALLOWS {gameContract} SPENT THE VALUE OF THE BET IN HIS NAME
    const receiptApprove = await erc20BetToken.approve(
      gameContract.address,
      betTokenAmount,
      {
        from: bettor,
      }
    );
    expectEvent(receiptApprove, "Approval", {
      owner: bettor,
      spender: gameContract.address,
      value: betTokenAmount,
    });
    const allowanceValue = await erc20BetToken.allowance(
      bettor,
      gameContract.address
    );
    expect(allowanceValue).to.be.bignumber.equal(betTokenAmount);
    //////////////// BETTOR MAKES A BET IN THE VALUE OF {betTokenAmount}
    const receiptBet = await gameContract.bet(score, betTokenAmount, {
      from: bettor,
    });
    // The BETTOKEN balances of the Game contract and the bettor are, respectively, 1001 and 0 BETTOKENs
    expect(
      await erc20BetToken.balanceOf(gameContract.address)
    ).to.be.bignumber.equal("1001");
    expect(await erc20BetToken.balanceOf(bettor)).to.be.bignumber.equal("0");

    expectEvent(receiptBet, "BetOnGame", {
      addressGame: gameContract.address,
      addressBettor: bettor,
      homeTeam: "SÃO PAULO",
      visitorTeam: "ATLÉTICO-MG",
      datetimeGame: DATETIME_20220716_170000_IN_SECONDS,
      score: Object.values(score), //had to to this in order to expectEvent work properly
    });
  });

  it(`Should revert if try to bet on a closed game`, async () => {
    const score = {home: "3", visitor: "1"};
    const betTokenAmount = new BN(1001);
    ////////////////// BETTOR HAS TO BUY SOME BETTOKENS
    await erc20BetToken.sendTransaction({
      from: bettor,
      value: betTokenAmount,
    });
    //////////////// BETTOR ALLOWS {gameContract} SPENT THE VALUE OF THE BET IN HIS NAME
    const receiptApprove = await erc20BetToken.approve(
      gameContract.address,
      betTokenAmount,
      {
        from: bettor,
      }
    );
    //Game is initially closed for betting. Since the game was not opened, it has to revert
    await expectRevert(
      gameContract.bet(score, betTokenAmount, {
        from: bettor,
      }),
      "The game is not open"
    );
  });

  it(`Should revert if try to bet zero BetTokens on a game`, async () => {
    const score = {home: "3", visitor: "1"};
    const betTokenAmount = new BN(1001);
    //Game is initially closed for betting
    await gameContract.openForBetting({from: owner});
    //////////////// BETTOR MAKES A BET IN THE VALUE OF ZERO BETTOKENS
    await expectRevert(
      gameContract.bet(score, new BN(0), {
        from: bettor,
      }),
      "The betting value has to be greater than zero"
    );
  });

  it(`Should revert if try to bet on a game without BetTokens`, async () => {
    const score = {home: "3", visitor: "1"};
    const betTokenAmount = new BN(1001);
    //Game is initially closed for betting
    await gameContract.openForBetting({from: owner});
    //////////////// BETTOR MAKES A BET IN THE VALUE OF {betTokenAmount}
    await expectRevert(
      gameContract.bet(score, betTokenAmount, {
        from: bettor,
      }),
      "BetToken balance insufficient"
    );
  });

  it(`Should revert if try to bet on a game without approve enough BetTokens for Game contract`, async () => {
    const score = {home: "3", visitor: "1"};
    const betTokenAmount = new BN(1001);
    //Game is initially closed for betting
    await gameContract.openForBetting({from: owner});
    ////////////////// BETTOR HAS TO BUY SOME BETTOKENS
    await erc20BetToken.sendTransaction({
      from: bettor,
      value: betTokenAmount,
    });
    //////////////// BETTOR ALLOWS {gameContract} SPENT THE VALUE MINUS 1 OF THE BET IN HIS NAME
    await erc20BetToken.approve(gameContract.address, new BN(1000), {
      from: bettor,
    });
    //////////////// BETTOR MAKES A BET IN THE VALUE OF {betTokenAmount}
    await expectRevert(
      gameContract.bet(score, betTokenAmount, {
        from: bettor,
      }),
      "ERC20: transfer amount exceeds allowance"
    );
  });

  /**
   * LISTBETS
   */
  it(`Should list all bets on an game`, async () => {
    const betTokenAmountA = new BN(1001);
    const betTokenAmountB = new BN(1979);
    //make bets
    await makeBetA_BetB(
      gameContract,
      owner,
      bettor,
      betTokenAmountA,
      bettorB,
      betTokenAmountB
    );
    // listGames should have 2 bets
    const betsArray = await gameContract.listBets();
    expect(betsArray).to.be.an("array");
    expect(betsArray).to.have.lengthOf(2);
    //bet one
    expect(betsArray[0].bettor).to.be.equal(bettor);
    expect(betsArray[0].score.home).to.be.equal("3");
    expect(betsArray[0].score.visitor).to.be.equal("1");
    expect(betsArray[0].value).to.be.bignumber.equal("1001");
    //bet two
    expect(betsArray[1].bettor).to.be.equal(bettorB);
    expect(betsArray[1].score.home).to.be.equal("2");
    expect(betsArray[1].score.visitor).to.be.equal("2");
    expect(betsArray[1].value).to.be.bignumber.equal("1979");
  });

  /**
   * Follow the process of buying Bettokens, aprove for GameContract and bet using the parameters informed
   * @param {*} gameContract Game contract where the bets will happen
   * @param {*} owner Owner of Game contract
   * @param {*} bettorA adsress of bettor A
   * @param {*} betTokenAmountA amount of BetToken on betting A
   * @param {*} bettorB address for bettor B
   * @param {*} betTokenAmountB amount of BetToken on betting B
   */
  async function makeBetA_BetB(
    gameContract,
    owner,
    bettorA,
    betTokenAmountA,
    bettorB,
    betTokenAmountB
  ) {
    const scoreA = {home: "3", visitor: "1"};
    const scoreB = {home: "2", visitor: "2"};
    //Game is initially closed for betting
    await gameContract.openForBetting({from: owner});
    ////////////////// BETTOR HAS TO BUY SOME BETTOKENS
    await erc20BetToken.sendTransaction({
      from: bettorA,
      value: betTokenAmountA,
    });
    //////////////// BETTOR ALLOWS {gameContract} SPENT THE VALUE OF THE BET IN HIS NAME
    await erc20BetToken.approve(gameContract.address, betTokenAmountA, {
      from: bettorA,
    });
    //////////////// BETTOR MAKES A BET IN THE VALUE OF {betTokenAmount}
    await gameContract.bet(scoreA, betTokenAmountA, {
      from: bettorA,
    });
    ////////////////// BETTOR B HAS TO BUY SOME BETTOKENS
    await erc20BetToken.sendTransaction({
      from: bettorB,
      value: betTokenAmountB,
    });
    //////////////// BETTOR B ALLOWS {gameContract} SPENT THE VALUE OF THE BET IN HIS NAME
    await erc20BetToken.approve(gameContract.address, betTokenAmountB, {
      from: bettorB,
    });
    //////////////// BETTOR B MAKES A BET IN THE VALUE OF {betTokenAmount}
    await gameContract.bet(scoreB, betTokenAmountB, {
      from: bettorB,
    });
  }

  /**
   * GETTOTALSTAKE
   */
  it(`Should get the sum of BetTokens bet on an game`, async () => {
    const betTokenAmountA = new BN(16);
    const betTokenAmountB = new BN(7);
    //make bets
    await makeBetA_BetB(
      gameContract,
      owner,
      bettor,
      betTokenAmountA,
      bettorB,
      betTokenAmountB
    );
    // listGames should have 2 bets
    const stake = await gameContract.getTotalStake();
    expect(stake).to.be.bignumber.equal(new BN(23));
  });

  /**
   * GETCOMMISSIONVALUE
   */
  it(`Should get the percentage of administration commission applyed over the stake of a game`, async () => {
    const betTokenAmountA = new BN(16);
    const betTokenAmountB = new BN(7);
    //make bets
    await makeBetA_BetB(
      gameContract,
      owner,
      bettor,
      betTokenAmountA,
      bettorB,
      betTokenAmountB
    );
    // listGames should have 2 bets
    const commission = await gameContract.getCommissionValue();
    expect(commission).to.be.bignumber.equal(new BN(2)); //seria 2,3 ...
  });

  /**
   * GETPRIZE
   */
  it(`Should get the total stake of a game less the administration commission`, async () => {
    const betTokenAmountA = new BN(16);
    const betTokenAmountB = new BN(7);
    //make bets
    await makeBetA_BetB(
      gameContract,
      owner,
      bettor,
      betTokenAmountA,
      bettorB,
      betTokenAmountB
    );
    const prize = await gameContract.getPrize();
    expect(prize).to.be.bignumber.equal(new BN(21)); //seria 20,7 ...
  });

  /**
   * DESTROYCONTRACT
   */
  it(`Should eventual Ether balance of Game contract be sent to the owner`, async () => {
    const weiAmount = web3.utils.toWei(new BN(1, "ether"));
    //Create a instance of TestingAuxiliar with some Ether and setting the Game contract as
    //the destination of it's remaining Ether after selfDestruct
    const testingAuxiliar = await TestingAuxiliar.new(gameContract.address, {
      value: weiAmount,
    });
    expect(await testingAuxiliar.selfDestructRecipient()).to.be.equal(
      gameContract.address
    );
    //game contract balance should be ZERO
    expect(
      await web3.eth.getBalance(gameContract.address)
    ).to.be.bignumber.equal(new BN(0));
    // The ETHER balance of the new TestingAuxiliar contract has to be 1 Ether
    expect(
      await web3.eth.getBalance(testingAuxiliar.address)
    ).to.be.bignumber.equal(weiAmount);
    // Destructing the testingAuxiliar should send it's Ethers to Game contract
    await testingAuxiliar.destroyContract();
    expect(
      await web3.eth.getBalance(gameContract.address)
    ).to.be.bignumber.equal(weiAmount);
    // Destructing the Game contract should send it's Ethers to owner
    const ownerBalance = await web3.eth.getBalance(owner);
    await gameContract.destroyContract({from: owner});
    expect(await web3.eth.getBalance(owner)).to.be.bignumber.greaterThan(
      ownerBalance
    );
  });

  it(`Should revert if someone different from owner try destroy contract`, async () => {
    await expectRevert(
      gameContract.destroyContract({from: bettor}),
      "Ownable: caller is not the owner"
    );
  });
  it(`Should revert if sending Ether to the contract`, async () => {
    const weiAmount = web3.utils.toWei(new BN(1, "ether"));
    await expectRevert.unspecified(
      gameContract.sendTransaction({
        from: bettor,
        value: weiAmount,
      })
    );
  });
});
