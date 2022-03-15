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

describe("Game Prize Withdraw", function () {
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
    //make bets
    await utils.makeBets(erc20BetToken, gameContract, owner, BETS);
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
   * WITHDRAW PRIZES
   */
  it(`Should revert if an inexistent bet index is informed`, async () => {
    await expect(
      gameContract.connect(bettorA).withdrawPrize(5)
    ).to.revertedWith("_betIndex invalid");
  });

  it(`Should revert if try to withdraw the prize of a bet with unknown result`, async () => {
    await expect(
      gameContract.connect(bettorA).withdrawPrize(0)
    ).to.revertedWith(
      "Without result, loser or already paid bets have no prize to be withdrawn"
    );
  });

  it(`Should revert if try to withdraw the prize of a loser bet`, async () => {
    //Closed for betting
    await gameContract.connect(owner).closeForBetting();
    //Finalize the game
    await gameContract.connect(owner).finalizeGame({home: 0, visitor: 1});
    await expect(
      gameContract.connect(bettorE).withdrawPrize(4)
    ).to.revertedWith(
      "Without result, loser or already paid bets have no prize to be withdrawn"
    );
  });

  it(`Should revert if try to withdraw the prize of already paid bet`, async () => {
    //Closed for betting
    await gameContract.connect(owner).closeForBetting();
    //Finalize the game
    await gameContract.connect(owner).finalizeGame({home: 0, visitor: 3});
    // pay once
    await gameContract.connect(bettorE).withdrawPrize(4);
    // pay twice
    await expect(
      gameContract.connect(bettorE).withdrawPrize(4)
    ).to.revertedWith(
      "Without result, loser or already paid bets have no prize to be withdrawn"
    );
  });

  it(`Should revert if an account different from the bet's bettor is trying to withdraw the prize`, async () => {
    //Closed for betting
    await gameContract.connect(owner).closeForBetting();
    //Finalize the game
    await gameContract.connect(owner).finalizeGame({home: 0, visitor: 3});
    await expect(
      gameContract.connect(bettorA).withdrawPrize(4)
    ).to.revertedWith("The prize can be withdrawn just by the bet's bettor");
  });

  it(`Should withdraw 90% of stake to the winner bet`, async () => {
    //Closed for betting
    await gameContract.connect(owner).closeForBetting();
    //Finalize the game
    await gameContract.connect(owner).finalizeGame({home: 0, visitor: 3});
    //Withdraw prizes
    const sumStake = utils.sumBetsAmountBN(BETS);
    //prize value (total stake minus the administration commision fee)
    const prize = sumStake.sub(
      utils.calcPercentageBN(sumStake, utils.getCommissionPercentageBN())
    );
    await gameContract.connect(bettorE).withdrawPrize(4);
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
    //Closed for betting
    await gameContract.connect(owner).closeForBetting();
    //Finalize the game
    await gameContract.connect(owner).finalizeGame({home: 2, visitor: 2});
    //withdraw prizes
    const sumStake = utils.sumBetsAmountBN(BETS);
    //prize value (total stake minus the administration commision fee)
    const prize = sumStake.sub(
      utils.calcPercentageBN(sumStake, utils.getCommissionPercentageBN())
    );
    //bettorA withdraw
    await gameContract.connect(bettorA).withdrawPrize(0);
    //bettorB withdraw
    await gameContract.connect(bettorB).withdrawPrize(1);

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
    //TODO: ENTÃO ... NESSE CENÁRIO SEM VENCEDORES, SACA-SE 90%
    //bettors withdraws
    await gameContract.connect(bettorA).withdrawPrize(0);
    await gameContract.connect(bettorB).withdrawPrize(1);
    await gameContract.connect(bettorC).withdrawPrize(2);
    await gameContract.connect(bettorD).withdrawPrize(3);
    await gameContract.connect(bettorE).withdrawPrize(4);
    //Verify withdraw prizes
    for (let bet of BETS) {
      //the balance of bettokens should be equal to amount proportional to the prize (90% of stake)
      expect(
        await erc20BetToken.balanceOf(await bet.bettor.getAddress())
      ).to.be.equal(prize.mul(bet.tokenAmount).div(sumStake));
    }
  });
});
