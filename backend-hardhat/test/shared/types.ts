import {Fixture, MockContract} from "ethereum-waffle";
import {Wallet} from "@ethersproject/wallet";
import {
  BetTokenUpgradeable,
  CalculatorUpgradeable,
} from "../../typechain-types";

declare module "mocha" {
  export interface Context {
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
    mocks: Mocks;
    betToken: BetTokenUpgradeable;
    calculator: CalculatorUpgradeable;
  }
}

export interface Signers {
  owner: Wallet;
  bettorA: Wallet;
  bettorB: Wallet;
  bettorC: Wallet;
  bettorD: Wallet;
  bettorE: Wallet;
}

export interface Mocks {
  mockUsdc: MockContract;
}
