import {expect} from "chai";
import {ethers, waffle} from "hardhat";

export const shouldCalcPercentage = (): void => {
  //   // to silent warning for duplicate definition of Transfer event
  //   ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.OFF);

  context(`#calcPercentage`, async function () {
    it(`Should return 0 as 1% of numbers up to 99`, async function () {
      const percent = 1;
      //0
      expect(
        await this.calculator.calcPercentage(ethers.constants.Zero, percent)
      ).to.be.equal(ethers.constants.Zero);
      //99
      const amount99 = 99;
      expect(
        await this.calculator.calcPercentage(amount99, percent)
      ).to.be.equal(ethers.constants.Zero);
    });

    it(`Should return 1 as 1% of numbers between 100 and 199`, async function () {
      const percent = 1;
      //100
      const amount100 = 100;
      expect(
        await this.calculator.calcPercentage(amount100, percent)
      ).to.be.equal(ethers.constants.One);
      //199
      const amount199 = 199;
      expect(
        await this.calculator.calcPercentage(amount199, percent)
      ).to.be.equal(ethers.constants.One);
    });

    it(`Should return 100% of numbers`, async function () {
      const percent = 100;
      //0
      expect(
        await this.calculator.calcPercentage(ethers.constants.Zero, percent)
      ).to.be.equal(ethers.constants.Zero);
      //100
      expect(await this.calculator.calcPercentage(100, percent)).to.be.equal(
        100
      );
      //MAX_UINT256
      /* Phantom overflow. Depending review of Calculator.sol fullMul and mulDiv functions
      expect(
        await calc.calcPercentage(MAX_UINT256, percent)
      ).to.be.equal(MAX_UINT256);*/
    });
  });
};
