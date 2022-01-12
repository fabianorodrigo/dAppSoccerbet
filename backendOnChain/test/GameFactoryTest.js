/**
 * Agregates testing for specific testing about business of Game contract
 */
const {expect} = require("chai");
// Import utilities from Test Helpers
const {BN, expectEvent, expectRevert} = require("@openzeppelin/test-helpers");

const BetToken = artifacts.require("BetToken");
const Calculator = artifacts.require("Calculator");
const GameFactory = artifacts.require("GameFactory");
const Game = artifacts.require("Game");
const TestingAuxiliar = artifacts.require("TestingAuxiliar");

contract("GameFactory", (accounts) => {
  let trace = false;
  const DATETIME_20220716_163000_IN_MINUTES = new BN(
    new Date(2022, 6, 16, 16, 30, 0, 0).getTime() / 1000
  );
  // The owner is gonna be sent by 7º Ganache account
  const owner = accounts[6];
  const bettor = accounts[1];

  let erc20BetToken = null,
    calculator = null,
    gameFactoryContract = null;

  before(async function () {
    calculator = await Calculator.new({from: owner});
  });

  beforeEach(async function () {
    erc20BetToken = await BetToken.new({from: owner});
    gameFactoryContract = await GameFactory.new(
      erc20BetToken.address,
      calculator.address,
      {
        from: owner,
      }
    );
  });
  afterEach(async function () {
    if (gameFactoryContract != null) {
      const games = await gameFactoryContract.listGames();
      //since the owner of the games is the same owner of GameFactory,
      //not the GameFactory itself, its destroyContract function has
      //to be called by the owner
      for (const gAddress of games) {
        const game = await Game.at(gAddress);
        await game.destroyContract({from: owner});
      }
      await gameFactoryContract.destroyContract({from: owner}); //, gasLimit: 500000});
    }
    await erc20BetToken.destroyContract({from: owner});
  });

  /**
   * NEWGAME
   */
  it(`Should create a new game`, async () => {
    expectEvent(await createGame(), "GameCreated", {
      homeTeam: "SÃO PAULO",
      visitorTeam: "ATLÉTICO-MG",
      datetimeGame: DATETIME_20220716_163000_IN_MINUTES,
    });
  });

  async function createGame() {
    return await gameFactoryContract.newGame(
      "SÃO PAULO",
      "ATLÉTICO-MG",
      DATETIME_20220716_163000_IN_MINUTES,
      {from: owner}
    );
  }

  /**
   * LISTGAME
   */
  it(`Should list games`, async () => {
    await createGame();
    const games = await gameFactoryContract.listGames();
    expect(games).to.be.an("array");
    expect(games).to.have.lengthOf(1);
    const g = await Game.at(games[0]);
    expect(await g.open()).to.be.false;
    expect(await g.finalized()).to.be.false;
  });

  /**
   * SETCOMMISSION
   */
  it(`Should set commision fee for future created Games`, async () => {
    await createGame();
    expect(await gameFactoryContract.getCommission()).to.be.bignumber.equal(
      new BN(10)
    );
    const setCommissionReceipt = await gameFactoryContract.setCommission(16, {
      from: owner,
    });
    expectEvent(setCommissionReceipt, "CommissionChanged", {
      oldCommission: new BN(10),
      newCommission: new BN(16),
    });
    expect(await gameFactoryContract.getCommission()).to.be.bignumber.equal(
      new BN(16)
    );
  });

  it(`Should revert if someone different from owner try set commission`, async () => {
    expectRevert(
      gameFactoryContract.setCommission(16, {from: bettor}),
      "Ownable: caller is not the owner"
    );
  });

  /**
   * DESTROYCONTRACT
   */
  it(`Should eventual Ether balance of GameFactory contract be sent to the owner`, async () => {
    const weiAmount = web3.utils.toWei(new BN(1, "ether"));
    //Create a instance of TestingAuxiliar with some Ether and setting the Game contract as
    //the destination of it's remaining Ether after selfDestruct
    const testingAuxiliar = await TestingAuxiliar.new(
      gameFactoryContract.address,
      {
        value: weiAmount,
      }
    );
    expect(await testingAuxiliar.selfDestructRecipient()).to.be.equal(
      gameFactoryContract.address
    );
    //game contract balance should be ZERO
    expect(
      await web3.eth.getBalance(gameFactoryContract.address)
    ).to.be.bignumber.equal(new BN(0));
    // The ETHER balance of the new TestingAuxiliar contract has to be 1 Ether
    expect(
      await web3.eth.getBalance(testingAuxiliar.address)
    ).to.be.bignumber.equal(weiAmount);
    // Destructing the testingAuxiliar should send it's Ethers to Game contract
    await testingAuxiliar.destroyContract();
    expect(
      await web3.eth.getBalance(gameFactoryContract.address)
    ).to.be.bignumber.equal(weiAmount);
    // Destructing the Game contract should send it's Ethers to owner
    const ownerBalance = await web3.eth.getBalance(owner);
    await gameFactoryContract.destroyContract({from: owner});
    gameFactoryContract = null;
    expect(await web3.eth.getBalance(owner)).to.be.bignumber.greaterThan(
      ownerBalance
    );
  });

  it(`Should revert if someone different from owner try destroy contract`, async () => {
    expectRevert(
      gameFactoryContract.destroyContract({from: bettor}),
      "Ownable: caller is not the owner"
    );
  });
  it(`Should revert if sending Ether to the contract`, async () => {
    const weiAmount = web3.utils.toWei(new BN(1, "ether"));
    expectRevert.unspecified(
      gameFactoryContract.sendTransaction({
        from: bettor,
        value: weiAmount,
      })
    );
  });
});
