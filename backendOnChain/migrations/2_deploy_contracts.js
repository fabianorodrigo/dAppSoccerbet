const SBToken = artifacts.require("BetToken");
const Calculator = artifacts.require("Calculator");
const GameFactory = artifacts.require("GameFactory");

module.exports = async function (deployer, network, accounts) {
  console.log(`NETWORK OF DEPLOY: ${network}`);
  if (
    network === "ganache" ||
    network === "ganacheRemoto" ||
    network === "development" ||
    network === "test" ||
    network === "docker"
  ) {
    // Creation contract transaction is gonna be sent by 7º Ganache account
    const owner = accounts[6];
    //const web3Accounts = await web3.eth.getAccounts();
    //console.log(`web3 accounts: `, web3Accounts);
    deployer.deploy(SBToken, {from: owner}).then(function () {
      return deployer.deploy(Calculator, {from: owner}).then(() => {
        return deployer.deploy(
          GameFactory,
          SBToken.address,
          Calculator.address,
          {from: owner}
        );
      });
    });
  } else if (network == "ropsten") {
    //console.log(await web3.eth.getAccounts());
    //TODO: implementar migração para rede ropsten
    throw new Error(
      `Migration to network ${network} still pendent of implementation`
    );
  } else {
    throw new Error(
      `Migration to network ${network} still pendent of implementation`
    );
  }
};
