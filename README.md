# dAppSoccerbet

Soccer scores bets decentralized Application. The objective of this dApp is provided a decentralized environment where anyone can bet about soccer games scores. The owner of an Ethereum account is denominated BETTOR. The ADMIN is the responsible for manage the system, register the games able to betting, open and close the game for betting, input the scores after end of these games etc.
The BETTOR buy tokens using Ether and uses these tokens to make guess about score of one or more games registered by the ADMIN. After a game is finalized, the ADMIN register the final score and the prize is splitted among those BETTORS whose bets matched the final score.

This dApp has X different versions/tags evolving from the simpler version with less features to an more elaborated and more complex one. Thus is a good example to learn about Decentralized Application Development incrementally.

The branch 'main' will always keep the latest stable version that is the greater version/tag.

## v1.0.0

In this version the bettors buy tokens ERC20 so as they can bet some scores. The only role in the contracts is the OWNER. The owner account is responsabile for execute the administrative operations such as open and close games for betting, input the game scores on chain etc.

### Local installation for development purpose

```
npm install

# eth-gas-reporter only worked when deployed globally
npm install --save-dev eth-gas-reporter -g
```

### UI Angular

User interface built in Angular where bettors buy tokens, make their toss and withdraw their prize in Ether.

### Contracts

BetToken: It's a ERC20 token implementation. A token or fraction is minted when the same quantity of Ether is received by the contract. The bettings are made using BetToken.
GameFactory: It's the management center of soccer games. It's through it that games are registred by ADMIN.
Game: Represents a soccer game and manages the bets related to this specific game, registring bets and spliting prize.
Calculator: Contract that provides Math functions
BetTokenFaucet: It's a faucet of ERC20BetToken

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
