import {BigNumber} from "ethers";
import {ethers, upgrades, waffle} from "hardhat";
import {
  BetTokenFixture,
  CalculatorFixture,
  GameFactoryFixture,
  GameFixture,
} from "../shared/fixtures";
import {TestUtils} from "../shared/TestUtils";
import {Mocks, Signers} from "../shared/types";
import {shouldBuySomeToken} from "./BetToken/ShouldBuyToken.spec";
import {shouldDestroyBetTokenContract} from "./BetToken/ShouldDestroy.spec";
import {shouldExchange4Ethers} from "./BetToken/ShouldExchangeToken.spec";
import {shouldCalcPercentage} from "./Calculator/ShouldCalcPercentage.spec";
import {shouldBet} from "./Game/ShouldBet.spec";
import {shouldCalcPrizes} from "./Game/ShouldCalcPrizes.spec";
import {shouldClose} from "./Game/ShouldClose.spec";
import {shouldDestroyGameContract} from "./Game/ShouldDestroy.spec";
import {shouldFinalize} from "./Game/ShouldFinalize.spec";
import {shouldGetProperties} from "./Game/ShouldGetProperties.spec";
import {shouldIdentifyWinners} from "./Game/ShouldIdentifyWinners.spec";
import {shouldInitProperly} from "./Game/ShouldInitProperly.spec";
import {shouldOpen} from "./Game/ShouldOpen.spec";
import {shouldWithdrawPrize} from "./Game/ShouldWithdrawPrize.spec";
import {shouldCreatGame} from "./GameFactory/ShouldCreateGame.spec";
import {shouldSetCommission} from "./GameFactory/ShouldSetCommission.spec";

describe(`Integration tests`, async () => {
  // As we have part of contracts following UUPS pattern e GameFactory following Transparent Proxy pattern,
  // Upgrades emits a warning message for each test case: Warning: A proxy admin was previously deployed on this network
  // This makes excessive noise: https://forum.openzeppelin.com/t/what-is-warning-a-proxy-admin-was-previously-deployed-on-this-network/20501
  upgrades.silenceWarnings();

  let snapshot: any;

  before(async function () {
    const accounts = waffle.provider.getWallets();

    this.signers = {} as Signers;
    this.signers.owner = accounts[0];
    this.signers.bettorA = accounts[1];
    this.signers.bettorB = accounts[2];
    this.signers.bettorC = accounts[3];
    this.signers.bettorD = accounts[4];
    this.signers.bettorE = accounts[5];

    /**
     * This fixture just deploys our Greeter contract, but with a catch.
     * A snapshot of our blockchain is taken after running this fixture.
     * So afterwards with loadFixture we don't actually run time-intensive redeploments.
     *
     * Rather we simply load the previously stored snapshot of the blockchain.
     * This makes our runtimes significantly faster than using beforeEach.
     */
    this.loadFixture = waffle.createFixtureLoader(accounts);
    // try to workaround:  nonce has already been used NONCE_EXPIRED
    //snapshot = await waffle.provider.send("evm_snapshot", []);
  });

  after(async function () {
    // try to workaround:  nonce has already been used NONCE_EXPIRED
    //await waffle.provider.send("evm_revert", [snapshot]);
  });

  describe(`Bet Token`, async () => {
    beforeEach(async function () {
      const {betToken, mockUsdc} = await this.loadFixture(BetTokenFixture);

      this.betToken = betToken;

      this.mocks = {} as Mocks;
      this.mocks.mockUsdc = mockUsdc;
    });

    // the order of these functions affects the tests results
    // in spite of this.betToken.balanceOf(bettorA) is zero in the beforeEach
    // inside the shouldExchange4Ethers, it returns 1 when after shouldBuySomeToken
    shouldExchange4Ethers();

    shouldBuySomeToken();

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
