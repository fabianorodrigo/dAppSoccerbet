import {expect} from "chai";
import {Contract, ContractFactory, Signer, Transaction} from "ethers";
/**
 * When using JavaScript, all the properties in the HRE are injected into the global scope,
 * and are also available by getting the HRE explicitly. When using TypeScript nothing will
 * be available in the global scope and you will need to import everything explicitly.
 */
import {ethers, upgrades} from "hardhat";
import {TestUtils} from "./TestUtils";

const DATETIME_20220716_170000_IN_MINUTES =
  new Date(2022, 6, 16, 17, 0, 0, 0).getTime() / 1000;

let ERC20BetToken: ContractFactory,
  Calculator: ContractFactory,
  GameFactory: ContractFactory,
  Game: ContractFactory,
  TestingAuxiliar: ContractFactory;
let erc20BetToken: Contract,
  calc: Contract,
  gameFactory: Contract,
  gameContract: Contract;
const utils = new TestUtils();

describe("Game", function () {
  let accounts: Signer[];
  let owner: Signer;
  let bettorA: Signer;
  let bettorB: Signer;
  let bettorAAddress: string;
  let bettorBAddress: string;

  before(async () => {
    accounts = await ethers.getSigners();
    // The owner is gonna be sent by 1º account
    //When using the hardhat-ethers plugin ContractFactory and Contract instances are connected to the FIRST signer by default.
    owner = accounts[0];
    bettorA = accounts[1];
    bettorB = accounts[2];
    bettorAAddress = await bettorA.getAddress();
    bettorBAddress = await bettorB.getAddress();
    //Calculator contract
    Calculator = await ethers.getContractFactory("CalculatorUpgradeable");
    calc = await upgrades.deployProxy(Calculator);
    await calc.deployed();
    //Factories
    ERC20BetToken = await ethers.getContractFactory("BetTokenUpgradeable");
    GameFactory = await ethers.getContractFactory("GameFactoryUpgradeable");
    Game = await ethers.getContractFactory("Game");
    TestingAuxiliar = await ethers.getContractFactory("TestingAuxiliar");
  });

  beforeEach(async () => {
    //Contracts
    erc20BetToken = await upgrades.deployProxy(ERC20BetToken);
    await erc20BetToken.deployed();
    gameFactory = await upgrades.deployProxy(
      GameFactory,
      [erc20BetToken.address, calc.address],
      {initializer: "initialize"}
    );
    gameContract = await Game.deploy(
      await owner.getAddress(),
      "SÃO PAULO",
      "ATLÉTICO-MG",
      DATETIME_20220716_170000_IN_MINUTES,
      erc20BetToken.address,
      calc.address,
      10
    );
  });

  afterEach(async () => {
    if (await utils.isContract(erc20BetToken.address)) {
      await erc20BetToken.destroyContract();
    }
    if (await utils.isContract(gameContract.address)) {
      await gameContract.destroyContract();
    }
  });

  it(`Should have the initial state accordingly`, async () => {
    // Game attributes
    expect(await gameContract.homeTeam()).to.equal("SÃO PAULO");
    expect(await gameContract.visitorTeam()).to.equal("ATLÉTICO-MG");
    expect(await gameContract.datetimeGame()).to.be.equal(
      DATETIME_20220716_170000_IN_MINUTES
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
    const receiptOpen = await gameContract.connect(owner).openForBetting();
    expect(await gameContract.open()).to.be.true;
    expect(receiptOpen)
      .to.emit(gameContract, "GameOpened")
      .withArgs(
        gameContract.address,
        "SÃO PAULO",
        "ATLÉTICO-MG",
        DATETIME_20220716_170000_IN_MINUTES
      );
  });

  it(`Should revert if try open for betting an already open game`, async () => {
    //Game is initially closed for betting
    await gameContract.connect(owner).openForBetting();
    expect(gameContract.connect(owner).openForBetting()).to.revertedWith(
      "The game is not closed"
    );
  });

  it(`Should revert if someone different from owner try open a game for betting`, async () => {
    expect(gameContract.connect(bettorA).openForBetting()).to.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  /**
   * CLOSEFORBETTING
   */
  it(`Should close open game for betting`, async () => {
    //Game is initially closed for betting
    await gameContract.connect(owner).openForBetting();
    const receiptClose = await gameContract.connect(owner).closeForBetting();
    expect(await gameContract.open()).to.be.false;
    expect(receiptClose)
      .to.emit(gameContract, "GameClosed")
      .withArgs(
        gameContract.address,
        "SÃO PAULO",
        "ATLÉTICO-MG",
        DATETIME_20220716_170000_IN_MINUTES
      );
  });

  it(`Should revert if try close for betting an closed game`, async () => {
    //Game is initially closed for betting
    expect(gameContract.connect(owner).closeForBetting()).to.revertedWith(
      "The game is not open"
    );
  });

  it(`Should revert if someone different from owner try close a game for betting`, async () => {
    expect(gameContract.connect(bettorA).closeForBetting()).to.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  /**
   * FINALIZEGAME
   */
  it(`Should finalize a closed game`, async () => {
    const score = {home: 3, visitor: 1};
    const receiptFinalize = await gameContract
      .connect(owner)
      .finalizeGame(score);
    expect(await gameContract.open()).to.be.false;
    expect(await gameContract.finalized()).to.be.true;
    const finalScore = await gameContract.finalScore();
    expect(finalScore.home).to.be.equal(score.home);
    expect(finalScore.visitor).to.be.equal(score.visitor);
    expect(receiptFinalize)
      .to.emit(gameContract, "GameFinalized")
      .withArgs(
        gameContract.address,
        "SÃO PAULO",
        "ATLÉTICO-MG",
        DATETIME_20220716_170000_IN_MINUTES,
        ethers.constants.Zero,
        [score.home, score.visitor]
      );
  });

  it(`Should revert if try to finalize an open game`, async () => {
    const score = {home: "3", visitor: "1"};
    //Game is initially closed for betting
    await gameContract.connect(owner).openForBetting();
    expect(gameContract.connect(owner).finalizeGame(score)).to.revertedWith(
      "The game is still open for bettings, close it first"
    );
    expect(await gameContract.finalized()).to.be.false;
    const finalScore = await gameContract.finalScore();
    expect(finalScore.home).to.be.equal(ethers.constants.Zero);
    expect(finalScore.visitor).to.be.equal(ethers.constants.Zero);
  });

  it(`Should revert if try to finalize an already finalized game`, async () => {
    const score = {home: "3", visitor: "1"};
    await gameContract.connect(owner).finalizeGame(score);
    expect(gameContract.connect(owner).finalizeGame(score)).to.revertedWith(
      "The game has been already finalized"
    );
  });

  it(`Should revert if someone different from owner try finalize a game`, async () => {
    const score = {home: "3", visitor: "1"};
    expect(gameContract.connect(bettorA).finalizeGame(score)).to.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  /**
   * BET
   */
  it(`Should make a bet on an open game`, async () => {
    const score = {home: 3, visitor: 1};
    const betTokenAmount = 1001;
    //Game is initially closed for betting
    await gameContract.connect(owner).openForBetting();
    ////////////////// BETTOR HAS TO BUY SOME BETTOKENS
    await bettorA.sendTransaction({
      to: erc20BetToken.address,
      value: betTokenAmount,
    });
    // The ETHER balance of BetToken contract is now 1001 WEI
    expect(await ethers.provider.getBalance(erc20BetToken.address)).to.be.equal(
      1001
    );
    // The BETTOKEN balance of the bettor is now 1001 BETTOKENs
    expect(await erc20BetToken.balanceOf(bettorAAddress)).to.be.equal(1001);
    //////////////// BETTOR ALLOWS {gameContract} SPENT THE VALUE OF THE BET IN HIS NAME
    const receiptApprove = await erc20BetToken
      .connect(bettorA)
      .approve(gameContract.address, betTokenAmount);
    expect(receiptApprove)
      .to.emit(erc20BetToken, "Approval")
      .withArgs(bettorAAddress, gameContract.address, betTokenAmount);
    const allowanceValue = await erc20BetToken.allowance(
      bettorAAddress,
      gameContract.address
    );
    expect(allowanceValue).to.be.equal(betTokenAmount);
    //////////////// BETTOR MAKES A BET IN THE VALUE OF {betTokenAmount}
    const receiptBet = await gameContract
      .connect(bettorA)
      .bet(score, betTokenAmount);
    // The BETTOKEN balances of the Game contract and the bettor are, respectively, 1001 and 0 BETTOKENs
    expect(await erc20BetToken.balanceOf(gameContract.address)).to.be.equal(
      1001
    );
    expect(await erc20BetToken.balanceOf(bettorAAddress)).to.be.equal(
      ethers.constants.Zero
    );

    expect(receiptBet)
      .to.emit(gameContract, "BetOnGame")
      .withArgs(
        gameContract.address,
        bettorAAddress,
        "SÃO PAULO",
        "ATLÉTICO-MG",
        DATETIME_20220716_170000_IN_MINUTES,
        [score.home, score.visitor]
      );
  });

  it(`Should revert if try to bet on a closed game`, async () => {
    const score = {home: 3, visitor: 1};
    const betTokenAmount = 1001;
    ////////////////// BETTOR HAS TO BUY SOME BETTOKENS
    await bettorA.sendTransaction({
      to: erc20BetToken.address,
      value: betTokenAmount,
    });
    //////////////// BETTOR ALLOWS {gameContract} SPENT THE VALUE OF THE BET IN HIS NAME
    const receiptApprove = await erc20BetToken
      .connect(bettorA)
      .approve(gameContract.address, betTokenAmount);
    //Game is initially closed for betting. Since the game was not opened, it has to revert
    expect(
      gameContract.connect(bettorA).bet(score, betTokenAmount)
    ).to.be.revertedWith("The game is not open");
  });

  it(`Should revert if try to bet zero BetTokens on a game`, async () => {
    const score = {home: 3, visitor: 1};
    const betTokenAmount = 1001;
    //Game is initially closed for betting
    await gameContract.connect(owner).openForBetting();
    //////////////// BETTOR MAKES A BET IN THE VALUE OF ZERO BETTOKENS
    expect(
      gameContract.connect(bettorA).bet(score, ethers.constants.Zero)
    ).to.be.revertedWith("The betting value has to be greater than zero");
  });

  it(`Should revert if try to bet on a game without BetTokens`, async () => {
    const score = {home: 3, visitor: 1};
    const betTokenAmount = 1001;
    //Game is initially closed for betting
    await gameContract.connect(owner).openForBetting();
    //////////////// BETTOR MAKES A BET IN THE VALUE OF {betTokenAmount}
    expect(
      gameContract.connect(bettorA).bet(score, betTokenAmount)
    ).to.revertedWith("BetToken balance insufficient");
  });

  it(`Should revert if try to bet on a game without approve enough BetTokens for Game contract`, async () => {
    const score = {home: 3, visitor: 1};
    const betTokenAmount = 1001;
    //Game is initially closed for betting
    await gameContract.connect(owner).openForBetting();
    ////////////////// BETTOR HAS TO BUY SOME BETTOKENS
    bettorA.sendTransaction({to: erc20BetToken.address, value: betTokenAmount});
    //////////////// BETTOR ALLOWS {gameContract} SPENT THE VALUE MINUS 1 OF THE BET IN HIS NAME
    await erc20BetToken.connect(bettorA).approve(gameContract.address, 1000);
    //////////////// BETTOR MAKES A BET IN THE VALUE OF {betTokenAmount}
    expect(
      gameContract.connect(bettorA).bet(score, betTokenAmount)
    ).to.revertedWith("ERC20: insufficient allowance");
  });

  /**
   * LISTBETS
   */
  it(`Should list all bets on an game`, async () => {
    const betTokenAmountA = 1001;
    const betTokenAmountB = 1979;
    //make bets
    await makeBetA_BetB(
      gameContract,
      owner,
      bettorA,
      betTokenAmountA,
      bettorB,
      betTokenAmountB
    );
    // listGames should have 2 bets
    const betsArray = await gameContract.listBets();
    expect(betsArray).to.be.an("array");
    expect(betsArray).to.have.lengthOf(2);
    //bet one
    expect(betsArray[0].bettor).to.be.equal(bettorAAddress);
    expect(betsArray[0].score.home).to.be.equal(3);
    expect(betsArray[0].score.visitor).to.be.equal(1);
    expect(betsArray[0].value).to.be.equal(1001);
    //bet two
    expect(betsArray[1].bettor).to.be.equal(bettorBAddress);
    expect(betsArray[1].score.home).to.be.equal(2);
    expect(betsArray[1].score.visitor).to.be.equal(2);
    expect(betsArray[1].value).to.be.equal(1979);
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
    gameContract: Contract,
    owner: Signer,
    bettorA: Signer,
    betTokenAmountA: number,
    bettorB: Signer,
    betTokenAmountB: number
  ) {
    const scoreA = {home: 3, visitor: 1};
    const scoreB = {home: 2, visitor: 2};
    //Game is initially closed for betting
    await gameContract.connect(owner).openForBetting();
    ////////////////// BETTOR HAS TO BUY SOME BETTOKENS
    await bettorA.sendTransaction({
      to: erc20BetToken.address,
      value: betTokenAmountA,
    });
    //////////////// BETTOR ALLOWS {gameContract} SPENT THE VALUE OF THE BET IN HIS NAME
    await erc20BetToken
      .connect(bettorA)
      .approve(gameContract.address, betTokenAmountA);
    //////////////// BETTOR MAKES A BET IN THE VALUE OF {betTokenAmount}
    await gameContract.connect(bettorA).bet(scoreA, betTokenAmountA);
    ////////////////// BETTOR B HAS TO BUY SOME BETTOKENS
    await bettorB.sendTransaction({
      to: erc20BetToken.address,
      value: betTokenAmountB,
    });
    //////////////// BETTOR B ALLOWS {gameContract} SPENT THE VALUE OF THE BET IN HIS NAME
    await erc20BetToken
      .connect(bettorB)
      .approve(gameContract.address, betTokenAmountB);
    //////////////// BETTOR B MAKES A BET IN THE VALUE OF {betTokenAmount}
    await gameContract.connect(bettorB).bet(scoreB, betTokenAmountB);
  }

  /**
   * GETTOTALSTAKE
   */
  it(`Should get the sum of BetTokens bet on an game`, async () => {
    const betTokenAmountA = 16;
    const betTokenAmountB = 7;
    //make bets
    await makeBetA_BetB(
      gameContract,
      owner,
      bettorA,
      betTokenAmountA,
      bettorB,
      betTokenAmountB
    );
    // listGames should have 2 bets
    const stake = await gameContract.getTotalStake();
    expect(stake).to.be.equal(23);
  });

  /**
   * GETCOMMISSIONVALUE
   */
  it(`Should get the percentage of administration commission applyed over the stake of a game`, async () => {
    const betTokenAmountA = 16;
    const betTokenAmountB = 7;
    //make bets
    await makeBetA_BetB(
      gameContract,
      owner,
      bettorA,
      betTokenAmountA,
      bettorB,
      betTokenAmountB
    );
    // listGames should have 2 bets
    const commission = await gameContract.getCommissionValue();
    expect(commission).to.be.equal(2); //seria 2,3 ...
  });

  /**
   * GETPRIZE
   */
  it(`Should get the total stake of a game less the administration commission`, async () => {
    const betTokenAmountA = 16;
    const betTokenAmountB = 7;
    //make bets
    await makeBetA_BetB(
      gameContract,
      owner,
      bettorA,
      betTokenAmountA,
      bettorB,
      betTokenAmountB
    );
    const prize = await gameContract.getPrize();
    expect(prize).to.be.equal(21); //seria 20,7 ...
  });

  /**
   * DESTROYCONTRACT
   */
  it(`Should eventual Ether balance of Game contract be sent to the owner`, async () => {
    const weiAmount = ethers.utils.parseEther("1.0");
    //Create a instance of TestingAuxiliar with some Ether and setting the Game contract as
    //the destination of it's remaining Ether after selfDestruct
    const testingAuxiliar = await TestingAuxiliar.deploy(gameContract.address, {
      value: weiAmount,
    });
    expect(await testingAuxiliar.selfDestructRecipient()).to.be.equal(
      gameContract.address
    );
    //game contract balance should be ZERO
    expect(await ethers.provider.getBalance(gameContract.address)).to.be.equal(
      ethers.constants.Zero
    );
    // The ETHER balance of the new TestingAuxiliar contract has to be 1 Ether
    expect(
      await ethers.provider.getBalance(testingAuxiliar.address)
    ).to.be.equal(weiAmount);
    // Destructing the testingAuxiliar should send it's Ethers to Game contract
    await testingAuxiliar.destroyContract();
    expect(await ethers.provider.getBalance(gameContract.address)).to.be.equal(
      weiAmount
    );
    // Destructing the Game contract should send it's Ethers to owner
    const ownerBalance = await ethers.provider.getBalance(
      await owner.getAddress()
    );
    await gameContract.connect(owner).destroyContract();
    const ownerBalancePostDestruction = await ethers.provider.getBalance(
      await owner.getAddress()
    );
    expect(ownerBalancePostDestruction.gt(ownerBalance)).to.be.true;
  });

  it(`Should revert if someone different from owner try destroy contract`, async () => {
    expect(gameContract.connect(bettorA).destroyContract()).to.revertedWith(
      "Ownable: caller is not the owner"
    );
  });
  it(`Should revert if sending Ether to the contract`, async () => {
    const weiAmount = ethers.utils.parseEther("1.0");
    expect(
      bettorA.sendTransaction({
        to: gameContract.address,
        value: weiAmount,
      })
    ).to.be.reverted;
  });
});
