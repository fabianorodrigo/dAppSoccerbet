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
  isAdmin: boolean = false;

  ngOnInit(): void {
    this._gameFactory.isAdmin().subscribe((is) => {
      this.isAdmin = is;
    });

    this._gameFactory
      .getEventBehaviorSubject(GameFactoryService.EVENTS.GAME_CREATED)
      .subscribe((evt) => {
        if (evt == null) return;
        const eventData: GameEvent = evt;
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
      });

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
        // destructing spread on _game because it's variable come readonly from web3 and when the UI receive
        // OPENEDGAME and CLOSEDGAME events, it's necessary update
        targetArray.push(new GameCompound({ ..._game }, gameService));
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
    _gameService
      .getEventBehaviorSubject(GameService.EVENTS.GAME_OPENED)
      .subscribe((evt) => {
        if (evt == null) return;
        const eventData: GameEvent = evt;
        const index = this.gamesClosed.findIndex(
          (g) => g.game.addressGame == eventData.addressGame
        );
        //add the GameCompound of the array of OPEN GAMES and remove it from array of CLOSED GAMES
        if (index > -1) {
          this.gamesClosed[index].game.open = true;
          this.gamesOpen.push(this.gamesClosed[index]);
          this.gamesClosed.splice(index, 1);
        }
      });

    _gameService
      .getEventBehaviorSubject(GameService.EVENTS.GAME_CLOSED)
      .subscribe((evt) => {
        if (evt == null) return;
        const eventData: GameEvent = evt;
        const index = this.gamesOpen.findIndex(
          (g) => g.game.addressGame == eventData.addressGame
        );
        //add the GameCompound of the array of CLOSED GAMES and remove it from array of OPENED GAMES
        if (index > -1) {
          this.gamesOpen[index].game.open = false;
          this.gamesClosed.push(this.gamesOpen[index]);
          this.gamesOpen.splice(index, 1);
        }
      });

    _gameService
      .getEventBehaviorSubject(GameService.EVENTS.GAME_FINALIZED)
      .subscribe((evt) => {
        if (evt == null) return;
        const eventData: GameFinalizedEvent = evt;
        const index = this.gamesClosed.findIndex(
          (g) => g.game.addressGame == eventData.addressGame
        );
        if (index > -1) {
          this.gamesClosed[index].game.finalized = true;
          this.gamesFinalized.push(this.gamesClosed[index]);
          this.gamesClosed.splice(index, 1);
        }
      });
  }
}
