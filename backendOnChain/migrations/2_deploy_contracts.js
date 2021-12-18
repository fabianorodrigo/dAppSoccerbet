const SBToken = artifacts.require("BetToken");

module.exports = async function (deployer, network, accounts) {
  if (network === "ganache" || network === "development") {
    // Creation contract transaction is gonna be sent by 7º Ganache account
    const owner = accounts[6];
    //const web3Accounts = await web3.eth.getAccounts();
    //console.log(`web3 accounts: `, web3Accounts);
    deployer.deploy(SBToken, {from: owner}); //.then();
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
