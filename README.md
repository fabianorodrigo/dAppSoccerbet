# Ðapp Soccer Bet ⚽💰

[![licence GPL-3.0](https://img.shields.io/github/license/fabianorodrigo/dappsoccerbet?style=flat-square&logo=creativecommons)](https://github.com/fabianorodrigo/dappsoccerbet/blob/master/LICENSE.md)
![Web3](https://img.shields.io/badge/web3-Decentralized%20Web-brightgreen?style=flat-square&logo=ethereum)
[![CircleCI](https://circleci.com/gh/fabianorodrigo/dAppSoccerbet/tree/develop.svg?style=svg)](https://circleci.com/gh/fabianorodrigo/dAppSoccerbet/tree/develop)

Soccer scores bets decentralized Application. The objective of this Ðapp is provided a decentralized environment where anyone can bet about soccer games scores. The owner of an Ethereum account is denominated BETTOR. The ADMIN is the responsible for manage the system, register the games able to betting, open and close the game for betting, input the scores after end of these games etc.

The BETTOR buy Soccer Bet Tokens, a ERC20 token provided by this Ðapp, using Ether and uses these tokens to make guess about score of one or more games. After a game is finalized and the final score is known, the prize is splitted among those BETTORS whose bets matched the final score, and the winner BETTORS are able to withdraw the prize in Soccer Bet Token and, if wanted, exchange for Ether.

The OWNER account is responsabile for execute the administrative operations such as register games for betting, open and close games for betting, input the game's final score on chain etc.

Visit the [worflow documentation](./docs/workflow/) for a more detailed description of Ðapp usage.

# Technology Stack

## Backend

- Hardhat 2.9
- Truffle 5.6

### On-chain

- Solidity 0.8
- Openzeppelin Upgrade Plugin Hardhat
- Openzeppelin Contracts
  - Ownable
  - OwnableUpgradeable
  - ReentrancyGuard
  - ReentrancyGuardUpgradeable
  - Initializable
  - ERC20Upgradeable
  - UUPSUpgradeable
  - Clones

### Quality Assurance

- Openzeppelin/test_helpers
- Waffle
- Ethers.js
- Mocha
- Chai
- eth-gas-reporter
- Solidity Coverage
- Slither

## Frontend

- Angular 13
- Angular Material
- Typescript
- Web3.js

### Quality Assurance

- Jasmine
- Karma

## CI/CD

- [CircleCI](https://app.circleci.com/pipelines/github/fabianorodrigo/dAppSoccerbet)

# Running Locally

## Local installation for development purpose

```
# if you haven't installed Ganache yet
npm install ganache --global

# if you haven't installed Angular CLI yet
npm install @angular/cli --global

cd backend-hardhat
npm install
# First deploy the contracts to the Ganache network
npm run deployLocal
# Upgrade BetToken
npm run upgradeBetTokenLocal

cd frontendAngular
npm install
```

## Local execution for development purpose

```
# Running Ganache on port 7545 with pre-defined deterministic seed and saving the chain database at ~/sgbds/ganache
cd backend-hardhat
npm run ganache

# Running the frontend
cd frontendAngular
ng serve --open
```

# Modules

## UI Angular

User interface built in Angular where bettors buy tokens, make their toss and withdraw their prize in Ether.

## Smart Contracts

### BetToken:

It's a ERC20 token implementation. A token or fraction is minted when the same quantity of Ether is received by the contract. The bettings are made using BetToken. It's upgradeable by use of OpenZeppelin Upgrades following the UUPS pattern.

### GameFactory:

It's the management center of soccer games. It's through it that games are registred by ADMIN. It's upgradeable by use of OpenZeppelin Upgrades following the Transparent Proxy pattern.

### Game:

Represents a soccer game and manages the bets related to this specific game, registring bets and spliting prize.

### Calculator:

Contract that provides Math functions. It's upgradeable by use of OpenZeppelin Upgrades following the Transparent Proxy pattern.

# Cost track

In order to compare the evolution of costs, the hardhat gas reporter is configured to export the data to file [backend-hardhat/reports/eth-gas-reporter.txt](https://github.com/fabianorodrigo/dAppSoccerbet/blob/develop/backend-hardhat/reports/eth-gas-reporter.txt)\*

\*Better view using `cat reports/eth-gas-reporter.txt` on shell.

# TODO

- Utilizar o Openzeppelin Defender
- Em alguma versão futura, criar uma votação (ou outro mecanismo) para o BetToken perder paridade com o Ether (See: https://101blockchains.com/tokenomics/)
- Na mesma linha do tópico acima: Prover um ICO para os interessados ganharem participação nos lucros da casa/banca?
- Implementar lógica do valor da aposta/prêmio de acordo com as probabilidades: https://www.pinnacle.com/en/betting-resources/glossary
- https://docs.openzeppelin.com/contracts/4.x/governance
