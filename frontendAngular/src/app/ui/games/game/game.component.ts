import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Bet, BetResult, BetTokenApproval, GameBetEvent, GameEvent, Score } from 'src/app/model';
import { MessageService, NumbersService, Web3Service } from 'src/app/services';
import { BetDialogComponent } from '../bet-dialog/bet-dialog.component';
import { ScoreDialogComponent } from '../score-dialog/score-dialog.component';
import { GameCompound } from '../game-compound.class';
import { BuyDialogComponent } from '../../bettoken/buy-dialog/buy-dialog.component';
import { BetTokenService, GameService } from 'src/app/contracts';
import BN from 'bn.js';
import { GameBetsDialogComponent } from '../game-bets-dialog/game-bets-dialog.component';
import { GameWinnersDialogComponent } from '../game-winners-dialog/game-winners-dialog.component';
import { GameInfoDialogComponent } from '../game-info-dialog/game-info-dialog.component';

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
  winnersIdentified!: boolean;
  prizesCalculated!: boolean;

  formatedRemainingAllowance!: string | null;

  constructor(
    private _changeDetectorRefs: ChangeDetectorRef,
    private _web3Service: Web3Service,
    private _betTokenService: BetTokenService,
    private _messageService: MessageService,
    private _numberService: NumbersService,
    private _dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    this.homeTeam = this.gameCompound.game.homeTeam;
    this.visitorTeam = this.gameCompound.game.visitorTeam;
    this.datetimeGame = new Date(this._numberService.convertTimeChainToJS(this.gameCompound.game.datetimeGame));
    this.open = this.gameCompound.game.open;
    this.finalized = this.gameCompound.game.finalized;
    this.finalScore = this.gameCompound.game.finalScore;
    this.winnersIdentified = this.gameCompound.game.winnersIdentified;
    this.prizesCalculated = this.gameCompound.game.prizesCalculated;

    // Subscribing for account address changes in the provider
    this._web3Service.getUserAccountAddressSubject().subscribe((address) => {
      this.userAccountAddress = address;
    });

    //events monitoring
    try {
      //bettoken approve for game contract
      (
        await this._betTokenService.getEventBehaviorSubject(BetTokenService.EVENTS.APPROVAL, {
          owner: this.userAccountAddress,
          spender: this.gameCompound.game.addressGame,
        })
      ).subscribe((evt) => {
        if (evt == null) return;
        const eventData: BetTokenApproval = evt;
        this.formatedRemainingAllowance = this._numberService.formatBNShortScale(eventData.value);
      });

      //bet on game
      (
        await this.gameCompound.gameService.getEventBehaviorSubject(GameService.EVENTS.BET_ON_GAME, {
          addressBettor: this.userAccountAddress,
        })
      ).subscribe((evt) => {
        if (evt == null) return;
        const eventData: GameBetEvent = evt;
        this.showAllowance();
      });

      //winner identified
      (
        await this.gameCompound.gameService.getEventBehaviorSubject(GameService.EVENTS.GAME_WINNERS_IDENTIFIED)
      ).subscribe((evt) => {
        if (evt == null) return;
        const eventData: GameEvent = evt;
        this.gameCompound.game.winnersIdentified = true;
        this.winnersIdentified = true;
        this._messageService.show(
          `Winner bets identification confirmed for: ${eventData.homeTeam} x  ${eventData.visitorTeam}`
        );
      });
      // prizes calculated
      (
        await this.gameCompound.gameService.getEventBehaviorSubject(GameService.EVENTS.GAME_PRIZES_CALCULATED)
      ).subscribe((evt) => {
        if (evt == null) return;
        const eventData: GameEvent = evt;
        this.gameCompound.game.prizesCalculated = true;
        this.prizesCalculated = true;
        this._messageService.show(
          `Prizes calculation confirmed for: ${eventData.homeTeam} x  ${eventData.visitorTeam}`
        );
      });
    } catch (e: any) {
      console.log('deu ruim');
      this._messageService.show(e.message);
    }
  }

  openForBetting() {
    this.gameCompound.gameService.openForBetting().subscribe((transactionResult) => {
      this._messageService.show(transactionResult.result);
    });
  }

  closeForBetting() {
    this.gameCompound.gameService.closeForBetting().subscribe((transactionResult) => {
      this._messageService.show(transactionResult.result);
    });
  }

  finalizeGame() {
    if (!this.userAccountAddress || !this.gameCompound?.game?.addressGame) {
      return;
    }
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
          this.gameCompound.gameService.finalizeGame(score).subscribe((transactionResult) => {
            this._messageService.show(transactionResult.result);
          });
        } else {
          this._messageService.show(`Score is not valid`);
        }
      }
    });
  }

  identifyWinners() {
    this.gameCompound.gameService.identifyWinners().subscribe((transactionResult) => {
      this._messageService.show(transactionResult.result);
    });
  }

  calcPrizes() {
    this.gameCompound.gameService.calcPrizes().subscribe((transactionResult) => {
      this._messageService.show(transactionResult.result);
    });
  }

  approve(event: MouseEvent) {
    if (!this.userAccountAddress) return;
    this._betTokenService.balanceOf(this.userAccountAddress).subscribe((_balance) => {
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
                this._messageService.show(_result.result);
              });
          } else {
            this._messageService.show(`Quantity of BetTokens is not valid`);
          }
        }
      });
    });
  }

  bet() {
    if (!this.userAccountAddress || !this.gameCompound?.game?.addressGame) {
      return;
    }
    this._betTokenService
      .allowance(this.userAccountAddress, this.gameCompound.game.addressGame)
      .subscribe((_allowance) => {
        if (!_allowance || _allowance.eq(new BN(0))) {
          this._messageService.show(`There is no BetTokens approved to be spent on this game`);
        } else {
          const dialogRef = this._dialog.open(BetDialogComponent, {
            data: {
              title: `Place your Bet`,
              homeTeam: this.homeTeam,
              visitorTeam: this.visitorTeam,
              allowance: _allowance,
            },
          });

          dialogRef.afterClosed().subscribe((_bet) => {
            if (_bet) {
              if (_bet.home != null && _bet.visitor != null && _bet.value != null) {
                this.gameCompound.gameService
                  .bet({ home: _bet.home, visitor: _bet.visitor }, _bet.value)
                  .subscribe((transactionResult) => {
                    this._messageService.show(transactionResult.result);
                  });
              } else {
                this._messageService.show(`Bet is not valid`);
              }
            }
          });
        }
      });
  }

  hideAllowance() {
    this.formatedRemainingAllowance = null;
  }
  showAllowance() {
    if (!this.userAccountAddress) return;
    this._betTokenService
      .allowance(this.userAccountAddress, this.gameCompound.game.addressGame as string)
      .subscribe((_remainingAllowance) => {
        this.formatedRemainingAllowance = this._numberService.formatBNShortScale(_remainingAllowance);
        this._changeDetectorRefs.detectChanges();
      });
  }

  listBets() {
    this.gameCompound.gameService.listBets().subscribe((_result) => {
      if (!_result.success) {
        this._messageService.show(_result.result as string);
      } else {
        this._dialog.open(GameBetsDialogComponent, {
          data: {
            gameCompound: this.gameCompound,
            homeTeam: this.homeTeam,
            visitorTeam: this.visitorTeam,
            bets: _result.result,
          },
          minWidth: 900,
        });
      }
    });
  }

  listWinners() {
    this.gameCompound.gameService.listBets().subscribe((_result) => {
      if (!_result.success) {
        this._messageService.show(_result.result as string);
      } else {
        const _winnerResuts = [BetResult.WINNER, BetResult.TIED, BetResult.PAID];
        const _winners = (_result.result as Bet[]).filter((b) => _winnerResuts.includes(b.result as BetResult));
        if (_winners.length > 0) {
          this._dialog.open(GameWinnersDialogComponent, {
            data: {
              gameCompound: this.gameCompound,
              winnerBets: _winners,
            },
            minWidth: 900,
          });
        } else {
          this._messageService.show(`No winners on this game`);
        }
      }
    });
  }

  /**
   * Open dialog with additional info about the game
   */
  showInfo() {
    this._dialog.open(GameInfoDialogComponent, {
      data: {
        gameCompound: this.gameCompound,
      },
    });
  }
}
