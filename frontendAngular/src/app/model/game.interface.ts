import { Bet } from './bet.interface';
import { Score } from './score.interface';

export interface Game {
  homeTeam: string;
  visitorTeam: string;
  datetimeGame: number;
  open: boolean;
  finalized: boolean;
  finaScore?: Score;
  bets?: Bet[];
}
