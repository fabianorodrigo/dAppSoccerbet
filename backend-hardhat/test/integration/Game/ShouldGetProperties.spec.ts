import {expect} from "chai";

export const shouldGetProperties = (): void => {
  //   // to silent warning for duplicate definition of Transfer event
  //   ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.OFF);

  context(`#getters`, async function () {
    it(`Should list all bets on an game`, async function () {
      const betsArray = await this.game.listBets();
      expect(betsArray).to.be.an("array");
      expect(betsArray).to.have.lengthOf(2);
      //bet one
      expect(betsArray[0].bettor).to.be.equal(this.signers.bettorA.address);
      expect(betsArray[0].score.home).to.be.equal(3);
      expect(betsArray[0].score.visitor).to.be.equal(1);
      expect(betsArray[0].value).to.be.equal(1004);
      //bet two
      expect(betsArray[1].bettor).to.be.equal(this.signers.bettorB.address);
      expect(betsArray[1].score.home).to.be.equal(2);
      expect(betsArray[1].score.visitor).to.be.equal(2);
      expect(betsArray[1].value).to.be.equal(1979);
    });

    it(`Should get the sum of BetTokens bet on an game`, async function () {
      const stake = await this.game.getTotalStake();
      expect(stake).to.be.equal(2983);
    });

    it(`Should get the percentage of administration commission applyed over the stake of a game`, async function () {
      const commission = await this.game.getCommissionValue();
      expect(commission).to.be.equal(298); //seria 298,3 ...
    });

    it(`Should get the total stake of a game less the administration commission`, async function () {
      const prize = await this.game.getPrize();
      expect(prize).to.be.equal(2685); //seria 2684,7 ...
    });
  });
};
