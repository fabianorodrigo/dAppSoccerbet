import {getImplementationAddress} from "@openzeppelin/upgrades-core";
import {expect} from "chai";
import {ethers, waffle} from "hardhat";
import {
  BetTokenUpgradeable,
  BetTokenUpgradeable__factory,
} from "../../../typechain-types";

export const shouldDestroyBetTokenContract = (): void => {
  //   // to silent warning for duplicate definition of Transfer event
  //   ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.OFF);

  context(`#destroyContract`, async function () {
    it(`Should revert if someone different from owner try destroy contract`, async function () {
      //https://ethereum-waffle.readthedocs.io/en/latest/matchers.html#revert-with-message
      await expect(
        this.betToken.connect(this.signers.bettorA).destroyContract()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it(`Should revert if try to call destroyContract direct to the implementation contract is spite of the proxy`, async function () {
      const implementationAddress = await getImplementationAddress(
        waffle.provider,
        this.betToken.address
      );
      const betTokenFactory: BetTokenUpgradeable__factory =
        await ethers.getContractFactory(`BetTokenUpgradeable`);
      const betToken: BetTokenUpgradeable = betTokenFactory.attach(
        implementationAddress
      );

      await expect(
        betToken.connect(this.signers.owner).destroyContract()
      ).to.be.revertedWith("Function must be called through delegatecall");
    });

    it(`Should revert when try to destroy a paused BetToken contract`, async function () {
      const weiAmount = ethers.utils.parseEther("1.0");
      await this.signers.bettorA.sendTransaction({
        to: this.betToken.address,
        value: weiAmount,
      });
      //pause game
      const receiptPausePromise = this.betToken
        .connect(this.signers.owner)
        .pause();
      await expect(receiptPausePromise)
        .to.emit(this.betToken, "Paused")
        .withArgs(this.signers.owner.address);
      //destroy
      await expect(
        this.betToken.connect(this.signers.owner).destroyContract()
      ).to.be.revertedWith("Pausable: paused");
    });

    it(`Should Ether goes to ERC20 owner after destroy contract`, async function () {
      const weiAmount = ethers.utils.parseEther("1.0");
      await this.signers.bettorA.sendTransaction({
        to: this.betToken.address,
        value: weiAmount,
      });
      //owner Ether balance
      const posBuyOwnerBalanceETH = await waffle.provider.getBalance(
        await this.signers.owner.getAddress()
      );
      //contract ERC20 Ether balance
      const posBuyERC20BalanceETH = await waffle.provider.getBalance(
        this.betToken.address
      );
      let receiptDestroy = await this.betToken
        .connect(this.signers.owner)
        .destroyContract();
      // test balance of ERC20 token
      const finalERC20BalanceETH = await waffle.provider.getBalance(
        this.betToken.address
      );
      expect(finalERC20BalanceETH).to.be.equal(0);

      // test balance of owner of ERC20 token has to be greater than former balance
      expect(
        await waffle.provider.getBalance(await this.signers.owner.getAddress())
      ).to.be.above(posBuyOwnerBalanceETH);
    });
  });
};
