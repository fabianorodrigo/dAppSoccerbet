import {expect} from "chai";
import {ethers} from "ethers";
import {TestUtils} from "../../shared";

export const shouldCalcPrizes = (): void => {
  //   // to silent warning for duplicate definition of Transfer event
  //   ethers.this.utils.Logger.setLogLevel(ethers.this.utils.Logger.levels.OFF);

  context(`#calcPrizes`, async function () {
    it(`Should revert when the game's winners have NOT been identified yet`, async function () {
      //make bets
      await this.utils.makeBets(
        this.betToken,
        this.game,
        this.signers.owner,
        this.BETS
      );
      //Closed for betting
      await this.game.connect(this.signers.owner).closeForBetting();
      //Finalize the game
      const finalizeTransaction = await this.game
        .connect(this.signers.owner)
        .finalizeGame({home: 0, visitor: 3});
      //Resolves to the TransactionReceipt once the transaction has been included in the chain for confirms blocks.
      await finalizeTransaction.wait();
      // identify the winners bets again
      await expect(this.game.calcPrizes()).to.be.revertedWith(
        "UnknownWinners()"
      );
      expect(await this.game.prizesCalculated()).to.be.false;
    });

    it(`Should revert when the game's prizes have been already calculated`, async function () {
      //make bets
      await this.utils.makeBets(
        this.betToken,
        this.game,
        this.signers.owner,
        this.BETS
      );
      //Closed for betting
      await this.game.connect(this.signers.owner).closeForBetting();
      //Finalize the game
      const finalizeTransaction = await this.game
        .connect(this.signers.owner)
        .finalizeGame({home: 0, visitor: 3});
      //Resolves to the TransactionReceipt once the transaction has been included in the chain for confirms blocks.
      await finalizeTransaction.wait();
      // identify the winners bets
      await this.game.identifyWinners();
      // Calculates the prizes
      const calcPrizesTransaction = await this.game.calcPrizes();
      //Resolves to the TransactionReceipt once the transaction has been included in the chain for confirms blocks.
      await calcPrizesTransaction.wait();
      // Calculates the prizes again
      await expect(this.game.calcPrizes()).to.be.revertedWith(
        "PrizesAlreadyCalculated()"
      );
      expect(await this.game.winnersIdentified()).to.be.true;
    });

    it(`Should revert when try to calc prizes of a paused game`, async function () {
      //make bets
      await this.utils.makeBets(
        this.betToken,
        this.game,
        this.signers.owner,
        this.BETS
      );
      //Closed for betting
      await this.game.connect(this.signers.owner).closeForBetting();
      //Finalize the game
      const finalizeTransaction = await this.game
        .connect(this.signers.owner)
        .finalizeGame({home: 0, visitor: 3});
      //Resolves to the TransactionReceipt once the transaction has been included in the chain for confirms blocks.
      await finalizeTransaction.wait();
      // identify the winners bets
      await this.game.identifyWinners();
      //pause game
      const receiptPausePromise = this.game.connect(this.signers.owner).pause();
      await expect(receiptPausePromise)
        .to.emit(this.game, "Paused")
        .withArgs(this.signers.owner.address);
      // Calculates the prizes
      await expect(this.game.calcPrizes()).to.be.revertedWith(
        "Pausable: paused"
      );
    });

    it(`Should pay 90% of stake to the only one who matched the final score`, async function () {
      //make bets
      await this.utils.makeBets(
        this.betToken,
        this.game,
        this.signers.owner,
        this.BETS
      );
      //Closed for betting
      await this.game.connect(this.signers.owner).closeForBetting();
      //Finalize the game
      const finalizeTransaction = await this.game
        .connect(this.signers.owner)
        .finalizeGame({home: 0, visitor: 3});
      //Resolves to the TransactionReceipt once the transaction has been included in the chain for confirms blocks.
      await finalizeTransaction.wait();
      // identify the winners bets
      await this.game.identifyWinners();
      // Calculates the prizes
      await this.game.calcPrizes();

      //Pay prizes
      const sumStake = this.utils.sumBetsAmountBN(this.BETS);
      //prize value (total stake minus the administration commision fee)
      const prize = sumStake.sub(
        this.utils.calcPercentageBN(
          sumStake,
          this.utils.getCommissionPercentageBN()
        )
      );
      const bets = await this.game.listBets();

      for (let bet of bets) {
        //the prize of bettorE should be equal 90% of all stake
        if (bet.bettor == this.signers.bettorE.address) {
          expect(bet.prize).to.be.equal(prize);
          expect(bet.result).to.be.equal(TestUtils.WINNER);
        } else {
          expect(bet.prize).to.be.equal(ethers.constants.Zero);
          expect(bet.result).to.be.equal(TestUtils.LOSER);
        }
      }
      expect(await this.game.prizesCalculated()).to.be.true;
    });

    it(`Should split proportionally 90% of stake to the multiples who matched the final score`, async function () {
      //make bets
      await this.utils.makeBets(
        this.betToken,
        this.game,
        this.signers.owner,
        this.BETS
      );
      //Closed for betting
      await this.game.connect(this.signers.owner).closeForBetting();
      //Finalize the game
      await this.game
        .connect(this.signers.owner)
        .finalizeGame({home: 2, visitor: 2});
      // identify the winners bets
      await this.game.identifyWinners();
      // Calculates the prizes
      await this.game.calcPrizes();

      //Pay prizes
      const sumStake = this.utils.sumBetsAmountBN(this.BETS);
      //prize value (total stake minus the administration commision fee)
      const prize = sumStake.sub(
        this.utils.calcPercentageBN(
          sumStake,
          this.utils.getCommissionPercentageBN()
        )
      );
      const bets = await this.game.listBets();

      for (let bet of bets) {
        //90% of all stake should be proportionally splited between bettor and bettorB
        if (
          bet.bettor == this.signers.bettorA.address ||
          bet.bettor == this.signers.bettorB.address
        ) {
          expect(bet.prize).to.be.equal(
            prize
              .mul(bet.value)
              .div(this.BETS[0].tokenAmount.add(this.BETS[1].tokenAmount))
          );
          expect(bet.result).to.be.equal(TestUtils.WINNER);
        } else {
          expect(bet.prize).to.be.equal(ethers.constants.Zero);
          expect(bet.result).to.be.equal(TestUtils.LOSER);
        }
      }
      expect(await this.game.prizesCalculated()).to.be.true;
    });

    it(`Should refund 90% of stake to all bets if nobody matches the final score`, async function () {
      //make bets
      await this.utils.makeBets(
        this.betToken,
        this.game,
        this.signers.owner,
        this.BETS
      );
      //Closed for betting
      await this.game.connect(this.signers.owner).closeForBetting();
      //Finalize the game
      await this.game
        .connect(this.signers.owner)
        .finalizeGame({home: 7, visitor: 7});
      // identify the winners bets
      await this.game.identifyWinners();
      // Calculates the prizes
      await this.game.calcPrizes();

      //stake value
      const sumStake = this.utils.sumBetsAmountBN(this.BETS);
      //prize value (total stake minus the administration commision fee)
      const prize = sumStake.sub(
        this.utils.calcPercentageBN(
          sumStake,
          this.utils.getCommissionPercentageBN()
        )
      );
      //Verify calculated prizes
      const bets = await this.game.listBets();
      for (let bet of bets) {
        //the balance of bettokens should be equal to amount proportional to the prize (90% of stake)
        expect(bet.prize).to.be.equal(prize.mul(bet.value).div(sumStake));
        expect(bet.result).to.be.equal(TestUtils.TIED);
      }
      expect(await this.game.prizesCalculated()).to.be.true;
    });
  });
};
