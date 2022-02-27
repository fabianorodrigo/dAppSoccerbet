import {BigNumber} from "ethers";
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
}
