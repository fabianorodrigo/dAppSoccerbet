const SBToken = artifacts.require("BetToken");

module.exports = function (deployer) {
  deployer.deploy(SBToken).then();
};
