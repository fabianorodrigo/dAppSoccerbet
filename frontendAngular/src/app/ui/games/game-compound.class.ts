import { GameEvent } from './../../model/events/game-event.interface';
import { GameService } from 'src/app/contracts';
import { Game } from 'src/app/model';

/**
 * a composition with da Game's data and the service to interact with it's contract
 */
export class GameCompound {
  game: Game;
  gameService: GameService;

  constructor(_game: Game, _gameService: GameService) {
    this.game = _game;
    this.gameService = _gameService;
  }
}
