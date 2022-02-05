import { Bet } from './bet.interface';
import { Score } from './score.interface';

export interface Game {
  addressGame?: string;
  homeTeam: string;
  visitorTeam: string;
  datetimeGame: number;
  open: boolean;
  finalized: boolean;
  finalScore?: Score;
  bets?: Bet[];
}
