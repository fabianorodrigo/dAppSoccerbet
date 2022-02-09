const {expect} = require("chai");
// Import utilities from Test Helpers
const {BN, expectEvent, expectRevert} = require("@openzeppelin/test-helpers");

const BetToken = artifacts.require("BetToken");

contract("BetToken", (accounts) => {
  let trace = false;
  // The owner is gonna be sent by 7º Ganache account
  const owner = accounts[6];
  const bettor = accounts[1];

  let erc20BetToken = null;

  beforeEach(async function () {
    erc20BetToken = await BetToken.new({from: owner});
    if (trace) console.log("SUCCESS: BetToken.new({from: owner})");
  });

  it(`Should buy some tokens with Ether`, async () => {
    //One wei => 1 Ether = 1 * 10^18 wei
    const weiAmount = new BN(1);
    //contract ERC20 Ether balance
    const erc20BalanceETH = await web3.eth.getBalance(erc20BetToken.address);
    let receipt = await buyOneWeiOfTokens(weiAmount);
    // Test for event
    expectEvent(receipt, "TokenMinted", {
      tokenBuyer: bettor,
      quantity: weiAmount,
    });
    // test balance of tokens
    expect(await erc20BetToken.balanceOf(bettor)).to.be.bignumber.equal(
      weiAmount
    );
    // test balance of Ether of the contract ERC20
    expect(
      await web3.eth.getBalance(erc20BetToken.address)
    ).to.be.bignumber.equal(erc20BalanceETH + weiAmount);
  });

  /**
   * @notice Buys tokens with the amount of WEI with the bettor account
   *
   * @param {BN} weiAmountBN Amount of WEI in BN (BigNumber)
   * @returns Receipt of transaction
   */
  async function buyOneWeiOfTokens(weiAmountBN) {
    //One wei => 1 Ether = 1 * 10^18 wei
    return await erc20BetToken.sendTransaction({
      from: bettor,
      value: weiAmountBN,
    });
  }

  it(`Should revert if someone different from owner try destroy contract`, async () => {
    expectRevert(
      erc20BetToken.destroyContract({from: bettor}),
      "Ownable: caller is not the owner"
    );
  });

  it(`Should Ether goes to ERC20 owner after destroy contract`, async () => {
    const weiAmount = web3.utils.toWei(new BN(1, "ether"));
    await buyOneWeiOfTokens(weiAmount);
    //owner Ether balance
    const posBuyOwnerBalanceETH = await web3.eth.getBalance(owner);
    //contract ERC20 Ether balance
    const posBuyERC20BalanceETH = await web3.eth.getBalance(
      erc20BetToken.address
    );
    let receiptDestroy = await erc20BetToken.destroyContract({from: owner});
    // test balance of ERC20 token
    const finalERC20BalanceETH = new BN(
      await web3.eth.getBalance(erc20BetToken.address)
    );

    expect(finalERC20BalanceETH).to.be.bignumber.equal(new BN(0));

    // test balance of owner of ERC20 token has to be greater than former balance
    expect(await web3.eth.getBalance(owner)).to.be.bignumber.above(
      new BN(posBuyOwnerBalanceETH)
    );
  });
});
