# Truffle Console Snippets

## Create a game

GameFactory.deployed().then(async gf=>{ const owner = (await web3.eth.getAccounts())[6]; await gf.newGame("A","B",0,{from: owner}); });

## Open a created game for betting

let g = await Game.at("0x1234...");
let owner = (await web3.eth.getAccounts())[6];
g.openForBetting({from: owner});

## Bet on a created game for betting

let g = await Game.at("0x1234...");
let owner = (await web3.eth.getAccounts())[6];
let bettor = (await web3.eth.getAccounts())[1];
let bt = await BetToken.deployed();
await bt.sendTransaction({from:bettor, value: 100 });
await bt.approve(g.address, 100, { from: bettor });
await g.bet({home: "3", visitor: "1"},100, {from: bettor});
