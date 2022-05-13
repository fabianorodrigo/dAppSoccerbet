import {expect} from "chai";
import {ethers} from "ethers";

const DATETIME_20220716_170000_IN_SECONDS =
  new Date(2022, 6, 16, 17, 0, 0, 0).getTime() / 1000;

export const shouldWithdrawPrize = (): void => {
  //   // to silent warning for duplicate definition of Transfer event
  //   ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.OFF);

  context(`#withdrawPrize`, async function () {
    it(`Should revert if an inexistent bet index is informed`, async function () {
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
        .finalizeGame({home: 0, visitor: 1});
      // identify the winners bets
      await this.game.identifyWinners();
      // Calculates the prizes
      await this.game.calcPrizes();
      await expect(
        this.game.connect(this.signers.bettorA).withdrawPrize(5)
      ).to.be.revertedWith("InvalidBetIndex()");
    });

    it(`Should revert if try to withdraw the prize of a loser bet`, async function () {
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
        .finalizeGame({home: 0, visitor: 1});
      // identify the winners bets
      await this.game.identifyWinners();
      // Calculates the prizes
      await this.game.calcPrizes();
      await expect(
        this.game.connect(this.signers.bettorE).withdrawPrize(4)
      ).to.be.revertedWith("InvalidBettingResultForWithdrawing(1)");
    });

    it(`Should revert if try to withdraw the prize of already paid bet`, async function () {
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
        .finalizeGame({home: 0, visitor: 3});
      // identify the winners bets
      await this.game.identifyWinners();
      // Calculates the prizes
      await this.game.calcPrizes();
      // pay once
      await this.game.connect(this.signers.bettorE).withdrawPrize(4);
      // pay twice
      await expect(
        this.game.connect(this.signers.bettorE).withdrawPrize(4)
      ).to.be.revertedWith("InvalidBettingResultForWithdrawing(4)");
    });

    it(`Should revert if an account different from the bet's bettor is trying to withdraw the prize`, async function () {
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
        .finalizeGame({home: 0, visitor: 3});
      // identify the winners bets
      await this.game.identifyWinners();
      // Calculates the prizes
      await this.game.calcPrizes();
      await expect(
        this.game.connect(this.signers.bettorA).withdrawPrize(4)
      ).to.be.revertedWith(
        `InvalidPrizeWithdrawer("${await this.signers.bettorE.getAddress()}")`
      );
    });

    it(`Should revert when try to withdraw prizes from a paused game`, async function () {
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
        .finalizeGame({home: 0, visitor: 3});
      // identify the winners bets
      await this.game.identifyWinners();
      // Calculates the prizes
      await this.game.calcPrizes();
      //pause game
      const receiptPausePromise = this.game.connect(this.signers.owner).pause();
      await expect(receiptPausePromise)
        .to.emit(this.game, "Paused")
        .withArgs(this.signers.owner.address);
      //withdraw
      await expect(
        this.game.connect(this.signers.bettorE).withdrawPrize(4)
      ).to.be.revertedWith("Pausable: paused");
    });

    it(`Should withdraw 90% of stake to the winner bet`, async function () {
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
        .finalizeGame({home: 0, visitor: 3});
      // identify the winners bets
      await this.game.identifyWinners();
      // Calculates the prizes
      await this.game.calcPrizes();
      //Withdraw prizes
      const sumStake = this.utils.sumBetsAmountBN(this.BETS);
      //prize value (total stake minus the administration commision fee)
      const prize = sumStake.sub(
        this.utils.calcPercentageBN(
          sumStake,
          this.utils.getCommissionPercentageBN()
        )
      );
      await this.game.connect(this.signers.bettorE).withdrawPrize(4);
      for (let bet of this.BETS) {
        //the bettorE balance of bettokens should be equal 90% of all stake
        if (bet.bettor == this.signers.bettorE) {
          expect(
            await this.betToken.balanceOf(await bet.bettor.getAddress())
          ).to.be.equal(prize);
        } else {
          expect(
            await this.betToken.balanceOf(await bet.bettor.getAddress())
          ).to.be.equal(ethers.constants.Zero);
        }
      }
    });

    it(`Should split proportionally 90% of stake to the winners bets`, async function () {
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
      //withdraw prizes
      const sumStake = this.utils.sumBetsAmountBN(this.BETS);
      //prize value (total stake minus the administration commision fee)
      const prize = sumStake.sub(
        this.utils.calcPercentageBN(
          sumStake,
          this.utils.getCommissionPercentageBN()
        )
      );
      //bettorA withdraw
      await this.game.connect(this.signers.bettorA).withdrawPrize(0);
      //bettorB withdraw
      await this.game.connect(this.signers.bettorB).withdrawPrize(1);

      for (let bet of this.BETS) {
        //90% of all stake should be proportionally splited between bettor and bettorB
        if (
          bet.bettor == this.signers.bettorA ||
          bet.bettor == this.signers.bettorB
        ) {
          expect(
            await this.betToken.balanceOf(await bet.bettor.getAddress())
          ).to.be.equal(
            prize
              .mul(bet.tokenAmount)
              .div(this.BETS[0].tokenAmount.add(this.BETS[1].tokenAmount))
          );
        } else {
          expect(
            await this.betToken.balanceOf(await bet.bettor.getAddress())
          ).to.be.equal(ethers.constants.Zero);
        }
      }
    });

    it(`Should refund 90% of stake to all bets if nobody matches the final score`, async function () {
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
      //bettors withdraws
      await this.game.connect(this.signers.bettorA).withdrawPrize(0);
      await this.game.connect(this.signers.bettorB).withdrawPrize(1);
      await this.game.connect(this.signers.bettorC).withdrawPrize(2);
      await this.game.connect(this.signers.bettorD).withdrawPrize(3);
      await this.game.connect(this.signers.bettorE).withdrawPrize(4);
      //Verify withdraw prizes
      for (let bet of this.BETS) {
        //the balance of bettokens should be equal to amount proportional to the prize (90% of stake)
        expect(
          await this.betToken.balanceOf(await bet.bettor.getAddress())
        ).to.be.equal(prize.mul(bet.tokenAmount).div(sumStake));
      }
    });

    it(`Should revert if try to withdraw the prize of a game that has not calculated the prize yet`, async function () {
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
        .finalizeGame({home: 0, visitor: 3});
      // identify the winners bets
      await this.game.identifyWinners();
      await expect(
        this.game.connect(this.signers.bettorE).withdrawPrize(4)
      ).to.be.revertedWith("PrizesNotCalculated()");
    });
  });
};
