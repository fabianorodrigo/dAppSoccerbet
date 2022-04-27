import {expect} from "chai";
import {ethers, waffle} from "hardhat";
import {Game, Game__factory} from "../../../typechain-types";

const DATETIME_20220716_170000_IN_MINUTES =
  new Date(2022, 6, 16, 17, 0, 0, 0).getTime() / 1000;

export const shouldBet = (): void => {
  //   // to silent warning for duplicate definition of Transfer event
  //   ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.OFF);

  context(`#bet`, async function () {
    it(`Should make a bet on an open game and emit events: 'Approval' and 'BetOnGame'`, async function () {
      const score = {home: 3, visitor: 1};
      const betTokenAmount = 1001;
      //Game is initially closed for betting
      await this.game.connect(this.signers.owner).openForBetting();
      ////////////////// BETTOR HAS TO BUY SOME BETTOKENS
      await this.signers.bettorA.sendTransaction({
        to: this.betToken.address,
        value: betTokenAmount,
      });
      // The ETHER balance of BetToken contract is now 1001 WEI
      expect(
        await waffle.provider.getBalance(this.betToken.address)
      ).to.be.equal(1001);
      // The BETTOKEN balance of the bettor is now 1001 BETTOKENs
      expect(
        await this.betToken.balanceOf(this.signers.bettorA.address)
      ).to.be.equal(1001);
      //////////////// BETTOR ALLOWS {this.game} SPENT THE VALUE OF THE BET IN HIS NAME
      const receiptApprove = await this.betToken
        .connect(this.signers.bettorA)
        .approve(this.game.address, betTokenAmount);
      expect(receiptApprove)
        .to.emit(this.betToken, "Approval")
        .withArgs(this.betToken, this.game.address, betTokenAmount);
      const allowanceValue = await this.betToken.allowance(
        this.signers.bettorA.address,
        this.game.address
      );
      expect(allowanceValue).to.be.equal(betTokenAmount);
      //////////////// BETTOR MAKES A BET IN THE VALUE OF {betTokenAmount}
      const receiptBet = await this.game
        .connect(this.signers.bettorA)
        .bet(score, betTokenAmount);
      // The BETTOKEN balances of the Game contract and the bettor are, respectively, 1001 and 0 BETTOKENs
      expect(await this.betToken.balanceOf(this.game.address)).to.be.equal(
        1001
      );
      expect(
        await this.betToken.balanceOf(this.signers.bettorA.address)
      ).to.be.equal(ethers.constants.Zero);

      expect(receiptBet)
        .to.emit(this.game, "BetOnGame")
        .withArgs(
          this.game.address,
          this.signers.bettorA.address,
          "SÃO PAULO",
          "ATLÉTICO-MG",
          DATETIME_20220716_170000_IN_MINUTES,
          [score.home, score.visitor]
        );
    });

    it(`Should revert if try to bet on a closed game`, async function () {
      const score = {home: 3, visitor: 1};
      const betTokenAmount = 1001;
      ////////////////// BETTOR HAS TO BUY SOME BETTOKENS
      await this.signers.bettorA.sendTransaction({
        to: this.betToken.address,
        value: betTokenAmount,
      });
      //////////////// BETTOR ALLOWS {this.game} SPENT THE VALUE OF THE BET IN HIS NAME
      const receiptApprove = await this.betToken
        .connect(this.signers.bettorA)
        .approve(this.game.address, betTokenAmount);
      //Game is initially closed for betting. Since the game was not opened, it has to revert
      await expect(
        this.game.connect(this.signers.bettorA).bet(score, betTokenAmount)
      ).to.be.revertedWith("GameNotOpen()");
    });

    it(`Should revert if try to bet zero BetTokens on a game`, async function () {
      const score = {home: 3, visitor: 1};
      const betTokenAmount = 1001;
      //Game is initially closed for betting
      await this.game.connect(this.signers.owner).openForBetting();
      //////////////// BETTOR MAKES A BET IN THE VALUE OF ZERO BETTOKENS
      await expect(
        this.game
          .connect(this.signers.bettorA)
          .bet(score, ethers.constants.Zero)
      ).to.be.revertedWith("InvalidBettingValue()");
    });

    it(`Should revert if try to bet on a game without Bet Tokens`, async function () {
      const score = {home: 3, visitor: 1};
      const betTokenAmount = 1001;
      //Game is initially closed for betting
      await this.game.connect(this.signers.owner).openForBetting();
      //////////////// BETTOR MAKES A BET IN THE VALUE OF {betTokenAmount}
      expect(
        this.game.connect(this.signers.bettorA).bet(score, betTokenAmount)
      ).to.revertedWith("InsufficientTokenBalance(0)");
    });

    it(`Should revert if try to bet on a game without approve enough Bet Tokens for Game contract`, async function () {
      const score = {home: 3, visitor: 1};
      const betTokenAmount = 1001;
      //Game is initially closed for betting
      await this.game.connect(this.signers.owner).openForBetting();
      ////////////////// BETTOR HAS TO BUY SOME BETTOKENS
      const receiptBuy = await this.signers.bettorA.sendTransaction({
        to: this.betToken.address,
        value: betTokenAmount,
      });
      await receiptBuy.wait();
      //////////////// BETTOR ALLOWS {this.game} SPENT THE VALUE MINUS 1 OF THE BET IN HIS NAME
      const receiptApprove = await this.betToken
        .connect(this.signers.bettorA)
        .approve(this.game.address, 1000);
      await receiptApprove.wait();
      //////////////// BETTOR MAKES A BET IN THE VALUE OF {betTokenAmount}
      await expect(
        this.game.connect(this.signers.bettorA).bet(score, betTokenAmount)
      ).to.revertedWith("ERC20: insufficient allowance");
    });

    it(`Should revert if try to call BET direct to the implementation contract is spite of the minimal proxy`, async function () {
      const score = {home: 3, visitor: 1};
      const betTokenAmount = 1001;
      const implementationAddress =
        await this.gameFactory.getGameImplementation();

      const gameFactory: Game__factory = await ethers.getContractFactory(
        `Game`
      );
      const game: Game = gameFactory.attach(implementationAddress);

      await expect(
        game.connect(this.signers.owner).bet(score, betTokenAmount)
      ).to.be.revertedWith("Function must be called through delegatecall");
    });
  });
};
