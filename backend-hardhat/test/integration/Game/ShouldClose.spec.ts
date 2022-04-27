import {expect} from "chai";

const DATETIME_20220716_170000_IN_MINUTES =
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
          DATETIME_20220716_170000_IN_MINUTES
        );
    });

    it(`Should revert if try close for betting an closed game`, async function () {
      //Game is initially closed for betting
      expect(
        this.game.connect(this.signers.owner).closeForBetting()
      ).to.revertedWith("GameNotOpen()");
    });

    it(`Should revert if someone different from owner try close a game for betting`, async function () {
      await expect(
        this.game.connect(this.signers.bettorA).closeForBetting()
      ).to.revertedWith("Ownable: caller is not the owner");
    });
  });
};
