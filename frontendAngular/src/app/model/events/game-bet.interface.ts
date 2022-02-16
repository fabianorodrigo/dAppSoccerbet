import { Score } from '..';

export interface GameBetEvent {
  addressGame: string;
  addressBettor: string;
  homeTeam: string;
  visitorTeam: string;
  datetimeGame: number;
  score: Score;
}
