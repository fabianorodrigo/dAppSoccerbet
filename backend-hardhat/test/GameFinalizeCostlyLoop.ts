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
  gameContract: Contract;
let gameUtils: Contract;
const utils = new TestUtils();

describe("Game Finalize", function () {
  this.timeout(8000000);
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

    //Calculator contract
    Calculator = await ethers.getContractFactory("CalculatorUpgradeable");
    calc = await upgrades.deployProxy(Calculator, {kind: "uups"});
    await calc.deployed();
    //GameUtils library
    GameUtils = await ethers.getContractFactory("GameUtils");
    gameUtils = await GameUtils.deploy();
    //Factories
    ERC20BetToken = await ethers.getContractFactory("BetTokenUpgradeable");
    GameFactory = await ethers.getContractFactory("GameFactoryUpgradeable", {
      libraries: {
        GameUtils: gameUtils.address,
      },
    });
    Game = await ethers.getContractFactory("Game", {
      libraries: {
        GameUtils: gameUtils.address,
      },
    });
    TestingAuxiliar = await ethers.getContractFactory("TestingAuxiliar");
  });

  beforeEach(async () => {
    //Contracts
    erc20BetToken = await upgrades.deployProxy(ERC20BetToken, {kind: "uups"});
    await erc20BetToken.deployed();
    gameFactory = await upgrades.deployProxy(
      GameFactory,
      [erc20BetToken.address, calc.address],
      {initializer: "initialize", unsafeAllowLinkedLibraries: true}
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

  it(`Should not fail with DoS costly loops`, async () => {
    //construct a array with a million bets
    const costlyBets = [];
    for (let i = 0; i < 10000; i++) {
      let b = null;
      if (i % 5 == 0) {
        b = bettorE;
      } else if (i % 4 == 0) {
        b = bettorD;
      } else if (i % 3 == 0) {
        b = bettorC;
      } else if (i % 2 == 0) {
        b = bettorB;
      } else {
        b = bettorA;
      }

      costlyBets.push({
        bettor: b,
        tokenAmount: BigNumber.from(10),
        score: {
          home: utils.getRandomBetween(0, 10),
          visitor: utils.getRandomBetween(0, 10),
        },
      });
    }
    //make bets
    console.log("Starting doing bets");
    await utils.makeBets(erc20BetToken, gameContract, owner, costlyBets);
    console.log("Bets done");
    //Closed for betting
    await gameContract.connect(owner).closeForBetting();
    //Finalize the game
    await gameContract.connect(owner).finalizeGame({home: 7, visitor: 7});
    // identify winner bets
    let identifyWinnersCount = 1;
    do {
      console.log(`Identify winners: `, identifyWinnersCount);
      identifyWinnersCount++;
    } while (false == (await gameContract.connect(owner).identifyWinners()));
    // Calc bet prizes
    let calcPrizesCount = 1;
    do {
      console.log(`Calculate prizes: `, calcPrizesCount);
      calcPrizesCount++;
    } while (false == (await gameContract.connect(owner).calcPrizes()));

    //stake value
    const sumStake = utils.sumBetsAmountBN(BETS);
    //prize value (total stake minus the administration commision fee)
    const prize = sumStake.sub(
      utils.calcPercentageBN(sumStake, utils.getCommissionPercentageBN())
    );
    //Verify calculated prizes
    const bets = await gameContract.listBets();
    for (let bet of bets) {
      if (bet.score.home == 7 && bet.score.visitor == 7) {
        expect(bet.result).to.be.equal(2);
      } else {
        expect(bet.result).to.not.be.equal(2);
        expect(bet.result).to.not.be.equal(0);
      }
    }
  });
});
