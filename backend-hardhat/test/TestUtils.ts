import {expect} from "chai";
import {BigNumber, Contract, Signer} from "ethers";
import {ethers} from "hardhat";
import {BetDTO} from "./model";

export class TestUtils {
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
   * Follow the process of buying Bettokens, aprove for GameContract and bet using the parameters informed
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

    for (let bet of bets) {
      ////////////////// BETTOR HAS TO BUY SOME BETTOKENS
      await bet.bettor.sendTransaction({
        to: erc20BetToken.address,
        value: bet.tokenAmount,
      });
      // The BetToken balances of the Game contract is the tokenAmount value of BetTokens
      expect(
        await erc20BetToken.balanceOf(await bet.bettor.getAddress())
      ).to.be.equal(bet.tokenAmount);

      //////////////// BETTOR ALLOWS {gameContract} SPENT THE VALUE OF THE BET IN HIS NAME
      await erc20BetToken
        .connect(bet.bettor)
        .approve(gameContract.address, bet.tokenAmount);
      //////////////// BETTOR MAKES A BET IN THE VALUE OF {betTokenAmount}
      await gameContract.connect(bet.bettor).bet(bet.score, bet.tokenAmount);
      //https://github.com/indutny/bn.js/
      //Prefix "i":  perform operation in-place, storing the result in the host
      //object (on which the method was invoked). Might be used to avoid number allocation costs
      totalStake = totalStake.add(bet.tokenAmount);
      // The BetToken balances of the Game contract is 0 BetTokens
      expect(
        await erc20BetToken.balanceOf(await bet.bettor.getAddress())
      ).to.be.equal(ethers.constants.Zero);
    }

    // The BETTOKEN balances of the Game contract is the sum of all bets
    expect(await erc20BetToken.balanceOf(gameContract.address)).to.be.equal(
      totalStake
    );
  }
}
