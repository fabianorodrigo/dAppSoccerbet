import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Score } from 'src/app/model';
import { MessageService, Web3Service } from 'src/app/services';
import { BetDialogComponent } from '../bet-dialog/bet-dialog.component';
import { ScoreDialogComponent } from '../score-dialog/score-dialog.component';
import { GameCompound } from '../game-compound.class';
import { BuyDialogComponent } from '../../bettoken/buy-dialog/buy-dialog.component';
import { BetTokenService } from 'src/app/contracts';
import BN from 'bn.js';

@Component({
  selector: 'dapp-games-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit {
  @Input()
  gameCompound!: GameCompound;
  @Input()
  isAdmin: boolean = false;

  userAccountAddress: string | null = null;

  homeTeam!: string;
  visitorTeam!: string;
  datetimeGame!: Date;
  open!: boolean;
  finalized!: boolean;
  finalScore!: Score | undefined;

  constructor(
    private _web3Service: Web3Service,
    private _betTokenService: BetTokenService,
    private _messageService: MessageService,
    private _dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.homeTeam = this.gameCompound.game.homeTeam;
    this.visitorTeam = this.gameCompound.game.visitorTeam;
    this.datetimeGame = new Date(this.gameCompound.game.datetimeGame * 1000);
    this.open = this.gameCompound.game.open;
    this.finalized = this.gameCompound.game.finalized;

    this.finalScore = this.gameCompound.game.finalScore;

    // Subscribing for account address changes in the provider
    this._web3Service.getUserAccountAddressSubject().subscribe((address) => {
      this.userAccountAddress = address;
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
    const dialogRef = this._dialog.open(ScoreDialogComponent, {
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

  approve(event: MouseEvent) {
    if (!this.userAccountAddress) return;
    this._betTokenService
      .balanceOf(this.userAccountAddress)
      .subscribe((_balance) => {
        const dialogRef = this._dialog.open(BuyDialogComponent, {
          data: {
            title: `Approve BetTokens for: ${this.homeTeam} x ${this.visitorTeam}`,
            maxAmmount: _balance,
          },
        });

        dialogRef.afterClosed().subscribe((_allowanceData) => {
          if (_allowanceData) {
            if (_allowanceData.value != null && this.userAccountAddress) {
              this._betTokenService
                .approve(
                  this.userAccountAddress,
                  this.gameCompound.game.addressGame as string,
                  new BN(_allowanceData.value)
                )
                .subscribe((_result) => {
                  console.log(_result);
                  this._messageService.show(_result.message);
                });
            } else {
              this._messageService.show(`Quantity of BetTokens is not valid`);
            }
          }
          console.log(`Dialog result`, _allowanceData);
        });
      });
  }

  bet() {
    const dialogRef = this._dialog.open(BetDialogComponent, {
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
