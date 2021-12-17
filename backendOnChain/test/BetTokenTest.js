const {expect} = require("chai");
// Import utilities from Test Helpers
const {BN, expectEvent, expectRevert} = require("@openzeppelin/test-helpers");

const BetToken = artifacts.require("BetToken");

contract("BetToken", (accounts) => {
  let trace = false;
  const owner = accounts[0];
  const gambler = accounts[1];

  let erc20BetToken = null;

  beforeEach(async function () {
    erc20BetToken = await BetToken.new({from: owner});
    if (trace) console.log("SUCCESS: BetToken.new({from: owner})");
  });

  it(`Should buy some tokens with Ether`, async () => {
    const quantity = new BN(1); //One wei => 1 Ether = 1 * 10^18 wei
    let receipt = await erc20BetToken.sendTransaction({
      from: gambler,
      value: quantity,
    });
    // Test for event
    expectEvent(receipt, "Received", {tokenBuyer: gambler, quantity: quantity});
    // test balance
    expect(await erc20BetToken.balanceOf(gambler)).to.be.bignumber.equal(
      quantity
    );
  });
});
