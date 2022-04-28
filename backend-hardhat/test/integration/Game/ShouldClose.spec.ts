import {expect} from "chai";
import {ethers} from "hardhat";
import {Game, Game__factory} from "../../../typechain-types";

const DATETIME_20220716_170000_IN_SECONDS =
  new Date(2022, 6, 16, 17, 0, 0, 0).getTime() / 1000;

export const shouldClose = (): void => {
  //   // to silent warning for duplicate definition of Transfer event
  //   ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.OFF);

  context(`#close`, async function () {
    it(`Should close open game for betting and emit event 'GameClosed'`, async function () {
      //Game is initially closed for betting
      await this.game.connect(this.signers.owner).openForBetting();
      const receiptClose = await this.game
        .connect(this.signers.owner)
        .closeForBetting();
      expect(await this.game.open()).to.be.false;
      expect(receiptClose)
        .to.emit(this.game, "GameClosed")
        .withArgs(
          this.game.address,
          "SÃO PAULO",
          "ATLÉTICO-MG",
          DATETIME_20220716_170000_IN_SECONDS
        );
    });

    it(`Should revert if try close for betting an closed game`, async function () {
      //Game is initially closed for betting
      expect(
        this.game.connect(this.signers.owner).closeForBetting()
      ).to.revertedWith("GameNotOpen()");
    });

    it(`Should revert if someone different from owner try close a game for betting before it has begun`, async function () {
      await this.game.connect(this.signers.owner).openForBetting();
      //Game created for tests starts in 30 minutes and it`s free to anyone close it 15 minutes later,
      // so we move the blockchain ahead of time only 44 minutes and wont be possible to the bettorA close it
      await this.utils.moveTime(44 * 60);

      await expect(
        this.game.connect(this.signers.bettorA).closeForBetting()
      ).to.revertedWith("onlyOwnerORgameAlreadyBegun()");
    });

    it(`Should close open game for betting and emit event 'GameClosed' if the game has already begun even if it's not the owner`, async function () {
      //Game is initially closed for betting
      await this.game.connect(this.signers.owner).openForBetting();

      //Game created for tests starts in 30 minutes and it`s free to anyone close it 15 minutes later,
      // so we move the blockchain ahead of time 46 minutes and it`s gonna be possible to the bettorE close it
      await this.utils.moveTime(46 * 60);

      const receiptClose = await this.game
        .connect(this.signers.bettorE)
        .closeForBetting();
      expect(await this.game.open()).to.be.false;
      expect(receiptClose)
        .to.emit(this.game, "GameClosed")
        .withArgs(
          this.game.address,
          "SÃO PAULO",
          "ATLÉTICO-MG",
          DATETIME_20220716_170000_IN_SECONDS
        );
    });

    it(`Should revert if try to call CLOSE direct to the implementation contract is spite of the minimal proxy`, async function () {
      const implementationAddress =
        await this.gameFactory.getGameImplementation();
      const gameFactory: Game__factory = await ethers.getContractFactory(
        `Game`
      );
      const game: Game = gameFactory.attach(implementationAddress);

      await expect(
        game.connect(this.signers.owner).closeForBetting()
      ).to.be.revertedWith("Function must be called through delegatecall");
    });
  });
};
