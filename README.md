# dAppSoccerbet

Soccer scores bets decentralized Application. The objective of this dApp is provided a decentralized environment where anyone can bet about soccer games scores.

This dApp has X different versions/tags evolving from the simpler version with less features to an more elaborated and more complex one. Thus is a good example to learn about Decentralized Application Development incrementally.

The branch 'main' will always keep the latest stable version that is the greater version/tag.

## v1.0.0

In this version the gamblers buy tokens ERC20 so as they can bet some scores. The only role in the contracts is the OWNER. The owner account is responsabile for execute the administrative operations such as open and close games for betting, input the game scores on chain etc.

This version is composed by an user interface built in Angular and the following smart contracts:

BetToken: It's a ERC20 token implementation. A token is minted when a Ether or fraction is received by the contract. The bettings are made using BetToken
BetTokenFaucet: It's a faucet of ERC20BetToken

# TODO

- Utilizar o mecanismo do OpenZeppeling de upgrade contratos (proxy) (npm install --save-dev @openzeppelin/truffle-upgrades
  ???) https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable
- Utilizar o Openzeppelin Defender
