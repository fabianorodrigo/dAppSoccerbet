import { BetResult } from './bet-result.enum';
import { Score } from './score.interface';

export interface Bet {
  bettor?: string;
  score: Score;
  value: number;
  result?: BetResult;
}
