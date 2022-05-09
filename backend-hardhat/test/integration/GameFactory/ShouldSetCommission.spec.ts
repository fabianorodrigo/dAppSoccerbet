import {expect} from "chai";
import {Transaction} from "ethers";
import {Result} from "ethers/lib/utils";
import {ethers} from "hardhat";

const DATETIME_20220716_163000_IN_MINUTES =
  new Date(2022, 6, 16, 16, 30, 0, 0).getTime() / 1000;

export const shouldSetCommission = (): void => {
  //   // to silent warning for duplicate definition of Transfer event
  //   ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.OFF);

  context(`#setCommission`, async function () {
    it(`Should set commision fee for future created Games and emit event 'CommissionChanged'`, async function () {
      await this.gameFactory.newGame(
        "SÃO PAULO",
        "ATLÉTICO-MG",
        DATETIME_20220716_163000_IN_MINUTES
      );
      expect(await this.gameFactory.getCommission()).to.be.equal(10);
      const setCommissionReceipt = await this.gameFactory
        .connect(this.signers.owner)
        .setCommission(16);
      expect(setCommissionReceipt)
        .to.emit(this.gameFactory, "CommissionChanged")
        .withArgs(10, 16);
      expect(await this.gameFactory.getCommission()).to.be.equal(16);
    });

    it(`Should revert if someone different from owner try set commission`, async function () {
      await expect(
        this.gameFactory.connect(this.signers.bettorA).setCommission(16)
      ).to.revertedWith("Ownable: caller is not the owner");
    });
  });
};
