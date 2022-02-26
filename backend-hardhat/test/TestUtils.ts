import {Bet} from "./model";
import {BigNumber} from "bignumber.js";
import {ethers} from "hardhat";

export class TestUtils {
  calcPercentageBN(amount: BigNumber, percentage: BigNumber): BigNumber {
    //https://github.com/indutny/bn.js/
    //Postfix "n": the argument of the function must be a plain JavaScript Number. Decimals are not supported.
    return amount.multipliedBy(percentage).multipliedBy(100).dividedBy(10000);
  }

  getCommissionPercentageBN(): BigNumber {
    return new BigNumber(10);
  }

  sumBetsAmountBN(bets: Bet[]) {
    return bets.reduce(
      (total, current) => total.plus(current.value),
      new BigNumber(0)
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
}
