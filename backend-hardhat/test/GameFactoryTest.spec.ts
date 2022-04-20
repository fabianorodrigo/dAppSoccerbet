import {expect} from "chai";
import {Contract, ContractFactory, Signer, Transaction} from "ethers";
import {Result} from "ethers/lib/utils";
/**
 * When using JavaScript, all the properties in the HRE are injected into the global scope,
 * and are also available by getting the HRE explicitly. When using TypeScript nothing will
 * be available in the global scope and you will need to import everything explicitly.
 */
import {ethers, upgrades} from "hardhat";
import {TestUtils} from "./TestUtils";

const DATETIME_20220716_163000_IN_MINUTES =
  new Date(2022, 6, 16, 16, 30, 0, 0).getTime() / 1000;

let ERC20BetToken: ContractFactory,
  Calculator: ContractFactory,
  GameFactory: ContractFactory,
  Game: ContractFactory,
  TestingAuxiliar: ContractFactory,
  GameUtils: ContractFactory;
let erc20BetToken: Contract,
  calc: Contract,
  gameFactory: Contract,
  gameUtils: Contract;
const utils = new TestUtils();

describe("GameFactory", function () {
  let accounts: Signer[];
  let owner: Signer;
  let bettor: Signer;

  before(async () => {
    accounts = await ethers.getSigners();
    // The owner is gonna be sent by 1º account
    //When using the hardhat-ethers plugin ContractFactory and Contract instances are connected to the FIRST signer by default.
    owner = accounts[0];
    bettor = accounts[1];
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
    await gameFactory.deployed();
  });

  afterEach(async () => {
    if (await utils.isContract(gameFactory.address)) {
      //catching GameCreated event
      const filter = gameFactory.filters.GameCreated();
      const events = await gameFactory.queryFilter(filter);

      //since the owner of the games is the same owner of GameFactory,
      //not the GameFactory itself, its destroyContract function has
      //to be called by the owner
      for (const event of events) {
        const game = await Game.attach((event.args as Result).addressGame);
        await game.destroyContract();
      }
    }
    await erc20BetToken.destroyContract();
  });

  /**
   * NEWGAME
   */
  it(`Should create a new game`, async () => {
    const receipt = await createGame();
    expect(receipt).to.emit(gameFactory, "GameCreated").withArgs(
      "0x4ABEaCA4b05d8fA4CED09D26aD28Ea298E8afaC8", //"0x32467b43BFa67273FC7dDda0999Ee9A12F2AaA08", //constant address created by Waffle or Hardhat node
      "SÃO PAULO",
      "ATLÉTICO-MG",
      DATETIME_20220716_163000_IN_MINUTES
    );
  });

  async function createGame(): Promise<Transaction> {
    return await gameFactory.newGame(
      "SÃO PAULO",
      "ATLÉTICO-MG",
      DATETIME_20220716_163000_IN_MINUTES
    );
  }

  /**
   * LISTGAME
   */
  it(`Should catch events CreateGame`, async () => {
    await createGame();
    //catching GameCreated event
    const filter = gameFactory.filters.GameCreated();
    const games = await gameFactory.queryFilter(filter);

    expect(games).to.be.an("array");
    expect(games).to.have.lengthOf(1);
    const g = await Game.attach((games[0].args as Result).addressGame);
    expect(await g.open()).to.be.false;
    expect(await g.finalized()).to.be.false;
  });

  /**
   * SETCOMMISSION
   */
  it(`Should set commision fee for future created Games and emit event 'CommissionChanged'`, async () => {
    await createGame();
    expect(await gameFactory.getCommission()).to.be.equal(10);
    const setCommissionReceipt = await gameFactory
      .connect(owner)
      .setCommission(16);
    expect(setCommissionReceipt)
      .to.emit(gameFactory, "CommissionChanged")
      .withArgs(10, 16);
    expect(await gameFactory.getCommission()).to.be.equal(16);
  });

  it(`Should revert if someone different from owner try set commission`, async () => {
    await expect(gameFactory.connect(bettor).setCommission(16)).to.revertedWith(
      "Ownable: caller is not the owner"
    );
  });
});
