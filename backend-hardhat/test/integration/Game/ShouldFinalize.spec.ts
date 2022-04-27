import {expect} from "chai";
import {ethers} from "ethers";

const DATETIME_20220716_170000_IN_MINUTES =
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
          DATETIME_20220716_170000_IN_MINUTES,
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

    it(`Should revert if someone different from owner try finalize a game`, async function () {
      const score = {home: "3", visitor: "1"};
      await expect(
        this.game.connect(this.signers.bettorA).finalizeGame(score)
      ).to.revertedWith("Ownable: caller is not the owner");
    });
  });
};
