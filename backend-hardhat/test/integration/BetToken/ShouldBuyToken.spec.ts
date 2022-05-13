import {expect} from "chai";
import {waffle} from "hardhat";

export const shouldBuySomeToken = (): void => {
  //   // to silent warning for duplicate definition of Transfer event
  //   ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.OFF);

  context(`#sendTransaction`, async function () {
    it(`Should buy some tokens with Ether and emit event 'TokenMinted`, async function () {
      //One wei => 1 Ether = 1 * 10^18 wei
      const weiAmount = 1; //new BN(1);
      //contract ERC20 Ether balance
      const erc20BalanceETH = await waffle.provider.getBalance(
        this.betToken.address
      );

      // Test for event
      await expect(
        this.signers.bettorA.sendTransaction({
          to: this.betToken.address,
          value: weiAmount,
        })
      )
        .to.emit(this.betToken, "TokenMinted")
        .withArgs(
          await this.signers.bettorA.getAddress(),
          weiAmount,
          erc20BalanceETH.add(weiAmount)
        );
      // test balance of tokens
      await expect(
        await this.betToken.balanceOf(await this.signers.bettorA.getAddress())
      ).to.be.equal(weiAmount);
      // test balance of Ether of the contract ERC20
      await expect(
        await waffle.provider.getBalance(this.betToken.address)
      ).to.be.equal(erc20BalanceETH.add(weiAmount));
    });

    it(`Should revert when try to send Ether to the BetToken contract paused`, async function () {
      //One wei => 1 Ether = 1 * 10^18 wei
      const weiAmount = 1; //new BN(1);
      //pause game
      const receiptPausePromise = this.betToken
        .connect(this.signers.owner)
        .pause();
      await expect(receiptPausePromise)
        .to.emit(this.betToken, "Paused")
        .withArgs(this.signers.owner.address);

      expect(await this.betToken.paused()).to.be.true;
      // send Ether
      await expect(
        this.signers.bettorA.sendTransaction({
          to: this.betToken.address,
          value: weiAmount,
        })
      ).to.be.revertedWith("Pausable: paused");
    });
  });
};
