import {expect} from "chai";
import {waffle} from "hardhat";

export const shouldExchange4Ethers = (): void => {
  //   // to silent warning for duplicate definition of Transfer event
  //   ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.OFF);

  context(`#exchange4Ether`, async function () {
    it(`Should exchange Bet Tokens for Ether and emit event 'Transfer'`, async function () {
      //One wei => 1 Ether = 1 * 10^18 wei
      const weiAmount = 1; //new BN(1);
      //contract ERC20 Ether balance before bettor purchase
      const erc20BalanceETH = await waffle.provider.getBalance(
        this.betToken.address
      );
      await this.signers.bettorA.sendTransaction({
        to: this.betToken.address,
        value: weiAmount,
      });
      // exchange bettor's only token
      let receipt = await this.betToken
        .connect(this.signers.bettorA)
        .exchange4Ether(1);
      // Test for event
      await expect(receipt)
        .to.emit(this.betToken, "Transfer")
        .withArgs(
          await this.signers.bettorA.getAddress(),
          "0x0000000000000000000000000000000000000000",
          weiAmount
        );
      // test balance of tokens
      await expect(
        await this.betToken.balanceOf(await this.signers.bettorA.getAddress())
      ).to.be.equal(0);
      // test balance of Ether of the contract ERC20 (should be the original amount)
      await expect(
        await waffle.provider.getBalance(this.betToken.address)
      ).to.be.equal(erc20BalanceETH);
    });

    it(`Should revert if someone without Bet Tokens try to exchange for Ether`, async function () {
      await expect(
        this.betToken.connect(this.signers.bettorB).exchange4Ether(1)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
  });
};
