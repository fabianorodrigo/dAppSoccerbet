import {expect} from "chai";

const DATETIME_20220716_170000_IN_MINUTES =
  new Date(2022, 6, 16, 17, 0, 0, 0).getTime() / 1000;

export const shouldOpen = (): void => {
  //   // to silent warning for duplicate definition of Transfer event
  //   ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.OFF);

  context(`#open`, async function () {
    it(`Should open closed game for betting and emit event 'GameOpened'`, async function () {
      //Game is initially closed for betting
      const receiptOpen = await this.game
        .connect(this.signers.owner)
        .openForBetting();
      expect(await this.game.open()).to.be.true;
      expect(receiptOpen)
        .to.emit(this.game, "GameOpened")
        .withArgs(
          this.game.address,
          "SÃO PAULO",
          "ATLÉTICO-MG",
          DATETIME_20220716_170000_IN_MINUTES
        );
    });

    it(`Should revert when try open for betting an already open game`, async function () {
      //Game is initially closed for betting
      await this.game.connect(this.signers.owner).openForBetting();
      await expect(
        this.game.connect(this.signers.owner).openForBetting()
      ).to.revertedWith("GameNotClosed()");
    });

    it(`Should revert if someone different from owner try open a game for betting`, async function () {
      await expect(
        this.game.connect(this.signers.bettorA).openForBetting()
      ).to.revertedWith("Ownable: caller is not the owner");
    });
  });
};
