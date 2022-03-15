import {expect} from "chai";
import {Contract, ContractFactory, Signer, Transaction} from "ethers";
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
  TestingAuxiliar: ContractFactory;
let erc20BetToken: Contract, calc: Contract, gameFactory: Contract;
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
    gameFactory = await upgrades.deployProxy(
      GameFactory,
      [erc20BetToken.address, calc.address],
      {initializer: "initialize"}
    );
    await gameFactory.deployed();
  });

  afterEach(async () => {
    if (await utils.isContract(gameFactory.address)) {
      const games = await gameFactory.listGames();
      //since the owner of the games is the same owner of GameFactory,
      //not the GameFactory itself, its destroyContract function has
      //to be called by the owner
      for (const gameDTO of games) {
        const game = await Game.attach(gameDTO.addressGame);
        await game.destroyContract();
      }
      await gameFactory.destroyContract(); //, gasLimit: 500000});
    }
    await erc20BetToken.destroyContract();
  });

  /**
   * NEWGAME
   */
  it(`Should create a new game`, async () => {
    const receipt = await createGame();
    expect(receipt).to.emit(gameFactory, "GameCreated").withArgs(
      "0x8dAF17A20c9DBA35f005b6324F493785D239719d", //constant address created by Waffle or Hardhat node
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
  it(`Should list games`, async () => {
    await createGame();
    const games = await gameFactory.listGames();
    expect(games).to.be.an("array");
    expect(games).to.have.lengthOf(1);
    const g = await Game.attach(games[0].addressGame);
    expect(await g.open()).to.be.false;
    expect(await g.finalized()).to.be.false;
  });

  /**
   * SETCOMMISSION
   */
  it(`Should set commision fee for future created Games`, async () => {
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

  /**
   * DESTROYCONTRACT
   */
  it(`Should eventual Ether balance of GameFactory contract be sent to the owner`, async () => {
    const weiAmount = ethers.utils.parseEther("1.0");
    //Create a instance of TestingAuxiliar with some Ether and setting the Game contract as
    //the destination of it's remaining Ether after selfDestruct
    const testingAuxiliar = await TestingAuxiliar.deploy(gameFactory.address, {
      value: weiAmount,
    });
    expect(await testingAuxiliar.selfDestructRecipient()).to.be.equal(
      gameFactory.address
    );
    //game contract balance should be ZERO
    expect(await ethers.provider.getBalance(gameFactory.address)).to.be.equal(
      ethers.constants.Zero
    );

    // The ETHER balance of the new TestingAuxiliar contract has to be 1 Ether
    expect(
      await ethers.provider.getBalance(testingAuxiliar.address)
    ).to.be.equal(weiAmount);
    // Destructing the testingAuxiliar should send it's Ethers to Game contract
    await testingAuxiliar.destroyContract();
    expect(await ethers.provider.getBalance(gameFactory.address)).to.be.equal(
      weiAmount
    );
    // Destructing the Game contract should send it's Ethers to owner
    const ownerBalance = await ethers.provider.getBalance(
      await owner.getAddress()
    );
    await gameFactory.connect(owner).destroyContract();
    const ownerBalancePostDestruct = await ethers.provider.getBalance(
      await owner.getAddress()
    );
    //Owner's balance post Game destruction is greater because of the transfer of funds
    expect(ownerBalancePostDestruct.gt(ownerBalance)).to.be.true;
  });

  it(`Should revert if someone different from owner try destroy contract`, async () => {
    await expect(gameFactory.connect(bettor).destroyContract()).to.revertedWith(
      "Ownable: caller is not the owner"
    );
  });
  it(`Should revert if sending Ether to the contract`, async () => {
    const weiAmount = ethers.utils.parseEther("1.0");
    expect(bettor.sendTransaction({to: gameFactory.address, value: weiAmount}))
      .to.reverted;
  });
});
