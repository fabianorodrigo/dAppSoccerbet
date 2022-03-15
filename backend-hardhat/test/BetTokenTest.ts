import {expect} from "chai";
import {
  BigNumberish,
  Contract,
  ContractFactory,
  Signer,
  Transaction,
} from "ethers";
/**
 * When using JavaScript, all the properties in the HRE are injected into the global scope,
 * and are also available by getting the HRE explicitly. When using TypeScript nothing will
 * be available in the global scope and you will need to import everything explicitly.
 */
import {ethers, upgrades, waffle} from "hardhat";

let ERC20BetToken: ContractFactory;
let erc20BetToken: Contract;

describe("Token", function () {
  let accounts: Signer[];
  let owner: Signer;
  let bettor: Signer;

  // As we have part of contracts following UUPS pattern e GameFactory following Transparent Proxy pattern,
  // Upgrades emits a warning message for each test case: Warning: A proxy admin was previously deployed on this network
  // This makes excessive noise: https://forum.openzeppelin.com/t/what-is-warning-a-proxy-admin-was-previously-deployed-on-this-network/20501
  upgrades.silenceWarnings();

  before(async () => {
    accounts = await ethers.getSigners();
    // The owner is gonna be sent by 1º account
    //When using the hardhat-ethers plugin ContractFactory and Contract instances are connected to the FIRST signer by default.
    owner = accounts[0];
    bettor = accounts[1];
    //Contract Factory
    ERC20BetToken = await ethers.getContractFactory("BetTokenUpgradeable");
  });

  beforeEach(async () => {
    //Contract
    erc20BetToken = await upgrades.deployProxy(ERC20BetToken, {kind: "uups"});
    await erc20BetToken.deployed();
  });

  it(`Should buy some tokens with Ether`, async () => {
    //One wei => 1 Ether = 1 * 10^18 wei
    const weiAmount = 1; //new BN(1);
    //contract ERC20 Ether balance
    const erc20BalanceETH = await waffle.provider.getBalance(
      erc20BetToken.address
    );
    let receipt = await buyOneWeiOfTokens(weiAmount);

    // Test for event
    await expect(receipt)
      .to.emit(erc20BetToken, "TokenMinted")
      .withArgs(
        await bettor.getAddress(),
        weiAmount,
        erc20BalanceETH.add(weiAmount)
      );
    // test balance of tokens
    await expect(
      await erc20BetToken.balanceOf(await bettor.getAddress())
    ).to.be.equal(weiAmount);
    // test balance of Ether of the contract ERC20
    await expect(
      await waffle.provider.getBalance(erc20BetToken.address)
    ).to.be.equal(erc20BalanceETH.add(weiAmount));
  });

  /**
   * @notice Buys tokens with the amount of WEI with the bettor account
   *
   * @param {BN} weiAmountBN Amount of WEI in BN (BigNumber)
   * @returns Receipt of transaction
   */
  async function buyOneWeiOfTokens(
    weiAmountBN: BigNumberish
  ): Promise<Transaction> {
    //If you need to send a transaction from an account (or Signer in ethers.js speak) other than the default one to test your code,
    //you can use the connect() method in your ethers.js Contract to connect it to a different account.

    //One wei => 1 Ether = 1 * 10^18 wei
    return await bettor.sendTransaction({
      to: erc20BetToken.address,
      value: weiAmountBN,
    });
  }

  it(`Should revert if someone different from owner try destroy contract`, async () => {
    //https://ethereum-waffle.readthedocs.io/en/latest/matchers.html#revert-with-message
    await expect(
      erc20BetToken.connect(bettor).destroyContract()
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it(`Should Ether goes to ERC20 owner after destroy contract`, async () => {
    const weiAmount = ethers.utils.parseEther("1.0");
    await buyOneWeiOfTokens(weiAmount);
    //owner Ether balance
    const posBuyOwnerBalanceETH = await waffle.provider.getBalance(
      await owner.getAddress()
    );
    //contract ERC20 Ether balance
    const posBuyERC20BalanceETH = await waffle.provider.getBalance(
      erc20BetToken.address
    );
    let receiptDestroy = await erc20BetToken.connect(owner).destroyContract();
    // test balance of ERC20 token
    const finalERC20BalanceETH = await waffle.provider.getBalance(
      erc20BetToken.address
    );
    expect(finalERC20BalanceETH).to.be.equal(0);

    // test balance of owner of ERC20 token has to be greater than former balance
    expect(
      await waffle.provider.getBalance(await owner.getAddress())
    ).to.be.above(posBuyOwnerBalanceETH);
  });
});
