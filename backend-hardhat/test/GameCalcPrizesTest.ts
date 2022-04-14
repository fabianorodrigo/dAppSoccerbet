import {expect} from "chai";
import {BigNumber, Contract, ContractFactory, Signer} from "ethers";
/**
 * When using JavaScript, all the properties in the HRE are injected into the global scope,
 * and are also available by getting the HRE explicitly. When using TypeScript nothing will
 * be available in the global scope and you will need to import everything explicitly.
 */
import {ethers, upgrades} from "hardhat";
import {BetDTO} from "./model";
import {TestUtils} from "./TestUtils";

// As we have part of contracts following UUPS pattern e GameFactory following Transparent Proxy pattern,
// Upgrades emits a warning message for each test case: Warning: A proxy admin was previously deployed on this network
// This makes excessive noise: https://forum.openzeppelin.com/t/what-is-warning-a-proxy-admin-was-previously-deployed-on-this-network/20501
upgrades.silenceWarnings();

const DATETIME_20220716_170000_IN_MINUTES =
  new Date(2022, 6, 16, 17, 0, 0, 0).getTime() / 1000;

let ERC20BetToken: ContractFactory,
  Calculator: ContractFactory,
  GameFactory: ContractFactory,
  Game: ContractFactory,
  TestingAuxiliar: ContractFactory,
  GameUtils: ContractFactory;
let erc20BetToken: Contract,
  calc: Contract,
  gameFactory: Contract,
  gameContract: Contract,
  gameUtils: Contract;
const utils = new TestUtils();

describe("Game", function () {
  // As we have part of contracts following UUPS pattern e GameFactory following Transparent Proxy pattern,
  // Upgrades emits a warning message for each test case: Warning: A proxy admin was previously deployed on this network
  // This makes excessive noise: https://forum.openzeppelin.com/t/what-is-warning-a-proxy-admin-was-previously-deployed-on-this-network/20501
  upgrades.silenceWarnings();

  let accounts: Signer[];
  let owner: Signer;
  let bettorA: Signer;
  let bettorB: Signer;
  let bettorC: Signer;
  let bettorD: Signer;
  let bettorE: Signer;
  let bettorAAddress: string;
  let bettorBAddress: string;
  let bettorCAddress: string;
  let bettorDAddress: string;
  let bettorEAddress: string;

  let BETS: BetDTO[];

  before(async () => {
    accounts = await ethers.getSigners();
    // The owner is gonna be sent by 1º account
    //When using the hardhat-ethers plugin ContractFactory and Contract instances are connected to the FIRST signer by default.
    owner = accounts[0];
    bettorA = accounts[1];
    bettorB = accounts[2];
    bettorC = accounts[3];
    bettorD = accounts[4];
    bettorE = accounts[5];
    bettorAAddress = await bettorA.getAddress();
    bettorBAddress = await bettorB.getAddress();
    bettorCAddress = await bettorC.getAddress();
    bettorDAddress = await bettorD.getAddress();
    bettorEAddress = await bettorE.getAddress();

    BETS = [
      {
        bettor: bettorA,
        tokenAmount: BigNumber.from(100),
        score: {home: 2, visitor: 2},
      },
      {
        bettor: bettorB,
        tokenAmount: BigNumber.from(1000),
        score: {home: 2, visitor: 2},
      },
      {
        bettor: bettorC,
        tokenAmount: BigNumber.from(10),
        score: {home: 1, visitor: 0},
      },
      {
        bettor: bettorD,
        tokenAmount: BigNumber.from(600),
        score: {home: 0, visitor: 1},
      },
      {
        bettor: bettorE,
        tokenAmount: BigNumber.from(215),
        score: {home: 0, visitor: 3},
      },
    ];

    //Calculator contract
    Calculator = await ethers.getContractFactory("CalculatorUpgradeable");
    calc = await upgrades.deployProxy(Calculator, {kind: "uups"});
    await calc.deployed();
    //GameUtils library
    GameUtils = await ethers.getContractFactory("GameUtils");
    gameUtils = await GameUtils.deploy();
    //Factories
    ERC20BetToken = await ethers.getContractFactory("BetTokenUpgradeable");
    GameFactory = await ethers.getContractFactory("GameFactoryUpgradeable");
    Game = await ethers.getContractFactory("Game");
    TestingAuxiliar = await ethers.getContractFactory("TestingAuxiliar");
  });

  beforeEach(async () => {
    //Contracts
    erc20BetToken = await upgrades.deployProxy(ERC20BetToken, {kind: "uups"});
    await erc20BetToken.deployed();
    // The @openzeppelin/utils/Address, used on setGameImplementation function, has delegateCall,
    // then we need to include the 'unsafeAllow'. However, we made a restriction to setGameImplemention
    // be called only throgh proxy
    gameFactory = await upgrades.deployProxy(
      GameFactory,
      [erc20BetToken.address, calc.address],
      {
        initializer: "initialize",
        unsafeAllow: ["delegatecall"],
      }
    );
    const receiptNewGame = await gameFactory
      .connect(owner)
      .newGame("SÃO PAULO", "ATLÉTICO-MG", DATETIME_20220716_170000_IN_MINUTES);
    const games = await gameFactory.listGames();
    gameContract = Game.attach(games[0].addressGame);
  });

  afterEach(async () => {
    if (await utils.isContract(erc20BetToken.address)) {
      await erc20BetToken.destroyContract();
    }
    if (await utils.isContract(gameContract.address)) {
      await gameContract.destroyContract();
    }
  });

  describe("calcPrizes", () => {
    it(`Should revert when the game's winners have NOT been identified yet`, async () => {
      //make bets
      await utils.makeBets(erc20BetToken, gameContract, owner, BETS);
      //Closed for betting
      await gameContract.connect(owner).closeForBetting();
      //Finalize the game
      const finalizeTransaction = await gameContract
        .connect(owner)
        .finalizeGame({home: 0, visitor: 3});
      //Resolves to the TransactionReceipt once the transaction has been included in the chain for confirms blocks.
      await finalizeTransaction.wait();
      // identify the winners bets again
      await expect(gameContract.calcPrizes()).to.be.revertedWith(
        "UnknownWinners()"
      );
      expect(await gameContract.prizesCalculated()).to.be.false;
    });

    it(`Should revert when the game's prizes have been already calculated`, async () => {
      //make bets
      await utils.makeBets(erc20BetToken, gameContract, owner, BETS);
      //Closed for betting
      await gameContract.connect(owner).closeForBetting();
      //Finalize the game
      const finalizeTransaction = await gameContract
        .connect(owner)
        .finalizeGame({home: 0, visitor: 3});
      //Resolves to the TransactionReceipt once the transaction has been included in the chain for confirms blocks.
      await finalizeTransaction.wait();
      // identify the winners bets
      await gameContract.identifyWinners();
      // Calculates the prizes
      const calcPrizesTransaction = await gameContract.calcPrizes();
      //Resolves to the TransactionReceipt once the transaction has been included in the chain for confirms blocks.
      await calcPrizesTransaction.wait();
      // Calculates the prizes again
      await expect(gameContract.calcPrizes()).to.be.revertedWith(
        "PrizesAlreadyCalculated()"
      );
      expect(await gameContract.winnersIdentified()).to.be.true;
    });

    it(`Should pay 90% of stake to the only one who matched the final score`, async () => {
      //make bets
      await utils.makeBets(erc20BetToken, gameContract, owner, BETS);
      //Closed for betting
      await gameContract.connect(owner).closeForBetting();
      //Finalize the game
      const finalizeTransaction = await gameContract
        .connect(owner)
        .finalizeGame({home: 0, visitor: 3});
      //Resolves to the TransactionReceipt once the transaction has been included in the chain for confirms blocks.
      await finalizeTransaction.wait();
      // identify the winners bets
      await gameContract.identifyWinners();
      // Calculates the prizes
      await gameContract.calcPrizes();

      //Pay prizes
      const sumStake = utils.sumBetsAmountBN(BETS);
      //prize value (total stake minus the administration commision fee)
      const prize = sumStake.sub(
        utils.calcPercentageBN(sumStake, utils.getCommissionPercentageBN())
      );
      const bets = await gameContract.listBets();

      for (let bet of bets) {
        //the prize of bettorE should be equal 90% of all stake
        if (bet.bettor == bettorEAddress) {
          expect(bet.prize).to.be.equal(prize);
          expect(bet.result).to.be.equal(TestUtils.WINNER);
        } else {
          expect(bet.prize).to.be.equal(ethers.constants.Zero);
          expect(bet.result).to.be.equal(TestUtils.LOSER);
        }
      }
      expect(await gameContract.prizesCalculated()).to.be.true;
    });

    it(`Should split proportionally 90% of stake to the multiples who matched the final score`, async () => {
      //make bets
      await utils.makeBets(erc20BetToken, gameContract, owner, BETS);
      //Closed for betting
      await gameContract.connect(owner).closeForBetting();
      //Finalize the game
      await gameContract.connect(owner).finalizeGame({home: 2, visitor: 2});
      // identify the winners bets
      await gameContract.identifyWinners();
      // Calculates the prizes
      await gameContract.calcPrizes();

      //Pay prizes
      const sumStake = utils.sumBetsAmountBN(BETS);
      //prize value (total stake minus the administration commision fee)
      const prize = sumStake.sub(
        utils.calcPercentageBN(sumStake, utils.getCommissionPercentageBN())
      );
      const bets = await gameContract.listBets();

      for (let bet of bets) {
        //90% of all stake should be proportionally splited between bettor and bettorB
        if (bet.bettor == bettorAAddress || bet.bettor == bettorBAddress) {
          expect(bet.prize).to.be.equal(
            prize
              .mul(bet.value)
              .div(BETS[0].tokenAmount.add(BETS[1].tokenAmount))
          );
          expect(bet.result).to.be.equal(TestUtils.WINNER);
        } else {
          expect(bet.prize).to.be.equal(ethers.constants.Zero);
          expect(bet.result).to.be.equal(TestUtils.LOSER);
        }
      }
      expect(await gameContract.prizesCalculated()).to.be.true;
    });

    it(`Should refund 90% of stake to all bets if nobody matches the final score`, async () => {
      //make bets
      await utils.makeBets(erc20BetToken, gameContract, owner, BETS);
      //Closed for betting
      await gameContract.connect(owner).closeForBetting();
      //Finalize the game
      await gameContract.connect(owner).finalizeGame({home: 7, visitor: 7});
      // identify the winners bets
      await gameContract.identifyWinners();
      // Calculates the prizes
      await gameContract.calcPrizes();

      //stake value
      const sumStake = utils.sumBetsAmountBN(BETS);
      //prize value (total stake minus the administration commision fee)
      const prize = sumStake.sub(
        utils.calcPercentageBN(sumStake, utils.getCommissionPercentageBN())
      );
      //Verify calculated prizes
      const bets = await gameContract.listBets();
      for (let bet of bets) {
        //the balance of bettokens should be equal to amount proportional to the prize (90% of stake)
        expect(bet.prize).to.be.equal(prize.mul(bet.value).div(sumStake));
        expect(bet.result).to.be.equal(TestUtils.TIED);
      }
      expect(await gameContract.prizesCalculated()).to.be.true;
    });
  });
});
