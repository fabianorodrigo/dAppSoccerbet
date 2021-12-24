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
    expect(await g.isOpen()).to.be.false;
    expect(await g.isFinalized()).to.be.false;
  });

  /**
   * OPENFORBETTING
   */

  it(`Should open closed game for betting`, async () => {
    await createGame();
    //test before opening
    let games = await gameFactoryContract.listGames();
    expect(games).to.be.an("array");
    expect(games).to.have.lengthOf(1);
    const g = await Game.at(games[0]);
    expect(await g.isOpen()).to.be.false;
    expect(await g.isFinalized()).to.be.false;
    //open game zero
    const receiptOpen = await gameFactoryContract.openGameForBetting(0, {
      from: owner,
    });
    console.log(receiptOpen);
    expectEvent(receiptOpen, "GameOpened", {
      addressGame: games[0],
      homeTeam: "SÃO PAULO",
      visitorTeam: "ATLÉTICO-MG",
      datetimeGame: DATETIME_20220716_163000_IN_MINUTES,
    });
    //test after open game
    games = await gameFactoryContract.listGames();
    expect(games).to.be.an("array");
    expect(games).to.have.lengthOf(1);
    expect(await g.isOpen()).to.be.true;
    expect(await g.isFinalized()).to.be.false;
  });

  it(`Should revert if try open for betting an already open game`, async () => {});

  it(`Should revert if someone different from owner try open a game for betting`, async () => {});

  /**
   * CLOSEFORBETTING
   */
  it(`Should close open game for betting`, async () => {});

  it(`Should revert if try close for betting an closed game`, async () => {});

  it(`Should revert if someone different from owner try close a game for betting`, async () => {});

  /**
   * FINALIZEGAME
   */
  it(`Should finalized a closed game`, async () => {});

  it(`Should revert if try to finalized an open game`, async () => {});

  it(`Should revert if try to finalized an already finalizeded game`, async () => {});

  it(`Should revert if someone different from owner try finalized a game`, async () => {});

  /**
   * EDITfinalizedEDGAMESCORE
   */
  it(`Should edit the score of a finalizeded game`, async () => {});

  it(`Should revert if try to edit the score of a not finalizeded game`, async () => {});

  it(`Should revert if someone different from owner try to edit the score of a finalizeded game`, async () => {});

  /**
   * DESTROYCONTRACT
   */
  it(`Should revert if someone different from owner try destroy contract`, async () => {});
  it(`Should revert if sending Ether to the contract`, async () => {});
});
