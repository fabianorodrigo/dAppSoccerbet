const {expect} = require("chai");
// Import utilities from Test Helpers
const {
  BN,
  constants,
  expectEvent,
  expectRevert,
} = require("@openzeppelin/test-helpers");
const {MAX_UINT256} = require("@openzeppelin/test-helpers/src/constants");

const Calculator = artifacts.require("Calculator");

contract("Calculator", (accounts) => {
  let calc = null;

  beforeEach(async function () {
    calc = await Calculator.new();
  });

  describe("fullMul", () => {
    it(`Should return a 'l' equal MAX_UINT256 and 'h' equal zero when the product is MAX_UINT256`, async () => {
      const y = new BN(1);
      //multiply
      const result = await calc.fullMul(constants.MAX_UINT256, y);
      expect(result.l).to.be.bignumber.equal(constants.MAX_UINT256);
      expect(result.h).to.be.bignumber.equal("0");
    });

    // it(`Should return a 'l' equal MAX_UINT256 and 'h' equal MAX_UINT256 when the multiply MAX_UINT256 by 2`, async () => {
    //   const y = new BN(2);
    //   //multiply
    //   const result = await calc.fullMul(constants.MAX_UINT256, y);
    //   expect(result.l).to.be.bignumber.equal(constants.MAX_UINT256);
    //   expect(result.h).to.be.bignumber.equal(constants.MAX_UINT256);
    // });
  });

  describe("mulDiv", () => {
    it(`Should return x * y when z equals 1`, async () => {
      const x = new BN(1200);
      const y = new BN(1000);
      //multiply
      const result = await calc.mulDiv(x, y, new BN(1));
      expect(result).to.be.bignumber.equal(new BN(1200000));
    });

    //TODO: not working on Solidity 0.8.x. Review
    // it(`Should return a third of x * y when z equals 3`, async () => {
    //   const y = new BN(1000);
    //   const EXPECTED_RESULT = new BN(
    //     "38597363079105400000000000000000000000000000000000000000000000000000000000000000"
    //   );

    //   //multiply
    //   const result = await calc.mulDiv(MAX_UINT256, y, new BN(3));
    //   expect(result).to.be.bignumber.equal(EXPECTED_RESULT);
    // });

    // it(`Should return a 'l' equal MAX_UINT256 and 'h' equal MAX_UINT256 when the multiply MAX_UINT256 by 2`, async () => {
    //   const y = new BN(2);
    //   //multiply
    //   const result = await calc.fullMul(constants.MAX_UINT256, y);
    //   expect(result.l).to.be.bignumber.equal(constants.MAX_UINT256);
    //   expect(result.h).to.be.bignumber.equal(constants.MAX_UINT256);
    // });
  });

  describe("calcPercentage", () => {
    it(`Should return 0 as 1% of numbers up to 99`, async () => {
      const percent = new BN(1);
      //0
      const amount0 = new BN(0);
      expect(await calc.calcPercentage(amount0, percent)).to.be.bignumber.equal(
        new BN(0)
      );
      //99
      const amount99 = new BN(99);
      expect(
        await calc.calcPercentage(amount99, percent)
      ).to.be.bignumber.equal(new BN(0));
    });

    it(`Should return 1 as 1% of numbers between 100 and 199`, async () => {
      const percent = new BN(1);
      //100
      const amount100 = new BN(100);
      expect(
        await calc.calcPercentage(amount100, percent)
      ).to.be.bignumber.equal(new BN(1));
      //199
      const amount199 = new BN(199);
      expect(
        await calc.calcPercentage(amount199, percent)
      ).to.be.bignumber.equal(new BN(1));
    });

    it(`Should return 100% of numbers`, async () => {
      const percent = new BN(100);
      //0
      expect(
        await calc.calcPercentage(new BN(0), percent)
      ).to.be.bignumber.equal(new BN(0));
      //100
      expect(
        await calc.calcPercentage(new BN(100), percent)
      ).to.be.bignumber.equal(new BN(100));
      //MAX_UINT256
      /* Phantom overflow. Depending review of Calculator.sol fullMul and mulDiv functions
      expect(
        await calc.calcPercentage(MAX_UINT256, percent)
      ).to.be.bignumber.equal(MAX_UINT256);*/
    });

    // Overflows. Depending review of Calculator.sol fullMul and mulDiv functions
    // it(`Should return percentages of MAX_UINT256`, async () => {
    //   //0%
    //   expect(
    //     await calc.calcPercentage(MAX_UINT256, new BN(0))
    //   ).to.be.bignumber.equal(new BN(0));
    //   //1%
    //   expect(
    //     await calc.calcPercentage(MAX_UINT256, new BN(1))
    //   ).to.be.bignumber.equal(
    //     "1157920892373160000000000000000000000000000000000000000000000000000000000000"
    //   );
    // });
  });
});
