import {expect} from "chai";

export const shouldInitProperly = (): void => {
  //   // to silent warning for duplicate definition of Transfer event
  //   ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.OFF);

  context(`#new`, async function () {
    it(`Should have the initial state accordingly`, async function () {
      // Game attributes
      expect(await this.game.homeTeam()).to.equal("SÃO PAULO");
      expect(await this.game.visitorTeam()).to.equal("ATLÉTICO-MG");

      //when the game is created, is initially closed for betting
      expect(
        await this.game.open(),
        "When created, the game is initially closed for betting"
      ).to.be.false;
      //when the game is created, is initially not finalized
      expect(
        await this.game.finalized(),
        "When created, the game can't be finalized"
      ).to.be.false;
    });
  });
};
