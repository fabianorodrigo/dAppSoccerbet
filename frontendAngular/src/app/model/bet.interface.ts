import { BetResult } from './bet-result.enum';
import { Score } from './score.interface';

export interface Bet {
  index: number; // the bet index in the array inside the game it belongs to
  bettor?: string;
  score: Score;
  value: number;
  result?: BetResult;
  prize: number;
}
