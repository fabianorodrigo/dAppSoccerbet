import { ScoreDialogComponent } from './../../components/score-dialog/score-dialog.component';
import { Component, Input, OnInit } from '@angular/core';
import { GameService } from 'src/app/contracts';
import { GameEvent, GameFinalizedEvent, Score } from 'src/app/model';
import { MessageService } from 'src/app/services';
import { MatDialog } from '@angular/material/dialog';

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
  finalScore!: Score;

  constructor(
    private _messageService: MessageService,
    private dialog: MatDialog
  ) {}

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
      if (this.finalized) {
        this.gameService.finalScore().subscribe((_finalScore) => {
          this.finalScore = _finalScore;
        });
      }
    });
    //events listeners
    this.gameService.addEventListener(
      GameService.EVENTS.GAME_OPENED,
      'admin-games-game',
      (g: GameEvent) => {
        if (this.gameService.address == g.addressGame) {
          this.open = true;
        } else {
          this._messageService.show(
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
          this._messageService.show(
            `Falha na captura do evento. GameService.address '${this.gameService.address}' x  event.addressGame '${g.addressGame}'`
          );
        }
      }
    );
    this.gameService.addEventListener(
      GameService.EVENTS.GAME_FINALIZED,
      'admin-games-game',
      (g: GameFinalizedEvent) => {
        if (this.gameService.address == g.addressGame) {
          this.finalized = true;
          this.finalScore = g.score;
        } else {
          this._messageService.show(
            `Falha na captura do evento. GameService.address '${this.gameService.address}' x  event.addressGame '${g.addressGame}'`
          );
        }
      }
    );
  }

  openForBetting() {
    this.gameService.openForBetting().subscribe((transactionResult) => {
      this._messageService.show(transactionResult.message);
    });
  }

  closeForBetting() {
    this.gameService.closeForBetting().subscribe((transactionResult) => {
      this._messageService.show(transactionResult.message);
    });
  }

  finalizeGame() {
    const dialogRef = this.dialog.open(ScoreDialogComponent, {
      data: {
        title: `Game's Final Score`,
        homeTeam: this.homeTeam,
        visitorTeam: this.visitorTeam,
      },
    });

    dialogRef.afterClosed().subscribe((score) => {
      if (score) {
        if (score.home != null && score.visitor != null) {
          this.gameService
            .finalizeGame(score)
            .subscribe((transactionResult) => {
              this._messageService.show(transactionResult.message);
            });
        } else {
          this._messageService.show(`Score is not valid`);
        }
      }
      console.log(`Dialog result`, score);
    });
  }
}
