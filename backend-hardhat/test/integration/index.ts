import {BigNumber, Contract, Signer} from "ethers";
import {upgrades, waffle} from "hardhat";
import {BetTokenUpgradeable, Game} from "../../typechain-types";
import {
  BetTokenFixture,
  CalculatorFixture,
  GameFactoryFixture,
  GameFixture,
} from "../shared/fixtures";
import {Mocks, Signers} from "../shared/types";
import {TestUtils} from "../shared/TestUtils";
import {shouldBuySomeToken} from "./BetToken/ShouldBuyToken.spec";
import {shouldDestroyBetTokenContract} from "./BetToken/ShouldDestroy.spec";
import {shouldExchange4Ethers} from "./BetToken/ShouldExchangeToken.spec";
import {shouldCalcPercentage} from "./Calculator/ShouldCalcPercentage.spec";
import {shouldBet} from "./Game/ShouldBet.spec";
import {shouldClose} from "./Game/ShouldClose.spec";
import {shouldDestroyGameContract} from "./Game/ShouldDestroy.spec";
import {shouldFinalize} from "./Game/ShouldFinalize.spec";
import {shouldGetProperties} from "./Game/ShouldGetProperties.spec";
import {shouldOpen} from "./Game/ShouldOpen.spec";
import {shouldCreatGame} from "./GameFactory/ShouldCreateGame.spec";
import {shouldSetCommission} from "./GameFactory/ShouldSetCommission.spec";
import {shouldWithdrawPrize} from "./Game/ShouldWithdrawPrize.spec";
import {shouldInitProperly} from "./Game/ShouldInitProperly.spec";
import {shouldCalcPrizes} from "./Game/ShouldCalcPrizes.spec";
import {shouldIdentifyWinners} from "./Game/ShouldIdentifyWinners.spec";

describe(`Integration tests`, async () => {
  // As we have part of contracts following UUPS pattern e GameFactory following Transparent Proxy pattern,
  // Upgrades emits a warning message for each test case: Warning: A proxy admin was previously deployed on this network
  // This makes excessive noise: https://forum.openzeppelin.com/t/what-is-warning-a-proxy-admin-was-previously-deployed-on-this-network/20501
  upgrades.silenceWarnings();

  before(async function () {
    const accounts = waffle.provider.getWallets();

    this.signers = {} as Signers;
    this.signers.owner = accounts[0];
    this.signers.bettorA = accounts[1];
    this.signers.bettorB = accounts[2];
    this.signers.bettorC = accounts[3];
    this.signers.bettorD = accounts[4];
    this.signers.bettorE = accounts[5];

    this.loadFixture = waffle.createFixtureLoader(accounts);
  });

  describe(`Bet Token`, async () => {
    beforeEach(async function () {
      const {betToken, mockUsdc} = await this.loadFixture(BetTokenFixture);

      this.betToken = betToken;

      this.mocks = {} as Mocks;
      this.mocks.mockUsdc = mockUsdc;
    });

    shouldBuySomeToken();

    shouldExchange4Ethers();

    shouldDestroyBetTokenContract();
  });

  describe(`Calculator`, async () => {
    beforeEach(async function () {
      const {calculator} = await this.loadFixture(CalculatorFixture);

      this.calculator = calculator;
    });

    shouldCalcPercentage();
  });

  describe(`GameFactory`, async () => {
    beforeEach(async function () {
      const {gameFactory} = await this.loadFixture(GameFactoryFixture);

      this.gameFactory = gameFactory;
    });

    shouldCreatGame();

    shouldSetCommission();
  });

  describe(`Game`, async () => {
    beforeEach(async function () {
      const {game, betToken, gameFactory, testingAuxiliar, BETS} =
        await this.loadFixture(GameFixture);

      this.game = game;
      this.gameFactory = gameFactory;
      this.betToken = betToken;
      this.testingAuxiliar = testingAuxiliar;
      this.BETS = BETS;
      this.utils = new TestUtils();
    });

    shouldInitProperly();

    describe(`#GetProperties`, async function () {
      beforeEach(async function () {
        const betTokenAmountA = BigNumber.from(1004);
        const betTokenAmountB = BigNumber.from(1979);
        //make bets
        const scoreA = {home: 3, visitor: 1};
        const scoreB = {home: 2, visitor: 2};
        await this.utils.makeBets(
          this.betToken,
          this.game,
          this.signers.owner,
          [
            {
              bettor: this.signers.bettorA,
              tokenAmount: betTokenAmountA,
              score: scoreA,
            },
            {
              bettor: this.signers.bettorB,
              tokenAmount: betTokenAmountB,
              score: scoreB,
            },
          ]
        );
      });
      shouldGetProperties();
    });

    shouldOpen();
    shouldBet();
    shouldClose();
    shouldFinalize();
    shouldIdentifyWinners();
    shouldCalcPrizes();
    shouldWithdrawPrize();
    shouldDestroyGameContract();
  });
});
