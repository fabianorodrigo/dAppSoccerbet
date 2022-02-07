import { GameCompound } from './../game-compound.class';
import { ScoreDialogComponent } from '../../components/score-dialog/score-dialog.component';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { GameService } from 'src/app/contracts';
import { GameEvent, GameFinalizedEvent, Score } from 'src/app/model';
import { MessageService } from 'src/app/services';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'dapp-games-game',
  templateUrl: './games-game.component.html',
  styleUrls: ['./games-game.component.css'],
})
export class GamesGameComponent implements OnInit {
  @Input()
  gameCompound!: GameCompound;

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
}
