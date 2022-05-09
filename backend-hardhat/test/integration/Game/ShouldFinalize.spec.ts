import {expect} from "chai";
import {ethers} from "hardhat";
import {Game, Game__factory} from "../../../typechain-types";

const DATETIME_20220716_170000_IN_SECONDS =
  new Date(2022, 6, 16, 17, 0, 0, 0).getTime() / 1000;

export const shouldFinalize = (): void => {
  //   // to silent warning for duplicate definition of Transfer event
  //   ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.OFF);

  context(`#finalize`, async function () {
    it(`Should finalize a closed game and emit event 'GameFinalized'`, async function () {
      const score = {home: 3, visitor: 1};
      const receiptFinalize = await this.game
        .connect(this.signers.owner)
        .finalizeGame(score);
      expect(await this.game.open()).to.be.false;
      expect(await this.game.finalized()).to.be.true;
      const finalScore = await this.game.finalScore();
      expect(finalScore.home).to.be.equal(score.home);
      expect(finalScore.visitor).to.be.equal(score.visitor);
      expect(receiptFinalize)
        .to.emit(this.game, "GameFinalized")
        .withArgs(
          this.game.address,
          "SÃO PAULO",
          "ATLÉTICO-MG",
          DATETIME_20220716_170000_IN_SECONDS,
          ethers.constants.Zero,
          [score.home, score.visitor]
        );
    });

    it(`Should revert if try to finalize an open game`, async function () {
      const score = {home: "3", visitor: "1"};
      //Game is initially closed for betting
      await this.game.connect(this.signers.owner).openForBetting();
      await expect(
        this.game.connect(this.signers.owner).finalizeGame(score)
      ).to.revertedWith("GameNotClosed()");
      expect(await this.game.finalized()).to.be.false;
      const finalScore = await this.game.finalScore();
      expect(finalScore.home).to.be.equal(ethers.constants.Zero);
      expect(finalScore.visitor).to.be.equal(ethers.constants.Zero);
    });

    it(`Should revert if try to finalize an already finalized game`, async function () {
      const score = {home: "3", visitor: "1"};
      await this.game.connect(this.signers.owner).finalizeGame(score);
      await expect(
        this.game.connect(this.signers.owner).finalizeGame(score)
      ).to.revertedWith("GameAlreadyFinalized()");
    });
    it(`Should not be allowed someone different from owner finalize a game before has passed 48 hours of it's starting time`, async function () {
      //Game created for tests starts in 30 minutes and it`s free to anyone finalize it 48 hours later,
      // so we move the blockchain ahead of time only 47 hours and 31 minutes and wont be possible to the bettorA finalize it
      await this.utils.moveTime(47 * 60 * 60 + 89 * 60);
      //after moveTime, is necessary to mine a block to have the advanced timetamp
      //so , we create a game just to have a new block
      await this.gameFactory
        .connect(this.signers.owner)
        .newGame(
          "CRUZEIRO",
          "AMÉRICA-MG",
          Math.floor(new Date().getTime() / 1000) + 10 * 60
        );

      expect(
        await this.game.connect(this.signers.bettorA).canFinalize()
      ).to.be.equal(false);
    });
    it(`Should revert if someone different from owner try finalize a game before passed 48 hours from game starting time`, async function () {
      const score = {home: "3", visitor: "1"};
      //Game created for tests starts in 30 minutes and it`s free to anyone finish it 48 hours later,
      // so we move the blockchain ahead of time only 47 hours and 59 minutes and wont be possible to the bettorA close it
      await this.utils.moveTime(47 * 60 * 60 + 89 * 60);

      await expect(
        this.game.connect(this.signers.bettorA).finalizeGame(score)
      ).to.revertedWith("onlyOwnerORgameAlreadyFinished()");
    });
    it(`Should be allowed someone different from owner finalize a game for betting 48 after it has begun`, async function () {
      console.log(`game.datetime`, await this.game.datetimeGame());
      //Game created for tests starts in 30 minutes and it`s free to anyone finalize it 48 hours later,
      // so we move the blockchain ahead of time 48 hours and 31 minutes and should be possible to the bettorA close it
      await this.utils.moveTime(48 * 60 * 60 + 31 * 60);
      //after moveTime, is necessary to mine a block to have the advanced timetamp
      //so , we create a game just to have a new block
      await this.gameFactory
        .connect(this.signers.owner)
        .newGame(
          "CRUZEIRO",
          "AMÉRICA-MG",
          Math.floor(new Date().getTime() / 1000) + 10 * 60
        );

      const canFinalize = await this.game
        .connect(this.signers.bettorA)
        .canFinalize();

      expect(canFinalize).to.be.true;
    });

    it(`Should finalize a closed game and emit event 'GameFinalized' if has passed 48 hours of game starting time even if it's not the owner`, async function () {
      const score = {home: 3, visitor: 1};
      //Game created for tests starts in 30 minutes and it`s free to anyone finalize it 48 hours later,
      // so we move the blockchain ahead of time 48 hours and 31 minutes and should be possible to the bettorA close it
      await this.utils.moveTime(48 * 60 * 60 + 31 * 60);

      const receiptFinalize = await this.game
        .connect(this.signers.bettorE)
        .finalizeGame(score);
      expect(await this.game.open()).to.be.false;
      expect(await this.game.finalized()).to.be.true;
      const finalScore = await this.game.finalScore();
      expect(finalScore.home).to.be.equal(score.home);
      expect(finalScore.visitor).to.be.equal(score.visitor);
      expect(receiptFinalize)
        .to.emit(this.game, "GameFinalized")
        .withArgs(
          this.game.address,
          "SÃO PAULO",
          "ATLÉTICO-MG",
          DATETIME_20220716_170000_IN_SECONDS,
          ethers.constants.Zero,
          [score.home, score.visitor]
        );
    });

    it(`Should revert if try to call FINALIZE direct to the implementation contract is spite of the minimal proxy`, async function () {
      const score = {home: 3, visitor: 1};
      const implementationAddress =
        await this.gameFactory.getGameImplementation();

      const gameFactory: Game__factory = await ethers.getContractFactory(
        `Game`
      );
      const game: Game = gameFactory.attach(implementationAddress);

      await expect(
        game.connect(this.signers.owner).finalizeGame(score)
      ).to.be.revertedWith("NotDelegateCall()");
    });
  });
};
