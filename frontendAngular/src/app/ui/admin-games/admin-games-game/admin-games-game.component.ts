import { Component, Input, OnInit } from '@angular/core';
import { GameService } from 'src/app/contracts';
import { GameEvent } from 'src/app/model';
import { MessageService } from 'src/app/services';

@Component({
  selector: 'dapp-admin-games-game',
  templateUrl: './admin-games-game.component.html',
  styleUrls: ['./admin-games-game.component.css'],
})
export class AdminGamesGameComponent implements OnInit {
  @Input()
  gameService!: GameService;

  homeTeam!: string;
  visitorTeam!: string;
  datetimeGame!: Date;
  open!: boolean;
  finalized!: boolean;

  constructor(private _messageService: MessageService) {}

  ngOnInit(): void {
    //Call for game data
    this.gameService.homeTeam().subscribe((_homeTeam) => {
      this.homeTeam = _homeTeam;
    });
    this.gameService.visitorTeam().subscribe((_visitorTeam) => {
      this.visitorTeam = _visitorTeam;
    });
    this.gameService.datetimeGame().subscribe((_datetimeGame) => {
      this.datetimeGame = new Date(_datetimeGame * 1000);
    });
    this.gameService.open().subscribe((_open) => {
      this.open = _open;
    });
    this.gameService.finalized().subscribe((_finalized) => {
      this.finalized = _finalized;
    });
    //events listeners
    this.gameService.addEventListener(
      GameService.EVENTS.GAME_OPENED,
      'admin-games-game',
      (g: GameEvent) => {
        if (this.gameService.address == g.addressGame) {
          this.open = true;
        } else {
          alert(
            `Falha na captura do evento. GameService.address '${this.gameService.address}' x  event.addressGame '${g.addressGame}'`
          );
        }
      }
    );
    this.gameService.addEventListener(
      GameService.EVENTS.GAME_CLOSED,
      'admin-games-game',
      (g: GameEvent) => {
        if (this.gameService.address == g.addressGame) {
          this.open = false;
        } else {
          alert(
            `Falha na captura do evento. GameService.address '${this.gameService.address}' x  event.addressGame '${g.addressGame}'`
          );
        }
      }
    );
  }

  openForBetting() {
    this.gameService.openForBetting().subscribe(() => {
      this._messageService.show(`Transaction sent successfully`);
    });
  }

  closeForBetting() {
    this.gameService.closeForBetting().subscribe(() => {
      this._messageService.show(`Transaction sent successfully`);
    });
  }
}
