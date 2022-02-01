import { GameEvent } from '../../../model/events/game-event.interface';
import { Component, OnInit } from '@angular/core';
import { catchError, finalize, of } from 'rxjs';
import { GameFactoryService, GameService } from 'src/app/contracts';
import { Game } from 'src/app/model/game.interface';
import { MessageService, Web3Service } from './../../../services';

@Component({
  selector: 'dapp-admin-games-home',
  templateUrl: './admin-games-home.component.html',
  styleUrls: ['./admin-games-home.component.css'],
})
export class AdminGamesHomeComponent implements OnInit {
  constructor(
    private _webService: Web3Service,
    private _gameFactory: GameFactoryService,
    private _messageService: MessageService
  ) {}

  editing: boolean = false;
  processing: boolean = false;
  games: GameService[] = [];

  ngOnInit(): void {
    this._gameFactory.addEventListener(
      GameFactoryService.EVENTS.GAME_CREATED,
      'adminGamesHome',
      (eventData: GameEvent) => {
        alert(eventData.addressGame);
      }
    );
    //recover the list of games and for each one instanciate a GameService
    this._gameFactory.listGames().subscribe((_gamesAddresses: string[]) => {
      for (let _gameAddress of _gamesAddresses) {
        this.games.push(new GameService(this._webService, _gameAddress));
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
}
