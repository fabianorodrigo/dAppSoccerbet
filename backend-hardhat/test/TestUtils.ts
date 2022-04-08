import {expect} from "chai";
import {BigNumber, Contract, Signer} from "ethers";
import {WriteStream} from "fs";
import {ethers} from "hardhat";
import {BetDTO} from "./model";

const DATETIME_20220716_170000_IN_MINUTES =
  new Date(2022, 6, 16, 17, 0, 0, 0).getTime() / 1000;
export class TestUtils {
  static readonly PAID = 4;
  static readonly TIED = 3;
  static readonly WINNER = 2;
  static readonly LOSER = 1;
  static readonly NO_RESULT = 0;

  calcPercentageBN(amount: BigNumber, percentage: BigNumber): BigNumber {
    //https://github.com/indutny/bn.js/
    //Postfix "n": the argument of the function must be a plain JavaScript Number. Decimals are not supported.
    return amount.mul(percentage).mul(100).div(10000);
  }

  getCommissionPercentageBN(): BigNumber {
    return BigNumber.from(10);
  }

  sumBetsAmountBN(bets: BetDTO[]) {
    return bets.reduce(
      (total, current) => total.add(current.tokenAmount),
      BigNumber.from(0)
    );
  }

  /**
   * Validates if the address is a contract
   * @param address
   * @returns TRUE if is a contract and wasn't destructed yet (code == 0x)
   */
  async isContract(address: string): Promise<boolean> {
    return (await ethers.provider.getCode(address)) != "0x";
  }

  /**
   * Follow the process of buying Bet Tokens, aprove for GameContract and bet using the parameters informed
   *
   * @param {Game} gameContract Game contract where the bets will happen
   * @param {address} owner Owner of Game contract
   * @param {Array} bets Array of objects with 'bettorAddress', 'score' and 'tokenAmount' properties
   */
  async makeBets(
    erc20BetToken: Contract,
    gameContract: Contract,
    owner: Signer,
    bets: BetDTO[]
  ) {
    let totalStake = ethers.constants.Zero;
    //Game is initially closed for betting
    await gameContract.connect(owner).openForBetting();

    let betCount = 0;
    for (let bet of bets) {
      ////////////////// BETTOR HAS TO BUY SOME BET TOKENS
      await bet.bettor.sendTransaction({
        to: erc20BetToken.address,
        value: bet.tokenAmount,
      });
      // The bettor's balance of Bet tokens the tokenAmount value of BetTokens
      expect(bet.tokenAmount).to.be.equal(
        await erc20BetToken.balanceOf(await bet.bettor.getAddress())
      );

      //////////////// BETTOR ALLOWS {gameContract} SPENT THE VALUE OF THE BET IN HIS NAME
      await erc20BetToken
        .connect(bet.bettor)
        .approve(gameContract.address, bet.tokenAmount);
      //////////////// BETTOR MAKES A BET IN THE VALUE OF {betTokenAmount}
      const receiptBet = await gameContract
        .connect(bet.bettor)
        .bet(bet.score, bet.tokenAmount);

      expect(receiptBet)
        .to.emit(gameContract, "BetOnGame")
        .withArgs(
          gameContract.address,
          await bet.bettor.getAddress(),
          "SÃO PAULO",
          "ATLÉTICO-MG",
          DATETIME_20220716_170000_IN_MINUTES,
          [bet.score.home, bet.score.visitor]
        );
      //https://github.com/indutny/bn.js/
      //Prefix "i":  perform operation in-place, storing the result in the host
      //object (on which the method was invoked). Might be used to avoid number allocation costs
      totalStake = totalStake.add(bet.tokenAmount);
      // The bettor's balance of Bet Tokens is 0 BetTokens
      expect(ethers.constants.Zero).to.be.equal(
        await erc20BetToken.balanceOf(await bet.bettor.getAddress())
      );
      betCount++;

      this.updateLine(`Bet: ${betCount}/${bets.length}`);
    }

    // The BETTOKEN balances of the Game contract is the sum of all bets
    expect(await erc20BetToken.balanceOf(gameContract.address)).to.be.equal(
      totalStake
    );
  }

  getRandomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  /**
   * Print {text} on the console without breaking a new line
   * It`s like a current line update
   *
   * @param text Text to be printed
   */
  updateLine(text: string) {
    process.stdout.clearLine(-1);
    process.stdout.cursorTo(0);
    process.stdout.write(text);
  }
}
