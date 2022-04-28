import {expect} from "chai";
import {ethers, waffle} from "hardhat";
import {Game, Game__factory} from "../../../typechain-types";

export const shouldDestroyGameContract = (): void => {
  //   // to silent warning for duplicate definition of Transfer event
  //   ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.OFF);

  context(`#destroyContract`, async function () {
    it(`Should eventual Ether balance of Game contract be sent to the owner`, async function () {
      const weiAmount = ethers.utils.parseEther("1.0");

      expect(await this.testingAuxiliar.selfDestructRecipient()).to.be.equal(
        this.game.address
      );
      //game contract balance should be ZERO
      expect(await waffle.provider.getBalance(this.game.address)).to.be.equal(
        ethers.constants.Zero
      );
      // The ETHER balance of the new TestingAuxiliar contract has to be 1 Ether
      expect(
        await waffle.provider.getBalance(this.testingAuxiliar.address)
      ).to.be.equal(weiAmount);
      // Destructing the testingAuxiliar should send it's Ethers to Game contract
      await this.testingAuxiliar.destroyContract();
      expect(await waffle.provider.getBalance(this.game.address)).to.be.equal(
        weiAmount
      );
      // Destructing the Game contract should send it's Ethers to owner
      const ownerBalance = await waffle.provider.getBalance(
        await this.signers.owner.getAddress()
      );
      await this.game.connect(this.signers.owner).destroyContract();
      const ownerBalancePostDestruction = await waffle.provider.getBalance(
        await this.signers.owner.getAddress()
      );
      expect(ownerBalancePostDestruction.gt(ownerBalance)).to.be.true;
    });

    it(`Should revert if someone different from owner try destroy contract`, async function () {
      await expect(
        this.game.connect(this.signers.bettorA).destroyContract()
      ).to.revertedWith("Ownable: caller is not the owner");
    });
    it(`Should revert when send Ether to the contract`, async function () {
      const weiAmount = ethers.utils.parseEther("1.0");
      expect(
        this.signers.bettorA.sendTransaction({
          to: this.game.address,
          value: weiAmount,
        })
      ).to.be.reverted;
    });

    it(`Should revert if try to call destroyContract direct to the implementation contract is spite of the minimal proxy`, async function () {
      const implementationAddress =
        await this.gameFactory.getGameImplementation();

      const gameFactory: Game__factory = await ethers.getContractFactory(
        `Game`
      );
      const game: Game = gameFactory.attach(implementationAddress);

      await expect(
        game.connect(this.signers.owner).destroyContract()
      ).to.be.revertedWith("Function must be called through delegatecall");
    });
  });
};
