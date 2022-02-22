import { GameCompound } from './../game-compound.class';
import { Component, OnInit } from '@angular/core';
import { GameFactoryService, GameService } from 'src/app/contracts';
import { Game } from 'src/app/model/game.interface';
import { GameEvent } from '../../../model/events/game-event.interface';
import { MessageService, Web3Service } from '../../../services';
import { GameFinalizedEvent } from 'src/app/model';
import { Router } from '@angular/router';

@Component({
  selector: 'dapp-games-home',
  templateUrl: './games-home.component.html',
  styleUrls: ['./games-home.component.css'],
})
export class GamesHomeComponent implements OnInit {
  constructor(
    private _messageService: MessageService,
    private _webService: Web3Service,
    private _gameFactory: GameFactoryService,
    private _router: Router
  ) {}

  editing: boolean = false;
  processing: boolean = false;
  gamesOpen: GameCompound[] = [];
  gamesClosed: GameCompound[] = [];
  gamesFinalized: GameCompound[] = [];
  isAdmin: boolean = false;

  async ngOnInit(): Promise<void> {
    this._gameFactory.isAdmin().subscribe((is) => {
      //It is admin if the user is the owner of GameFactory contract and the route starts with '/admin'
      this.isAdmin = is && this._router.url.startsWith('/admin');
    });

    try {
      (await this._gameFactory.getEventBehaviorSubject(GameFactoryService.EVENTS.GAME_CREATED)).subscribe((evt) => {
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
            new GameService(this._messageService, this._webService, eventData.addressGame)
          )
        );
      });
    } catch (e: any) {
      this._messageService.show(e.message);
    }

    //recover the list of games and for each one instanciate a GameService
    let _gamesDTO = await this._gameFactory.listGamesDTO();
    if (_gamesDTO) {
      for (let _game of _gamesDTO) {
        //decices the targetArray of games: opened, closed or finalized
        const targetArray = _game.finalized ? this.gamesFinalized : _game.open ? this.gamesOpen : this.gamesClosed;
        const gameService = new GameService(this._messageService, this._webService, _game.addressGame as string);
        this.addListeners(gameService);
        // destructing spread on _game because it's variable come readonly from web3 and when the UI receive
        // OPENEDGAME and CLOSEDGAME events, it's necessary update
        targetArray.push(new GameCompound({ ..._game }, gameService));
      }
      //sort the 3 state-based arrays by datetime
      this.gamesOpen.sort((a, b) => (a.game.datetimeGame > b.game.datetimeGame ? 1 : -1));
      this.gamesClosed.sort((a, b) => (a.game.datetimeGame > b.game.datetimeGame ? 1 : -1));
      this.gamesFinalized.sort((a, b) => (a.game.datetimeGame > b.game.datetimeGame ? 1 : -1));
    } else {
      console.warn(`gameFactory.listGamesDTO has no return`);
    }
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
  private async addListeners(_gameService: GameService): Promise<void> {
    try {
      (await _gameService.getEventBehaviorSubject(GameService.EVENTS.GAME_OPENED)).subscribe(
        this.handleOpenedEvent.bind(this)
      );

      (await _gameService.getEventBehaviorSubject(GameService.EVENTS.GAME_CLOSED)).subscribe(
        this.handleClosedEvent.bind(this)
      );

      (await _gameService.getEventBehaviorSubject(GameService.EVENTS.GAME_FINALIZED)).subscribe(
        this.handleFinalizedEvent.bind(this)
      );
    } catch (e: any) {
      this._messageService.show(e.message);
    }
  }

  private handleOpenedEvent(evt: any): void {
    if (evt == null) return;
    const eventData: GameEvent = evt;
    const index = this.gamesClosed.findIndex((g) => g.game.addressGame == eventData.addressGame);
    //add the GameCompound of the array of OPEN GAMES and remove it from array of CLOSED GAMES
    if (index > -1) {
      this.gamesClosed[index].game.open = true;
      this.gamesOpen.push(this.gamesClosed[index]);
      this.gamesClosed.splice(index, 1);
    }
  }

  private handleClosedEvent(evt: any): void {
    if (evt == null) return;
    const eventData: GameEvent = evt;
    const index = this.gamesOpen.findIndex((g) => g.game.addressGame == eventData.addressGame);
    //add the GameCompound of the array of CLOSED GAMES and remove it from array of OPENED GAMES
    if (index > -1) {
      this.gamesOpen[index].game.open = false;
      this.gamesClosed.push(this.gamesOpen[index]);
      this.gamesOpen.splice(index, 1);
    }
  }

  private handleFinalizedEvent(evt: any): void {
    if (evt == null) return;
    const eventData: GameFinalizedEvent = evt;
    const index = this.gamesClosed.findIndex((g) => g.game.addressGame == eventData.addressGame);
    if (index > -1) {
      this.gamesClosed[index].game.finalized = true;
      this.gamesFinalized.push(this.gamesClosed[index]);
      this.gamesClosed.splice(index, 1);
    }
  }

  private handleError(e: Error): void {
    this._messageService.show(e.message);
  }
}
