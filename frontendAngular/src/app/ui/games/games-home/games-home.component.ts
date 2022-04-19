import { GameCompound } from './../game-compound.class';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { GameFactoryService, GameService } from 'src/app/contracts';
import { Game } from 'src/app/model/game.interface';
import { GameEvent } from '../../../model/events/game-event.interface';
import { MessageService, Web3Service } from '../../../services';
import { GameFinalizedEvent, Score, Web3Event, Web3Subscription } from 'src/app/model';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

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
    private _router: Router,
    private _changeDetectorRefs: ChangeDetectorRef
  ) {}

  //reference to the subscription of events GameCreated
  private web3GameCreatedSubscription!: Web3Subscription;

  editing: boolean = false;
  processing: boolean = false;
  gamesOpen: GameCompound[] = [];
  gamesClosed: GameCompound[] = [];
  gamesFinalized: GameCompound[] = [];
  isAdmin: boolean = false;
  fromBlock!: number;

  loading: boolean = false;

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this._gameFactory.isAdmin().subscribe((is) => {
      //It is admin if the user is the owner of GameFactory contract and the route starts with '/admin'
      this.isAdmin = is && this._router.url.startsWith('/admin');
    });
    const currentBlock = await this._webService.getCurrentBlockNumber();
    this.loadMore(currentBlock);
    this._subscribeGameCreated();
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

  /**
   * Search for past events GameCreated starting at {_currentBlock - numberOfBlocksInHistoricSearches}
   * until block {_currentBlock}
   *
   * @param _toBlock Last block of search
   */
  async loadMore(_toBlock: number) {
    if (_toBlock < 0) return;
    this.fromBlock = _toBlock - environment.numberOfBlocksInHistoricSearches;
    if (this.fromBlock < 0) this.fromBlock = 0;
    const events = await this._gameFactory.getWeb3PastEventSubscription({
      eventName: GameFactoryService.EVENTS.GAME_CREATED,
      fromBlock: this.fromBlock,
      toBlock: _toBlock,
    });
    events.forEach(this._handleGameCreteadEvent.bind(this));
  }

  /**
   * Add function listeners to the Game events in order to handle the UI interface properly
   */
  private async addListeners(_gameService: GameService): Promise<void> {
    try {
      this.loading = true;
      // GameOpened
      (
        await _gameService.getWeb3EventSubscription({
          eventName: GameService.EVENTS.GAME_OPENED,
        })
      ).on(`data`, this._handleOpenedEvent.bind(this));
      // GameClosed
      (
        await _gameService.getWeb3EventSubscription({
          eventName: GameService.EVENTS.GAME_CLOSED,
        })
      ).on(`data`, this._handleClosedEvent.bind(this));
      // GameFinalized
      (
        await _gameService.getWeb3EventSubscription({
          eventName: GameService.EVENTS.GAME_FINALIZED,
        })
      ).on(`data`, this._handleFinalizedEvent.bind(this));
    } catch (e: any) {
      this._messageService.show(e.message);
    }
  }

  /**
   * Subscribe for future occurrence of event GameCreated, assign the subscription to {web3GameCreatedSubscription} property
   * and assign the function {_handleGameCreteadEvent} to the Emmiter on('data')
   *
   * If {web3GameCreatedSubscription} property is already assigned, unsubscribe it
   *
   * @param _fromBlock Initial block to filter events
   * @param _toBlock Final block to filter events (optional)
   */
  private async _subscribeGameCreated() {
    this.loading = true;
    if (this.web3GameCreatedSubscription) {
      this.web3GameCreatedSubscription.unsubscribe();
    }
    this.web3GameCreatedSubscription = await this._gameFactory.getWeb3EventSubscription({
      eventName: GameFactoryService.EVENTS.GAME_CREATED,
    });

    this.web3GameCreatedSubscription.on(`data`, this._handleGameCreteadEvent.bind(this));
  }

  /**
   * Handle the received events of new games created and
   * @param evt Event GameCreated
   */
  private _handleGameCreteadEvent(evt: Web3Event): void {
    if (evt == null) return;
    const eventData: GameEvent = evt.returnValues;
    const gameService = new GameService(this._messageService, this._webService, eventData.addressGame);
    this.addListeners(gameService);
    const gameData: Game = {
      addressGame: eventData.addressGame,
      homeTeam: eventData.homeTeam,
      visitorTeam: eventData.visitorTeam,
      datetimeGame: eventData.datetimeGame,
      commission: eventData.commission,
      owner: eventData.owner,
    } as Game;
    gameService.getDTO().subscribe((g: Game) => {
      gameData.open = g.open;
      gameData.finalized = g.finalized;
      gameData.winnersIdentified = g.winnersIdentified;
      gameData.prizesCalculated = g.prizesCalculated;
      gameData.finalScore = g.finalScore;
      const compound = new GameCompound(gameData, gameService);
      if (gameData.finalized) {
        this.gamesFinalized.push(compound);
      } else if (gameData.open) {
        this.gamesOpen.push(compound);
      } else {
        this.gamesClosed.push(compound);
      }
      this.loading = false;
    });
  }

  /**
   * Handle the received events of open a specific game contract
   * @param evt Event GameOpened
   */
  private _handleOpenedEvent(evt: Web3Event): void {
    if (evt == null) return;
    const eventData: GameEvent = evt.returnValues;
    const index = this.gamesClosed.findIndex((g) => g.game.addressGame == eventData.addressGame);
    //add the GameCompound of the array of OPEN GAMES and remove it from array of CLOSED GAMES
    if (index > -1) {
      this.gamesClosed[index].game.open = true;
      this.gamesOpen.push(this.gamesClosed[index]);
      this.gamesOpen.sort((a, b) => (a.game.datetimeGame > b.game.datetimeGame ? -1 : 1));
      this.gamesClosed.splice(index, 1);
      this._changeDetectorRefs.detectChanges();
    }
  }

  private _handleClosedEvent(evt: Web3Event): void {
    if (evt == null) return;
    const eventData: GameEvent = evt.returnValues;
    const index = this.gamesOpen.findIndex((g) => g.game.addressGame == eventData.addressGame);
    //add the GameCompound of the array of CLOSED GAMES and remove it from array of OPENED GAMES
    if (index > -1) {
      this.gamesOpen[index].game.open = false;
      this.gamesClosed.push(this.gamesOpen[index]);
      this.gamesClosed.sort((a, b) => (a.game.datetimeGame > b.game.datetimeGame ? 1 : -1));
      this.gamesOpen.splice(index, 1);
      this._changeDetectorRefs.detectChanges();
    }
  }

  private _handleFinalizedEvent(_evt: Web3Event): void {
    if (_evt == null) return;
    const evt = _evt.returnValues;
    const eventData: GameFinalizedEvent = {
      addressGame: evt.addressGame,
      homeTeam: evt.homeTeam,
      visitorTeam: evt.visitorTeam,
      datetimeGame: evt.datetimeGame,
      finalScore: { home: evt.finalScore.home, visitor: evt.finalScore.visitor },
    };
    const index = this.gamesClosed.findIndex((g) => g.game.addressGame == eventData.addressGame);
    if (index > -1) {
      this.gamesClosed[index].game.finalized = true;
      this.gamesClosed[index].game.finalScore = eventData.finalScore;
      this.gamesFinalized.push(this.gamesClosed[index]);
      this.gamesFinalized.sort((a, b) => (a.game.datetimeGame > b.game.datetimeGame ? -1 : 1));
      this.gamesClosed.splice(index, 1);
      this._messageService.show(`Game finalization confirmed for: ${eventData.homeTeam} x  ${eventData.visitorTeam}`);
    }
  }

  private handleError(e: Error): void {
    this._messageService.show(e.message);
  }
}
