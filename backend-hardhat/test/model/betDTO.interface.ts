import {BigNumber, Signer} from "ethers";
import {Score} from "./score.interface";

export interface BetDTO {
  bettor: Signer;
  tokenAmount: BigNumber;
  score: Score;
}
