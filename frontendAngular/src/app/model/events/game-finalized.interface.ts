import { Score } from '../score.interface';

export interface GameFinalizedEvent {
  addressGame: string;
  homeTeam: string;
  visitorTeam: string;
  datetimeGame: number;
  finalScore: Score;
}
