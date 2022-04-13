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
  winnersIdentified: boolean;
  prizesCalculated: boolean;
  
  //TODO: change event attribute name do finalScore
  score?: Score;
  bets?: Bet[];
  commission?: number;
  owner?: string;
}
