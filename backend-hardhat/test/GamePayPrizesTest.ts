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
  let bettorC: Signer;
  let bettorD: Signer;
  let bettorE: Signer;

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

  /**
   * PAYPRIZES
   */
  it(`Should pay 90% of stake to the winner bet`, async () => {
    //make bets
    await makeBets(gameContract, owner, BETS);
    //Closed for betting
    await gameContract.connect(owner).closeForBetting();
    //Finalize the game
    await gameContract.connect(owner).finalizeGame({home: 0, visitor: 3});
    //Pay prizes
    const sumStake = utils.sumBetsAmountBN(BETS);
    //prize value (total stake minus the administration commision fee)
    const prize = sumStake.sub(
      utils.calcPercentageBN(sumStake, utils.getCommissionPercentageBN())
    );
    for (let bet of BETS) {
      //the bettorE balance of bettokens should be equal 90% of all stake
      if (bet.bettor == bettorE) {
        expect(
          await erc20BetToken.balanceOf(await bet.bettor.getAddress())
        ).to.be.equal(prize);
      } else {
        expect(
          await erc20BetToken.balanceOf(await bet.bettor.getAddress())
        ).to.be.equal(ethers.constants.Zero);
      }
    }
  });

  it(`Should split proportionally 90% of stake to the winners bets`, async () => {
    //make bets
    await makeBets(gameContract, owner, BETS);
    //Closed for betting
    await gameContract.connect(owner).closeForBetting();
    //Finalize the game
    await gameContract.connect(owner).finalizeGame({home: 2, visitor: 2});
    //Pay prizes
    const sumStake = utils.sumBetsAmountBN(BETS);
    //prize value (total stake minus the administration commision fee)
    const prize = sumStake.sub(
      utils.calcPercentageBN(sumStake, utils.getCommissionPercentageBN())
    );

    for (let bet of BETS) {
      //90% of all stake should be proportionally splited between bettor and bettorB
      if (bet.bettor == bettorA || bet.bettor == bettorB) {
        expect(
          await erc20BetToken.balanceOf(await bet.bettor.getAddress())
        ).to.be.equal(
          prize
            .mul(bet.tokenAmount)
            .div(BETS[0].tokenAmount.add(BETS[1].tokenAmount))
        );
      } else {
        expect(
          await erc20BetToken.balanceOf(await bet.bettor.getAddress())
        ).to.be.equal(ethers.constants.Zero);
      }
    }
  });

  it(`Should refund 90% of stake to all bets if nobody matches the final score`, async () => {
    //make bets
    await makeBets(gameContract, owner, BETS);
    //Closed for betting
    await gameContract.connect(owner).closeForBetting();
    //Finalize the game
    await gameContract.connect(owner).finalizeGame({home: 7, visitor: 7});
    //stake value
    const sumStake = utils.sumBetsAmountBN(BETS);
    //prize value (total stake minus the administration commision fee)
    const prize = sumStake.sub(
      utils.calcPercentageBN(sumStake, utils.getCommissionPercentageBN())
    );
    //Verify payed prizes
    for (let bet of BETS) {
      //the balance of bettokens should be equal to amount proportional to the prize (90% of stake)
      expect(
        await erc20BetToken.balanceOf(await bet.bettor.getAddress())
      ).to.be.equal(prize.mul(bet.tokenAmount).div(sumStake));
    }
  });

  /**
   * Follow the process of buying Bettokens, aprove for GameContract and bet using the parameters informed
   *
   * @param {Game} gameContract Game contract where the bets will happen
   * @param {address} owner Owner of Game contract
   * @param {Array} bets Array of objects with 'bettorAddress', 'score' and 'tokenAmount' properties
   */
  async function makeBets(
    gameContract: Contract,
    owner: Signer,
    bets: BetDTO[]
  ) {
    let totalStake = ethers.constants.Zero;
    //Game is initially closed for betting
    await gameContract.connect(owner).openForBetting();

    for (let bet of bets) {
      ////////////////// BETTOR HAS TO BUY SOME BETTOKENS
      await bet.bettor.sendTransaction({
        to: erc20BetToken.address,
        value: bet.tokenAmount,
      });
      // The BetToken balances of the Game contract is the tokenAmount value of BetTokens
      expect(
        await erc20BetToken.balanceOf(await bet.bettor.getAddress())
      ).to.be.equal(bet.tokenAmount);

      //////////////// BETTOR ALLOWS {gameContract} SPENT THE VALUE OF THE BET IN HIS NAME
      await erc20BetToken
        .connect(bet.bettor)
        .approve(gameContract.address, bet.tokenAmount);
      //////////////// BETTOR MAKES A BET IN THE VALUE OF {betTokenAmount}
      await gameContract.connect(bet.bettor).bet(bet.score, bet.tokenAmount);
      //https://github.com/indutny/bn.js/
      //Prefix "i":  perform operation in-place, storing the result in the host
      //object (on which the method was invoked). Might be used to avoid number allocation costs
      totalStake = totalStake.add(bet.tokenAmount);
      // The BetToken balances of the Game contract is 0 BetTokens
      expect(
        await erc20BetToken.balanceOf(await bet.bettor.getAddress())
      ).to.be.equal(ethers.constants.Zero);
    }

    // The BETTOKEN balances of the Game contract is the sum of all bets
    expect(await erc20BetToken.balanceOf(gameContract.address)).to.be.equal(
      totalStake
    );
  }
});
