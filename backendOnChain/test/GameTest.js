/**
 * Agregates testing for specific testing about business of Game contract
 */
const {expect} = require("chai");
// Import utilities from Test Helpers
const {BN, expectEvent, expectRevert} = require("@openzeppelin/test-helpers");

const BetToken = artifacts.require("BetToken");
const Game = artifacts.require("Game");

contract("Game", (accounts) => {
  let trace = false;
  const DATETIME_20220716_170000_IN_MINUTES = new BN(
    new Date(2022, 6, 16, 17, 0, 0, 0).getTime() / 1000
  );
  // The owner is gonna be sent by 7º Ganache account
  const owner = accounts[6];
  const gambler = accounts[1];

  let erc20BetToken = null,
    gameContract = null;

  beforeEach(async function () {
    erc20BetToken = await BetToken.new({from: owner});
    gameContract = await Game.new(
      "SÃO PAULO",
      "ATLÉTICO-MG",
      DATETIME_20220716_170000_IN_MINUTES,
      erc20BetToken.address,
      {from: owner}
    );
  });

  it(`Should have the initial state accordingly`, async () => {
    // Game attributes
    expect(await gameContract.getHouseTeam()).to.equal("SÃO PAULO");
    expect(await gameContract.getVisitorTeam()).to.equal("ATLÉTICO-MG");
    expect(await gameContract.getDateTimeGame()).to.be.bignumber.equal(
      DATETIME_20220716_170000_IN_MINUTES
    );
    //when the game is created, is initially closed for betting
    expect(
      await gameContract.isOpen(),
      "When created, the game is initially closed for betting"
    ).to.be.false;
    //when the game is created, is initially not finalized
    expect(
      await gameContract.isFinalized(),
      "When created, the game can't be finalized"
    ).to.be.false;
  });

  /**
   * OPENFORBETTING
   */

  it(`Should open closed game for betting`, async () => {
    //Game is initially close for betting
    await gameContract.openForBetting({from: owner});
    expect(await gameContract.isOpen()).to.be.true;
  });

  it(`Should revert if try open for betting an already open game`, async () => {
    //Game is initially close for betting
    await gameContract.openForBetting({from: owner});
    expectRevert(
      gameContract.openForBetting({from: owner}),
      "The game is not closed"
    );
  });

  it(`Should revert if someone different from owner try open a game for betting`, async () => {
    expectRevert(
      gameContract.openForBetting({from: gambler}),
      "Ownable: caller is not the owner"
    );
  });

  /**
   * CLOSEFORBETTING
   */
  it(`Should close open game for betting`, async () => {
    //Game is initially close for betting
    await gameContract.openForBetting({from: owner});
    await gameContract.closeForBetting({from: owner});
    expect(await gameContract.isOpen()).to.be.false;
  });

  it(`Should revert if try close for betting an closed game`, async () => {
    //Game is initially close for betting
    expectRevert(
      gameContract.closeForBetting({from: owner}),
      "The game is not open"
    );
  });

  it(`Should revert if someone different from owner try close a game for betting`, async () => {
    expectRevert(
      gameContract.closeForBetting({from: gambler}),
      "Ownable: caller is not the owner"
    );
  });

  /**
   * FINISHGAME
   */
  it(`Should finish a closed game`, async () => {
    //TODO: discover why the struct returned in getFinalScore() turns uint8 into string
    const score = {house: "3", visitor: "1"};
    await gameContract.finishGame(score, {from: owner});
    expect(await gameContract.isOpen()).to.be.false;
    expect(await gameContract.isFinalized()).to.be.true;
    const finalScore = await gameContract.getFinalScore();
    expect(finalScore.house).to.equal(score.house);
    expect(finalScore.visitor).to.equal(score.visitor);
  });

  it(`Should revert if try to finish an open game`, async () => {
    const score = {house: "3", visitor: "1"};
    //Game is initially close for betting
    await gameContract.openForBetting({from: owner});
    expectRevert(
      gameContract.finishGame(score, {from: owner}),
      "The game is still open for bettings, close it first"
    );
    expect(await gameContract.isFinalized()).to.be.false;
    const finalScore = await gameContract.getFinalScore();
    expect(finalScore.house).to.equal("0");
    expect(finalScore.visitor).to.equal("0");
  });

  it(`Should revert if try to finish an already finished game`, async () => {
    const score = {house: "3", visitor: "1"};
    await gameContract.finishGame(score, {from: owner});
    expectRevert(
      gameContract.finishGame(score, {from: owner}),
      "The game has been already finalized"
    );
  });

  it(`Should revert if someone different from owner try finish a game`, async () => {
    const score = {house: "3", visitor: "1"};
    expectRevert(
      gameContract.finishGame(score, {from: gambler}),
      "Ownable: caller is not the owner"
    );
  });

  /**
   * EDITFINISHEDGAMESCORE
   */
  it(`Should edit the score of a finished game`, async () => {
    const score = {house: "3", visitor: "1"};
    const newScore = {house: "4", visitor: "2"};
    await gameContract.finishGame(score, {from: owner});
    await gameContract.editFinishedGameScore(newScore, {from: owner});
    expect(await gameContract.isOpen()).to.be.false;
    expect(await gameContract.isFinalized()).to.be.true;
    const finalScore = await gameContract.getFinalScore();
    expect(finalScore.house).to.equal(newScore.house);
    expect(finalScore.visitor).to.equal(newScore.visitor);
  });

  it(`Should revert if try to edit the score of a not finished game`, async () => {
    const newScore = {house: "4", visitor: "2"};
    expectRevert(
      gameContract.editFinishedGameScore(newScore, {from: owner}),
      "The game hasn't been finalized yet. Call finishGame function"
    );
  });

  it(`Should revert if someone different from owner try to edit the score of a finished game`, async () => {
    const score = {house: "3", visitor: "1"};
    const newScore = {house: "4", visitor: "2"};
    await gameContract.finishGame(score, {from: owner});
    expectRevert(
      gameContract.editFinishedGameScore(newScore, {from: gambler}),
      "Ownable: caller is not the owner"
    );
  });

  /**
   * DESTROYCONTRACT
   */
  it(`Should revert if someone different from owner try destroy contract`, async () => {
    expectRevert(
      gameContract.destroyContract({from: gambler}),
      "Ownable: caller is not the owner"
    );
  });
  it(`Should revert if sending Ether to the contract`, async () => {
    const weiAmount = web3.utils.toWei(new BN(1, "ether"));

    /**
     * tentar manda ether de outra forma (via CALL???): https://solidity-by-example.org/sending-ether/
     * function sendViaCall(address payable _to) public payable {
     *   // Call returns a boolean value indicating success or failure.
     *   // This is the current recommended method to use.
     *   (bool sent, bytes memory data) = _to.call{value: msg.value}("");
     *   require(sent, "Failed to send Ether");
     * }
     *
     *
     */
    await gameContract.sendTransaction({
      from: gambler,
      value: weiAmount,
    });
    //owner Ether balance
    const posBuyOwnerBalanceETH = await web3.eth.getBalance(owner);
    //contract ERC20 Ether balance
    const posBuyContractBalanceETH = await web3.eth.getBalance(
      gameContract.address
    );
    let receiptDestroy = await gameContract.destroyContract({from: owner});
    // test balance of ERC20 token
    const finalContractBalanceETH = new BN(
      await web3.eth.getBalance(gameContract.address)
    );

    expect(finalContractBalanceETH).to.be.bignumber.equal(new BN(0));

    // test balance of owner of ERC20 token has to be greater than former balance
    expect(await web3.eth.getBalance(owner)).to.be.bignumber.above(
      new BN(posBuyOwnerBalanceETH)
    );
  });
});
