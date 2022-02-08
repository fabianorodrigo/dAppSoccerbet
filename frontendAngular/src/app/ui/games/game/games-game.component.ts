import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Score } from 'src/app/model';
import { MessageService } from 'src/app/services';
import { BetDialogComponent } from '../bet-dialog/bet-dialog.component';
import { ScoreDialogComponent } from '../score-dialog/score-dialog.component';
import { GameCompound } from './../game-compound.class';

@Component({
  selector: 'dapp-games-game',
  templateUrl: './games-game.component.html',
  styleUrls: ['./games-game.component.css'],
})
export class GamesGameComponent implements OnInit {
  @Input()
  gameCompound!: GameCompound;
  isAdmin: boolean = false;

  homeTeam!: string;
  visitorTeam!: string;
  datetimeGame!: Date;
  open!: boolean;
  finalized!: boolean;
  finalScore!: Score | undefined;

  constructor(
    private _messageService: MessageService,
    private dialog: MatDialog,
    private _changeDetectorRefs: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.homeTeam = this.gameCompound.game.homeTeam;
    this.visitorTeam = this.gameCompound.game.visitorTeam;
    this.datetimeGame = new Date(this.gameCompound.game.datetimeGame * 1000);
    this.open = this.gameCompound.game.open;
    this.finalized = this.gameCompound.game.finalized;

    this.finalScore = this.gameCompound.game.finalScore;

    this.gameCompound.gameService.isAdmin().subscribe((is) => {
      console.log('subscriber do isAdmin', is);
      this.isAdmin = is;
    });
  }

  openForBetting() {
    this.gameCompound.gameService
      .openForBetting()
      .subscribe((transactionResult) => {
        this._messageService.show(transactionResult.message);
      });
  }

  closeForBetting() {
    this.gameCompound.gameService
      .closeForBetting()
      .subscribe((transactionResult) => {
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
          this.gameCompound.gameService
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

  bet() {
    const dialogRef = this.dialog.open(BetDialogComponent, {
      data: {
        title: `Place your Bet`,
        homeTeam: this.homeTeam,
        visitorTeam: this.visitorTeam,
      },
    });

    dialogRef.afterClosed().subscribe((_bet) => {
      if (_bet) {
        if (_bet.home != null && _bet.visitor != null && _bet.value != null) {
          this.gameCompound.gameService
            .bet({ home: _bet.home, visitor: _bet.visitor }, _bet.value)
            .subscribe((transactionResult) => {
              this._messageService.show(transactionResult.message);
            });
        } else {
          this._messageService.show(`Bet is not valid`);
        }
      }
      console.log(`Dialog result`, _bet);
    });
  }
}
