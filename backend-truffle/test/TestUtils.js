const {BN} = require("@openzeppelin/test-helpers");

module.exports = {
  calcPercentageBN: (amount, percentage) => {
    //https://github.com/indutny/bn.js/
    //Postfix "n": the argument of the function must be a plain JavaScript Number. Decimals are not supported.
    return amount.mul(percentage).muln(100).divn(10000);
  },
  getCommissionPercentageBN: () => {
    return new BN(10);
  },
  sumBetsAmountBN: (bets) => {
    return bets.reduce(
      (total, current) => total.add(current.tokenAmount),
      new BN(0)
    );
  },
};
