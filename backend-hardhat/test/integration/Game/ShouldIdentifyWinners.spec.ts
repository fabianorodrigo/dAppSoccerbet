import {expect} from "chai";
import {ethers} from "ethers";
import {TestUtils} from "../../shared";

const DATETIME_20220716_170000_IN_SECONDS =
  new Date(2022, 6, 16, 17, 0, 0, 0).getTime() / 1000;

export const shouldIdentifyWinners = (): void => {
  //   // to silent warning for duplicate definition of Transfer event
  //   ethers.this.this.utils.Logger.setLogLevel(ethers.this.this.utils.Logger.levels.OFF);

  context(`#identifyWinners`, async function () {
    it(`Should revert when the game is not finalized yet`, async function () {
      //make bets
      await this.utils.makeBets(
        this.betToken,
        this.game,
        this.signers.owner,
        this.BETS
      );
      //Closed for betting
      const closeTransaction = await this.game
        .connect(this.signers.owner)
        .closeForBetting();
      //Resolves to the TransactionReceipt once the transaction has been included in the chain for confirms blocks.
      await closeTransaction.wait();
      // identify the winners bets
      await expect(this.game.identifyWinners()).to.be.revertedWith(
        "GameNotFinalized()"
      );
      expect(await this.game.winnersIdentified()).to.be.false;
    });

    it(`Should revert when the game's winners have been already identified`, async function () {
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
      const receipt = await this.game.identifyWinners();
      //Resolves to the TransactionReceipt once the transaction has been included in the chain for confirms blocks.
      await receipt.wait();
      // identify the winners bets again
      await expect(this.game.identifyWinners()).to.be.revertedWith(
        "WinnersAlreadyKnown()"
      );
      expect(await this.game.winnersIdentified()).to.be.true;
    });

    it(`Should identify winners of a game where only one matched the final score and emit event 'GameWinnersIdentified'`, async function () {
      //make bets
      await this.utils.makeBets(
        this.betToken,
        this.game,
        this.signers.owner,
        this.BETS
      );
      //Closed for betting
      await this.game.connect(this.signers.owner).closeForBetting();
      //Finalize the game with the score bet by bettorE
      await this.game
        .connect(this.signers.owner)
        .finalizeGame({home: 0, visitor: 3});
      // identify the winners bets
      const receipt = await this.game.identifyWinners();
      expect(receipt)
        .to.emit(this.game, "GameWinnersIdentified")
        .withArgs(
          this.game.address,
          "SÃO PAULO",
          "ATLÉTICO-MG",
          DATETIME_20220716_170000_IN_SECONDS
        );
      //Verify winners identified
      const bets = await this.game.listBets();
      for (let bet of bets) {
        //the prize of bettorE should be equal 90% of all stake
        if (bet.bettor == this.signers.bettorE.address) {
          expect(bet.result).to.be.equal(TestUtils.WINNER);
        } else {
          expect(bet.result).to.be.equal(TestUtils.LOSER);
        }
      }
      //amount bet by bettorE
      expect(await this.game.totalTokensBetWinners()).to.be.equal(
        this.BETS[4].tokenAmount
      );
      expect(await this.game.winnersIdentified()).to.be.true;
    });

    it(`Should identify winners of a game where more than one matched the final score and emit event 'GameWinnersIdentified'`, async function () {
      //make bets
      await this.utils.makeBets(
        this.betToken,
        this.game,
        this.signers.owner,
        this.BETS
      );
      //Closed for betting
      await this.game.connect(this.signers.owner).closeForBetting();
      //Finalize the game with the score bet by bettorA and bettorB
      await this.game
        .connect(this.signers.owner)
        .finalizeGame({home: 2, visitor: 2});
      // identify the winners bets
      const receipt = await this.game.identifyWinners();
      expect(receipt)
        .to.emit(this.game, "GameWinnersIdentified")
        .withArgs(
          this.game.address,
          "SÃO PAULO",
          "ATLÉTICO-MG",
          DATETIME_20220716_170000_IN_SECONDS
        );
      //Verify winners identified
      const bets = await this.game.listBets();
      for (let bet of bets) {
        if (
          bet.bettor == this.signers.bettorA.address ||
          bet.bettor == this.signers.bettorB.address
        ) {
          expect(bet.result).to.be.equal(TestUtils.WINNER);
        } else {
          expect(bet.result).to.be.equal(TestUtils.LOSER);
        }
      }
      //amount bet by bettorA plus amount bet by bettorB
      expect(await this.game.totalTokensBetWinners()).to.be.equal(
        this.BETS[0].tokenAmount.add(this.BETS[1].tokenAmount)
      );
      expect(await this.game.winnersIdentified()).to.be.true;
    });

    it(`Should not identify winners if nobody matched the final score and emit event 'GameWinnersIdentified'`, async function () {
      //make bets
      await this.utils.makeBets(
        this.betToken,
        this.game,
        this.signers.owner,
        this.BETS
      );
      //Closed for betting
      await this.game.connect(this.signers.owner).closeForBetting();
      //Finalize the game with the score bet by bettorA and bettorB
      await this.game
        .connect(this.signers.owner)
        .finalizeGame({home: 3, visitor: 3});
      // identify the winners bets
      const receipt = await this.game.identifyWinners();
      expect(receipt)
        .to.emit(this.game, "GameWinnersIdentified")
        .withArgs(
          this.game.address,
          "SÃO PAULO",
          "ATLÉTICO-MG",
          DATETIME_20220716_170000_IN_SECONDS
        );
      //Verify winners identified
      const bets = await this.game.listBets();
      for (let bet of bets) {
        expect(bet.result).to.be.equal(TestUtils.LOSER);
      }
      //If has no winners, there is no tokens of bet winners
      expect(await this.game.totalTokensBetWinners()).to.be.equal(
        ethers.constants.Zero
      );
      expect(await this.game.winnersIdentified()).to.be.true;
    });
  });
};
