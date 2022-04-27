import {expect, assert} from "chai";
import {BigNumber, BigNumberish, Signer, Transaction} from "ethers";
import {parseEther} from "ethers/lib/utils";
import {ethers, waffle} from "hardhat";
import {BetTokenUpgradeable} from "../../../typechain-types";

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
      let receipt = await this.signers.bettorA.sendTransaction({
        to: this.betToken.address,
        value: weiAmount,
      });

      // Test for event
      await expect(receipt)
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
  });
};
