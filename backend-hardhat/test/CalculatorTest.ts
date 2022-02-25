import {expect} from "chai";
import {Contract} from "ethers";
/**
 * When using JavaScript, all the properties in the HRE are injected into the global scope,
 * and are also available by getting the HRE explicitly. When using TypeScript nothing will
 * be available in the global scope and you will need to import everything explicitly.
 */
import {ethers} from "hardhat";

let Calculator;
let calc: Contract;

describe("Calculator", function () {
  before(async () => {
    //Contract
    Calculator = await ethers.getContractFactory("Calculator");
    calc = await Calculator.deploy();
    await calc.deployed();
  });

  describe("fullMul", () => {
    it(`Should return a 'l' equal MAX_UINT256 and 'h' equal zero when the product is MAX_UINT256`, async () => {
      const y = 1;
      //multiply
      const result = await calc.fullMul(ethers.constants.MaxUint256, y);
      expect(result.l).to.be.equal(ethers.constants.MaxUint256);
      expect(result.h).to.be.equal(ethers.constants.Zero);
    });
  });

  describe("mulDiv", () => {
    it(`Should return x * y when z equals 1`, async () => {
      const x = 1200;
      const y = 1000;
      //multiply
      const result = await calc.mulDiv(x, y, 1);
      expect(result).to.be.equal(1200000);
    });
  });

  describe("calcPercentage", () => {
    it(`Should return 0 as 1% of numbers up to 99`, async () => {
      const percent = 1;
      //0
      expect(
        await calc.calcPercentage(ethers.constants.Zero, percent)
      ).to.be.equal(ethers.constants.Zero);
      //99
      const amount99 = 99;
      expect(await calc.calcPercentage(amount99, percent)).to.be.equal(
        ethers.constants.Zero
      );
    });

    it(`Should return 1 as 1% of numbers between 100 and 199`, async () => {
      const percent = 1;
      //100
      const amount100 = 100;
      expect(await calc.calcPercentage(amount100, percent)).to.be.equal(
        ethers.constants.One
      );
      //199
      const amount199 = 199;
      expect(await calc.calcPercentage(amount199, percent)).to.be.equal(
        ethers.constants.One
      );
    });

    it(`Should return 100% of numbers`, async () => {
      const percent = 100;
      //0
      expect(
        await calc.calcPercentage(ethers.constants.Zero, percent)
      ).to.be.equal(ethers.constants.Zero);
      //100
      expect(await calc.calcPercentage(100, percent)).to.be.equal(100);
      //MAX_UINT256
      /* Phantom overflow. Depending review of Calculator.sol fullMul and mulDiv functions
      expect(
        await calc.calcPercentage(MAX_UINT256, percent)
      ).to.be.equal(MAX_UINT256);*/
    });

    // Overflows. Depending review of Calculator.sol fullMul and mulDiv functions
    // it(`Should return percentages of MAX_UINT256`, async () => {
    //   //0%
    //   expect(
    //     await calc.calcPercentage(MAX_UINT256, new BN(0))
    //   ).to.be.equal(new BN(0));
    //   //1%
    //   expect(
    //     await calc.calcPercentage(MAX_UINT256, new BN(1))
    //   ).to.be.equal(
    //     "1157920892373160000000000000000000000000000000000000000000000000000000000000"
    //   );
    // });
  });
});
