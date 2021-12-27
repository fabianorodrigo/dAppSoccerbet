/**
 * Agregates testing for specific testing about business of Game contract
 */
const {expect} = require("chai");
// Import utilities from Test Helpers
const {BN, expectEvent, expectRevert} = require("@openzeppelin/test-helpers");

const BetToken = artifacts.require("BetToken");
const GameFactory = artifacts.require("GameFactory");
const Game = artifacts.require("Game");

contract("GameFactory", (accounts) => {
  let trace = false;
  const DATETIME_20220716_163000_IN_MINUTES = new BN(
    new Date(2022, 6, 16, 16, 30, 0, 0).getTime() / 1000
  );
  // The owner is gonna be sent by 7º Ganache account
  const owner = accounts[6];
  const gambler = accounts[1];

  let erc20BetToken = null,
    gameFactoryContract = null;

  beforeEach(async function () {
    erc20BetToken = await BetToken.new({from: owner});
    gameFactoryContract = await GameFactory.new(erc20BetToken.address, {
      from: owner,
    });
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
   * DESTROYCONTRACT
   */
  it(`Should revert if someone different from owner try destroy contract`, async () => {});
  it(`Should revert if sending Ether to the contract`, async () => {});
});
