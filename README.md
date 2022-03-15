# Ðapp Soccer Bet ⚽💰

[![licence GPL-3.0](https://img.shields.io/github/license/fabianorodrigo/dappsoccerbet?style=flat-square&logo=creativecommons)](https://github.com/fabianorodrigo/dappsoccerbet/blob/master/LICENSE.md)
![Web3](https://img.shields.io/badge/web3-Decentralized%20Web-brightgreen?style=flat-square&logo=ethereum)
[![CircleCI](https://circleci.com/gh/fabianorodrigo/dAppSoccerbet/tree/main.svg?style=svg)](https://circleci.com/gh/fabianorodrigo/dAppSoccerbet/tree/main)

Soccer scores bets decentralized Application. The objective of this dApp is provided a decentralized environment where anyone can bet about soccer games scores. The owner of an Ethereum account is denominated BETTOR. The ADMIN is the responsible for manage the system, register the games able to betting, open and close the game for betting, input the scores after end of these games etc.
The BETTOR buy tokens using Ether and uses these tokens to make guess about score of one or more games registered by the ADMIN. After a game is finalized, the ADMIN register the final score and the prize is splitted among those BETTORS whose bets matched the final score.

### Technology Stack

- Solidity 0.8
- Angular 13
- Angular Material
- Truffle 5.5
- Hardhat 2.8
- Javascript
- Typescript 
- eth-gas-reporter
- Web3.js
- Ethers.js
- Waffle
- Mocha
- Chai
- Openzeppelin
- Openzeppelin/test_helpers
- Openzeppelin Upgrade Plugin Hardhat
- CircleCI
- Solidity Coverage
<!--This dApp has X different versions/tags evolving from the simpler version with less features to an more elaborated and more complex one. Thus is a good example to learn about Decentralized Application Development incrementally.

The branch 'main' will always keep the latest stable version that is the greater version/tag. 

## v1.0.0-->
In this version the bettors buy tokens ERC20 so as they can bet some scores. The only role in the contracts is the OWNER. The owner account is responsabile for execute the administrative operations such as open and close games for betting, input the game scores on chain etc.

### Local installation for development purpose

```
npm install

# eth-gas-reporter only worked when deployed globally
npm install --save-dev eth-gas-reporter -g

# if you haven't installed Ganache yet
npm install ganache --global

# if you haven't installed Truffle yet
npm install truffle --global
```

### Local execution for development purpose

```
# Running Ganache on port 7545 with pre-defined deterministic seed and saving the chain database at ~/sgbds/ganache
cd backendOnChain
npm run ganache

# Migrating the contracts to the Ganache network
npm run migrate --network ganache

# Running the frontend
cd frontendAngular
ng serve --open
```


### UI Angular

User interface built in Angular where bettors buy tokens, make their toss and withdraw their prize in Ether.

### Contracts

BetToken: It's a ERC20 token implementation. A token or fraction is minted when the same quantity of Ether is received by the contract. The bettings are made using BetToken. It's upgradeable by use of OpenZeppelin Upgrades following the UUPS pattern. 

GameFactory: It's the management center of soccer games. It's through it that games are registred by ADMIN. It's upgradeable by use of OpenZeppelin Upgrades following the Transparent Proxy pattern. 

Game: Represents a soccer game and manages the bets related to this specific game, registring bets and spliting prize.

Calculator: Contract that provides Math functions. It's upgradeable by use of OpenZeppelin Upgrades following the Transparent Proxy pattern. 

### Structs

Bet: One score tossed by a bettor and the amount of tokens he is putting in the game
Score: A score composed by number of goals scored by home team and number of goals scored by visitor team

# TODO

- Utilizar o mecanismo do OpenZeppeling de upgrade contratos (proxy) (npm install --save-dev @openzeppelin/truffle-upgrades
  ???) https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable
- Utilizar o Openzeppelin Defender
- Em alguma versão futura, criar uma votação (ou outro mecanismo) para o BetToken perder paridade com o Ether (See: https://101blockchains.com/tokenomics/)
- Na mesma linha do tópico acima: Prover um ICO para os interessados ganharem participação nos lucros da casa/banca?
- Implementar lógica do valor da aposta/prêmio de acordo com as probabilidades: https://www.pinnacle.com/en/betting-resources/glossary
- https://docs.openzeppelin.com/contracts/4.x/governance
