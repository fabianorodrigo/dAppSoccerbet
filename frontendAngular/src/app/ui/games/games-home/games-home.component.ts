import { GameCompound } from './../game-compound.class';
import { Component, OnInit } from '@angular/core';
import { GameFactoryService, GameService } from 'src/app/contracts';
import { Game } from 'src/app/model/game.interface';
import { GameEvent } from '../../../model/events/game-event.interface';
import { MessageService, Web3Service } from '../../../services';
import { GameFinalizedEvent } from 'src/app/model';

@Component({
  selector: 'dapp-games-home',
  templateUrl: './games-home.component.html',
  styleUrls: ['./games-home.component.css'],
})
export class GamesHomeComponent implements OnInit {
  constructor(
    private _webService: Web3Service,
    private _gameFactory: GameFactoryService,
    private _messageService: MessageService
  ) {}

  editing: boolean = false;
  processing: boolean = false;
  gamesOpen: GameCompound[] = [];
  gamesClosed: GameCompound[] = [];
  gamesFinalized: GameCompound[] = [];

  ngOnInit(): void {
    this._gameFactory.addEventListener(
      GameFactoryService.EVENTS.GAME_CREATED,
      'gamesHome',
      (eventData: GameEvent) => {
        this.gamesClosed.push(
          new GameCompound(
            {
              addressGame: eventData.addressGame,
              homeTeam: eventData.homeTeam,
              visitorTeam: eventData.visitorTeam,
              datetimeGame: eventData.datetimeGame,
              //when created, the game is not open and is not finalized
              open: false,
              finalized: false,
            },
            new GameService(this._webService, eventData.addressGame)
          )
        );
      }
    );

    //recover the list of games and for each one instanciate a GameService
    this._gameFactory.listGamesDTO().subscribe((_gamesDTO: Game[]) => {
      for (let _game of _gamesDTO) {
        const targetArray = _game.finalized
          ? this.gamesFinalized
          : _game.open
          ? this.gamesOpen
          : this.gamesClosed;
        const gameService = new GameService(
          this._webService,
          _game.addressGame as string
        );
        this.addListeners(gameService);
        targetArray.push(new GameCompound(_game, gameService));
      }
    });
  }
  newGame(event: MouseEvent) {
    this.editing = true;
  }

  closeForm(_game: Game | null) {
    if (_game != null) {
      this.processing = true;
      this._gameFactory.newGame(_game).subscribe((success) => {
        this.processing = false;
        if (success) {
          this._messageService.show(`Transaction sent successfully`);
        } else {
          this._messageService.show(`The transaction wasn't sent`);
        }
      });
    }
    this.editing = false;
  }

  public executeSelectedChange = (event: any) => {
    console.log(event);
  };

  /**
   * Add function listeners to the Game events in order to handle the UI interface properly
   */
  private addListeners(_gameService: GameService): void {
    _gameService.addEventListener(
      GameService.EVENTS.GAME_OPENED,
      'gamesHome',
      (event: GameEvent) => {
        const index = this.gamesClosed.findIndex(
          (g) => g.game.addressGame == event.addressGame
        );
        console.log('executou games-home-listener opened', index);
        if (index > -1) {
          this.gamesOpen.push(this.gamesClosed[index]);
          this.gamesClosed.splice(index, 1);
        }
      }
    );
    _gameService.addEventListener(
      GameService.EVENTS.GAME_CLOSED,
      'gamesHome',
      (event: GameEvent) => {
        const index = this.gamesOpen.findIndex(
          (g) => g.game.addressGame == event.addressGame
        );
        console.log('executou games-home-listener closed', index);
        if (index > -1) {
          this.gamesClosed.push(this.gamesOpen[index]);
          this.gamesOpen.splice(index, 1);
        }
      }
    );
    _gameService.addEventListener(
      GameService.EVENTS.GAME_FINALIZED,
      'gamesHome',
      (event: GameFinalizedEvent) => {
        const index = this.gamesClosed.findIndex(
          (g) => g.game.addressGame == event.addressGame
        );
        if (index > -1) {
          this.gamesFinalized.push(this.gamesClosed[index]);
          this.gamesClosed.splice(index, 1);
        }
      }
    );
  }
}
