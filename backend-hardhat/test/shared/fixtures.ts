import {Fixture, MockContract} from "ethereum-waffle";
import {BigNumber, ContractFactory, Wallet} from "ethers";
import {Result} from "ethers/lib/utils";
import {ethers, upgrades} from "hardhat";
import {
  BetTokenUpgradeable,
  CalculatorUpgradeable,
  Game,
  GameFactoryUpgradeable,
  TestingAuxiliar,
} from "../../typechain-types";
import {deployMockUsdc} from "./mocks";

type BetFixtureType = {
  bettor: Wallet;
  tokenAmount: BigNumber;
  score: {home: number; visitor: number};
};

type IntegrationBetTokenFixtureType = {
  betToken: BetTokenUpgradeable;
  mockUsdc: MockContract;
};

type IntegrationCalculatorFixtureType = {
  calculator: CalculatorUpgradeable;
};

type IntegrationGameFactoryFixtureType = {
  gameFactory: GameFactoryUpgradeable;
};

type IntegrationGameFixtureType = {
  game: Game;
  betToken: BetTokenUpgradeable;
  gameFactory: GameFactoryUpgradeable;
  testingAuxiliar: TestingAuxiliar;
  BETS: BetFixtureType[];
};

export const BetTokenFixture: Fixture<IntegrationBetTokenFixtureType> = async (
  signers: Wallet[]
) => {
  const deployer: Wallet = signers[0];

  const betTokenFactory: ContractFactory = await ethers.getContractFactory(
    `BetTokenUpgradeable`
  );
  const betToken = (await upgrades.deployProxy(betTokenFactory, {
    kind: "uups",
  })) as BetTokenUpgradeable;
  await betToken.deployed();

  const mockUsdc = await deployMockUsdc(deployer);

  return {betToken: betToken, mockUsdc};
};

export const CalculatorFixture: Fixture<
  IntegrationCalculatorFixtureType
> = async (signers: Wallet[]) => {
  const calculatorFactory: ContractFactory = await ethers.getContractFactory(
    `CalculatorUpgradeable`
  );
  const calculator = (await upgrades.deployProxy(calculatorFactory, {
    kind: "uups",
  })) as CalculatorUpgradeable;
  await calculator.deployed();

  return {calculator: calculator};
};

export const GameFactoryFixture: Fixture<
  IntegrationGameFactoryFixtureType
> = async (signers: Wallet[]) => {
  // Bet Token
  const betTokenFactory: ContractFactory = await ethers.getContractFactory(
    `BetTokenUpgradeable`
  );
  const betToken = (await upgrades.deployProxy(betTokenFactory, {
    kind: "uups",
  })) as BetTokenUpgradeable;
  await betToken.deployed();

  // Calculator
  const calculatorFactory: ContractFactory = await ethers.getContractFactory(
    `CalculatorUpgradeable`
  );
  const calculator = (await upgrades.deployProxy(calculatorFactory, {
    kind: "uups",
  })) as CalculatorUpgradeable;
  await calculator.deployed();

  const gameFactoryFactory = await ethers.getContractFactory(
    "GameFactoryUpgradeable"
  );
  // The @openzeppelin/utils/Address, used on setGameImplementation function, has delegateCall,
  // then we need to include the 'unsafeAllow'. However, we made a restriction to setGameImplemention
  // be called only throgh proxy
  const gameFactory = (await upgrades.deployProxy(
    gameFactoryFactory,
    [betToken.address, calculator.address],
    {
      initializer: "initialize",
      unsafeAllow: ["delegatecall"],
    }
  )) as GameFactoryUpgradeable;
  await gameFactory.deployed();

  return {gameFactory};
};

export const GameFixture: Fixture<IntegrationGameFixtureType> = async (
  signers: Wallet[]
) => {
  const owner: Wallet = signers[0];
  // Bet Token
  const betTokenFactory: ContractFactory = await ethers.getContractFactory(
    `BetTokenUpgradeable`
  );
  const betToken = (await upgrades.deployProxy(betTokenFactory, {
    kind: "uups",
  })) as BetTokenUpgradeable;
  await betToken.deployed();

  // Calculator
  const calculatorFactory: ContractFactory = await ethers.getContractFactory(
    `CalculatorUpgradeable`
  );
  const calculator = (await upgrades.deployProxy(calculatorFactory, {
    kind: "uups",
  })) as CalculatorUpgradeable;
  await calculator.deployed();

  const gameFactoryFactory = await ethers.getContractFactory(
    "GameFactoryUpgradeable"
  );
  // The @openzeppelin/utils/Address, used on setGameImplementation function, has delegateCall,
  // then we need to include the 'unsafeAllow'. However, we made a restriction to setGameImplemention
  // be called only throgh proxy
  const gameFactory = (await upgrades.deployProxy(
    gameFactoryFactory,
    [betToken.address, calculator.address],
    {
      initializer: "initialize",
      unsafeAllow: ["delegatecall"],
    }
  )) as GameFactoryUpgradeable;
  await gameFactory.deployed();

  // Game
  const GameFactory = await ethers.getContractFactory("Game");
  const DATETIME_20220716_170000_IN_MINUTES =
    new Date(2022, 6, 16, 17, 0, 0, 0).getTime() / 1000;
  await gameFactory
    .connect(owner)
    .newGame("SÃO PAULO", "ATLÉTICO-MG", DATETIME_20220716_170000_IN_MINUTES);
  //catching GameCreated event
  const filter = gameFactory.filters.GameCreated();
  const events = await gameFactory.queryFilter(filter);

  const game = GameFactory.attach((events[0].args as Result).addressGame);

  const TestingAuxiliarFactory = await ethers.getContractFactory(
    "TestingAuxiliar"
  );
  const weiAmount = ethers.utils.parseEther("1.0");
  //Create a instance of TestingAuxiliar with some Ether and setting the Game contract as
  //the destination of it's remaining Ether after selfDestruct
  const testingAuxiliar = (await TestingAuxiliarFactory.deploy(game.address, {
    value: weiAmount,
  })) as TestingAuxiliar;

  //BETS
  const BETS: BetFixtureType[] = [
    {
      bettor: signers[1],
      tokenAmount: BigNumber.from(100),
      score: {home: 2, visitor: 2},
    },
    {
      bettor: signers[2],
      tokenAmount: BigNumber.from(1000),
      score: {home: 2, visitor: 2},
    },
    {
      bettor: signers[3],
      tokenAmount: BigNumber.from(10),
      score: {home: 1, visitor: 0},
    },
    {
      bettor: signers[4],
      tokenAmount: BigNumber.from(600),
      score: {home: 0, visitor: 1},
    },
    {
      bettor: signers[5],
      tokenAmount: BigNumber.from(215),
      score: {home: 0, visitor: 3},
    },
  ];

  return {game, betToken, gameFactory, testingAuxiliar, BETS};
};
