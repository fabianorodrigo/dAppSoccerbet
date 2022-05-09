import {expect} from "chai";
import {Transaction} from "ethers";
import {Result} from "ethers/lib/utils";
import {ethers} from "hardhat";

const DATETIME_20220716_163000_IN_MINUTES =
  new Date(2022, 6, 16, 16, 30, 0, 0).getTime() / 1000;

export const shouldCreatGame = (): void => {
  //   // to silent warning for duplicate definition of Transfer event
  //   ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.OFF);

  context(`#createGame`, async function () {
    it(`Should create a new game`, async function () {
      const receipt = await this.gameFactory.newGame(
        "SÃO PAULO",
        "ATLÉTICO-MG",
        DATETIME_20220716_163000_IN_MINUTES
      );
      expect(receipt).to.emit(this.gameFactory, "GameCreated").withArgs(
        "0x4ABEaCA4b05d8fA4CED09D26aD28Ea298E8afaC8", //"0x32467b43BFa67273FC7dDda0999Ee9A12F2AaA08", //constant address created by Waffle or Hardhat node
        "SÃO PAULO",
        "ATLÉTICO-MG",
        DATETIME_20220716_163000_IN_MINUTES
      );
    });

    it(`Should catch events CreateGame`, async function () {
      await this.gameFactory.newGame(
        "SÃO PAULO",
        "ATLÉTICO-MG",
        DATETIME_20220716_163000_IN_MINUTES
      );
      //catching GameCreated event
      const filter = this.gameFactory.filters.GameCreated();
      const games = await this.gameFactory.queryFilter(filter);

      expect(games).to.be.an("array");
      expect(games).to.have.lengthOf(1);
      const Game = await ethers.getContractFactory("Game");
      const g = await Game.attach((games[0].args as Result).addressGame);
      expect(await g.open()).to.be.false;
      expect(await g.finalized()).to.be.false;
    });
  });
};
